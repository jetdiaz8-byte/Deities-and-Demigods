import type { Injury } from "@/lib/types/gameTypes";

const groups = {
  physical: ["Broken Rib", "Split Brow", "Crushed Hand", "Torn Shoulder", "Sprained Ankle", "Pierced Thigh", "Concussion", "Ragged Scar"],
  magical: ["Arcane Burn", "Mana Sickness", "Runic Brand", "Shadow Chill", "Soul Static", "Spell Fracture"],
  poison: ["Serpent Fever", "Black Bile", "Numbed Fingers", "Venom Dreams", "Rotting Cough", "Green Sweat"],
  psionic: ["Mind Echo", "Memory Tear", "Whispering Pain", "Dream Bruise", "Thought Bleed", "Identity Flicker"],
  cursed: ["Doom Mark", "Godsore"]
} as const;

export const injuryData: Injury[] = Object.entries(groups).flatMap(([type, names]) =>
  names.map((name, index) => ({
    id: `${type}-${index + 1}`,
    name,
    description: `${name} lingers as a mythic wound, visible in posture, breath, and courage.`,
    effect: index % 2 === 0 ? "-1 to related checks" : "-2 stamina until cured",
    modifier: index % 2 === 0 ? ({ checks: -1 } as Record<string, number>) : ({ stamina: -2 } as Record<string, number>),
    icon: type === "physical" ? "✚" : type === "magical" ? "✦" : type === "poison" ? "☠" : type === "psionic" ? "◌" : "◆",
    type: type as Injury["type"],
    cureDescription: "Rest at a sacred place, spend a healing item, or receive divine aid."
  }))
);
