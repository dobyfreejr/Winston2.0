import { VirusTotalResponse, IPGeolocation, DomainInfo, MalwareSample, ThreatIntelligence } from '@/types/threat-intel'

// Mock API functions - In production, these would make real API calls
export async function analyzeWithVirusTotal(indicator: string, type: 'ip' | 'domain' | 'hash' | 'url'): Promise<VirusTotalResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock response based on indicator patterns
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

export async function getIPGeolocation(ip: string): Promise<IPGeolocation> {
  await new Promise(resolve => setTimeout(resolve, 800))
  
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

export async function getDomainInfo(domain: string): Promise<DomainInfo> {
  await new Promise(resolve => setTimeout(resolve, 600))
  
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

export async function searchMalwareBazaar(hash: string): Promise<MalwareSample[]> {
  await new Promise(resolve => setTimeout(resolve, 1200))
  
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

export async function enrichThreatIntelligence(indicator: string, type: 'ip' | 'domain' | 'hash' | 'url'): Promise<ThreatIntelligence> {
  await new Promise(resolve => setTimeout(resolve, 900))
  
  const isThreat = indicator.includes('malware') || indicator.includes('bad') || indicator.includes('evil')
  
  return {
    indicator,
    type,
    reputation_score: isThreat ? 15 : 85,
    threat_types: isThreat ? ['malware', 'c2', 'phishing'] : [],
    first_seen: '2024-01-01T00:00:00Z',
    last_seen: '2024-01-20T12:00:00Z',
    confidence: isThreat ? 95 : 20,
    sources: ['VirusTotal', 'Malware Bazaar', 'Threat Intelligence Feeds']
  }
}