'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield } from 'lucide-react'
import { auth } from '@/lib/auth'
import { activityTracker } from '@/lib/activity-tracker'

export function LoginForm({ onLogin }: { onLogin?: () => void }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = auth.login(username)
      if (user) {
        activityTracker.trackActivity('login', { page: 'login' })
        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'))
        onLogin?.()
      } else {
        setError('Invalid username or user is inactive')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrgAdmin = () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    const orgAdmin = auth.initializeOrgAdmin(username)
    if (orgAdmin) {
      activityTracker.trackActivity('login', { page: 'login' })
      // Trigger auth change event
      window.dispatchEvent(new Event('auth-change'))
      onLogin?.()
    } else {
      setError('Organization already initialized')
    }
  }

  const users = auth.getUsers()
  const hasUsers = users.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">SOC Platform</CardTitle>
          <CardDescription>
            {hasUsers ? 'Sign in to your account' : 'Initialize your organization'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {hasUsers ? (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleCreateOrgAdmin} 
                  className="w-full"
                  disabled={loading}
                >
                  Create Organization Admin
                </Button>
              )}
            </div>
          </form>

          {hasUsers && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Available users: {users.filter(u => u.isActive).length}</p>
              <p>Contact your admin to create an account</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}