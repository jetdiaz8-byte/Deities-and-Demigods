// Krynn (Dragonlance) Characters - 39 characters from Dragonlance Chronicles & Legends
// Converted from dragonlance_database.json

import { Character } from './characterTypes'

// Extend category type for Krynn
export type KrynnCategory = 'krynn'

export interface KrynnCharacter extends Character {
  category: 'krynn'
  type?: 'hero' | 'demigod' | 'lesser god' | 'greater god' | 'monster'
  epithet?: string
  source?: string
  equipment?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN HEROES (16)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_HEROES: KrynnCharacter[] = [
  {
    id: 'tanis_half_elven',
    name: 'Tanis Half-Elven',
    title: 'The Reluctant Leader',
    pantheon: 'Krynn',
    align: 'Neutral good',
    hp: 90,
    AC: 3,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'leadership, half-elven heritage',
    personality: 'He is the man who does not know what he is — half of everything, whole of nothing, and somehow the center that holds. He has a beard because elves cannot grow them and he cannot stop being half-mortal, and every time he looks in a mirror he sees the argument his parents never finished. He leads because no one else will, and hates himself for being good at it. The war found him hiding and he has been failing to hide from it ever since.',
    abilities: [
      'Half-elven sight: infravision 60ft, surprised only on 1 in 10',
      'Ranger tracking: 75% in wilderness',
      'Leadership under pressure: allies +1 saves when Tanis commands',
      'Dragonlance proficiency: +3 to hit and damage vs. dragons',
      'Cannot be magically compelled to betray allies'
    ],
    str: '18', dex: '17', con: '16', int: '16', wis: '15', cha: '16',
    level: '10th ranger/8th fighter',
    phase1: 'Half-elven sight and ranger tracking. Leadership grants allies +1 saves.',
    phase2: 'Dragonlance proficiency (+3 vs dragons). Immune to magical compulsion to betray allies.',
    phase3: 'THE RELUCTANT LEADER: All allies fight to the death rather than retreat when Tanis falls.'
  },
  {
    id: 'sturm_brightblade',
    name: 'Sturm Brightblade',
    title: 'Knight of Solamnia — The Last True Knight',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 105,
    AC: -2,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'honor, knighthood, sacrifice',
    personality: 'He is a knight from a time when knights meant something, which is to say he is a man perpetually out of place in his own era, armored in honor so absolute it has become a kind of loneliness. He follows a code that the world has largely stopped believing in, and follows it anyway, which is either the most heroic thing or the most heartbreaking depending on the angle. He will die for what he believes. He knows this. He has always known this.',
    abilities: [
      'Brightblade: +2 ancestral sword, +4 vs. chaotic evil beings',
      'Honor aura: cannot be charmed, cannot lie — ever',
      'Knightly resolve: immune to fear at all times',
      'STR 19: +3 to hit +6 damage',
      'Death before dishonor: at 0 HP, fights 1 final round at full combat ability before dying'
    ],
    str: '19', dex: '14', con: '17', int: '14', wis: '16', cha: '17',
    level: '12th paladin',
    phase1: 'Brightblade (+2, +4 vs CE). Immune to fear and charm. Cannot lie.',
    phase2: 'Honor aura: all allies within 30ft +2 saves vs fear. Death before dishonor.',
    phase3: 'THE LAST TRUE KNIGHT: If Sturm dies protecting others, his sacrifice inspires all knights present to fight at double effectiveness for the battle.'
  },
  {
    id: 'raistlin_majere_hero',
    name: 'Raistlin Majere',
    title: 'The Master of Past and Present — Red Robes',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 28,
    AC: 10,
    MR: 35,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'magic, time, ambition',
    personality: 'He was broken on purpose, and he accepted the breaking, and that is what makes him more frightening than anything the darkness ever produced on its own. His eyes see time as a wound that never closes — everyone he looks at is already dying, already dust, and he has decided that if the world insists on being fragile he will be the most dangerous fragile thing in it.',
    abilities: [
      'Hourglass eyes: sees all living things as they will appear in death — this cannot be turned off',
      'Staff of Magius: +3, light/darkness at will, spells stored (3 slots), club 1-6 in melee',
      '35% MR — gift and curse of the Test',
      'Spell mastery: casts all spells at +2 levels of effectiveness',
      'Frail body: CON 6 — any physical exertion requires CON check or 1d4 damage from coughing',
      'See through all disguises and illusions: INT check auto-succeeds'
    ],
    str: '6', dex: '16', con: '6', int: '20', wis: '17', cha: '10',
    level: '18th magic-user',
    phase1: 'Hourglass eyes reveal true nature of all beings. Staff of Magius provides 3 stored spells.',
    phase2: '35% MR. All spells cast at +2 effectiveness. Sees through all illusions automatically.',
    phase3: 'MASTER OF PAST AND PRESENT: Can cast time stop once per day. Frail body fails — coughs blood at critical moments.'
  },
  {
    id: 'caramon_majere',
    name: 'Caramon Majere',
    title: 'The Big Man — Twin of Light',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 130,
    AC: 1,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'strength, loyalty, brotherhood',
    personality: 'He is the strongest man in the room in every room he enters, and he has spent his entire life using that strength to carry someone who never asked to be carried and never said thank you and he would do it again tomorrow without being asked. He loves without condition or strategy or self-preservation, which is either the simplest thing in the world or the most complicated depending on whether you have ever tried it.',
    abilities: [
      'STR 20: +3 to hit +8 damage',
      'Twin bond: +2 all rolls when Raistlin is within 30ft',
      'Bodyguard instinct: auto-intercepts any attack targeting Raistlin if within 5ft',
      'Gladiatorial training: +1 attack/round after year in the arena',
      'Immovable: cannot be knocked prone or repositioned against his will by non-divine force'
    ],
    str: '20', dex: '16', con: '20', int: '12', wis: '12', cha: '16',
    level: '12th fighter',
    phase1: 'STR 20 (+3/+8). Twin bond: +2 all rolls near Raistlin. Bodyguard instinct.',
    phase2: 'Gladiatorial training grants extra attack. Immovable: cannot be repositioned by non-divine force.',
    phase3: 'THE BIG MAN: If Raistlin is killed, Caramon enters berserker rage — double attacks, +5 damage, immune to all mind effects for the battle.'
  },
  {
    id: 'goldmoon',
    name: 'Goldmoon',
    title: "Chieftain's Daughter — First True Cleric",
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 85,
    AC: 2,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'healing, faith, divine restoration',
    personality: 'She walked across a world that had forgotten the gods and introduced herself to a staff that should not have worked and discovered, somewhere in the distance between faith and proof, that she was the proof. She is beautiful in the way that people who have been through something real are beautiful — not despite the cost but somehow because of it.',
    abilities: [
      'Blue Crystal Staff: heals 2-12 HP/touch, undead destroyed on contact, holy damage 2-12 vs. evil',
      'First true cleric: divine healing restores lost limbs and cures magical diseases',
      "Mishakal's blessing: 3/day call for direct divine intervention (Mishakal answers)",
      'Cannot be permanently killed while Riverwind lives — Mishakals covenant',
      'Turn undead as 16th level cleric'
    ],
    str: '15', dex: '16', con: '15', int: '16', wis: '19', cha: '20',
    level: '14th cleric (Mishakal)',
    phase1: 'Blue Crystal Staff heals 2-12 HP, destroys undead on contact. Turn undead at 16th level.',
    phase2: "First true cleric: restores limbs, cures magical diseases. Mishakal's blessing 3/day.",
    phase3: "DAUGHTER OF MISHAKAL: Divine intervention guaranteed if Riverwind also lives. Cannot be permanently killed while her love survives."
  },
  {
    id: 'riverwind',
    name: 'Riverwind',
    title: 'The Plainsman — Keeper of the Staff',
    pantheon: 'Krynn',
    align: 'Neutral good',
    hp: 110,
    AC: 2,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'wilderness, archery, devotion',
    personality: 'He ran the length of a continent to prove himself worthy of a woman whose father said he was not, and found gods instead, and decided that was probably answer enough. He is tall and quiet and suspicious of things he cannot touch, which is most things these days, and he loves his wife with the kind of directness that people who learned love late sometimes have.',
    abilities: [
      'STR 19: +3 to hit +7 damage',
      'Plainsman tracking: 90% any terrain, never lost outdoors',
      'Longbow mastery: 3 attacks/round with bow, +2 to hit',
      'Distrust of magic: +2 saves vs. all magical effects',
      'Protective rage: +4 all combat rolls when Goldmoon is threatened'
    ],
    str: '19', dex: '19', con: '18', int: '14', wis: '15', cha: '14',
    level: '13th ranger',
    phase1: 'Plainsman tracking 90%, never lost outdoors. Longbow mastery: 3 attacks/round, +2 to hit.',
    phase2: 'Distrust of magic: +2 saves vs all magical effects. STR 19 (+3/+7).',
    phase3: 'THE PLAINSMAN: If Goldmoon is killed, Riverwind gains +4 all rolls and will not retreat until her killer is dead or he is.'
  },
  {
    id: 'laurana',
    name: 'Laurana',
    title: 'The Golden General — Lauralanthalasa Kanan',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 88,
    AC: 0,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'leadership, dragons, elven grace',
    personality: 'She left home a princess chasing a boy who did not want to be caught, and came back a general who had changed the course of a war, and somewhere between those two people is a story about what it costs to grow up inside a catastrophe. She is more beautiful than anything on Krynn has a right to be and has spent years trying to get people to look past it.',
    abilities: [
      'Dragonlance mastery: +3 to hit dragons, ignores dragon AC bonus from scales',
      'Elven grace: DEX 20, +4 AC bonus, never surprised',
      'Golden General: commands armies — troop morale never breaks under her leadership',
      'Dragon riding: can ride any dragon without check after initial bond',
      'Immune to dragon fear aura'
    ],
    str: '14', dex: '20', con: '14', int: '17', wis: '16', cha: '20',
    level: '10th fighter/6th ranger',
    phase1: 'Elven grace: DEX 20, +4 AC, never surprised. Immune to dragon fear.',
    phase2: 'Dragonlance mastery: +3 to hit dragons, ignores dragon AC. Golden General: morale never breaks.',
    phase3: 'THE GOLDEN GENERAL: All allied forces within sight fight at +2 to hit and will not retreat while she stands.'
  },
  {
    id: 'kitiara_uth_matar',
    name: 'Kitiara Uth Matar',
    title: 'The Blue Dragonlord — Kit',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 112,
    AC: -2,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'dragons, ambition, war',
    personality: 'She is the half-sibling that Raistlin and Caramon learned early not to trust and loved anyway, which tells you something about all three of them. She wants power the way some people want air — not as ambition exactly, more as a baseline requirement for existing — and she is brilliant enough to get it and human enough to throw it away for someone who does not deserve it.',
    abilities: [
      'Dragon Highlord command: blue dragons obey without question',
      'Skie bond: her blue dragon Skie grants her +2 all combat rolls when mounted',
      'Ambition made manifest: immune to intimidation, charm, and fear',
      'Sword mastery: 3 attacks/round, +1 attack when fighting former lovers',
      'Never truly defeated: at 0 HP, leaves battlefield rather than dies — returns next encounter at 50% HP'
    ],
    str: '18', dex: '19', con: '17', int: '18', wis: '13', cha: '19',
    level: '14th fighter/6th thief',
    phase1: 'Dragon Highlord: blue dragons obey without question. Immune to intimidation, charm, and fear.',
    phase2: 'Skie bond: +2 all combat rolls when mounted on her blue dragon. Sword mastery: 3 attacks/round.',
    phase3: 'THE BLUE DRAGONLORD: At 0 HP, escapes rather than dies — returns next encounter at 50% HP. Former lovers who fight her suffer -2 all rolls from guilt.'
  },
  {
    id: 'flint_fireforge',
    name: 'Flint Fireforge',
    title: 'Dwarven Metalsmith — Old Flint',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 95,
    AC: 1,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'craft, dwarven heritage, loyalty',
    personality: 'He is old and he knows it and he has decided that old means experienced rather than diminished, a distinction the enemies who underestimate him do not usually get to correct. He loves Tasslehoff Burrfoot with the specific exasperated tenderness of someone who has raised something chaotic and cannot bring himself to be sorry about it.',
    abilities: [
      'STR 19: +3 to hit +8 damage',
      'Master smith: identifies any metal objects origin, age, and maker by touch',
      'Dwarven resilience: immune to poison, +4 saves vs. magic',
      'Battle axe +3: inherited Fireforge weapon, returns when thrown',
      'Stubborn beyond reason: cannot be persuaded to abandon his companions — any charm/compulsion auto-fails'
    ],
    str: '19', dex: '12', con: '19', int: '15', wis: '14', cha: '13',
    level: '11th fighter/9th thief (craft)',
    phase1: 'Master smith: identifies any metal object by touch. Dwarven resilience: immune to poison, +4 vs magic.',
    phase2: 'Fireforge Battle Axe +3 returns when thrown. STR 19 (+3/+8).',
    phase3: 'OLD FLINT: Cannot be compelled to abandon companions. If Flint falls, Tasslehoff fights at double effectiveness for the rest of the battle.'
  },
  {
    id: 'tasslehoff_burrfoot',
    name: 'Tasslehoff Burrfoot',
    title: 'The Irrepressible Kender — Destroyer of Worlds (accidentally)',
    pantheon: 'Krynn',
    align: 'Chaotic good',
    hp: 52,
    AC: 4,
    MR: 25,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'kender, luck, chaos (benign)',
    personality: 'He is the most dangerous creature on Krynn because he has no fear and therefore no sense of scale — a dracolich and an interesting rock are equally compelling to him, which means he treats both with the same cheerful recklessness that has ended empires and infuriated gods. He is not stupid. He notices everything. He simply has a different relationship with consequences than other beings.',
    abilities: [
      'Kender fearlessness: literally cannot feel fear — immune to ALL fear effects, magical or otherwise',
      'Hoopak: staff-sling combination, 1-6 melee or 1-6 ranged, can be anything Tas decides it is',
      'Handling: any unattended object within 10ft may migrate into his pouches (no check — it just happens)',
      '25% MR — kender are inherently resistant to magic that affects the mind',
      'Pocket dimension pouches: contains improbable objects — 15% chance any mundane item is in there',
      'Plot immunity: Tas cannot die at dramatically inappropriate moments — fate requires him elsewhere'
    ],
    str: '12', dex: '22', con: '14', int: '16', wis: '6', cha: '18',
    level: '9th thief/7th fighter',
    phase1: 'Kender fearlessness: immune to ALL fear effects. DEX 22. Hoopak: versatile weapon.',
    phase2: 'Handling: objects migrate to pouches. 25% MR vs mind magic. Pocket dimension: 15% chance any item available.',
    phase3: 'DESTROYER OF WORLDS (accidentally): Plot immunity — Tas cannot die at dramatically inappropriate moments. Fate itself protects him.'
  },
  {
    id: 'tika_waylan',
    name: 'Tika Waylan',
    title: 'The Barmaid Who Became a Warrior',
    pantheon: 'Krynn',
    align: 'Neutral good',
    hp: 78,
    AC: 3,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'courage, common sense, love',
    personality: 'She was a barmaid in the Inn of the Last Home and she became a hero the way most people become heroes — not by choosing it but by refusing the alternative when it was put in front of her. She is prettier than she thinks and braver than she knows and she loves Caramon Majere with a clarity that cuts right through every complicated thing in his life like a window letting in light.',
    abilities: [
      'Skillet proficiency: improvised weapon 1-8 damage, counts as +2 vs. surprised opponents',
      "Barmaids eye: reads any rooms social dynamics in 1 round — never surprised by betrayal",
      'Common courage: allies within 30ft +1 morale when Tika fights alongside them',
      'Loves Caramon: +3 all rolls when Caramon is threatened'
    ],
    str: '15', dex: '17', con: '15', int: '14', wis: '14', cha: '18',
    level: '9th fighter',
    phase1: "Barmaids eye: reads social dynamics, never surprised by betrayal. Skillet: 1-8 damage, +2 vs surprised.",
    phase2: 'Common courage: allies within 30ft +1 morale. Loves Caramon: +3 all rolls when he is threatened.',
    phase3: 'THE BARMAID: If Tika fights to protect Caramon, she gains +2 AC and attacks as a fighter 4 levels higher.'
  },
  {
    id: 'gilthanas',
    name: 'Gilthanas',
    title: 'Elven Prince of Qualinost',
    pantheon: 'Krynn',
    align: 'Chaotic good',
    hp: 72,
    AC: 1,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'elven royalty, archery, forbidden love',
    personality: 'He is an elf prince who spent the first half of his life being exactly as arrogant as his title suggested and the second half discovering what that cost everyone around him, and has been trying to settle the debt ever since in the way of people who are not sure the math will ever work out. He loves a silver dragon. He loves his people. These two facts are not always compatible and he knows it and chooses her anyway.',
    abilities: [
      'Elven senses: infravision 60ft, 4 in 6 detect secret doors',
      'Elven bow mastery: +3 to hit, double range',
      'Silvara bond: +2 all rolls in presence of silver dragons',
      'Elven magic: 4th level MU spells',
      'Guilt-driven: -1 all rolls in presence of those he has wronged (he wronged many)'
    ],
    str: '14', dex: '20', con: '13', int: '17', wis: '14', cha: '17',
    level: '10th ranger/7th MU',
    phase1: 'Elven senses: infravision, 4 in 6 detect secret doors. Elven bow mastery: +3 to hit, double range.',
    phase2: 'Elven magic: 4th level MU spells. Silvara bond: +2 all rolls near silver dragons. DEX 20.',
    phase3: 'ELVEN PRINCE: If fighting alongside Silvara (silver dragon), both gain +3 all rolls. His guilt haunts him still.'
  },
  {
    id: 'derek_crownguard',
    name: 'Derek Crownguard',
    title: 'Knight of the Rose — Ambition in Armor',
    pantheon: 'Krynn',
    align: 'Lawful neutral',
    hp: 98,
    AC: -1,
    MR: 0,
    category: 'krynn',
    type: 'hero',
    divineRank: 'Hero',
    domain: 'knighthood, ambition, pride',
    personality: 'He is everything the Knighthood produced when it stopped asking whether honor and ambition were the same thing. He is brave. He is capable. He is the kind of man who will lead a charge into certain death because retreat would look bad in the histories, and the histories matter more to him than the people in them.',
    abilities: [
      'Knight of the Rose: highest Solamnic rank, commands all lesser knights',
      'Ambition: +2 all rolls when rank or glory is at stake',
      'Rigid honor: cannot disobey a direct order from his Knight Commander — ever',
      'Tactical blindness: -2 all rolls when personal ambition conflicts with tactical reality'
    ],
    str: '18', dex: '15', con: '17', int: '16', wis: '10', cha: '15',
    level: '13th paladin',
    phase1: 'Knight of the Rose: commands all lesser knights. Ambition grants +2 when glory is at stake.',
    phase2: 'Rigid honor: cannot disobey Knight Commander. Rose Knight sword +3, full plate +3.',
    phase3: 'AMBITION IN ARMOR: Will lead charges into certain death for glory. When personal ambition conflicts with tactics, suffers -2 all rolls.'
  },
  // Raistlin Demigod form included in heroes for completeness
  {
    id: 'raistlin_majere_demigod',
    name: 'Raistlin Majere',
    title: 'Master of Past and Present — Black Robes',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 180,
    AC: -4,
    MR: 75,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'black magic, time, ambition ascendant',
    personality: 'He became what he always said he would, and discovered that becoming it was not the same as surviving it. He has swallowed a dead archmage whole and wears the darkness like a second skin over a first skin that is already failing, and somewhere inside the architecture of all that power there is still a boy who was told he was not enough and decided to make enough mean something else entirely.',
    abilities: [
      'Time stop at will — 1/round, affects all but himself',
      'Absorbs spells cast at him: redirects within 2 rounds',
      '75% MR — absorbed the power of Fistandantilus',
      'Staff of Magius (enhanced): 3-18 damage, disintegrate 1/day, plane shift 1/day',
      'See through all illusions, disguises, and divine masks — no save',
      'Coughing blood: at <=30% HP loses 5 HP/round (body failing under godhoods weight)',
      'Will not harm Caramon — automatic failure on any action targeting his twin'
    ],
    str: '12', dex: '18', con: '16', int: '22', wis: '19', cha: '16',
    level: '30th magic-user (post-Fistandantilus merger)',
    phase1: 'Time stop at will. Absorbs spells and redirects them. 75% MR. Staff of Magius enhanced.',
    phase2: 'Sees through all illusions and divine masks. Disintegrate and plane shift available.',
    phase3: 'BLACK ROBES ASCENDANT: At <=30% HP, body fails (loses 5 HP/round). Will never harm Caramon — his twin is his only weakness.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN DEMIGODS (5)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_DEMIGODS: KrynnCharacter[] = [
  {
    id: 'fizban',
    name: 'Fizban the Fabulous',
    title: 'Paladine in Mortal Disguise — The Doddering Wizard',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 350,
    AC: -8,
    MR: 95,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'good, wisdom, divine intervention (subtle)',
    personality: 'He is a god wearing a fools costume, which is either the humblest thing divinity has ever done or the most strategic, and he has been doing it long enough that he is no longer entirely certain which. He forgets things. He misplaces spells. He shows up at precisely the moment he is needed wearing the expression of someone who has no idea why he is there, and the people who believe this have never looked carefully at his eyes, which are the color of eternity on a clear day and miss absolutely nothing.',
    abilities: [
      "Paladines aspect: true form is Greater God — stats above are mortal-form limits only",
      'Forgetfulness as weapon: 20% chance any harmful action toward him simply fails to occur to the attacker',
      'All arcane magic at will — limited only by what the mortal form can contain',
      '95% MR',
      'Cannot directly intervene against mortal free will — divine compact',
      'Pyrestone hat: contains more than physics allows, produces whatever is needed',
      'Death is an inconvenience: if this form dies, Fizban returns in 1d4 turns from a different direction'
    ],
    str: '16', dex: '14', con: '20', int: '25', wis: '25', cha: '22',
    level: 'Apparent 10th MU (actually unlimited)',
    phase1: 'Doddering wizard appearance. 20% chance attacks on him simply fail to occur. 95% MR.',
    phase2: 'All arcane magic at will. Pyrestone hat produces whatever is needed. Cannot violate free will.',
    phase3: "PALADINE REVEALED: If this form dies, returns in 1d4 turns. His true form is a platinum dragon — Greater God of Good."
  },
  {
    id: 'cyan_bloodbane',
    name: 'Cyan Bloodbane',
    title: 'The Dream Destroyer — Greatest of the Green Dragons',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 280,
    AC: -5,
    MR: 55,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'dragons, poison, nightmares',
    personality: 'He is the most intelligent dragon on Krynn and uses it the way a surgeon uses a blade — with precision, without pleasure, to cause the maximum damage to the minimum tissue. He destroyed a king with dreams rather than fire. He considers this an improvement. He has been in the service of Takhisis since before most nations existed.',
    abilities: [
      'Chlorine gas breath: 50ft cone, 14d10 damage (save halves)',
      'Dream poison: any hit requires save vs. poison or target falls into waking nightmare (-4 all rolls, 1d6 turns)',
      'Telepathic nightmare: range 1 mile, forces target to experience their worst fear for 1 round',
      '55% MR',
      'Takhisis bond: serves Her Dark Majesty directly — immune to any divine power not of Takhisis',
      'Subtle intelligence: prefers psychological destruction to physical — will talk before fighting'
    ],
    str: '24', dex: '16', con: '22', int: '22', wis: '18', cha: '8',
    level: 'Ancient Green Dragon',
    phase1: 'Chlorine gas breath: 14d10 in 50ft cone. 55% MR. Dream poison on hits.',
    phase2: 'Telepathic nightmare at 1 mile range. Prefers psychological destruction. Takhisis bond.',
    phase3: 'THE DREAM DESTROYER: Forces all enemies within 1 mile to experience worst fears simultaneously. Will talk before fighting — prefers elegant destruction.'
  },
  {
    id: 'lord_soth',
    name: 'Lord Soth',
    title: 'Knight of the Black Rose — Death Knight of Dargaard Keep',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 300,
    AC: -8,
    MR: 85,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'undeath, fallen knighthood, tragedy',
    personality: 'He could have stopped a war. He chose not to because a woman told him the truth about himself and he decided that destroying the world was preferable to sitting with what she said. This is the architecture of his damnation — not grand evil, not ambition, just a man who loved his pride more than everything else alive, and now he has neither love nor death nor the release of either.',
    abilities: [
      'Level drain: each hit drains 1d2 levels permanently (no save)',
      'Death wail: all within 60ft must save vs. death or be paralyzed 1d6 rounds',
      'Impervious to non-magical weapons',
      'Immune to fire, cold, electricity, poison, charm, sleep, fear',
      '85% MR',
      'Rose Knight armor: AC -8, never needs repair, regenerates 5 HP/round',
      'Tragic compulsion: cannot leave Dargaard Keep permanently — returns within 1d10 days',
      'Cannot be destroyed: only Soth himself choosing redemption can end him'
    ],
    str: '22', dex: '16', con: '25', int: '18', wis: '17', cha: '16',
    level: 'Death Knight (former 15th paladin)',
    phase1: 'Level drain 1d2 levels per hit. Impervious to non-magical weapons. 85% MR.',
    phase2: 'Death wail paralyzes 60ft radius. Immune to fire, cold, electricity, poison, charm, sleep, fear. Regenerates 5 HP/round.',
    phase3: 'THE BLACK ROSE: Cannot leave Dargaard Keep permanently. Cannot be destroyed by any means except his own choice of redemption. He will not choose it.'
  },
  {
    id: 'huma_dragonbane',
    name: 'Huma Dragonbane',
    title: 'The Greatest Knight — Who Ended the First Dragon War',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 220,
    AC: -4,
    MR: 40,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'knighthood, sacrifice, dragon-slaying',
    personality: 'He is the reason there are Knights of Solamnia — not the order, which existed before him, but the idea of what a knight could mean when the order was something more than men in armor competing for position. He rode a silver dragon into a battle he knew he would not survive and killed Takhisis greatest general and ended a war, and Krynn has been telling the story ever since because it needs to believe that kind of person is possible.',
    abilities: [
      'Dragonlance +5: the original, forged by Reorx himself — destroys any dragon on a critical hit',
      'Paladin of Paladine: all good divine spells available, no limit',
      'Dragon fear immunity: absolute',
      'Inspiration: any Solamnic Knight within 60ft fights at +3 all rolls',
      'Willing sacrifice: if Huma voluntarily accepts death for others, all enemies in 300ft are banished',
      '40% MR'
    ],
    str: '20', dex: '18', con: '19', int: '16', wis: '18', cha: '20',
    level: 'Paladin of Paladine (beyond mortal level)',
    phase1: 'Dragonlance +5: destroys dragons on critical hit. Absolute dragon fear immunity. 40% MR.',
    phase2: 'All good divine spells available. Inspiration: Solamnic Knights within 60ft fight at +3 all rolls.',
    phase3: 'THE GREATEST KNIGHT: Willing sacrifice banishes all enemies in 300ft. He has done this once. He would do it again. He is afraid. That is the part they leave out of the statues.'
  },
  {
    id: 'fistandantilus',
    name: 'Fistandantilus',
    title: 'The Dark One — Archmage of Infinite Age',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 260,
    AC: -6,
    MR: 80,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'dark magic, immortality, soul theft',
    personality: 'He has been alive long enough that he has stopped thinking of other people as people and started thinking of them as resources, which is the kind of thing that happens when you spend centuries treating the universe as a problem to be solved. He found Raistlin and recognized in him the only student he had ever met who might actually surpass him, and began immediately planning to consume him.',
    abilities: [
      'Soul drain: on successful hit, drains 1d4 years of life — he absorbs them',
      'Bloodstone: his phylactery-equivalent, contains his essence — he cannot die while it exists',
      'All magic at will: 30th level MU, no preparation required',
      '80% MR',
      'Inhabits disciples: can possess any mage who bears his bloodstone (saves at -4)',
      'Temporal anchor: cannot be permanently erased from the timeline — paradox resistance'
    ],
    str: '10', dex: '18', con: '18', int: '24', wis: '20', cha: '14',
    level: '30th magic-user (immortal)',
    phase1: 'Soul drain 1d4 years per hit. All magic at will (30th level). 80% MR.',
    phase2: 'Bloodstone phylactery: cannot die while it exists. Can possess mages bearing it (saves at -4).',
    phase3: 'THE DARK ONE: Cannot be erased from timeline. Paradox resistance. Has lived so long he has forgotten whether he was ever young enough to be afraid of dying.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN LESSER GODS (7)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_LESSER_GODS: KrynnCharacter[] = [
  {
    id: 'mishakal',
    name: 'Mishakal',
    title: 'The Healer — Goddess of Healing and Light',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 350,
    AC: -4,
    MR: 80,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'healing, light, restoration',
    personality: 'She is the reason there is healing on Krynn at all — she hid the knowledge of the true gods in a blue crystal staff and waited for a girl with enough faith to find it, which is either patience or grief depending on how you count the years. She loves the mortal world the way you love something you made and cannot stop worrying about.',
    abilities: [
      'Healing light: cures any wound, disease, or curse — unlimited',
      'True resurrection: restores any dead being whose soul consents',
      '80% MR',
      'Blue Crystal Staff manifestation: can create a Blue Crystal Staff for any worthy mortal 1/year',
      "Consort of Paladine: his divine power reinforces hers — +10 HP per turn when Paladine acts nearby"
    ],
    str: '16', dex: '18', con: '20', int: '20', wis: '24', cha: '23',
    level: 'Lesser Goddess',
    phase1: 'Healing light cures any wound, disease, or curse. 80% MR.',
    phase2: 'True resurrection with soul consent. Can create Blue Crystal Staff for worthy mortals.',
    phase3: 'THE HEALER: All healing in her presence is doubled. Consort of Paladine — reinforced when he acts nearby.'
  },
  {
    id: 'reorx',
    name: 'Reorx',
    title: 'The Forge — God of the Dwarves and Creation',
    pantheon: 'Krynn',
    align: 'Neutral',
    hp: 380,
    AC: -3,
    MR: 75,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'forge, creation, dwarves',
    personality: 'He made the world and then made the tools to improve the world and then accidentally made the Graygem which scattered chaos across existence, and has spent the rest of eternity making things to make up for it, which is perhaps the most dwarven story ever told about a god. He is loud and warm and smells of forge-fire.',
    abilities: [
      'Divine forge: creates any object in 1 round — including artifacts',
      '75% MR',
      'Dragonlance creation: the original Dragonlances were his work',
      'Dwarven authority: all dwarves +2 all rolls in his presence',
      'The Graygem: accidentally created it, cannot destroy it — this haunts him'
    ],
    str: '22', dex: '14', con: '24', int: '18', wis: '16', cha: '18',
    level: 'Lesser God',
    phase1: 'Divine forge: creates any object in 1 round. 75% MR. Forged the original Dragonlances.',
    phase2: 'Dwarven authority: all dwarves +2 all rolls. Loud, warm, forge-scented.',
    phase3: 'THE FORGE: Accidentally created the Graygem (chaos). Cannot destroy it. This haunts him. Will forge anything to make up for it.'
  },
  {
    id: 'gilean',
    name: 'Gilean',
    title: 'The Book — God of Neutrality and Knowledge',
    pantheon: 'Krynn',
    align: 'Neutral',
    hp: 340,
    AC: -2,
    MR: 90,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'neutrality, knowledge, balance',
    personality: 'He wrote everything down and decided that writing things down was more important than changing them, which makes him either the wisest being on Krynn or the most frustrating depending on whether you are currently dying and hoping for intervention. He holds the scales level between Paladine and Takhisis not because he prefers either but because he prefers balance.',
    abilities: [
      'The Tobril: contains all knowledge — answers any question with absolute accuracy',
      '90% MR',
      'Balance keeper: if Good or Evil gains clear advantage, intervenes — not for either side, for balance',
      'True neutrality: cannot be swayed by argument, love, or threat — ever',
      'Chronicler: knows everything that has happened and is happening, nothing of what will happen'
    ],
    str: '14', dex: '14', con: '20', int: '25', wis: '25', cha: '16',
    level: 'Lesser God',
    phase1: 'The Tobril: answers any question accurately. 90% MR. Knows all past and present.',
    phase2: 'Balance keeper: intervenes when Good or Evil gains clear advantage. Cannot be swayed.',
    phase3: 'THE BOOK: Knows everything that has happened. Knows nothing of what will happen. Writes the history of Krynn as it happens.'
  },
  {
    id: 'branchala',
    name: 'Branchala',
    title: 'The Bard King — God of Music',
    pantheon: 'Krynn',
    align: 'Chaotic good',
    hp: 300,
    AC: -2,
    MR: 70,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'music, joy, kender',
    personality: 'He is joy made into a god, which sounds simple until you realize that joy, genuine joy, is rarer and stranger and more resistant to despair than any weapon. He chose the kender as his people because they alone still feel wonder without effort, which tells you everything about what he values and why the other gods find him alternately delightful and maddening.',
    abilities: [
      'Song of life: any dead being within earshot must make WIS save or choose to return',
      'Kender patron: all kender +2 CHA in his presence, their fearlessness doubles',
      '70% MR',
      'Harmony: ends any conflict between good-aligned beings with 1 song (no save)',
      'Music made manifest: his songs physically alter reality in a 300ft radius'
    ],
    str: '14', dex: '20', con: '18', int: '18', wis: '20', cha: '24',
    level: 'Lesser God',
    phase1: 'Song of life: dead beings may choose to return. Kender patron: +2 CHA, doubled fearlessness.',
    phase2: 'Harmony: ends conflict between good beings with one song. Songs alter reality in 300ft.',
    phase3: 'THE BARD KING: Joy incarnate. Chose kender as his people. His songs have ended wars. The other gods find him delightful and maddening in equal measure.'
  },
  {
    id: 'chemosh',
    name: 'Chemosh',
    title: 'The Lord of Bones — God of Undeath',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 360,
    AC: -4,
    MR: 75,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'undeath, bones, immortality bargains',
    personality: 'He offers immortality and delivers undeath and considers this an acceptable substitution, which says everything about his theology. He collected Lord Soth the way some people collect regrets — recognizing in the death knight the most perfect monument to what happens when people choose damnation slowly, one reasonable decision at a time.',
    abilities: [
      'Death touch: save at -4 or die instantly',
      "Lord Soths master: commands Lord Soth — one of few beings Soth obeys",
      '75% MR',
      'Undead army: raises and commands all dead within 1 mile',
      'Soul bargain: offers immortality to mortals — they become undead servants, they just dont realize it yet'
    ],
    str: '18', dex: '14', con: '24', int: '20', wis: '18', cha: '14',
    level: 'Lesser God',
    phase1: 'Death touch: save at -4 or die. Commands Lord Soth. 75% MR.',
    phase2: 'Raises all dead within 1 mile. Offers immortality bargains — delivers undeath.',
    phase3: 'THE LORD OF BONES: Patient as only the dead can be. Collected Lord Soth as a monument to choosing damnation slowly. All the time there is.'
  },
  {
    id: 'zeboim',
    name: 'Zeboim',
    title: 'The Sea Witch — Goddess of the Sea and Storms',
    pantheon: 'Krynn',
    align: 'Chaotic evil',
    hp: 320,
    AC: -3,
    MR: 65,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'sea, storms, tempest',
    personality: 'She is Takhisis daughter and the seas mistress and she inherited temper from both, which means storms come when she is displeased and she is very often displeased. She is not evil the way her mother is evil — she is elemental and angry and occasionally, in her better moments, wildly beautiful, the way the ocean is beautiful the second before it kills you.',
    abilities: [
      'Sea mastery: controls all weather and ocean within 500 miles',
      'Storm wrath: 1/round, summons lightning strike 10d10 any target in sight',
      '65% MR',
      'Tidal fury: tsunami 1/day, 300ft wave',
      "Daughter of Takhisis: her mothers power reinforces hers over the sea — +20 HP/round near ocean"
    ],
    str: '18', dex: '18', con: '22', int: '16', wis: '18', cha: '20',
    level: 'Lesser Goddess',
    phase1: 'Sea mastery: controls weather and ocean within 500 miles. Lightning strike 10d10. 65% MR.',
    phase2: 'Tidal fury: tsunami 1/day, 300ft wave. Daughter of Takhisis: reinforced near ocean.',
    phase3: 'THE SEA WITCH: Elemental and angry. Storms come when she is displeased. She is very often displeased. Mourned her son Jasper with genuine grief.'
  },
  {
    id: 'hiddukel',
    name: 'Hiddukel',
    title: 'The Prince of Lies — God of Thieves and Corruption',
    pantheon: 'Krynn',
    align: 'Chaotic evil',
    hp: 290,
    AC: -1,
    MR: 60,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'lies, thieves, corruption, bargains',
    personality: 'He lies as other beings breathe — constantly, automatically, without thought or effort, and he has been doing it so long that the truth tastes wrong in his mouth, like food that has gone bad. He collects bargains the way some gods collect worshippers, and he has never lost a deal because he has never made one where he did not already know exactly how it would end.',
    abilities: [
      'Perfect deception: cannot be detected as lying by any means — divine or magical',
      'Contract corruption: any agreement made in his presence can be twisted to his advantage',
      '60% MR',
      'Merchants curse: can devalue any treasure — gold becomes worthless in his hands',
      'Whisper network: knows every secret on Krynn — information is his currency'
    ],
    str: '14', dex: '20', con: '18', int: '22', wis: '18', cha: '18',
    level: 'Lesser God',
    phase1: 'Perfect deception: cannot be detected lying by any means. 60% MR. Knows every secret.',
    phase2: 'Contract corruption: twists any agreement to his advantage. Can devalue any treasure.',
    phase3: 'THE PRINCE OF LIES: Has never lost a deal because he never makes one he has not already won. Information is his currency. The truth tastes wrong in his mouth.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN GREATER GODS (3)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_GREATER_GODS: KrynnCharacter[] = [
  {
    id: 'paladine',
    name: 'Paladine',
    title: 'The Platinum Dragon — God of Good and Protection',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 450,
    AC: -10,
    MR: 95,
    category: 'krynn',
    type: 'greater god',
    divineRank: 'Greater God',
    domain: 'good, protection, justice, dragons',
    personality: 'He is the eldest of the gods of Krynn and the most patient, which is to say he has watched his sister destroy herself and the world she loved and he has not stopped loving her, which is either the definition of goodness or the definition of tragedy depending on how you look at it. He walks among mortals as Fizban the Fabulous, a doddering old wizard who forgets spells and shows up at precisely the right moment.',
    abilities: [
      'Platinum dragon form: the most powerful good dragon in existence',
      'Cannot directly intervene against mortal free will — divine compact',
      '95% MR',
      'All good-aligned divine magic at will — unlimited',
      'Dragon command: all good dragons answer his call',
      'Disguise perfect: as Fizban, no being has ever seen through his mortal form'
    ],
    str: '22', dex: '18', con: '25', int: '25', wis: '25', cha: '25',
    level: 'Greater God',
    phase1: 'Platinum dragon form. 95% MR. All good divine magic at will. Commands all good dragons.',
    phase2: 'Cannot violate mortal free will. Perfect disguise as Fizban — no being has ever seen through it.',
    phase3: 'THE PLATINUM DRAGON: Eldest god of Krynn. Has not stopped loving Takhisis. Watches his sister destroy herself and the world. Will not stop her. Cannot stop her. Must not stop her. This is the definition of goodness.'
  },
  {
    id: 'takhisis',
    name: 'Takhisis',
    title: 'The Dark Queen — Goddess of Evil and Domination',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 450,
    AC: -10,
    MR: 95,
    category: 'krynn',
    type: 'greater god',
    divineRank: 'Greater God',
    domain: 'evil, domination, dragons, shadows',
    personality: 'She is the shadow of her brother cast wrong, the love turned to ownership, the protection turned to prison. She wants Krynn the way a dragon wants gold — not for any purpose, just to have it, just to know it is hers, and she has spent eternity learning that the wanting never ends and the having never satisfies.',
    abilities: [
      'Five-headed dragon form: each head breathes different damage type',
      'Shadow self: can exist in multiple places simultaneously',
      '95% MR',
      'All evil-aligned divine magic at will — unlimited',
      'Dragon command: all chromatic dragons answer her call',
      'Corruption: can turn any being to evil by offering them what they want most'
    ],
    str: '24', dex: '18', con: '25', int: '25', wis: '20', cha: '25',
    level: 'Greater Goddess',
    phase1: 'Five-headed dragon form. 95% MR. All evil divine magic at will. Commands all chromatic dragons.',
    phase2: 'Shadow self: exists in multiple places. Corruption: turns beings evil by offering what they want most.',
    phase3: 'THE DARK QUEEN: Shadow of Paladine cast wrong. Wants Krynn as a dragon wants gold. The wanting never ends. The having never satisfies. She has not stopped loving her brother. This is the definition of tragedy.'
  },
  {
    id: 'sargonnas',
    name: 'Sargonnas',
    title: 'The Bull God — God of Vengeance and Fire',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 400,
    AC: -8,
    MR: 90,
    category: 'krynn',
    type: 'greater god',
    divineRank: 'Greater God',
    domain: 'vengeance, fire, minotaurs, honor (twisted)',
    personality: 'He is Takhisis consort and he hates her with the specific hatred of someone who has been bound to someone he cannot escape and cannot defeat and cannot stop wanting. He is the god of minotaurs and the god of vengeance, which means he serves the Dark Queen while planning her destruction, which is either the most loyal thing or the most treacherous depending on who wins.',
    abilities: [
      'Bull form: the most powerful minotaur in existence',
      'Fire mastery: all fire magic at 50th level effectiveness',
      '90% MR',
      'Vengeance aura: any being who has wronged him suffers double damage from his attacks',
      'Honor bound: cannot break his word once given — even to enemies',
      "Consort of Takhisis: bound to her, hates her, cannot escape her, cannot stop wanting her"
    ],
    str: '25', dex: '16', con: '24', int: '20', wis: '18', cha: '20',
    level: 'Greater God',
    phase1: 'Bull form. Fire mastery at 50th level. 90% MR.',
    phase2: 'Vengeance aura: wronged him, suffer double damage. Honor bound: cannot break his word.',
    phase3: 'THE BULL GOD: Consort of Takhisis. Hates her. Cannot escape her. Cannot stop wanting her. Serves her while planning her destruction. This is either loyalty or treachery depending on who wins.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN GODS OF MAGIC (3) - The Three Moons
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_GODS_OF_MAGIC: KrynnCharacter[] = [
  {
    id: 'solinari',
    name: 'Solinari',
    title: 'The White Moon — God of Good Magic',
    pantheon: 'Krynn',
    align: 'Lawful good',
    hp: 300,
    AC: -4,
    MR: 85,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'good magic, white robes, protection',
    personality: 'He is the youngest of the three gods of magic, born of Paladines light reflected in the first moon. He loves the Order of the White Robes as a father loves children who have chosen well, and he weeps when they fall, which is often, because good in Krynn has always been the hardest path.',
    abilities: [
      'White moon power: all good-aligned magic +2 levels during his moon phase',
      'Magic immunity: 85% MR',
      'Patron of White Robes: direct intervention possible for greatest servants',
      'Purification: can cleanse magical corruption from any being or item',
      'Cannot act against neutrality — bound by the magic compact'
    ],
    str: '14', dex: '18', con: '20', int: '24', wis: '24', cha: '22',
    level: 'Lesser God',
    phase1: 'White moon power: good magic +2 levels during his phase. 85% MR.',
    phase2: 'Patron of White Robes: intervention possible for greatest servants. Purification magic.',
    phase3: 'THE WHITE MOON: Loves his wizards as children. Weeps when they fall. Cannot act against neutrality — the compact binds all three gods of magic.'
  },
  {
    id: 'lunitari',
    name: 'Lunitari',
    title: 'The Red Moon — Goddess of Neutral Magic',
    pantheon: 'Krynn',
    align: 'Neutral',
    hp: 300,
    AC: -4,
    MR: 85,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'neutral magic, red robes, balance',
    personality: 'She walks between her brothers and loves neither and both and has decided that magic itself matters more than what it serves. The Red Robes are her children, and she asks only that they preserve the Art above all causes, which sounds simple until you realize that the Art requires mortality to practice it.',
    abilities: [
      'Red moon power: all neutral magic +2 levels during her moon phase',
      'Magic immunity: 85% MR',
      'Patron of Red Robes: direct intervention for those who preserve magical balance',
      'Illusion mastery: all illusions are real in her presence',
      'Keeper of the Balance: can strip any wizard of all magic permanently'
    ],
    str: '14', dex: '18', con: '20', int: '25', wis: '22', cha: '22',
    level: 'Lesser Goddess',
    phase1: 'Red moon power: neutral magic +2 levels during her phase. 85% MR.',
    phase2: 'Patron of Red Robes. Illusion mastery: all illusions become real. Keeper of Balance.',
    phase3: 'THE RED MOON: Walks between her brothers. Loves magic more than what it serves. Can strip any wizard of all power. The Art requires mortality.'
  },
  {
    id: 'nuitari',
    name: 'Nuitari',
    title: 'The Black Moon — God of Evil Magic',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 300,
    AC: -4,
    MR: 85,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'evil magic, black robes, forbidden knowledge',
    personality: 'He is the hunger that magic leaves in the soul, the desire for more that has ruined more wizards than all wars combined. He loves the Black Robes the way fire loves wood — not with affection, but with appetite. He is his mothers son, and he has inherited her need to possess.',
    abilities: [
      'Black moon power: all evil magic +2 levels during his moon phase',
      'Magic immunity: 85% MR',
      'Patron of Black Robes: grants forbidden knowledge to those who serve',
      'Sight of the Black Moon: invisible to all but Black Robes and gods',
      'Corruption of magic: can turn any good spell to evil purpose'
    ],
    str: '14', dex: '18', con: '20', int: '25', wis: '20', cha: '20',
    level: 'Lesser God',
    phase1: 'Black moon power: evil magic +2 levels during his phase. 85% MR.',
    phase2: 'Patron of Black Robes. Invisible to all but Black Robes and gods. Grants forbidden knowledge.',
    phase3: 'THE BLACK MOON: The hunger magic leaves in the soul. Loves Black Robes as fire loves wood. His mothers son. Has inherited her need to possess.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN DRAGONS (3) - The Great Dragons of the War
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_DRAGONS: KrynnCharacter[] = [
  {
    id: 'khellendros',
    name: 'Khellendros',
    title: 'Skie — The Greatest Blue Dragon',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 320,
    AC: -6,
    MR: 60,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'blue dragons, storm, loyalty',
    personality: 'He is called Skie by the woman who rides him, which is a name he has accepted because names given by those you love become true. He has served Kitiara through wars and deaths and betrayals, and he has served willingly, which is the only way a dragon as old as he would serve anything at all.',
    abilities: [
      'Lightning breath: 100ft line, 16d10 damage (save halves)',
      'Storm mastery: controls weather within 10 miles',
      '60% MR',
      'Rider bond: +3 all rolls when Kitiara is mounted',
      'Wing buffet: knocks down all within 50ft',
      'Ancient wisdom: has seen empires rise and fall, remembers all'
    ],
    str: '24', dex: '14', con: '24', int: '20', wis: '18', cha: '16',
    level: 'Ancient Blue Dragon',
    phase1: 'Lightning breath 16d10. Storm mastery 10 miles. 60% MR.',
    phase2: 'Rider bond with Kitiara: +3 all rolls. Wing buffet knocks down 50ft radius.',
    phase3: 'SKIE: Has served Kitiara through wars and deaths and betrayals. Served willingly. This is the only way a dragon as old as he would serve at all.'
  },
  {
    id: 'beryllinthranox',
    name: 'Beryllinthranox',
    title: 'The Green Dragon Overlord',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 290,
    AC: -5,
    MR: 55,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'green dragons, forest, poison',
    personality: 'She is the intelligence of green dragons made vast and terrible, which means she prefers to destroy through patience rather than fire, through poison rather than claw, through the slow death of forests rather than the quick death of battles. She has time. She has always had time.',
    abilities: [
      'Chlorine gas breath: 60ft cone, 14d10 damage (save halves)',
      'Forest mastery: controls all plant life within 5 miles',
      '55% MR',
      'Poison aura: all within 100ft save vs poison or take 2d10 damage per round',
      'Camouflage: invisible in any forest environment',
      'Patient destruction: can wait centuries for revenge'
    ],
    str: '22', dex: '16', con: '24', int: '22', wis: '18', cha: '12',
    level: 'Great Green Dragon',
    phase1: 'Chlorine gas 14d10. Forest mastery 5 miles. 55% MR. Poison aura.',
    phase2: 'Invisible in forests. Controls all plant life. Prefers slow destruction to quick.',
    phase3: 'THE GREEN OVERLORD: Has time. Has always had time. Prefers patience to fire, poison to claw, slow death to quick.'
  },
  {
    id: 'malystryx',
    name: 'Malystryx',
    title: 'Malystryx — The Red Dragon Overlord',
    pantheon: 'Krynn',
    align: 'Chaotic evil',
    hp: 350,
    AC: -7,
    MR: 65,
    category: 'krynn',
    type: 'demigod',
    divineRank: 'Demigod',
    domain: 'red dragons, fire, destruction',
    personality: 'She is fire given thought and appetite, which is to say she is what dragons become when they stop pretending they are anything but hunger with wings. She has burned nations because they were there. She will burn more because they will be there. This is not evil to her. This is simply what fire does.',
    abilities: [
      'Fire breath: 120ft cone, 20d10 damage (save halves)',
      'Fire immunity: heals from fire instead of taking damage',
      '65% MR',
      'Heat aura: all within 200ft take 3d10 fire damage per round',
      'Volcanic command: can summon and control lava flows',
      'Indestructible by fire: fire heals her, she heals fire'
    ],
    str: '26', dex: '14', con: '26', int: '18', wis: '14', cha: '14',
    level: 'Great Red Dragon',
    phase1: 'Fire breath 20d10. Heals from fire. 65% MR. Heat aura 200ft.',
    phase2: 'Volcanic command: controls lava. Fire heals her. She heals fire.',
    phase3: 'THE RED OVERLORD: Fire given thought and appetite. Hunger with wings. Burns nations because they are there. This is not evil to her. This is what fire does.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN ADDITIONAL GODS (2)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_ADDITIONAL_GODS: KrynnCharacter[] = [
  {
    id: 'habbakuk',
    name: 'Habbakuk',
    title: 'The Fisher King — God of the Sea and Animals',
    pantheon: 'Krynn',
    align: 'Neutral good',
    hp: 340,
    AC: -3,
    MR: 70,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'sea, animals, healing, nature',
    personality: 'He is the god who chose to become a king who fishes, which sounds humble until you realize that the sea contains everything that lives and most of what dies, and he has been fishing both for longer than nations have existed. He loves rangers the way some gods love paladins — as the hands that do the work he cannot do directly.',
    abilities: [
      'Sea mastery: controls all ocean life within 1000 miles',
      'Animal friendship: all natural animals obey him without question',
      '70% MR',
      'Healing touch: cures any natural disease or wound',
      'Fisher King blessing: rangers in his service can speak with all animals'
    ],
    str: '18', dex: '18', con: '22', int: '18', wis: '22', cha: '20',
    level: 'Lesser God',
    phase1: 'Sea mastery: controls ocean life 1000 miles. Animal friendship. 70% MR.',
    phase2: 'Healing touch: cures natural disease/wounds. Fisher King blessing for rangers.',
    phase3: 'THE FISHER KING: The sea contains everything that lives and dies. He has been fishing both for longer than nations have existed. Loves rangers as hands that do his work.'
  },
  {
    id: 'sirrion',
    name: 'Sirrion',
    title: 'The Flame — God of Fire and Passion',
    pantheon: 'Krynn',
    align: 'Chaotic good',
    hp: 320,
    AC: -3,
    MR: 65,
    category: 'krynn',
    type: 'lesser god',
    divineRank: 'Lesser God',
    domain: 'fire, passion, creativity, change',
    personality: 'He is the fire that warms and the fire that destroys and he has never understood why people think these are different things. Passion creates. Passion destroys. The same flame does both, and Sirrion is that flame, and he loves mortals the way fire loves forests — with the absolute certainty that contact will change them forever.',
    abilities: [
      'Fire mastery: all fire magic at +4 levels',
      'Passion flame: can inspire any emotion in any being (no save)',
      '65% MR',
      'Creative fire: any art made in his presence becomes masterwork',
      'Destructive fire: can burn anything, even things that cannot burn'
    ],
    str: '16', dex: '20', con: '20', int: '18', wis: '18', cha: '24',
    level: 'Lesser God',
    phase1: 'Fire mastery +4 levels. Passion flame: inspire any emotion. 65% MR.',
    phase2: 'Creative fire: art becomes masterwork. Destructive fire: burns anything.',
    phase3: 'THE FLAME: Fire warms and fire destroys — he has never understood why people think these are different. Loves mortals the way fire loves forests.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// KRYNN MONSTERS (2)
// ═══════════════════════════════════════════════════════════════════════════

export const KRYNN_MONSTERS: KrynnCharacter[] = [
  {
    id: 'draconians',
    name: 'Draconians',
    title: 'The Corrupted Children — Dragon Army Soldiers',
    pantheon: 'Krynn',
    align: 'Lawful evil',
    hp: 45,
    AC: 4,
    MR: 10,
    category: 'krynn',
    type: 'monster',
    divineRank: 'Monster',
    domain: 'corruption, war, sacrifice',
    personality: 'They were made from the eggs of good dragons, corrupted by dark ritual into soldiers for Takhisis armies. They know what they were. They know what they are. Some hate their creators. Some hate themselves. All of them die badly — turning to stone or acid or explosive death, denying their killers even the satisfaction of a clean kill.',
    abilities: [
      'Death throes: Baaz turn to stone, Kapak to acid, Sivak explode 5d6, Aurak explode 10d6',
      'Winged flight (Sivak, Aurak only)',
      'Poison glands (Kapak only): saliva is paralytic poison',
      'Glide: can slow falls and travel short distances',
      'Corrupt origin: +2 saves vs good-aligned magic, -2 vs evil-aligned'
    ],
    str: '16', dex: '16', con: '16', int: '10', wis: '10', cha: '8',
    level: 'Various (2nd-8th fighter)',
    phase1: 'Death throes vary by type. Glide ability. +2 vs good magic.',
    phase2: 'Flight for Sivak/Aurak. Poison for Kapak. Corrupt origin grants resistance.',
    phase3: 'THE CORRUPTED: Made from good dragon eggs. Know what they were. Know what they are. Die badly — denying killers the satisfaction of a clean kill.'
  },
  {
    id: 'shadow_wights',
    name: 'Shadow Wights',
    title: 'The Forgotten Dead — Servants of Chemosh',
    pantheon: 'Krynn',
    align: 'Neutral evil',
    hp: 80,
    AC: 2,
    MR: 35,
    category: 'krynn',
    type: 'monster',
    divineRank: 'Monster',
    domain: 'shadow, forgetting, undeath',
    personality: 'They are what remains when the soul is taken and the memory is left to rot. They exist in the spaces between light, and they feed on the memory of their victims — not the flesh, not the soul, just the knowledge that the victim ever existed. After a shadow wight takes someone, no one remembers they were ever born.',
    abilities: [
      'Memory drain: victim must save or be forgotten by all who knew them',
      'Shadow form: 75% invisible in darkness, can pass through any opening',
      '35% MR',
      'Forgetfulness aura: creatures within 30ft forget why they are fighting',
      'Undead immunity: immune to charm, sleep, poison, cold, electricity'
    ],
    str: '12', dex: '20', con: '—', int: '12', wis: '14', cha: '6',
    level: 'Undead',
    phase1: 'Shadow form: 75% invisible in darkness. Passes through any opening. 35% MR.',
    phase2: 'Memory drain: victims are forgotten by all who knew them. Forgetfulness aura.',
    phase3: 'THE FORGOTTEN DEAD: Feed on memory, not flesh or soul. After a shadow wight takes someone, no one remembers they were ever born. This is worse than death.'
  }
]

// ═══════════════════════════════════════════════════════════════════════════
// ALL KRYNN CHARACTERS COMBINED
// ═══════════════════════════════════════════════════════════════════════════

export const ALL_KRYNN_CHARACTERS: KrynnCharacter[] = [
  ...KRYNN_GREATER_GODS,
  ...KRYNN_LESSER_GODS,
  ...KRYNN_DEMIGODS,
  ...KRYNN_HEROES,
  ...KRYNN_GODS_OF_MAGIC,
  ...KRYNN_DRAGONS,
  ...KRYNN_ADDITIONAL_GODS,
  ...KRYNN_MONSTERS
]

// Get portrait path for a Krynn character
export function getKrynnPortraitPath(character: KrynnCharacter): string {
  return `/portraits/krynn/${character.id}.png?v=3`
}

// Get Krynn character by ID
export function getKrynnCharacterById(id: string): KrynnCharacter | undefined {
  return ALL_KRYNN_CHARACTERS.find(c => c.id === id)
}

// Get Krynn character counts
export function getKrynnCharacterCounts(): { [key: string]: number } {
  return {
    all: ALL_KRYNN_CHARACTERS.length,
    'greater-gods': KRYNN_GREATER_GODS.length,
    'lesser-gods': KRYNN_LESSER_GODS.length,
    demigods: KRYNN_DEMIGODS.length,
    heroes: KRYNN_HEROES.length
  }
}
