'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface APIStatus {
  name: string
  configured: boolean
  status: 'active' | 'inactive' | 'error' | 'checking'
  description: string
}

export function APIStatus() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    {
      name: 'VirusTotal',
      configured: false,
      status: 'inactive',
      description: 'Malware and URL analysis'
    },
    {
      name: 'IPGeolocation',
      configured: false,
      status: 'inactive',
      description: 'IP address geolocation data'
    },
    {
      name: 'WhoisXML',
      configured: false,
      status: 'inactive',
      description: 'Domain registration information'
    },
    {
      name: 'AbuseIPDB',
      configured: false,
      status: 'inactive',
      description: 'IP abuse reports (optional)'
    },
    {
      name: 'Malware Bazaar',
      configured: true,
      status: 'active',
      description: 'Malware sample database (free, no API key required)'
    }
  ])

  const checkAPIStatus = async () => {
    const newStatuses = apiStatuses.map(api => ({ ...api, status: 'checking' as const }))
    setApiStatuses(newStatuses)

    // Test each API endpoint
    const testResults = await Promise.allSettled([
      fetch('/api/virustotal/analyze', { method: 'POST', body: JSON.stringify({ indicator: 'test', type: 'ip' }) }),
      fetch('/api/ipgeolocation/lookup', { method: 'POST', body: JSON.stringify({ ip: '8.8.8.8' }) }),
      fetch('/api/whoisxml/domain', { method: 'POST', body: JSON.stringify({ domain: 'example.com' }) }),
      fetch('/api/abuseipdb/check', { method: 'POST', body: JSON.stringify({ ip: '8.8.8.8' }) })
    ])

    const updatedStatuses = newStatuses.map((api, index) => {
      if (api.name === 'Malware Bazaar') {
        return { ...api, configured: true, status: 'active' as const }
      }

      const result = testResults[index]
      let configured = false
      let status: 'active' | 'inactive' | 'error' = 'inactive'

      if (result.status === 'fulfilled') {
        const response = result.value
        if (response.ok) {
          configured = true
          status = 'active'
        } else if (response.status === 500) {
          // API key not configured
          configured = false
          status = 'inactive'
        } else {
          configured = true
          status = 'error'
        }
      } else {
        status = 'error'
      }

      return { ...api, configured, status }
    })

    setApiStatuses(updatedStatuses)
  }

  useEffect(() => {
    checkAPIStatus()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string, configured: boolean) => {
    if (status === 'checking') {
      return <Badge variant="default">Checking...</Badge>
    }
    if (status === 'error') {
      return <Badge variant="destructive">Error</Badge>
    }
    if (!configured) {
      return <Badge variant="secondary">Not Configured</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Integration Status</CardTitle>
            <CardDescription>
              Configure your threat intelligence API keys in .env.local
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkAPIStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {apiStatuses.map((api) => (
            <div key={api.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(api.status)}
                <div>
                  <p className="font-medium">{api.name}</p>
                  <p className="text-sm text-muted-foreground">{api.description}</p>
                </div>
              </div>
              {getStatusBadge(api.status, api.configured)}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Setup Instructions:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Create accounts with the threat intelligence providers</li>
            <li>Get your API keys from each service</li>
            <li>Add them to your <code>.env.local</code> file (without NEXT_PUBLIC_ prefix)</li>
            <li>Restart the development server</li>
            <li>Click &quot;Refresh&quot; to verify the configuration</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}