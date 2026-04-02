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
  {
    id: 'perfectionist',
    name: 'Completionist',
    description: 'Complete every quest in a single campaign — no task left undone.',
    icon: '📋',
    tier: 'legendary',
    category: 'special',
    hidden: true,
  },

  // ═══ DIVINE & FATE ═══
  {
    id: 'prophecy_fulfilled',
    name: 'The Oracle Speaks True',
    description: 'Witness a prophecy come to fulfillment.',
    icon: '🔮',
    tier: 'silver',
    category: 'special',
    hidden: false,
  },
  {
    id: 'prophecy_broken',
    name: 'Fate Undone',
    description: 'A prophecy shatters — destiny is not yet written.',
    icon: '💔',
    tier: 'gold',
    category: 'special',
    hidden: true,
  },
  {
    id: 'test_of_faith_veteran',
    name: 'Tempted Three Times',
    description: 'Face 3 or more Tests of Faith in a single campaign.',
    icon: '🎪',
    tier: 'gold',
    category: 'shard',
    hidden: true,
  },
  {
    id: 'murphys_law',
    name: "Murphy's Law",
    description: 'Experience the worst outcome of a Test of Faith. The gods are cruel.',
    icon: '🤡',
    tier: 'bronze',
    category: 'shard',
    hidden: true,
  },
  {
    id: 'fate_trusted',
    name: 'Trust in the Unknown',
    description: 'Choose "Trust Fate" during a Test of Faith — surrendering control.',
    icon: '🎲',
    tier: 'silver',
    category: 'shard',
    hidden: true,
  },

  // ═══ WEALTH & POWER ═══
  {
    id: 'midas_touch',
    name: "Midas' Touch",
    description: 'Accumulate 5000 or more gold in your treasury.',
    icon: '💰',
    tier: 'gold',
    category: 'special',
    hidden: true,
  },
  {
    id: 'dragon_hoard',
    name: 'Smaug\'s Jealousy',
    description: 'Accumulate 10000 or more gold — a hoard fit for a dragon.',
    icon: '🐲',
    tier: 'legendary',
    category: 'special',
    hidden: true,
  },

  // ═══ DAMAGE MILESTONES ═══
  {
    id: 'wrath_of_gods',
    name: 'Wrath of the Gods',
    description: 'Deal 500 or more total damage to enemies throughout the campaign.',
    icon: '⚡',
    tier: 'silver',
    category: 'combat',
    hidden: false,
  },
  {
    id: 'annihilator',
    name: 'Annihilator',
    description: 'Deal 1500 or more total damage — a one-person apocalypse.',
    icon: '☄️',
    tier: 'gold',
    category: 'combat',
    hidden: true,
  },
  {
    id: 'battered_survivor',
    name: 'Battered but Unbroken',
    description: 'Survive receiving 300 or more total damage across the campaign.',
    icon: '🩸',
    tier: 'silver',
    category: 'survival',
    hidden: false,
  },
  {
    id: 'iron_constitution',
    name: 'Iron Constitution',
    description: 'Survive receiving 800 or more total damage and still stand.',
    icon: '🛡️',
    tier: 'gold',
    category: 'survival',
    hidden: true,
  },

  // ═══ SPEED & EFFICIENCY ═══
  {
    id: 'speedrunner',
    name: 'Swift Justice',
    description: 'Defeat the antagonist in under 40 turns — speed and precision.',
    icon: '⏱️',
    tier: 'gold',
    category: 'story',
    hidden: true,
  },
  {
    id: 'marathon',
    name: 'The Long Road',
    description: 'Survive 150 turns in a single campaign.',
    tier: 'legendary',
    category: 'survival',
    icon: '🗺️',
    hidden: true,
  },

  // ═══ INJURY ACHIEVEMENTS ═══
  {
    id: 'walking_wounded',
    name: 'Walking Wounded',
    description: 'Have party members suffering from 4 different injury categories simultaneously.',
    icon: '🤕',
    tier: 'silver',
    category: 'survival',
    hidden: true,
  },
  {
    id: 'ten_injuries',
    name: 'Scarred Veterans',
    description: 'Accumulate 10 or more active injuries across the party at once.',
    icon: '🩹',
    tier: 'gold',
    category: 'survival',
    hidden: true,
  },

  // ═══ SHARD MASTERY ═══
  {
    id: 'shard_double_summon',
    name: 'Double Summoning',
    description: 'Use both shard charges in a single campaign.',
    icon: '✨',
    tier: 'silver',
    category: 'shard',
    hidden: false,
  },
  {
    id: 'shard_healed',
    name: 'Shard Reborn',
    description: 'The shard regains a charge after going dark — a second chance.',
    icon: '🌟',
    tier: 'gold',
    category: 'shard',
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
    wasShardDark: boolean
    maxGold: number
    maxPartySize: number
    prophecyStates: Set<string>   // tracks which prophecy states we've seen
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
    counters: { turnsWithoutInjury: 0, totalDamageDealt: 0, totalDamageReceived: 0, deaths: 0, wasShardDark: false, maxGold: 0, maxPartySize: 0, prophecyStates: new Set() },
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

  // Greater god summoned via shard — check if any summon name matches known greater god patterns
  if (gs.shardSummoned.length > 0) {
    const greaterPatterns = /(?:zeus|odin|thor|ra|shiva|vishnu|brahma|cronus|atum|heracles|thoth|anu|enlil|marduk|quetzalcoatl|huitzilopochtli|loki|fistandantilus|paladine|takhisis)/i
    const hasGreater = gs.shardSummoned.some(s => greaterPatterns.test(s))
    if (hasGreater) tryUnlock('shard_greater_summoned')
  }

  // Test of faith miracle
  if (gs.testOfFaithContext?.outcome === 'miracle') tryUnlock('test_of_faith_miracle')
  if (gs.testOfFaithContext?.outcome === 'murphy') tryUnlock('murphys_law')
  if (gs.testOfFaithContext?.choice === 'trust_fate') tryUnlock('fate_trusted')
  if (gs.totalTestOfFaith >= 3) tryUnlock('test_of_faith_veteran')

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

  // Quest perfectionist
  const completedQuests = gs.quests.filter(q => q.status === 'completed').length
  const totalQuests = gs.quests.length
  if (totalQuests >= 3 && completedQuests === totalQuests) tryUnlock('perfectionist')

  // Prophecy states
  for (const p of gs.prophecies) {
    if (p.state === 'fulfilled') {
      const key = `${p.name || p.id}_fulfilled`
      if (!tracker.counters.prophecyStates.has(key)) {
        tracker.counters.prophecyStates.add(key)
        tryUnlock('prophecy_fulfilled')
      }
    }
    if (p.state === 'broken') {
      const key = `${p.name || p.id}_broken`
      if (!tracker.counters.prophecyStates.has(key)) {
        tracker.counters.prophecyStates.add(key)
        tryUnlock('prophecy_broken')
      }
    }
  }

  // Gold milestones
  if (gs.partyGold > tracker.counters.maxGold) tracker.counters.maxGold = gs.partyGold
  if (gs.partyGold >= 5000) tryUnlock('midas_touch')
  if (gs.partyGold >= 10000) tryUnlock('dragon_hoard')

  // Damage milestones — track from state diffs
  if (prevGs) {
    // Count damage dealt this turn from antagonist HP changes
    const antHpDrop = prevGs.antagonistMaxHp > 0 ? Math.max(0, prevGs.antagonistHp - gs.antagonistHp) : 0
    if (antHpDrop > 0) tracker.counters.totalDamageDealt += antHpDrop
  }
  if (tracker.counters.totalDamageDealt >= 500) tryUnlock('wrath_of_gods')
  if (tracker.counters.totalDamageDealt >= 1500) tryUnlock('annihilator')

  // Damage received — sum of max HP minus current HP across living PCs
  const damageReceived = gs.pcs
    .filter(p => !p.dead)
    .reduce((sum, p) => sum + Math.max(0, p.maxHp - p.hp), 0)
  tracker.counters.totalDamageReceived = Math.max(tracker.counters.totalDamageReceived, damageReceived)
  if (tracker.counters.totalDamageReceived >= 300) tryUnlock('battered_survivor')
  if (tracker.counters.totalDamageReceived >= 800) tryUnlock('iron_constitution')

  // Speedrun — win under 40 turns
  if (gs.ended && gs.antagonistHp <= 0 && gs.turn <= 40) tryUnlock('speedrunner')

  // Marathon — 150 turns
  if (turn >= 150) tryUnlock('marathon')

  // Injury diversity — track unique injury categories
  const injuryCategories = new Set<string>()
  for (const [, injuries] of Object.entries(gs.injuries)) {
    for (const inj of injuries) {
      injuryCategories.add(inj.category || inj.type || 'unknown')
    }
  }
  if (injuryCategories.size >= 4) tryUnlock('walking_wounded')
  const totalActiveInjuries = Object.values(gs.injuries).flat().length
  if (totalActiveInjuries >= 10) tryUnlock('ten_injuries')

  // Shard mastery
  if (gs.shardSummoned.length >= 2) tryUnlock('shard_double_summon')
  if (tracker.counters.wasShardDark && gs.shardCharges > 0) tryUnlock('shard_healed')
  if (gs.shardDark && !tracker.counters.wasShardDark) tracker.counters.wasShardDark = true

  // Max party size tracking
  if (livingPCs.length > tracker.counters.maxPartySize) tracker.counters.maxPartySize = livingPCs.length

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

export function serializeTracker(tracker: AchievementTracker): string {
  return JSON.stringify({
    records: tracker.records,
    prevTurnState: tracker.prevTurnState,
    counters: {
      ...tracker.counters,
      prophecyStates: [...tracker.counters.prophecyStates],
    },
    newUnlocks: [], // Don't persist the notification queue
  })
}

export function deserializeTracker(json: string): AchievementTracker | null {
  try {
    const data = JSON.parse(json)
    return {
      records: data.records || {},
      newUnlocks: [],
      prevTurnState: data.prevTurnState || { injuriesCount: 0, npcCount: 0, damageDealt: false, act: 'act1' },
      counters: {
        turnsWithoutInjury: data.counters?.turnsWithoutInjury || 0,
        totalDamageDealt: data.counters?.totalDamageDealt || 0,
        totalDamageReceived: data.counters?.totalDamageReceived || 0,
        deaths: data.counters?.deaths || 0,
        wasShardDark: data.counters?.wasShardDark || false,
        maxGold: data.counters?.maxGold || 0,
        maxPartySize: data.counters?.maxPartySize || 0,
        prophecyStates: new Set(data.counters?.prophecyStates || []),
      },
    }
  } catch {
    return null
  }
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter(a => a.category === category)
}

export function getCategoryProgress(tracker: AchievementTracker, category: AchievementCategory): { unlocked: number; total: number } {
  const defs = getAchievementsByCategory(category)
  const unlocked = defs.filter(d => tracker.records[d.id]?.unlocked).length
  return { unlocked, total: defs.length }
}
