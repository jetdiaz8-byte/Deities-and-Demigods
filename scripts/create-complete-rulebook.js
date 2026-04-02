const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
        ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

// Color scheme - Dark Fantasy Theme
const colors = {
  primary: '1A1F16', body: '2D3329', secondary: '4A5548', accent: 'C19A6B', tableBg: 'F8FAF7', white: 'FFFFFF'
};

const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: colors.secondary };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

// Helper functions
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const p = (text, opts = {}) => new Paragraph({ 
  spacing: { after: 200 }, 
  children: [new TextRun({ text, size: 22, font: 'Times New Roman', ...opts })] 
});
const bullet = (text, ref = 'main-bullets') => new Paragraph({
  numbering: { reference: ref, level: 0 },
  children: [new TextRun({ text, size: 22, font: 'Times New Roman' })]
});
const numbered = (text, ref) => new Paragraph({
  numbering: { reference: ref, level: 0 },
  children: [new TextRun({ text, size: 22, font: 'Times New Roman' })]
});

// Create table helper
const createTable = (headers, rows) => {
  const numCols = headers.length;
  const colWidth = Math.floor(9360 / numCols);
  const colWidths = Array(numCols).fill(colWidth);
  
  return new Table({
    columnWidths: colWidths,
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h => new TableCell({
          borders: cellBorders,
          shading: { fill: colors.tableBg, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 22 })] })]
        }))
      }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders: cellBorders,
          children: [new Paragraph({ 
            alignment: i === 0 ? AlignmentType.LEFT : (i === row.length - 1 ? AlignmentType.LEFT : AlignmentType.CENTER),
            children: [new TextRun({ text: cell, size: 20 })] 
          })]
        }))
      }))
    ]
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE DATA FROM GAME CODE
// ═══════════════════════════════════════════════════════════════════════════

