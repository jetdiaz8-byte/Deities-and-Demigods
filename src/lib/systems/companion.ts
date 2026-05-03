import type { CompanionMood } from "@/lib/types/gameTypes";
import { clamp } from "@/lib/utils";

export function moodFromAffinity(affinity: number): CompanionMood {
  if (affinity >= 85) return "loyal";
  if (affinity >= 60) return "friendly";
  if (affinity >= 40) return "neutral";
  if (affinity >= 25) return "distant";
  if (affinity >= 10) return "cold";
  return "frozen";
}

export function updateAffinity(current: number, delta: number) {
  const affinity = clamp(current + delta, 0, 100);
  return { affinity, mood: moodFromAffinity(affinity) };
}
