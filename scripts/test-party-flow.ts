// Test Flow Script: Party Selection & Alliance System
// Simulates the complete flow from selection to Act 3 convergence

import { GREATER_GODS, LESSER_GODS, DEMIGODS, HEROES, MONSTERS } from '../src/lib/characterData'
import { ALL_KRYNN_CHARACTERS } from '../src/lib/krynnCharacters'
import { ANTAGONIST_POOL, rollAntagonist } from '../src/lib/antagonistPool'
import { rollProphecy, PROPHECIES } from '../src/lib/prophecyData'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PartyMember {
  id: string
  name: string
  rank: 'Hero' | 'Demigod'
  role: 'main' | 'companion' | 'rotating_hero' | 'rotating_demigod'
  presence: 'always' | 'mostly' | 'sometimes'
  align: string
  pantheon: string
  hp: number
  alive: boolean
  prophecyId?: number
}

interface Entity {
  id: string
  name: string
  rank: string
  align: string
  pantheon: string
  hp: number
  divineRank?: string
  category?: string
}

interface Ally {
  id: string
  name: string
  rank: string
  pantheon: string
  align: string
  joinedAct: number
  allianceReason: string
}

// ═══════════════════════════════════════════════════════════════════════════
// ALLIANCE SYSTEM - Alignment Compatibility Matrix
// ═══════════════════════════════════════════════════════════════════════════

const ALIGNMENT_MATRIX: { [key: string]: { [key: string]: number } } = {
  'Lawful good':     { 'Lawful good': 2, 'Neutral good': 1, 'Chaotic good': 0, 'Lawful neutral': 1, 'Neutral': 0, 'Chaotic neutral': -1, 'Lawful evil': -1, 'Neutral evil': -2, 'Chaotic evil': -2 },
  'Neutral good':    { 'Lawful good': 1, 'Neutral good': 2, 'Chaotic good': 1, 'Lawful neutral': 0, 'Neutral': 1, 'Chaotic neutral': 0, 'Lawful evil': -1, 'Neutral evil': -1, 'Chaotic evil': -2 },
  'Chaotic good':    { 'Lawful good': 0, 'Neutral good': 1, 'Chaotic good': 2, 'Lawful neutral': -1, 'Neutral': 0, 'Chaotic neutral': 1, 'Lawful evil': -2, 'Neutral evil': -1, 'Chaotic evil': -1 },
  'Lawful neutral':  { 'Lawful good': 1, 'Neutral good': 0, 'Chaotic good': -1, 'Lawful neutral': 2, 'Neutral': 1, 'Chaotic neutral': 0, 'Lawful evil': 1, 'Neutral evil': 0, 'Chaotic evil': -1 },
  'Neutral':         { 'Lawful good': 0, 'Neutral good': 1, 'Chaotic good': 0, 'Lawful neutral': 1, 'Neutral': 2, 'Chaotic neutral': 1, 'Lawful evil': 0, 'Neutral evil': 1, 'Chaotic evil': 0 },
  'Chaotic neutral': { 'Lawful good': -1, 'Neutral good': 0, 'Chaotic good': 1, 'Lawful neutral': 0, 'Neutral': 1, 'Chaotic neutral': 2, 'Lawful evil': -1, 'Lawful evil': 0, 'Chaotic evil': 1 },
  'Lawful evil':     { 'Lawful good': -1, 'Neutral good': -1, 'Chaotic good': -2, 'Lawful neutral': 1, 'Neutral': 0, 'Chaotic neutral': -1, 'Lawful evil': 2, 'Neutral evil': 1, 'Chaotic evil': 0 },
  'Neutral evil':    { 'Lawful good': -2, 'Neutral good': -1, 'Chaotic good': -1, 'Lawful neutral': 0, 'Neutral': 1, 'Chaotic neutral': 0, 'Lawful evil': 1, 'Neutral evil': 2, 'Chaotic evil': 1 },
  'Chaotic evil':    { 'Lawful good': -2, 'Neutral good': -2, 'Chaotic good': -1, 'Lawful neutral': -1, 'Neutral': 0, 'Chaotic neutral': 1, 'Lawful evil': 0, 'Neutral evil': 1, 'Chaotic evil': 2 }
}

// Calculate mythical impact score
function calculateMythicalImpact(entity: Entity): number {
  let impact = 0
  
  // Divine Rank weights
  const rankWeights: { [key: string]: number } = {
    'Greater God': 50,
    'Lesser God': 35,
    'Demigod': 20,
    'Hero': 10
  }
  
  impact += rankWeights[entity.divineRank || entity.rank] || 5
  impact += Math.floor((entity.hp || 1) / 10)
  
  return impact
}