const SHARDS = [
  { name: 'The Pale Shard', origin: 'A shepherd found it in a field three hundred years ago and kept it in a box not knowing why. It is warm to the touch. It has always been warm to the touch.', pantheon: 'Primordial', power: 'Favors any god' },
  { name: 'The First Crack', origin: 'Every mythology has a word for it, and they all disagree about what it means. The Norse say it is where Yggdrasil first split. The Greeks say it is older than Yggdrasil. Both are right. Neither is right.', pantheon: 'Primordial', power: 'Favors chaotic gods' },
  { name: 'The Splinter of Before', origin: 'Before the gods. Before the myths. Before belief gave things names, this existed. It is not a piece of something. It is a piece of when something had not yet decided what to be.', pantheon: 'Primordial', power: 'Favors elder gods' },
  { name: 'The Yggdrasil Wound', origin: 'Not a shard. A wound in the world-tree that never closed, mistaken by later scholars for a shard because the mind requires things to have edges. It has no edges. It only looks like it does.', pantheon: 'Norse', power: 'Favors Norse pantheon' },
  { name: 'The Eye of Cronos', origin: 'When Zeus overthrew his father, a single eye fell from Cronos\'s crown and became this shard. It remembers being part of something that ruled before the Olympians. It wants to rule again.', pantheon: 'Greek', power: 'Favors Greek Titans and Olympians' },
  { name: 'The Gorgon\'s Tear', origin: 'Medusa wept once, before her curse, before her monstrosity. This crystallized tear holds that moment—when she was still beautiful, still mortal, still capable of grief.', pantheon: 'Greek', power: 'Favors chthonic gods' },
  { name: 'The Feather of Ma\'at', origin: 'When Anubis weighs hearts against the feather of truth, sometimes the heart is heavier. This shard is the difference—the accumulated weight of every soul ever judged.', pantheon: 'Egyptian', power: 'Favors Egyptian pantheon, bonus to lawful gods' },
  { name: 'The First Sunrise', origin: 'Ra\'s first dawn was not gentle. It was violent—the moment when darkness was torn apart and replaced with something that burned. This shard is that tear. It still burns.', pantheon: 'Egyptian', power: 'Favors Ra and solar deities' },
  { name: 'The Dreamer\'s Fragment', origin: 'Cthulhu dreams in R\'lyeh, and those dreams leak into reality. This shard is crystallized nightmare—a dream that escaped and forgot how to end.', pantheon: 'Cthulhu', power: 'Favors Great Old Ones, high risk of hostile summons' },
  { name: 'The Nameless Mist', origin: 'Before names, there was mist. The mist that spawned Cthulhu, that spawned Nyarlathotep. This is a piece of that primordial fog, compressed into something almost solid.', pantheon: 'Cthulhu', power: 'Favors Outer Gods' },
  { name: 'The Black Rune Shard', origin: 'Elric of Melniboné carried Stormbringer, and Stormbringer fed on souls. This shard is what remains of the first soul the black blade ever consumed. It is still screaming.', pantheon: 'Melnibonéan', power: 'Favors Chaos Lords (Arioch, Xiombarg)' },
  { name: 'The Last Dragon\'s Heart', origin: 'When the last dragon of Melniboné died, its heart did not stop. It became this shard, still beating, still dreaming of fire and flight.', pantheon: 'Melnibonéan', power: 'Favors Law (Donblas, Arkyn)' },
  { name: 'The Rat King\'s Crown', origin: 'In the sewers beneath Lankhmar, the Rat King found something. A crown of bone and shadow that made rats obey. The shard broke from that crown.', pantheon: 'Nehwon', power: 'Favors neutral gods and tricksters' },
  { name: 'The Skah Jordan Fragment', origin: 'Fafhrd and the Gray Mouser once robbed a temple of something that should not have been there. This shard broke from their prize.', pantheon: 'Nehwon', power: 'Favors thief gods and luck deities' },
  { name: 'The Cauldron\'s Chip', origin: 'The Dagda\'s cauldron fed armies and never emptied. Once, a single chip fell from its rim. That chip became this shard. It remembers what it means to be whole.', pantheon: 'Celtic', power: 'Favors Celtic Tuatha Dé Danann' },
  { name: 'The Stone of Destiny\'s Splinter', origin: 'The Lia Fáil screams when a true king touches it. This shard fell from it during one such scream. It has been silent ever since, waiting for the right hand.', pantheon: 'Celtic', power: 'Favors lawful Celtic gods' },
  { name: 'The Tenth Avatar\'s Tear', origin: 'When Kalki, the final avatar of Vishnu, shall end the world, a single tear will fall. This shard is that tear, fallen backward through time. It knows how everything ends.', pantheon: 'Indian', power: 'Favors Indian pantheon, Trimurti' },
  { name: 'The Jade Emperor\'s Reflection', origin: 'In the Heavenly Court, the Jade Emperor gazed into a mirror of starlight. His reflection stepped out and became this shard. It thinks it is the Emperor.', pantheon: 'Chinese', power: 'Favors Chinese Celestial Bureaucracy' },
  { name: 'Amaterasu\'s Hidden Spark', origin: 'When Amaterasu hid in a cave, the world went dark. But one spark of her light escaped and became this shard. It has been looking for her ever since.', pantheon: 'Japanese', power: 'Favors Japanese kami, solar deities' },
  { name: 'Quetzalcoatl\'s Shed Scale', origin: 'The Feathered Serpent sheds his skin once an age. This scale fell from that shedding, still warm, still golden, still remembering what it meant to be part of a god.', pantheon: 'Central American', power: 'Favors Aztec/Mayan pantheon, good-aligned gods' },
  { name: 'Marduk\'s Tablet Shard', origin: 'When Marduk wrote the laws of heaven on tablets of lapis lazuli, one tablet cracked. This shard holds those lost laws—commandments that were never spoken.', pantheon: 'Babylonian', power: 'Favors Babylonian pantheon, lawful gods' }
];

