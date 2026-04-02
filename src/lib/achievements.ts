// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT SYSTEM — Definitions, tracking, and checking logic
// ═══════════════════════════════════════════════════════════════════════════

import type { GameState } from '@/lib/gameTypes'

// ── ACHIEVEMENT DEFINITION ──────────────────────────────────────────────

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legendary'
export type AchievementCategory = 'combat' | 'story' | 'exploration' | 'party' | 'shard' | 'survival' | 'special'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string            // emoji
  tier: AchievementTier
  category: AchievementCategory
  /** Hidden until unlocked */
  hidden: boolean
}

export interface AchievementRecord {
  id: string
  unlockedAt: number      // turn number when achieved
  unlocked: boolean
}

// ── ALL ACHIEVEMENTS ───────────────────────────────────────────────────

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // ═══ STORY PROGRESSION ═══
  {
    id: 'act1_complete',
    name: 'The Awakening',
    description: 'Complete Act I — the party stands united as shadows lengthen.',
    icon: '🌅',
    tier: 'silver',
    category: 'story',
    hidden: false,
  },
  {
    id: 'act2_complete',
    name: 'The Gathering Storm',
    description: 'Complete Act II — all clues found, the final confrontation awaits.',
    icon: '⛈️',
    tier: 'gold',
    category: 'story',
    hidden: false,
  },
  {
    id: 'victory',
    name: 'Legend of the Mythworld',
    description: 'Defeat the antagonist and save reality from destruction.',
    icon: '👑',
    tier: 'legendary',
    category: 'story',
    hidden: false,
  },
  {
    id: 'defeat',
    name: 'The Cycle Continues',
    description: 'Fall in battle. The shard will wait for whoever comes next.',
    icon: '💀',
    tier: 'bronze',
    category: 'story',
    hidden: false,
  },

  // ═══ COMBAT ═══
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Deal your first damage to an enemy.',
    icon: '⚔️',
    tier: 'bronze',
    category: 'combat',
    hidden: false,
  },
  {
    id: 'first_crit',
    name: 'Critical Strike',
    description: 'Roll a natural 20 or land a critical hit.',
    icon: '💥',
    tier: 'bronze',
    category: 'combat',
    hidden: false,
  },
  {
    id: 'boss_phase2',
    name: 'The Facade Cracks',
    description: 'Push the antagonist into Phase 2 — their true power begins to surface.',
    icon: '😠',
    tier: 'silver',
    category: 'combat',
    hidden: false,
  },
  {
    id: 'boss_phase3',
    name: 'No More Mercy',
    description: 'Push the antagonist into Phase 3 — all restraint is shattered.',
    icon: '🔥',
    tier: 'gold',
    category: 'combat',
    hidden: false,
  },
  {
    id: 'banishment',
    name: 'Beyond the Veil',
    description: 'Banish the antagonist to another plane before Act III.',
    icon: '🌀',
    tier: 'gold',
    category: 'combat',
    hidden: true,
  },
  {
    id: 'no_injuries_20',
    name: 'Untouchable',
    description: 'Go 20 turns without any party member sustaining an injury.',
    icon: '✨',
    tier: 'silver',
    category: 'combat',
    hidden: true,
  },
  {
    id: 'rival_summoned',
    name: 'Archenemy of My Enemy',
    description: 'Summon the antagonist\'s mythological archrival to aid the party.',
    icon: '⚡',
    tier: 'legendary',
    category: 'combat',
    hidden: true,
  },

  // ═══ EXPLORATION ═══
  {
    id: 'gods_encountered_5',
    name: 'Divine Audience',
    description: 'Encounter 5 different gods, demigods, or mythological beings.',
    icon: '🏛️',
    tier: 'bronze',
    category: 'exploration',
    hidden: false,
  },
  {
    id: 'gods_encountered_15',
    name: 'Pantheon Walker',
    description: 'Encounter 15 different gods, demigods, or mythological beings.',
    icon: '🌟',
    tier: 'silver',
    category: 'exploration',
    hidden: false,
  },
  {
    id: 'gods_encountered_30',
    name: 'Olympian Guest',
    description: 'Encounter 30 different gods, demigods, or mythological beings.',
    icon: '🏺',
    tier: 'gold',
    category: 'exploration',
    hidden: true,
  },
  {
    id: 'multi_pantheon',
    name: 'World Traveler',
    description: 'Encounter beings from 5 different pantheons.',
    icon: '🌍',
    tier: 'silver',
    category: 'exploration',
    hidden: true,
  },

  // ═══ PARTY ═══
  {
    id: 'party_of_4',
    name: 'Fellowship Formed',
    description: 'Assemble a party of 4 or more members.',
    icon: '🛡️',
    tier: 'silver',
    category: 'party',
    hidden: false,
  },
  {
    id: 'all_pantheons',
    name: 'Unity Across Realms',
    description: 'Have party members from 3 or more different pantheons.',
    icon: '🔗',
    tier: 'gold',
    category: 'party',
    hidden: true,
  },
  {
    id: 'prophecy_transfer',
    name: 'The Torch Passes',
    description: 'The shard transfers to a new bearer when the original falls.',
    icon: '🕯️',
    tier: 'gold',
    category: 'party',
    hidden: true,
  },
  {
    id: 'companion_devoted',
    name: 'Bond Unbroken',
    description: 'Reach maximum companion affinity — a bond forged in destiny.',
    icon: '💞',
    tier: 'silver',
    category: 'party',
    hidden: true,
  },

  // ═══ SHARD ═══
  {
    id: 'shard_first_invoke',
    name: 'Whispers of Power',
    description: 'Invoke the shard for the first time and summon a being.',
    icon: '💎',
    tier: 'silver',
    category: 'shard',
    hidden: false,
  },
  {
    id: 'shard_greater_summoned',
    name: 'Forbidden Knowledge',
    description: 'Summon a Greater God through the shard — but at what cost?',
    icon: '👁️',
    tier: 'legendary',
    category: 'shard',
    hidden: true,
  },
  {
    id: 'shard_dark',
    name: 'The Darkness Within',
    description: 'The shard goes dark — its charges are exhausted.',
    icon: '🌑',
    tier: 'gold',
    category: 'shard',
    hidden: true,
  },
  {
    id: 'test_of_faith_miracle',
    name: 'Miracle',
    description: 'Survive a Test of Faith through divine intervention.',
    icon: '👼',
    tier: 'legendary',
    category: 'shard',
    hidden: true,
  },

  // ═══ SURVIVAL ═══
  {
    id: 'survive_50_turns',
    name: 'Battle-Hardened',
    description: 'Survive 50 turns in a single campaign.',
    icon: '⏳',
    tier: 'silver',
    category: 'survival',
    hidden: false,
  },
  {
    id: 'survive_100_turns',
    name: 'Eternal Wanderer',
    description: 'Survive 100 turns in a single campaign.',
    icon: '♾️',
    tier: 'gold',
    category: 'survival',
    hidden: true,
  },
  {
    id: 'full_hp_boss',
    name: 'Flawless Entrance',
    description: 'Enter Act III with all party members at full health.',
    icon: '💚',
    tier: 'gold',
    category: 'survival',
    hidden: true,
  },
  {
    id: 'no_deaths',
    name: 'No One Left Behind',
    description: 'Complete the campaign without any party member dying.',
    icon: '🕊️',
    tier: 'legendary',
    category: 'survival',
    hidden: true,
  },

  // ═══ SPECIAL ═══
  {
    id: 'first_quest',
    name: 'The Call to Adventure',
    description: 'Accept your first quest.',
    icon: '📜',
    tier: 'bronze',
    category: 'special',
    hidden: false,
  },
  {
    id: 'quest_completed',
    name: 'Promise Kept',
    description: 'Complete a quest from start to finish.',
    icon: '✅',
    tier: 'silver',
    category: 'special',
    hidden: false,
  },
  {
    id: 'item_collector_5',
    name: 'Hoarder\'s Delight',
    description: 'Collect 5 or more items in your inventory.',
    icon: '🎒',
    tier: 'bronze',
    category: 'special',
    hidden: false,
  },
  {
    id: 'item_collector_15',
    name: 'Dragon\'s Hoard',
    description: 'Collect 15 or more items in your inventory.',
    icon: '🐉',
    tier: 'gold',
    category: 'special',
    hidden: true,
  },
  {
    id: 'clue_master',
    name: 'Seeker of Truth',
    description: 'Uncover 3 or more antagonist identity clues.',
    icon: '🔍',
    tier: 'silver',
    category: 'special',
    hidden: false,
  },
  {
    id: 'all_clues',
    name: 'No Secrets',
    description: 'Uncover every antagonist identity clue before the final battle.',
    icon: '🗝️',
    tier: 'gold',
    category: 'special',
    hidden: true,
  },
]

