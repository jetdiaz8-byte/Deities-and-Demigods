// Embedded fallback entity data for when the database is unavailable
// This ensures the app never gets stuck in a loading loop
// NO DUPLICATES - each entity appears exactly once

export interface FallbackEntity {
  id: string
  name: string
  pantheon: string
  type: string
  AC: number
  HP: number
  align: string
  abilities: string[]
  personality: string
  category: string
  // Optional fields for extended entity data
  STR?: string
  INT?: string
  WIS?: string
  DEX?: string
  CON?: string
  CHA?: string
  level?: string
  attacks?: number
  damage?: string
  MV?: string
  title?: string
  epithet?: string
  MR?: number
}

export const FALLBACK_HEROES: FallbackEntity[] = [
  {
    id: "arthur",
    name: "King Arthur",
    pantheon: "Arthurian",
    type: "hero",
    AC: 0,
    HP: 123,
    align: "Lawful good",
    abilities: [
      "Excalibur +5 sword of sharpness (lawful good only)",
      "Magic scabbard: cutting/thrusting do half damage to Arthur",
      "Rallying: allies +1 to hit/saves within 20ft",
      "Cannot be charmed or dominated",
      "Lay on hands 28 HP/day"
    ],
    personality: "Noble, absolutely principled. Will sacrifice himself before abandoning an ally.",
    category: "heroes"
  },
  {
    id: "galahad",
    name: "Sir Galahad",
    pantheon: "Arthurian",
    type: "hero",
    AC: -4,
    HP: 120,
    align: "Lawful good",
    abilities: [
      "3 attacks/round",
      "Purity aura: +4 saves vs all evil magic",
      "Holy aura: undead flee 30ft",
      "Divine intervention 10%/round at <=10% HP",
      "Immune to all diseases and poisons"
    ],
    personality: "Absolutely pure. No moral compromise possible. Will shield any innocent.",
    category: "heroes"
  },
  {
    id: "lancelot",
    name: "Sir Launcelot",
    pantheon: "Arthurian",
    type: "hero",
    AC: -3,
    HP: 141,
    align: "Lawful good",
    abilities: [
      "STR 19: +3 to hit +6 damage",
      "Best mortal fighter: +2 vs named opponents",
      "Lay on hands 40 HP/day",
      "Immune to fear and charm",
      "Cannot be surprised"
    ],
    personality: "Tormented, magnificent. Will never break a sworn word.",
    category: "heroes"
  },
  {
    id: "gawaine",
    name: "Sir Gawaine",
    pantheon: "Arthurian",
    type: "hero",
    AC: -2,
    HP: 112,
    align: "Lawful good",
    abilities: [
      "Waxing STR: 9am-noon STR increases to 19, then to 21 (max)",
      "Never surrenders",
      "Mounted combat +2 to hit",
      "Double damage vs. giants"
    ],
    personality: "Honorable but hot-tempered. Formidable at mid-morning.",
    category: "heroes"
  },
  {
    id: "tristram",
    name: "Sir Tristram",
    pantheon: "Arthurian",
    type: "hero",
    AC: -3,
    HP: 120,
    align: "Lawful good",
    abilities: [
      "STR 18(99%): +3 to hit +6 damage",
      "Master musician: bardic effects",
      "Immune to charm",
      "Exceptional horseman: +2 all mounted rolls"
    ],
    personality: "Romantic, tragic, fierce. Love and duty perpetually in conflict.",
    category: "heroes"
  },
  {
    id: "merlin",
    name: "Merlin",
    pantheon: "Arthurian",
    type: "hero",
    AC: 2,
    HP: 175,
    align: "Neutral good",
    abilities: [
      "Staff absorbs any spell cast at him; he re-casts it as his own",
      "Regenerates 1 HP/round",
      "Foresees future (imperfect - sometimes forces retreat)",
      "Shape change at will",
      "Immune to charm and disease"
    ],
    personality: "Supremely powerful but haunted by future-visions. Acts obliquely, plans deeply.",
    category: "heroes"
  },
  {
    id: "morgan_le_fay",
    name: "Morgan Le Fay",
    pantheon: "Arthurian",
    type: "hero",
    AC: 4,
    HP: 39,
    align: "Neutral evil",
    abilities: [
      "Poisoned dagger: save vs. poison or die",
      "Ring +3 protection",
      "Shape change 3/day",
      "Charm person at will",
      "Cause disease by touch"
    ],
    personality: "Scheming, brilliant, bitter. Uses beauty as a weapon. Hates Arthur.",
    category: "heroes"
  },
  {
    id: "lamorak",
    name: "Sir Lamorak",
    pantheon: "Arthurian",
    type: "hero",
    AC: -2,
    HP: 131,
    align: "Lawful good",
    abilities: [
      "STR 19: +3 to hit +6 damage",
      "Third greatest knight: +1 all combat rolls",
      "Immune to fear",
      "Jousting mastery: +4 vs mounted opponents"
    ],
    personality: "Fierce and direct. Loyal to the point of stubbornness.",
    category: "heroes"
  },
  {
    id: "gareth",
    name: "Sir Gareth",
    pantheon: "Arthurian",
    type: "hero",
    AC: -1,
    HP: 118,
    align: "Lawful good",
    abilities: [
      "Beloved by common folk: peasants aid him freely",
      "Never surrenders",
      "Recognizes disguises 75%"
    ],
    personality: "Humble, genuinely kind. The most beloved of Arthur's knights.",
    category: "heroes"
  },
  {
    id: "palomides",
    name: "Sir Palomides",
    pantheon: "Arthurian",
    type: "hero",
    AC: -1,
    HP: 116,
    align: "Neutral good",
    abilities: [
      "Saracen techniques: +1 attack vs armored opponents",
      "Outsider insight: detects lies 65%",
      "Pursuit of Questing Beast: immune to fear when on quest"
    ],
    personality: "Earnest convert. Driven by honor and unrequited love. Seeks redemption.",
    category: "heroes"
  },
  {
    id: "pellinore",
    name: "King Pellinore",
    pantheon: "Arthurian",
    type: "hero",
    AC: -1,
    HP: 126,
    align: "Lawful good",
    abilities: [
      "Questing Beast tracker: finds any tracked creature",
      "Jousting champion: +3 vs mounted opponents",
      "Immune to confusion and fear"
    ],
    personality: "Singleminded. The hunt is everything. Loyal, simple, devastating.",
    category: "heroes"
  },
  {
    id: "gilgamesh",
    name: "Gilgamesh",
    pantheon: "Babylonian",
    type: "hero",
    AC: 6,
    HP: 180,
    align: "Neutral good",
    abilities: [
      "Cannot be charmed - ever",
      "Wrestling: auto-pins any non-divine creature",
      "10% MR, immune to disease",
      "Fear of death: below 50% HP must check WIS or retreat",
      "Two-thirds divine blood"
    ],
    personality: "Mighty, tyrannical, secretly tender. Terrified of death since Enkidu died.",
    category: "heroes"
  },
  {
    id: "cuchulainn",
    name: "Cu Chulainn",
    pantheon: "Celtic",
    type: "hero",
    AC: -1,
    HP: 150,
    align: "Neutral good",
    abilities: [
      "Gae Bolg +4 spear (4-40 dmg) - only he can wield it",
      "Battle shining: mortal enemies -4 to attack",
      "Warp spasm at near death: double damage attacks all",
      "20% MR",
      "Battle cry stuns opponents 1 round"
    ],
    personality: "Blazing, joyful, doomed. Born to die young and gloriously. Never retreats.",
    category: "heroes"
  },
  {
    id: "heracles_hero",
    name: "Heracles",
    pantheon: "Greek",
    type: "hero",
    AC: -2,
    HP: 187,
    align: "Chaotic good",
    abilities: [
      "STR 25: +7 to hit +14 damage",
      "Nemean lion skin: thrusting 1pt slashing half bludgeoning full",
      "Special bow: never misses at 1 mile, poisoned arrows vs magical foes",
      "Berserker at <=50% HP: attacks all within reach +25 damage",
      "12 labors experience: +2 vs monsters"
    ],
    personality: "Naive, explosive, genuinely heroic. Erupts at any perceived ingratitude.",
    category: "heroes"
  },
  {
    id: "perseus",
    name: "Perseus",
    pantheon: "Greek",
    type: "hero",
    AC: 3,
    HP: 112,
    align: "Lawful good",
    abilities: [
      "Helm of invisibility at will",
      "Winged sandals: fly 24\"",
      "Vorpal blade: decapitates on 20",
      "Aegis shield: petrification reflection",
      "25% divine protection"
    ],
    personality: "Methodical hero. Plans carefully. Grateful to the gods who aid him.",
    category: "heroes"
  },
  {
    id: "odysseus",
    name: "Odysseus",
    pantheon: "Greek",
    type: "hero",
    AC: 2,
    HP: 83,
    align: "Neutral good",
    abilities: [
      "Unique bow: 3 attacks/round, 3x normal range",
      "Tactical genius: +3 to surprise and ambush",
      "Master of disguise 80%",
      "Naval strategy: +4 to all naval actions",
      "Cannot be permanently charmed"
    ],
    personality: "Cunning, patient, homesick. Never lies when truth is more useful. Often it is.",
    category: "heroes"
  },
  {
    id: "jason",
    name: "Jason",
    pantheon: "Greek",
    type: "hero",
    AC: 3,
    HP: 129,
    align: "Neutral good",
    abilities: [
      "STR 18(00): +3 to hit +8 damage",
      "Golden Fleece: heals any wound (carried)",
      "Leadership: crew never panics",
      "Argonaut experience: +2 all maritime rolls",
      "Inspire loyalty: followers fight to death"
    ],
    personality: "Bold, charismatic leader. Glory-seeker who gets others killed for it.",
    category: "heroes"
  },
  {
    id: "theseus",
    name: "Theseus",
    pantheon: "Greek",
    type: "hero",
    AC: 4,
    HP: 103,
    align: "Lawful good",
    abilities: [
      "Knows all enemy weaknesses: +2 vs creatures studied",
      "Bull wrestling: auto-pins bulls and bovine creatures",
      "Labyrinth sense: never lost in enclosed spaces",
      "Athenian law: +2 all social interactions in civilized areas"
    ],
    personality: "Civic-minded hero. Genuinely wants to help the city. Romantically tragic.",
    category: "heroes"
  },
  {
    id: "bellerophon",
    name: "Bellerophon",
    pantheon: "Greek",
    type: "hero",
    AC: 0,
    HP: 135,
    align: "Lawful good",
    abilities: [
      "Rides Pegasus: flying mount AC-2, HP 95",
      "Divine bow: +3 to hit, double range",
      "Monster slayer: +4 vs chimera and hybrids",
      "Heroic destiny: re-roll 1 failed save per day"
    ],
    personality: "Ambitious hero. Seeks glory but tempers it with honor.",
    category: "heroes"
  },
  {
    id: "vainamoinen",
    name: "Vainamoinen",
    pantheon: "Finnish",
    type: "hero",
    AC: 4,
    HP: 250,
    align: "Lawful good",
    abilities: [
      "Girdle of Cloud Giant Strength: STR 23",
      "Immune to charm and disease",
      "Songs alter reality: bardic magic affects all within 240ft",
      "Shape change at will",
      "Crossbow of accuracy: never misses at 1 mile"
    ],
    personality: "Ancient, patient, sorrowful. Negotiates before fighting. Devastating when he acts.",
    category: "heroes"
  },
  {
    id: "ilmarinen",
    name: "Ilmarinen",
    pantheon: "Finnish",
    type: "hero",
    AC: -1,
    HP: 200,
    align: "Lawful neutral",
    abilities: [
      "Master smith: creates magic items in 1d6 turns",
      "Immune to fire and heat",
      "Iron skin: +5 AC vs metal weapons",
      "Crafted the sky: divine crafting ability"
    ],
    personality: "Patient craftsman. Values creation over destruction. Will work for worthy cause.",
    category: "heroes"
  },
  {
    id: "lemminkainen",
    name: "Lemminkainen",
    pantheon: "Finnish",
    type: "hero",
    AC: 2,
    HP: 160,
    align: "Chaotic good",
    abilities: [
      "Berserker rage: +4 damage when below half HP",
      "Can return from death once (mother's magic)",
      "Master of song magic",
      "Wanderer luck: re-roll failed saves vs traps"
    ],
    personality: "Wild, reckless, beloved by women. Lives for adventure and glory.",
    category: "heroes"
  },
  {
    id: "kullervo",
    name: "Kullervo",
    pantheon: "Finnish",
    type: "hero",
    AC: 3,
    HP: 140,
    align: "Chaotic neutral",
    abilities: [
      "Tragic destiny: immune to fear and despair",
      "Massive strength: +6 damage",
      "Wolf companion: fights alongside him",
      "Vengeful rage: +10 damage vs those who wronged him"
    ],
    personality: "Cursed from birth. Everything he touches turns to ash. Driven by revenge.",
    category: "heroes"
  },
  {
    id: "elric",
    name: "Elric of Melnibone",
    pantheon: "Melnibonean",
    type: "hero",
    AC: -6,
    HP: 45,
    align: "Chaotic evil",
    abilities: [
      "Stormbringer +5: each hit drains all levels (50%) or half HP (50%)",
      "Each Stormbringer kill: +5 HP and +1 STR to Elric (max STR 23, 10 turns)",
      "Ring of Kings: 70% summon any Elemental Lord",
      "85% MR when wielding Stormbringer",
      "Sword sentient: 15%/battle Stormbringer acts against Elric"
    ],
    personality: "Tormented, brilliant, self-loathing. The sword will betray everyone eventually.",
    category: "heroes"
  },
  {
    id: "moonglum",
    name: "Moonglum",
    pantheon: "Melnibonean",
    type: "hero",
    AC: 2,
    HP: 98,
    align: "Neutral good",
    abilities: [
      "4 attacks/round",
      "Backstab x4",
      "Never surprised",
      "Defensive fighting: +3 AC when not attacking",
      "Loyal friend: +2 all rolls when Elric is threatened"
    ],
    personality: "Cheerful, steadfast, quietly remarkable. The only person Elric trusts.",
    category: "heroes"
  },
  {
    id: "fafhrd",
    name: "Fafhrd",
    pantheon: "Nehwon",
    type: "hero",
    AC: 3,
    HP: 120,
    align: "Neutral good",
    abilities: [
      "STR 18(00): +3 to hit +6 damage",
      "Graywand +1 bastard sword, Heartseeker +1 dirk",
      "Defends friend: +2 all rolls when Mouser threatened",
      "Snow/arctic survival: no penalties in cold",
      "Bardic knowledge: knows legends of all cultures"
    ],
    personality: "Huge, warm-hearted, storytelling. Will die for his friend. Acts on feeling first.",
    category: "heroes"
  },
  {
    id: "gray_mouser",
    name: "Gray Mouser",
    pantheon: "Nehwon",
    type: "hero",
    AC: 2,
    HP: 96,
    align: "Neutral good",
    abilities: [
      "3 attacks/round",
      "Scalpel +1 short sword, Cat's Claw +1 dagger",
      "Backstab x4",
      "Defends friend: +2 all rolls when Fafhrd threatened",
      "Minor sorcery: knows 10 wizard spells 1st-4th level"
    ],
    personality: "Witty, cynical, agile. Thinks faster than he should. Loyal to exactly one person.",
    category: "heroes"
  },
  {
    id: "movarl",
    name: "Movarl",
    pantheon: "Nehwon",
    type: "hero",
    AC: -1,
    HP: 130,
    align: "Lawful neutral",
    abilities: [
      "Overlord's command: allies +2 morale",
      "Strategic genius: +3 to military tactics",
      "Veteran fighter: 3 attacks/round",
      "Political savvy: can negotiate with any faction"
    ],
    personality: "Ambitious ruler. Seeks to unite Lankhmar. Values competent allies.",
    category: "heroes"
  },
  {
    id: "raiko",
    name: "Raiko",
    pantheon: "Japanese",
    type: "hero",
    AC: -1,
    HP: 180,
    align: "Lawful good",
    abilities: [
      "MV 29\": fastest human movement",
      "Bow: double normal range and damage",
      "Demon slayer: +4 vs oni and demons",
      "Assassination: 95% success vs surprised target",
      "Never surprised"
    ],
    personality: "Silent, swift, duty-bound. The hunt for demons is his purpose and peace.",
    category: "heroes"
  },
  {
    id: "yamamoto_date",
    name: "Yamamoto Date",
    pantheon: "Japanese",
    type: "hero",
    AC: -1,
    HP: 145,
    align: "Lawful good",
    abilities: [
      "Master swordsman: 3 attacks/round",
      "Never misses with bow",
      "Kensai techniques: +3 all combat rolls",
      "Cannot be surprised"
    ],
    personality: "Patient, calculating, absolutely lethal. The sword is his life.",
    category: "heroes"
  },
  {
    id: "yoshmye",
    name: "Yoshmye",
    pantheon: "Japanese",
    type: "hero",
    AC: 2,
    HP: 88,
    align: "Neutral",
    abilities: [
      "Shadow jump: teleport 30ft in darkness",
      "Assassination: 90% kill surprised target",
      "Poison mastery: all poisons known"
    ],
    personality: "Silent, efficient, honor-bound to a code only he knows.",
    category: "heroes"
  },
  {
    id: "hiawatha",
    name: "Hiawatha",
    pantheon: "American Indian",
    type: "hero",
    AC: 6,
    HP: 120,
    align: "Lawful good",
    abilities: [
      "Peace-maker: can stop combat with CHA check",
      "Animal friendship",
      "Speaks all tribal languages",
      "+2 to all saves"
    ],
    personality: "Wise peacemaker. Seeks unity. Will fight only as absolute last resort.",
    category: "heroes"
  },
  {
    id: "qagwaaz",
    name: "Qagwaaz",
    pantheon: "American Indian",
    type: "hero",
    AC: 6,
    HP: 150,
    align: "Neutral",
    abilities: [
      "Always acts first in combat",
      "Never surprised",
      "Tracking 90%",
      "STR 19: +3 to hit +6 damage"
    ],
    personality: "Fierce, silent, protects his people above all else.",
    category: "heroes"
  },
  {
    id: "stoneribs",
    name: "Stoneribs",
    pantheon: "American Indian",
    type: "hero",
    AC: 4,
    HP: 140,
    align: "Chaotic good",
    abilities: [
      "STR 20: +3 to hit +8 damage",
      "Immune to natural cold",
      "Stone skin: thrusting weapons do half damage",
      "Berserker rage at <=25% HP"
    ],
    personality: "Direct, powerful, fights like elemental force of nature.",
    category: "heroes"
  },
  {
    id: "hunapu",
    name: "Hunapu & Xbalanque",
    pantheon: "Central American",
    type: "hero",
    AC: 2,
    HP: 150,
    align: "Neutral good",
    abilities: [
      "Twin heroes: fight as one entity or separately",
      "Blowgun: poisoned darts 200 yards range",
      "Resistant to cold and fire",
      "Ball game mastery: any athletic contest +4",
      "Underworld knowledge: +4 vs undead"
    ],
    personality: "Two as one. Playful but deadly serious about their divine mission.",
    category: "heroes"
  }
]

