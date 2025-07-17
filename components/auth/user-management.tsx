'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Users, Shield, UserCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { auth, User } from '@/lib/auth'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
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
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(user.createdAt)}
                    {user.lastLogin && ` • Last login: ${formatDate(user.lastLogin)}`}
                  </div>
                </div>
                
                <div className="flex space-x-2">
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
    </div>
  )
}