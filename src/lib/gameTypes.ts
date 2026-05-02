// ═══════════════════════════════════════════════════════════════════════════
// GAME TYPES & INTERFACES
// Extracted from page.tsx for modular architecture
// ═══════════════════════════════════════════════════════════════════════════════════════

// Prophecy State - tracks each PC's prophecy
export interface ProphecyState {
  prophecyId: number           // 1-9
  name: string                 // Display name for achievement tracking
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
  category?: string
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
  // Encounter system — set by DM response
  encounter_type?: 'ENEMY' | 'ALLY' | 'BOSS' | 'RIVAL' | 'BYSTANDER' | 'NUISANCE' | string
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
  shard_insight_used?: boolean   // v2.19.0: DM confirms shard insight charge was spent
  next_pc_id?: string
  pc_agreement?: { [key: string]: string }
  boss_phase_trigger?: boolean
  consequences?: string
  tension_note?: string
  item_drops?: Item[]
  quest_updates?: Quest[]
  outcome_tier?: 'critical_success' | 'full_success' | 'partial_success' | 'miss' | null
  paragon_delta?: number
  renegade_delta?: number
  new_aspect?: string | null
  clue_revealed?: string // Short description of an antagonist clue revealed this turn
  pc_choices?: { narrative: string; ability: string; align_note: string }[]
  companion_choices?: { narrative: string; ability: string; align_note: string }[]
}

// ═══════════════════════════════════════════════════════════════════════════
// D&D 5e FORMAL SKILL SYSTEM
// ═══════════════════════════════════════════════════════════════════════════
export interface PlayerSkills {
  // STR skills
  athletics: number          // 0 = no proficiency, +2 = proficient, +3 = expert
  intimidation: number       // Actually CHA-based but grouped
  // DEX skills
  acrobatics: number
  sleight_of_hand: number
  stealth: number
  // INT skills
  arcana: number
  history: number
  investigation: number
  nature: number
  religion: number
  // WIS skills
  animal_handling: number
  insight: number
  medicine: number
  perception: number
  survival: number
  // CHA skills
  deception: number
  performance: number
  persuasion: number
}

export const SKILL_ABILITY_MAP: Record<keyof PlayerSkills, string> = {
  athletics: 'str', intimidation: 'cha',
  acrobatics: 'dex', sleight_of_hand: 'dex', stealth: 'dex',
  arcana: 'int', history: 'int', investigation: 'int', nature: 'int', religion: 'int',
  animal_handling: 'wis', insight: 'wis', medicine: 'wis', perception: 'wis', survival: 'wis',
  deception: 'cha', performance: 'cha', persuasion: 'cha'
}

// ═══════════════════════════════════════════════════════════════════════════
// FATE CORE — ASPECTS
// ═══════════════════════════════════════════════════════════════════════════
export interface Aspect {
  name: string              // "Blood of the Ancient Kings"
  type: 'high_concept' | 'trouble' | 'situation' | 'character' | 'earned'
  invokes: number           // Times successfully invoked
  fate_points_spent: number // Total FP spent on this aspect
  description?: string
}

export interface AIChoice {
  narrative: string   // Contextual action label with emoji, e.g. "🔍 Investigate the waymark carved into the hearth"
  ability: string    // Mechanical ability key: investigation/exploration/attack/defend/companion_scout/etc.
  align_note: string // Brief mechanical description, e.g. "investigation check · +3 investigation"
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
  partyAlive?: boolean[]     // alive status per party member
  lastNarration?: string    // snapshot of last DM narration (max 100 chars)
  totalGold?: number        // party gold at save time
}

export interface GameState {
  shardEntry: { name: string; origin: string; color: string; glow: string; pantheon?: string; power?: string } | null
  shardCharges: number
  shardSummoned: string[]
  shardDark: boolean
  pendingShardSummon: string | null
  pendingShardQuestion: string | null     // v2.19.0: Player's question to the shard (Insight charge)
  shardShieldUsed: boolean        // v2.19.0: Charge 2 spent (auto death-save)
  shardInsightUsed: boolean       // v2.19.0: Charge 1 spent (ask the shard)
  shardFinalWordUsed: boolean     // v2.19.0: Charge 3 spent (Act III climax)
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
  companionOptions: GameOption[]
  pendingCompanionChoice: number | null
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
  dmTokensUsed: number
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
  companionMoodBonus: number         // v2.44.0: Bonus from companion mood
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
    choice?: string                    // Player's choice (e.g., 'trust_fate')
  } | null
  testOfFaithMiraclesUsed: string[]    // PC IDs that have used their miracle
  lastTestOfFaithTurn: number          // Cooldown tracking
  totalTestOfFaith: number             // How many offered this campaign
  // ABILITY COOLDOWN SYSTEM
  abilityCooldowns: { [key: string]: { ability: string; turnsLeft: number; totalTurns: number } }
  // ═══════════════════════════════════════════════════════════════════════════
  // D&D 5e FORMAL SKILL SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  skills: PlayerSkills                        // 18 D&D 5e skills with proficiency
  skillProficiencies: string[]                 // Names of skills the PC is proficient in
  // ═══════════════════════════════════════════════════════════════════════════
  // FATE CORE — ASPECTS + FATE POINTS
  // ═══════════════════════════════════════════════════════════════════════════
  aspects: Aspect[]                           // Player-defined narrative tags
  fatePoints: number                          // Start with 3, max 5
  fatePointHistory: { turn: number; type: 'earned' | 'spent'; reason: string }[]
  customActionPending: string | null          // Free-text custom action input
  // ═══════════════════════════════════════════════════════════════════════════
  // PbtA PARTIAL SUCCESS OUTCOMES
  // ═══════════════════════════════════════════════════════════════════════════
  lastOutcomeTier: 'critical_success' | 'full_success' | 'partial_success' | 'miss' | 'consequences' | null
  outcomeHistory: { turn: number; tier: string; description: string }[]
  // ═══════════════════════════════════════════════════════════════════════════
  // DARK SOULS — STAMINA & BONFIRE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════
  stamina: number                             // Current stamina (max = con-based)
  maxStamina: number                          // Maximum stamina
  staminaRegenRate: number                    // Stamina recovered per turn (1 + con bonus)
  bonfireRestCount: number                    // How many times player has rested at a bonfire
  // ═══════════════════════════════════════════════════════════════════════════
  // MASS EFFECT — PARAGON/RENEGADE MORALITY
  // ═══════════════════════════════════════════════════════════════════════════
  paragonPoints: number                       // Diplomatic/honorable actions
  renegadePoints: number                      // Ruthless/pragmatic actions
  moralityQuotient: number                    // -100 (pure renegade) to +100 (pure paragon)
  interruptHistory: { turn: number; type: 'paragon' | 'renegade'; description: string }[]
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
  shardCharges: number       // v2.19.0: 0-3: Shard charges (Insight, Shield, Final Word)
  shardSummoned: number      // DEPRECATED — kept for save compatibility
  companionAffinity: number  // -100 to +100: Relationship with main PC
  companionMood: 'loyal' | 'concerned' | 'conflicted' | 'distant' | 'hostile' | 'devoted' // v2.44.0: mood mechanical effect
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

// Lore Glossary Entry — used for hover cards on codex-inline-link elements
export interface LoreEntry {
  name: string
  title?: string
  pantheon: string
  portrait?: string
  personality?: string
  description?: string
  type?: 'hero' | 'demigod' | 'greater_god' | 'lesser_god' | 'monster'
}
