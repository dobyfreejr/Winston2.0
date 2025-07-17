import { NextRequest, NextResponse } from 'next/server'
import { threatFeedManager } from '@/lib/threat-feeds'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const feeds = threatFeedManager.getFeeds()
    return NextResponse.json({
      success: true,
      data: feeds,
      count: feeds.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch threat feeds' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = auth.getCurrentUser()
    if (!currentUser || !auth.hasPermission(currentUser, 'admin_panel')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const feedData = await request.json()
    
    // Validate required fields
    if (!feedData.name || !feedData.url || !feedData.fields?.indicator_field) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, fields.indicator_field' },
        { status: 400 }
      )
    }

    const feed = threatFeedManager.createFeed({
      ...feedData,
      created_by: currentUser.id
    })

    return NextResponse.json({
      success: true,
      data: feed
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create threat feed' },
      { status: 500 }
    )
  }
}