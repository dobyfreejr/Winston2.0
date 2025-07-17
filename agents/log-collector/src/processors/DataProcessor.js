const logger = require('../utils/logger');

class DataProcessor {
  constructor() {
    this.enrichmentRules = new Map();
    this.initializeEnrichmentRules();
  }

  initializeEnrichmentRules() {
    // Define enrichment rules for different data types
    this.enrichmentRules.set('network_connection', this.enrichNetworkConnection.bind(this));
    this.enrichmentRules.set('security_failed_login', this.enrichSecurityEvent.bind(this));
    this.enrichmentRules.set('log_entry', this.enrichLogEntry.bind(this));
  }

  async process(data) {
    try {
      // Add common fields
      const processedData = {
        ...data,
        agent_id: process.env.SOC_AGENT_ID || 'unknown',
        hostname: require('os').hostname(),
        processed_at: new Date().toISOString()
      };

      // Apply type-specific enrichment
      const enrichmentRule = this.enrichmentRules.get(data.type);
      if (enrichmentRule) {
        return await enrichmentRule(processedData);
      }

      return processedData;
    } catch (error) {
      logger.error('Error processing data:', error);
      return data; // Return original data if processing fails
    }
  }

  async enrichNetworkConnection(data) {
    // Enrich network connection data
    const enriched = { ...data };

    // Classify connection type
    if (data.remote_address) {
      enriched.connection_type = this.classifyConnection(data.remote_address);
      enriched.is_internal = this.isInternalIP(data.remote_address);
    }

    // Classify port
    if (data.remote_port) {
      enriched.port_classification = this.classifyPort(data.remote_port);
    }

    // Add risk score
    enriched.risk_score = this.calculateNetworkRiskScore(data);

    return enriched;
  }

  async enrichSecurityEvent(data) {
    // Enrich security events
    const enriched = { ...data };

    // Add geolocation for IP addresses (mock implementation)
    if (data.source_ip) {
      enriched.geolocation = await this.getIPGeolocation(data.source_ip);
    }

    // Add threat intelligence (mock implementation)
    if (data.source_ip) {
      enriched.threat_intel = await this.getThreatIntelligence(data.source_ip);
    }

    return enriched;
  }

  async enrichLogEntry(data) {
    // Enrich log entries
    const enriched = { ...data };

    // Extract IP addresses from log messages
    const ipAddresses = this.extractIPAddresses(data.message || data.raw_line);
    if (ipAddresses.length > 0) {
      enriched.extracted_ips = ipAddresses;
    }

    // Extract URLs
    const urls = this.extractURLs(data.message || data.raw_line);
    if (urls.length > 0) {
      enriched.extracted_urls = urls;
    }

    // Classify log severity if not already set
    if (!data.severity) {
      enriched.severity = this.classifyLogSeverity(data.message || data.raw_line);
    }

    return enriched;
  }

  classifyConnection(remoteAddress) {
    if (this.isInternalIP(remoteAddress)) {
      return 'internal';
    } else if (this.isCloudProvider(remoteAddress)) {
      return 'cloud';
    } else {
      return 'external';
    }
  }

  isInternalIP(ip) {
    // Check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ];

    return privateRanges.some(range => range.test(ip));
  }

  isCloudProvider(ip) {
    // Simplified cloud provider detection
    // In production, you'd use actual IP ranges from cloud providers
    const cloudRanges = [
      /^52\./, // AWS
      /^54\./, // AWS
      /^13\./, // Azure
      /^40\./, // Azure
      /^35\./, // GCP
      /^34\./, // GCP
    ];

    return cloudRanges.some(range => range.test(ip));
  }

  classifyPort(port) {
    const commonPorts = {
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      993: 'IMAPS',
      995: 'POP3S',
      3389: 'RDP',
      5432: 'PostgreSQL',
      3306: 'MySQL',
      1433: 'MSSQL',
      6379: 'Redis'
    };

    return commonPorts[port] || 'Unknown';
  }

  calculateNetworkRiskScore(data) {
    let score = 0;

    // Base score for external connections
    if (data.remote_address && !this.isInternalIP(data.remote_address)) {
      score += 30;
    }

    // Higher score for suspicious ports
    const suspiciousPorts = [23, 135, 139, 445, 1433, 3389];
    if (suspiciousPorts.includes(data.remote_port)) {
      score += 40;
    }

    // Higher score for certain processes
    const suspiciousProcesses = ['nc', 'netcat', 'nmap', 'telnet'];
    if (data.process_name && suspiciousProcesses.some(proc => 
        data.process_name.toLowerCase().includes(proc))) {
      score += 50;
    }

    return Math.min(score, 100);
  }

  async getIPGeolocation(ip) {
    // Mock geolocation - in production, use a real service
    if (this.isInternalIP(ip)) {
      return { country: 'Internal', city: 'Local Network' };
    }

    // Simplified mock based on IP patterns
    if (ip.startsWith('185.')) {
      return { country: 'Russia', city: 'Moscow' };
    } else if (ip.startsWith('8.8.')) {
      return { country: 'United States', city: 'Mountain View' };
    }

    return { country: 'Unknown', city: 'Unknown' };
  }

  async getThreatIntelligence(ip) {
    // Mock threat intelligence - in production, query real threat intel APIs
    const knownBadIPs = ['185.220.101.42', '192.0.2.1'];
    
    if (knownBadIPs.includes(ip)) {
      return {
        is_malicious: true,
        threat_types: ['malware', 'c2'],
        confidence: 95,
        last_seen: new Date().toISOString()
      };
    }

    return {
      is_malicious: false,
      threat_types: [],
      confidence: 0,
      last_seen: null
    };
  }

  extractIPAddresses(text) {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    return text.match(ipRegex) || [];
  }

  extractURLs(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  classifyLogSeverity(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('error') || lowerMessage.includes('critical') || 
        lowerMessage.includes('emergency') || lowerMessage.includes('alert')) {
      return 'high';
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('notice')) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

module.exports = DataProcessor;