import { auth } from './auth'

export interface UserActivity {
  id: string
  userId: string
  username: string
  action: 'search' | 'analyze' | 'create_case' | 'view_case' | 'login' | 'logout'
  details: {
    indicator?: string
    indicatorType?: string
    caseId?: string
    caseTitle?: string
    searchTerm?: string
    page?: string
  }
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface RecentThreat {
  id: string
  type: 'malware' | 'malicious_ip' | 'file_upload'
  indicator: string
  threatLevel: 'high' | 'medium' | 'low'
  detectedBy: string
  timestamp: Date
  details: any
}

// In-memory storage (replace with database in production)
let userActivities: UserActivity[] = []
let recentThreats: RecentThreat[] = []

export const activityTracker = {
  // Track user activity
  trackActivity: (action: UserActivity['action'], details: UserActivity['details'], ipAddress?: string, userAgent?: string) => {
    const currentUser = auth.getCurrentUser()
    if (!currentUser) return

    const activity: UserActivity = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      username: currentUser.username,
      action,
      details,
      timestamp: new Date(),
      ipAddress,
      userAgent
    }

    userActivities.unshift(activity)
    
    // Keep only last 1000 activities
    if (userActivities.length > 1000) {
      userActivities = userActivities.slice(0, 1000)
    }

    return activity
  },

  // Add recent threat
  addRecentThreat: (threat: Omit<RecentThreat, 'id'>) => {
    const newThreat: RecentThreat = {
      ...threat,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }

    recentThreats.unshift(newThreat)
    
    // Keep only last 100 threats
    if (recentThreats.length > 100) {
      recentThreats = recentThreats.slice(0, 100)
    }

    return newThreat
  },

  // Get user activities
  getUserActivities: (limit?: number, userId?: string) => {
    let filtered = userActivities
    
    if (userId) {
      filtered = filtered.filter(activity => activity.userId === userId)
    }
    
    return limit ? filtered.slice(0, limit) : filtered
  },

  // Get recent threats
  getRecentThreats: (limit?: number, type?: RecentThreat['type']) => {
    let filtered = recentThreats
    
    if (type) {
      filtered = filtered.filter(threat => threat.type === type)
    }
    
    return limit ? filtered.slice(0, limit) : filtered
  },

  // Get team activity stats
  getTeamStats: () => {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
    
    const recent24h = userActivities.filter(activity => activity.timestamp >= last24h)
    const recentHour = userActivities.filter(activity => activity.timestamp >= lastHour)
    
    return {
      totalActivities: userActivities.length,
      activities24h: recent24h.length,
      activitiesLastHour: recentHour.length,
      activeUsers24h: new Set(recent24h.map(a => a.userId)).size,
      topActions: getTopActions(recent24h),
      userBreakdown: getUserBreakdown(recent24h)
    }
  }
}

function getTopActions(activities: UserActivity[]) {
  const actionCounts: Record<string, number> = {}
  activities.forEach(activity => {
    actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1
  })
  
  return Object.entries(actionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }))
}

function getUserBreakdown(activities: UserActivity[]) {
  const userCounts: Record<string, number> = {}
  activities.forEach(activity => {
    userCounts[activity.username] = (userCounts[activity.username] || 0) + 1
  })
  
  return Object.entries(userCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([username, count]) => ({ username, count }))
}