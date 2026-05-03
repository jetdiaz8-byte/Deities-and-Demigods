import { characterData } from "@/lib/gameData/characterData";
import type { Character } from "@/lib/types/gameTypes";

export const antagonistPool = characterData.filter((character) =>
  character.category === "greater-gods" || character.category === "monsters"
);

export function rollAntagonist(excludePantheon?: string): Character {
  const pool = antagonistPool.filter((character) => character.pantheon !== excludePantheon);
  const usable = pool.length > 0 ? pool : antagonistPool;
  return usable[Math.floor(Math.random() * usable.length)] ?? antagonistPool[0];
}
