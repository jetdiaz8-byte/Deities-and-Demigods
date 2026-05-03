import type { Act, Character, GameState } from "@/lib/types/gameTypes";
import { clamp } from "@/lib/utils";

export function getDC(act: Act) {
  if (act === "act1") return 10;
  if (act === "act2") return 13;
  return 16;
}

export function maxDamageToPCPerHit(maxHp: number) {
  return Math.max(1, Math.floor(maxHp * 0.5));
}

export function maxDamageToBossPerTurn(maxHp: number) {
  return Math.max(1, Math.floor(maxHp * 0.25));
}

export function validateDamageToPC(target: Character, damage: number) {
  return clamp(Math.floor(damage), 0, maxDamageToPCPerHit(target.maxHp));
}

export function validateDamageToBoss(state: GameState, damage: number) {
  const already = state.turnDamageAccumulator[state.antagonistId] ?? 0;
  const remaining = Math.max(0, maxDamageToBossPerTurn(state.antagonistMaxHp) - already);
  return clamp(Math.floor(damage), 0, remaining);
}