const INJURIES = {
  Physical: [
    { name: 'Deep Cut', effect: '-1 to all attack rolls', cure: 'Rest 2 turns or Cure Light Wounds' },
    { name: 'Bruised Ribs', effect: '-2 to DEX saves and movement', cure: 'Rest 3 turns' },
    { name: 'Concussion', effect: '-4 to INT checks, -1 to all saves', cure: 'Rest 5 turns or Cure Light Wounds' },
    { name: 'Crushed Hand', effect: '-2 attack rolls, no two-handed weapons', cure: 'Cure Serious Wounds or Rest 10 turns' },
    { name: 'Broken Limb', effect: 'Cannot use one arm/leg, -4 AC', cure: 'Cure Serious Wounds or week of rest' },
    { name: 'Internal Bleeding', effect: '-3 HP at start of each turn', cure: 'Cure Serious Wounds' },
    { name: 'Lacerated Eye', effect: '-4 to ranged attacks, -2 perception', cure: 'Cure Serious Wounds' },
    { name: 'Severed Tendon', effect: 'Movement halved, -3 DEX', cure: 'Cure Critical Wounds or Regenerate' }
  ],
  Magic: [
    { name: 'Arcane Burn', effect: '-2 saves vs magic, spells at -1 level', cure: 'Dispel Magic + Cure Light Wounds' },
    { name: 'Soul Fracture', effect: '-3 saves vs death, cannot be raised', cure: 'Restoration spell' },
    { name: 'Planar Taint', effect: 'Save at -2 each turn or lose 1 WIS', cure: 'Remove Curse + Cure Disease' },
    { name: 'Mana Drain', effect: 'No spells above 3rd level, -2 INT', cure: 'Rest 8 hours or Restoration' },
    { name: 'Eldritch Corrosion', effect: 'Magic items lose 1 charge/turn', cure: 'Mending + Dispel Evil' },
    { name: 'Spellscar', effect: 'Random spell fails each combat, -1 caster level', cure: 'Limited Wish or higher' }
  ],
  Poison: [
    { name: 'Weak Poison', effect: '-1 all rolls, -2 HP/turn for 4 turns', cure: 'Antitoxin or Neutralize Poison' },
    { name: 'Necrotic Venom', effect: '-2 CON permanently, -3 HP/turn', cure: 'Neutralize Poison + Restoration' },
    { name: 'Paralytic Toxin', effect: 'DEX halved, 20% paralyzed each turn', cure: 'Neutralize Poison or Antitoxin' },
    { name: 'Blood Toxin', effect: 'Cannot be healed by magic', cure: 'Neutralize Poison' },
    { name: 'Mind Poison', effect: '-3 WIS, -3 INT, save or confused', cure: 'Neutralize Poison + Heal' },
    { name: 'Acid Burn', effect: '-2 AC, -1 saves, -1 HP/turn', cure: 'Neutralize Poison or water flush' }
  ],
  Psionic: [
    { name: 'Mental Fatigue', effect: '-2 INT/WIS checks, psionic power halved', cure: 'Rest 8 hours' },
    { name: 'Psychic Trauma', effect: 'Random phobia, -3 CHA', cure: 'Heal or Cure Insanity' },
    { name: 'Mind Bleed', effect: '-1 all saves, 10% spell failure', cure: 'Restoration or Psychic Surgery' },
    { name: 'Ego Fracture', effect: 'CHA halved, cannot use psionics', cure: 'Heal + Restoration' },
    { name: 'Thought Burn', effect: 'Cannot memorize new spells, -4 INT saves', cure: 'Restoration or Psychic Surgery' },
    { name: 'Psionic Shock', effect: 'Stunned 1d4 rounds on failed save, -3 WIS', cure: 'Heal or 24 hours rest' }
  ]
};

