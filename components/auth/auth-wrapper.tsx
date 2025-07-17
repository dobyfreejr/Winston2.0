'use client'

import { useState, useEffect } from 'react'
import { LoginForm } from './login-form'
import { Navigation } from '../layout/navigation'
import { auth } from '@/lib/auth'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing user
    const user = auth.getCurrentUser()
    setCurrentUser(user)
    setLoading(false)
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      const user = auth.getCurrentUser()
      setCurrentUser(user)
    }

    // Custom event listener for auth changes
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginForm onLogin={() => setCurrentUser(auth.getCurrentUser())} />
  }

  return (
    <>
      <Navigation />
      <main className="pl-72">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  )
}