import { CustomThreatFeed, ThreatIndicator, FeedIngestionResult } from '@/types/threat-feeds'
import { logger } from './logger'

// In-memory storage (replace with database in production)
let customFeeds: CustomThreatFeed[] = []
let threatIndicators: ThreatIndicator[] = []
let ingestionResults: FeedIngestionResult[] = []

export const threatFeedManager = {
  // Feed Management
  createFeed: (feedData: Omit<CustomThreatFeed, 'id' | 'created_at' | 'indicator_count' | 'last_updated'>) => {
    const feed: CustomThreatFeed = {
      ...feedData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: new Date(),
      indicator_count: 0
    }
    
    customFeeds.push(feed)
    logger.info('system', `Custom threat feed created: ${feed.name}`, { feed_id: feed.id })
    return feed
  },

  getFeeds: () => customFeeds,

  getFeed: (id: string) => customFeeds.find(f => f.id === id),

  updateFeed: (id: string, updates: Partial<CustomThreatFeed>) => {
    const index = customFeeds.findIndex(f => f.id === id)
    if (index !== -1) {
      customFeeds[index] = { ...customFeeds[index], ...updates }
      return customFeeds[index]
    }
    return null
  },

  deleteFeed: (id: string) => {
    const index = customFeeds.findIndex(f => f.id === id)
    if (index !== -1) {
      const feed = customFeeds[index]
      customFeeds.splice(index, 1)
      
      // Remove indicators from this feed
      threatIndicators = threatIndicators.filter(i => i.source_feed !== id)
      
      logger.info('system', `Custom threat feed deleted: ${feed.name}`, { feed_id: id })
      return true
    }
    return false
  },

  // Feed Ingestion
  ingestFeed: async (feedId: string): Promise<FeedIngestionResult> => {
    const startTime = Date.now()
    const feed = customFeeds.find(f => f.id === feedId)
    
    if (!feed) {
      throw new Error('Feed not found')
    }

    const result: FeedIngestionResult = {
      feed_id: feedId,
      success: false,
      indicators_processed: 0,
      indicators_added: 0,
      indicators_updated: 0,
      errors: [],
      processing_time: 0,
      timestamp: new Date()
    }

    try {
      logger.info('system', `Starting ingestion for feed: ${feed.name}`)
      
      // Fetch data from feed URL
      const headers: Record<string, string> = {
        'User-Agent': 'Winston-SOC-Platform/1.0'
      }

      // Add authentication headers
      if (feed.authentication) {
        switch (feed.authentication.type) {
          case 'api_key':
            headers['X-API-Key'] = feed.authentication.credentials?.api_key || ''
            break
          case 'bearer':
            headers['Authorization'] = `Bearer ${feed.authentication.credentials?.token || ''}`
            break
          case 'basic':
            const credentials = Buffer.from(
              `${feed.authentication.credentials?.username}:${feed.authentication.credentials?.password}`
            ).toString('base64')
            headers['Authorization'] = `Basic ${credentials}`
            break
        }
      }

      const response = await fetch(feed.url, { headers })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const rawData = await response.text()
      const indicators = await parseFeedData(rawData, feed)
      
      result.indicators_processed = indicators.length

      // Process each indicator
      for (const indicatorData of indicators) {
        try {
          const processed = await processIndicator(indicatorData, feed)
          if (processed.isNew) {
            result.indicators_added++
          } else {
            result.indicators_updated++
          }
        } catch (error) {
          result.errors.push(`Error processing indicator ${indicatorData.indicator}: ${error}`)
        }
      }

      // Update feed metadata
      feed.last_updated = new Date()
      feed.indicator_count = threatIndicators.filter(i => i.source_feed === feedId).length
      feed.last_error = undefined

      result.success = true
      logger.info('system', `Feed ingestion completed: ${feed.name}`, {
        indicators_processed: result.indicators_processed,
        indicators_added: result.indicators_added,
        indicators_updated: result.indicators_updated
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(errorMessage)
      feed.last_error = errorMessage
      logger.error('system', `Feed ingestion failed: ${feed.name}`, error)
    }

    result.processing_time = Date.now() - startTime
    ingestionResults.unshift(result)
    
    // Keep only last 100 results
    if (ingestionResults.length > 100) {
      ingestionResults = ingestionResults.slice(0, 100)
    }

    return result
  },

  // Indicator Management
  getIndicators: (feedId?: string, limit?: number) => {
    let filtered = threatIndicators
    
    if (feedId) {
      filtered = filtered.filter(i => i.source_feed === feedId)
    }
    
    return limit ? filtered.slice(0, limit) : filtered
  },

  searchIndicators: (query: string, type?: string) => {
    return threatIndicators.filter(indicator => {
      const matchesQuery = indicator.indicator.toLowerCase().includes(query.toLowerCase()) ||
                          indicator.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      
      const matchesType = !type || indicator.type === type
      
      return matchesQuery && matchesType
    })
  },

  // Ingestion Results
  getIngestionResults: (feedId?: string, limit?: number) => {
    let filtered = ingestionResults
    
    if (feedId) {
      filtered = filtered.filter(r => r.feed_id === feedId)
    }
    
    return limit ? filtered.slice(0, limit) : filtered
  },

  // Auto-refresh feeds
  startAutoRefresh: () => {
    setInterval(async () => {
      const enabledFeeds = customFeeds.filter(f => f.enabled)
      
      for (const feed of enabledFeeds) {
        const timeSinceUpdate = Date.now() - (feed.last_updated?.getTime() || 0)
        const refreshInterval = feed.refresh_interval * 60 * 1000 // Convert to milliseconds
        
        if (timeSinceUpdate >= refreshInterval) {
          try {
            await threatFeedManager.ingestFeed(feed.id)
          } catch (error) {
            logger.error('system', `Auto-refresh failed for feed: ${feed.name}`, error)
          }
        }
      }
    }, 60000) // Check every minute
  }
}

// Parse feed data based on format
async function parseFeedData(rawData: string, feed: CustomThreatFeed): Promise<any[]> {
  const indicators: any[] = []

  switch (feed.type) {
    case 'json':
      const jsonData = JSON.parse(rawData)
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
      
      for (const item of dataArray) {
        const indicator = extractIndicatorFromObject(item, feed.fields)
        if (indicator && isValidIndicator(indicator.indicator, indicator.type)) {
          indicators.push(indicator)
        }
      }
      break

    case 'csv':
      const lines = rawData.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj: Record<string, string> = {}
        
        headers.forEach((header, index) => {
          obj[header] = values[index] || ''
        })
        
        const indicator = extractIndicatorFromObject(obj, feed.fields)
        if (indicator && isValidIndicator(indicator.indicator, indicator.type)) {
          indicators.push(indicator)
        }
      }
      break

    case 'txt':
      const txtLines = rawData.split('\n').filter(line => line.trim() && !line.startsWith('#'))
      
      for (const line of txtLines) {
        const indicator = line.trim()
        if (isValidIndicator(indicator)) {
          indicators.push({
            indicator,
            type: detectIndicatorType(indicator),
            confidence: 50,
            tags: []
          })
        }
      }
      break

    default:
      throw new Error(`Unsupported feed type: ${feed.type}`)
  }

  return indicators
}

// Extract indicator from object using field mappings
function extractIndicatorFromObject(obj: Record<string, any>, fields: CustomThreatFeed['fields']) {
  const indicator = obj[fields.indicator_field]
  if (!indicator) return null

  return {
    indicator: indicator.toString().trim(),
    type: fields.type_field ? obj[fields.type_field] : detectIndicatorType(indicator),
    confidence: fields.confidence_field ? parseInt(obj[fields.confidence_field]) || 50 : 50,
    tags: fields.tags_field ? (obj[fields.tags_field] || '').split(',').map((t: string) => t.trim()) : [],
    timestamp: fields.timestamp_field ? new Date(obj[fields.timestamp_field]) : new Date()
  }
}

// Process and store indicator
async function processIndicator(indicatorData: any, feed: CustomThreatFeed) {
  const existingIndex = threatIndicators.findIndex(
    i => i.indicator === indicatorData.indicator && i.source_feed === feed.id
  )

  const indicator: ThreatIndicator = {
    id: existingIndex !== -1 ? threatIndicators[existingIndex].id : 
        Date.now().toString() + Math.random().toString(36).substr(2, 9),
    indicator: indicatorData.indicator,
    type: indicatorData.type,
    confidence: indicatorData.confidence,
    tags: indicatorData.tags,
    source_feed: feed.id,
    first_seen: existingIndex !== -1 ? threatIndicators[existingIndex].first_seen : new Date(),
    last_seen: new Date(),
    metadata: indicatorData.metadata || {}
  }

  if (existingIndex !== -1) {
    threatIndicators[existingIndex] = indicator
    return { isNew: false, indicator }
  } else {
    threatIndicators.unshift(indicator)
    return { isNew: true, indicator }
  }
}

// Validate indicator format
function isValidIndicator(indicator: string, type?: string): boolean {
  if (!indicator || indicator.length < 3) return false

  const detectedType = type || detectIndicatorType(indicator)
  
  switch (detectedType) {
    case 'ip':
      return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(indicator)
    case 'domain':
      return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(indicator)
    case 'url':
      return /^https?:\/\/.+/.test(indicator)
    case 'hash':
      return /^[a-fA-F0-9]{32,64}$/.test(indicator)
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indicator)
    default:
      return true
  }
}

// Detect indicator type
function detectIndicatorType(indicator: string): 'ip' | 'domain' | 'hash' | 'url' | 'email' {
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(indicator)) return 'ip'
  if (/^https?:\/\//.test(indicator)) return 'url'
  if (/^[a-fA-F0-9]{32,64}$/.test(indicator)) return 'hash'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indicator)) return 'email'
  return 'domain'
}