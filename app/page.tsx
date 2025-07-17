import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { IndicatorLookup } from '@/components/threat-analysis/indicator-lookup'
import { auth } from '@/lib/auth'

export default function Dashboard() {
  // Auth is now handled by AuthWrapper, so we can assume user is logged in
  const currentUser = auth.getCurrentUser() || { username: 'User' }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.username} • Security operations center overview
        </p>
      </div>

      <StatsOverview />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IndicatorLookup />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}