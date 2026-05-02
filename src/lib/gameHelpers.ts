// gameHelpers.ts — Helper/utility functions extracted from page.tsx
// Pure utility functions, success rate calculators, and entity lookup

import type { Entity, PlayerSkills, SuccessRateFactors, Aspect, GameState } from '@/lib/gameTypes'
import { SKILL_ABILITY_MAP } from '@/lib/gameTypes'
import { NPC_NAMES, ALL_GREATER_GODS } from '@/lib/gameConstants'
import { getAntagonistById } from '@/lib/antagonistPool'


// Entity cache for lookupEntity (cleared on new campaign via clearEntityCache)
const _entityCache: { [key: string]: Entity } = {}

/** Clear entity cache — call when starting a new campaign to avoid stale data */
export const clearEntityCache = () => {
  for (const key of Object.keys(_entityCache)) delete _entityCache[key]
}
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
  return `/portraits/${category}/${entity.id}.png?v=3`
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

  // SHARD CHARGE BONUS: Each remaining shard charge is +2 (resource preservation)
  const shardChargeBonus = Math.min(6, factors.shardCharges * 2)

  // SHARD SUMMONED BONUS: Each god successfully summoned via shard is +3 (divine aid)
  const shardSummonedBonus = Math.min(9, factors.shardSummoned * 3)

  // COMPANION AFFINITY BONUS: High affinity = cooperative teamwork
  // ≥75 devoted (+5), ≥50 loyal (+3), ≥25 concerned (+1), ≥0 distant (0), <0 conflicted/hostile (penalty)
  let companionAffinityBonus = 0
  if (factors.companionAffinity >= 75) companionAffinityBonus = 5
  else if (factors.companionAffinity >= 50) companionAffinityBonus = 3
  else if (factors.companionAffinity >= 25) companionAffinityBonus = 1
  else if (factors.companionAffinity >= 0) companionAffinityBonus = 0
  else companionAffinityBonus = Math.max(-5, Math.floor(factors.companionAffinity / 20))

  // v2.44.0: COMPANION MOOD BONUS — mood now has a mechanical effect on outcomes
  // Devoted: +3 (companion goes above and beyond), Loyal: +1 (reliable support)
  // Concerned: 0 (distracted but present), Conflicted: -1 (hesitant, unreliable)
  // Distant: -2 (barely cooperating), Hostile: -4 (actively undermining)
  let companionMoodBonus = 0
  const moodMap: Record<string, number> = {
    'devoted': 3, 'loyal': 1, 'concerned': 0,
    'conflicted': -1, 'distant': -2, 'hostile': -4
  }
  companionMoodBonus = moodMap[factors.companionMood] ?? 0

  // INJURY PENALTY: Sum of all active injury modifiers (negative values hurt success rate)
  // Each injury typically has a modifier of -1 to -5; capped at -15 total
  const injuryPenalty = Math.max(-15, factors.injuryPenalty)

  // CALCULATE TOTAL (capped 5-95 - always some chance)
  const total = Math.max(5, Math.min(95, 
    base + partyBonus + prophecyBonus + allyBonus + renownBonus + 
    powerBonus + alignmentBonus + mythicalBonus + antagonistPenalty +
    shardChargeBonus + shardSummonedBonus + companionAffinityBonus + companionMoodBonus + injuryPenalty
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
      mythical: mythicalBonus,
      antagonist: antagonistPenalty,
      shardCharge: shardChargeBonus,
      shardSummoned: shardSummonedBonus,
      companionAffinity: companionAffinityBonus,
      companionMood: companionMoodBonus,
      injury: injuryPenalty
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

  // No fallback entity — if it's not in the codex, it doesn't exist.
  // This prevents the DM from inventing entities that get 150 HP placeholders.
  console.warn(`lookupEntity: "${nameOrId}" not found in codex — returning null`)
  return null
}

// ═══════════════════════════════════════════════════════════════════════════
// D&D 5e SKILL SYSTEM HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Get a specific ability score as integer (default 10)
export const getAbilityScore = (pc: Entity, abilityName: string): number => {
  const raw = (pc as unknown as Record<string, unknown>)[abilityName]
  if (typeof raw === 'string') return parseInt(raw) || 10
  if (typeof raw === 'number') return raw
  return 10
}

// Get skill modifier: proficiency bonus + ability modifier
export const getSkillModifier = (pc: Entity, skillName: keyof PlayerSkills, skills: PlayerSkills): number => {
  const proficiency = skills[skillName] || 0
  const abilityKey = SKILL_ABILITY_MAP[skillName]
  const abilityMod = getAbilityBonus(getAbilityScore(pc, abilityKey).toString()).value
  return proficiency + abilityMod
}

// Perform a skill check: d20 + modifier vs DC
export const performSkillCheck = (
  pc: Entity,
  skillName: keyof PlayerSkills,
  dc: number,
  skills: PlayerSkills
): { roll: number; modifier: number; total: number; success: boolean } => {
  const modifier = getSkillModifier(pc, skillName, skills)
  const roll = Math.floor(Math.random() * 20) + 1
  const total = roll + modifier
  return { roll, modifier, total, success: total >= dc }
}

// ═══════════════════════════════════════════════════════════════════════════
// FATE CORE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Spend a Fate Point to invoke an aspect
export const spendFatePoint = (
  gs: GameState,
  aspectName: string,
  reason: string
): GameState => {
  if (gs.fatePoints <= 0) return gs
  const updatedAspects = gs.aspects.map(a =>
    a.name === aspectName
      ? { ...a, invokes: a.invokes + 1, fate_points_spent: a.fate_points_spent + 1 }
      : a
  )
  return {
    ...gs,
    fatePoints: Math.max(0, gs.fatePoints - 1),
    aspects: updatedAspects,
    fatePointHistory: [...gs.fatePointHistory, { turn: gs.turn, type: 'spent', reason }]
  }
}

// Earn a Fate Point (compel or refresh)
export const earnFatePoint = (gs: GameState, reason: string): GameState => {
  return {
    ...gs,
    fatePoints: Math.min(5, gs.fatePoints + 1),
    fatePointHistory: [...gs.fatePointHistory, { turn: gs.turn, type: 'earned', reason }]
  }
}

// Add a new aspect to the player
export const addAspect = (gs: GameState, aspect: Aspect): GameState => {
  // Don't add duplicates
  if (gs.aspects.find(a => a.name === aspect.name)) return gs
  return {
    ...gs,
    aspects: [...gs.aspects, aspect]
  }
}

// Generate starting aspects based on PC characteristics
export const generateStartingAspects = (pc: Entity): Aspect[] => {
  const aspects: Aspect[] = []

  // 1. High Concept: Based on pantheon + class
  const fighterLvl = pc.fighterLevel || 0
  const clericLvl = pc.clericLevel || 0
  const muLvl = pc.magicUserLevel || 0
  const thiefLvl = pc.thiefLevel || 0
  const primaryClass = fighterLvl >= clericLvl && fighterLvl >= muLvl && fighterLvl >= thiefLvl
    ? 'Warrior'
    : clericLvl >= muLvl && clericLvl >= thiefLvl ? 'Priest'
    : muLvl >= thiefLvl ? 'Mage' : 'Shadow'

  const className = primaryClass === 'Warrior' ? 'Warrior'
    : primaryClass === 'Priest' ? 'Priest'
    : primaryClass === 'Mage' ? 'Mage'
    : 'Rogue'

  aspects.push({
    name: `${pc.pantheon} ${className}`,
    type: 'high_concept',
    invokes: 0,
    fate_points_spent: 0,
    description: `A ${className.toLowerCase()} of the ${pc.pantheon} pantheon`
  })

  // 2. Trouble: Based on alignment
  const alignLower = pc.align.toLowerCase()
  if (alignLower.includes('good')) {
    aspects.push({
      name: 'Cannot Abandon the Helpless',
      type: 'trouble',
      invokes: 0,
      fate_points_spent: 0,
      description: 'Your compassion makes you predictable and exploitable'
    })
  } else if (alignLower.includes('evil')) {
    aspects.push({
      name: 'Ambition Outpaces Wisdom',
      type: 'trouble',
      invokes: 0,
      fate_points_spent: 0,
      description: 'Your hunger for power blinds you to consequences'
    })
  } else {
    aspects.push({
      name: 'Torn Between Worlds',
      type: 'trouble',
      invokes: 0,
      fate_points_spent: 0,
      description: 'Your neutrality leaves you without allies in either camp'
    })
  }

  // 3. Character: Based on personality (first 8 words)
  const personality = pc.personality || 'Mysterious and resolute'
  const personalityWords = personality.split(/\s+/).slice(0, 8).join(' ')
  const cleanPersonality = toAscii(personalityWords)
    .replace(/[."']/g, '')
    .trim()

  aspects.push({
    name: cleanPersonality.length > 3 ? cleanPersonality : 'Enigmatic Stranger',
    type: 'character',
    invokes: 0,
    fate_points_spent: 0,
    description: personality
  })

  return aspects
}

// ═══════════════════════════════════════════════════════════════════════════
// STAMINA HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// Calculate stamina values from CON score
export const calculateStamina = (conScore: number): { maxStamina: number; regenRate: number } => {
  const conMod = Math.floor((conScore - 10) / 2)
  return {
    maxStamina: Math.max(10, 10 + conMod),
    regenRate: Math.max(1, 1 + conMod)
  }
}

// Regenerate stamina after a turn
export const regenStamina = (gs: GameState): GameState => {
  const newStamina = Math.min(gs.maxStamina, gs.stamina + gs.staminaRegenRate)
  return { ...gs, stamina: newStamina }
}

// Restore stamina to full (bonfire rest)
export const fullStaminaRestore = (gs: GameState): GameState => {
  return { ...gs, stamina: gs.maxStamina, bonfireRestCount: gs.bonfireRestCount + 1 }
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL PROFICIENCY ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

// Auto-assign proficiencies based on PC class levels and ability scores
export const assignSkillProficiencies = (pc: Entity): { skills: PlayerSkills; proficiencies: string[] } => {
  const skills: PlayerSkills = {
    athletics: 0, intimidation: 0,
    acrobatics: 0, sleight_of_hand: 0, stealth: 0,
    arcana: 0, history: 0, investigation: 0, nature: 0, religion: 0,
    animal_handling: 0, insight: 0, medicine: 0, perception: 0, survival: 0,
    deception: 0, performance: 0, persuasion: 0
  }
  const proficiencies: string[] = []
  const prof = (skill: keyof PlayerSkills) => {
    if (skills[skill] === 0) {
      skills[skill] = 2
      proficiencies.push(skill)
    }
  }

  // Class-based proficiencies
  if ((pc.fighterLevel || 0) > 0) {
    prof('athletics')
    prof('intimidation')
  }
  if ((pc.clericLevel || 0) > 0) {
    prof('religion')
    prof('medicine')
    prof('insight')
  }
  if ((pc.magicUserLevel || 0) > 0) {
    prof('arcana')
    prof('history')
    prof('investigation')
  }
  if ((pc.thiefLevel || 0) > 0) {
    prof('stealth')
    prof('sleight_of_hand')
    prof('acrobatics')
  }

  // Ability score-based proficiencies
  const cha = getAbilityScore(pc, 'cha')
  if (cha >= 15) {
    prof('deception')
    prof('persuasion')
    prof('performance')
  }

  const wis = getAbilityScore(pc, 'wis')
  if (wis >= 15) {
    prof('perception')
    prof('survival')
    prof('animal_handling')
  }

  const dex = getAbilityScore(pc, 'dex')
  if (dex >= 15) {
    prof('acrobatics')
    prof('stealth')
  }

  return { skills, proficiencies }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASS INFERENCE SYSTEM
// Parses Krynn level fields, non-Krynn ability strings, and falls back
// to ability scores to determine fighter/cleric/magic-user/thief levels.
// ═══════════════════════════════════════════════════════════════════════════

// Class name alias mapping — maps raw text to one of four canonical classes
const CLASS_ALIASES: Record<string, string> = {
  'mu': 'magic-user',
  'magic-user': 'magic-user',
  'magic user': 'magic-user',
  'magicuser': 'magic-user',
  'ranger': 'fighter',
  'paladin': 'fighter',
  'druid': 'cleric',
  'assassin': 'thief',
  'fighter': 'fighter',
  'cleric': 'cleric',
  'thief': 'thief',
}

/** Map a raw class name to one of the four canonical AD&D classes */
const mapClassName = (raw: string): string | null => {
  const key = raw.toLowerCase().trim()
  return CLASS_ALIASES[key] || null
}

/**
 * Parse a string containing ordinal + class pattern(s).
 * Handles: "10th ranger/8th fighter", "18th magic-user", "30th MU",
 *          "25th thief skills", "20th fighter/cleric", "15th druid spells"
 */
const parseClassLevelString = (text: string): Array<{ cls: string; level: number }> => {
  const results: Array<{ cls: string; level: number }> = []

  // Split by "/" for multi-class entries like "20th fighter/cleric"
  const parts = text.split('/')

  for (const part of parts) {
    const trimmed = part.trim()
    // Match ordinal number followed by a class word: "10th ranger", "18th magic-user"
    const match = trimmed.match(/(\d+)(?:st|nd|rd|th)\s+([a-zA-Z][\w-]*)/i)
    if (match) {
      const level = parseInt(match[1], 10)
      const rawClass = match[2]
      const canonical = mapClassName(rawClass)
      if (canonical && !isNaN(level) && level > 0) {
        results.push({ cls: canonical, level })
      }
    }
  }

  return results
}

/** Loose input type to accept Character, Entity, or raw data objects */
type ClassInferenceInput = {
  abilities?: string[]
  level?: string
  str?: string | number
  int?: string | number
  wis?: string | number
  dex?: string | number
  con?: string | number
  cha?: string | number
  pantheon?: string
}

/**
 * Infer AD&D class levels from a character's raw data.
 *
 * Strategy (tried in order, stops as soon as classes are found):
 * 1. Parse Krynn `level` field (free-text like "10th ranger/8th fighter")
 * 2. Parse non-Krynn `abilities` strings for ordinal+class patterns
 * 3. Fallback: map ability scores ≥ 16 to default mid-level (10)
 *
 * Returns an object with all four canonical class levels (0 = none).
 */
export const inferClassesFromCharacter = (
  char: ClassInferenceInput
): { fighterLevel: number; clericLevel: number; magicUserLevel: number; thiefLevel: number } => {
  let fighterLevel = 0
  let clericLevel = 0
  let magicUserLevel = 0
  let thiefLevel = 0
  let found = false

  /** Apply a parsed canonical class + level (keeps highest if duplicates) */
  const apply = (cls: string, level: number) => {
    if (cls === 'fighter') fighterLevel = Math.max(fighterLevel, level)
    else if (cls === 'cleric') clericLevel = Math.max(clericLevel, level)
    else if (cls === 'magic-user') magicUserLevel = Math.max(magicUserLevel, level)
    else if (cls === 'thief') thiefLevel = Math.max(thiefLevel, level)
  }

  // ── Step 1: Parse Krynn `level` field ──
  if (char.level) {
    const parsed = parseClassLevelString(char.level)
    for (const p of parsed) {
      apply(p.cls, p.level)
      found = true
    }
  }

  // ── Step 2: Parse non-Krynn `abilities` strings ──
  if (char.abilities && Array.isArray(char.abilities)) {
    for (const ability of char.abilities) {
      if (typeof ability !== 'string') continue
      const parsed = parseClassLevelString(ability)
      for (const p of parsed) {
        apply(p.cls, p.level)
        found = true
      }
    }
  }

  // ── Step 3: Fallback from ability scores ──
  if (!found) {
    const score = (val?: string | number): number => {
      if (val === undefined || val === null) return 10
      if (typeof val === 'number') return val
      return parseInt(val) || 10
    }
    if (score(char.str) >= 16) fighterLevel = 10
    if (score(char.int) >= 16) magicUserLevel = 10
    if (score(char.dex) >= 16) thiefLevel = 10
    if (score(char.wis) >= 16) clericLevel = 10
  }

  return { fighterLevel, clericLevel, magicUserLevel, thiefLevel }
}

/**
 * Get a human-readable class label from an Entity's class levels.
 * Returns something like "Fighter 25 / Thief 25 / Magic User 18".
 * Shows up to 3 classes, sorted by level descending.
 */
export const getClassLabel = (
  entity: { fighterLevel?: number; clericLevel?: number; magicUserLevel?: number; thiefLevel?: number }
): string => {
  const entries: Array<{ label: string; level: number }> = []

  if ((entity.fighterLevel || 0) > 0) entries.push({ label: 'Fighter', level: entity.fighterLevel! })
  if ((entity.clericLevel || 0) > 0) entries.push({ label: 'Cleric', level: entity.clericLevel! })
  if ((entity.magicUserLevel || 0) > 0) entries.push({ label: 'Magic User', level: entity.magicUserLevel! })
  if ((entity.thiefLevel || 0) > 0) entries.push({ label: 'Thief', level: entity.thiefLevel! })

  // Sort by level descending, then alphabetically as tiebreaker
  entries.sort((a, b) => b.level - a.level || a.label.localeCompare(b.label))

  // Return top 3
  return entries.slice(0, 3).map(e => `${e.label} ${e.level}`).join(' / ')
}
