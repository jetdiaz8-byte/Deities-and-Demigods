import type { Act } from "@/lib/types/gameTypes";

export function getActForTurn(turn: number): Act {
  if (turn <= 21) return "act1";
  if (turn <= 35) return "act2";
  return "act3";
}

export function getActRules(act: Act, turn: number) {
  if (act === "act1" && turn === 0) return "TURN 0: Describe only the shard. No characters, NPCs, combat, or choices.";
  if (act === "act1" && turn <= 7) return "ACT I EXPLORATION: No combat, no enemies, no hostile NPCs. Exploration and atmosphere only.";
  if (act === "act1" && turn <= 9) return "ACT I FIRST BLOOD: One small threat may appear. Combat is optional and brief.";
  if (act === "act1") return "ACT I PARTY ASSEMBLY: Introduce at most one party member this turn.";
  if (act === "act2") return "ACT II RISING TENSION: Gods may appear, Quickening can trigger, and the hidden antagonist grows nearer.";
  return "ACT III FINAL TEST: Reveal, prepare, fight three boss phases, then present The Question.";
}
