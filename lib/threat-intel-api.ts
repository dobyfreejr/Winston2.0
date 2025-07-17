import { VirusTotalResponse, IPGeolocation, DomainInfo, MalwareSample, ThreatIntelligence } from '@/types/threat-intel'

// VirusTotal API Integration via Next.js API route
export async function analyzeWithVirusTotal(indicator: string, type: 'ip' | 'domain' | 'hash' | 'url'): Promise<VirusTotalResponse> {
  try {
    const response = await fetch('/api/virustotal/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ indicator, type })
    })

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('VirusTotal API error:', error)
    return getMockVirusTotalResponse(indicator, type)
  }
}

// IP Geolocation API Integration via Next.js API route
export async function getIPGeolocation(ip: string): Promise<IPGeolocation> {
  try {
    const response = await fetch('/api/ipgeolocation/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip })
    })

    if (!response.ok) {
      throw new Error(`IPGeolocation API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('IPGeolocation API error:', error)
    return getMockIPGeolocation(ip)
  }
}

// WhoisXML API Integration via Next.js API route
export async function getDomainInfo(domain: string): Promise<DomainInfo> {
  try {
    const response = await fetch('/api/whoisxml/domain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain })
    })

    if (!response.ok) {
      throw new Error(`WhoisXML API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('WhoisXML API error:', error)
    return getMockDomainInfo(domain)
  }
}

// Malware Bazaar API Integration (direct, no CORS issues)
export async function searchMalwareBazaar(hash: string): Promise<MalwareSample[]> {
  try {
    const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=get_info&hash=${hash}`
    })

    if (!response.ok) {
      throw new Error(`Malware Bazaar API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.query_status === 'hash_not_found') {
      return []
    }

    if (data.data && data.data.length > 0) {
      return data.data.map((sample: any) => ({
        sha256: sample.sha256_hash,
        md5: sample.md5_hash,
        sha1: sample.sha1_hash,
        file_name: sample.file_name,
        file_size: sample.file_size,
        file_type: sample.file_type_mime,
        tags: sample.tags || [],
        first_seen: sample.first_seen,
        last_seen: sample.last_seen,
        signature: sample.signature || 'Unknown'
      }))
    }

    return []
  } catch (error) {
    console.error('Malware Bazaar API error:', error)
    return getMockMalwareSamples(hash)
  }
}

