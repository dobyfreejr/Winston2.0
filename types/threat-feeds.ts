export interface CustomThreatFeed {
  id: string
  name: string
  description: string
  url: string
  type: 'json' | 'csv' | 'xml' | 'txt'
  format: 'ioc_list' | 'stix' | 'misp' | 'custom'
  authentication?: {
    type: 'none' | 'api_key' | 'basic' | 'bearer'
    credentials?: {
      api_key?: string
      username?: string
      password?: string
      token?: string
    }
  }
  refresh_interval: number // minutes
  enabled: boolean
  last_updated?: Date
  last_error?: string
  indicator_count: number
  fields: {
    indicator_field: string
    type_field?: string
    confidence_field?: string
    tags_field?: string
    timestamp_field?: string
  }
  filters?: {
    indicator_types?: string[]
    min_confidence?: number
    tags_include?: string[]
    tags_exclude?: string[]
  }
  created_at: Date
  created_by: string
}

export interface ThreatIndicator {
  id: string
  indicator: string
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email'
  confidence: number
  tags: string[]
  source_feed: string
  first_seen: Date
  last_seen: Date
  metadata?: Record<string, any>
}

export interface FeedIngestionResult {
  feed_id: string
  success: boolean
  indicators_processed: number
  indicators_added: number
  indicators_updated: number
  errors: string[]
  processing_time: number
  timestamp: Date
}