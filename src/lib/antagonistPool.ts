// Antagonist Pool - Greater Gods + Super Monsters
// Randomly selected at campaign start, identity hidden until Act III
// Includes entities from DDG 1st Edition and Krynn

import { GREATER_GODS } from './characterData'
import { MONSTERS } from './characterData'
import { KRYNN_DEMIGODS } from './krynnCharacters'

// Antagonist types
export type AntagonistType = 'greater_god' | 'monster'

export interface AntagonistCandidate {
  id: string
  name: string
  title: string
  pantheon: string
  type: AntagonistType
  hp: number
  AC: number
  MR: number
  align: string
  domain?: string
  abilities?: string[]
  phase1?: string
  phase2?: string
  phase3?: string
  personality?: string
  symbol?: string
}

// Greater Gods eligible as antagonists (all Greater Gods qualify)
const GREATER_GOD_ANTAGONISTS: AntagonistCandidate[] = [
  // Greek Pantheon
  { id: 'zeus', name: 'Zeus', title: 'Lord of Olympus', pantheon: 'Greek', type: 'greater_god', hp: 400, AC: -5, MR: 95, align: 'Chaotic neutral', domain: 'sky, thunder, kingship', symbol: 'lightning bolt, eagle, bull' },
  { id: 'hera', name: 'Hera', title: 'Queen of the Gods', pantheon: 'Greek', type: 'greater_god', hp: 300, AC: 2, MR: 50, align: 'Neutral', domain: 'marriage, women, sovereignty', symbol: 'peacock, cow, pomegranate' },
  { id: 'athena', name: 'Athena', title: 'Goddess of Wisdom', pantheon: 'Greek', type: 'greater_god', hp: 329, AC: -2, MR: 80, align: 'Lawful good', domain: 'wisdom, war, crafts, justice', symbol: 'owl, olive tree, aegis, spear' },
  { id: 'ares', name: 'Ares', title: 'God of War', pantheon: 'Greek', type: 'greater_god', hp: 333, AC: -2, MR: 59, align: 'Chaotic evil', domain: 'war, violence, courage', symbol: 'spear, helmet, vultures, dog' },
  { id: 'apollo', name: 'Apollo', title: 'God of Light and Truth', pantheon: 'Greek', type: 'greater_god', hp: 390, AC: -2, MR: 70, align: 'Neutral good', domain: 'light, truth, prophecy, music', symbol: 'lyre, laurel, sun chariot, raven' },
  { id: 'poseidon', name: 'Poseidon', title: 'Earth-Shaker', pantheon: 'Greek', type: 'greater_god', hp: 390, AC: 3, MR: 75, align: 'Chaotic neutral', domain: 'sea, earthquakes, horses', symbol: 'trident, dolphin, horse, bull' },
  { id: 'hades', name: 'Hades', title: 'Lord of the Underworld', pantheon: 'Greek', type: 'greater_god', hp: 400, AC: -4, MR: 80, align: 'Lawful evil', domain: 'underworld, death, wealth', symbol: 'helm of darkness, bident, pomegranate' },
  { id: 'hermes', name: 'Hermes', title: 'Messenger of the Gods', pantheon: 'Greek', type: 'greater_god', hp: 340, AC: 2, MR: 35, align: 'Neutral', domain: 'travel, commerce, thieves, messengers', symbol: 'caduceus, winged sandals' },
  { id: 'aphrodite', name: 'Aphrodite', title: 'Goddess of Love', pantheon: 'Greek', type: 'greater_god', hp: 350, AC: 0, MR: 60, align: 'Neutral good', domain: 'love, beauty, desire', symbol: 'dove, rose, swan, myrtle' },
  
  // Norse Pantheon
  { id: 'odin', name: 'Odin', title: 'All-Father', pantheon: 'Norse', type: 'greater_god', hp: 400, AC: -6, MR: 85, align: 'Neutral good', domain: 'wisdom, death, magic, war', symbol: 'ravens, wolves, eight-legged horse, one eye' },
  { id: 'thor', name: 'Thor', title: 'God of Thunder', pantheon: 'Norse', type: 'greater_god', hp: 399, AC: 4, MR: 80, align: 'Chaotic good', domain: 'thunder, strength, protection', symbol: 'hammer, goats, lightning' },
  { id: 'loki', name: 'Loki', title: 'Father of Monsters', pantheon: 'Norse', type: 'greater_god', hp: 300, AC: -4, MR: 75, align: 'Chaotic evil', domain: 'chaos, trickery, fire', symbol: 'snake, mistletoe, masks' },
  { id: 'hel', name: 'Hel', title: 'Goddess of the Dishonored Dead', pantheon: 'Norse', type: 'greater_god', hp: 350, AC: -5, MR: 95, align: 'Neutral evil', domain: 'death, disease, cold', symbol: 'half-living face, dishonored dead' },
  { id: 'freya', name: 'Freya', title: 'Goddess of Love and War', pantheon: 'Norse', type: 'greater_god', hp: 339, AC: -3, MR: 80, align: 'Neutral good', domain: 'love, war, beauty, death', symbol: 'necklace, falcon cloak, cats' },
  { id: 'tyr', name: 'Tyr', title: 'God of Law and Justice', pantheon: 'Norse', type: 'greater_god', hp: 380, AC: -5, MR: 25, align: 'Lawful good', domain: 'law, justice, war, sacrifice', symbol: 'severed hand, sword, scales' },
  { id: 'balder', name: 'Balder', title: 'The Beautiful', pantheon: 'Norse', type: 'greater_god', hp: 388, AC: -4, MR: 75, align: 'Neutral good', domain: 'light, beauty, joy, purity', symbol: 'mistletoe, light, white flowers' },
  
  // Egyptian Pantheon
  { id: 'ra', name: 'Ra', title: 'Sun God', pantheon: 'Egyptian', type: 'greater_god', hp: 400, AC: -2, MR: 95, align: 'Lawful good', domain: 'sun, creation, kingship', symbol: 'sun disk, falcon, obelisk, scarab' },
  { id: 'osiris', name: 'Osiris', title: 'Lord of the Dead', pantheon: 'Egyptian', type: 'greater_god', hp: 400, AC: -4, MR: 80, align: 'Lawful good', domain: 'death, rebirth, fertility, justice', symbol: 'crook and flail, djed pillar' },
  { id: 'isis', name: 'Isis', title: 'Mother of Magic', pantheon: 'Egyptian', type: 'greater_god', hp: 350, AC: -2, MR: 75, align: 'Lawful good', domain: 'magic, motherhood, fertility, protection', symbol: 'throne, kite, sycamore' },
  { id: 'set', name: 'Set', title: 'The Red Lord', pantheon: 'Egyptian', type: 'greater_god', hp: 378, AC: -4, MR: 59, align: 'Lawful evil', domain: 'chaos, desert, storms, evil', symbol: 'set animal, was scepter, red hair' },
  { id: 'thoth', name: 'Thoth', title: 'God of Knowledge', pantheon: 'Egyptian', type: 'greater_god', hp: 389, AC: -4, MR: 98, align: 'Neutral', domain: 'knowledge, writing, magic, moon', symbol: 'ibis, baboon, writing palette, moon disk' },
  { id: 'ptah', name: 'Ptah', title: 'Creator God', pantheon: 'Egyptian', type: 'greater_god', hp: 390, AC: -4, MR: 70, align: 'Lawful neutral', domain: 'creation, craftsmen, architects, truth', symbol: 'djed pillar, bull, mummiform' },
  
  // Indian Pantheon
  { id: 'shiva', name: 'Shiva', title: 'The Destroyer', pantheon: 'Indian', type: 'greater_god', hp: 450, AC: -10, MR: 90, align: 'Neutral', domain: 'destruction, transformation, meditation', symbol: 'third eye, trident, bull, moon, lingam' },
  { id: 'vishnu', name: 'Vishnu', title: 'The Preserver', pantheon: 'Indian', type: 'greater_god', hp: 389, AC: -5, MR: 85, align: 'Lawful good', domain: 'preservation, order, righteousness', symbol: 'conch, discus, mace, lotus, eagle' },
  { id: 'indra', name: 'Indra', title: 'King of the Gods', pantheon: 'Indian', type: 'greater_god', hp: 400, AC: -12, MR: 80, align: 'Chaotic neutral', domain: 'thunder, rain, war, kingship', symbol: 'vajra, elephant, thunderbolt, rainbow' },
  { id: 'rudra', name: 'Rudra', title: 'The Howler', pantheon: 'Indian', type: 'greater_god', hp: 344, AC: -2, MR: 25, align: 'Lawful neutral', domain: 'storm, disease, healing, hunt', symbol: 'bow, arrow, storm, deer' },
  
  // Celtic Pantheon
  { id: 'dagda', name: 'The Dagda', title: 'Good God', pantheon: 'Celtic', type: 'greater_god', hp: 400, AC: -4, MR: 80, align: 'Neutral', domain: 'fertility, seasons, magic, protection', symbol: 'cauldron, club, harp, wheel' },
  { id: 'lugh', name: 'Lugh', title: 'The Many-Skilled', pantheon: 'Celtic', type: 'greater_god', hp: 375, AC: 0, MR: 90, align: 'Neutral', domain: 'skills, crafts, light, oaths', symbol: 'spear, sling, raven, hound' },
  { id: 'silvanus', name: 'Silvanus', title: 'Wild Lord of Nature', pantheon: 'Celtic', type: 'greater_god', hp: 333, AC: -4, MR: 30, align: 'Neutral', domain: 'wild nature, forests, animals', symbol: 'wolfhound, tree, club, wild man' },
  
  // Central American Pantheon
  { id: 'quetzalcoatl', name: 'Quetzalcoatl', title: 'The Feathered Serpent', pantheon: 'Central American', type: 'greater_god', hp: 400, AC: -8, MR: 90, align: 'Neutral good', domain: 'wind, wisdom, dawn, civilization', symbol: 'feathered serpent, morning star, quetzal bird' },
  { id: 'tezcatlipoca', name: 'Tezcatlipoca', title: 'Smoking Mirror', pantheon: 'Central American', type: 'greater_god', hp: 400, AC: -6, MR: 85, align: 'Chaotic evil', domain: 'night, sorcery, fate, jaguars', symbol: 'obsidian mirror, jaguar, smoking mirror' },
  { id: 'tlaloc', name: 'Tlaloc', title: 'God of Rain', pantheon: 'Central American', type: 'greater_god', hp: 400, AC: -4, MR: 65, align: 'Neutral', domain: 'rain, lightning, agriculture, drought', symbol: 'goggle eyes, fangs, water jug, lightning' },
  
  // Finnish Pantheon
  { id: 'ukko', name: 'Ukko', title: 'Sky Father', pantheon: 'Finnish', type: 'greater_god', hp: 400, AC: -2, MR: 85, align: 'Lawful good', domain: 'sky, thunder, weather, harvest', symbol: 'hammer, sword, cloud, eagle' },
  { id: 'ahto', name: 'Ahto', title: 'Sea King', pantheon: 'Finnish', type: 'greater_god', hp: 324, AC: 2, MR: 100, align: 'Neutral good', domain: 'sea, fish, wisdom, healing', symbol: 'sickle, water, fish, reed' },
  
  // Japanese Pantheon
  { id: 'amaterasu', name: 'Amaterasu', title: 'Sun Goddess', pantheon: 'Japanese', type: 'greater_god', hp: 400, AC: -2, MR: 85, align: 'Lawful good', domain: 'sun, light, truth, rulership', symbol: 'mirror, sun, rooster, weaving' },
  { id: 'izanagi', name: 'Izanagi', title: 'Father Creator', pantheon: 'Japanese', type: 'greater_god', hp: 375, AC: -3, MR: 70, align: 'Lawful good', domain: 'creation, life, death, purification', symbol: 'spear, jewels, death, birth' },
  
  // Babylonian Pantheon
  { id: 'marduk', name: 'Marduk', title: 'King of the Gods', pantheon: 'Babylonian', type: 'greater_god', hp: 350, AC: 1, MR: 50, align: 'Lawful neutral', domain: 'kingship, order, storms, wisdom', symbol: 'mušḫuššu, spear, net, tablet of destinies' },
  
  // Nehwon Pantheon
  { id: 'kos', name: 'Kos', title: 'God of Battle', pantheon: 'Nehwon', type: 'greater_god', hp: 377, AC: -4, MR: 35, align: 'Neutral', domain: 'battle, courage, judgment', symbol: 'broadsword, shield, blood, crown' },
  { id: 'death_nehwon', name: 'Death', title: 'The End of All Things', pantheon: 'Nehwon', type: 'greater_god', hp: 350, AC: -5, MR: 95, align: 'Neutral', domain: 'death, endings, inevitability', symbol: 'scythe, hourglass, skull, black robe' },
  
  // Nonhuman Pantheon
  { id: 'moradin', name: 'Moradin', title: 'Soul Forger', pantheon: 'Nonhuman', type: 'greater_god', hp: 400, AC: -7, MR: 80, align: 'Lawful good', domain: 'forge, creation, protection, dwarves', symbol: 'hammer, anvil, forge, ale' },
  { id: 'corellon', name: 'Corellon Larethian', title: 'Creator of the Elves', pantheon: 'Nonhuman', type: 'greater_god', hp: 400, AC: -5, MR: 90, align: 'Chaotic good', domain: 'art, magic, music, elves', symbol: 'longbow, crescent moon, star, harp' },
  { id: 'gruumsh', name: 'Gruumsh', title: 'One-Eyed God', pantheon: 'Nonhuman', type: 'greater_god', hp: 350, AC: -3, MR: 75, align: 'Lawful evil', domain: 'war, conquest, orcs, hatred', symbol: 'spear, one eye, blood, flame' },
  
  // Melnibonéan Pantheon
  { id: 'arioch', name: 'Arioch', title: 'Lord of the Seven Darks', pantheon: 'Melnibonéan', type: 'greater_god', hp: 350, AC: -3, MR: 70, align: 'Chaotic evil', domain: 'chaos, contracts, vengeance', symbol: 'chaos star, eight arrows, black sword' },
  
  // Cthulhu Mythos
  { id: 'cthulhu', name: 'Cthulhu', title: 'The Dreamer in R\'lyeh', pantheon: 'Cthulhu', type: 'greater_god', hp: 400, AC: -6, MR: 85, align: 'Chaotic evil', domain: 'dreams, madness, the deep', symbol: 'squid-dragon, R\'lyeh, starspawn' },
  { id: 'nyarlathotep', name: 'Nyarlathotep', title: 'The Crawling Chaos', pantheon: 'Cthulhu', type: 'greater_god', hp: 350, AC: -4, MR: 85, align: 'Chaotic evil', domain: 'chaos, messenger, madness, masks', symbol: 'masks, shadows, chaos, infinite forms' },
]

