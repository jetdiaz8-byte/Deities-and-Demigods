// ═══════════════════════════════════════════════════════════════════════════
// GAME TYPES & INTERFACES
// Extracted from page.tsx for modular architecture
// ═══════════════════════════════════════════════════════════════════════════════════════

// Prophecy State - tracks each PC's prophecy
export interface ProphecyState {
  prophecyId: number           // 1-9
  riddle: string               // Gaiman-style cryptic text shown to player
  pc_id: string                // Current holder
  previous_holders: string[]   // Transfer history
  state: 'dormant' | 'awakening' | 'manifesting' | 'fulfilled' | 'broken'
}

export interface Ability {
  name: string
  damage?: string
  effect?: string
  cooldown?: number
}

export interface Item {
  id: string
  name: string
  type: 'artifact' | 'potion' | 'equipment' | 'scroll'
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  effect: string
  modifier?: { [key: string]: number }
  charges?: number
  maxCharges?: number
  icon: string
  description: string
  // Item acquisition methods
  acquisition?: ('npc_encounter' | 'monster_drop' | 'battle' | 'conversation' | 'pickpocket' | 'exploration' | 'quest_reward')[]
  source?: string // What drops it: "Greek gods", "Undead", "Any", etc.
  value?: number // Gold value
}

export interface Quest {
  id: string
  title: string
  description: string
  type: 'main' | 'side' | 'hidden'
  status: 'active' | 'completed' | 'failed'
  objectives: { text: string; completed: boolean }[]
  rewards?: string
}

export interface Injury {
  id: string
  name: string
  effect: string
  modifier: { [key: string]: number | string }
  turnsLeft: number
  icon: string
  type?: 'physical' | 'magic' | 'poison' | 'psionic'
  cure?: string
}

export interface Entity {
  id: string
  name: string
  title?: string
  epithet?: string
  pantheon: string
  align: string
  hp: number
  maxHp: number
  AC: number
  MR: number
  abilities: string[]
  personality?: string
  type?: 'hero' | 'demigod' | 'greater_god' | 'lesser_god' | 'monster'
  category?: string
  conditions: string[]
  dead: boolean
  portrait?: string
  inventory: Item[]
  // Ability Scores
  str?: string
  int?: string
  wis?: string
  dex?: string
  con?: string
  cha?: string
  // Class Levels
  level?: string
  fighterLevel?: number
  clericLevel?: number
  magicUserLevel?: number
  thiefLevel?: number
  // Combat
  attacks?: number
  damage?: string
  move?: string
}

export interface ShardEvent {
  invoked: boolean
  invoker_pc_id?: string
  intended_summon?: string
  intended_god?: string
  roll?: number
  success?: boolean
  summoned_id?: string
  summoned_name?: string
  is_greater?: boolean
}

export interface DiceRoll {
  roller: string
  die: string
  roll: number
  dc: number
  success: boolean
  notes?: string
}

export interface DamageDealt {
  from: string
  to: string
  amount: number
  type: string
}

export interface StateUpdate {
  pc_id: string
  hp_delta?: number
  new_condition?: string
  remove_condition?: string
  dead?: boolean
}

export interface DMResponse {
  story_summary?: string
  journey_so_far?: string  // TLDR summary that updates each turn
  dm_narration: string
  human_pc_id?: string
  human_pc_reason?: string
  npc_encounters?: { npc_id: string; npc_name: string; encounter_type: string; behavior: string; pantheon: string }[]
  dice_rolls?: DiceRoll[]
  damage_dealt?: DamageDealt[]
  injury_events?: { pc_id: string; injury_id?: string; description: string }[]
  state_updates?: StateUpdate[]
  new_active_npcs?: string[]
  shard_event?: ShardEvent
  next_pc_id?: string
  pc_agreement?: { [key: string]: string }
  boss_phase_trigger?: boolean
  consequences?: string
  tension_note?: string
  item_drops?: Item[]
  quest_updates?: Quest[]
}

export interface GameOption {
  num: number
  action: string
  ability: string
  align_note?: string
  source?: 'pc' | 'companion' | 'archrival_summon'  // Who this option belongs to
  companion_name?: string      // Name of companion if source is 'companion' (optional)
}

export interface SaveSlot {
  id: string
  name: string
  timestamp: number
  turn: number
  act: string
  partyNames: string[]
}

