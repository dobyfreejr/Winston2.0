import { NextRequest, NextResponse } from 'next/server'
import { threatFeedManager } from '@/lib/threat-feeds'
import { auth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const feed = threatFeedManager.getFeed(params.id)
    if (!feed) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feed
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch threat feed' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = auth.getCurrentUser()
    if (!currentUser || !auth.hasPermission(currentUser, 'admin_panel')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const updates = await request.json()
    const feed = threatFeedManager.updateFeed(params.id, updates)
    
    if (!feed) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feed
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update threat feed' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = auth.getCurrentUser()
    if (!currentUser || !auth.hasPermission(currentUser, 'admin_panel')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const success = threatFeedManager.deleteFeed(params.id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Feed deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete threat feed' },
      { status: 500 }
    )
  }
}