// Super Monsters eligible as antagonists (HP >= 280)
const SUPER_MONSTER_ANTAGONISTS: AntagonistCandidate[] = [
  // Norse Monsters
  { id: 'fenris', name: 'Fenris', title: 'The World-Ending Wolf', pantheon: 'Norse', type: 'monster', hp: 350, AC: -4, MR: 80, align: 'Chaotic evil', domain: 'destruction, ragnarok, wolves' },
  { id: 'jormungandr', name: 'Jormungandr', title: 'The World Serpent', pantheon: 'Norse', type: 'monster', hp: 400, AC: -3, MR: 75, align: 'Chaotic evil', domain: 'encirclement, poison, the end' },
  
  // Greek Monsters
  { id: 'cerberus', name: 'Cerberus', title: 'Hound of Hades', pantheon: 'Greek', type: 'monster', hp: 200, AC: -1, MR: 40, align: 'Neutral evil', domain: 'underworld guardian, three-headed' },
  
  // Egyptian Monsters
  { id: 'apep', name: 'Apep', title: 'Serpent of Chaos', pantheon: 'Egyptian', type: 'monster', hp: 300, AC: -2, MR: 60, align: 'Chaotic evil', domain: 'chaos, darkness, swallowing the sun' },
  
  // Cthulhu Monsters
  { id: 'spawn_cthulhu', name: 'Spawn of Cthulhu', title: 'The Dreamer\'s Children', pantheon: 'Cthulhu', type: 'monster', hp: 200, AC: -1, MR: 45, align: 'Chaotic evil', domain: 'dreams, insanity, starspawn' },
  
  // Krynn Super Monsters/Demigods
  { id: 'cyan_bloodbane', name: 'Cyan Bloodbane', title: 'The Dream Destroyer', pantheon: 'Krynn', type: 'monster', hp: 280, AC: -5, MR: 55, align: 'Lawful evil', domain: 'dragons, poison, nightmares' },
  { id: 'lord_soth', name: 'Lord Soth', title: 'Knight of the Black Rose', pantheon: 'Krynn', type: 'monster', hp: 300, AC: -8, MR: 85, align: 'Lawful evil', domain: 'undeath, fallen knighthood, tragedy' },
  { id: 'malystryx', name: 'Malystryx', title: 'The Red Dragon Overlord', pantheon: 'Krynn', type: 'monster', hp: 450, AC: -6, MR: 60, align: 'Chaotic evil', domain: 'dragons, fire, conquest' },
  { id: 'khellendros', name: 'Khellendros', title: 'The Blue Dragon Overlord', pantheon: 'Krynn', type: 'monster', hp: 400, AC: -5, MR: 55, align: 'Lawful evil', domain: 'dragons, lightning, storm' },
]