// Calculate alliance chance
function calculateAllianceChance(entity: Entity, mainPC: PartyMember): number {
  // Base 50%
  let chance = 50
  
  // Alignment compatibility (+/- 30 max)
  const pcAlign = mainPC.align || 'Neutral'
  const entityAlign = entity.align || 'Neutral'
  const alignScore = ALIGNMENT_MATRIX[pcAlign]?.[entityAlign] ?? 0
  chance += alignScore * 15
  
  // Mythical impact ratio (+/- 10 max)
  const pcImpact = calculateMythicalImpact({ ...mainPC, rank: mainPC.rank } as Entity)
  const entityImpact = calculateMythicalImpact(entity)
  const impactRatio = pcImpact / Math.max(entityImpact, 1)
  chance += Math.min(impactRatio * 5, 10)
  
  // Clamp between 10% and 90%
  return Math.max(10, Math.min(90, Math.round(chance)))
}

// ═══════════════════════════════════════════════════════════════════════════
// POOL GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function getPCPool(): Entity[] {
  const heroes = HEROES.map(h => ({
    ...h,
    rank: 'Hero',
    divineRank: 'Hero'
  }))
  
  const demigods = DEMIGODS.map(d => ({
    ...d,
    rank: 'Demigod',
    divineRank: 'Demigod'
  }))
  
  // Add Krynn heroes and demigods
  const krynnHeroes = ALL_KRYNN_CHARACTERS
    .filter(k => k.divineRank === 'Hero')
    .map(k => ({ ...k, rank: 'Hero' }))
  
  const krynnDemigods = ALL_KRYNN_CHARACTERS
    .filter(k => k.divineRank === 'Demigod')
    .map(k => ({ ...k, rank: 'Demigod' }))
  
  return [...heroes, ...demigods, ...krynnHeroes, ...krynnDemigods]
}

