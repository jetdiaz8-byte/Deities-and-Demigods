import type { Character, SkillName } from "@/lib/types/gameTypes";

const warrior: SkillName[] = ["athletics", "intimidation", "survival"];
const mage: SkillName[] = ["arcana", "history", "investigation", "religion"];
const rogue: SkillName[] = ["acrobatics", "stealth", "sleight_of_hand", "deception"];
const healer: SkillName[] = ["medicine", "nature", "perception", "insight"];
const bard: SkillName[] = ["performance", "persuasion", "deception"];

export function inferProficiencies(character: Character): SkillName[] {
  const stats = [
    ["str", character.str, warrior],
    ["int", character.int, mage],
    ["dex", character.dex, rogue],
    ["wis", character.wis, healer],
    ["cha", character.cha, bard]
  ] as const;
  const primary = [...stats].sort((a, b) => b[1] - a[1])[0][2];
  const domain = `${character.domain ?? ""} ${character.abilities.join(" ")}`.toLowerCase();
  const extras: SkillName[] = [];
  if (domain.includes("death") || domain.includes("god") || domain.includes("divine")) extras.push("religion");
  if (domain.includes("storm") || domain.includes("wild") || domain.includes("forest")) extras.push("nature");
  if (domain.includes("law") || domain.includes("king") || domain.includes("oath")) extras.push("persuasion");
  return Array.from(new Set([...primary, ...extras])).slice(0, 5);
}
