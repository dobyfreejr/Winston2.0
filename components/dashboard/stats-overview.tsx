'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react'

export function StatsOverview() {
  const stats = [
    {
      title: "Threats Detected",
      value: "1,247",
      change: "+12%",
      changeType: "increase" as const,
      icon: AlertTriangle,
      description: "Last 24 hours"
    },
    {
      title: "Clean Indicators",
      value: "8,932",
      change: "+5%",
      changeType: "increase" as const,
      icon: Shield,
      description: "Verified safe"
    },
    {
      title: "Analysis Requests",
      value: "15,678",
      change: "+23%",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: "This week"
    },
    {
      title: "Active Investigations",
      value: "42",
      change: "-8%",
      changeType: "decrease" as const,
      icon: Activity,
      description: "Currently ongoing"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
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
                <Badge 
                  variant={stat.changeType === 'increase' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}