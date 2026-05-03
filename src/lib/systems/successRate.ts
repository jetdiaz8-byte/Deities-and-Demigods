import type { AlignmentCode, GameState } from "@/lib/types/gameTypes";
import { getShard } from "@/lib/gameData/shardData";
import { clamp } from "@/lib/utils";

function areOpposed(a: AlignmentCode, b: AlignmentCode) {
  return (a[0] === "L" && b[0] === "C") || (a[0] === "C" && b[0] === "L") || (a[1] === "G" && b[1] === "E") || (a[1] === "E" && b[1] === "G");
}

export function calculateSuccessRate(state: GameState): number {
  let rate = 40;
  const livingPCs = state.pcs.filter((pc) => pc.currentHp > 0).length;
  rate += Math.min(livingPCs, 7) * 4;
  const activeProphecy = state.prophecies.find((prophecy) => prophecy.boundToId === state.pcs[0]?.id);
  if (activeProphecy?.status === "active") rate += 5;
  if (activeProphecy?.status === "fulfilled") rate += 10;
  rate += Math.min(state.alliedGods.length, 3) * 3;
  rate += Math.floor(state.pcs.reduce((sum, pc) => sum + pc.level, 0) / 3);
  rate += Math.floor(state.pcs.reduce((sum, pc) => sum + pc.maxHp, 0) / 100);
  const alignments = state.pcs.map((pc) => pc.align);
  if (alignments.length > 0 && alignments.every((alignment) => alignment === alignments[0])) rate += 5;
  else if (alignments.some((alignment, index) => alignments.slice(index + 1).some((other) => areOpposed(alignment, other)))) rate -= 3;
  const shard = getShard(state.shardId);
  if (shard && state.pcs.some((pc) => pc.pantheon === shard.pantheon)) rate += 2;
  rate += state.shardChargesRemaining;
  const moodBonus = { loyal: 3, friendly: 2, neutral: 0, distant: -2, cold: -3, frozen: -4 }[state.companionMood];
  rate += moodBonus;
  rate -= Object.values(state.injuries).flat().filter((injury) => injury.turnsLeft > 0).length * 2;
  return clamp(rate, 5, 95);
}