function getEncounterPool(): Entity[] {
  const greaterGods = GREATER_GODS.map(g => ({
    ...g,
    rank: 'Greater God',
    divineRank: 'Greater God'
  }))
  
  const lesserGods = LESSER_GODS.map(l => ({
    ...l,
    rank: 'Lesser God',
    divineRank: 'Lesser God'
  }))
  
  const heroes = HEROES.map(h => ({
    ...h,
    rank: 'Hero',
    divineRank: 'Hero'
  }))
  
  const demigods = DEMIGODS.map(d => ({
    ...d,
    rank: 'Demigod',
    divineRank: 'Demigod'
  }))
  
  const krynn = ALL_KRYNN_CHARACTERS.map(k => ({
    ...k,
    rank: k.divineRank || 'Hero'
  }))
  
  return [...greaterGods, ...lesserGods, ...heroes, ...demigods, ...krynn]
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTY SELECTION FLOW
// ═══════════════════════════════════════════════════════════════════════════

function selectParty(pool: Entity[]): { party: PartyMember[], logs: string[] } {
  const logs: string[] = []
  const party: PartyMember[] = []
  const usedIds = new Set<string>()
  
  // Separate heroes and demigods
  const heroes = pool.filter(e => e.divineRank === 'Hero' || e.rank === 'Hero')
  const demigods = pool.filter(e => e.divineRank === 'Demigod' || e.rank === 'Demigod')
  
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('PHASE 1: HUMAN SELECTION')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push(`Pool: ${heroes.length} Heroes, ${demigods.length} Demigods = ${pool.length} total`)
  logs.push('')
  
  // 1. Human selects Main PC (simulate random pick for test)
  const mainIndex = Math.floor(Math.random() * pool.length)
  const mainEntity = pool[mainIndex]
  usedIds.add(mainEntity.id)
  party.push({
    id: mainEntity.id,
    name: mainEntity.name,
    rank: mainEntity.divineRank === 'Hero' ? 'Hero' : 'Demigod',
    role: 'main',
    presence: 'always',
    align: mainEntity.align || 'Neutral',
    pantheon: mainEntity.pantheon,
    hp: mainEntity.hp || 50,
    alive: true
  })
  logs.push(`🎮 HUMAN SELECTS MAIN PC: ${mainEntity.name} (${mainEntity.pantheon} ${mainEntity.divineRank})`)
  logs.push(`   Alignment: ${mainEntity.align}`)
  logs.push(`   HP: ${mainEntity.hp}`)
  
  // 2. Human selects Companion (simulate random pick for test)
  const availableForCompanion = pool.filter(e => !usedIds.has(e.id))
  const companionIndex = Math.floor(Math.random() * availableForCompanion.length)
  const companionEntity = availableForCompanion[companionIndex]
  usedIds.add(companionEntity.id)
  party.push({
    id: companionEntity.id,
    name: companionEntity.name,
    rank: companionEntity.divineRank === 'Hero' ? 'Hero' : 'Demigod',
    role: 'companion',
    presence: 'mostly',
    align: companionEntity.align || 'Neutral',
    pantheon: companionEntity.pantheon,
    hp: companionEntity.hp || 50,
    alive: true
  })
  logs.push(`🎮 HUMAN SELECTS COMPANION: ${companionEntity.name} (${companionEntity.pantheon} ${companionEntity.divineRank})`)
  logs.push(`   Alignment: ${companionEntity.align}`)
  logs.push(`   HP: ${companionEntity.hp}`)
  logs.push('')
  
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('PHASE 2: RNG SELECTION')
  logs.push('═════════════════════════════════════════════════════════════')
  
  // 3. RNG selects 3 Heroes
  const availableHeroes = heroes.filter(e => !usedIds.has(e.id))
  logs.push(`\n🎲 RNG ROLLING FOR 3 ROTATING HEROES...`)
  for (let i = 0; i < 3 && availableHeroes.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableHeroes.length)
    const hero = availableHeroes.splice(idx, 1)[0]
    usedIds.add(hero.id)
    party.push({
      id: hero.id,
      name: hero.name,
      rank: 'Hero',
      role: 'rotating_hero',
      presence: 'sometimes',
      align: hero.align || 'Neutral',
      pantheon: hero.pantheon,
      hp: hero.hp || 50,
      alive: true
    })
    logs.push(`   Hero ${i + 1}: ${hero.name} (${hero.pantheon})`)
  }
  
  // 4. RNG selects 3 Demigods
  const availableDemigods = demigods.filter(e => !usedIds.has(e.id))
  logs.push(`\n🎲 RNG ROLLING FOR 3 ROTATING DEMIGODS...`)
  for (let i = 0; i < 3 && availableDemigods.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableDemigods.length)
    const demigod = availableDemigods.splice(idx, 1)[0]
    usedIds.add(demigod.id)
    party.push({
      id: demigod.id,
      name: demigod.name,
      rank: 'Demigod',
      role: 'rotating_demigod',
      presence: 'sometimes',
      align: demigod.align || 'Neutral',
      pantheon: demigod.pantheon,
      hp: demigod.hp || 50,
      alive: true
    })
    logs.push(`   Demigod ${i + 1}: ${demigod.name} (${demigod.pantheon})`)
  }
  
  logs.push('')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('FINAL PARTY (8 PCs)')
  logs.push('═════════════════════════════════════════════════════════════')
  
  party.forEach((p, i) => {
    const presenceIcon = p.presence === 'always' ? '⭐' : p.presence === 'mostly' ? '🌟' : '💫'
    logs.push(`${i + 1}. ${presenceIcon} ${p.name} [${p.role.toUpperCase()}] (${p.pantheon} ${p.rank})`)
  })
  
  return { party, logs }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPHECY ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════

