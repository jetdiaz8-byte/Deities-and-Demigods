import type { AbilityKey, SkillName } from "@/lib/types/gameTypes";

export const SKILL_ABILITY_MAP: Record<SkillName, AbilityKey> = {
  acrobatics: "dex",
  animal_handling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleight_of_hand: "dex",
  stealth: "dex",
  survival: "wis"
};

export const skillNames = Object.keys(SKILL_ABILITY_MAP) as SkillName[];