// Combined antagonist pool
export const ANTAGONIST_POOL: AntagonistCandidate[] = [
  ...GREATER_GOD_ANTAGONISTS,
  ...SUPER_MONSTER_ANTAGONISTS.filter(m => m.hp >= 280) // Only formidable monsters
]

// Roll for a random antagonist
export const rollAntagonist = (): AntagonistCandidate => {
  const index = Math.floor(Math.random() * ANTAGONIST_POOL.length)
  return ANTAGONIST_POOL[index]
}

// Get antagonist by ID
export const getAntagonistById = (id: string): AntagonistCandidate | undefined => {
  return ANTAGONIST_POOL.find(a => a.id === id)
}

// Get antagonists by type
export const getAntagonistsByType = (type: AntagonistType): AntagonistCandidate[] => {
  return ANTAGONIST_POOL.filter(a => a.type === type)
}

// Get antagonists by pantheon
export const getAntagonistsByPantheon = (pantheon: string): AntagonistCandidate[] => {
  return ANTAGONIST_POOL.filter(a => a.pantheon === pantheon)
}

// ═══════════════════════════════════════════════════════════════════════════
// ANTAGONIST ARCHRIVAL LOOKUP
// When the antagonist is banished before Act III, their mythological archrival
// can be summoned in Act III to aid the party
// ═══════════════════════════════════════════════════════════════════════════

