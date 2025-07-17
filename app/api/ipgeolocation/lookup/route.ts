import { NextRequest, NextResponse } from 'next/server'

const IPGEOLOCATION_API_KEY = process.env.IPGEOLOCATION_API_KEY

export async function POST(request: NextRequest) {
  if (!IPGEOLOCATION_API_KEY || 
      IPGEOLOCATION_API_KEY === 'your_ipgeolocation_api_key_here' || 
      IPGEOLOCATION_API_KEY.trim() === '' ||
      IPGEOLOCATION_API_KEY === 'undefined' ||
      IPGEOLOCATION_API_KEY === 'null') {
    return NextResponse.json(
      { 
        error: 'IPGeolocation API key not configured', 
        message: 'Please add your actual IPGeolocation API key to .env.local and restart the server',
        configured: false 
      },
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

    console.log(`Making IPGeolocation API request for IP: ${ip}`)
    
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${IPGEOLOCATION_API_KEY}&ip=${ip}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`IPGeolocation API error: ${response.status} - ${errorText}`)
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid IPGeolocation API key', 
            message: 'Please check your API key in .env.local',
            configured: false 
          },
          { status: 500 }
        )
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'IPGeolocation API rate limit exceeded', 
            message: 'Please wait before making another request',
            configured: true 
          },
          { status: 429 }
        )
      }
      
      throw new Error(`IPGeolocation API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`IPGeolocation API success for IP: ${ip}`)
    
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
      { 
        error: 'Failed to get IP geolocation', 
        message: error instanceof Error ? error.message : 'Unknown error',
        configured: true 
      },
      { status: 500 }
    )
  }
}