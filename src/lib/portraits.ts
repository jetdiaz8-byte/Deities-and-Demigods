import type { Character } from "@/lib/types/gameTypes";

const commonStyle = [
  "1980s tabletop fantasy book illustration aesthetic",
  "traditional oil painting look",
  "visible brush strokes",
  "analog canvas texture",
  "realistic heroic anatomy",
  "dramatic directional lighting",
  "strong foreground midground background composition",
  "mythic scale",
  "no modern elements",
  "no sci-fi"
].join(", ");

export function buildPortraitPrompt(character: Character) {
  const tier =
    character.category === "greater-gods"
      ? "supreme supernatural god aura, overwhelming divine scale, followers or landscape dwarfed below, grandest possible mythic presence"
      : character.category === "lesser-gods"
        ? "supernatural deity aura, grand divine presence, sacred symbols reacting to their power"
        : character.category === "demigods"
          ? "heroic demigod presence, mortal form touched by divine glow, legendary pose"
          : character.category === "heroes"
            ? "heroic mortal legend, battle-worn confidence, weapon or symbol of renown"
            : "terrifying mythic monster, otherworldly dread, ancient predatory power";
  return [
    `${character.name}, ${character.title}, ${character.pantheon} mythology`,
    commonStyle,
    tier,
    `domain: ${character.domain ?? "mythic power"}`,
    `distinctive attributes: ${character.abilities.join(", ")}`,
    `personality: ${character.personality}`,
    "vertical portrait composition, dark fantasy, rich muted palette of gold, crimson, umber, ivory, and deep shadow"
  ].join(", ");
}

export function portraitSrc(character: Character) {
  return `/portraits/${character.category}/${character.id}.png?v=3`;
}
