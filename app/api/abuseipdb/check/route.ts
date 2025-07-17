import { NextRequest, NextResponse } from 'next/server'

const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY

export async function POST(request: NextRequest) {
  if (!ABUSEIPDB_API_KEY || ABUSEIPDB_API_KEY === 'your_abuseipdb_api_key_here') {
    return NextResponse.json(
      { error: 'AbuseIPDB API key not configured' },
      { status: 500 }
    )
  }

  try {
    const { ip } = await request.json()

    if (!ip) {
      return NextResponse.json(
        { error: 'Missing IP address' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90&verbose`, {
      headers: {
        'Key': ABUSEIPDB_API_KEY,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`AbuseIPDB API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AbuseIPDB API error:', error)
    return NextResponse.json(
      { error: 'Failed to check AbuseIPDB' },
      { status: 500 }
    )
  }
}