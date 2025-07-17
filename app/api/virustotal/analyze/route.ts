import { NextRequest, NextResponse } from 'next/server'

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY

export async function POST(request: NextRequest) {
  if (!VIRUSTOTAL_API_KEY || 
      VIRUSTOTAL_API_KEY === 'your_virustotal_api_key_here' || 
      VIRUSTOTAL_API_KEY.trim() === '' ||
      VIRUSTOTAL_API_KEY === 'undefined' ||
      VIRUSTOTAL_API_KEY === 'null') {
    return NextResponse.json(
      { 
        error: 'VirusTotal API key not configured', 
        message: 'Please add your actual VirusTotal API key to .env.local and restart the server',
        configured: false 
      },
      { status: 500 }
    )
  }

  try {
    const { indicator, type } = await request.json()

    if (!indicator || !type) {
      return NextResponse.json(
        { error: 'Missing indicator or type' },
        { status: 400 }
      )
    }

    let endpoint = ''
    let identifier = indicator

    switch (type) {
      case 'ip':
        endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${indicator}`
        break
      case 'domain':
        endpoint = `https://www.virustotal.com/api/v3/domains/${indicator}`
        break
      case 'url':
        // URL needs to be base64 encoded without padding
        identifier = Buffer.from(indicator).toString('base64').replace(/=/g, '')
        endpoint = `https://www.virustotal.com/api/v3/urls/${identifier}`
        break
      case 'hash':
        endpoint = `https://www.virustotal.com/api/v3/files/${indicator}`
        break
      default:
        return NextResponse.json(
          { error: 'Invalid indicator type' },
          { status: 400 }
        )
    }

    console.log(`Making VirusTotal API request to: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      headers: {
        'X-Apikey': VIRUSTOTAL_API_KEY
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid VirusTotal API key', 
            message: 'Please check your API key in .env.local',
            configured: false 
          },
          { status: 500 }
        )
      }
      
      if (response.status === 404) {
        console.warn(`VirusTotal API: Resource not found for ${type}: ${indicator}`)
        return NextResponse.json(
          { 
            error: 'Resource not found in VirusTotal database',
            message: `The ${type} "${indicator}" was not found in the VirusTotal database`,
            type: 'not_found'
          },
          { status: 404 }
        )
      }
      
      console.error(`VirusTotal API error: ${response.status} - ${errorText}`)
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'VirusTotal API rate limit exceeded', 
            message: 'Please wait before making another request',
            configured: true 
          },
          { status: 429 }
        )
      }
      
      throw new Error(`VirusTotal API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`VirusTotal API success for ${type}: ${indicator}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error('VirusTotal API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze with VirusTotal', 
        message: error instanceof Error ? error.message : 'Unknown error',
        configured: true 
      },
      { status: 500 }
    )
  }
}