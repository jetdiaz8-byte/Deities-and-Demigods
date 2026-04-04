import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/entity/[id] - Get a single entity by ID or name
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Entity ID required' }, { status: 400 })
    }

    const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    
    // Try to find by ID first, then by name (SQLite doesn't support mode: insensitive)
    let entity = await db.entity.findFirst({
      where: { id: cleanId }
    })
    
    // If not found by ID, try by name (case-insensitive using SQL)
    if (!entity) {
      entity = await db.entity.findFirst({
        where: {
          name: { equals: id }
        }
      })
    }
    
    // Still not found? Try lowercase name match
    if (!entity) {
      entity = await db.entity.findFirst({
        where: {
          name: { equals: id.toLowerCase() }
        }
      })
    }

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    return NextResponse.json(entity)
  } catch (error) {
    console.error('Entity lookup error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
