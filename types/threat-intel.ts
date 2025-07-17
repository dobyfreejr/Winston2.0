export interface VirusTotalResponse {
  data: {
    id: string
    type: string
    attributes: {
      last_analysis_stats: {
        harmless: number
        malicious: number
        suspicious: number
        undetected: number
      }
      last_analysis_results: Record<string, {
        category: string
        engine_name: string
        result: string | null
      }>
      reputation: number
      total_votes: {
        harmless: number
        malicious: number
      }
    }
  }
}

export interface IPGeolocation {
  ip: string
  country: string
  country_code: string
  region: string
  city: string
  latitude: number
  longitude: number
  isp: string
  organization: string
  timezone: string
}

export interface DomainInfo {
  domain: string
  registrar: string
  creation_date: string
  expiration_date: string
  name_servers: string[]
  status: string[]
}

export interface MalwareSample {
  sha256: string
  md5: string
  sha1: string
  file_name: string
  file_size: number
  file_type: string
  tags: string[]
  first_seen: string
  last_seen: string
  signature: string
}

export interface ThreatIntelligence {
  indicator: string
  type: 'ip' | 'domain' | 'hash' | 'url'
  reputation_score: number
  threat_types: string[]
  first_seen: string
  last_seen: string
  confidence: number
  sources: string[]
}