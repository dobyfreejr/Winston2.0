'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Search, Loader2, AlertTriangle, Shield, Globe, Hash, Link, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  analyzeWithVirusTotal, 
  getIPGeolocation, 
  getDomainInfo, 
  searchMalwareBazaar, 
  enrichThreatIntelligence 
} from '@/lib/threat-intel-api'
import { VirusTotalResponse, IPGeolocation, DomainInfo, MalwareSample, ThreatIntelligence } from '@/types/threat-intel'
import { formatDate, formatBytes } from '@/lib/utils'
import { db } from '@/lib/database'
import { activityTracker } from '@/lib/activity-tracker'

export function IndicatorLookup() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [indicator, setIndicator] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    virusTotal?: VirusTotalResponse
    ipGeo?: IPGeolocation
    domainInfo?: DomainInfo
    malwareSamples?: MalwareSample[]
    threatIntel?: ThreatIntelligence
  }>({})

  // Auto-populate indicator from URL params
  useEffect(() => {
    const urlIndicator = searchParams.get('indicator')
    if (urlIndicator) {
      setIndicator(urlIndicator)
    }
  }, [searchParams])

  const detectIndicatorType = (value: string): 'ip' | 'domain' | 'hash' | 'url' => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    const hashRegex = /^[a-fA-F0-9]{32,64}$/
    const urlRegex = /^https?:\/\//
    
    if (ipRegex.test(value)) return 'ip'
    if (hashRegex.test(value)) return 'hash'
    if (urlRegex.test(value)) return 'url'
    return 'domain'
  }

  const isValidIndicatorFormat = (value: string, type: 'ip' | 'domain' | 'hash' | 'url'): boolean => {
    const cleanValue = value.trim()
    
    switch (type) {
      case 'ip':
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        return ipRegex.test(cleanValue)
      
      case 'domain':
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        return domainRegex.test(cleanValue) && cleanValue.length <= 253 && !cleanValue.includes('..')
      
      case 'hash':
        const hashRegex = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/
        return hashRegex.test(cleanValue)
      
      case 'url':
        try {
          new URL(cleanValue)
          return cleanValue.startsWith('http://') || cleanValue.startsWith('https://')
        } catch {
          return false
        }
      
      default:
        return false
    }
  }

  const [validationError, setValidationError] = useState<string>('')

  const handleAnalyze = async () => {
    if (!indicator.trim()) return
    
    const cleanIndicator = indicator.trim()
    const type = detectIndicatorType(cleanIndicator)
    
    // Validate indicator format
    if (!isValidIndicatorFormat(cleanIndicator, type)) {
      let errorMessage = ''
      switch (type) {
        case 'ip':
          errorMessage = 'Invalid IP address format. Please enter a valid IPv4 address (e.g., 192.168.1.1)'
          break
        case 'domain':
          errorMessage = 'Invalid domain format. Please enter a valid domain name (e.g., example.com)'
          break
        case 'hash':
          errorMessage = 'Invalid hash format. Please enter a valid MD5 (32 chars), SHA1 (40 chars), or SHA256 (64 chars) hash'
          break
        case 'url':
          errorMessage = 'Invalid URL format. Please enter a valid HTTP/HTTPS URL'
          break
      }
      setValidationError(errorMessage)
      return
    }
    
    setValidationError('')
    setLoading(true)
    setResults({})
    
    try {
      // Add to analysis requests
      db.addAnalysisRequest(cleanIndicator)
      
      // Track user activity
      activityTracker.trackActivity('analyze', {
        indicator: cleanIndicator,
        indicatorType: type
      })
      
      // Run all applicable analyses in parallel
      const promises: Promise<any>[] = [
        analyzeWithVirusTotal(cleanIndicator, type),
        enrichThreatIntelligence(cleanIndicator, type)
      ]
      
      if (type === 'ip') {
        promises.push(getIPGeolocation(cleanIndicator))
      }
      
      if (type === 'domain') {
        promises.push(getDomainInfo(cleanIndicator))
      }
      
      if (type === 'hash') {
        promises.push(searchMalwareBazaar(cleanIndicator))
      }
      
      const [virusTotal, threatIntel, ...additionalResults] = await Promise.all(promises)
      
      const newResults: any = { virusTotal, threatIntel }
      
      if (type === 'ip' && additionalResults[0]) {
        newResults.ipGeo = additionalResults[0]
      }
      
      if (type === 'domain' && additionalResults[0]) {
        newResults.domainInfo = additionalResults[0]
      }
      
      if (type === 'hash' && additionalResults[0]) {
        newResults.malwareSamples = additionalResults[0]
      }
      
      setResults(newResults)
      
      // Determine threat level
      let threatLevel: 'high' | 'medium' | 'low' = 'low'
      if (threatIntel?.reputation_score < 30) threatLevel = 'high'
      else if (threatIntel?.reputation_score < 70) threatLevel = 'medium'
      
      // Save to search history
      db.addSearchHistory({
        indicator: cleanIndicator,
        type,
        timestamp: new Date(),
        results: newResults,
        threatLevel,
        status: 'analyzed'
      })
      
      // Add threat detection if high risk
      if (threatLevel === 'high') {
        db.addThreatDetection({
          indicator: cleanIndicator,
          type,
          severity: 'high',
          description: `High-risk ${type} detected with reputation score ${threatIntel?.reputation_score}`,
          timestamp: new Date(),
          source: 'Threat Intelligence Analysis',
          status: 'new'
        })
        
        // Add to recent threats
        activityTracker.addRecentThreat({
          type: type === 'hash' ? 'malware' : type === 'ip' ? 'malicious_ip' : 'file_upload',
          indicator: cleanIndicator,
          threatLevel: 'high',
          detectedBy: 'Threat Intelligence',
          timestamp: new Date(),
          details: newResults
        })
      }
      
    } catch (error) {
      console.error('Analysis failed:', error)
      setValidationError('Analysis failed. Please try again or check your input format.')
    } finally {
      setLoading(false)
    }
  }

  const createCase = () => {
    if (!indicator || !results.threatIntel) return
    
    const threatLevel = results.threatIntel.reputation_score < 30 ? 'critical' : 
                       results.threatIntel.reputation_score < 70 ? 'high' : 'medium'
    
    const newCase = db.createCase({
      title: `Investigation: ${indicator}`,
      description: `Case created from threat analysis. Reputation score: ${results.threatIntel.reputation_score}/100`,
      priority: threatLevel,
      status: 'open',
      indicators: [indicator],
      linkedCases: [],
      tags: [detectIndicatorType(indicator), ...results.threatIntel.threat_types],
      notes: []
    })
    
    // Redirect to the new case
    router.push(`/cases?highlight=${newCase.id}`)
  }

  const getThreatLevel = (stats: any) => {
    const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected
    const maliciousRatio = stats.malicious / total
    
    if (maliciousRatio > 0.3) return { level: 'high', color: 'destructive' }
    if (maliciousRatio > 0.1) return { level: 'medium', color: 'default' }
    return { level: 'low', color: 'secondary' }
  }

  const getIndicatorIcon = (type: string) => {
    switch (type) {
      case 'ip': return <Globe className="h-4 w-4" />
      case 'domain': return <Globe className="h-4 w-4" />
      case 'hash': return <Hash className="h-4 w-4" />
      case 'url': return <Link className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Threat Intelligence Lookup
          </CardTitle>
          <CardDescription>
            Analyze IPs, domains, URLs, and file hashes across multiple threat intelligence sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP, domain, URL, or file hash..."
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1"
            />
            <Button onClick={handleAnalyze} disabled={loading || !indicator.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analyze
            </Button>
          </div>
          {validationError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <Tabs defaultValue="overview" className="w-full" id="results-tabs">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" onClick={() => document.getElementById('overview-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="virustotal" onClick={() => document.getElementById('virustotal-section')?.scrollIntoView({ behavior: 'smooth' })}>
              VirusTotal
            </TabsTrigger>
            <TabsTrigger value="geolocation" onClick={() => document.getElementById('geolocation-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Geolocation
            </TabsTrigger>
            <TabsTrigger value="domain" onClick={() => document.getElementById('domain-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Domain Info
            </TabsTrigger>
            <TabsTrigger value="malware" onClick={() => document.getElementById('malware-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Malware
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4" id="overview-section">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getIndicatorIcon(detectIndicatorType(indicator))}
                    Threat Intelligence Summary
                  </CardTitle>
                  <Button onClick={createCase} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Indicator:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{indicator}</code>
                </div>
                
                {results.threatIntel && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Reputation Score:</span>
                      <Badge variant={results.threatIntel.reputation_score < 50 ? 'destructive' : 'secondary'}>
                        {results.threatIntel.reputation_score}/100
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confidence:</span>
                      <span>{results.threatIntel.confidence}%</span>
                    </div>
                    
                    {results.threatIntel.threat_types.length > 0 && (
                      <div>
                        <span className="font-medium">Threat Types:</span>
                        <div className="flex gap-2 mt-2">
                          {results.threatIntel.threat_types.map((type) => (
                            <Badge key={type} variant="destructive">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {results.virusTotal && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">VirusTotal Detection:</span>
                    <Badge variant={getThreatLevel(results.virusTotal.data.attributes.last_analysis_stats).color as any}>
                      {results.virusTotal.data.attributes.last_analysis_stats.malicious} / {
                        Object.values(results.virusTotal.data.attributes.last_analysis_stats).reduce((a, b) => a + b, 0)
                      } engines
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="virustotal" className="space-y-4" id="virustotal-section">
            {results.virusTotal && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    VirusTotal Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {results.virusTotal.data.attributes.last_analysis_stats.harmless}
                      </div>
                      <div className="text-sm text-muted-foreground">Harmless</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {results.virusTotal.data.attributes.last_analysis_stats.malicious}
                      </div>
                      <div className="text-sm text-muted-foreground">Malicious</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {results.virusTotal.data.attributes.last_analysis_stats.suspicious}
                      </div>
                      <div className="text-sm text-muted-foreground">Suspicious</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {results.virusTotal.data.attributes.last_analysis_stats.undetected}
                      </div>
                      <div className="text-sm text-muted-foreground">Undetected</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Detection Results</h4>
                    {Object.entries(results.virusTotal.data.attributes.last_analysis_results).map(([engine, result]) => (
                      <div key={engine} className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">{result.engine_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              result.category === 'malicious' ? 'destructive' : 
                              result.category === 'suspicious' ? 'default' : 'secondary'
                            }
                          >
                            {result.category}
                          </Badge>
                          {result.result && (
                            <span className="text-sm text-muted-foreground">{result.result}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="geolocation" className="space-y-4" id="geolocation-section">
            {results.ipGeo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    IP Geolocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Country:</span>
                      <p>{results.ipGeo.country} ({results.ipGeo.country_code})</p>
                    </div>
                    <div>
                      <span className="font-medium">Region:</span>
                      <p>{results.ipGeo.region}</p>
                    </div>
                    <div>
                      <span className="font-medium">City:</span>
                      <p>{results.ipGeo.city}</p>
                    </div>
                    <div>
                      <span className="font-medium">ISP:</span>
                      <p>{results.ipGeo.isp}</p>
                    </div>
                    <div>
                      <span className="font-medium">Organization:</span>
                      <p>{results.ipGeo.organization}</p>
                    </div>
                    <div>
                      <span className="font-medium">Timezone:</span>
                      <p>{results.ipGeo.timezone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="domain" className="space-y-4" id="domain-section">
            {results.domainInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Registrar:</span>
                      <p>{results.domainInfo.registrar}</p>
                    </div>
                    <div>
                      <span className="font-medium">Creation Date:</span>
                      <p>{formatDate(results.domainInfo.creation_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Expiration Date:</span>
                      <p>{formatDate(results.domainInfo.expiration_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="flex gap-1 flex-wrap">
                        {results.domainInfo.status.map((status) => (
                          <Badge key={status} variant="outline">{status}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Name Servers:</span>
                    <ul className="mt-2 space-y-1">
                      {results.domainInfo.name_servers.map((ns) => (
                        <li key={ns} className="text-sm bg-muted px-2 py-1 rounded">{ns}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="malware" className="space-y-4" id="malware-section">
            {results.malwareSamples && results.malwareSamples.length > 0 ? (
              results.malwareSamples.map((sample) => (
                <Card key={sample.sha256}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Malware Sample Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">File Name:</span>
                        <p className="font-mono text-sm">{sample.file_name}</p>
                      </div>
                      <div>
                        <span className="font-medium">File Type:</span>
                        <p>{sample.file_type}</p>
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span>
                        <p>{formatBytes(sample.file_size)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Signature:</span>
                        <p>{sample.signature}</p>
                      </div>
                      <div>
                        <span className="font-medium">First Seen:</span>
                        <p>{formatDate(sample.first_seen)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Seen:</span>
                        <p>{formatDate(sample.last_seen)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Tags:</span>
                      <div className="flex gap-2 mt-2">
                        {sample.tags.map((tag) => (
                          <Badge key={tag} variant="destructive">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="font-medium">Hashes:</span>
                      <div className="space-y-1 text-sm font-mono">
                        <div><strong>SHA256:</strong> {sample.sha256}</div>
                        <div><strong>SHA1:</strong> {sample.sha1}</div>
                        <div><strong>MD5:</strong> {sample.md5}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No malware samples found for this indicator</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}