import { getActRules } from "@/lib/systems/acts";
import { getDC } from "@/lib/systems/combat";
import { getCharacter } from "@/lib/gameData/characterData";
import { getShard } from "@/lib/gameData/shardData";
import type { DMResponse, GameState } from "@/lib/types/gameTypes";

export const MODEL_FALLBACK_CHAIN = [
  "openai/gpt-oss-120b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free"
] as const;

function compactState(state: GameState) {
  return {
    turn: state.turn,
    act: state.act,
    actPhase: state.actPhase,
    party: state.pcs.map((pc) => ({ id: pc.id, name: pc.name, hp: pc.currentHp, maxHp: pc.maxHp, pantheon: pc.pantheon, align: pc.align })),
    companion: getCharacter(state.companionId)?.name ?? "Unknown",
    companionMood: state.companionMood,
    companionAffinity: state.companionAffinity,
    antagonist: state.identityRevealed ? getCharacter(state.antagonistId)?.name : "Hidden",
    shard: getShard(state.shardId)?.name,
    shardChargesRemaining: state.shardChargesRemaining,
    successRate: state.currentSuccessRate,
    location: state.location,
    quests: state.quests,
    storySummary: state.conversation.storySummary,
    journeySoFar: state.conversation.journeySoFar
  };
}

export function buildDMSystem(state: GameState, includeHistory = true, isFirstTurn = state.turn === 0): string {
  const shard = getShard(state.shardId);
  return `
# DEITIES AND DEMIGODS — AI DUNGEON MASTER SYSTEM

## VOICE
Write in mythic, lyrical dark fantasy prose: third person, past tense, sensory, grave, and strange. No mechanical language in narration.

## GOLDEN RULE
The final paragraph of dm_narration must present a concrete decision moment. Choices must be born from the prose.
After Turn 0, produce exactly 3 pc_choices: BOLD, CAREFUL, CREATIVE. Each choice is max 80 characters and ends with an emoji.

## CURRENT STATE
${JSON.stringify(compactState(state), null, 2)}

## SHARD
${shard ? `${shard.name}: ${shard.origin} Power: ${shard.power}` : "No shard."}

## ACT RULES
${getActRules(state.act, state.turn)}

## DIFFICULTY
Recommended DC: ${getDC(state.act)}
Success rate: ${state.currentSuccessRate}%

## RESPONSE FORMAT
Return only one valid JSON object. No markdown.
${expectedResponseFormat(isFirstTurn)}

${includeHistory ? `## RECENT MEMORY\n${JSON.stringify(state.conversation.history.slice(-10), null, 2)}` : ""}
`.trim();
}

export function expectedResponseFormat(isFirstTurn: boolean) {
  return JSON.stringify(
    {
      dm_narration: "150-500 words of prose. No mechanics.",
      story_summary: "Updated current scene summary.",
      journey_so_far: "Updated TLDR of the entire journey.",
      npc_encounters: [],
      dice_rolls: [],
      damage_dealt: [],
      injury_events: [],
      state_updates: [],
      item_drops: [],
      quest_updates: [],
      pc_choices: isFirstTurn
        ? []
        : [
            { narrative: "Bold prose choice ending with emoji ⚔", ability: "athletics", align_note: "bold" },
            { narrative: "Careful prose choice ending with emoji 🔍", ability: "investigation", align_note: "careful" },
            { narrative: "Creative prose choice ending with emoji ✦", ability: "arcana", align_note: "creative" }
          ],
      companion_choices: [],
      companion_affinity_delta: 0,
      companion_mood_change: null,
      paragon_delta: 0,
      renegade_delta: 0,
      outcome_tier: "full_success",
      new_aspect: null,
      fate_point_award: 0
    },
    null,
    2
  );
}

const defaults: DMResponse = {
  dm_narration: "",
  story_summary: "The story continues...",
  journey_so_far: "",
  npc_encounters: [],
  dice_rolls: [],
  damage_dealt: [],
  injury_events: [],
  state_updates: [],
  item_drops: [],
  quest_updates: [],
  pc_choices: [],
  companion_choices: [],
  companion_affinity_delta: 0,
  companion_mood_change: null,
  paragon_delta: 0,
  renegade_delta: 0,
  outcome_tier: "full_success",
  new_aspect: null,
  fate_point_award: 0
};

export function cleanJson(raw: string) {
  const trimmed = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

export function parseDMResponse(raw: string, isFirstTurn = false): DMResponse {
  const parsed = JSON.parse(cleanJson(raw)) as Partial<DMResponse>;
  if (!parsed.dm_narration || typeof parsed.dm_narration !== "string") {
    throw new Error("Missing dm_narration");
  }
  const response: DMResponse = {
    ...defaults,
    ...parsed,
    npc_encounters: Array.isArray(parsed.npc_encounters) ? parsed.npc_encounters : [],
    dice_rolls: Array.isArray(parsed.dice_rolls) ? parsed.dice_rolls : [],
    damage_dealt: Array.isArray(parsed.damage_dealt) ? parsed.damage_dealt : [],
    injury_events: Array.isArray(parsed.injury_events) ? parsed.injury_events : [],
    state_updates: Array.isArray(parsed.state_updates) ? parsed.state_updates : [],
    item_drops: Array.isArray(parsed.item_drops) ? parsed.item_drops : [],
    quest_updates: Array.isArray(parsed.quest_updates) ? parsed.quest_updates : [],
    pc_choices: Array.isArray(parsed.pc_choices) ? parsed.pc_choices.slice(0, isFirstTurn ? 0 : 3) : [],
    companion_choices: Array.isArray(parsed.companion_choices) ? parsed.companion_choices : [],
    companion_affinity_delta: Number(parsed.companion_affinity_delta ?? 0),
    paragon_delta: Number(parsed.paragon_delta ?? 0),
    renegade_delta: Number(parsed.renegade_delta ?? 0),
    fate_point_award: Number(parsed.fate_point_award ?? 0)
  };
  if (!isFirstTurn && response.pc_choices.length !== 3) {
    response.pc_choices = [
      { narrative: "Step forward before fear learns your name ⚔", ability: "athletics", align_note: "bold" },
      { narrative: "Read the old marks before touching anything 🔍", ability: "investigation", align_note: "careful" },
      { narrative: "Ask the shard what the dark remembers ✦", ability: "arcana", align_note: "creative" }
    ];
  }
  return response;
}

export function fallbackNarration(error: unknown): DMResponse {
  return {
    ...defaults,
    dm_narration: `The threads of fate tangled for a moment. The old story did not break; it merely held its breath. Somewhere in the dark, a page turned and waited for a steadier hand.\n\nWhat had been asked of destiny returned unanswered: ${error instanceof Error ? error.message : "unknown error"}.`,
    pc_choices: [
      { narrative: "Force the story onward with a raised blade ⚔", ability: "athletics", align_note: "bold" },
      { narrative: "Wait, listen, and let the pattern settle 🔍", ability: "perception", align_note: "careful" },
      { narrative: "Whisper to the shard and bargain with silence ✦", ability: "religion", align_note: "creative" }
    ]
  };
}