export interface GameState {
  shardEntry: { name: string; origin: string; color: string; glow: string; pantheon?: string; power?: string } | null
  shardCharges: number
  shardSummoned: string[]
  shardDark: boolean
  pendingShardSummon: string | null
  act: string
  turn: number
  log: { msg: string; type: string; turn: number }[]
  ended: boolean
  isProcessing: boolean
  antagonistId: string | null
  antagonistHp: number
  antagonistMaxHp: number
  antagonistPhase: number
  pcs: Entity[]
  pcQueue: Entity[]
  pcAgreements: { [key: string]: boolean | null }
  humanPCId: string | null
  humanOptions: GameOption[]
  pendingHumanChoice: number | null
  waitingForHuman: boolean
  injuries: { [key: string]: Injury[] }
  activeNPCs: Entity[]
  npcHistory: Entity[]
  encounteredIds: string[]
  nextPCTurn: number
  storySummary: string
  journeySoFar: string  // TLDR summary that updates each turn
  quests: Quest[]
  inventory: Item[]
  partyGold: number
  // Token tracking
  geminiTokensUsed: number
  groqTokensUsed: number
  // Current dice rolls for display
  lastDiceRolls: DiceRoll[]
  // Antagonist identity mystery system
  antagonistCluesRevealed: string[] // IDs of clues that have been revealed
  antagonistKnown: { pantheon?: string; alignment?: string; domain?: string; symbol?: string; name?: string }
  // Prophecy System
  prophecies: ProphecyState[]       // One per active PC
  antagonistType: 'greater_god' | 'monster' | null  // Type of antagonist
  // RNG PARTY SYSTEM - DM introduces heroes/demigods during story
  rngHeroPool: Entity[]              // 3 heroes for DM to introduce during Act II
  rngDemigodPool: Entity[]           // 3 demigods for DM to introduce during Act II
  introducedHeroes: string[]         // IDs of heroes introduced by DM
  introducedDemigods: string[]       // IDs of demigods introduced by DM
  // ACT TRANSITION SYSTEM - RNG turn limits for act progression
  act1TurnLimit: number              // RNG 10-100: When Act I ends
  act2TurnLimit: number              // RNG 20-60: Duration of Act II
  act2StartTurn: number              // Turn when Act II began (to calculate duration)
  // SUCCESS RATE CALCULATOR - Dynamic campaign win probability
  baseSuccessRate: number            // 50% base chance
  partyBonus: number                 // Bonus from party composition
  prophecyBonus: number              // Bonus from prophecy state
  allyBonus: number                  // Bonus from NPC allies encountered
  renownBonus: number                // Bonus from PC renown/title
  powerBonus: number                 // Bonus from PC abilities/levels
  alignmentBonus: number             // Bonus from alignment synergy
  mythicalImpactBonus: number        // Bonus from story achievements
  shardChargeBonus: number           // Bonus from remaining shard charges
  shardSummonedBonus: number         // Bonus from gods summoned via shard
  companionAffinityBonus: number     // Bonus from companion relationship
  injuryPenaltyBonus: number         // Penalty from active injuries
  currentSuccessRate: number         // Calculated total success %
  // COMPANION SYSTEM - Affinity with main PC
  companionId: string | null          // ID of the main companion (2nd PC)
  companionAffinity: number           // -100 to +100: Relationship with main PC
  companionMood: 'loyal' | 'concerned' | 'conflicted' | 'distant' | 'hostile' | 'devoted'
  // ANTAGONIST BANISHMENT SYSTEM - When antagonist "dies" before Act III
  antagonistBanished: boolean         // True if antagonist was banished to another plane
  antagonistBanishTurn: number        // Turn when banishment occurred
  antagonistRival: { id: string; name: string; title: string; pantheon: string; ability: string } | null  // Archrival available to summon in Act III
  // TEST OF FAITH SYSTEM — Murphy's Law / Miracle Survival
  pendingTestOfFaith: boolean         // True when the dice prompt should show
  testOfFaithContext: {                // What triggered the test
    trigger: 'death_save' | 'boss_phase' | 'desperate_odds'
    pcId?: string                      // PC who died (for death_save)
    pcName?: string                    // For prose
    bossPhase?: number                 // For boss_phase
    roll?: number                      // Result after player rolls
    outcome?: 'miracle' | 'murphy' | 'fate_holds'
  } | null
  testOfFaithMiraclesUsed: string[]    // PC IDs that have used their miracle
  lastTestOfFaithTurn: number          // Cooldown tracking
  totalTestOfFaith: number             // How many offered this campaign
}

// Antagonist Clue - Identity revealed progressively through Acts
export interface AntagonistClue {
  id: string
  act: 1 | 2 | 3
  clue_text: string
  reveals: 'shadow' | 'pantheon' | 'alignment' | 'domain' | 'symbol' | 'name_fragment' | 'identity'
  specificity: 'vague' | 'moderate' | 'specific'
  trigger?: string
}

// Success Rate calculation factors
export interface SuccessRateFactors {
  partySize: number
  livingPCs: number
  prophecyState: 'dormant' | 'awakening' | 'manifesting' | 'fulfilled' | 'broken'
  alliedGods: number
  pcRenown: number      // Average level/title of PCs
  pcPower: number       // Sum of PC HP / 100
  alignmentHarmony: number // How well party alignments work together
  storyAchievements: number // Quests completed, clues found
  antagonistType: 'greater_god' | 'monster' | null
  shardCharges: number       // 0-2: Shard charges remaining (summons gods)
  shardSummoned: number      // How many gods have been summoned via shard
  companionAffinity: number  // -100 to +100: Relationship with main PC
  injuryPenalty: number      // Sum of all active injury modifiers
}

// Antagonist data for ALL_GREATER_GODS (includes phase descriptions)
export interface GreaterGodData extends Entity {
  phase1: string
  phase2: string
  phase3: string
  domain?: string
  symbol?: string
}

// Shard type definition
export interface ShardType {
  name: string
  origin: string
  color: string
  glow: string
  pantheon: string
  power: string
}

// Injury template (without turnsLeft, which is set at runtime)
export interface InjuryTemplate {
  id: string
  name: string
  effect: string
  modifier: { [key: string]: number | string }
  icon: string
  type?: 'physical' | 'magic' | 'poison' | 'psionic'
  cure?: string
}

// ACT constants
export const ACTS = { ONE: 'act1', TWO: 'act2', THREE: 'act3' } as const

