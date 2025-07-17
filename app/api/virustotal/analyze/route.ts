import { NextRequest, NextResponse } from 'next/server'

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY

export async function POST(request: NextRequest) {
  if (!VIRUSTOTAL_API_KEY || VIRUSTOTAL_API_KEY === 'your_virustotal_api_key_here' || VIRUSTOTAL_API_KEY.trim() === '') {
    return NextResponse.json(
      { error: 'VirusTotal API key not configured. Please add VIRUSTOTAL_API_KEY to your .env.local file.' },
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

    const response = await fetch(endpoint, {
      headers: {
        'X-Apikey': VIRUSTOTAL_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('VirusTotal API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze with VirusTotal' },
      { status: 500 }
    )
  }
}