export const FALLBACK_DEMIGODS: FallbackEntity[] = [
  {
    id: "karttikeya",
    name: "Karttikeya",
    pantheon: "Indian",
    type: "demigod",
    AC: -8,
    HP: 222,
    align: "Chaotic good",
    abilities: [
      "10 sword attacks/round each 2-12+14",
      "Created to fight devils: +4 all rolls vs devils/demons",
      "50% MR",
      "Rides giant peacock (AC2, HP120, MV24\")",
      "2%/round chance of divine miracle"
    ],
    personality: "Pure engine of righteous war. No deliberation. No mercy for evil.",
    category: "demigods"
  },
  {
    id: "yama",
    name: "Yama",
    pantheon: "Indian",
    type: "demigod",
    AC: -1,
    HP: 229,
    align: "Lawful neutral",
    abilities: [
      "+5 magical noose: any struck creature ensnared 3 rounds no save",
      "Armor of Etherealness: immune heat/cold/light, cannot be surprised",
      "Knows full life record of any being he looks upon",
      "20th level MU spells",
      "100% MR in red robes (25% otherwise)"
    ],
    personality: "Utterly impartial. Not cruel - just inevitable. He has seen your ending already.",
    category: "demigods"
  },
  {
    id: "ratri",
    name: "Ratri",
    pantheon: "Indian",
    type: "demigod",
    AC: -2,
    HP: 250,
    align: "Neutral evil",
    abilities: [
      "Darkness 30ft radius no save",
      "Shadow permanently blinds on touch (save at -4)",
      "Cloak teleports wearer to Ethereal plane",
      "25% MR",
      "15th assassin: backstab x5"
    ],
    personality: "Night goddess. Seductive, dangerous, plays with victims like a cat.",
    category: "demigods"
  },
  {
    id: "tvashtri",
    name: "Tvashtri",
    pantheon: "Indian",
    type: "demigod",
    AC: -3,
    HP: 227,
    align: "Neutral",
    abilities: [
      "Black beams 4-40 damage never miss 3/round",
      "Nullifies all magic items within 200ft radius",
      "Regenerates 20 HP/round",
      "65% MR",
      "20th MU/15th cleric"
    ],
    personality: "The divine artificer. Precise, cold, creative. Dislikes waste of any kind.",
    category: "demigods"
  },
  {
    id: "hachiman",
    name: "Hachiman",
    pantheon: "Japanese",
    type: "demigod",
    AC: -2,
    HP: 220,
    align: "Neutral good",
    abilities: [
      "War blessing: all allies +1 to hit and saves",
      "35% MR",
      "STR 25: +7 hit +14 damage",
      "Warrior's instinct: never surprised in combat",
      "Banner presence: all within 60ft immune to fear"
    ],
    personality: "God of war AND peace. Values worthy combat. Loathes meaningless slaughter.",
    category: "demigods"
  },
  {
    id: "oh_kuni_nushi",
    name: "Oh-Kuni-Nushi",
    pantheon: "Japanese",
    type: "demigod",
    AC: -4,
    HP: 200,
    align: "Neutral good",
    abilities: [
      "Earth speaks to him: knows all that occurs on the ground",
      "Heals any wound by touch (unlimited)",
      "20% MR",
      "Commands all earthen creatures",
      "Sake blessing: those he drinks with gain +2 all rolls next day"
    ],
    personality: "Warm, accessible god of the earth. Genuinely cares about mortals.",
    category: "demigods"
  },
  {
    id: "surma",
    name: "Surma",
    pantheon: "Finnish",
    type: "demigod",
    AC: -2,
    HP: 224,
    align: "Neutral evil",
    abilities: [
      "Club of disenchantment: any magic item struck must save or nullified",
      "Requires +1 or better weapon to hit",
      "Challenges all living beings he encounters",
      "40% MR",
      "15th ranger/15th assassin: backstab x5"
    ],
    personality: "He challenges everyone. He is the test the universe places before heroes.",
    category: "demigods"
  },
  {
    id: "loviatar",
    name: "Loviatar",
    pantheon: "Finnish",
    type: "demigod",
    AC: 2,
    HP: 227,
    align: "Neutral evil",
    abilities: [
      "Ice dagger makes her immune to all magic (as long as held)",
      "Attackers must save or relive their worst pain memory (-4 all rolls 2 rounds)",
      "25% MR",
      "12th cleric/15th illusionist",
      "Nine daughters serve her (each 8HD)"
    ],
    personality: "Goddess of pain. Cold, clinical, curious about suffering. Never angry.",
    category: "demigods"
  },
  {
    id: "kiputytto",
    name: "Kiputytto",
    pantheon: "Finnish",
    type: "demigod",
    AC: 0,
    HP: 220,
    align: "Neutral evil",
    abilities: [
      "Disease touch: save or contract plague",
      "Cause wounds by touch: 4-24 damage",
      "35% MR",
      "Plague aura: all within 10ft save or -2 CON"
    ],
    personality: "Goddess of disease. Spreads suffering methodically. Unhurried.",
    category: "demigods"
  },
  {
    id: "aarth",
    name: "Aarth",
    pantheon: "Melnibonean",
    type: "demigod",
    AC: -2,
    HP: 190,
    align: "Chaotic good",
    abilities: [
      "Sword of truth: cuts through any illusion",
      "Can detect lies automatically",
      "30% MR",
      "Justice strike: double damage to evil creatures"
    ],
    personality: "Champion of justice in a chaotic multiverse. Trusts actions over words.",
    category: "demigods"
  },
  {
    id: "issek_of_jug",
    name: "Issek of the Jug",
    pantheon: "Nehwon",
    type: "demigod",
    AC: 5,
    HP: 175,
    align: "Lawful neutral",
    abilities: [
      "Divine patience: immune to frustration and confusion",
      "Healing touch: 1d8+5 HP restored",
      "Turn undead as 12th level cleric",
      "Devotees gain +2 on all saves"
    ],
    personality: "Quiet, persistent, patient. Violence is a last resort.",
    category: "demigods"
  },
  {
    id: "spider_god",
    name: "Spider God",
    pantheon: "Nehwon",
    type: "demigod",
    AC: -1,
    HP: 210,
    align: "Chaotic evil",
    abilities: [
      "Web attack: restrain victims no save",
      "Poison bite: save or die",
      "Wall walking",
      "15% MR",
      "Can summon 2d6 giant spiders"
    ],
    personality: "Patient predator. Plays with prey. Unreadable motives.",
    category: "demigods"
  },
  {
    id: "votishal",
    name: "Votishal",
    pantheon: "Nehwon",
    type: "demigod",
    AC: 1,
    HP: 180,
    align: "Neutral evil",
    abilities: [
      "Shadow form: 50% miss chance",
      "Life drain: 2d8 HP per hit",
      "Teleport at will",
      "20% MR"
    ],
    personality: "Ancient, hungry, patient. Waits for the right moment.",
    category: "demigods"
  },
  {
    id: "gods_of_lankhmar",
    name: "Gods of Lankhmar",
    pantheon: "Nehwon",
    type: "demigod",
    AC: -3,
    HP: 240,
    align: "Neutral",
    abilities: [
      "Collective worship: power increases with followers",
      "Can grant divine spells to priests",
      "Each death god has unique domain",
      "Cannot directly intervene in mortal affairs"
    ],
    personality: "Many voices, one purpose. The city's fate is their fate.",
    category: "demigods"
  },
  {
    id: "apshai",
    name: "Apshai",
    pantheon: "Babylonian",
    type: "demigod",
    AC: 0,
    HP: 200,
    align: "Chaotic evil",
    abilities: [
      "Swarm form: can become millions of insects",
      "Poison stingers: save or paralyzed 1d6 rounds",
      "Cannot be harmed by non-magical weapons",
      "Underground sense: knows all tunnels"
    ],
    personality: "Ancient hunger. Wants only to consume. No reasoning with the swarm.",
    category: "demigods"
  },
  {
    id: "ithaqua",
    name: "Ithaqua",
    pantheon: "Cthulhu",
    type: "demigod",
    AC: -1,
    HP: 260,
    align: "Chaotic evil",
    abilities: [
      "Wind walker: flies at will, controls winds",
      "Cold aura: 3d6 cold damage per round in 30ft",
      "Takes double damage from fire",
      "Can teleport through air",
      "Those killed rise as wind-walking servants"
    ],
    personality: "The wind walker. Hungers for warm flesh. Stalks the north.",
    category: "demigods"
  },
  {
    id: "chao_kung_ming",
    name: "Chao Kung Ming",
    pantheon: "Chinese",
    type: "demigod",
    AC: -2,
    HP: 210,
    align: "Lawful neutral",
    abilities: [
      "Magic whip: +5 weapon, cannot be disarmed",
      "Immune to all enchantments",
      "Can identify any magic item by touch",
      "Commands celestial soldiers (1d4/turn)"
    ],
    personality: "Divine general. Expects discipline. Rewards loyalty with power.",
    category: "demigods"
  },
  {
    id: "chih_chiang_fyu_ya",
    name: "Chih Chiang Fyu Ya",
    pantheon: "Chinese",
    type: "demigod",
    AC: -4,
    HP: 230,
    align: "Lawful good",
    abilities: [
      "Arrow of truth: never misses, always hits vital spot",
      "Can shoot the moon down (1/day, massive effect)",
      "Immune to charm and fear",
      "Allies gain +2 to hit with missile weapons"
    ],
    personality: "Divine archer. Patient, precise, devastating when he acts.",
    category: "demigods"
  },
  {
    id: "no_cha",
    name: "No Cha",
    pantheon: "Chinese",
    type: "demigod",
    AC: -3,
    HP: 215,
    align: "Chaotic good",
    abilities: [
      "Fire wheels: fly at will, fire damage",
      "Six-arm fighting: 6 attacks per round",
      "Pearl of light: reveals all hidden things",
      "Immortal: cannot be permanently killed"
    ],
    personality: "Rebellious child-god. Fights authority. Powerful beyond reason.",
    category: "demigods"
  },
  {
    id: "wen_chung",
    name: "Wen Chung",
    pantheon: "Chinese",
    type: "demigod",
    AC: 0,
    HP: 195,
    align: "Lawful neutral",
    abilities: [
      "Thunder magic: 6d6 lightning damage",
      "Weather control: storms at will",
      "Can summon 1d4 thunder spirits",
      "Knows all official decrees of heaven"
    ],
    personality: "Divine bureaucrat. Follows protocol. Punishes disorder.",
    category: "demigods"
  },
  {
    id: "fei_lien",
    name: "Fei Lien",
    pantheon: "Chinese",
    type: "demigod",
    AC: 1,
    HP: 185,
    align: "Chaotic neutral",
    abilities: [
      "Wind mastery: controls all air movement",
      "Flying: perfect maneuverability",
      "Whirlwind: traps enemies for 1d4 rounds",
      "Cannot be pinned or restrained"
    ],
    personality: "Mercurial, flighty, dangerous. Changes mood like the wind.",
    category: "demigods"
  },
  {
    id: "fileet",
    name: "Fileet",
    pantheon: "Nehwon",
    type: "demigod",
    AC: 2,
    HP: 165,
    align: "Chaotic neutral",
    abilities: [
      "Cat form: perfect stealth, night vision",
      "Nine lives: can cheat death 9 times",
      "Whisker sense: detects invisible creatures",
      "Always lands on feet: immune to fall damage"
    ],
    personality: "The cat-god. Curious, playful, lethal. Sides with whoever amuses them.",
    category: "demigods"
  },
  {
    id: "haaashastaak",
    name: "Haaashastaak",
    pantheon: "Nonhuman",
    type: "demigod",
    AC: -1,
    HP: 250,
    align: "Lawful evil",
    abilities: [
      "Lizard king: commands all reptiles",
      "Regeneration: 5 HP per round",
      "Poison bite: save or die",
      "Cannot be surprised in swamps"
    ],
    personality: "Ancient reptile god. Cold. Patient. The swamp belongs to him.",
    category: "demigods"
  },
  {
    id: "meerclar",
    name: "Meerclar",
    pantheon: "Nonhuman",
    type: "demigod",
    AC: -2,
    HP: 220,
    align: "Chaotic good",
    abilities: [
      "Cat lord: all felines obey",
      "Nine lives: resurrect 9 times",
      "Shadow jump: teleport through darkness",
      "Enhanced senses: nothing escapes notice"
    ],
    personality: "Lord of cats. Aloof but protective of felines. Respects independence.",
    category: "demigods"
  },
  {
    id: "nnuuurrrrc",
    name: "Nnuuurrrr'c",
    pantheon: "Nonhuman",
    type: "demigod",
    AC: -3,
    HP: 240,
    align: "Chaotic evil",
    abilities: [
      "Mind blast: 4d6 psychic damage, save or stunned",
      "Tentacle embrace: 8 attacks per round",
      "Amorphous: can fit through any opening",
      "Telepathy: knows your fears"
    ],
    personality: "The thing that should not be. Alien. Hungry. Patient beyond comprehension.",
    category: "demigods"
  },
  {
    id: "vaprak",
    name: "Vaprak",
    pantheon: "Nonhuman",
    type: "demigod",
    AC: 0,
    HP: 210,
    align: "Chaotic evil",
    abilities: [
      "Troll regeneration: 6 HP per round, only fire stops it",
      "Rend: claw attacks do double damage",
      "Stench: -2 to all within 10ft",
      "Cannot be killed by dismemberment"
    ],
    personality: "Father of trolls. Hungry. Always hungry. Eats anything that moves.",
    category: "demigods"
  },
  {
    id: "laogzed",
    name: "Laogzed",
    pantheon: "Nonhuman",
    type: "demigod",
    AC: 1,
    HP: 200,
    align: "Chaotic evil",
    abilities: [
      "Acid saliva: 3d6 acid damage",
      "Devour: swallow whole creatures smaller than large",
      "Poison skin: contact deals 2d6 damage",
      "Amphibious: fights equally on land or water"
    ],
    personality: "The troglodyte god. Sees all as food. Breeds chaos.",
    category: "demigods"
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN HEROES - Dragonlance characters integrated into mythos
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_HEROES_FALLBACK: FallbackEntity[] = [
  {
    id: "tanis_half_elven",
    name: "Tanis Half-Elven",
    pantheon: "Krynn",
    type: "hero",
    AC: 3,
    HP: 90,
    align: "Neutral good",
    abilities: [
      "Half-elven sight: infravision 60ft, surprised only on 1 in 10",
      "Ranger tracking: 75% in wilderness",
      "Leadership under pressure: allies +1 saves when Tanis commands",
      "Dragonlance proficiency: +3 to hit and damage vs. dragons"
    ],
    personality: "He is the man who does not know what he is — half of everything, whole of nothing. He leads because no one else will, and hates himself for being good at it.",
    category: "heroes"
  },
  {
    id: "sturm_brightblade",
    name: "Sturm Brightblade",
    pantheon: "Krynn",
    type: "hero",
    AC: -2,
    HP: 105,
    align: "Lawful good",
    abilities: [
      "Brightblade: +2 ancestral sword, +4 vs. chaotic evil beings",
      "Honor aura: cannot be charmed, cannot lie — ever",
      "Knightly resolve: immune to fear at all times",
      "STR 19: +3 to hit +6 damage"
    ],
    personality: "A knight from a time when knights meant something. He follows a code that the world has stopped believing in, and follows it anyway.",
    category: "heroes"
  },
  {
    id: "raistlin_majere_hero",
    name: "Raistlin Majere",
    pantheon: "Krynn",
    type: "hero",
    AC: 10,
    HP: 28,
    align: "Neutral evil",
    abilities: [
      "Hourglass eyes: sees all living things as they will appear in death",
      "Staff of Magius: +3, light/darkness at will, spells stored",
      "35% MR — gift and curse of the Test",
      "Spell mastery: casts all spells at +2 levels of effectiveness"
    ],
    personality: "He was broken on purpose, and he accepted the breaking. His eyes see time as a wound that never closes.",
    category: "heroes"
  },
  {
    id: "caramon_majere",
    name: "Caramon Majere",
    pantheon: "Krynn",
    type: "hero",
    AC: 1,
    HP: 130,
    align: "Lawful good",
    abilities: [
      "STR 20: +3 to hit +8 damage",
      "Twin bond: +2 all rolls when Raistlin is within 30ft",
      "Bodyguard instinct: auto-intercepts attacks targeting Raistlin",
      "Gladiatorial training: extra attack/round"
    ],
    personality: "He is the strongest man in the room in every room he enters. He loves without condition or strategy or self-preservation.",
    category: "heroes"
  },
  {
    id: "goldmoon",
    name: "Goldmoon",
    pantheon: "Krynn",
    type: "hero",
    AC: 2,
    HP: 85,
    align: "Lawful good",
    abilities: [
      "Blue Crystal Staff: heals 2-12 HP/touch, destroys undead",
      "First true cleric: restores lost limbs, cures magical diseases",
      "Mishakal's blessing: 3/day call for divine intervention",
      "Turn undead as 16th level cleric"
    ],
    personality: "She walked across a world that had forgotten the gods and proved they still answered prayers.",
    category: "heroes"
  },
  {
    id: "riverwind",
    name: "Riverwind",
    pantheon: "Krynn",
    type: "hero",
    AC: 2,
    HP: 110,
    align: "Neutral good",
    abilities: [
      "STR 19: +3 to hit +7 damage",
      "Plainsman tracking: 90% any terrain, never lost outdoors",
      "Longbow mastery: 3 attacks/round with bow, +2 to hit",
      "Protective rage: +4 all combat rolls when Goldmoon threatened"
    ],
    personality: "He ran the length of a continent to prove himself worthy and found gods instead.",
    category: "heroes"
  },
  {
    id: "laurana",
    name: "Laurana",
    pantheon: "Krynn",
    type: "hero",
    AC: 0,
    HP: 88,
    align: "Lawful good",
    abilities: [
      "Dragonlance mastery: +3 to hit dragons, ignores dragon AC",
      "Elven grace: DEX 20, +4 AC bonus, never surprised",
      "Golden General: troop morale never breaks under her leadership",
      "Immune to dragon fear aura"
    ],
    personality: "She left home a princess and came back a general who had changed the course of a war.",
    category: "heroes"
  },
  {
    id: "kitiara_uth_matar",
    name: "Kitiara Uth Matar",
    pantheon: "Krynn",
    type: "hero",
    AC: -2,
    HP: 112,
    align: "Neutral evil",
    abilities: [
      "Dragon Highlord command: blue dragons obey without question",
      "Skie bond: +2 all combat rolls when mounted on her dragon",
      "Ambition made manifest: immune to intimidation, charm, fear",
      "Sword mastery: 3 attacks/round"
    ],
    personality: "She wants power the way some people want air. She is brilliant enough to get it.",
    category: "heroes"
  },
  {
    id: "flint_fireforge",
    name: "Flint Fireforge",
    pantheon: "Krynn",
    type: "hero",
    AC: 1,
    HP: 95,
    align: "Lawful good",
    abilities: [
      "STR 19: +3 to hit +8 damage",
      "Master smith: identifies any metal object by touch",
      "Dwarven resilience: immune to poison, +4 saves vs. magic",
      "Battle axe +3: returns when thrown"
    ],
    personality: "He is old and he knows it and has decided that old means experienced rather than diminished.",
    category: "heroes"
  },
  {
    id: "tasslehoff_burrfoot",
    name: "Tasslehoff Burrfoot",
    pantheon: "Krynn",
    type: "hero",
    AC: 4,
    HP: 52,
    align: "Chaotic good",
    abilities: [
      "Kender fearlessness: literally cannot feel fear — immune to ALL fear effects",
      "Hoopak: staff-sling, 1-6 melee or ranged",
      "Handling: objects migrate to his pouches automatically",
      "25% MR — kender are inherently resistant to mind magic"
    ],
    personality: "He is the most dangerous creature on Krynn because he has no fear and therefore no sense of scale.",
    category: "heroes"
  },
  {
    id: "tika_waylan",
    name: "Tika Waylan",
    pantheon: "Krynn",
    type: "hero",
    AC: 3,
    HP: 78,
    align: "Neutral good",
    abilities: [
      "Skillet proficiency: 1-8 damage, +2 vs surprised opponents",
      "Barmaid's eye: reads social dynamics, never surprised by betrayal",
      "Common courage: allies within 30ft +1 morale",
      "Loves Caramon: +3 all rolls when he is threatened"
    ],
    personality: "She was a barmaid and became a hero by refusing the alternative when it was put in front of her.",
    category: "heroes"
  },
  {
    id: "gilthanas",
    name: "Gilthanas",
    pantheon: "Krynn",
    type: "hero",
    AC: 1,
    HP: 72,
    align: "Chaotic good",
    abilities: [
      "Elven senses: infravision 60ft, 4 in 6 detect secret doors",
      "Elven bow mastery: +3 to hit, double range",
      "Silvara bond: +2 all rolls near silver dragons",
      "Elven magic: 4th level MU spells"
    ],
    personality: "An elf prince discovering what his arrogance cost everyone, trying to settle the debt ever since.",
    category: "heroes"
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN DEMIGODS - Dragonlance demigods integrated into mythos
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_DEMIGODS_FALLBACK: FallbackEntity[] = [
  {
    id: "fizban",
    name: "Fizban the Fabulous",
    pantheon: "Krynn",
    type: "demigod",
    AC: -8,
    HP: 350,
    align: "Lawful good",
    abilities: [
      "Paladine's aspect: true form is Greater God",
      "Forgetfulness as weapon: 20% chance attacks on him fail to occur",
      "All arcane magic at will",
      "95% MR"
    ],
    personality: "A god wearing a fool's costume. He forgets things. He misplaces spells. And his eyes miss absolutely nothing.",
    category: "demigods"
  },
  {
    id: "lord_soth",
    name: "Lord Soth",
    pantheon: "Krynn",
    type: "demigod",
    AC: -8,
    HP: 300,
    align: "Lawful evil",
    abilities: [
      "Level drain: each hit drains 1d2 levels permanently",
      "Death wail: all within 60ft save vs. death or paralyzed 1d6 rounds",
      "Impervious to non-magical weapons",
      "85% MR"
    ],
    personality: "He could have stopped a war. He chose not to. This is the architecture of his damnation.",
    category: "demigods"
  },
  {
    id: "huma_dragonbane",
    name: "Huma Dragonbane",
    pantheon: "Krynn",
    type: "demigod",
    AC: -4,
    HP: 220,
    align: "Lawful good",
    abilities: [
      "Dragonlance +5: destroys dragons on critical hit",
      "Paladin of Paladine: all good divine spells available",
      "Dragon fear immunity: absolute",
      "Inspiration: Solamnic Knights within 60ft fight at +3 all rolls"
    ],
    personality: "He rode a silver dragon into a battle he knew he would not survive and ended a war.",
    category: "demigods"
  },
  {
    id: "cyan_bloodbane",
    name: "Cyan Bloodbane",
    pantheon: "Krynn",
    type: "demigod",
    AC: -5,
    HP: 280,
    align: "Lawful evil",
    abilities: [
      "Chlorine gas breath: 50ft cone, 14d10 damage",
      "Dream poison: hits cause waking nightmare (-4 all rolls)",
      "Telepathic nightmare: range 1 mile",
      "55% MR"
    ],
    personality: "The most intelligent dragon on Krynn. He destroyed a king with dreams rather than fire.",
    category: "demigods"
  },
  {
    id: "fistandantilus",
    name: "Fistandantilus",
    pantheon: "Krynn",
    type: "demigod",
    AC: -6,
    HP: 260,
    align: "Neutral evil",
    abilities: [
      "Soul drain: on hit, drains 1d4 years of life",
      "Bloodstone phylactery: cannot die while it exists",
      "All magic at will: 30th level MU",
      "80% MR"
    ],
    personality: "He has been alive long enough that he has stopped thinking of other people as people.",
    category: "demigods"
  },
  {
    id: "raistlin_majere_demigod",
    name: "Raistlin Majere (Ascended)",
    pantheon: "Krynn",
    type: "demigod",
    AC: -4,
    HP: 180,
    align: "Neutral evil",
    abilities: [
      "Time stop at will — 1/round",
      "Absorbs spells cast at him: redirects within 2 rounds",
      "75% MR — absorbed Fistandantilus's power",
      "Sees through all illusions and divine masks"
    ],
    personality: "He became what he always said he would. Somewhere inside all that power is still a boy who was told he was not enough.",
    category: "demigods"
  }
]

// Fisher-Yates shuffle for truly random selection
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Get random heroes for party selection - truly randomized from ALL heroes and demigods (including Krynn)
export function getRandomHeroes(count: number = 12): FallbackEntity[] {
  const all = [...FALLBACK_HEROES, ...FALLBACK_DEMIGODS, ...KRYNN_HEROES_FALLBACK, ...KRYNN_DEMIGODS_FALLBACK]
  const shuffled = shuffleArray(all)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Get all unique hero IDs (for exclusion) - includes Krynn
export function getAllHeroIds(): string[] {
  return [...FALLBACK_HEROES, ...FALLBACK_DEMIGODS, ...KRYNN_HEROES_FALLBACK, ...KRYNN_DEMIGODS_FALLBACK].map(h => h.id)
}

// Get greater gods (HP >= 300) from fallback - for antagonist selection
export function getGreaterGods(): FallbackEntity[] {
  return [...FALLBACK_HEROES, ...FALLBACK_DEMIGODS].filter(e => e.HP >= 300)
}
