export interface User {
  id: string
  username: string
  password: string // Added password field
  role: 'org_admin' | 'admin' | 'analyst'
  createdAt: Date
  lastLogin?: Date
  createdBy: string
  isActive: boolean
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
  login: (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password && u.isActive)
    if (user) {
      user.lastLogin = new Date()
      currentUser = user
      return user
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
  }
}