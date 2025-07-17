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
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  timeSpent: number // Time spent in hours
  indicators: string[]
  assignee?: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  notes: CaseNote[]
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
      timeSpent: 0,
      notes: [],
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
  
  updateCaseTimeSpent: (caseId: string, timeSpent: number, author: string = 'System') => {
    const updated = db.updateCase(caseId, { timeSpent })
    if (updated) {
      db.addCaseNote(caseId, `Time spent updated to ${timeSpent} hours`, author, 'status_change')
    }
    return updated
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
      criticalCases: cases.filter(c => c.priority === 'critical' && c.status !== 'closed').length
    }
  }
}