export interface AntagonistRival {
  id: string
  name: string
  title: string
  pantheon: string
  ability: string
}

// Mythologically accurate archrival mappings for every antagonist in the pool
const ANTAGONIST_RIVALS: Record<string, AntagonistRival> = {
  // ── Greek Pantheon ──
  'zeus':             { id: 'typhon',     name: 'Typhon',     title: 'Father of All Monsters',     pantheon: 'Greek',  ability: 'Earth-shattering storms that can level mountains' },
  'hera':             { id: 'heracles',   name: 'Heracles',   title: 'The Glory of Hera',           pantheon: 'Greek',  ability: 'Divine strength that even the gods fear' },
  'athena':           { id: 'ares',       name: 'Ares',       title: 'God of War',                  pantheon: 'Greek',  ability: 'Rage-fueled combat prowess unmatched by any strategist' },
  'ares':             { id: 'athena',     name: 'Athena',     title: 'Goddess of Wisdom & War',     pantheon: 'Greek',  ability: 'Tactical genius and divine combat mastery' },
  'apollo':           { id: 'heracles',   name: 'Heracles',   title: 'The Glory of Hera',           pantheon: 'Greek',  ability: 'Strength that once stole the sun god\'s sacred tripod' },
  'poseidon':         { id: 'athena',     name: 'Athena',     title: 'Goddess of Wisdom',           pantheon: 'Greek',  ability: 'Strategic cunning that won the contest for Athens' },
  'hades':            { id: 'heracles',   name: 'Heracles',   title: 'The Glory of Hera',           pantheon: 'Greek',  ability: 'Strength that invaded and conquered the underworld itself' },
  'hermes':           { id: 'argus',      name: 'Argus',      title: 'The All-Seeing Panoptes',     pantheon: 'Greek',  ability: 'A hundred eyes that never sleep — nothing escapes his gaze' },
  'aphrodite':        { id: 'artemis',    name: 'Artemis',    title: 'Goddess of the Hunt',         pantheon: 'Greek',  ability: 'Silver arrows that never miss their mark' },

  // ── Norse Pantheon ──
  'odin':             { id: 'fenris',     name: 'Fenris',     title: 'The World-Ending Wolf',       pantheon: 'Norse',  ability: 'Fangs destined to swallow the All-Father at Ragnarok' },
  'thor':             { id: 'jormungandr',name: 'Jormungandr',title: 'The World Serpent',            pantheon: 'Norse',  ability: 'Venom so potent it will kill even the God of Thunder' },
  'loki':             { id: 'heimdall',   name: 'Heimdall',   title: 'The Watcher of Bifrost',      pantheon: 'Norse',  ability: 'All-seeing vigilance — the one who will slay Loki at Ragnarok' },
  'hel':              { id: 'balder',     name: 'Balder',     title: 'The Beautiful',               pantheon: 'Norse',  ability: 'Light that death itself cannot extinguish' },
  'freya':            { id: 'hel',        name: 'Hel',        title: 'Goddess of the Dishonored Dead', pantheon: 'Norse', ability: 'Command over the dead and the cold of the grave' },
  'tyr':              { id: 'fenris',     name: 'Fenris',     title: 'The World-Ending Wolf',       pantheon: 'Norse',  ability: 'The beast whose fang severed Tyr\'s sword hand' },
  'balder':           { id: 'loki',       name: 'Loki',       title: 'Father of Monsters',          pantheon: 'Norse',  ability: 'The trickster whose mistletoe arrow felled the beautiful' },

  // ── Egyptian Pantheon ──
  'ra':               { id: 'apep',       name: 'Apep',       title: 'Serpent of Chaos',            pantheon: 'Egyptian', ability: 'Eternal darkness that devours the sun each night' },
  'osiris':           { id: 'set',        name: 'Set',        title: 'The Red Lord',                pantheon: 'Egyptian', ability: 'Desert storms and treachery that tore the king apart' },
  'isis':             { id: 'set',        name: 'Set',        title: 'The Red Lord',                pantheon: 'Egyptian', ability: 'Ruthless cunning and desert fury' },
  'set':              { id: 'horus',      name: 'Horus',      title: 'The Falcon God',              pantheon: 'Egyptian', ability: 'Solar fury and divine vengeance for his father Osiris' },
  'thoth':            { id: 'set',        name: 'Set',        title: 'The Red Lord',                pantheon: 'Egyptian', ability: 'Chaos that seeks to unravel all knowledge' },
  'ptah':             { id: 'apep',       name: 'Apep',       title: 'Serpent of Chaos',            pantheon: 'Egyptian', ability: 'Destructive entropy that uncreates what was forged' },

  // ── Indian Pantheon ──
  'shiva':            { id: 'andhaka',    name: 'Andhaka',    title: 'The Blind Demon King',        pantheon: 'Indian', ability: 'Darkness so absolute it blinds even the Destroyer' },
  'vishnu':           { id: 'hiranyakashipu', name: 'Hiranyakashipu', title: 'The Demon Emperor',  pantheon: 'Indian', ability: 'Boon-granted invulnerability that no god can penetrate' },
  'indra':            { id: 'vritra',     name: 'Vritra',     title: 'The Drought Demon',           pantheon: 'Indian', ability: 'Drought that withers worlds and swallows storms' },
  'rudra':            { id: 'andhaka',    name: 'Andhaka',    title: 'The Blind Demon King',        pantheon: 'Indian', ability: 'Shadow that corrupts the healing storm' },

  // ── Celtic Pantheon ──
  'dagda':            { id: 'balor',      name: 'Balor',      title: 'King of the Fomorians',       pantheon: 'Celtic', ability: 'A single glance from his eye withers armies' },
  'lugh':             { id: 'balor',      name: 'Balor',      title: 'King of the Fomorians',       pantheon: 'Celtic', ability: 'Destructive eye of death that cannot be countered' },
  'silvanus':         { id: 'balor',      name: 'Balor',      title: 'King of the Fomorians',       pantheon: 'Celtic', ability: 'Corruption that poisons nature at its roots' },

  // ── Central American Pantheon ──
  'quetzalcoatl':     { id: 'tezcatlipoca', name: 'Tezcatlipoca', title: 'Smoking Mirror',       pantheon: 'Central American', ability: 'Obsidian shards and mirror magic that ensnare the soul' },
  'tezcatlipoca':     { id: 'quetzalcoatl', name: 'Quetzalcoatl', title: 'The Feathered Serpent', pantheon: 'Central American', ability: 'Wind and wisdom that banish the darkest night' },
  'tlaloc':           { id: 'quetzalcoatl', name: 'Quetzalcoatl', title: 'The Feathered Serpent', pantheon: 'Central American', ability: 'Divine winds that scatter even the storm god\'s fury' },

  // ── Finnish Pantheon ──
  'ukko':             { id: 'louhi',      name: 'Louhi',      title: 'Mistress of Pohjola',        pantheon: 'Finnish', ability: 'Winter storms and frost that never thaws' },
  'ahto':             { id: 'louhi',      name: 'Louhi',      title: 'Mistress of Pohjola',        pantheon: 'Finnish', ability: 'Dark magic from the frozen north that commands the sea' },

  // ── Japanese Pantheon ──
  'amaterasu':        { id: 'susanoo',    name: 'Susanoo',    title: 'The Storm God',               pantheon: 'Japanese', ability: 'Tempests that shattered the sun and drove her into hiding' },
  'izanagi':          { id: 'izanami',    name: 'Izanami',    title: 'Goddess of the Dead',         pantheon: 'Japanese', ability: 'Death that even the creator cannot reverse' },

  // ── Babylonian Pantheon ──
  'marduk':           { id: 'tiamat',     name: 'Tiamat',     title: 'Mother of All Dragons',       pantheon: 'Babylonian', ability: 'Primal chaos given form — the dragon that birthed monsters' },

  // ── Nehwon Pantheon ──
  'kos':              { id: 'death_nehwon', name: 'Death',   title: 'The End of All Things',       pantheon: 'Nehwon', ability: 'Absolute finality that no battle can defy' },
  'death_nehwon':     { id: 'kos',        name: 'Kos',        title: 'God of Battle',               pantheon: 'Nehwon', ability: 'Eternal warfare that death itself cannot claim' },

  // ── Nonhuman Pantheon ──
  'moradin':          { id: 'gruumsh',    name: 'Gruumsh',    title: 'One-Eyed God',                pantheon: 'Nonhuman', ability: 'Rage that burns hotter than any dwarven forge' },
  'corellon':         { id: 'gruumsh',    name: 'Gruumsh',    title: 'One-Eyed God',                pantheon: 'Nonhuman', ability: 'Brutal orcish fury that seeks to raze elven lands' },
  'gruumsh':          { id: 'corellon',   name: 'Corellon Larethian', title: 'Creator of the Elves', pantheon: 'Nonhuman', ability: 'Elven high magic and grace that outshines orcish brutality' },

  // ── Melnibonéan Pantheon ──
  'arioch':           { id: 'stormbringer', name: 'Stormbringer', title: 'The Eternal Champion\'s Blade', pantheon: 'Melnibonéan', ability: 'Law and balance that can bind even a Chaos Duke' },

  // ── Cthulhu Mythos ──
  'cthulhu':          { id: 'elder_sign', name: 'The Elder Gods', title: 'Sentinels of the Cosmos', pantheon: 'Cthulhu', ability: 'Cosmic binding magic that imprisons the Great Old Ones' },
  'nyarlathotep':     { id: 'elder_sign', name: 'The Elder Gods', title: 'Sentinels of the Cosmos', pantheon: 'Cthulhu', ability: 'Order that holds the crawling chaos at bay' },

  // ── Super Monsters ──
  'fenris':           { id: 'tyr',        name: 'Tyr',        title: 'God of Law and Justice',      pantheon: 'Norse',  ability: 'Divine justice and an unbreakable oath that can bind the unbindable' },
  'jormungandr':      { id: 'thor',       name: 'Thor',       title: 'God of Thunder',              pantheon: 'Norse',  ability: 'Mjolnir\'s lightning that will shatter the World Serpent at Ragnarok' },
  'cerberus':         { id: 'heracles',   name: 'Heracles',   title: 'The Glory of Hera',           pantheon: 'Greek',  ability: 'Divine strength that tamed even the Hound of Hades' },
  'apep':             { id: 'ra',         name: 'Ra',         title: 'Sun God',                     pantheon: 'Egyptian', ability: 'Solar fire that burns away the serpent\'s eternal darkness' },
  'spawn_cthulhu':    { id: 'elder_sign', name: 'The Elder Gods', title: 'Sentinels of the Cosmos', pantheon: 'Cthulhu', ability: 'Cosmic wards that scatter the starspawn like shadows before dawn' },

  // ── Krynn ──
  'cyan_bloodbane':   { id: 'huma',       name: 'Huma Dragonbane', title: 'Knight of the Lance',   pantheon: 'Krynn',  ability: 'The Dragonlance — the one weapon that pierces a dragon\'s heart' },
  'lord_soth':        { id: 'paladine',   name: 'Paladine',   title: 'The Platinum Dragon',         pantheon: 'Krynn',  ability: 'Divine light that purifies even the most ancient undeath' },
  'malystryx':        { id: 'paladine',   name: 'Paladine',   title: 'The Platinum Dragon',         pantheon: 'Krynn',  ability: 'Ancient dragon fire from a god who predates the Overlord' },
  'khellendros':      { id: 'steel',      name: 'Steel Brightblade', title: 'Knight of Solamnia',  pantheon: 'Krynn',  ability: 'A blade of pure conviction that cuts through any storm' },
}

