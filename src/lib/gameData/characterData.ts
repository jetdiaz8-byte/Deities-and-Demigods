import type { AlignmentCode, Character, CharacterCategory, CharacterType } from "@/lib/types/gameTypes";
import { slugify } from "@/lib/utils";

type Seed = {
  pantheon: string;
  category: CharacterCategory;
  names: string[];
  align?: AlignmentCode;
  domain?: string;
};

const seeds: Seed[] = [
  { pantheon: "Greek", category: "greater-gods", names: ["Zeus", "Hera", "Athena", "Ares", "Apollo", "Poseidon", "Hades", "Hermes", "Artemis", "Aphrodite", "Hephaestus", "Dionysus", "Demeter"], align: "LN", domain: "Olympian sovereignty, war, craft, sea, underworld, love, and harvest" },
  { pantheon: "Norse", category: "greater-gods", names: ["Odin", "Thor", "Loki", "Tyr", "Freya", "Balder", "Heimdall", "Freyr", "Frigg"], align: "CN", domain: "runes, thunder, fate, war, beauty, vigilance, and doomed glory" },
  { pantheon: "Egyptian", category: "greater-gods", names: ["Ra", "Osiris", "Isis", "Set", "Thoth", "Anubis", "Bast", "Ptah", "Horus", "Sekhmet"], align: "LN", domain: "sun, judgment, magic, desert, writing, death, cats, creation, kingship, and plague" },
  { pantheon: "Indian", category: "greater-gods", names: ["Indra", "Vishnu", "Shiva", "Brahma", "Ganesha", "Durga", "Kali"], align: "NG", domain: "storm, preservation, destruction, creation, wisdom, protection, and time" },
  { pantheon: "Babylonian", category: "greater-gods", names: ["Marduk", "Tiamat", "Ishtar", "Enlil"], align: "LN", domain: "law, chaos waters, love, war, and air" },
  { pantheon: "Celtic", category: "greater-gods", names: ["Dagda", "Lugh", "Morrigan", "Ogma", "Cernunnos"], align: "CN", domain: "cauldron, craft, battle prophecy, language, and wild places" },
  { pantheon: "Chinese", category: "greater-gods", names: ["Jade Emperor", "Guan Yu", "Xuan Wu"], align: "LG", domain: "heavenly order, loyalty, war, and mystic guardianship" },
  { pantheon: "Japanese", category: "greater-gods", names: ["Amaterasu", "Susanoo", "Tsukuyomi"], align: "LN", domain: "sun, storm, sea, and moon" },
  { pantheon: "Central American", category: "greater-gods", names: ["Quetzalcoatl", "Tezcatlipoca", "Huitzilopochtli"], align: "CN", domain: "wind, knowledge, night, sacrifice, and war" },
  { pantheon: "Cthulhu", category: "greater-gods", names: ["Cthulhu", "Nyarlathotep", "Shub-Niggurath", "Azathoth", "Yog-Sothoth"], align: "CE", domain: "cosmic dread, dreams, madness, and impossible geometry" },
  { pantheon: "Other", category: "greater-gods", names: ["Moradin", "Corellon", "Gruumsh", "Lolth"], align: "CN", domain: "forge, art, conquest, and spider-dark ambition" },
  { pantheon: "Krynn", category: "greater-gods", names: ["Paladine", "Takhisis", "Mishakal", "Reorx", "Gilean", "Branchala", "Chemosh", "Zeboim", "Sargonnas", "Sirrion", "Habbakuk"], align: "TN", domain: "balance, dragons, healing, forge, knowledge, song, death, sea, vengeance, flame, and nature" },
  { pantheon: "Greek", category: "lesser-gods", names: ["Hestia", "Persephone", "Hypnos", "Nemesis", "Eros", "Pan", "Hebe", "Eileithyia", "Nike"], align: "TN", domain: "hearth, spring, sleep, vengeance, desire, wild music, youth, birth, and victory" },
  { pantheon: "Norse", category: "lesser-gods", names: ["Vidar", "Vali", "Ull", "Forseti", "Hodr", "Magni", "Modi", "Thrud", "Sif", "Sigyn", "Hel", "Nidhogg"], align: "TN", domain: "vengeance, winter, judgment, endurance, strength, loyalty, death, and roots" },
  { pantheon: "Egyptian", category: "lesser-gods", names: ["Nephthys", "Nut", "Geb", "Shu", "Tefnut", "Hathor", "Serqet", "Sobek", "Anhur", "Neith", "Wadjet", "Nekhbet"], align: "LN", domain: "mourning, sky, earth, air, moisture, love, venom, crocodiles, war, weaving, and royal protection" },
  { pantheon: "Indian", category: "lesser-gods", names: ["Surya", "Chandra", "Agni", "Varuna", "Yama", "Kubera", "Indrani", "Saraswati", "Parvati", "Hanuman"], align: "NG", domain: "sun, moon, fire, waters, death, wealth, queenship, learning, mountain power, and devotion" },
  { pantheon: "Babylonian", category: "lesser-gods", names: ["Nergal", "Ereshkigal", "Nabu", "Shamash", "Adad"], align: "LN", domain: "underworld, writing, justice, and storm" },
  { pantheon: "Celtic", category: "lesser-gods", names: ["Brigid", "Mannanan mac Lir", "Arawn", "Rhiannon", "Nuada"], align: "CN", domain: "poetry, sea, underworld, horses, and silver-handed kingship" },
  { pantheon: "Chinese", category: "lesser-gods", names: ["Chang'e", "Sun Wukong", "Nezha", "Guanyin", "Yanluo Wang"], align: "CG", domain: "moon, trickery, youth, mercy, and the courts of death" },
  { pantheon: "Japanese", category: "lesser-gods", names: ["Inari", "Ryujin", "Benten", "Bishamon", "Jizo", "Ebisu", "Daikoku"], align: "TN", domain: "rice, dragons, music, warriors, mercy, fortune, and plenty" },
  { pantheon: "Central American", category: "lesser-gods", names: ["Xipe Totec", "Xochipilli", "Camaxtli", "Mixcoatl"], align: "CN", domain: "renewal, flowers, hunting, and the stars" },
  { pantheon: "Cthulhu", category: "lesser-gods", names: ["Dagon", "Hastur", "Cthugha", "Iod", "Nyogtha"], align: "CE", domain: "deep water, yellow signs, living flame, and caverns that breathe" },
  { pantheon: "Other", category: "lesser-gods", names: ["Tymora", "Beshaba", "Helm", "Kelemvor", "Mystra", "Lathander"], align: "TN", domain: "luck, misfortune, guardianship, death, magic, and dawn" },
  { pantheon: "Arthurian", category: "heroes", names: ["King Arthur", "Sir Galahad", "Sir Launcelot", "Sir Gawaine", "Sir Tristram", "Merlin", "Morgan Le Fay", "Sir Lamorak", "Sir Gareth", "Sir Palomides", "King Pellinore"], align: "LG" },
  { pantheon: "Greek", category: "heroes", names: ["Heracles", "Perseus", "Odysseus", "Jason", "Theseus", "Bellerophon"], align: "CG" },
  { pantheon: "Babylonian", category: "heroes", names: ["Gilgamesh"], align: "CN" },
  { pantheon: "Celtic", category: "heroes", names: ["Cu Chulainn"], align: "CN" },
  { pantheon: "Finnish", category: "heroes", names: ["Vainamoinen", "Ilmarinen", "Lemminkainen", "Kullervo"], align: "TN" },
  { pantheon: "Melnibonean", category: "heroes", names: ["Elric of Melnibone", "Moonglum"], align: "CN" },
  { pantheon: "Nehwon", category: "heroes", names: ["Fafhrd", "The Gray Mouser", "Movarl"], align: "CG" },
  { pantheon: "Japanese", category: "heroes", names: ["Minamoto no Raiko", "Date Masamune", "Yoshitsune"], align: "LG" },
  { pantheon: "American Indian", category: "heroes", names: ["Hiawatha", "Qagwaaz", "Stoneribs"], align: "NG" },
  { pantheon: "Central American", category: "heroes", names: ["Hunapu", "Xbalanque"], align: "CG" },
  { pantheon: "Krynn", category: "heroes", names: ["Tanis Half-Elven", "Sturm Brightblade", "Raistlin Majere", "Caramon Majere", "Goldmoon", "Riverwind", "Laurana", "Kitiara Uth Matar", "Flint Fireforge", "Tasslehoff Burrfoot", "Tika Waylan", "Gilthanas", "Derek Crownguard"], align: "NG" },
  { pantheon: "Indian", category: "demigods", names: ["Karttikeya", "Yama", "Ratri", "Tvashtri"], align: "LN" },
  { pantheon: "Japanese", category: "demigods", names: ["Hachiman", "Oh-Kuni-Nushi"], align: "LG" },
  { pantheon: "Finnish", category: "demigods", names: ["Surma", "Loviatar", "Kiputytto"], align: "NE" },
  { pantheon: "Melnibonean", category: "demigods", names: ["Aarth"], align: "CN" },
  { pantheon: "Nehwon", category: "demigods", names: ["Issek of the Jug", "Spider God", "Votishal", "Gods of Lankhmar"], align: "CN" },
  { pantheon: "Babylonian", category: "demigods", names: ["Apshai"], align: "NE" },
  { pantheon: "Cthulhu", category: "demigods", names: ["Ithaqua"], align: "CE" },
  { pantheon: "Chinese", category: "demigods", names: ["Chao Kung Ming", "Chih Chiang Fyu Ya", "No Cha", "Wen Chung"], align: "LN" },
  { pantheon: "Other", category: "demigods", names: ["Fei Lien", "Fileet", "Haaashastaak", "Meerclar", "Nnuuurrrrc", "Vaprak", "Laogzed"], align: "CN" },
  { pantheon: "Krynn", category: "demigods", names: ["Fizban", "Cyan Bloodbane", "Lord Soth", "Huma Dragonbane", "Fistandantilus", "Raistlin Majere Demigod Form"], align: "TN" },
  { pantheon: "Norse", category: "monsters", names: ["Fenris Wolf", "Jormungandr", "Blodug Hofi"], align: "CE" },
  { pantheon: "Greek", category: "monsters", names: ["Cerberus"], align: "TN" },
  { pantheon: "Egyptian", category: "monsters", names: ["Apep"], align: "CE" },
  { pantheon: "Cthulhu", category: "monsters", names: ["Shoggoth", "Mi-Go", "Byakhee", "Deep Ones"], align: "CE" },
  { pantheon: "Primordial", category: "monsters", names: ["Primordial One"], align: "TN" },
  { pantheon: "American Indian", category: "monsters", names: ["Thunder Bird"], align: "TN" },
  { pantheon: "Chinese", category: "monsters", names: ["Ma Yuan"], align: "CE" },
  { pantheon: "Krynn", category: "monsters", names: ["Malystryx", "Khellendros", "Shadow Wights", "Draconians"], align: "CE" }
];

