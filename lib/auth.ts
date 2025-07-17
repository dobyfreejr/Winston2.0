export interface User {
  id: string
  username: string
  password: string // Added password field
  role: 'org_admin' | 'admin' | 'analyst'
  createdAt: Date
  lastLogin?: Date
  loginHistory: LoginRecord[]
  createdBy: string
  isActive: boolean
}

export interface LoginRecord {
  timestamp: Date
  ipAddress: string
  userAgent: string
  success: boolean
  location?: {
    country?: string
    region?: string
    city?: string
  }
  isUnusual?: boolean
}

// In-memory user storage (replace with database in production)
let users: User[] = []
let currentUser: User | null = null

export const auth = {
  // Initialize with org admin if no users exist
  initializeOrgAdmin: (username: string, password: string) => {
    if (users.length === 0) {
      const orgAdmin: User = {
        id: 'org-admin-1',
        username,
        password, // Store password (in production, hash this!)
        role: 'org_admin',
        createdAt: new Date(),
        loginHistory: [],
        createdBy: 'system',
        isActive: true
      }
      users.push(orgAdmin)
      currentUser = orgAdmin
      return orgAdmin
    }
    return null
  },

  // Login user with password
  login: (username: string, password: string, ipAddress?: string, userAgent?: string) => {
    const user = users.find(u => u.username === username && u.password === password && u.isActive)
    if (user) {
      const loginRecord: LoginRecord = {
        timestamp: new Date(),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        success: true,
        isUnusual: auth.isUnusualLogin(user, ipAddress || 'unknown')
      }
      
      // Add to login history (keep last 50 records)
      user.loginHistory.unshift(loginRecord)
      if (user.loginHistory.length > 50) {
        user.loginHistory = user.loginHistory.slice(0, 50)
      }
      
      user.lastLogin = new Date()
      currentUser = user
      
      // Log unusual login attempts
      if (loginRecord.isUnusual) {
        console.warn(`Unusual login detected for ${username} from ${ipAddress}`)
      }
      
      return user
    }
    
    // Log failed login attempt
    const failedUser = users.find(u => u.username === username)
    if (failedUser) {
      const failedRecord: LoginRecord = {
        timestamp: new Date(),
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        success: false
      }
      
      failedUser.loginHistory.unshift(failedRecord)
      if (failedUser.loginHistory.length > 50) {
        failedUser.loginHistory = failedUser.loginHistory.slice(0, 50)
      }
    }
    
    return null
  },

  // Get current user
  getCurrentUser: () => currentUser,

  // Create new user (only org_admin and admin can create users)
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>, createdBy: string) => {
    const creator = users.find(u => u.id === createdBy)
    if (!creator || (creator.role !== 'org_admin' && creator.role !== 'admin')) {
      throw new Error('Insufficient permissions to create users')
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      loginHistory: [],
      createdBy
    }
    
    users.push(newUser)
    return newUser
  },

  // Get all users
  getUsers: () => users,

  // Update user
  updateUser: (userId: string, updates: Partial<User>, updatedBy: string) => {
    const updater = users.find(u => u.id === updatedBy)
    if (!updater || (updater.role !== 'org_admin' && updater.role !== 'admin')) {
      throw new Error('Insufficient permissions to update users')
    }

    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      return users[userIndex]
    }
    return null
  },

  // Delete user
  deleteUser: (userId: string, deletedBy: string) => {
    const deleter = users.find(u => u.id === deletedBy)
    if (!deleter || deleter.role !== 'org_admin') {
      throw new Error('Only org admin can delete users')
    }

    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users.splice(userIndex, 1)
      return true
    }
    return false
  },

  // Check permissions
  hasPermission: (user: User | null, permission: 'admin_panel' | 'create_users' | 'delete_users') => {
    if (!user) return false
    
    switch (permission) {
      case 'admin_panel':
        return user.role === 'org_admin' || user.role === 'admin'
      case 'create_users':
        return user.role === 'org_admin' || user.role === 'admin'
      case 'delete_users':
        return user.role === 'org_admin'
      default:
        return false
    }
  },

  // Logout
  logout: () => {
    currentUser = null
  },
  
  // Check if login is unusual for this user
  isUnusualLogin: (user: User, ipAddress: string) => {
    if (user.loginHistory.length < 3) return false // Not enough history
    
    const recentSuccessfulLogins = user.loginHistory
      .filter(login => login.success)
      .slice(0, 10) // Last 10 successful logins
    
    // Check if this IP has been used before
    const hasUsedThisIP = recentSuccessfulLogins.some(login => login.ipAddress === ipAddress)
    
    // Check if this is a completely new IP subnet
    const ipPrefix = ipAddress.split('.').slice(0, 3).join('.') // First 3 octets
    const hasUsedSimilarIP = recentSuccessfulLogins.some(login => 
      login.ipAddress.startsWith(ipPrefix)
    )
    
    // Unusual if: new IP AND not from similar subnet
    return !hasUsedThisIP && !hasUsedSimilarIP
  },
  
  // Get login statistics for a user
  getUserLoginStats: (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return null
    
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recent24h = user.loginHistory.filter(login => login.timestamp >= last24h)
    const recent7d = user.loginHistory.filter(login => login.timestamp >= last7d)
    
    const uniqueIPs = new Set(user.loginHistory.map(login => login.ipAddress)).size
    const failedLogins = user.loginHistory.filter(login => !login.success).length
    const unusualLogins = user.loginHistory.filter(login => login.isUnusual).length
    
    return {
      totalLogins: user.loginHistory.length,
      logins24h: recent24h.length,
      logins7d: recent7d.length,
      uniqueIPs,
      failedLogins,
      unusualLogins,
      lastLogin: user.lastLogin,
      lastIP: user.loginHistory[0]?.ipAddress
    }
  }
}