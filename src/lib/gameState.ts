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
  shardCharges: 3,
  shardSummoned: [],
  shardDark: false,
  pendingShardSummon: null,
  pendingShardQuestion: null,
  shardShieldUsed: false,
  shardInsightUsed: false,
  shardFinalWordUsed: false,
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
  companionOptions: [],
  pendingCompanionChoice: null,
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
  dmTokensUsed: 0,
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
  act2StartTurn: -1,
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
  companionMoodBonus: 0,  // v2.44.0: mood mechanical effect
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
  totalTestOfFaith: 0,
  // ═══════════════════════════════════════════════════════════════════════════
  // ABILITY COOLDOWN SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  abilityCooldowns: {},
  // ═══════════════════════════════════════════════════════════════════════════
  // D&D 5e FORMAL SKILL SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  skills: {
    athletics: 0, intimidation: 0,
    acrobatics: 0, sleight_of_hand: 0, stealth: 0,
    arcana: 0, history: 0, investigation: 0, nature: 0, religion: 0,
    animal_handling: 0, insight: 0, medicine: 0, perception: 0, survival: 0,
    deception: 0, performance: 0, persuasion: 0
  },
  skillProficiencies: [],
  // ═══════════════════════════════════════════════════════════════════════════
  // FATE CORE — ASPECTS + FATE POINTS
  // ═══════════════════════════════════════════════════════════════════════════
  aspects: [],
  fatePoints: 3,
  fatePointHistory: [],
  customActionPending: null,
  // ═══════════════════════════════════════════════════════════════════════════
  // PbtA PARTIAL SUCCESS OUTCOMES
  // ═══════════════════════════════════════════════════════════════════════════
  lastOutcomeTier: null,
  outcomeHistory: [],
  // ═══════════════════════════════════════════════════════════════════════════
  // DARK SOULS — STAMINA & BONFIRE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  stamina: 10,
  maxStamina: 10,
  staminaRegenRate: 3,
  bonfireRestCount: 0,
  // ═══════════════════════════════════════════════════════════════════════════
  // MASS EFFECT — PARAGON/RENEGADE MORALITY
  // ═══════════════════════════════════════════════════════════════════════════
  paragonPoints: 0,
  renegadePoints: 0,
  moralityQuotient: 0,
  interruptHistory: [],
})
