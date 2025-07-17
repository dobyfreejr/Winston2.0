'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Users, Shield, UserCheck, Globe, AlertTriangle, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { auth, User, LoginRecord } from '@/lib/auth'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoginHistoryOpen, setIsLoginHistoryOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'analyst' as User['role']
  })

  useEffect(() => {
    setUsers(auth.getUsers())
    setCurrentUser(auth.getCurrentUser())
  }, [])

  const handleCreateUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !currentUser) return

    if (newUser.password.length < 6) {
      console.error('Password must be at least 6 characters')
      return
    }

    try {
      const createdUser = auth.createUser({
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        loginHistory: [],
        isActive: true
      }, currentUser.id)

      setUsers(auth.getUsers())
      setNewUser({ username: '', password: '', role: 'analyst' })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const toggleUserStatus = (userId: string) => {
    if (!currentUser) return

    const user = users.find(u => u.id === userId)
    if (user) {
      try {
        auth.updateUser(userId, { isActive: !user.isActive }, currentUser.id)
        setUsers(auth.getUsers())
      } catch (error) {
        console.error('Failed to update user:', error)
      }
    }
  }

  const deleteUser = (userId: string) => {
    if (!currentUser) return

    try {
      auth.deleteUser(userId, currentUser.id)
      setUsers(auth.getUsers())
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'org_admin': return 'destructive'
      case 'admin': return 'default'
      case 'analyst': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'org_admin': return <Shield className="h-4 w-4" />
      case 'admin': return <UserCheck className="h-4 w-4" />
      case 'analyst': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const viewLoginHistory = (user: User) => {
    setSelectedUser(user)
    setIsLoginHistoryOpen(true)
  }

  const getLoginStatusColor = (login: LoginRecord) => {
    if (!login.success) return 'destructive'
    if (login.isUnusual) return 'default'
    return 'secondary'
  }

  const getLoginStatusIcon = (login: LoginRecord) => {
    if (!login.success) return <AlertTriangle className="h-3 w-3" />
    if (login.isUnusual) return <Globe className="h-3 w-3" />
    return null
  }

  if (!currentUser || !auth.hasPermission(currentUser, 'admin_panel')) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        
        {auth.hasPermission(currentUser, 'create_users') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the SOC platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Enter username..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter password..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: User['role']) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analyst">Analyst</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {currentUser.role === 'org_admin' && (
                        <SelectItem value="org_admin">Org Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <h4 className="font-medium">{user.username}</h4>
                    <Badge variant={getRoleColor(user.role) as any}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {user.loginHistory.some(login => login.isUnusual && login.success) && (
                      <Badge variant="default">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Unusual Login
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Created: {formatDate(user.createdAt)}</div>
                    {user.lastLogin && (
                      <div className="flex items-center space-x-2">
                        <span>Last login: {formatDate(user.lastLogin)}</span>
                        {user.loginHistory[0] && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                              {user.loginHistory[0].ipAddress}
                            </span>
                            {user.loginHistory[0].isUnusual && (
                              <Badge variant="outline" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Unusual
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 text-xs">
                      <span>Total logins: {user.loginHistory.length}</span>
                      <span>Failed: {user.loginHistory.filter(l => !l.success).length}</span>
                      <span>Unique IPs: {new Set(user.loginHistory.map(l => l.ipAddress)).size}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewLoginHistory(user)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Login History
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                    disabled={user.id === currentUser?.id}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  
                  {auth.hasPermission(currentUser, 'delete_users') && user.id !== currentUser?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Login History Dialog */}
      <Dialog open={isLoginHistoryOpen} onOpenChange={setIsLoginHistoryOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Login History: {selectedUser?.username}</span>
            </DialogTitle>
            <DialogDescription>
              Complete login history with IP addresses and unusual activity detection
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Login Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">{selectedUser.loginHistory.length}</div>
                  <div className="text-xs text-muted-foreground">Total Logins</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {selectedUser.loginHistory.filter(l => !l.success).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {selectedUser.loginHistory.filter(l => l.isUnusual && l.success).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Unusual</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {new Set(selectedUser.loginHistory.map(l => l.ipAddress)).size}
                  </div>
                  <div className="text-xs text-muted-foreground">Unique IPs</div>
                </div>
              </div>
              
              {/* Login History List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedUser.loginHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No login history available</p>
                  </div>
                ) : (
                  selectedUser.loginHistory.map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getLoginStatusIcon(login)}
                          <Badge variant={getLoginStatusColor(login) as any} className="text-xs">
                            {login.success ? 'Success' : 'Failed'}
                          </Badge>
                          {login.isUnusual && login.success && (
                            <Badge variant="outline" className="text-xs">
                              Unusual Location
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-sm">{login.ipAddress}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(login.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground max-w-48 truncate">
                          {login.userAgent}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}