function assignProphecy(party: PartyMember[]): { logs: string[], mainPCProphecy: number } {
  const logs: string[] = []
  
  logs.push('')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('PROPHECY ASSIGNMENT (d9 roll)')
  logs.push('═════════════════════════════════════════════════════════════')
  
  // Only Main PC gets the prophecy
  const mainPC = party.find(p => p.role === 'main')
  if (!mainPC) return { logs, mainPCProphecy: 1 }
  
  const prophecy = rollProphecy()
  mainPC.prophecyId = prophecy.id
  
  logs.push(`🎲 ROLL: ${prophecy.id} → "${prophecy.name}"`)
  logs.push('')
  logs.push(`📜 THE PROPHECY (shown to player as cryptic riddle):`)
  logs.push(`   "${prophecy.riddle.substring(0, 150)}..."`)
  logs.push('')
  logs.push(`🔮 DM SECRET: This is the "${prophecy.name}" prophecy`)
  logs.push(`   Theme: ${prophecy.theme}`)
  logs.push(`   Act 1 Hint: ${prophecy.act1_hint.substring(0, 80)}...`)
  
  return { logs, mainPCProphecy: prophecy.id }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANTAGONIST SELECTION
// ═══════════════════════════════════════════════════════════════════════════

function selectAntagonist(): { antagonist: Entity, logs: string[] } {
  const logs: string[] = []
  
  logs.push('')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('ANTAGONIST SELECTION (Hidden until Act 3)')
  logs.push('═════════════════════════════════════════════════════════════')
  
  const antagonist = rollAntagonist()
  
  logs.push(`🎲 ROLLED: ${antagonist.name} (${antagonist.type.toUpperCase()})`)
  logs.push(`   Pantheon: ${antagonist.pantheon}`)
  logs.push(`   Alignment: ${antagonist.align}`)
  logs.push(`   HP: ${antagonist.hp}, AC: ${antagonist.AC}, MR: ${antagonist.MR}%`)
  logs.push(`   Domain: ${antagonist.domain}`)
  logs.push('')
  logs.push(`⚠️  DM SECRET: Do not reveal to players until Act 3!`)
  logs.push(`   Clues to drop: Pantheon="${antagonist.pantheon}", First Letter="${antagonist.name.charAt(0)}"`)
  
  return { 
    antagonist: {
      id: antagonist.id,
      name: antagonist.name,
      rank: antagonist.type,
      align: antagonist.align,
      pantheon: antagonist.pantheon,
      hp: antagonist.hp
    }, 
    logs 
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTS 1 & 2: ENCOUNTERS & ALLIANCES
// ═══════════════════════════════════════════════════════════════════════════

function simulateEncounters(
  party: PartyMember[], 
  encounterPool: Entity[],
  antagonist: Entity
): { allies: Ally[], logs: string[] } {
  const logs: string[] = []
  const allies: Ally[] = []
  const mainPC = party.find(p => p.role === 'main')!
  const companion = party.find(p => p.role === 'companion')!
  
  logs.push('')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('ACT 1: ENCOUNTERS & ALLIANCE BUILDING')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push(`Main PC: ${mainPC.name} (${mainPC.align})`)
  logs.push(`Companion: ${companion.name} (${companion.align})`)
  logs.push('')
  
  // Filter out party members and antagonist from encounters
  const availableEncounters = encounterPool.filter(e => 
    !party.find(p => p.id === e.id) && e.id !== antagonist.id
  )
  
  // Simulate 5 encounters in Act 1
  logs.push('--- ENCOUNTER SIMULATION (5 encounters) ---\n')
  
  for (let i = 0; i < 5; i++) {
    const entity = availableEncounters[Math.floor(Math.random() * availableEncounters.length)]
    if (!entity) continue
    
    const chance = calculateAllianceChance(entity, mainPC)
    const roll = Math.floor(Math.random() * 100) + 1
    const success = roll <= chance
    
    logs.push(`Encounter ${i + 1}: ${entity.name} (${entity.divineRank || entity.rank}, ${entity.pantheon})`)
    logs.push(`   Alignment: ${entity.align}`)
    logs.push(`   Alliance Chance: ${chance}% | Roll: ${roll} → ${success ? '✅ ALLY' : '❌ REFUSED'}`)
    
    if (success) {
      allies.push({
        id: entity.id,
        name: entity.name,
        rank: entity.divineRank || entity.rank || 'Unknown',
        pantheon: entity.pantheon,
        align: entity.align || 'Neutral',
        joinedAct: 1,
        allianceReason: `Alignment compatible (${chance}% chance rolled ${roll})`
      })
    }
    logs.push('')
  }
  
  // Simulate 5 encounters in Act 2
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('ACT 2: MORE ENCOUNTERS')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('')
  
  for (let i = 0; i < 5; i++) {
    const entity = availableEncounters[Math.floor(Math.random() * availableEncounters.length)]
    if (!entity) continue
    
    const chance = calculateAllianceChance(entity, mainPC)
    const roll = Math.floor(Math.random() * 100) + 1
    const success = roll <= chance
    
    logs.push(`Encounter ${i + 1}: ${entity.name} (${entity.divineRank || entity.rank}, ${entity.pantheon})`)
    logs.push(`   Alignment: ${entity.align}`)
    logs.push(`   Alliance Chance: ${chance}% | Roll: ${roll} → ${success ? '✅ ALLY' : '❌ REFUSED'}`)
    
    if (success) {
      allies.push({
        id: entity.id,
        name: entity.name,
        rank: entity.divineRank || entity.rank || 'Unknown',
        pantheon: entity.pantheon,
        align: entity.align || 'Neutral',
        joinedAct: 2,
        allianceReason: `Alignment compatible (${chance}% chance rolled ${roll})`
      })
    }
    logs.push('')
  }
  
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('ALLIANCE SUMMARY')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push(`Total Allies Recruited: ${allies.length}`)
  logs.push('')
  allies.forEach((a, i) => {
    logs.push(`${i + 1}. ${a.name} (${a.rank}, ${a.pantheon}) - Joined in Act ${a.joinedAct}`)
  })
  
  return { allies, logs }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT 3: CONVERGENCE
// ═══════════════════════════════════════════════════════════════════════════

function simulateAct3(
  party: PartyMember[], 
  allies: Ally[], 
  antagonist: Entity
): { logs: string[], victory: boolean } {
  const logs: string[] = []
  
  logs.push('')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('ACT 3: THE CONVERGENCE')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('')
  
  // Count surviving PCs
  const survivingPCs = party.filter(p => p.alive)
  logs.push(`📊 SURVIVING PCs: ${survivingPCs.length}/8`)
  survivingPCs.forEach(p => {
    logs.push(`   ${p.role === 'main' ? '⭐' : p.role === 'companion' ? '🌟' : '💫'} ${p.name} (${p.rank})`)
  })
  logs.push('')
  
  // Show allies
  logs.push(`📊 ALLIED NPCs: ${allies.length}`)
  allies.forEach(a => {
    logs.push(`   🤝 ${a.name} (${a.rank}, ${a.pantheon})`)
  })
  logs.push('')
  
  // Reveal antagonist
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('⚠️  ANTAGONIST REVEALED!')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push(`\n👿 ${antagonist.name} (${antagonist.rank})`)
  logs.push(`   Pantheon: ${antagonist.pantheon}`)
  logs.push(`   Alignment: ${antagonist.align}`)
  logs.push(`   HP: ${antagonist.hp}`)
  logs.push('')
  
  // Simulate the final battle (50/50 chance)
  const battleRoll = Math.random()
  const victory = battleRoll >= 0.5
  
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('FINAL BATTLE SIMULATION')
  logs.push('═════════════════════════════════════════════════════════════')
  logs.push('')
  logs.push(`🎲 Victory Chance: 50% | Roll: ${Math.round(battleRoll * 100)}%`)
  logs.push('')
  
  if (victory) {
    logs.push('🏆 VICTORY! The party and their allies defeat the antagonist!')
    logs.push(`   ${survivingPCs[0]?.name || 'The hero'} fulfills their prophecy!`)
  } else {
    logs.push('💀 DEFEAT! The antagonist proves too powerful...')
    logs.push('   But the prophecy continues - another will rise!')
  }
  
  return { logs, victory }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST FLOW
// ═══════════════════════════════════════════════════════════════════════════

function runTestFlow(): void {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║     DEITIES & DEMIGODS - MYTHWORLD ENGINE: PARTY FLOW TEST          ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝')
  console.log('')
  
  // Get pools
  const pcPool = getPCPool()
  const encounterPool = getEncounterPool()
  
  console.log(`📊 PC Pool Size: ${pcPool.length} (Heroes + Demigods from all pantheons)`)
  console.log(`📊 Encounter Pool Size: ${encounterPool.length} (All entities)`)
  
  // Phase 1: Party Selection
  const { party, logs: partyLogs } = selectParty(pcPool)
  partyLogs.forEach(l => console.log(l))
  
  // Phase 2: Prophecy Assignment
  const { logs: prophecyLogs } = assignProphecy(party)
  prophecyLogs.forEach(l => console.log(l))
  
  // Phase 3: Antagonist Selection
  const { antagonist, logs: antagonistLogs } = selectAntagonist()
  antagonistLogs.forEach(l => console.log(l))
  
  // Phase 4: Acts 1 & 2 Encounters
  const { allies, logs: encounterLogs } = simulateEncounters(party, encounterPool, antagonist)
  encounterLogs.forEach(l => console.log(l))
  
  // Phase 5: Act 3 Convergence
  const { logs: act3Logs } = simulateAct3(party, allies, antagonist)
  act3Logs.forEach(l => console.log(l))
  
  console.log('\n═════════════════════════════════════════════════════════════')
  console.log('TEST FLOW COMPLETE')
  console.log('═════════════════════════════════════════════════════════════\n')
}

// Run the test
runTestFlow()
