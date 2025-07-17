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
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/database'

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [filteredCases, setFilteredCases] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    priority: 'medium',
    indicators: '',
    assignee: '',
    tags: ''
  })

  useEffect(() => {
    const updateCases = () => {
      const allCases = db.getCases()
      setCases(allCases)
      setFilteredCases(allCases)
    }
    
    updateCases()
    const interval = setInterval(updateCases, 5000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let filtered = cases

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.indicators.some((ind: string) => ind.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === priorityFilter)
    }

    setFilteredCases(filtered)
  }, [cases, searchTerm, statusFilter, priorityFilter])

  const handleCreateCase = () => {
    if (!newCase.title.trim()) return

    const indicators = newCase.indicators.split(',').map(i => i.trim()).filter(i => i)
    const tags = newCase.tags.split(',').map(t => t.trim()).filter(t => t)

    db.createCase({
      title: newCase.title,
      description: newCase.description,
      priority: newCase.priority as any,
      status: 'open',
      indicators,
      assignee: newCase.assignee || undefined,
      tags
    })

    setNewCase({
      title: '',
      description: '',
      priority: 'medium',
      indicators: '',
      assignee: '',
      tags: ''
    })
    setIsCreateDialogOpen(false)
  }

  const updateCaseStatus = (caseId: string, status: string) => {
    db.updateCase(caseId, { status: status as any })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive'
      case 'investigating': return 'default'
      case 'resolved': return 'secondary'
      case 'closed': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground">
            Manage security investigations and incident response cases
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
              <DialogDescription>
                Create a new investigation case for security incidents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Case Title</Label>
                <Input
                  id="title"
                  value={newCase.title}
                  onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                  placeholder="Enter case title..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCase.description}
                  onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                  placeholder="Describe the security incident or investigation..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newCase.priority} onValueChange={(value) => setNewCase({...newCase, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignee">Assignee</Label>
                  <Input
                    id="assignee"
                    value={newCase.assignee}
                    onChange={(e) => setNewCase({...newCase, assignee: e.target.value})}
                    placeholder="Assigned analyst..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="indicators">Indicators (comma-separated)</Label>
                <Input
                  id="indicators"
                  value={newCase.indicators}
                  onChange={(e) => setNewCase({...newCase, indicators: e.target.value})}
                  placeholder="192.168.1.1, malware.exe, suspicious-domain.com"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newCase.tags}
                  onChange={(e) => setNewCase({...newCase, tags: e.target.value})}
                  placeholder="malware, phishing, apt"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCase}>
                  Create Case
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No cases found</p>
                <p>Create your first case to start managing security investigations</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((case_) => (
            <Card key={case_.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{case_.title}</CardTitle>
                      <Badge variant={getPriorityColor(case_.priority) as any}>
                        {case_.priority}
                      </Badge>
                      <Badge variant={getStatusColor(case_.status) as any}>
                        {case_.status}
                      </Badge>
                    </div>
                    <CardDescription>{case_.description}</CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select value={case_.status} onValueChange={(value) => updateCaseStatus(case_.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Case ID:</span>
                      <p className="text-muted-foreground">{case_.id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <p className="text-muted-foreground">{formatDate(case_.createdAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <p className="text-muted-foreground">{formatDate(case_.updatedAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Assignee:</span>
                      <p className="text-muted-foreground">{case_.assignee || 'Unassigned'}</p>
                    </div>
                  </div>
                  
                  {case_.indicators.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Indicators:</span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {case_.indicators.map((indicator: string) => (
                          <Badge key={indicator} variant="outline" className="font-mono text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {case_.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Tags:</span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {case_.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
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
    </div>
  )
}