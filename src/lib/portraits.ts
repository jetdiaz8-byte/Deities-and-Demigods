import type { Character } from "@/lib/types/gameTypes";

const artDirection = [
  "high fantasy illustration",
  "classic 1980s AD&D Deities and Demigods aesthetic",
  "traditional oil painting",
  "visible brush strokes",
  "analog canvas texture",
  "realistic anatomy",
  "dramatic directional lighting",
  "strong foreground-midground-background composition",
  "cinematic storytelling",
  "fantasy book illustration",
  "ultra-detailed",
  "atmospheric depth",
  "no modern elements",
  "no sci-fi",
  "3:4 vertical composition"
].join(", ");

const divineBodyRuleBase = [
  "strictly humanoid divine body",
  "bipedal god form consistent with other pantheon members",
  "supernatural being aura visible in posture, light, environment, and scale",
  "intelligent divine eyes",
  "sovereign expression",
  "never mundane"
].join(", ");

const characterPromptOverrides: Record<string, string> = {
  thor: [
    artDirection,
    "Thor, the Norse god of thunder, depicted in mythic Asgard as a powerful rugged warrior-deity",
    divineBodyRuleBase,
    "he stands tall and broad-shouldered, with long red-gold hair and a thick braided beard, fierce yet noble expression, embodying wrath and protection",
    "his eyes carry the weight of storms, calm before fury",
    "heavy weathered armor of bronze and iron etched with ancient runes and Nordic knotwork, deep red cloak flowing in violent wind",
    "one hand grips Mjolnir, a short-handled rune-carved hammer glowing faintly with contained lightning, crackling with restrained power",
    "environment: mythic Asgard, towering golden halls, vast stone bridges, distant mountains under a storm-filled sky",
    "lightning forks across dark clouds above, illuminating cracked stone and scattered sparks beneath his boots",
    "subtle divine energy radiates outward: wind swirling, sparks dancing, thunder rolling in the distance, but Thor remains grounded, a warrior first and god second",
    "lighting: dramatic storm flashes, warm gold from Asgard, cold blue-white lightning rim light",
    "composition: heroic full-body or three-quarter portrait, epic scale with grounded realism, cinematic atmosphere"
  ].join("\n\n"),
  "raistlin-majere": [
    artDirection,
    "Raistlin Majere, Master of the Black Robes, standing at the threshold of godhood and defying the heavens",
    "frail skeletal form nearly swallowed by immense swirling arcane power, yet upright, unyielding, absolute",
    "pale golden skin, hollow features, hourglass eyes burning intensely, seeing the rise and fall of all things",
    "flowing black robes ripple unnaturally, dissolving into shadow at the edges, ancient runes blazing across the fabric",
    "staff crowned with a blazing crystal raised toward the sky as a conduit between mortal will and divine defiance",
    "above him the heavens tear open into vast storm clouds and a cosmic vortex; distant godlike silhouettes loom within the storm",
    "lightning crashes downward but bends and warps into his control",
    "ground fractures into glowing fissures; arcane energy erupts upward like pillars of fire and shadow",
    "broken towers and shattered columns of the Tower of High Sorcery crumble or levitate as reality strains",
    "time appears unstable: dust hangs motionless, flames flicker unnaturally, some ruins decay while others freeze mid-motion",
    "composition centers Raistlin as a small but dominant figure against a vast collapsing cosmos, fragile body contrasted with near-infinite power",
    "expression cold, triumphant, detached, inevitable",
    "lighting: violent contrast of deep shadow and blinding magical light, sharp highlights across skeletal face",
    "colors: blacks, deep purples, ember reds, flashes of gold, dark high-fantasy realism with cosmic intensity"
  ].join("\n\n"),
  "raistlin-majere-demigod-form": [
    artDirection,
    "Raistlin Majere in demigod form, a mortal wizard becoming something the gods fear",
    "frail skeletal body surrounded by impossible divine arcane power, black robes dissolving into starless shadow",
    "hourglass eyes burning gold, expression cold and inevitable, no fear and no hesitation",
    "cosmic vortex above, broken Tower of High Sorcery below, time fractured around him",
    "lightning, dust, flame, and ruins bend toward his will",
    "composition: fragile figure against collapsing heavens, heroic demigod at the edge of apotheosis",
    "lighting: extreme magical contrast, deep purple shadow, ember red, flashes of divine gold"
  ].join("\n\n")
};

function divineBodyRule(character: Character) {
  if (character.category === "greater-gods" || character.category === "lesser-gods") {
    return [
      "strictly humanoid divine body unless the character is canonically monstrous",
      "bipedal god form consistent with other pantheon members",
      "supernatural being aura visible in posture, light, environment, and scale",
      "intelligent divine eyes",
      "sovereign expression",
      "never mundane"
    ].join(", ");
  }
  return "heroic readable anatomy, legendary presence, expressive face, grounded physical form";
}

