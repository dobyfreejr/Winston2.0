'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Download
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CustomThreatFeed } from '@/types/threat-feeds'

export function CustomFeedsManager() {
  const [feeds, setFeeds] = useState<CustomThreatFeed[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newFeed, setNewFeed] = useState({
    name: '',
    description: '',
    url: '',
    type: 'json' as const,
    format: 'ioc_list' as const,
    refresh_interval: 60,
    enabled: true,
    authentication: {
      type: 'none' as const,
      credentials: {}
    },
    fields: {
      indicator_field: 'indicator',
      type_field: 'type',
      confidence_field: 'confidence',
      tags_field: 'tags'
    }
  })

  useEffect(() => {
    fetchFeeds()
  }, [])

  const fetchFeeds = async () => {
    try {
      const response = await fetch('/api/threat-feeds')
      if (response.ok) {
        const data = await response.json()
        setFeeds(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching feeds:', error)
    }
  }

  const createFeed = async () => {
    if (!newFeed.name || !newFeed.url) return

    try {
      const response = await fetch('/api/threat-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeed)
      })

      if (response.ok) {
        await fetchFeeds()
        setIsCreateDialogOpen(false)
        setNewFeed({
          name: '',
          description: '',
          url: '',
          type: 'json',
          format: 'ioc_list',
          refresh_interval: 60,
          enabled: true,
          authentication: { type: 'none', credentials: {} },
          fields: {
            indicator_field: 'indicator',
            type_field: 'type',
            confidence_field: 'confidence',
            tags_field: 'tags'
          }
        })
      }
    } catch (error) {
      console.error('Error creating feed:', error)
    }
  }

  const toggleFeed = async (feedId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/threat-feeds/${feedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })

      if (response.ok) {
        await fetchFeeds()
      }
    } catch (error) {
      console.error('Error toggling feed:', error)
    }
  }

  const ingestFeed = async (feedId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/threat-feeds/${feedId}/ingest`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchFeeds()
      }
    } catch (error) {
      console.error('Error ingesting feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteFeed = async (feedId: string) => {
    try {
      const response = await fetch(`/api/threat-feeds/${feedId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchFeeds()
      }
    } catch (error) {
      console.error('Error deleting feed:', error)
    }
  }

  const getStatusIcon = (feed: CustomThreatFeed) => {
    if (!feed.enabled) return <Pause className="h-4 w-4 text-gray-500" />
    if (feed.last_error) return <XCircle className="h-4 w-4 text-red-500" />
    if (feed.last_updated) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStatusColor = (feed: CustomThreatFeed) => {
    if (!feed.enabled) return 'outline'
    if (feed.last_error) return 'destructive'
    if (feed.last_updated) return 'secondary'
    return 'default'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Custom Threat Intelligence Feeds</h3>
          <p className="text-sm text-muted-foreground">
            Configure and manage your custom threat intelligence data sources
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Custom Threat Feed</DialogTitle>
              <DialogDescription>
                Add a new threat intelligence data source
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="auth">Authentication</TabsTrigger>
                <TabsTrigger value="fields">Field Mapping</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">Feed Name</Label>
                  <Input
                    id="name"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({...newFeed, name: e.target.value})}
                    placeholder="My Threat Feed"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newFeed.description}
                    onChange={(e) => setNewFeed({...newFeed, description: e.target.value})}
                    placeholder="Description of the threat feed..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="url">Feed URL</Label>
                  <Input
                    id="url"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({...newFeed, url: e.target.value})}
                    placeholder="https://example.com/threat-feed.json"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Data Type</Label>
                    <Select value={newFeed.type} onValueChange={(value: any) => setNewFeed({...newFeed, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="txt">Text (Line-separated)</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="refresh">Refresh Interval (minutes)</Label>
                    <Input
                      id="refresh"
                      type="number"
                      value={newFeed.refresh_interval}
                      onChange={(e) => setNewFeed({...newFeed, refresh_interval: parseInt(e.target.value) || 60})}
                      min="5"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="auth" className="space-y-4">
                <div>
                  <Label htmlFor="auth-type">Authentication Type</Label>
                  <Select 
                    value={newFeed.authentication.type} 
                    onValueChange={(value: any) => setNewFeed({
                      ...newFeed, 
                      authentication: { ...newFeed.authentication, type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newFeed.authentication.type === 'api_key' && (
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={newFeed.authentication.credentials?.api_key || ''}
                      onChange={(e) => setNewFeed({
                        ...newFeed,
                        authentication: {
                          ...newFeed.authentication,
                          credentials: { ...newFeed.authentication.credentials, api_key: e.target.value }
                        }
                      })}
                      placeholder="Your API key..."
                    />
                  </div>
                )}
                
                {newFeed.authentication.type === 'bearer' && (
                  <div>
                    <Label htmlFor="token">Bearer Token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={newFeed.authentication.credentials?.token || ''}
                      onChange={(e) => setNewFeed({
                        ...newFeed,
                        authentication: {
                          ...newFeed.authentication,
                          credentials: { ...newFeed.authentication.credentials, token: e.target.value }
                        }
                      })}
                      placeholder="Your bearer token..."
                    />
                  </div>
                )}
                
                {newFeed.authentication.type === 'basic' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newFeed.authentication.credentials?.username || ''}
                        onChange={(e) => setNewFeed({
                          ...newFeed,
                          authentication: {
                            ...newFeed.authentication,
                            credentials: { ...newFeed.authentication.credentials, username: e.target.value }
                          }
                        })}
                        placeholder="Username..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newFeed.authentication.credentials?.password || ''}
                        onChange={(e) => setNewFeed({
                          ...newFeed,
                          authentication: {
                            ...newFeed.authentication,
                            credentials: { ...newFeed.authentication.credentials, password: e.target.value }
                          }
                        })}
                        placeholder="Password..."
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="fields" className="space-y-4">
                <div>
                  <Label htmlFor="indicator-field">Indicator Field</Label>
                  <Input
                    id="indicator-field"
                    value={newFeed.fields.indicator_field}
                    onChange={(e) => setNewFeed({
                      ...newFeed,
                      fields: { ...newFeed.fields, indicator_field: e.target.value }
                    })}
                    placeholder="indicator"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type-field">Type Field (optional)</Label>
                  <Input
                    id="type-field"
                    value={newFeed.fields.type_field || ''}
                    onChange={(e) => setNewFeed({
                      ...newFeed,
                      fields: { ...newFeed.fields, type_field: e.target.value }
                    })}
                    placeholder="type"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confidence-field">Confidence Field (optional)</Label>
                  <Input
                    id="confidence-field"
                    value={newFeed.fields.confidence_field || ''}
                    onChange={(e) => setNewFeed({
                      ...newFeed,
                      fields: { ...newFeed.fields, confidence_field: e.target.value }
                    })}
                    placeholder="confidence"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags-field">Tags Field (optional)</Label>
                  <Input
                    id="tags-field"
                    value={newFeed.fields.tags_field || ''}
                    onChange={(e) => setNewFeed({
                      ...newFeed,
                      fields: { ...newFeed.fields, tags_field: e.target.value }
                    })}
                    placeholder="tags"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createFeed}>
                Create Feed
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Feeds List */}
      <div className="space-y-4">
        {feeds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No custom feeds configured</p>
                <p>Add your first threat intelligence feed to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          feeds.map((feed) => (
            <Card key={feed.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{feed.name}</CardTitle>
                      <Badge variant={getStatusColor(feed) as any}>
                        {getStatusIcon(feed)}
                        <span className="ml-1">
                          {!feed.enabled ? 'Disabled' : 
                           feed.last_error ? 'Error' : 
                           feed.last_updated ? 'Active' : 'Pending'}
                        </span>
                      </Badge>
                      <Badge variant="outline">{feed.type.toUpperCase()}</Badge>
                    </div>
                    <CardDescription>{feed.description}</CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeed(feed.id, !feed.enabled)}
                    >
                      {feed.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => ingestFeed(feed.id)}
                      disabled={loading || !feed.enabled}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFeed(feed.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Indicators:</span>
                      <p className="text-muted-foreground">{feed.indicator_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Refresh:</span>
                      <p className="text-muted-foreground">{feed.refresh_interval}m</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Update:</span>
                      <p className="text-muted-foreground">
                        {feed.last_updated ? formatDate(feed.last_updated) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <p className="text-muted-foreground">
                        {feed.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  
                  {feed.last_error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {feed.last_error}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="font-medium">URL:</span>
                    <p className="text-muted-foreground font-mono break-all">{feed.url}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}