const ITEMS = {
  Potions: [
    { name: 'Healing Potion', rarity: 'Common', effect: 'Restore 2d8+4 HP', value: 50 },
    { name: 'Greater Healing Potion', rarity: 'Uncommon', effect: 'Restore 4d8+8 HP', value: 200 },
    { name: 'Elixir of Heroism', rarity: 'Rare', effect: '+2 to all saves for 10 turns', value: 1000 },
    { name: 'Ambrosia', rarity: 'Legendary', effect: 'Full HP, cure all injuries', value: 5000 },
    { name: 'Antitoxin', rarity: 'Common', effect: 'Cure poison injuries', value: 75 },
    { name: 'Universal Antidote', rarity: 'Uncommon', effect: 'Cure poison and psionic injuries', value: 500 },
    { name: 'Potion of Giant Strength', rarity: 'Rare', effect: 'STR becomes 18/00 for 1 hour', value: 800 },
    { name: 'Potion of Invisibility', rarity: 'Rare', effect: 'Invisible 1 hour or until attack', value: 1000 }
  ],
  Artifacts: [
    { name: 'Mysterious Key', rarity: 'Rare', effect: 'Opens unknown doors (3 charges)', value: 500 },
    { name: 'Aegis Fragment', rarity: 'Legendary', effect: 'Absorb next lethal blow once', value: 10000 },
    { name: 'Golden Fleece', rarity: 'Legendary', effect: 'Heal 2d8 HP/turn, immune to fear', value: 20000 },
    { name: 'Odin\'s Runestaff', rarity: 'Legendary', effect: 'Cast any 1st-3rd spell 1/day', value: 12000 },
    { name: 'Eye of Horus', rarity: 'Legendary', effect: 'See invisible, immune to illusions', value: 8000 },
    { name: 'Stormbringer Shard', rarity: 'Legendary', effect: '+20 damage, steals 1d6 HP/hit', value: 25000 },
    { name: 'Bracelets of Submission', rarity: 'Rare', effect: 'CHA +4, Dominate Person 1/day', value: 3000 },
    { name: 'Bag of Holding', rarity: 'Rare', effect: 'Carry 500 lbs without weight', value: 2000 }
  ],
  Equipment: [
    { name: 'Mithral Chain', rarity: 'Rare', effect: 'AC -2, no DEX penalty', value: 2000 },
    { name: 'Flame Blade', rarity: 'Uncommon', effect: '+5 fire damage, lights 30ft', value: 800 },
    { name: 'Frost Brand', rarity: 'Rare', effect: '+8 cold damage, extinguishes fires', value: 1500 },
    { name: 'Vorpal Blade', rarity: 'Legendary', effect: 'Natural 20 beheads instantly, +10 damage', value: 30000 },
    { name: 'Boots of Speed', rarity: 'Rare', effect: 'Double movement, +2 AC', value: 2500 },
    { name: 'Cloak of Displacement', rarity: 'Uncommon', effect: 'First attack auto-misses, +2 AC', value: 1000 },
    { name: 'Hammer of Storms', rarity: 'Legendary', effect: '+15 damage, stuns on crit', value: 15000 }
  ],
  Scrolls: [
    { name: 'Scroll of Divine Wisdom', rarity: 'Uncommon', effect: 'Reveal hidden truths about one entity', value: 300 },
    { name: 'Scroll of Protection from Evil', rarity: 'Uncommon', effect: '-2 enemy saves, +2 saves vs evil', value: 400 },
    { name: 'Scroll of Protection from Undead', rarity: 'Rare', effect: 'Undead cannot approach 10ft', value: 600 },
    { name: 'Scroll of Summoning', rarity: 'Rare', effect: 'Summon ally from shard pantheon', value: 1500 },
    { name: 'Scroll of Identification', rarity: 'Common', effect: 'Identify all properties of one item', value: 100 },
    { name: 'Scroll of Teleportation', rarity: 'Rare', effect: 'Teleport party to known location', value: 1000 }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// BUILD THE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Times New Roman', size: 22 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 72, bold: true, color: colors.primary, font: 'Times New Roman' }, paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: colors.primary, font: 'Times New Roman' }, paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: colors.secondary, font: 'Times New Roman' }, paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: colors.body, font: 'Times New Roman' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'main-bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'num-1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'num-2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'num-3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'num-4', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'num-5', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    // COVER PAGE
    {
      properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [
        new Paragraph({ spacing: { before: 2400 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'DEITIES & DEMIGODS', size: 72, bold: true, color: colors.primary, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'MYTHWORLD ENGINE', size: 48, color: colors.accent, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 800 }, children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: colors.secondary })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 800 }, children: [new TextRun({ text: 'COMPLETE RULEBOOK & PLAYER\'S GUIDE', size: 32, bold: true, color: colors.body, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: 'Everything You Need to Play', size: 24, italics: true, color: colors.secondary, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'API Setup • Game Mechanics • Shard System • Combat • Items • Strategies', size: 20, color: colors.secondary, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600 }, children: [new TextRun({ text: 'Based on AD&D 1st Edition Deities & Demigods (1980)', size: 20, color: colors.accent, font: 'Times New Roman' })] }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    // MAIN CONTENT
    {
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Deities & Demigods: Mythworld Engine — Player\'s Guide', size: 18, color: colors.secondary, font: 'Times New Roman' })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— ', size: 20, color: colors.secondary }), new TextRun({ children: [PageNumber.CURRENT], size: 20, color: colors.secondary }), new TextRun({ text: ' —', size: 20, color: colors.secondary })] })] }) },
      children: [
        // TOC
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'Table of Contents', size: 36, bold: true })] }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Note: Right-click the Table of Contents and select "Update Field" to refresh page numbers.', size: 18, color: '999999', italics: true })] }),
        new Paragraph({ children: [new PageBreak()] }),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART I: GETTING STARTED
        // ═══════════════════════════════════════════════════════════════════════════
        h1('PART I: GETTING STARTED'),
        p('This section covers everything you need to know before playing Mythworld Engine. Follow these steps to set up the game and begin your mythic adventure.'),
        
        h2('What You Need'),
        p('Before you can play, you need to obtain API keys that power the AI Dungeon Master. These are FREE and have generous usage limits.'),
        bullet('A modern web browser (Chrome, Firefox, Safari, Edge)'),
        bullet('A Google account (for Gemini API key)'),
        bullet('A Groq account (optional, for faster responses)'),
        bullet('5-10 minutes for initial setup'),

        h2('Obtaining Your Gemini API Key (REQUIRED)'),
        p('Gemini powers the AI Dungeon Master that narrates the story and controls the game. Without this key, the game cannot function.'),
        numbered('Visit aistudio.google.com in your web browser', 'num-1'),
        numbered('Sign in with your Google account (same as Gmail/YouTube)', 'num-1'),
        numbered('Accept the terms of service if prompted', 'num-1'),
        numbered('Click "Get API Key" in the left sidebar', 'num-1'),
        numbered('Click "Create API Key" and select/create a Google Cloud project', 'num-1'),
        numbered('Copy the API key (looks like: AIzaSy... - 39 characters)', 'num-1'),
        numbered('Store this key securely - you\'ll enter it into the game', 'num-1'),
        p(''),
        createTable(['Resource', 'Free Tier Limit'], [
          ['Requests per minute', '15'],
          ['Requests per day', '1,500'],
          ['Tokens per minute', '1,000,000'],
          ['Cost', 'FREE']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 1: Gemini API Free Tier Limits', size: 18, italics: true, color: colors.secondary })] }),

        h2('Obtaining Your Groq API Key (RECOMMENDED)'),
        p('Groq provides ultra-fast AI inference for generating action options. This makes the game more responsive. While optional, it significantly improves the experience.'),
        numbered('Visit console.groq.com in your web browser', 'num-2'),
        numbered('Sign up or sign in (supports email, Google, GitHub)', 'num-2'),
        numbered('Navigate to "API Keys" in the sidebar', 'num-2'),
        numbered('Click "Create API Key" and name it "Mythworld"', 'num-2'),
        numbered('Copy the API key immediately (looks like: gsk_... - 56 characters)', 'num-2'),
        numbered('You cannot view it again after closing the window!', 'num-2'),
        p(''),
        createTable(['Resource', 'Free Tier Limit'], [
          ['Requests per minute', '30'],
          ['Requests per day', '14,400'],
          ['Tokens per minute', '30,000'],
          ['Cost', 'FREE']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 2: Groq API Free Tier Limits', size: 18, italics: true, color: colors.secondary })] }),

        h2('Starting Your First Game'),
        numbered('Open the Mythworld Engine app in your browser', 'num-3'),
        numbered('Enter your Gemini API key in the "Gemini Key" field', 'num-3'),
        numbered('(Optional) Enter your Groq API key in the "Groq Key" field', 'num-3'),
        numbered('Click "Start New Campaign"', 'num-3'),
        numbered('Browse the randomly selected heroes and demigods', 'num-3'),
        numbered('Click on characters to add them to your party', 'num-3'),
        numbered('Click "Confirm Party" when ready', 'num-3'),
        numbered('A mysterious Shard will be assigned, and the game begins!', 'num-3'),
        p('Your API keys are stored locally in your browser and are never sent anywhere except directly to Google and Groq.'),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART II: THE SHARD SYSTEM
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART II: THE SHARD SYSTEM'),
        p('Central to every campaign is the Shard—a mysterious artifact from before the gods themselves. Understanding the Shard system is crucial to strategic play.'),
        
        h2('What is the Shard?'),
        p('The Shard is an ancient piece of primordial power that allows your party to summon gods and divine beings to aid you. Each Shard has unique lore, a pantheon it favors, and special properties that affect summoning results.'),
        
        h2('Using the Shard'),
        bullet('The Shard starts with 2 charges—use them wisely'),
        bullet('Declare which god or type of being you wish to summon'),
        bullet('A d20 roll is made against DC 10'),
        bullet('Success: The summoned being appears and aids your party'),
        bullet('Failure: Something else may appear—or nothing at all'),
        bullet('Some Shards have higher success rates with specific pantheons'),
        bullet('Charges are limited—save at least one for the final boss battle'),
        p(''),

        h2('Complete Shard Reference'),
        p('There are 21 unique Shards in Mythworld Engine. Each is randomly assigned at campaign start. Below is the complete reference:'),
        p(''),
        
        // Shard table
        createTable(['Shard Name', 'Pantheon', 'Special Power'], SHARDS.map(s => [s.name, s.pantheon, s.power])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 3: All 21 Shards and Their Properties', size: 18, italics: true, color: colors.secondary })] }),

        h2('Shard Origins (Lore)'),
        p('Each Shard has a unique origin story that adds flavor to your campaign. The AI Dungeon Master incorporates this lore into the narrative. Here are selected origins:'),
        p(''),
        ...SHARDS.slice(0, 6).map(s => new Paragraph({ spacing: { after: 150 }, children: [
          new TextRun({ text: s.name + ': ', bold: true, size: 22, font: 'Times New Roman' }),
          new TextRun({ text: s.origin, size: 22, font: 'Times New Roman', italics: true })
        ]})),
        p('(See the game for all 21 Shard origin stories...)'),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART III: GAME MECHANICS
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART III: GAME MECHANICS'),
        
        h2('The Three-Act Structure'),
        p('Every Mythworld Engine campaign follows a dramatic three-act structure. Understanding this helps you pace your resources and anticipate challenges.'),
        
        h3('Act I: The Awakening'),
        bullet('Party members introduced one at a time'),
        bullet('Shard artifact discovered and explained'),
        bullet('Antagonist appears only as rumors and shadows'),
        bullet('Initial quests and objectives established'),
        bullet('Duration: 5-10 turns'),
        p(''),

        h3('Act II: The Gathering Storm'),
        bullet('Full party assembled and active'),
        bullet('Gods and NPCs encountered regularly (1-2 per turn)'),
        bullet('Clues about antagonist revealed through encounters'),
        bullet('Shard can summon divine allies (use charges wisely)'),
        bullet('Side quests and character arcs develop'),
        bullet('Duration: 10-20 turns'),
        p(''),

        h3('Act III: The Divine Confrontation'),
        bullet('Antagonist identity revealed (a Greater God)'),
        bullet('Three-phase boss battle begins'),
        bullet('Phase 1: Standard divine powers'),
        bullet('Phase 2: Summons and area effects'),
        bullet('Phase 3: TRUE FORM - Ultimate power unleashed'),
        bullet('Victory or death awaits'),
        p(''),

        h2('Divine Ranks'),
        p('Characters are organized into divine ranks that determine power level:'),
        createTable(['Rank', 'HP Range', 'MR %', 'Description'], [
          ['Greater Gods', '300-450', '50-100%', 'Supreme deities ruling reality'],
          ['Lesser Gods', '200-350', '25-90%', 'Middle tier governing domains'],
          ['Demigods', '150-300', '0-85%', 'Threshold between mortal and divine'],
          ['Heroes', '50-150', 'Variable', 'Mortals of legendary stature'],
          ['Monsters', 'Varies', 'Varies', 'Beings outside divine hierarchy']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 4: Divine Ranks', size: 18, italics: true, color: colors.secondary })] }),

        h2('Combat System'),
        p('Combat uses the d20 system. Key mechanics:'),
        bullet('d20 roll vs Difficulty Class (DC) determines success'),
        bullet('Natural 20 = Critical success (always succeeds)'),
        bullet('Natural 1 = Critical failure (always fails)'),
        bullet('Armor Class (AC) determines hit difficulty (lower is better)'),
        bullet('Magic Resistance (MR) is % chance to negate spells'),
        bullet('Damage reduces HP; HP reaches 0 = death'),
        p(''),

        h2('Permadeath'),
        p('Death is permanent. When a character reaches 0 HP, they are gone forever. There is no resurrection. This makes tactical decisions meaningful and every encounter tense. Protect your party members and use healing items wisely.'),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART IV: INJURIES
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART IV: INJURY SYSTEM'),
        p('When characters take significant damage, they may suffer persistent Injuries. Each injury type requires specific cures and applies unique penalties.'),
        
        h2('Physical Injuries'),
        p('Caused by weapons, falls, and impacts. Cured by rest or healing magic.'),
        createTable(['Injury', 'Effect', 'Cure'], INJURIES.Physical.map(i => [i.name, i.effect, i.cure])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 5: Physical Injuries', size: 18, italics: true, color: colors.secondary })] }),

        h2('Magic Injuries'),
        p('Caused by spells and magical attacks. Cured by Dispel Magic and Restoration.'),
        createTable(['Injury', 'Effect', 'Cure'], INJURIES.Magic.map(i => [i.name, i.effect, i.cure])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 6: Magic Injuries', size: 18, italics: true, color: colors.secondary })] }),

        h2('Poison Injuries'),
        p('Caused by toxins and venomous creatures. Cured by Antitoxin or Neutralize Poison.'),
        createTable(['Injury', 'Effect', 'Cure'], INJURIES.Poison.map(i => [i.name, i.effect, i.cure])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 7: Poison Injuries', size: 18, italics: true, color: colors.secondary })] }),

        h2('Psionic Injuries'),
        p('Caused by mental attacks. Cured by Restoration or extended rest.'),
        createTable(['Injury', 'Effect', 'Cure'], INJURIES.Psionic.map(i => [i.name, i.effect, i.cure])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 8: Psionic Injuries', size: 18, italics: true, color: colors.secondary })] }),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART V: ITEMS
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART V: ITEMS'),
        p('Items are discovered through exploration, NPC encounters, combat, quest rewards, and pickpocketing. There are four categories with varying rarities.'),
        
        h2('Acquisition Methods'),
        bullet('NPC Encounter: Received from gods and other characters'),
        bullet('Monster Drop: Looted from defeated enemies'),
        bullet('Exploration: Found in dungeons and hidden locations'),
        bullet('Conversation: Obtained through dialogue'),
        bullet('Pickpocket: Stolen from NPCs'),
        bullet('Quest Reward: Given for completing objectives'),
        bullet('Battle: Earned through combat victory'),
        p(''),

        h2('Potions'),
        createTable(['Name', 'Rarity', 'Effect', 'Value'], ITEMS.Potions.map(i => [i.name, i.rarity, i.effect, i.value.toString()])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 9: Potions', size: 18, italics: true, color: colors.secondary })] }),

        h2('Artifacts'),
        createTable(['Name', 'Rarity', 'Effect', 'Value'], ITEMS.Artifacts.map(i => [i.name, i.rarity, i.effect, i.value.toString()])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 10: Artifacts', size: 18, italics: true, color: colors.secondary })] }),

        h2('Equipment'),
        createTable(['Name', 'Rarity', 'Effect', 'Value'], ITEMS.Equipment.map(i => [i.name, i.rarity, i.effect, i.value.toString()])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 11: Equipment', size: 18, italics: true, color: colors.secondary })] }),

        h2('Scrolls'),
        createTable(['Name', 'Rarity', 'Effect', 'Value'], ITEMS.Scrolls.map(i => [i.name, i.rarity, i.effect, i.value.toString()])),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 200 }, children: [new TextRun({ text: 'Table 12: Scrolls', size: 18, italics: true, color: colors.secondary })] }),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART VI: NPC INTERACTIONS
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART VI: NPC INTERACTIONS'),
        
        h2('NPC Types'),
        bullet('ENEMY: Hostile entities that will attack on sight'),
        bullet('ALLY: Friendly beings who may aid your party'),
        bullet('BOSS: Major antagonist encounter (Act III)'),
        p(''),

        h2('Important Rules'),
        bullet('Gods avoid direct combat unless provoked'),
        bullet('Characters with WIS > 15 cannot be deceived'),
        bullet('Ancient enmities between gods override all other considerations'),
        bullet('Alignment governs NPC behavior (Lawful/Chaotic, Good/Evil)'),
        bullet('Respectful dialogue improves relations with prideful deities'),
        p(''),

        h2('Alignment Reference'),
        createTable(['Alignment', 'Behavior'], [
          ['Lawful Good', 'Follows rules, helps others, honorable'],
          ['Neutral Good', 'Helps others, flexible about rules'],
          ['Chaotic Good', 'Helps others, values freedom over rules'],
          ['Lawful Neutral', 'Follows rules, neither helps nor harms'],
          ['Neutral', 'Balanced, goes with the situation'],
          ['Chaotic Neutral', 'Unpredictable, values personal freedom'],
          ['Lawful Evil', 'Follows rules, exploits others'],
          ['Neutral Evil', 'Exploits others, flexible about rules'],
          ['Chaotic Evil', 'Destroys, causes suffering, unpredictable']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 13: Alignment Reference', size: 18, italics: true, color: colors.secondary })] }),

        // ═══════════════════════════════════════════════════════════════════════════
        // PART VII: STRATEGIES
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('PART VII: STRATEGIES FOR SUCCESS'),
        
        h2('Party Composition'),
        bullet('Balance combat and diplomacy-focused characters'),
        bullet('Consider pantheon synergies—gods from same traditions may have relationships'),
        bullet('Demigods offer good balance of power and flexibility'),
        bullet('Watch alignment—chaotic and lawful characters may conflict'),
        p(''),

        h2('Shard Usage'),
        bullet('Save at least one charge for Act III boss battle'),
        bullet('Research your Shard\'s favored pantheon before summoning'),
        bullet('Consider summoning allies BEFORE boss fights, not during'),
        bullet('Failed summons may still produce unexpected allies'),
        p(''),

        h2('Combat Tactics'),
        bullet('Target enemy weaknesses when revealed'),
        bullet('Use defensive actions when heavily injured'),
        bullet('High-MR enemies are vulnerable to physical attacks'),
        bullet('Save your best resources for Phase 3 of boss fights'),
        p(''),

        h2('Social Encounters'),
        bullet('Read NPC personalities before engaging'),
        bullet('Exploit ancient enmities between gods'),
        bullet('Never lie to characters with WIS > 15'),
        bullet('Offerings and respect improve relations with deities'),
        p(''),

        h2('Resource Management'),
        bullet('Healing potions are precious—don\'t waste them'),
        bullet('Injuries persist until cured—address them promptly'),
        bullet('Gold accumulates; spend it when opportunities arise'),
        bullet('The AI DM remembers everything—choices have consequences'),
        p(''),

        // ═══════════════════════════════════════════════════════════════════════════
        // QUICK REFERENCE
        // ═══════════════════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        h1('QUICK REFERENCE CARD'),
        
        h2('Setup Checklist'),
        bullet('□ Get Gemini API key from aistudio.google.com'),
        bullet('□ Get Groq API key from console.groq.com (optional)'),
        bullet('□ Enter keys in the game'),
        bullet('□ Start New Campaign'),
        bullet('□ Select party members'),
        bullet('□ Confirm and begin!'),
        p(''),

        h2('Key Numbers'),
        createTable(['Stat', 'Value'], [
          ['Shard Charges (starting)', '2'],
          ['Summon Success DC', '10'],
          ['Natural 20', 'Critical Success'],
          ['Natural 1', 'Critical Failure'],
          ['Greater God HP', '300-450'],
          ['Lesser God HP', '200-350'],
          ['Demigod HP', '150-300'],
          ['Hero HP', '50-150'],
          ['WIS threshold for lie detection', '15']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 14: Quick Reference Numbers', size: 18, italics: true, color: colors.secondary })] }),

        h2('Act Summary'),
        createTable(['Act', 'Duration', 'Key Events'], [
          ['Act I', '5-10 turns', 'Party intro, Shard discovery'],
          ['Act II', '10-20 turns', 'Full party, god encounters, clues'],
          ['Act III', 'Final battle', 'Antagonist revealed, 3-phase boss']
        ]),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: 'Table 15: Act Summary', size: 18, italics: true, color: colors.secondary })] }),

        // Final
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', size: 24, color: colors.secondary })] }),
        new Paragraph({ spacing: { after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'May your legends echo through eternity.', size: 24, italics: true, color: colors.accent, font: 'Times New Roman' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '— The Mythworld Engine', size: 22, color: colors.secondary, font: 'Times New Roman' })] })
      ]
    }
  ]
});

// Generate
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/z/my-project/public/downloads/Mythworld_Complete_Rulebook.docx', buffer);
  console.log('Complete Rulebook created successfully!');
}).catch(err => console.error('Error:', err));
