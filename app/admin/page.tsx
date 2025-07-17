'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Database, 
  Trash2, 
  Download,
  RefreshCw,
  Server,
  Users,
  Settings,
  BarChart3
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { logger, LogEntry } from '@/lib/logger'
import { db } from '@/lib/database'
import { auth, User } from '@/lib/auth'
import { UserManagement } from '@/components/auth/user-management'

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logStats, setLogStats] = useState<any>({})
  const [systemStats, setSystemStats] = useState<any>({})
  const [logFilter, setLogFilter] = useState({
    level: 'all',
    category: 'all',
    search: ''
  })

  useEffect(() => {
    const user = auth.getCurrentUser()
    if (!user || !auth.hasPermission(user, 'admin_panel')) {
      router.push('/')
      return
    }
    setCurrentUser(user)
    
    const updateData = () => {
      setLogs(logger.getLogs(100))
      setLogStats(logger.getLogStats())
      setSystemStats(db.getStats())
    }
    
    updateData()
    const interval = setInterval(updateData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (!currentUser || !auth.hasPermission(currentUser, 'admin_panel')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin privileges required to access this page</p>
        </div>
      </div>
    )
  }

  const filteredLogs = logs.filter(log => {
    if (logFilter.level !== 'all' && log.level !== logFilter.level) return false
    if (logFilter.category !== 'all' && log.category !== logFilter.category) return false
    if (logFilter.search && !log.message.toLowerCase().includes(logFilter.search.toLowerCase())) return false
    return true
  })

  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
    logger.info('system', 'Logs cleared by admin')
  }

  const exportLogs = () => {
    const logData = JSON.stringify(logs, null, 2)
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soc-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    logger.info('system', 'Logs exported by admin')
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warn': return 'default'
      case 'info': return 'secondary'
      case 'debug': return 'outline'
      default: return 'outline'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="h-4 w-4" />
      case 'api': return <Database className="h-4 w-4" />
      case 'user': return <Users className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'case': return <AlertTriangle className="h-4 w-4" />
      case 'analysis': return <BarChart3 className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          System monitoring, logging, and administrative controls
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logStats.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {logStats.last24h || 0} in last 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{logStats.errors24h || 0}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.activeInvestigations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemStats.criticalCases || 0} critical
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemStats.analysisRequests || 0}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>

          {/* Log Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Log Categories</CardTitle>
              <CardDescription>Distribution of log entries by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(logStats.byCategory || {}).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className="capitalize">{category}</span>
                    </div>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Log Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Real-time system activity and error logs</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search logs..."
                  value={logFilter.search}
                  onChange={(e) => setLogFilter({...logFilter, search: e.target.value})}
                  className="max-w-sm"
                />
                
                <Select value={logFilter.level} onValueChange={(value) => setLogFilter({...logFilter, level: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={logFilter.category} onValueChange={(value) => setLogFilter({...logFilter, category: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="case">Case</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Log Entries */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No logs found</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0">
                        {getCategoryIcon(log.category)}
                        <Badge variant={getLevelColor(log.level) as any} className="text-xs">
                          {log.level}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{log.message}</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                          <span>{log.category}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                          {log.userId && (
                            <>
                              <span>•</span>
                              <span>User: {log.userId}</span>
                            </>
                          )}
                        </div>
                        {log.details && (
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
              <CardDescription>Current database usage and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemStats.totalCases || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Cases</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemStats.resolvedCases || 0}</div>
                  <div className="text-sm text-muted-foreground">Resolved Cases</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemStats.threatsDetected || 0}</div>
                  <div className="text-sm text-muted-foreground">Threats Detected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemStats.analysisRequests || 0}</div>
                  <div className="text-sm text-muted-foreground">Analysis Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Administrative configuration options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-refresh Dashboard</h4>
                    <p className="text-sm text-muted-foreground">Automatically refresh dashboard data</p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Log Retention</h4>
                    <p className="text-sm text-muted-foreground">Keep logs for specified duration</p>
                  </div>
                  <Badge variant="secondary">1000 entries</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">API Rate Limiting</h4>
                    <p className="text-sm text-muted-foreground">Respect external API rate limits</p>
                  </div>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}