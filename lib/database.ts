// Simple in-memory database for demo (replace with real database in production)
interface SearchHistory {
  id: string
  indicator: string
  type: 'ip' | 'domain' | 'hash' | 'url'
  timestamp: Date
  results: any
  threatLevel: 'high' | 'medium' | 'low'
  status: 'analyzed' | 'investigating' | 'resolved'
}

interface Case {
  id: string
  title: string
  description: string
  summary?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  indicators: string[]
  assignee?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  notes: CaseNote[]
  linkedCases: string[] // Array of case IDs
  parentCase?: string // Parent case ID for hierarchical linking
}

interface CaseNote {
  id: string
  caseId: string
  content: string
  author: string
  timestamp: Date
  type: 'note' | 'status_change' | 'assignment' | 'escalation'
}

interface ThreatDetection {
  id: string
  indicator: string
  type: 'ip' | 'domain' | 'hash' | 'url'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  timestamp: Date
  source: string
  caseId?: string
  status: 'new' | 'investigating' | 'resolved' | 'false_positive'
}

// In-memory storage (replace with real database)
let searchHistory: SearchHistory[] = []
let cases: Case[] = []
let threatDetections: ThreatDetection[] = []
let analysisRequests: { id: string; indicator: string; timestamp: Date; status: string }[] = []
let caseNotes: CaseNote[] = []

export const db = {
  // Search History
  addSearchHistory: (search: Omit<SearchHistory, 'id'>) => {
    const newSearch = { ...search, id: Date.now().toString() }
    searchHistory.unshift(newSearch)
    if (searchHistory.length > 100) searchHistory = searchHistory.slice(0, 100)
    return newSearch
  },
  
  getSearchHistory: () => searchHistory,
  
  // Cases
  createCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCase = {
      ...caseData,
      id: Date.now().toString(),
      notes: [],
      linkedCases: caseData.linkedCases || [],
      summary: caseData.summary || generateCaseSummary(caseData),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    cases.unshift(newCase)
    return newCase
  },
  
  getCases: () => cases,
  
  updateCase: (id: string, updates: Partial<Case>) => {
    const index = cases.findIndex(c => c.id === id)
    if (index !== -1) {
      // Auto-update summary if key fields changed
      if (updates.description || updates.indicators || updates.tags) {
        updates.summary = generateCaseSummary({ ...cases[index], ...updates })
      }
      cases[index] = { ...cases[index], ...updates, updatedAt: new Date() }
      return cases[index]
    }
    return null
  },
  
  // Case Notes
  addCaseNote: (caseId: string, content: string, author: string = 'System', type: CaseNote['type'] = 'note') => {
    const note: CaseNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      caseId,
      content,
      author,
      timestamp: new Date(),
      type
    }
    caseNotes.unshift(note)
    
    // Update case with note
    const caseIndex = cases.findIndex(c => c.id === caseId)
    if (caseIndex !== -1) {
      cases[caseIndex].notes = [note, ...cases[caseIndex].notes]
      cases[caseIndex].updatedAt = new Date()
    }
    
    return note
  },
  
  getCaseNotes: (caseId: string) => {
    return caseNotes.filter(note => note.caseId === caseId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  },
  
  // Case Linking
  linkCases: (caseId1: string, caseId2: string, author: string = 'System') => {
    const case1 = cases.find(c => c.id === caseId1)
    const case2 = cases.find(c => c.id === caseId2)
    
    if (!case1 || !case2) return false
    
    // Add bidirectional links
    if (!case1.linkedCases.includes(caseId2)) {
      case1.linkedCases.push(caseId2)
      case1.updatedAt = new Date()
      db.addCaseNote(caseId1, `Linked to case: ${case2.title}`, author, 'status_change')
    }
    
    if (!case2.linkedCases.includes(caseId1)) {
      case2.linkedCases.push(caseId1)
      case2.updatedAt = new Date()
      db.addCaseNote(caseId2, `Linked to case: ${case1.title}`, author, 'status_change')
    }
    
    return true
  },
  
  unlinkCases: (caseId1: string, caseId2: string, author: string = 'System') => {
    const case1 = cases.find(c => c.id === caseId1)
    const case2 = cases.find(c => c.id === caseId2)
    
    if (!case1 || !case2) return false
    
    // Remove bidirectional links
    case1.linkedCases = case1.linkedCases.filter(id => id !== caseId2)
    case2.linkedCases = case2.linkedCases.filter(id => id !== caseId1)
    
    case1.updatedAt = new Date()
    case2.updatedAt = new Date()
    
    db.addCaseNote(caseId1, `Unlinked from case: ${case2.title}`, author, 'status_change')
    db.addCaseNote(caseId2, `Unlinked from case: ${case1.title}`, author, 'status_change')
    
    return true
  },
  
  getLinkedCases: (caseId: string) => {
    const case_ = cases.find(c => c.id === caseId)
    if (!case_) return []
    
    return cases.filter(c => case_.linkedCases.includes(c.id))
  },
  
  // Threat Detections
  addThreatDetection: (threat: Omit<ThreatDetection, 'id'>) => {
    const newThreat = { ...threat, id: Date.now().toString() }
    threatDetections.unshift(newThreat)
    return newThreat
  },
  
  getThreatDetections: () => threatDetections,
  
  updateThreatDetection: (id: string, updates: Partial<ThreatDetection>) => {
    const index = threatDetections.findIndex(t => t.id === id)
    if (index !== -1) {
      threatDetections[index] = { ...threatDetections[index], ...updates }
      return threatDetections[index]
    }
    return null
  },
  
  // Analysis Requests
  addAnalysisRequest: (indicator: string) => {
    const request = {
      id: Date.now().toString(),
      indicator,
      timestamp: new Date(),
      status: 'completed'
    }
    analysisRequests.unshift(request)
    if (analysisRequests.length > 50) analysisRequests = analysisRequests.slice(0, 50)
    return request
  },
  
  getAnalysisRequests: () => analysisRequests,
  
  // Statistics
  getStats: () => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    return {
      threatsDetected: threatDetections.filter(t => t.timestamp >= last24h).length,
      cleanIndicators: searchHistory.filter(s => s.timestamp >= last24h && s.threatLevel === 'low').length,
      analysisRequests: analysisRequests.filter(r => r.timestamp >= lastWeek).length,
      activeInvestigations: cases.filter(c => c.status === 'investigating').length,
      totalCases: cases.length,
      resolvedCases: cases.filter(c => c.status === 'resolved').length,
      criticalCases: cases.filter(c => c.priority === 'critical' && c.status !== 'closed').length,
      linkedCases: cases.filter(c => c.linkedCases.length > 0).length
    }
  }
}

