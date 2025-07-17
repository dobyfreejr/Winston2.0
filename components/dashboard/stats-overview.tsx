'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react'
import { db } from '@/lib/database'

export function StatsOverview() {
  const [stats, setStats] = useState({
    threatsDetected: 0,
    cleanIndicators: 0,
    analysisRequests: 0,
    activeInvestigations: 0
  })

  useEffect(() => {
    const updateStats = () => {
      setStats(db.getStats())
    }
    
    updateStats()
    const interval = setInterval(updateStats, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const statsConfig = [
    {
      title: "Threats Detected",
      value: stats.threatsDetected.toString(),
      change: stats.threatsDetected > 0 ? `+${stats.threatsDetected}` : "0",
      changeType: "increase" as const,
      icon: AlertTriangle,
      description: "Last 24 hours"
    },
    {
      title: "Clean Indicators",
      value: stats.cleanIndicators.toString(),
      change: stats.cleanIndicators > 0 ? `+${stats.cleanIndicators}` : "0",
      changeType: "increase" as const,
      icon: Shield,
      description: "Verified safe"
    },
    {
      title: "Analysis Requests",
      value: stats.analysisRequests.toString(),
      change: stats.analysisRequests > 0 ? `+${stats.analysisRequests}` : "0",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: "This week"
    },
    {
      title: "Active Investigations",
      value: stats.activeInvestigations.toString(),
      change: stats.activeInvestigations > 0 ? `${stats.activeInvestigations}` : "0",
      changeType: "neutral" as const,
      icon: Activity,
      description: "Currently ongoing"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.changeType !== 'neutral' && (
                  <Badge 
                    variant={stat.changeType === 'increase' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                )}
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}