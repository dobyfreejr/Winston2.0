import { NextRequest, NextResponse } from 'next/server'

const IPGEOLOCATION_API_KEY = process.env.IPGEOLOCATION_API_KEY

export async function POST(request: NextRequest) {
  if (!IPGEOLOCATION_API_KEY || IPGEOLOCATION_API_KEY === 'your_ipgeolocation_api_key_here') {
    return NextResponse.json(
      { error: 'IPGeolocation API key not configured' },
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

    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${IPGEOLOCATION_API_KEY}&ip=${ip}`)
    
    if (!response.ok) {
      throw new Error(`IPGeolocation API error: ${response.status}`)
    }

    const data = await response.json()
    
    const result = {
      ip: data.ip,
      country: data.country_name,
      country_code: data.country_code2,
      region: data.state_prov,
      city: data.city,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      isp: data.isp,
      organization: data.organization,
      timezone: data.time_zone?.name || 'Unknown'
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('IPGeolocation API error:', error)
    return NextResponse.json(
      { error: 'Failed to get IP geolocation' },
      { status: 500 }
    )
  }
}