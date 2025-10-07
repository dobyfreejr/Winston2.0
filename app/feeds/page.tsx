'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Globe, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  Plus,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CustomFeedsManager } from '@/components/threat-feeds/custom-feeds-manager'

interface ThreatFeed {
  id: string
  name: string
  description: string
  type: 'commercial' | 'open_source' | 'government' | 'community'
  status: 'active' | 'inactive' | 'error'
  lastUpdate: Date
  indicatorCount: number
  url?: string
  apiKey?: boolean
  categories: string[]
}

export default function FeedsPage() {
  const [feeds, setFeeds] = useState<ThreatFeed[]>([
    {
      id: '1',
      name: 'VirusTotal Intelligence',
      description: 'Comprehensive malware and URL analysis from VirusTotal',
      type: 'commercial',
      status: 'active',
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      indicatorCount: 1250000,
      apiKey: true,
      categories: ['malware', 'urls', 'domains', 'ips']
    },
    {
      id: '2',
      name: 'Malware Bazaar',
      description: 'Free malware sample database by abuse.ch',
      type: 'open_source',
      status: 'active',
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      indicatorCount: 450000,
      url: 'https://bazaar.abuse.ch/',
      categories: ['malware', 'hashes']
    },
    {
      id: '3',
      name: 'AbuseIPDB',
      description: 'Community-driven IP abuse reporting database',
      type: 'community',
      status: 'active',
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
      indicatorCount: 2800000,
      apiKey: true,
      categories: ['ips', 'abuse']
    },
    {
      id: '4',
      name: 'URLVoid',
      description: 'URL reputation and safety checking service',
      type: 'commercial',
      status: 'inactive',
      lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      indicatorCount: 890000,
      apiKey: true,
      categories: ['urls', 'domains']
    },
    {
      id: '5',
      name: 'Feodo Tracker',
      description: 'Botnet C&C tracker by abuse.ch',
      type: 'open_source',
      status: 'active',
      lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
      indicatorCount: 15000,
      url: 'https://feodotracker.abuse.ch/',
      categories: ['botnet', 'c2', 'ips']
    },
    {
      id: '6',
      name: 'MISP Threat Sharing',
      description: 'Open source threat intelligence platform',
      type: 'open_source',
      status: 'error',
      lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      indicatorCount: 750000,
      categories: ['iocs', 'apt', 'malware']
    }
  ])

  const [filteredFeeds, setFilteredFeeds] = useState<ThreatFeed[]>(feeds)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let filtered = feeds

    if (searchTerm) {
      filtered = filtered.filter(feed => 
        feed.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feed.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(feed => feed.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(feed => feed.status === statusFilter)
    }

    setFilteredFeeds(filtered)
  }, [feeds, searchTerm, typeFilter, statusFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'secondary'
      case 'error': return 'destructive'
      default: return 'default'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'commercial': return 'default'
      case 'open_source': return 'secondary'
      case 'government': return 'outline'
      case 'community': return 'outline'
      default: return 'outline'
    }
  }

  const refreshFeed = (feedId: string) => {
    setFeeds(feeds.map(feed => 
      feed.id === feedId 
        ? { ...feed, lastUpdate: new Date(), status: 'active' as const }
        : feed
    ))
  }

  const totalIndicators = feeds.reduce((sum, feed) => sum + feed.indicatorCount, 0)
  const activeFeeds = feeds.filter(feed => feed.status === 'active').length
  const errorFeeds = feeds.filter(feed => feed.status === 'error').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Feeds</h1>
          <p className="text-muted-foreground">
            Manage and monitor your threat intelligence data sources
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Feed
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feeds</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Feeds</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeFeeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Feeds</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorFeeds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Indicators</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIndicators.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search feeds..."
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
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="open_source">Open Source</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="custom">Custom Feeds</TabsTrigger>
          <TabsTrigger value="commercial">Commercial</TabsTrigger>
          <TabsTrigger value="opensource">Open Source</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No feeds found</p>
                <p>Adjust your filters or add new threat intelligence feeds</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <CustomFeedsManager />
        </TabsContent>

        <TabsContent value="commercial" className="space-y-4">
          {/* Feeds List */}
          <div className="space-y-4">
            {filteredFeeds.filter(f => f.type === 'commercial').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No commercial feeds found</p>
                    <p>Configure your commercial threat intelligence providers</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredFeeds.filter(f => f.type === 'commercial').map((feed) => (
                <Card key={feed.id}>
                  {/* Same feed card content as before */}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="opensource" className="space-y-4">
          <div className="space-y-4">
            {filteredFeeds.filter(f => f.type === 'open_source').map((feed) => (
              <Card key={feed.id}>
                {/* Same feed card content as before */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="space-y-4">
            {filteredFeeds.filter(f => f.type === 'community').map((feed) => (
                <Card key={feed.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{feed.name}</CardTitle>
                          <Badge variant={getTypeColor(feed.type) as any}>
                            {feed.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getStatusColor(feed.status) as any}>
                            {getStatusIcon(feed.status)}
                            <span className="ml-1">{feed.status}</span>
                          </Badge>
                          {feed.apiKey && (
                            <Badge variant="outline">API Key Required</Badge>
                          )}
                        </div>
                        <CardDescription>{feed.description}</CardDescription>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => refreshFeed(feed.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        
                        {feed.url && (
                          <a href={feed.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Indicators:</span>
                          <p className="text-muted-foreground">{feed.indicatorCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Last Update:</span>
                          <p className="text-muted-foreground">{formatDate(feed.lastUpdate)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <p className="text-muted-foreground capitalize">{feed.status}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-sm">Categories:</span>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {feed.categories.map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}