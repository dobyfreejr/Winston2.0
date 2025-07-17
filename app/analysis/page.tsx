import { IndicatorLookup } from '@/components/threat-analysis/indicator-lookup'

export default function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Threat Analysis</h1>
        <p className="text-muted-foreground">
          Comprehensive threat intelligence analysis across multiple sources
        </p>
      </div>

      <IndicatorLookup />
    </div>
  )
}