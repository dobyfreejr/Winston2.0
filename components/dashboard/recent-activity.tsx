'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, Globe, Hash, Plus, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/database'

export function RecentActivity() {
  const router = useRouter()
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const updateActivities = () => {
      const searchHistory = db.getSearchHistory().slice(0, 10)
      const formattedActivities = searchHistory.map(search => ({
        id: search.id,
        type: search.threatLevel === 'high' ? 'threat_detected' : 'analysis_complete',
        indicator: search.indicator,
        indicatorType: search.type,
        severity: search.threatLevel,
        description: search.threatLevel === 'high' 
          ? `High-risk ${search.type} detected` 
          : `${search.type.toUpperCase()} analysis completed`,
        timestamp: search.timestamp,
        source: 'Threat Intelligence',
        searchId: search.id
      }))
      setActivities(formattedActivities)
    }
    
    updateActivities()
    const interval = setInterval(updateActivities, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string, severity: string) => {
    if (type === 'threat_detected') {
      return <AlertTriangle className={`h-4 w-4 ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
    }
    return <Shield className="h-4 w-4 text-green-500" />
  }

  const getIndicatorIcon = (type: string) => {
    switch (type) {
      case 'ip':
      case 'domain':
      case 'url':
        return <Globe className="h-3 w-3" />
      case 'hash':
        return <Hash className="h-3 w-3" />
      default:
        return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const createCaseFromActivity = (activity: any) => {
    const newCase = db.createCase({
      title: `Investigation: ${activity.indicator}`,
      description: `Automated case created from ${activity.severity} severity detection`,
      priority: activity.severity === 'high' ? 'critical' : activity.severity === 'medium' ? 'high' : 'medium',
      status: 'open',
      timeSpent: 0,
      indicators: [activity.indicator],
      tags: [activity.indicatorType, activity.severity]
    })
    
    // Update threat detection with case ID
    const threats = db.getThreatDetections()
    const threat = threats.find(t => t.indicator === activity.indicator)
    if (threat) {
      db.updateThreatDetection(threat.id, { caseId: newCase.id, status: 'investigating' })
    }
    
    // Redirect to the new case
    router.push(`/cases?highlight=${newCase.id}`)
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your analysis history will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start analyzing indicators to see activity here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest threat intelligence analysis and detections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
              <div className="mt-1">
                {getActivityIcon(activity.type, activity.severity)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <Badge variant={getSeverityColor(activity.severity) as any} className="text-xs">
                      {activity.severity}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createCaseFromActivity(activity)}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Case
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {getIndicatorIcon(activity.indicatorType)}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {activity.indicator.length > 30 
                      ? `${activity.indicator.substring(0, 30)}...` 
                      : activity.indicator
                    }
                  </code>
                  <span>•</span>
                  <span>{activity.source}</span>
                  <span>•</span>
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}