'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, Globe, Hash } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'threat_detected',
      indicator: '185.220.101.42',
      indicatorType: 'ip',
      severity: 'high',
      description: 'Malicious IP detected in network traffic',
      timestamp: new Date('2024-01-20T12:45:00Z'),
      source: 'VirusTotal'
    },
    {
      id: 2,
      type: 'analysis_complete',
      indicator: 'suspicious-domain.tk',
      indicatorType: 'domain',
      severity: 'medium',
      description: 'Domain analysis completed - suspicious activity detected',
      timestamp: new Date('2024-01-20T12:15:00Z'),
      source: 'Domain Intelligence'
    },
    {
      id: 3,
      type: 'clean_verified',
      indicator: 'a1b2c3d4e5f6...',
      indicatorType: 'hash',
      severity: 'low',
      description: 'File hash verified as clean',
      timestamp: new Date('2024-01-20T11:00:00Z'),
      source: 'Malware Bazaar'
    },
    {
      id: 4,
      type: 'threat_detected',
      indicator: 'http://malware-site.com/payload',
      indicatorType: 'url',
      severity: 'high',
      description: 'Malicious URL blocked',
      timestamp: new Date('2024-01-20T10:00:00Z'),
      source: 'URL Scanner'
    },
    {
      id: 5,
      type: 'analysis_complete',
      indicator: '8.8.8.8',
      indicatorType: 'ip',
      severity: 'low',
      description: 'IP geolocation analysis completed',
      timestamp: new Date('2024-01-20T09:00:00Z'),
      source: 'IP Intelligence'
    }
  ]

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
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium leading-none">
                    {activity.description}
                  </p>
                  <Badge variant={getSeverityColor(activity.severity) as any} className="text-xs">
                    {activity.severity}
                  </Badge>
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