// Banishment planes — mythologically themed realms the antagonist is exiled to
const BANISHMENT_PLANES: Record<string, string> = {
  'Greek':       'the sunless depths of Tartarus, where even the Titans endure eternal imprisonment',
  'Norse':       'Niflheim, the mist-shrouded realm of ice where the dead wander in perpetual winter',
  'Egyptian':    'the Duat\'s darkest chamber, where the serpent\'s shadow coils between the scales of Ma\'at',
  'Indian':      'the bottomless chasm of Patala, where forgotten demons whisper in languages older than creation',
  'Celtic':      'the Hollow Hills, where the Fomorian kings nurse ancient grudges beneath burial mounds',
  'Central American': 'Xibalba, the Place of Fear, where lords of disease rule courts of bone and obsidian',
  'Finnish':     'Tuonela, the land of the dead, where the river of Tuoni flows cold and silent',
  'Japanese':    'Yomi, the shadow land, where even the gods who entered cannot return unchanged',
  'Babylonian':  'Kur, the underworld of darkness, where the gates of Ganzir open onto nothingness',
  'Nehwon':     'the Misty Isles of the Dead, where even the gods of Nehwon fear to tread',
  'Nonhuman':   'the Deep Realm below the roots of the world, where the Ancestor Gods sleep in stone',
  'Melnibonéan':'the Planes of Chaos between the Young Kingdoms, where demons howl at the edges of reality',
  'Cthulhu':    'the space between stars, where even the Great Old Ones drift in formless slumber',
  'Krynn':      'the Abyss, where the Queen of Darkness herself rules an eternal prison of shadows',
}

