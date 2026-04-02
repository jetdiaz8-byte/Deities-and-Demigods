// gameHelpers.ts — Helper/utility functions extracted from page.tsx
// Pure utility functions, success rate calculators, and entity lookup

import type { Entity, SuccessRateFactors } from '@/lib/gameTypes'
import { NPC_NAMES, ALL_GREATER_GODS } from '@/lib/gameConstants'
import { getAntagonistById } from '@/lib/antagonistPool'


// Entity cache for lookupEntity
const _entityCache: { [key: string]: Entity } = {}
// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const toAscii = (s: unknown): string => {
  if (typeof s !== 'string') return String(s || '')
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00D7/g, 'x')
    .replace(/[\u2022\u2023]/g, '*')
    .replace(/[^\x00-\x7F]/g, '')
}

export const pct = (n: number, t: number): number => Math.max(0, Math.min(100, Math.round(n / (t || 1) * 100)))

export const hpCls = (hp: number, maxHp: number): string => {
  const p = pct(hp, maxHp)
  if (hp <= 0) return 'dead'
  if (p <= 20) return 'crit'
  if (p <= 55) return 'hurt'
  return ''
}

export const aCol = (align: string): string => {
  const m: { [key: string]: string } = {
    'Lawful good': '#5090d0', 'Chaotic good': '#50c060', 'Neutral': '#9090b0',
    'Neutral good': '#60a080', 'Lawful neutral': '#7090b0', 'Chaotic neutral': '#d09030',
    'Lawful evil': '#c05050', 'Neutral evil': '#a060c0', 'Chaotic evil': '#cc3030'
  }
  return m[align] || '#9090b0'
}

// Get portrait path for any entity
export const getEntityPortrait = (entity: { id: string; category?: string; type?: string }): string => {
  const category = entity.category || (entity.type === 'monster' ? 'monsters' : entity.type === 'hero' ? 'heroes' : 'greater-gods')
  return `/portraits/${category}/${entity.id}.png`
}

// AD&D 1st Edition Ability Bonus Calculator
export const getAbilityBonus = (score: string | undefined): { value: number; display: string } => {
  if (!score) return { value: 0, display: '-' }
  
  // Handle exceptional strength like "18(99)" or "18(00)"
  const excMatch = score.match(/^(\d+)\((\d+)\)$/)
  if (excMatch) {
    const base = parseInt(excMatch[1])
    const exc = parseInt(excMatch[2])
    // AD&D 1e exceptional strength to-hit bonus: 01-50=+1, 51-75=+2, 76-90=+2, 91-99=+3, 00=+3
    let excBonus = 0
    if (exc >= 1 && exc <= 50) excBonus = 0 // base 18 = +3, exceptional 01-50 still +3 to-hit
    if (exc >= 51 && exc <= 75) excBonus = 1 // +4 to-hit total
    if (exc >= 76 && exc <= 90) excBonus = 1 // +4 to-hit total (same to-hit, better damage)
    if (exc >= 91) excBonus = 2              // +5 to-hit total
    return { value: 3 + excBonus, display: `+${3 + excBonus}` }
  }
  
  const s = parseInt(score)
  if (isNaN(s)) return { value: 0, display: '-' }
  
  // AD&D 1e ability modifiers
  if (s <= 3) return { value: -3, display: '-3' }
  if (s <= 5) return { value: -2, display: '-2' }
  if (s <= 8) return { value: -1, display: '-1' }
  if (s <= 12) return { value: 0, display: '0' }
  if (s <= 15) return { value: 1, display: '+1' }
  if (s <= 17) return { value: 2, display: '+2' }
  if (s === 18) return { value: 3, display: '+3' }
  if (s === 19) return { value: 4, display: '+4' }
  return { value: 5, display: '+5' }
}

export const aShort = (align: string): string => {
  const m: { [key: string]: string } = {
    'Lawful good': 'LG', 'Chaotic good': 'CG', 'Neutral': 'N', 'Neutral good': 'NG',
    'Lawful neutral': 'LN', 'Chaotic neutral': 'CN', 'Lawful evil': 'LE',
    'Neutral evil': 'NE', 'Chaotic evil': 'CE'
  }
  return m[align] || '??'
}

