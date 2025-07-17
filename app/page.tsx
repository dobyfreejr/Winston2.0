import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { TeamActivity } from '@/components/dashboard/team-activity'
import { RecentThreats } from '@/components/dashboard/recent-threats'
import { IndicatorLookup } from '@/components/threat-analysis/indicator-lookup'
import { auth } from '@/lib/auth'

export default function Dashboard() {
  const currentUser = auth.getCurrentUser()
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the SOC platform</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.username} • Monitor threats, analyze indicators, and manage security operations
        </p>
      </div>

      <StatsOverview />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <IndicatorLookup />
        </div>
        <div>
          <RecentThreats />
        </div>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <TeamActivity />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}