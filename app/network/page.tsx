'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Activity, 
  Network,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Trash2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface NetworkConnection {
  id: string
  sourceIp: string
  destIp: string
  sourcePort: number
  destPort: number
  protocol: 'TCP' | 'UDP' | 'ICMP'
  status: 'active' | 'closed' | 'suspicious'
  bytes: number
  packets: number
  timestamp: Date
  country: string
  threatLevel: 'high' | 'medium' | 'low'
}

interface NetworkAsset {
  id: string
  ip: string
  hostname: string
  type: 'server' | 'workstation' | 'router' | 'firewall' | 'unknown'
  os: string
  status: 'online' | 'offline' | 'suspicious'
  lastSeen: Date
  openPorts: number[]
  vulnerabilities: number
}

export default function NetworkPage() {
  const [connections, setConnections] = useState<NetworkConnection[]>([])
  const [assets, setAssets] = useState<NetworkAsset[]>([])

  const [filteredConnections, setFilteredConnections] = useState(connections)
  const [filteredAssets, setFilteredAssets] = useState(assets)
  const [connectionFilter, setConnectionFilter] = useState('all')
  const [assetFilter, setAssetFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch connections
      const connectionsResponse = await fetch('/api/network/connections?type=connections')
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        setConnections(connectionsData.data || [])
      }

      // Fetch assets
      const assetsResponse = await fetch('/api/network/connections?type=assets')
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        setAssets(assetsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching network data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clear all data
  const clearData = async (type: 'connections' | 'assets') => {
    try {
      const response = await fetch(`/api/network/connections?type=${type}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        if (type === 'connections') {
          setConnections([])
        } else {
          setAssets([])
        }
      }
    } catch (error) {
      console.error(`Error clearing ${type}:`, error)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = connections

    if (searchTerm) {
      filtered = filtered.filter(conn => 
        conn.sourceIp.includes(searchTerm) ||
        conn.destIp.includes(searchTerm) ||
        conn.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (connectionFilter !== 'all') {
      filtered = filtered.filter(conn => conn.status === connectionFilter)
    }

    setFilteredConnections(filtered)
  }, [connections, searchTerm, connectionFilter])

  useEffect(() => {
    let filtered = assets

    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.ip.includes(searchTerm) ||
        asset.hostname.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (assetFilter !== 'all') {
      filtered = filtered.filter(asset => asset.status === assetFilter)
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm, assetFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online': return 'secondary'
      case 'suspicious': return 'default'
      case 'closed':
      case 'offline': return 'outline'
      default: return 'outline'
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const suspiciousConnections = connections.filter(c => c.status === 'suspicious').length
  const activeConnections = connections.filter(c => c.status === 'active').length
  const onlineAssets = assets.filter(a => a.status === 'online').length
  const vulnerableAssets = assets.filter(a => a.vulnerabilities > 0).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Analysis</h1>
          <p className="text-muted-foreground">
            Real-time network connections and asset monitoring via API
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeConnections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{suspiciousConnections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Assets</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineAssets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable Assets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{vulnerableAssets}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections">Network Connections</TabsTrigger>
          <TabsTrigger value="assets">Network Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Connection Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search connections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={connectionFilter} onValueChange={setConnectionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => clearData('connections')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connections List */}
          <div className="space-y-4">
            {filteredConnections.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No network connections</p>
                    <p>Send data to <code>/api/network/connections</code> to see connections here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg font-mono">
                            {connection.sourceIp}:{connection.sourcePort} → {connection.destIp}:{connection.destPort}
                          </CardTitle>
                          <Badge variant={getStatusColor(connection.status) as any}>
                            {connection.status}
                          </Badge>
                          <Badge variant={getThreatColor(connection.threatLevel) as any}>
                            {connection.threatLevel}
                          </Badge>
                          <Badge variant="outline">
                            {connection.protocol}
                          </Badge>
                        </div>
                        <CardDescription>
                          {connection.country} • {formatDate(connection.timestamp)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Protocol:</span>
                        <p className="text-muted-foreground">{connection.protocol}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data Transfer:</span>
                        <p className="text-muted-foreground">{formatBytes(connection.bytes)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Packets:</span>
                        <p className="text-muted-foreground">{connection.packets.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium">Country:</span>
                        <p className="text-muted-foreground">{connection.country}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          {/* Asset Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => clearData('assets')}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assets List */}
          <div className="space-y-4">
            {filteredAssets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No network assets</p>
                    <p>Send data to <code>/api/network/connections</code> to see assets here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAssets.map((asset) => (
                <Card key={asset.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">
                            {asset.hostname} ({asset.ip})
                          </CardTitle>
                          <Badge variant={getStatusColor(asset.status) as any}>
                            {asset.status}
                          </Badge>
                          <Badge variant="outline">
                            {asset.type}
                          </Badge>
                          {asset.vulnerabilities > 0 && (
                            <Badge variant="destructive">
                              {asset.vulnerabilities} vulnerabilities
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {asset.os} • Last seen: {formatDate(asset.lastSeen)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>
                          <p className="text-muted-foreground capitalize">{asset.type}</p>
                        </div>
                        <div>
                          <span className="font-medium">OS:</span>
                          <p className="text-muted-foreground">{asset.os}</p>
                        </div>
                        <div>
                          <span className="font-medium">Open Ports:</span>
                          <p className="text-muted-foreground">{asset.openPorts.length}</p>
                        </div>
                        <div>
                          <span className="font-medium">Vulnerabilities:</span>
                          <p className="text-muted-foreground">{asset.vulnerabilities}</p>
                        </div>
                      </div>
                      
                      {asset.openPorts.length > 0 && (
                        <div>
                          <span className="font-medium text-sm">Open Ports:</span>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {asset.openPorts.map((port) => (
                              <Badge key={port} variant="secondary" className="text-xs font-mono">
                                {port}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}