export const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1
export const rollDice = (count: number, sides: number): number => {
  let t = 0
  for (let i = 0; i < count; i++) t += Math.floor(Math.random() * sides) + 1
  return t
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export const getNPCCategory = (id: string): string => {
  for (const [cat, names] of Object.entries(NPC_NAMES)) {
    if (names.includes(id)) return cat
  }
  return 'lesser_gods'
}

// Unified antagonist lookup — ANTAGONIST_POOL contains ALL antagonists
// (Greater Gods with phase descriptions + Super Monsters like Jormungandr, Malystryx)
// Falls back to ALL_GREATER_GODS for full Entity data if needed by codex/sidebar
export const getAntagonist = (antagonistId: string | null) => {
  if (!antagonistId) return undefined
  return getAntagonistById(antagonistId) || ALL_GREATER_GODS.find(g => g.id === antagonistId)
}

export const generateId = (): string => Math.random().toString(36).substring(2, 11)

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS RATE CALCULATOR
// Calculates campaign win probability based on multiple factors
// ═══════════════════════════════════════════════════════════════════════════

// (SuccessRateFactors interface is now in @/lib/gameTypes.ts)
export const calculateSuccessRate = (factors: SuccessRateFactors) => {
  // BASE: 50/50 chance - the campaign is designed to be challenging
  let base = 50
  
  // PARTY BONUS: +2 per living PC (max +10)
  const partyBonus = Math.min(10, factors.livingPCs * 2)
  
  // PROPHECY BONUS: Based on prophecy state
  const prophecyBonusMap: Record<string, number> = {
    'dormant': 0,
    'awakening': 3,
    'manifesting': 5,
    'fulfilled': 8,
    'broken': -5
  }
  const prophecyBonus = prophecyBonusMap[factors.prophecyState] || 0
  
  // ALLY BONUS: +3 per allied god (max +15)
  const allyBonus = Math.min(15, factors.alliedGods * 3)
  
  // RENOWN BONUS: Based on PC levels/titles
  const renownBonus = Math.min(8, factors.pcRenown)
  
  // POWER BONUS: Based on total PC HP
  const powerBonus = Math.min(10, Math.floor(factors.pcPower))
  
  // ALIGNMENT BONUS: Harmony check
  // Good vs Evil is -2, Law vs Chaos is -1, Same alignment groups is +2
  const alignmentBonus = Math.max(-5, Math.min(5, factors.alignmentHarmony))
  
  // MYTHICAL IMPACT: Story achievements, clues found, quests completed
  const mythicalBonus = Math.min(12, factors.storyAchievements * 2)
  
  // ANTAGONIST TYPE PENALTY: Greater Gods are harder than Monsters
  const antagonistPenalty = factors.antagonistType === 'greater_god' ? -5 : 0
  
  // CALCULATE TOTAL (capped 5-95 - always some chance)
  const total = Math.max(5, Math.min(95, 
    base + partyBonus + prophecyBonus + allyBonus + renownBonus + 
    powerBonus + alignmentBonus + mythicalBonus + antagonistPenalty
  ))
  
  return {
    total,
    breakdown: {
      base,
      party: partyBonus,
      prophecy: prophecyBonus,
      allies: allyBonus,
      renown: renownBonus,
      power: powerBonus,
      alignment: alignmentBonus,
      mythical: mythicalBonus
    }
  }
}

// Helper to calculate alignment harmony
export const calculateAlignmentHarmony = (alignments: string[]): number => {
  if (alignments.length <= 1) return 0
  
  let harmony = 0
  const goodCount = alignments.filter(a => a.toLowerCase().includes('good')).length
  const evilCount = alignments.filter(a => a.toLowerCase().includes('evil')).length
  const lawfulCount = alignments.filter(a => a.toLowerCase().includes('lawful')).length
  const chaoticCount = alignments.filter(a => a.toLowerCase().includes('chaotic')).length
  
  // Good + Evil in party = conflict
  if (goodCount > 0 && evilCount > 0) harmony -= 3
  // Law + Chaos in party = tension  
  if (lawfulCount > 0 && chaoticCount > 0) harmony -= 2
  // Unity bonuses
  if (goodCount >= 2) harmony += 1
  if (lawfulCount >= 2) harmony += 1
  
  return harmony
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY LOOKUP
// ═══════════════════════════════════════════════════════════════════════════

export const lookupEntity = async (nameOrId: string): Promise<Entity | null> => {
  const key = String(nameOrId).toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (key.includes('antagonist') || key.includes('shadow') || key === 'unknown') return null

  // Check cache first
  if (_entityCache[key]) return _entityCache[key]

  try {
    // Use local API endpoint instead of external worker
    const r = await fetch('/api/entity/' + encodeURIComponent(key))
    if (r.ok) {
      const data = await r.json()
      if (data && !data.error) {
        // Parse abilities from JSON string if needed
        let abilities = data.abilities || ['Basic Strike', 'Defend', 'Heroic Surge']
        if (typeof abilities === 'string') {
          try { abilities = JSON.parse(abilities) } catch { abilities = [abilities] }
        }
        
        const entity: Entity = {
          ...data,
          id: data.id || key,
          name: data.name || nameOrId.toUpperCase(),
          pantheon: data.pantheon || 'Unknown',
          align: data.align || 'Neutral',
          hp: data.hp || 150,
          maxHp: data.maxHp || data.hp || 150,
          AC: data.AC ?? 5,
          MR: data.MR || 0,
          abilities: abilities,
          conditions: [],
          dead: false,
          inventory: [],
          // Ability Scores
          str: data.str,
          int: data.int,
          wis: data.wis,
          dex: data.dex,
          con: data.con,
          cha: data.cha,
          // Class Levels
          level: data.level,
          fighterLevel: data.fighterLevel,
          clericLevel: data.clericLevel,
          magicUserLevel: data.magicUserLevel,
          thiefLevel: data.thiefLevel,
          // Combat
          attacks: data.attacks,
          damage: data.damage,
          move: data.move
        }
        _entityCache[key] = entity
        if (data.id) _entityCache[data.id] = entity
        return entity
      }
    }
  } catch (e) {
    console.warn('Entity lookup failed:', nameOrId, e)
  }

  // Fallback entity
  return {
    id: key,
    name: nameOrId.toUpperCase(),
    title: 'Unknown Hero',
    pantheon: 'Unknown',
    align: 'Neutral',
    hp: 150,
    maxHp: 150,
    AC: 5,
    MR: 0,
    abilities: ['Basic Strike', 'Defend', 'Heroic Surge'],
    personality: 'Brave and mysterious.',
    category: getNPCCategory(key),
    conditions: [],
    dead: false,
    inventory: []
  }
}
