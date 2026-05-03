import type { Item } from "@/lib/types/gameTypes";

const itemSeeds = [
  ["potion", "Draught of the Hearth", "common", "Restores 2d8 HP", "⚗"],
  ["potion", "Black Lotus Tincture", "uncommon", "Cures poison but costs stamina", "⚗"],
  ["potion", "Ambrosial Sip", "rare", "Restores HP and Fate", "⚗"],
  ["potion", "Yggdrasil Sap", "legendary", "Regenerates for three turns", "⚗"],
  ["artifact", "Bronze Mirror of Truth", "rare", "Reveals illusions", "◈"],
  ["artifact", "Iron Thorn Crown", "legendary", "Compels lesser spirits", "◈"],
  ["artifact", "Lantern of the Last Road", "divine", "Guides the dead and lost", "◈"],
  ["artifact", "Tablet of Binding", "divine", "Locks an oath into fate", "◈"],
  ["equipment", "Oathbound Shield", "rare", "Reduces ally damage", "◉"],
  ["equipment", "Ashen Cloak", "uncommon", "Improves stealth in ruins", "◉"],
  ["equipment", "Spear of First Blood", "rare", "Bonus on opening attacks", "◉"],
  ["equipment", "Moon-Silver Mail", "legendary", "Protects against monsters", "◉"],
  ["scroll", "Scroll of Salt and Ash", "common", "Banishes minor spirits", "☉"],
  ["scroll", "Litany of Closed Doors", "uncommon", "Seals a passage", "☉"],
  ["scroll", "Solar Hymn", "rare", "Deals radiant damage", "☉"],
  ["scroll", "Name of the Storm", "legendary", "Calls thunder", "☉"],
  ["special", "Wax Seal of Kings", "rare", "Improves paragon diplomacy", "✹"],
  ["special", "Red Thread of Doom", "rare", "Reveals an antagonist omen", "✹"],
  ["special", "Coin for the Ferryman", "legendary", "Prevents one death", "✹"],
  ["special", "Godbone Die", "divine", "Rerolls fate at a price", "✹"]
] as const;

export const itemData: Item[] = Array.from({ length: 42 }, (_, i) => {
  const seed = itemSeeds[i % itemSeeds.length];
  const suffix = i < itemSeeds.length ? "" : ` ${Math.floor(i / itemSeeds.length) + 1}`;
  return {
    id: `${seed[0]}-${i + 1}`,
    name: `${seed[1]}${suffix}`,
    description: seed[3],
    type: seed[0],
    rarity: seed[2],
    charges: seed[0] === "equipment" ? 0 : seed[2] === "divine" ? 1 : 3,
    maxCharges: seed[0] === "equipment" ? 0 : seed[2] === "divine" ? 1 : 3,
    effects: [seed[3]],
    acquisitionMethod: "Found through DM item_drops or quest rewards.",
    icon: seed[4],
    lore: "A thing with old hands on it, waiting to become part of a newer myth."
  };
});
