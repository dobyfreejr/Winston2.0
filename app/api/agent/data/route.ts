import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, timestamp, data } = body

    if (!agent_id || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    logger.info('api', `Received ${data.length} records from agent ${agent_id}`)

    // Process each data record
    for (const record of data) {
      await processAgentData(record, agent_id)
    }

    return NextResponse.json({ 
      success: true, 
      processed: data.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('api', 'Error processing agent data', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processAgentData(record: any, agentId: string) {
  try {
    switch (record.type) {
      case 'network_connection':
        await processNetworkConnection(record, agentId)
        break
      
      case 'security_failed_login':
      case 'security_successful_login':
      case 'security_brute_force_detected':
        await processSecurityEvent(record, agentId)
        break
      
      case 'log_entry':
        await processLogEntry(record, agentId)
        break
      
      case 'system_cpu':
      case 'system_memory':
      case 'system_disk':
        await processSystemMetrics(record, agentId)
        break
      
      default:
        logger.debug('api', `Unknown data type: ${record.type}`)
    }
  } catch (error) {
    logger.error('api', `Error processing record type ${record.type}`, error)
  }
}

async function processNetworkConnection(record: any, agentId: string) {
  // Store network connection data
  const connection = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    sourceIp: record.local_address,
    destIp: record.remote_address,
    sourcePort: record.local_port,
    destPort: record.remote_port,
    protocol: record.protocol?.toUpperCase() || 'TCP',
    status: record.event_type === 'connection_established' ? 'active' : 'closed',
    bytes: 0, // Would be calculated from traffic data
    packets: 0,
    timestamp: new Date(record.timestamp),
    country: record.geolocation?.country || 'Unknown',
    threatLevel: record.risk_score > 70 ? 'high' : record.risk_score > 40 ? 'medium' : 'low',
    agentId
  }

  // Add to recent activity if it's a new connection
  if (record.event_type === 'connection_established') {
    db.addSearchHistory({
      indicator: record.remote_address || record.local_address,
      type: 'ip',
      timestamp: new Date(record.timestamp),
      results: { agent_data: record },
      threatLevel: connection.threatLevel as 'high' | 'medium' | 'low',
      status: 'analyzed'
    })

    // Create threat detection for high-risk connections
    if (connection.threatLevel === 'high') {
      db.addThreatDetection({
        indicator: record.remote_address,
        type: 'ip',
        severity: 'high',
        description: `High-risk network connection detected from agent ${agentId}`,
        timestamp: new Date(record.timestamp),
        source: `Agent: ${agentId}`,
        status: 'new'
      })
    }
  }

  logger.debug('api', `Processed network connection: ${record.local_address} -> ${record.remote_address}`)
}

async function processSecurityEvent(record: any, agentId: string) {
  // Create threat detection for security events
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  
  if (record.type === 'security_brute_force_detected') {
    severity = 'critical'
  } else if (record.type === 'security_failed_login' && record.attempt_count > 5) {
    severity = 'high'
  }

  db.addThreatDetection({
    indicator: record.source_ip || record.user || 'unknown',
    type: 'ip',
    severity,
    description: `Security event: ${record.type.replace('security_', '').replace('_', ' ')}`,
    timestamp: new Date(record.timestamp),
    source: `Agent: ${agentId}`,
    status: 'new'
  })

  // Add to search history for IP addresses
  if (record.source_ip) {
    db.addSearchHistory({
      indicator: record.source_ip,
      type: 'ip',
      timestamp: new Date(record.timestamp),
      results: { agent_data: record },
      threatLevel: severity === 'critical' || severity === 'high' ? 'high' : 'medium',
      status: 'analyzed'
    })
  }

  logger.info('security', `Security event processed: ${record.type} from ${record.source_ip}`)
}

async function processLogEntry(record: any, agentId: string) {
  // Process extracted IPs from logs
  if (record.extracted_ips && record.extracted_ips.length > 0) {
    for (const ip of record.extracted_ips) {
      // Skip internal IPs
      if (isInternalIP(ip)) continue

      db.addSearchHistory({
        indicator: ip,
        type: 'ip',
        timestamp: new Date(record.timestamp),
        results: { 
          log_source: record.source_file,
          log_message: record.message,
          agent_data: record 
        },
        threatLevel: record.severity === 'high' ? 'high' : 'low',
        status: 'analyzed'
      })
    }
  }

  // Create alerts for high-severity log entries
  if (record.severity === 'high') {
    db.addThreatDetection({
      indicator: record.extracted_ips?.[0] || 'log-event',
      type: 'ip',
      severity: 'medium',
      description: `High-severity log event: ${record.message?.substring(0, 100)}...`,
      timestamp: new Date(record.timestamp),
      source: `Agent: ${agentId} (${record.source_file})`,
      status: 'new'
    })
  }

  logger.debug('api', `Processed log entry from ${record.source_file}`)
}

async function processSystemMetrics(record: any, agentId: string) {
  // Store system metrics for monitoring
  // This could be expanded to detect anomalies in system performance
  
  if (record.type === 'system_cpu' && record.load_current > 90) {
    db.addThreatDetection({
      indicator: record.hostname || agentId,
      type: 'domain',
      severity: 'medium',
      description: `High CPU usage detected: ${record.load_current}%`,
      timestamp: new Date(record.timestamp),
      source: `Agent: ${agentId}`,
      status: 'new'
    })
  }

  if (record.type === 'system_memory' && (record.used / record.total) > 0.95) {
    db.addThreatDetection({
      indicator: record.hostname || agentId,
      type: 'domain',
      severity: 'medium',
      description: `High memory usage detected: ${Math.round((record.used / record.total) * 100)}%`,
      timestamp: new Date(record.timestamp),
      source: `Agent: ${agentId}`,
      status: 'new'
    })
  }

  logger.debug('api', `Processed system metrics: ${record.type}`)
}

function isInternalIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./
  ]

  return privateRanges.some(range => range.test(ip))
}