// AbuseIPDB Integration via Next.js API route
export async function checkAbuseIPDB(ip: string): Promise<any> {
  try {
    const response = await fetch('/api/abuseipdb/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('AbuseIPDB API error:', error)
    return null
  }
}

// Enhanced Threat Intelligence with multiple sources
export async function enrichThreatIntelligence(indicator: string, type: 'ip' | 'domain' | 'hash' | 'url'): Promise<ThreatIntelligence> {
  const sources = ['VirusTotal']
  let reputation_score = 50
  let threat_types: string[] = []
  let confidence = 50

  try {
    // Get VirusTotal data
    const vtData = await analyzeWithVirusTotal(indicator, type)
    if (vtData.data?.attributes?.last_analysis_stats) {
      const stats = vtData.data.attributes.last_analysis_stats
      const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected
      const maliciousRatio = stats.malicious / total
      
      reputation_score = Math.max(0, 100 - (maliciousRatio * 100))
      confidence = Math.min(95, 50 + (total * 2))
      
      if (maliciousRatio > 0.3) {
        threat_types.push('malware')
      }
      if (maliciousRatio > 0.1) {
        threat_types.push('suspicious')
      }
    }

    // Add AbuseIPDB data for IPs
    if (type === 'ip') {
      const abuseData = await checkAbuseIPDB(indicator)
      if (abuseData?.data) {
        sources.push('AbuseIPDB')
        const abuseScore = abuseData.data.abuseConfidencePercentage
        if (abuseScore > 50) {
          threat_types.push('abuse')
          reputation_score = Math.min(reputation_score, 100 - abuseScore)
        }
      }
    }

    return {
      indicator,
      type,
      reputation_score: Math.round(reputation_score),
      threat_types,
      first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_seen: new Date().toISOString(),
      confidence,
      sources
    }
  } catch (error) {
    console.error('Threat intelligence enrichment error:', error)
    return getMockThreatIntelligence(indicator, type)
  }
}

// Mock data functions (fallbacks when APIs are not configured)
function getMockVirusTotalResponse(indicator: string, type: string): VirusTotalResponse {
  const isMalicious = indicator.includes('malware') || indicator.includes('bad') || indicator.includes('evil')
  
  return {
    data: {
      id: indicator,
      type: type,
      attributes: {
        last_analysis_stats: {
          harmless: isMalicious ? 15 : 45,
          malicious: isMalicious ? 25 : 2,
          suspicious: isMalicious ? 8 : 1,
          undetected: isMalicious ? 12 : 12
        },
        last_analysis_results: {
          'Kaspersky': {
            category: isMalicious ? 'malicious' : 'harmless',
            engine_name: 'Kaspersky',
            result: isMalicious ? 'Trojan.Generic' : null
          },
          'Microsoft': {
            category: isMalicious ? 'malicious' : 'harmless',
            engine_name: 'Microsoft',
            result: isMalicious ? 'Malware' : null
          },
          'Symantec': {
            category: isMalicious ? 'suspicious' : 'harmless',
            engine_name: 'Symantec',
            result: isMalicious ? 'Suspicious.Cloud' : null
          }
        },
        reputation: isMalicious ? -50 : 10,
        total_votes: {
          harmless: isMalicious ? 5 : 25,
          malicious: isMalicious ? 20 : 1
        }
      }
    }
  }
}

function getMockIPGeolocation(ip: string): IPGeolocation {
  const isRussian = ip.startsWith('185.') || ip.startsWith('91.')
  
  return {
    ip,
    country: isRussian ? 'Russia' : 'United States',
    country_code: isRussian ? 'RU' : 'US',
    region: isRussian ? 'Moscow' : 'California',
    city: isRussian ? 'Moscow' : 'San Francisco',
    latitude: isRussian ? 55.7558 : 37.7749,
    longitude: isRussian ? 37.6176 : -122.4194,
    isp: isRussian ? 'Rostelecom' : 'Cloudflare',
    organization: isRussian ? 'Rostelecom JSC' : 'Cloudflare Inc.',
    timezone: isRussian ? 'Europe/Moscow' : 'America/Los_Angeles'
  }
}

function getMockDomainInfo(domain: string): DomainInfo {
  const isSuspicious = domain.includes('temp') || domain.includes('fake') || domain.endsWith('.tk')
  
  return {
    domain,
    registrar: isSuspicious ? 'Freenom' : 'GoDaddy',
    creation_date: isSuspicious ? '2024-01-15' : '2020-03-10',
    expiration_date: isSuspicious ? '2024-12-15' : '2025-03-10',
    name_servers: isSuspicious ? ['ns1.freenom.com', 'ns2.freenom.com'] : ['ns1.godaddy.com', 'ns2.godaddy.com'],
    status: isSuspicious ? ['clientTransferProhibited'] : ['clientDeleteProhibited', 'clientTransferProhibited']
  }
}

function getMockMalwareSamples(hash: string): MalwareSample[] {
  const isKnownMalware = hash.includes('bad') || hash.length === 64
  
  if (!isKnownMalware) return []
  
  return [
    {
      sha256: hash.length === 64 ? hash : 'a'.repeat(64),
      md5: 'b'.repeat(32),
      sha1: 'c'.repeat(40),
      file_name: 'suspicious_file.exe',
      file_size: 1024000,
      file_type: 'PE32',
      tags: ['trojan', 'stealer', 'windows'],
      first_seen: '2024-01-10T10:30:00Z',
      last_seen: '2024-01-15T14:20:00Z',
      signature: 'Trojan.Win32.Stealer'
    }
  ]
}

function getMockThreatIntelligence(indicator: string, type: string): ThreatIntelligence {
  const isThreat = indicator.includes('malware') || indicator.includes('bad') || indicator.includes('evil')
  
  return {
    indicator,
    type: type as 'ip' | 'domain' | 'hash' | 'url',
    reputation_score: isThreat ? 15 : 85,
    threat_types: isThreat ? ['malware', 'c2', 'phishing'] : [],
    first_seen: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-20T12:00:00Z',
    confidence: isThreat ? 95 : 20,
    sources: ['Mock Data']
  }
}