// Auto-generate case summary based on case data
function generateCaseSummary(caseData: Partial<Case>): string {
  const parts = []
  
  // Priority and status
  if (caseData.priority) {
    parts.push(`${caseData.priority.toUpperCase()} priority`)
  }
  
  // Indicator count and types
  if (caseData.indicators && caseData.indicators.length > 0) {
    const indicatorTypes = new Set()
    caseData.indicators.forEach(indicator => {
      if (indicator.includes('.') && /^\d+\.\d+\.\d+\.\d+$/.test(indicator)) {
        indicatorTypes.add('IP')
      } else if (indicator.includes('.') && !indicator.startsWith('http')) {
        indicatorTypes.add('domain')
      } else if (indicator.startsWith('http')) {
        indicatorTypes.add('URL')
      } else if (/^[a-fA-F0-9]{32,64}$/.test(indicator)) {
        indicatorTypes.add('hash')
      } else {
        indicatorTypes.add('indicator')
      }
    })
    
    const typesList = Array.from(indicatorTypes).join(', ')
    parts.push(`${caseData.indicators.length} IOCs (${typesList})`)
  }
  
  // Tags
  if (caseData.tags && caseData.tags.length > 0) {
    const relevantTags = caseData.tags.filter(tag => 
      !['ip', 'domain', 'hash', 'url', 'high', 'medium', 'low', 'critical'].includes(tag.toLowerCase())
    )
    if (relevantTags.length > 0) {
      parts.push(`Tags: ${relevantTags.slice(0, 3).join(', ')}`)
    }
  }
  
  // Threat level assessment
  if (caseData.indicators) {
    const threatKeywords = ['malware', 'phishing', 'apt', 'botnet', 'c2', 'trojan', 'ransomware']
    const description = (caseData.description || '').toLowerCase()
    const tags = (caseData.tags || []).map(t => t.toLowerCase())
    
    const foundThreats = threatKeywords.filter(keyword => 
      description.includes(keyword) || tags.includes(keyword)
    )
    
    if (foundThreats.length > 0) {
      parts.push(`Threat types: ${foundThreats.slice(0, 2).join(', ')}`)
    }
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Security investigation case'
}