/**
 * Get the mythological archrival of an antagonist.
 * Returns null if no rival is defined for the given antagonist ID.
 */
export const getAntagonistRival = (antagonistId: string): AntagonistRival | null => {
  return ANTAGONIST_RIVALS[antagonistId] || null
}

/**
 * Get the banishment plane description for an antagonist's pantheon.
 * Falls back to a generic "plane of exile" if pantheon is unrecognized.
 */
export const getBanishmentPlane = (pantheon: string): string => {
  return BANISHMENT_PLANES[pantheon] || 'a plane of exile beyond the reach of gods and mortals alike'
}

/**
 * Generate a Gaiman-style banishment narration when the antagonist is banished.
 */
export const generateBanishmentNarration = (
  antName: string,
  antTitle: string,
  antPantheon: string,
  antDomain: string,
  rival: AntagonistRival
): string => {
  const plane = getBanishmentPlane(antPantheon)
  const turns = Math.floor(Math.random() * 8) + 7 // 7-14 turns until "something" happens

  return `<div class="banishment-event" style="border:1px solid #8b5cf6;border-radius:8px;padding:1rem;margin:0.75rem 0;background:rgba(139,92,246,0.08)">
    <div style="color:#8b5cf6;font-weight:bold;font-size:1.1em;margin-bottom:0.5rem">✦ THE BANISHMENT ✦</div>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
      The air goes still. Not the stillness of a held breath, but the stillness that comes when the universe
      itself pauses to reconsider. ${antName}, ${antTitle} — master of ${antDomain} — staggers as the blow
      lands, and something fundamental cracks.
    </p>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
      Reality folds around ${antName} like pages of a book being closed by an impatient reader.
      There is no scream — gods do not scream when they are exiled, they simply... thin. They become
      less than a shadow, less than a memory, less than a story told by a grandmother to a child
      who has already stopped listening.
    </p>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
      ${antName} is cast into ${plane}. The rift seals behind them with a sound like a library
      slamming shut. But the wound they left in the world still bleeds. You can feel it — a low,
      persistent ache in the fabric of things, like a splinter lodged beneath the skin of reality.
    </p>
    <p style="color:#c084fc;line-height:1.7;margin-bottom:0.75rem;font-style:italic">
      They will return. They always return. But this time — this time, you will not face them alone.
      Somewhere in the deep memory of the shard, a name burns brighter than all the others:
      <strong style="color:#a78bfa">${rival.name}, ${rival.title}.</strong>
      ${rival.ability}. When ${antName} tears their way back from exile, you will have the power
      to call upon the one being in all the cosmos who hates them more than you do.
    </p>
    <div style="color:#8b5cf6;font-size:0.9em;text-align:center;margin-top:0.5rem">
      ⚡ The shard pulses with forbidden knowledge — a name of power, waiting to be spoken ⚡
    </div>
  </div>`
}