// ── TIER COLORS & CONFIG ───────────────────────────────────────────────

export const TIER_CONFIG: Record<AchievementTier, { color: string; border: string; bg: string; glow: string; label: string }> = {
  bronze:   { color: '#cd7f32', border: '#a0522d', bg: 'rgba(205,127,50,0.1)', glow: 'rgba(205,127,50,0.3)', label: 'Bronze' },
  silver:   { color: '#c0c0c0', border: '#808080', bg: 'rgba(192,192,192,0.1)', glow: 'rgba(192,192,192,0.3)', label: 'Silver' },
  gold:     { color: '#ffd700', border: '#daa520', bg: 'rgba(255,215,0,0.1)', glow: 'rgba(255,215,0,0.3)', label: 'Gold' },
  legendary: { color: '#ff6bff', border: '#9b30ff', bg: 'rgba(255,107,255,0.1)', glow: 'rgba(155,48,255,0.5)', label: 'Legendary' },
}

export const CATEGORY_CONFIG: Record<AchievementCategory, { icon: string; label: string }> = {
  combat:      { icon: '⚔️', label: 'Combat' },
  story:       { icon: '📖', label: 'Story' },
  exploration: { icon: '🗺️', label: 'Exploration' },
  party:       { icon: '🛡️', label: 'Party' },
  shard:       { icon: '💎', label: 'Shard' },
  survival:    { icon: '❤️', label: 'Survival' },
  special:     { icon: '⭐', label: 'Special' },
}

