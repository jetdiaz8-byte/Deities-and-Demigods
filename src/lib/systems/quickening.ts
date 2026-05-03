import type { Character } from "@/lib/types/gameTypes";

export function canQuickening(defeatedEnemy: Character) {
  return defeatedEnemy.divineRank >= 1;
}

export function getQuickeningOptions(deity: Character) {
  return deity.abilities.slice(0, 3).map((ability) => ({
    id: `${deity.id}-${ability.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: ability,
    sourceId: deity.id,
    description: `Absorb ${ability} from ${deity.name}.`
  }));
}
