/**
 * build-unified-database.ts
 *
 * Merges DDG (Deities & Demigods) JSON data with Krynn (Dragonlance) character data
 * into a single unified master_database.json.
 *
 * Run with: npx tsx scripts/build-unified-database.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
// Dynamic import of Krynn characters
const krynnModule = await import('../src/lib/krynnCharacters')
const projectRoot = path.resolve(__dirname, '..')

// ─── Load DDG data ───────────────────────────────────────────────────────
const ddgPath = path.join(projectRoot, 'ddg_database.json')
const ddgData = JSON.parse(fs.readFileSync(ddgPath, 'utf-8'))

// ─── Collect all Krynn characters from all arrays ───────────────────────
const allKrynn = [
  ...(krynnModule.KRYNN_HEROES ?? []),
  ...(krynnModule.KRYNN_DEMIGODS ?? []),
  ...(krynnModule.KRYNN_LESSER_GODS ?? []),
  ...(krynnModule.KRYNN_GREATER_GODS ?? []),
  ...(krynnModule.KRYNN_GODS_OF_MAGIC ?? []),
  ...(krynnModule.KRYNN_DRAGONS ?? []),
  ...(krynnModule.KRYNN_ADDITIONAL_GODS ?? []),
  ...(krynnModule.KRYNN_MONSTERS ?? []),
]

console.log(`Loaded ${allKrynn.length} Krynn characters from ${Object.keys(krynnModule).filter(k => k.startsWith('KRYNN_')).length} arrays`)

// ─── Build unified structure ─────────────────────────────────────────────
type EntityMap = Record<string, any>

const unified: Record<string, EntityMap | any> = {
  _meta: {
    source: 'Deities & Demigods + Krynn (Dragonlance) — Unified Master Database',
    version: '2.0',
    pantheons: [] as string[],
    entities: 0,
  },
  heroes: {} as EntityMap,
  demigods: {} as EntityMap,
  lesser_gods: {} as EntityMap,
  greater_gods: {} as EntityMap,
  monsters: {} as EntityMap,
}

const CATEGORY_BUCKETS = ['heroes', 'demigods', 'lesser_gods', 'greater_gods', 'monsters'] as const
type CategoryBucket = typeof CATEGORY_BUCKETS[number]

// ─── Helper: map Krynn type to category bucket ──────────────────────────
function typeToBucket(krynnType: string | undefined): CategoryBucket {
  switch (krynnType) {
    case 'hero': return 'heroes'
    case 'demigod': return 'demigods'
    case 'lesser god': return 'lesser_gods'
    case 'greater god': return 'greater_gods'
    case 'monster': return 'monsters'
    default: return 'heroes' // fallback
  }
}

// ─── Step 1: Copy DDG data into unified ─────────────────────────────────
const ddgBuckets = ['heroes', 'demigods', 'lesser_gods', 'monsters'] as const
let ddgCount = 0

for (const bucket of ddgBuckets) {
  const entities = ddgData[bucket] as EntityMap | undefined
  if (!entities) continue

  for (const [id, entity] of Object.entries(entities)) {
    const e = entity as any
    // Normalize: hp -> HP if needed
    if (e.hp !== undefined && e.HP === undefined) e.HP = e.hp
    if (e.mv !== undefined && e.MV === undefined) e.MV = e.mv

    unified[bucket][id] = e
    ddgCount++
  }
}

console.log(`Copied ${ddgCount} DDG entities`)

// ─── Step 2: Add Krynn characters ───────────────────────────────────────
let krynnCount = 0
let overrideCount = 0

for (const char of allKrynn as any[]) {
  const bucket = typeToBucket(char.type)

  // Check for ID collision with existing DDG data
  if (unified[bucket][char.id]) {
    console.warn(`  ⚠️  ID collision: "${char.id}" already exists in ${bucket} — Krynn version takes precedence`)
    overrideCount++
  }

  // Map Krynn fields to DDG format while preserving Krynn-specific fields
  unified[bucket][char.id] = {
    id: char.id,
    name: char.name,
    title: char.title || char.epithet || null,
    pantheon: char.pantheon || 'Krynn',
    type: char.type || 'hero',
    AC: char.AC ?? 10,
    HP: char.hp ?? 0,
    MR: char.MR != null ? String(char.MR) : null,
    align: char.align || 'Neutral',
    STR: char.str ?? null,
    INT: char.int ?? null,
    WIS: char.wis ?? null,
    DEX: char.dex ?? null,
    CON: char.con ?? null,
    CHA: char.cha ?? null,
    level: char.level || null,
    abilities: char.abilities || [],
    personality: char.personality || null,
    equipment: char.equipment || null,
    // Krynn-specific fields preserved
    divineRank: char.divineRank || null,
    domain: char.domain || null,
    phase1: char.phase1 || null,
    phase2: char.phase2 || null,
    phase3: char.phase3 || null,
    epithet: char.epithet || null,
    source: char.source || null,
    category: char.category || 'krynn',
  }
  krynnCount++
}

console.log(`Added ${krynnCount} Krynn characters (${overrideCount} overrode existing IDs)`)

// ─── Step 3: Collect all pantheons ──────────────────────────────────────
const pantheonSet = new Set<string>()

for (const bucket of CATEGORY_BUCKETS) {
  for (const entity of Object.values(unified[bucket] as EntityMap)) {
    if (entity.pantheon) pantheonSet.add(entity.pantheon)
  }
}

unified._meta.pantheons = Array.from(pantheonSet).sort()

// ─── Step 4: Count total entities ───────────────────────────────────────
let totalCount = 0
for (const bucket of CATEGORY_BUCKETS) {
  totalCount += Object.keys(unified[bucket] as EntityMap).length
}
unified._meta.entities = totalCount

// ─── Step 5: Write output ───────────────────────────────────────────────
const outputPath = path.join(projectRoot, 'master_database.json')
fs.writeFileSync(outputPath, JSON.stringify(unified, null, 2), 'utf-8')

console.log(`\n✅ Unified database written to master_database.json`)
console.log(`   Total entities: ${totalCount}`)
console.log(`   Pantheons (${pantheonSet.size}): ${unified._meta.pantheons.join(', ')}`)
console.log('')
for (const bucket of CATEGORY_BUCKETS) {
  const count = Object.keys(unified[bucket] as EntityMap).length
  const entities = Object.values(unified[bucket] as EntityMap)
  const pantheons = [...new Set(entities.map((e: any) => e.pantheon))]
  console.log(`   ${bucket}: ${count} entities [${pantheons.join(', ')}]`)
}

}

main().catch((err) => {
  console.error('Error building unified database:', err)
  process.exit(1)
})
