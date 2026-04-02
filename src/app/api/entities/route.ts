import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/entities - List entities with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const pantheon = searchParams.get('pantheon')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const random = searchParams.get('random') === 'true'
    const minHp = searchParams.get('minHp') ? parseInt(searchParams.get('minHp')!) : null
    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []
    const includeCategories = searchParams.get('categories')?.split(',').filter(Boolean) || null

    // Build where clause
    const where: any = {}

    // Handle multiple categories
    if (includeCategories && includeCategories.length > 0) {
      where.category = { in: includeCategories }
    } else if (category) {
      where.category = category
    }

    if (pantheon) {
      where.pantheon = pantheon
    }

    // Minimum HP filter (for greater gods)
    if (minHp !== null) {
      where.hp = { gte: minHp }
    }

    // Exclude specific IDs
    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds }
    }

    // SQLite doesn't support mode: 'insensitive', so use contains with lowercase
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { name: { contains: search.toLowerCase() } },
        { title: { contains: search } }
      ]
    }

    // Query entities
    let entities = await db.entity.findMany({
      where,
      take: limit,
      orderBy: random ? undefined : { name: 'asc' }
    })

    // Random selection if requested
    if (random && entities.length > 0) {
      const shuffled = entities.sort(() => Math.random() - 0.5)
      entities = shuffled.slice(0, limit)
    }

    return NextResponse.json({
      count: entities.length,
      total: await db.entity.count({ where: includeCategories ? { category: { in: includeCategories } } : category ? { category } : {} }),
      entities: entities.map(e => ({
        id: e.id,
        name: e.name,
        title: e.title,
        pantheon: e.pantheon,
        category: e.category,
        type: e.type,
        hp: e.hp,
        maxHp: e.maxHp,
        AC: e.AC,
        MR: e.MR,
        align: e.align,
        abilities: e.abilities ? JSON.parse(e.abilities) : [],
        personality: e.personality
      }))
    })
  } catch (error) {
    console.error('Entities list error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
