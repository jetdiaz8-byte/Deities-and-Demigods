import type { Character, FateAspect } from "@/lib/types/gameTypes";

export function generateStartingAspects(character: Character): FateAspect[] {
  return [
    {
      id: `${character.id}-high-concept`,
      name: `${character.title}`,
      type: "high_concept",
      description: `The essence of ${character.name}'s place in myth.`,
      invokeCost: 1,
      benefit: "+2 to actions that embody the title.",
      complication: "The title attracts duties, enemies, and impossible expectations."
    },
    {
      id: `${character.id}-trouble`,
      name: `A Legend Always Has a Price`,
      type: "trouble",
      description: `${character.name}'s greatness draws fate's attention.`,
      invokeCost: 1,
      benefit: "+2 when accepting a dangerous mythic cost.",
      complication: "The DM may press the cost of fame, pride, oath, or doom."
    }
  ];
}
