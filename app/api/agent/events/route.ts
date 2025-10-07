import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const event = await request.json()

    // Log agent events
    logger.info('system', `Agent event: ${event.type}`, {
      agent_id: event.agent_id,
      hostname: event.hostname,
      timestamp: event.timestamp,
      details: event
    })

    // Handle different event types
    switch (event.type) {
      case 'agent_startup':
        logger.info('system', `Agent ${event.agent_id} started on ${event.hostname}`, {
          collectors: event.collectors
        })
        break
      
      case 'agent_shutdown':
        logger.info('system', `Agent ${event.agent_id} shutting down`)
        break
      
      case 'collector_error':
        logger.error('system', `Collector error on agent ${event.agent_id}`, event.error)
        break
      
      default:
        logger.debug('system', `Unknown event type: ${event.type}`)
    }

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('api', 'Error processing agent event', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}