import { NextRequest, NextResponse } from 'next/server'

const WHOISXML_API_KEY = process.env.WHOISXML_API_KEY

export async function POST(request: NextRequest) {
  if (!WHOISXML_API_KEY || WHOISXML_API_KEY === 'your_whoisxml_api_key_here') {
    return NextResponse.json(
      { error: 'WhoisXML API key not configured' },
      { status: 500 }
    )
  }

  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing domain' },
        { status: 400 }
      )
    }

    const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&domainName=${domain}&outputFormat=JSON`)
    
    if (!response.ok) {
      throw new Error(`WhoisXML API error: ${response.status}`)
    }

    const data = await response.json()
    const whoisRecord = data.WhoisRecord

    const result = {
      domain,
      registrar: whoisRecord?.registrarName || 'Unknown',
      creation_date: whoisRecord?.createdDate || 'Unknown',
      expiration_date: whoisRecord?.expiresDate || 'Unknown',
      name_servers: whoisRecord?.nameServers?.hostNames || [],
      status: whoisRecord?.status || []
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('WhoisXML API error:', error)
    return NextResponse.json(
      { error: 'Failed to get domain info' },
      { status: 500 }
    )
  }
}