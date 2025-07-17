import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for network connections (replace with database in production)
let networkConnections: any[] = []
let networkAssets: any[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'connections'
  
  if (type === 'assets') {
    return NextResponse.json({
      success: true,
      data: networkAssets,
      count: networkAssets.length,
      timestamp: new Date().toISOString()
    })
  }
  
  return NextResponse.json({
    success: true,
    data: networkConnections,
    count: networkConnections.length,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type = 'connection', data } = body

    if (!data) {
      return NextResponse.json(
        { error: 'Missing data field' },
        { status: 400 }
      )
    }

    if (type === 'connection') {
      // Validate connection data
      const connection = {
        id: data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        sourceIp: data.sourceIp || data.source_ip,
        destIp: data.destIp || data.dest_ip || data.destination_ip,
        sourcePort: data.sourcePort || data.source_port || 0,
        destPort: data.destPort || data.dest_port || data.destination_port || 0,
        protocol: (data.protocol || 'TCP').toUpperCase(),
        status: data.status || 'active',
        bytes: data.bytes || 0,
        packets: data.packets || 0,
        timestamp: new Date(data.timestamp || Date.now()),
        country: data.country || 'Unknown',
        threatLevel: data.threatLevel || data.threat_level || 'low'
      }

      // Add to connections array
      networkConnections.unshift(connection)
      
      // Keep only last 1000 connections
      if (networkConnections.length > 1000) {
        networkConnections = networkConnections.slice(0, 1000)
      }

      return NextResponse.json({
        success: true,
        message: 'Connection added successfully',
        id: connection.id,
        timestamp: new Date().toISOString()
      })
    }

    if (type === 'asset') {
      // Validate asset data
      const asset = {
        id: data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ip: data.ip,
        hostname: data.hostname || data.ip,
        type: data.type || 'unknown',
        os: data.os || 'Unknown',
        status: data.status || 'online',
        lastSeen: new Date(data.lastSeen || data.last_seen || Date.now()),
        openPorts: data.openPorts || data.open_ports || [],
        vulnerabilities: data.vulnerabilities || 0
      }

      // Update existing asset or add new one
      const existingIndex = networkAssets.findIndex(a => a.ip === asset.ip)
      if (existingIndex !== -1) {
        networkAssets[existingIndex] = asset
      } else {
        networkAssets.unshift(asset)
      }
      
      // Keep only last 500 assets
      if (networkAssets.length > 500) {
        networkAssets = networkAssets.slice(0, 500)
      }

      return NextResponse.json({
        success: true,
        message: 'Asset added/updated successfully',
        id: asset.id,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "connection" or "asset"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Network API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'connections'
  
  if (type === 'assets') {
    networkAssets = []
    return NextResponse.json({
      success: true,
      message: 'All assets cleared',
      timestamp: new Date().toISOString()
    })
  }
  
  networkConnections = []
  return NextResponse.json({
    success: true,
    message: 'All connections cleared',
    timestamp: new Date().toISOString()
  })
}