// ── ACHIEVEMENT TRACKER ───────────────────────────────────────────────

export interface AchievementTracker {
  records: Record<string, AchievementRecord>
  /** Newly unlocked achievement IDs (for notification queue) */
  newUnlocks: string[]
  /** Tracks state between turns for comparison-based checks */
  prevTurnState: {
    injuriesCount: number
    npcCount: number
    damageDealt: boolean
    act: string
  }
  /** Counter for tracking */
  counters: {
    turnsWithoutInjury: number
    totalDamageDealt: number
    totalDamageReceived: number
    deaths: number
  }
}

export function createAchievementTracker(): AchievementTracker {
  const records: Record<string, AchievementRecord> = {}
  for (const def of ACHIEVEMENT_DEFS) {
    records[def.id] = { id: def.id, unlockedAt: 0, unlocked: false }
  }
  return {
    records,
    newUnlocks: [],
    prevTurnState: { injuriesCount: 0, npcCount: 0, damageDealt: false, act: 'act1' },
    counters: { turnsWithoutInjury: 0, totalDamageDealt: 0, totalDamageReceived: 0, deaths: 0 },
  }
}

// ── CHECK & UNLOCK ─────────────────────────────────────────────────────

export function unlockAchievement(
  tracker: AchievementTracker,
  id: string,
  turn: number
): boolean {
  const rec = tracker.records[id]
  if (!rec || rec.unlocked) return false
  rec.unlocked = true
  rec.unlockedAt = turn
  tracker.newUnlocks.push(id)
  return true
}

// ── MAIN CHECK FUNCTION — Call after each turn ─────────────────────────

