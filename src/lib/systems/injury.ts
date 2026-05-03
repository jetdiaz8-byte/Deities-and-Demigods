import type { ActiveInjury, Act, Injury } from "@/lib/types/gameTypes";

export function maxInjuriesPerTurn(act: Act) {
  return act === "act1" ? 1 : act === "act2" ? 2 : 3;
}

export function activateInjury(injury: Injury, turnsLeft = 5): ActiveInjury {
  return { ...injury, turnsLeft };
}

export function tickInjuries(injuries: ActiveInjury[]) {
  return injuries.map((injury) => ({ ...injury, turnsLeft: Math.max(0, injury.turnsLeft - 1) })).filter((injury) => injury.turnsLeft > 0);
}
