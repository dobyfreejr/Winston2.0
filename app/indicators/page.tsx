'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Shield, 
  Globe, 
  Hash, 
  Link, 
  Search, 
  Filter,
  Eye,
  Plus,
  Download
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/database'

export default function IndicatorsPage() {
  const router = useRouter()
  const [indicators, setIndicators] = useState<any[]>([])
  const [filteredIndicators, setFilteredIndicators] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [threatFilter, setThreatFilter] = useState('all')

  useEffect(() => {
    const updateIndicators = () => {
      // Get indicators from search history
      const searchHistory = db.getSearchHistory()
      const indicatorData = searchHistory.map(search => ({
        id: search.id,
        indicator: search.indicator,
        type: search.type,
        threatLevel: search.threatLevel,
        timestamp: search.timestamp,
        status: search.status,
        results: search.results
      }))
      
      setIndicators(indicatorData)
      setFilteredIndicators(indicatorData)
    }
    
    updateIndicators()
    const interval = setInterval(updateIndicators, 10000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = indicators

    if (searchTerm) {
      filtered = filtered.filter(ind => 
        ind.indicator.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ind => ind.type === typeFilter)
    }

    if (threatFilter !== 'all') {
      filtered = filtered.filter(ind => ind.threatLevel === threatFilter)
    }

    setFilteredIndicators(filtered)
  }, [indicators, searchTerm, typeFilter, threatFilter])

  const getIndicatorIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4" />
      case 'domain': return <Globe className="h-4 w-4" />
      case 'hash': return <Hash className="h-4 w-4" />
      case 'url': return <Link className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
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

  const exportIndicators = () => {
    const data = JSON.stringify(filteredIndicators, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `indicators-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const createCaseFromIndicator = (indicator: any) => {
    const newCase = db.createCase({
      title: `Investigation: ${indicator.indicator}`,
      description: `Case created from ${indicator.threatLevel} threat level indicator`,
      priority: indicator.threatLevel === 'high' ? 'critical' : indicator.threatLevel === 'medium' ? 'high' : 'medium',
      status: 'open',
      indicators: [indicator.indicator],
      tags: [indicator.type, indicator.threatLevel]
    })
    
    // Redirect to the new case
    router.push(`/cases?highlight=${newCase.id}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicators of Compromise</h1>
          <p className="text-muted-foreground">
            Manage and analyze threat indicators across your security operations
          </p>
        </div>
        
        <Button onClick={exportIndicators} disabled={filteredIndicators.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export IOCs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="hash">Hash</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={threatFilter} onValueChange={setThreatFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Threat Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Indicators</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicators.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Threat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {indicators.filter(i => i.threatLevel === 'high').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Threat</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {indicators.filter(i => i.threatLevel === 'medium').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Threat</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {indicators.filter(i => i.threatLevel === 'low').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicators List */}
      <div className="space-y-4">
        {filteredIndicators.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No indicators found</p>
                <p>Start analyzing threats to build your indicator database</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredIndicators.map((indicator) => (
            <Card key={indicator.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getIndicatorIcon(indicator.type)}
                      <CardTitle className="text-lg font-mono">
                        {indicator.indicator.length > 50 
                          ? `${indicator.indicator.substring(0, 50)}...` 
                          : indicator.indicator
                        }
                      </CardTitle>
                      <Badge variant={getThreatColor(indicator.threatLevel) as any}>
                        {indicator.threatLevel}
                      </Badge>
                      <Badge variant="outline">
                        {indicator.type.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Analyzed on {formatDate(indicator.timestamp)}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => createCaseFromIndicator(indicator)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-muted-foreground capitalize">{indicator.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p className="text-muted-foreground">{indicator.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Threat Level:</span>
                    <p className="text-muted-foreground capitalize">{indicator.threatLevel}</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Seen:</span>
                    <p className="text-muted-foreground">{formatDate(indicator.timestamp)}</p>
                  </div>
                </div>
                
                {indicator.results?.virusTotal && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">VirusTotal Results</h4>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {indicator.results.virusTotal.data?.attributes?.last_analysis_stats?.malicious || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Malicious</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">
                          {indicator.results.virusTotal.data?.attributes?.last_analysis_stats?.suspicious || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Suspicious</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {indicator.results.virusTotal.data?.attributes?.last_analysis_stats?.harmless || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Harmless</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">
                          {indicator.results.virusTotal.data?.attributes?.last_analysis_stats?.undetected || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Undetected</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}