'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Globe, Hash, Upload, Eye, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { activityTracker, RecentThreat } from '@/lib/activity-tracker'

export function RecentThreats() {
  const [recentMalware, setRecentMalware] = useState<RecentThreat[]>([])
  const [recentIPs, setRecentIPs] = useState<RecentThreat[]>([])
  const [recentUploads, setRecentUploads] = useState<RecentThreat[]>([])

  useEffect(() => {
    const updateThreats = () => {
      setRecentMalware(activityTracker.getRecentThreats(5, 'malware'))
      setRecentIPs(activityTracker.getRecentThreats(5, 'malicious_ip'))
      setRecentUploads(activityTracker.getRecentThreats(5, 'file_upload'))
    }
    
    updateThreats()
    const interval = setInterval(updateThreats, 15000) // Update every 15 seconds
    
    return () => clearInterval(interval)
  }, [])

  const getThreatIcon = (type: RecentThreat['type']) => {
    switch (type) {
      case 'malware': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'malicious_ip': return <Globe className="h-4 w-4 text-orange-500" />
      case 'file_upload': return <Upload className="h-4 w-4 text-blue-500" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const ThreatCard = ({ title, threats, emptyMessage }: { 
    title: string
    threats: RecentThreat[]
    emptyMessage: string 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Latest detections from threat analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {threats.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            threats.map((threat) => (
              <div key={threat.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="mt-1">
                  {getThreatIcon(threat.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {threat.indicator.length > 30 
                        ? `${threat.indicator.substring(0, 30)}...` 
                        : threat.indicator
                      }
                    </code>
                    <Badge variant={getThreatColor(threat.threatLevel) as any} className="text-xs">
                      {threat.threatLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Detected by: {threat.detectedBy}</span>
                    <span>{formatDate(threat.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <ThreatCard
        title="Recent Malware"
        threats={recentMalware}
        emptyMessage="No recent malware detections"
      />
      
      <ThreatCard
        title="Recent Malicious IPs"
        threats={recentIPs}
        emptyMessage="No recent malicious IP detections"
      />
      
      <ThreatCard
        title="Recent VirusTotal Uploads"
        threats={recentUploads}
        emptyMessage="No recent file uploads to VirusTotal"
      />
    </div>
  )
}