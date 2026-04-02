import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/game-entities - Game-specific entity queries
// Supports: heroes (for party selection), antagonist (greater gods), npcs (all except selected)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'heroes' // heroes, antagonist, npcs
    const limit = parseInt(searchParams.get('limit') || '12')
    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []

    // Fisher-Yates shuffle for true randomization
    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }

    const formatEntity = (e: any) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      epithet: e.title,
      pantheon: e.pantheon,
      category: e.category,
      type: e.category === 'heroes' ? 'hero' : e.category === 'demigods' ? 'demigod' : e.category === 'greater_gods' ? 'greater_god' : 'lesser_god',
      hp: e.hp,
      maxHp: e.maxHp,
      HP: e.hp,
      AC: e.AC,
      MR: typeof e.MR === 'string' ? (e.MR === 'Immune' ? 100 : parseInt(e.MR) || 0) : (e.MR || 0),
      align: e.align,
      abilities: e.abilities ? JSON.parse(e.abilities) : ['Basic Strike', 'Defend', 'Heroic Surge'],
      personality: e.personality || 'A mysterious figure.',
      // Ability Scores (AD&D 1e format)
      str: e.str,
      int: e.int,
      wis: e.wis,
      dex: e.dex,
      con: e.con,
      cha: e.cha,
      // Class Levels
      level: e.level,
      fighterLevel: e.fighterLevel,
      clericLevel: e.clericLevel,
      magicUserLevel: e.magicUserLevel,
      thiefLevel: e.thiefLevel,
      // Combat Stats
      attacks: e.attacks,
      damage: e.damage,
      move: e.move
    })

    switch (type) {
      case 'heroes': {
        // Fetch all heroes AND demigods for party selection (62 total: 35 heroes + 27 demigods)
        const entities = await db.entity.findMany({
          where: {
            category: { in: ['heroes', 'demigods'] }
          }
        })
        
        // Shuffle and return limited amount
        const shuffled = shuffleArray(entities)
        const selected = shuffled.slice(0, limit)
        
        return NextResponse.json({
          count: selected.length,
          total: entities.length,
          entities: selected.map(formatEntity)
        })
      }

      case 'antagonist': {
        // Fetch greater gods (HP >= 300) for main antagonist
        const entities = await db.entity.findMany({
          where: {
            hp: { gte: 300 }
          }
        })
        
        // Shuffle and return limited amount
        const shuffled = shuffleArray(entities)
        const selected = shuffled.slice(0, limit)
        
        return NextResponse.json({
          count: selected.length,
          total: entities.length,
          entities: selected.map(formatEntity)
        })
      }

      case 'npcs': {
        // Fetch ALL entities EXCEPT player-selected heroes for NPC pool
        // Includes: Heroes not selected, Demigods not selected, Lesser Gods, Greater Gods, Monsters
        const entities = await db.entity.findMany({
          where: {
            id: { notIn: excludeIds }
          }
        })
        
        return NextResponse.json({
          count: entities.length,
          entities: entities.map(formatEntity)
        })
      }

      case 'all': {
        // Get counts for all categories
        const counts = await db.entity.groupBy({
          by: ['category'],
          _count: true
        })
        
        return NextResponse.json({
          counts: counts.reduce((acc, c) => {
            acc[c.category] = c._count
            return acc
          }, {} as Record<string, number>)
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid type. Use: heroes, antagonist, npcs, or all' }, { status: 400 })
    }
  } catch (error) {
    console.error('Game entities error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
