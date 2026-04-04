import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

// GET /api/game-entities - Game-specific entity queries
// Supports: heroes (for party selection), antagonist (greater gods), npcs (all except selected)

// Fallback: load from master_database.json if DB is unavailable
function getFallbackEntities(type: string, limit: number, excludeIds: string[]) {
  try {
    const jsonPath = join(process.cwd(), 'master_database.json')
    const raw = readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(raw)

    let entities: any[] = []
    const categories = {
      heroes: ['heroes', 'demigods'],
      antagonist: ['greater_gods', 'monsters'],
      npcs: ['heroes', 'demigods', 'lesser_gods', 'greater_gods', 'monsters'],
    }

    const targetCats = categories[type] || ['heroes', 'demigods']
    for (const cat of targetCats) {
      for (const [id, entity] of Object.entries(data[cat] || {})) {
        const e = entity as any
        if (type === 'npcs' && excludeIds.includes(id)) continue
        const hp = typeof e.HP === 'string' ? parseInt(e.HP) || 100 : e.HP || 100
        const ac = typeof e.AC === 'string' ? parseInt(e.AC) || 10 : e.AC || 10
        entities.push({
          id,
          name: e.name || id,
          title: e.title || null,
          pantheon: e.pantheon || 'Unknown',
          category: cat,
          type: cat === 'heroes' ? 'hero' : cat === 'demigods' ? 'demigod' : cat === 'greater_gods' ? 'greater_god' : 'lesser_god',
          hp,
          maxHp: hp,
          AC: ac,
          MR: e.MR === 'Immune' ? 100 : parseInt(e.MR) || 0,
          align: e.align || 'Neutral',
          abilities: e.abilities || ['Basic Strike', 'Defend', 'Heroic Surge'],
          personality: e.personality || null,
          str: e.STR ? String(e.STR) : null,
          int: e.INT ? String(e.INT) : null,
          wis: e.WIS ? String(e.WIS) : null,
          dex: e.DEX ? String(e.DEX) : null,
          con: e.CON ? String(e.CON) : null,
          cha: e.CHA ? String(e.CHA) : null,
          level: e.level || null,
          fighterLevel: null,
          clericLevel: null,
          magicUserLevel: null,
          thiefLevel: null,
          attacks: e.attacks || null,
          damage: e.damage || null,
          move: e.MV || null,
        })
      }
    }
    // Filter out dragons at the source
    const DRAGON_IDS = new Set(['cyan_bloodbane', 'khellendros', 'beryllinthranox', 'malystryx'])
    return entities.filter(e => !DRAGON_IDS.has(e.id))
  } catch {
    return []
  }
}

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// IDs of entities that are actual dragons (not dragon-slayers or dragon-riders)
// These should NOT appear as selectable PCs — they are monsters/NPCs
const DRAGON_IDS = new Set([
  'cyan_bloodbane',      // Ancient Green Dragon
  'khellendros',          // Ancient Blue Dragon (Skie)
  'beryllinthranox',      // Great Green Dragon Overlord
  'malystryx',           // Great Red Dragon Overlord
])

const isDragon = (e: any): boolean => {
  if (DRAGON_IDS.has(e.id)) return true
  // Also catch by level field: "Ancient Blue Dragon", "Great Red Dragon", etc.
  const level = (e.level || '').toLowerCase()
  if (level.includes('dragon') && !level.includes('dragonbane') && !level.includes('dragonlord') && !level.includes('dragon-slaying')) return true
  return false
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
  abilities: typeof e.abilities === 'string' ? JSON.parse(e.abilities) : (e.abilities || ['Basic Strike', 'Defend', 'Heroic Surge']),
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'heroes'
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 200)
    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || []

    // Try DB first, fall back to JSON file
    let entities: any[]
    try {
      switch (type) {
        case 'heroes': {
          const DRAGON_EXCLUDE = ['cyan_bloodbane', 'khellendros', 'beryllinthranox', 'malystryx']
          const dbEntities = await db.entity.findMany({
            where: { category: { in: ['heroes', 'demigods'] }, id: { notIn: DRAGON_EXCLUDE } }
          })

          if (dbEntities.length > 0) {
            // ALWAYS load JSON fallback to supplement missing ability scores
            const jsonEntities = getFallbackEntities('heroes', limit, excludeIds)
            const jsonMap = new Map(jsonEntities.map(e => [e.id, e]))

            // Check how many DB entities are missing ability scores
            const missingScores = dbEntities.filter(e => !e.str).length
            if (missingScores > 0) {
              console.warn(`DB: ${missingScores}/${dbEntities.length} heroes missing ability scores, supplementing from JSON fallback`)
            }

            // Merge: use DB as primary, fill missing ability scores from JSON
            entities = dbEntities.map(e => {
              const jsonSupplement = jsonMap.get(e.id)
              return {
                ...e,
                str: e.str || jsonSupplement?.str || null,
                int: e.int || jsonSupplement?.int || null,
                wis: e.wis || jsonSupplement?.wis || null,
                dex: e.dex || jsonSupplement?.dex || null,
                con: e.con || jsonSupplement?.con || null,
                cha: e.cha || jsonSupplement?.cha || null,
                level: e.level || jsonSupplement?.level || null,
              }
            })
          } else {
            // No DB entities, use JSON fallback
            entities = getFallbackEntities('heroes', limit, excludeIds)
          }

          // Filter out dragons — they are monsters/NPCs, not playable PCs
          const DRAGON_FILTER = new Set(['cyan_bloodbane','khellendros','beryllinthranox','malystryx'])
          const beforeCount = entities.length
          entities = entities.filter(e => !DRAGON_FILTER.has(e.id))
          if (entities.length < beforeCount) {
            console.warn(`Filtered out ${beforeCount - entities.length} dragon(s) from hero selection`)
          }
          break
        }
        case 'antagonist': {
          const dbEntities = await db.entity.findMany({ where: { hp: { gte: 300 } } })
          entities = dbEntities
          break
        }
        case 'npcs': {
          entities = await db.entity.findMany({ where: { id: { notIn: excludeIds } } })
          break
        }
        case 'all': {
          const counts = await db.entity.groupBy({ by: ['category'], _count: true })
          return NextResponse.json({
            counts: counts.reduce((acc, c) => { acc[c.category] = c._count; return acc }, {} as Record<string, number>)
          })
        }
        default:
          return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }
    } catch (dbError) {
      console.error('DB error, using JSON fallback:', dbError)
      entities = getFallbackEntities(type, limit, excludeIds)
    }

    const shuffled = shuffleArray(entities)
    const selected = shuffled.slice(0, limit)

    return NextResponse.json({
      count: selected.length,
      total: entities.length,
      entities: selected.map(formatEntity)
    })
  } catch (error) {
    console.error('Game entities error:', error)
    // Last resort: pure JSON fallback
    const fallback = getFallbackEntities('heroes', 999, [])
    return NextResponse.json({
      count: fallback.length,
      total: fallback.length,
      entities: fallback.map(formatEntity)
    })
  }
}