function greaterGodPrompt(character: Character) {
  return [
    artDirection,
    `${character.name}, ${character.title}, ${character.pantheon} mythology`,
    divineBodyRule(character),
    `a supreme deity of ${character.domain ?? "ancient divine authority"} standing elevated above an epic mythological environment`,
    "posture upright, regal, dominant over the environment, calm authority rather than ordinary aggression",
    "followers, warriors, priests, or distant mortals below, significantly smaller to emphasize divine dominance, naturally dispersed rather than staged",
    "the environment visibly reacts to the god's presence: light bends, dust lifts, banners turn, stone warms, storm clouds part or gather according to the domain",
    `distinctive divine attributes: ${character.abilities.join(", ")}`,
    `symbolic elements: ${character.symbol ?? "sacred symbols and domain signs"}`,
    "lighting: overwhelming celestial or infernal radiance forming a halo or aura, with deep layered shadows across foreground figures",
    "color palette: radiant gold, amber, warm ivory highlights, crimson or domain colors, deep earth shadows",
    "composition: grounded mythological realism, strong vertical hierarchy, divine presence dominates without breaking humanoid anatomical consistency"
  ].join("\n\n");
}

function lesserGodPrompt(character: Character) {
  return [
    artDirection,
    `${character.name}, ${character.title}, ${character.pantheon} mythology`,
    divineBodyRule(character),
    `a lesser but unmistakably divine deity of ${character.domain ?? "a focused sacred domain"} in a mythic shrine, ruin, forest, hall, or sacred landscape`,
    "presence grand and supernatural, but more intimate than a greater god; the deity feels close enough to bargain with and dangerous enough to worship",
    "domain objects, sacred animals, relics, weather, plants, flame, shadow, or spirits subtly answer their presence",
    `distinctive divine attributes: ${character.abilities.join(", ")}`,
    "lighting: strong directional shrine light, candle glow, moonlight, storm light, or sacred fire with heavy chiaroscuro",
    "color palette: dark umber, aged gold, muted crimson, ivory, and pantheon/domain accent colors",
    "composition: heroic full-body or three-quarter divine portrait, supernatural aura clear but not as world-dominating as greater gods"
  ].join("\n\n");
}

function heroicPrompt(character: Character) {
  const isDemigod = character.category === "demigods";
  return [
    artDirection,
    `${character.name}, ${character.title}, ${character.pantheon} mythology`,
    isDemigod
      ? "heroic demigod at the threshold between mortal and divine, visible divine spark, faint aura, legendary posture"
      : "heroic mortal legend, battle-worn and determined, larger than life but still human in emotional readability",
    `domain and legend: ${character.domain ?? "weapon, oath, ordeal, and renown"}`,
    `distinctive abilities and symbols: ${character.abilities.join(", ")}`,
    "armor, robes, weapon, scars, relic, or clothing must reflect the character's myth and culture, not generic fantasy",
    "environment shows the mythic crisis around them: ruined towers, sacred battlefield, storm sky, temple, wilderness, or collapsing magical reality",
    "expression heroic and focused; demigods may show supernatural confidence, heroes should show courage under impossible pressure",
    "lighting: dramatic high-contrast magical or torchlit illumination, sharp highlights across face and hands",
    "color palette: deep blacks, umbers, aged gold, ember red, muted steel, ivory highlights, domain-specific accent colors",
    "composition: cinematic heroic portrait, full-body or three-quarter, character dominant against a vast mythic background"
  ].join("\n\n");
}

function monsterPrompt(character: Character) {
  return [
    artDirection,
    `${character.name}, ${character.title}, ${character.pantheon} mythology`,
    "mythic monster or super-monster with terrifying ancient presence, not a generic creature",
    "scale should feel legendary, environment dwarfed or corrupted by the creature",
    `distinctive monstrous traits and powers: ${character.abilities.join(", ")}`,
    "environment reacts with dread: cracked earth, poisoned air, warped shadows, fleeing worshippers, storm, flood, flame, or cosmic distortion",
    "lighting: ominous chiaroscuro, rim light revealing silhouette, deep shadow hiding impossible details",
    "composition: cinematic fantasy horror, creature dominant, atmospheric depth, no modern elements"
  ].join("\n\n");
}

export function buildPortraitPrompt(character: Character) {
  const override = characterPromptOverrides[character.id];
  if (override) return override;
  if (character.category === "greater-gods") return greaterGodPrompt(character);
  if (character.category === "lesser-gods") return lesserGodPrompt(character);
  if (character.category === "demigods" || character.category === "heroes") return heroicPrompt(character);
  return monsterPrompt(character);
}

export function portraitSrc(character: Character) {
  return `/portraits/${character.category}/${character.id}.png?v=3`;
}
