export type Act = "act1" | "act2" | "act3";
export type ActPhase = 0 | 1 | 2 | 3;
export type GamePhase = "intro" | "party-select" | "playing" | "combat" | "quickening" | "death" | "victory";
export type CombatState = "idle" | "active" | "won" | "lost" | "fled";
export type CompanionMood = "loyal" | "friendly" | "neutral" | "distant" | "cold" | "frozen";
export type CharacterType = "god" | "hero" | "demigod" | "monster";
export type CharacterCategory = "greater-gods" | "lesser-gods" | "heroes" | "demigods" | "monsters";
export type AlignmentCode = "LG" | "NG" | "CG" | "LN" | "TN" | "CN" | "LE" | "NE" | "CE";
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type SkillName =
  | "acrobatics"
  | "animal_handling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleight_of_hand"
  | "stealth"
  | "survival";

export interface BossPhase {
  phase: 1 | 2 | 3;
  name: string;
  hp: number;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  pantheon: string;
  align: AlignmentCode;
  hp: number;
  maxHp: number;
  ac: number;
  mr: number;
  move: number;
  attacks: string[];
  abilities: string[];
  domain?: string;
  symbol?: string;
  personality: string;
  type: CharacterType;
  category: CharacterCategory;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  level: number;
  divineRank: number;
  description: string;
  portrait: string;
  phase1?: BossPhase;
  phase2?: BossPhase;
  phase3?: BossPhase;
}

export interface PlayerCharacter extends Character {
  currentHp: number;
  isActive: boolean;
  joinedTurn: number;
  statusEffects: StatusEffect[];
  stamina: number;
  maxStamina: number;
  fatePoints: number;
  aspects: FateAspect[];
  proficiencies: SkillName[];
}

export interface StatusEffect {
  id: string;
  name: string;
  duration: number;
  effect: string;
}

export interface FateAspect {
  id: string;
  name: string;
  type: "high_concept" | "trouble" | "relationship" | "quest" | "divine_echo";
  description: string;
  invokeCost: number;
  benefit: string;
  complication: string;
}

export interface DiceResult {
  raw: number;
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  outcome: "critical_success" | "full_success" | "partial_success" | "miss" | "critical_fail";
  skill?: SkillName;
  ability?: AbilityKey;
  dc?: number;
}

export interface Shard {
  id: string;
  name: string;
  origin: string;
  color: string;
  glow: string;
  pantheon: string;
  power: string;
  prophecy: string;
}

export interface Injury {
  id: string;
  name: string;
  description: string;
  effect: string;
  modifier: Record<string, number>;
  icon: string;
  type: "physical" | "magical" | "poison" | "psionic" | "cursed";
  cureDescription: string;
}

export interface ActiveInjury extends Injury {
  turnsLeft: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: "potion" | "artifact" | "equipment" | "scroll" | "special";
  rarity: "common" | "uncommon" | "rare" | "legendary" | "divine";
  charges: number;
  maxCharges: number;
  effects: string[];
  acquisitionMethod: string;
  icon: string;
  lore: string;
}

export interface InventoryItem extends Item {
  ownerId?: string;
}

export interface Prophecy {
  id: string;
  text: string;
  boundToType: "pc" | "shard";
  boundToId: string;
  status: "dormant" | "active" | "fulfilled";
  triggerTurn?: number;
  fulfillTurn?: number;
  reward?: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "failed";
  objectives: { text: string; completed: boolean }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "legendary";
  icon: string;
  hidden: boolean;
}

export interface ConversationMemory {
  history: { role: "user" | "assistant"; content: string }[];
  storySummary: string;
  journeySoFar: string;
}

export interface DMChoice {
  narrative: string;
  ability: SkillName | AbilityKey | null;
  align_note: string;
}

export interface DMResponse {
  dm_narration: string;
  story_summary: string;
  journey_so_far: string;
  npc_encounters: Array<Record<string, unknown>>;
  dice_rolls: Array<Record<string, unknown>>;
  damage_dealt: Array<Record<string, unknown>>;
  injury_events: Array<Record<string, unknown>>;
  state_updates: Array<Record<string, unknown>>;
  item_drops: Array<Record<string, unknown>>;
  quest_updates: Array<Record<string, unknown>>;
  pc_choices: DMChoice[];
  companion_choices: DMChoice[];
  companion_affinity_delta: number;
  companion_mood_change: string | null;
  paragon_delta: number;
  renegade_delta: number;
  outcome_tier: string;
  new_aspect: string | null;
  fate_point_award: number;
}

export interface GameState {
  gameId: string;
  turn: number;
  act: Act;
  actPhase: ActPhase;
  gamePhase: GamePhase;
  pcs: PlayerCharacter[];
  companionId: string;
  companionAffinity: number;
  companionMood: CompanionMood;
  antagonistId: string;
  antagonistHp: number;
  antagonistMaxHp: number;
  antagonistPhase: 1 | 2 | 3;
  antagonistType: "greater-gods" | "super-monsters";
  identityRevealed: boolean;
  isBanished: boolean;
  shardId: string;
  shardChargesRemaining: number;
  prophecies: Prophecy[];
  inventory: InventoryItem[];
  injuries: Record<string, ActiveInjury[]>;
  currentSuccessRate: number;
  partyBonus: number;
  prophecyBonus: number;
  allyBonus: number;
  inCombat: boolean;
  combatState: CombatState;
  initiativeOrder: string[];
  currentCombatantId: string;
  turnDamageAccumulator: Record<string, number>;
  lastDiceRoll: DiceResult | null;
  diceHistory: DiceResult[];
  combatLog: string[];
  quests: Quest[];
  alliedGods: string[];
  paragon: number;
  renegade: number;
  lawChaos: number;
  goodEvil: number;
  achievements: string[];
  conversation: ConversationMemory;
  currentNarration: string;
  currentChoices: DMChoice[];
  location: { region: string; location: string };
}
