import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get client IP from various possible headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  let clientIp = 'unknown'
  
  if (forwarded) {
    clientIp = forwarded.split(',')[0].trim()
  } else if (realIp) {
    clientIp = realIp
  } else if (cfConnectingIp) {
    clientIp = cfConnectingIp
  } else {
    // Fallback to connection remote address
    clientIp = request.ip || 'unknown'
  }
  
  return NextResponse.json({
    ip: clientIp,
    timestamp: new Date().toISOString()
  })
}