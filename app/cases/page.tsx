'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Filter, Eye, Edit, Trash2, MessageSquare, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { db } from '@/lib/database'
import { logger } from '@/lib/logger'

export default function CasesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightCaseId = searchParams.get('highlight')
  
  const [cases, setCases] = useState<any[]>([])
  const [filteredCases, setFilteredCases] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    priority: 'medium',
    indicators: '',
    assignee: '',
    tags: '',
    linkedCases: [] as string[]
  })
  const [linkCaseId, setLinkCaseId] = useState('')
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [selectedCaseForLinking, setSelectedCaseForLinking] = useState<any>(null)

  useEffect(() => {
    const updateCases = () => {
      const allCases = db.getCases()
      setCases(allCases)
      setFilteredCases(allCases)
      
      // Auto-open case details if highlighted
      if (highlightCaseId) {
        const highlightedCase = allCases.find(c => c.id === highlightCaseId)
        if (highlightedCase) {
          setSelectedCase(highlightedCase)
          setIsDetailsDialogOpen(true)
          // Clear the highlight parameter
          router.replace('/cases')
        }
      }
    }
    
    updateCases()
    const interval = setInterval(updateCases, 5000)
    
    return () => clearInterval(interval)
  }, [highlightCaseId, router])

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

    const createdCase = db.createCase({
      title: newCase.title,
      description: newCase.description,
      priority: newCase.priority as any,
      status: 'open',
      indicators,
      assignee: newCase.assignee || undefined,
      tags,
      linkedCases: []
    })

    logger.info('case', `Case created: ${newCase.title}`, { caseId: createdCase.id })

    setNewCase({
      title: '',
      description: '',
      priority: 'medium',
      indicators: '',
      assignee: '',
      tags: '',
      linkedCases: []
    })
    setIsCreateDialogOpen(false)
  }

  const updateCaseStatus = (caseId: string, status: string) => {
    db.updateCase(caseId, { status: status as any })
    db.addCaseNote(caseId, `Status changed to ${status}`, 'System', 'status_change')
    logger.info('case', `Case status updated: ${caseId} -> ${status}`)
  }
  
  const linkCases = (caseId1: string, caseId2: string) => {
    db.linkCases(caseId1, caseId2, 'Admin')
    logger.info('case', `Cases linked: ${caseId1} <-> ${caseId2}`)
    // Refresh cases
    const allCases = db.getCases()
    setCases(allCases)
    setFilteredCases(allCases)
  }
  
  const unlinkCases = (caseId1: string, caseId2: string) => {
    db.unlinkCases(caseId1, caseId2, 'Admin')
    logger.info('case', `Cases unlinked: ${caseId1} <-> ${caseId2}`)
    // Refresh cases
    const allCases = db.getCases()
    setCases(allCases)
    setFilteredCases(allCases)
  }
  
  const openLinkDialog = (case_: any) => {
    setSelectedCaseForLinking(case_)
    setIsLinkDialogOpen(true)
  }
  
  const addNote = () => {
    if (!newNote.trim() || !selectedCase) return
    
    db.addCaseNote(selectedCase.id, newNote, 'Admin', 'note')
    setNewNote('')
    logger.info('case', `Note added to case: ${selectedCase.id}`)
    
    // Refresh case data
    const updatedCase = db.getCases().find(c => c.id === selectedCase.id)
    setSelectedCase(updatedCase)
  }
  
  const openCaseDetails = (case_: any) => {
    setSelectedCase(case_)
    setIsDetailsDialogOpen(true)
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
              <CardHeader className={highlightCaseId === case_.id ? 'bg-blue-50 border-blue-200' : ''}>
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
                    
                    <Button variant="outline" size="sm" onClick={() => openCaseDetails(case_)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
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
                      <span className="font-medium">Assignee:</span>
                      <p className="text-muted-foreground">{case_.assignee || 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <p className="text-muted-foreground">{formatDate(case_.updatedAt)}</p>
                    </div>
                  </div>
                  
                  {/* Case Summary */}
                  {case_.summary && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="font-medium text-sm text-blue-800">Summary:</span>
                      <p className="text-sm text-blue-700 mt-1">{case_.summary}</p>
                    </div>
                  )}
                  
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
                  
                  {/* Linked Cases */}
                  {case_.linkedCases && case_.linkedCases.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Linked Cases:</span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {case_.linkedCases.map((linkedId: string) => {
                          const linkedCase = cases.find(c => c.id === linkedId)
                          return linkedCase ? (
                            <div key={linkedId} className="flex items-center space-x-1">
                              <Badge variant="outline" className="text-xs">
                                {linkedCase.title.length > 20 
                                  ? `${linkedCase.title.substring(0, 20)}...` 
                                  : linkedCase.title
                                }
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                                onClick={() => unlinkCases(case_.id, linkedId)}
                              >
                                ×
                              </Button>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Link Cases Button */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLinkDialog(case_)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Link Case
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Case Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Case Details: {selectedCase?.title}</span>
              <Badge variant={getPriorityColor(selectedCase?.priority) as any}>
                {selectedCase?.priority}
              </Badge>
              <Badge variant={getStatusColor(selectedCase?.status) as any}>
                {selectedCase?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Case ID: {selectedCase?.id} • Created: {selectedCase && formatDate(selectedCase.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6">
              {/* Case Summary */}
              {selectedCase.summary && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">Case Summary</h4>
                  <p className="text-sm text-blue-700">{selectedCase.summary}</p>
                </div>
              )}
              
              {/* Case Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Assignee</h4>
                  <p className="text-sm text-muted-foreground">{selectedCase.assignee || 'Unassigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Created</h4>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedCase.createdAt)}</p>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedCase.description}</p>
              </div>
              
              {/* Indicators */}
              {selectedCase.indicators.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Indicators of Compromise</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCase.indicators.map((indicator: string) => (
                      <Badge key={indicator} variant="outline" className="font-mono text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {selectedCase.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedCase.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Linked Cases */}
              {selectedCase.linkedCases && selectedCase.linkedCases.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Linked Cases</h4>
                  <div className="space-y-2">
                    {selectedCase.linkedCases.map((linkedId: string) => {
                      const linkedCase = cases.find(c => c.id === linkedId)
                      return linkedCase ? (
                        <div key={linkedId} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{linkedCase.title}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unlinkCases(selectedCase.id, linkedId)}
                          >
                            Unlink
                          </Button>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
              
              {/* Notes Section */}
              <div>
                <h4 className="font-medium mb-4">Case Notes</h4>
                
                {/* Add Note */}
                <div className="flex space-x-2 mb-4">
                  <Textarea
                    placeholder="Add a note to this case..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={addNote} disabled={!newNote.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
                
                {/* Notes List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedCase.notes && selectedCase.notes.length > 0 ? (
                    selectedCase.notes.map((note: any) => (
                      <div key={note.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={note.type === 'status_change' ? 'default' : 'secondary'} className="text-xs">
                              {note.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{note.author}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(note.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Add the first note to start documenting this investigation.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Link Cases Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Cases</DialogTitle>
            <DialogDescription>
              Link "{selectedCaseForLinking?.title}" to another case
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-case">Select Case to Link</Label>
              <Select value={linkCaseId} onValueChange={setLinkCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a case..." />
                </SelectTrigger>
                <SelectContent>
                  {cases
                    .filter(c => c.id !== selectedCaseForLinking?.id && 
                                !selectedCaseForLinking?.linkedCases?.includes(c.id))
                    .map((case_) => (
                      <SelectItem key={case_.id} value={case_.id}>
                        {case_.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (linkCaseId && selectedCaseForLinking) {
                    linkCases(selectedCaseForLinking.id, linkCaseId)
                    setIsLinkDialogOpen(false)
                    setLinkCaseId('')
                  }
                }}
                disabled={!linkCaseId}
              >
                Link Cases
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}