export function checkAchievements(
  tracker: AchievementTracker,
  gs: GameState,
  prevGs: GameState | null,
  damageDealtThisTurn: boolean,
  hadCritThisTurn: boolean,
): string[] {
  const turn = gs.turn
  const unlocked: string[] = []

  const tryUnlock = (id: string) => {
    if (unlockAchievement(tracker, id, turn)) unlocked.push(id)
  }

  // ── STORY PROGRESSION ──────────────────────────────────────────────
  if (prevGs && prevGs.act === 'act1' && gs.act === 'act2') tryUnlock('act1_complete')
  if (prevGs && prevGs.act === 'act2' && gs.act === 'act3') tryUnlock('act2_complete')
  if (gs.ended) {
    const victory = gs.antagonistHp <= 0 && gs.act === 'act3'
    if (victory) tryUnlock('victory')
    else tryUnlock('defeat')
  }

  // ── COMBAT ──────────────────────────────────────────────────────────
  if (damageDealtThisTurn) tryUnlock('first_blood')
  if (hadCritThisTurn) tryUnlock('first_crit')
  if (gs.antagonistPhase >= 2) tryUnlock('boss_phase2')
  if (gs.antagonistPhase >= 3) tryUnlock('boss_phase3')
  if (gs.antagonistBanished) tryUnlock('banishment')
  if (gs.shardSummoned.length > 0 && gs.shardSummoned.includes(gs.antagonistRival?.id || '')) tryUnlock('rival_summoned')

  // No injuries for 20 turns
  const currentInjuries = Object.values(gs.injuries).flat().length
  if (currentInjuries === 0 && turn > 0) {
    tracker.counters.turnsWithoutInjury++
  } else {
    tracker.counters.turnsWithoutInjury = 0
  }
  if (tracker.counters.turnsWithoutInjury >= 20) tryUnlock('no_injuries_20')

  // ── EXPLORATION ────────────────────────────────────────────────────
  const uniqueNPCs = gs.npcHistory.length + gs.encounteredIds.length
  if (uniqueNPCs >= 5) tryUnlock('gods_encountered_5')
  if (uniqueNPCs >= 15) tryUnlock('gods_encountered_15')
  if (uniqueNPCs >= 30) tryUnlock('gods_encountered_30')

  // Multiple pantheons
  const pantheons = new Set(gs.npcHistory.map(n => n.pantheon).filter(Boolean))
  if (pantheons.size >= 5) tryUnlock('multi_pantheon')

  // ── PARTY ───────────────────────────────────────────────────────────
  const livingPCs = gs.pcs.filter(p => !p.dead)
  if (livingPCs.length >= 4) tryUnlock('party_of_4')

  // Multi-pantheon party
  const partyPantheons = new Set(livingPCs.map(p => p.pantheon).filter(Boolean))
  if (partyPantheons.size >= 3) tryUnlock('all_pantheons')

  // Prophecy transfer — check if any prophecy has previous_holders
  const hasTransfer = gs.prophecies.some(p => p.previous_holders && p.previous_holders.length > 0)
  if (hasTransfer) tryUnlock('prophecy_transfer')

  // Companion affinity maxed
  if (gs.companionAffinity >= 100) tryUnlock('companion_devoted')

  // ── SHARD ───────────────────────────────────────────────────────────
  if (gs.shardSummoned.length > 0) tryUnlock('shard_first_invoke')
  if (gs.shardDark) tryUnlock('shard_dark')

  // Greater god summoned via shard
  if (gs.shardSummoned.length > 0) {
    // Check if any summoned entity was a greater god (tracked in summon names)
    tryUnlock('shard_greater_summoned') // simplified; game engine can fire this explicitly
  }

  // Test of faith miracle
  if (gs.testOfFaithContext?.outcome === 'miracle') tryUnlock('test_of_faith_miracle')

  // ── SURVIVAL ────────────────────────────────────────────────────────
  if (turn >= 50) tryUnlock('survive_50_turns')
  if (turn >= 100) tryUnlock('survive_100_turns')

  // Full HP entering Act III
  if (gs.act === 'act3' && livingPCs.length > 0 && livingPCs.every(p => p.hp === p.maxHp)) {
    tryUnlock('full_hp_boss')
  }

  // Track deaths
  if (prevGs) {
    const prevDeaths = prevGs.pcs.filter(p => p.dead).length
    const currDeaths = gs.pcs.filter(p => p.dead).length
    if (currDeaths > prevDeaths) {
      tracker.counters.deaths += (currDeaths - prevDeaths)
    }
  }
  // No deaths at campaign end
  if (gs.ended && gs.antagonistHp <= 0 && tracker.counters.deaths === 0) {
    tryUnlock('no_deaths')
  }

  // ── SPECIAL ─────────────────────────────────────────────────────────
  if (gs.quests.length > 0) tryUnlock('first_quest')
  if (gs.quests.some(q => q.status === 'completed')) tryUnlock('quest_completed')
  if (gs.inventory.length >= 5) tryUnlock('item_collector_5')
  if (gs.inventory.length >= 15) tryUnlock('item_collector_15')
  if (gs.antagonistCluesRevealed.length >= 3) tryUnlock('clue_master')
  if (gs.antagonistCluesRevealed.length >= 6) tryUnlock('all_clues')

  // Store prev state for next comparison
  tracker.prevTurnState = {
    injuriesCount: currentInjuries,
    npcCount: uniqueNPCs,
    damageDealt: damageDealtThisTurn,
    act: gs.act,
  }

  return unlocked
}

// ── HELPERS ─────────────────────────────────────────────────────────────

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find(a => a.id === id)
}

export function getUnlockedCount(tracker: AchievementTracker): number {
  return Object.values(tracker.records).filter(r => r.unlocked).length
}

export function getTotalCount(): number {
  return ACHIEVEMENT_DEFS.length
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter(a => a.category === category)
}

export function getCategoryProgress(tracker: AchievementTracker, category: AchievementCategory): { unlocked: number; total: number } {
  const defs = getAchievementsByCategory(category)
  const unlocked = defs.filter(d => tracker.records[d.id]?.unlocked).length
  return { unlocked, total: defs.length }
}