function typeFromCategory(category: CharacterCategory): CharacterType {
  if (category === "heroes") return "hero";
  if (category === "demigods") return "demigod";
  if (category === "monsters") return "monster";
  return "god";
}

function makeCharacter(seed: Seed, name: string, index: number): Character {
  const id = slugify(name);
  const type = typeFromCategory(seed.category);
  const tier = seed.category === "greater-gods" ? 4 : seed.category === "lesser-gods" ? 3 : seed.category === "demigods" ? 2 : seed.category === "monsters" ? 3 : 1;
  const maxHp = 45 + tier * 45 + (index % 5) * 8;
  const ac = 12 + tier * 2 + (index % 3);
  const level = type === "hero" ? 8 + (index % 7) : type === "demigod" ? 14 + (index % 5) : 20 + tier;
  const divineRank = seed.category === "greater-gods" ? 3 : seed.category === "lesser-gods" ? 2 : seed.category === "demigods" ? 1 : seed.category === "monsters" ? 1 : 0;
  const domain = seed.domain ?? "legend, ordeal, oath, weapon, and hard-won renown";
  const title =
    seed.category === "greater-gods" ? `Greater Power of ${seed.pantheon}` :
    seed.category === "lesser-gods" ? `Lesser Power of ${seed.pantheon}` :
    seed.category === "demigods" ? `Divine Scion of ${seed.pantheon}` :
    seed.category === "monsters" ? `Mythic Terror of ${seed.pantheon}` :
    `Hero of ${seed.pantheon}`;
  return {
    id,
    name,
    title,
    pantheon: seed.pantheon,
    align: seed.align ?? "TN",
    hp: maxHp,
    maxHp,
    ac,
    mr: Math.min(95, tier * 12 + (index % 4) * 5),
    move: 30,
    attacks: type === "monster" ? ["Rending mythic strike", "Terrifying presence"] : ["Weapon of legend", "Domain-born power"],
    abilities: [
      `${domain} authority`,
      type === "god" ? "Divine aura" : type === "demigod" ? "Heroic divine spark" : type === "monster" ? "Monstrous dread" : "Heroic resolve",
      seed.category === "greater-gods" ? "Reality-warping miracle" : seed.category === "lesser-gods" ? "Lesser miracle" : "Legendary deed"
    ],
    domain,
    symbol: `${name}'s ancient sign`,
    personality: `${name} speaks with the weight of ${seed.pantheon} myth, never sounding ordinary.`,
    type,
    category: seed.category,
    str: Math.min(25, 10 + tier * 3 + (index % 4)),
    dex: Math.min(25, 9 + tier * 2 + ((index + 1) % 5)),
    con: Math.min(25, 10 + tier * 3 + ((index + 2) % 4)),
    int: Math.min(25, 10 + tier * 2 + ((index + 3) % 5)),
    wis: Math.min(25, 10 + tier * 2 + ((index + 4) % 5)),
    cha: Math.min(25, 11 + tier * 3 + ((index + 5) % 4)),
    level,
    divineRank,
    description: `${name} is ${title.toLowerCase()}, rendered as a mythic presence bound to ${domain}.`,
    portrait: `/portraits/${seed.category}/${id}.png?v=3`,
    phase1: divineRank > 0 ? { phase: 1, name: "Omen", hp: maxHp, description: "The foe tests the party with domain signs and restrained power." } : undefined,
    phase2: divineRank > 0 ? { phase: 2, name: "Revelation", hp: maxHp, description: "The foe reveals the larger myth behind the violence." } : undefined,
    phase3: divineRank > 0 ? { phase: 3, name: "Apotheosis", hp: maxHp, description: "The foe becomes almost too large for the world to hold." } : undefined
  };
}

export const characterData: Character[] = seeds.flatMap((seed, seedIndex) =>
  seed.names.map((name, i) => makeCharacter(seed, name, seedIndex * 17 + i))
);

export const pantheons = Array.from(new Set(characterData.map((character) => character.pantheon))).sort();
export const fallbackEntities = characterData.filter((character) => character.category === "heroes" || character.category === "demigods").slice(0, 60);
export const krynnCharacters = characterData.filter((character) => character.pantheon === "Krynn");

export function getCharacter(id: string) {
  return characterData.find((character) => character.id === id);
}

export function getPlayableCharacters() {
  return characterData.filter((character) => character.category === "heroes" || character.category === "demigods");
}
