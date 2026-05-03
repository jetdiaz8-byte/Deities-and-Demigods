import type { AbilityKey, Character, DiceResult, SkillName } from "@/lib/types/gameTypes";
import { SKILL_ABILITY_MAP } from "@/lib/gameData/skillData";

export function abilityToBonus(score: number): number {
  if (score <= 3) return -3;
  if (score <= 5) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 15) return 1;
  if (score <= 17) return 2;
  if (score === 18) return 3;
  if (score < 19) return 5;
  if (score === 19) return 7;
  if (score === 20) return 8;
  if (score <= 22) return 9;
  if (score <= 24) return 10;
  return 14;
}

export function rollD20(modifier = 0, dc = 10): DiceResult {
  const raw = Math.floor(Math.random() * 20) + 1;
  const total = raw + modifier;
  const isCritical = raw === 20;
  const isFumble = raw === 1;
  return {
    raw,
    modifier,
    total,
    isCritical,
    isFumble,
    dc,
    outcome: isCritical ? "critical_success" : isFumble ? "critical_fail" : total >= dc ? "full_success" : total >= dc - 3 ? "partial_success" : "miss"
  };
}

export function proficiencyBonus(level = 1) {
  return Math.ceil(level / 4) + 1;
}

export function skillModifier(character: Character, skill: SkillName, proficient: boolean) {
  const ability = SKILL_ABILITY_MAP[skill];
  return abilityToBonus(character[ability]) + (proficient ? proficiencyBonus(character.level) : 0);
}

export function abilityModifier(character: Character, ability: AbilityKey) {
  return abilityToBonus(character[ability]);
}
