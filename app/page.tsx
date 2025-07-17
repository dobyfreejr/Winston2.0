import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { IndicatorLookup } from '@/components/threat-analysis/indicator-lookup'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor threats, analyze indicators, and manage security operations
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