import { APIStatus } from '@/components/threat-analysis/api-status'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your threat intelligence API integrations and system settings
        </p>
      </div>

      <APIStatus />
    </div>
  )
}