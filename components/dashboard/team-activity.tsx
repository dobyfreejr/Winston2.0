'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Search, Eye, Plus, LogIn } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { activityTracker, UserActivity } from '@/lib/activity-tracker'

export function TeamActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [teamStats, setTeamStats] = useState<any>({})

  useEffect(() => {
    const updateData = () => {
      setActivities(activityTracker.getUserActivities(20))
      setTeamStats(activityTracker.getTeamStats())
    }
    
    updateData()
    const interval = setInterval(updateData, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'search':
      case 'analyze':
        return <Search className="h-4 w-4 text-blue-500" />
      case 'create_case':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'view_case':
        return <Eye className="h-4 w-4 text-yellow-500" />
      case 'login':
        return <LogIn className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityDescription = (activity: UserActivity) => {
    switch (activity.action) {
      case 'search':
        return `Searched for "${activity.details.searchTerm || activity.details.indicator}"`
      case 'analyze':
        return `Analyzed ${activity.details.indicatorType}: ${activity.details.indicator}`
      case 'create_case':
        return `Created case: ${activity.details.caseTitle}`
      case 'view_case':
        return `Viewed case: ${activity.details.caseTitle}`
      case 'login':
        return 'Logged in'
      case 'logout':
        return 'Logged out'
      default:
        return activity.action
    }
  }

  return (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.activeUsers24h || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activities (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.activities24h || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{teamStats.activitiesLastHour || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Team Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Team Activity Feed</CardTitle>
          <CardDescription>
            Real-time activity from all team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent team activity</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                  <div className="mt-1">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">
                          {activity.username}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {activity.action.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getActivityDescription(activity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Actions */}
      {teamStats.topActions && teamStats.topActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Actions (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teamStats.topActions.map((action: any, index: number) => (
                <div key={action.action} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="capitalize">{action.action.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{action.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}