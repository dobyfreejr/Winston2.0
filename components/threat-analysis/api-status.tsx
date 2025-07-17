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
      name: 'URLVoid',
      configured: false,
      status: 'inactive',
      description: 'URL reputation checking (optional)'
    }
  ])

  const checkAPIStatus = async () => {
    const newStatuses = apiStatuses.map(api => ({ ...api, status: 'checking' as const }))
    setApiStatuses(newStatuses)

    // Check environment variables
    const vtKey = process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY
    const ipGeoKey = process.env.NEXT_PUBLIC_IPGEOLOCATION_API_KEY
    const whoisKey = process.env.NEXT_PUBLIC_WHOISXML_API_KEY
    const abuseKey = process.env.NEXT_PUBLIC_ABUSEIPDB_API_KEY
    const urlVoidKey = process.env.NEXT_PUBLIC_URLVOID_API_KEY

    const updatedStatuses = newStatuses.map(api => {
      let configured = false
      let status: 'active' | 'inactive' | 'error' = 'inactive'

      switch (api.name) {
        case 'VirusTotal':
          configured = !!(vtKey && vtKey !== 'your_virustotal_api_key_here')
          break
        case 'IPGeolocation':
          configured = !!(ipGeoKey && ipGeoKey !== 'your_ipgeolocation_api_key_here')
          break
        case 'WhoisXML':
          configured = !!(whoisKey && whoisKey !== 'your_whoisxml_api_key_here')
          break
        case 'AbuseIPDB':
          configured = !!(abuseKey && abuseKey !== 'your_abuseipdb_api_key_here')
          break
        case 'URLVoid':
          configured = !!(urlVoidKey && urlVoidKey !== 'your_urlvoid_api_key_here')
          break
      }

      status = configured ? 'active' : 'inactive'

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
            <li>Add them to your <code>.env.local</code> file</li>
            <li>Restart the development server</li>
            <li>Click "Refresh" to verify the configuration</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}