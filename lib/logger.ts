export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  category: 'system' | 'api' | 'user' | 'security' | 'case' | 'analysis'
  message: string
  details?: any
  userId?: string
  ip?: string
  userAgent?: string
}

// In-memory log storage (replace with database in production)
let logs: LogEntry[] = []

export const logger = {
  info: (category: LogEntry['category'], message: string, details?: any, userId?: string) => {
    addLog('info', category, message, details, userId)
  },
  
  warn: (category: LogEntry['category'], message: string, details?: any, userId?: string) => {
    addLog('warn', category, message, details, userId)
  },
  
  error: (category: LogEntry['category'], message: string, details?: any, userId?: string) => {
    addLog('error', category, message, details, userId)
  },
  
  debug: (category: LogEntry['category'], message: string, details?: any, userId?: string) => {
    addLog('debug', category, message, details, userId)
  },
  
  getLogs: (limit?: number, level?: LogEntry['level'], category?: LogEntry['category']) => {
    let filteredLogs = logs
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }
    
    return limit ? filteredLogs.slice(0, limit) : filteredLogs
  },
  
  clearLogs: () => {
    logs = []
  },
  
  getLogStats: () => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recent24h = logs.filter(log => log.timestamp >= last24h)
    const recentHour = logs.filter(log => log.timestamp >= lastHour)
    
    return {
      total: logs.length,
      last24h: recent24h.length,
      lastHour: recentHour.length,
      errors24h: recent24h.filter(log => log.level === 'error').length,
      warnings24h: recent24h.filter(log => log.level === 'warn').length,
      byCategory: {
        system: logs.filter(log => log.category === 'system').length,
        api: logs.filter(log => log.category === 'api').length,
        user: logs.filter(log => log.category === 'user').length,
        security: logs.filter(log => log.category === 'security').length,
        case: logs.filter(log => log.category === 'case').length,
        analysis: logs.filter(log => log.category === 'analysis').length
      }
    }
  }
}

function addLog(level: LogEntry['level'], category: LogEntry['category'], message: string, details?: any, userId?: string) {
  const logEntry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    level,
    category,
    message,
    details,
    userId
  }
  
  logs.unshift(logEntry)
  
  // Keep only last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000)
  }
  
  // Console output for development
  const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  logMethod(`[${level.toUpperCase()}] [${category}] ${message}`, details || '')
}

// Initialize with system startup log
logger.info('system', 'SOC Platform initialized')