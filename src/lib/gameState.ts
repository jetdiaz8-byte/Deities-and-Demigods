// ═══════════════════════════════════════════════════════════════════════════
// INITIAL GAME STATE FACTORY
// Extracted from page.tsx for modular architecture
// ═══════════════════════════════════════════════════════════════════════════

import type { GameState } from '@/lib/gameTypes'
import { ACTS } from '@/lib/gameTypes'
import { ITEM_TEMPLATES } from '@/lib/gameConstants'

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL GAME STATE
// ═══════════════════════════════════════════════════════════════════════════

export const createInitialState = (): GameState => ({
  shardEntry: null,
  shardCharges: 2,
  shardSummoned: [],
  shardDark: false,
  pendingShardSummon: null,
  act: ACTS.ONE,
  turn: 0,
  log: [],
  ended: false,
  isProcessing: false,
  antagonistId: null,
  antagonistHp: 0,
  antagonistMaxHp: 0,
  antagonistPhase: 1,
  pcs: [],
  pcQueue: [],
  pcAgreements: {},
  humanPCId: null,
  humanOptions: [],
  pendingHumanChoice: null,
  waitingForHuman: false,
  injuries: {},
  activeNPCs: [],
  npcHistory: [],
  encounteredIds: [],
  nextPCTurn: 0,
  storySummary: '',
  journeySoFar: '',
  quests: [
    { id: 'main1', title: 'The Shard Awakens', description: 'Discover the nature of the mysterious shard and why the gods seek it.', type: 'main', status: 'active', objectives: [{ text: 'Learn the shard\'s origin', completed: false }, { text: 'Identify the antagonist', completed: false }] },
    { id: 'side1', title: 'Divine Allies', description: 'Gain the favor of at least three gods from different pantheons.', type: 'side', status: 'active', objectives: [{ text: 'Befriend 3 gods', completed: false }] }
  ],
  inventory: [
    { ...ITEM_TEMPLATES[0], id: 'healing_potion_1' },
    { ...ITEM_TEMPLATES[0], id: 'healing_potion_2' }
  ],
  partyGold: 0,
  geminiTokensUsed: 0,
  lastDiceRolls: [],
  // Antagonist identity mystery system
  antagonistCluesRevealed: [],
  antagonistKnown: {},
  // Prophecy System
  prophecies: [],
  antagonistType: null,
  // ═══════════════════════════════════════════════════════════════════════════
  // RNG PARTY SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  rngHeroPool: [],
  rngDemigodPool: [],
  introducedHeroes: [],
  introducedDemigods: [],
  // ═══════════════════════════════════════════════════════════════════════════
  // ACT TRANSITION SYSTEM - RNG turn limits
  // ═══════════════════════════════════════════════════════════════════════════
  act1TurnLimit: 50,   // Overwritten by confirmPartySelection with RNG 10-100
  act2TurnLimit: 40,   // Overwritten by confirmPartySelection with RNG 20-60
  act2StartTurn: 0,
  // ═══════════════════════════════════════════════════════════════════════════
  // SUCCESS RATE CALCULATOR
  // ═══════════════════════════════════════════════════════════════════════════
  baseSuccessRate: 50,
  partyBonus: 0,
  prophecyBonus: 0,
  allyBonus: 0,
  renownBonus: 0,
  powerBonus: 0,
  alignmentBonus: 0,
  mythicalImpactBonus: 0,
  shardChargeBonus: 0,
  shardSummonedBonus: 0,
  companionAffinityBonus: 0,
  injuryPenaltyBonus: 0,
  currentSuccessRate: 50,
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPANION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  companionId: null,
  companionAffinity: 50,  // Start with positive relationship
  companionMood: 'loyal',
  // ═══════════════════════════════════════════════════════════════════════════
  // ANTAGONIST BANISHMENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  antagonistBanished: false,
  antagonistBanishTurn: 0,
  antagonistRival: null,
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST OF FAITH SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  pendingTestOfFaith: false,
  testOfFaithContext: null,
  testOfFaithMiraclesUsed: [],
  lastTestOfFaithTurn: -20,
  totalTestOfFaith: 0
})
