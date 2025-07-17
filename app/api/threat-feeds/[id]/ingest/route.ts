import { NextRequest, NextResponse } from 'next/server'
import { threatFeedManager } from '@/lib/threat-feeds'
import { auth } from '@/lib/auth'

export async function POST(
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

    const result = await threatFeedManager.ingestFeed(params.id)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to ingest threat feed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}