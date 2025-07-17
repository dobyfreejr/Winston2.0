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
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const users = auth.getUsers()
  const hasUsers = users.length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Get user's IP address (in production, this would come from request headers)
      const ipAddress = await getUserIP()
      const user = auth.login(username, password, ipAddress)
      if (user) {
        activityTracker.trackActivity('login', { page: 'login' })
        logger.info('security', `User login: ${username}`, { 
          userId: user.id, 
          ipAddress,
          userAgent: navigator.userAgent 
        })
        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'))
        onLogin?.()
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrgAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!username.trim()) {
      setError('Please enter a username')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const ipAddress = await getUserIP()
      const orgAdmin = auth.initializeOrgAdmin(username, password)
      if (orgAdmin) {
        // Set IP for org admin
        orgAdmin.lastLoginIp = ipAddress
        activityTracker.trackActivity('login', { page: 'login' })
        logger.info('security', `Organization admin created: ${username}`, { 
          userId: orgAdmin.id, 
          ipAddress,
          userAgent: navigator.userAgent 
        })
        // Trigger auth change event
        window.dispatchEvent(new Event('auth-change'))
        onLogin?.()
      } else {
        setError('Organization already initialized')
      }
    } catch (err) {
      setError('Failed to create organization admin')
    } finally {
      setLoading(false)
    }
  }

  // Get user's IP address
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/user/ip')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch (error) {
      return 'unknown'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Winston</CardTitle>
          <CardDescription>
            {hasUsers ? 'Sign in to your account' : 'Initialize your organization'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={hasUsers ? handleLogin : handleCreateOrgAdmin} className="space-y-4">
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

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {!hasUsers && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : hasUsers ? 'Sign In' : 'Create Organization Admin'}
              </Button>
            </div>
          </form>

          {hasUsers && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Contact your admin to create an account</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}