/**
 * Generate a Gaiman-style archrival summon narration for Act III.
 */
export const generateRivalSummonNarration = (
  rival: AntagonistRival,
  antName: string
): string => {
  return `<div class="rival-summon-event" style="border:1px solid #f59e0b;border-radius:8px;padding:1rem;margin:0.75rem 0;background:rgba(245,158,11,0.08)">
    <div style="color:#f59e0b;font-weight:bold;font-size:1.1em;margin-bottom:0.5rem">⚡ THE SUMMONING ⚡</div>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
      You speak the name. The shard does not merely glow — it <em>sings</em>, a single perfect note
      that cuts through the chaos of battle like a knife through silk. And from wherever ${rival.name}
      has been waiting — from the margins of myth, from the footnotes of old wars, from the space
      between stories — they come.
    </p>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
      <strong style="color:#fbbf24">${rival.name}, ${rival.title}</strong> — ${rival.ability}.
      Their arrival is not a gentle thing. It is the sound of a debt being collected, of a grudge
      finally given its due. The very air splits where they stand.
    </p>
    <p style="color:#fbbf24;line-height:1.7;font-style:italic">
      "I have waited," ${rival.name} says, and their voice carries the weight of every battle
      they have ever fought against ${antName}. "Do not waste this."
    </p>
  </div>`
}

// Generate clue hints based on antagonist (for DM AI)
export const generateAntagonistClues = (antagonist: AntagonistCandidate): {
  pantheon: string
  domain: string
  alignment: string
  symbol: string
  firstLetter: string
} => {
  return {
    pantheon: antagonist.pantheon,
    domain: antagonist.domain || 'unknown',
    alignment: antagonist.align,
    symbol: antagonist.symbol || 'unknown',
    firstLetter: antagonist.name.charAt(0)
  }
}
