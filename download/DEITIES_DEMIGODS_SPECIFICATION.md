# DEITIES & DEMIGODS — Mythworld Engine
## Complete Application Specification for Development Handoff

---

## PROJECT OVERVIEW

**Name:** DEITIES & DEMIGODS — Mythworld Engine  
**URL:** https://deities-and-demigods.vercel.app  
**GitHub:** https://github.com/jetdiaz8-byte/Deities-and-Demigods  
**Type:** Single-page D&D campaign game with AI DM narration

**Description:** A browser-based D&D campaign game where players control a party of mythological heroes. An AI DM (Gemini 2.5 Flash) narrates the story in Neil Gaiman's prose style, while Groq generates player action options. The game features a three-act structure with a randomly selected Greater God as the main antagonist whose identity is revealed progressively through clues.

---

## TECH STACK

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui components |
| **Database** | Neon PostgreSQL via Prisma ORM |
| **AI - DM Narration** | Google Gemini 2.5 Flash API |
| **AI - Action Options** | Groq API (llama-3.1-70b-versatile) |
| **TTS** | node-edge-tts (Microsoft voices) |
| **Deployment** | Vercel |
| **Runtime** | Node.js 20.x |

---

## ENVIRONMENT VARIABLES (Required)

```env
# Gemini API (DM Narration) - 1M tokens/day, resets midnight Pacific
GEMINI_API_KEY=your_gemini_api_key

# Groq API (Action Options)
GROQ_API_KEY=your_groq_api_key

# Neon PostgreSQL Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Next.js Auth Secret
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=https://deities-and-demigods.vercel.app
```

---

## KEY FILES STRUCTURE

```
src/
├── app/
│   ├── page.tsx                 # Main game component (~2900 lines)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Tailwind + custom styles
│   ├── api/
│   │   ├── game/route.ts        # Gemini DM API
│   │   ├── game-entities/route.ts # Entity fetching from DB
│   │   ├── tts/route.ts         # Text-to-speech endpoint
│   │   └── entities/route.ts    # Entity search API
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── game/
│       └── GameComponents.tsx   # HealthBar, DiceRoll, NarrativeSection
├── lib/
│   └── fallbackEntities.ts      # Fallback data if DB fails
prisma/
├── schema.prisma                # Database schema
├── seed.ts                      # Database seeding
ddg_database.json                # Source entity data (156 entities)
```

---

## CORE GAME MECHANICS

### 1. THREE-ACT CAMPAIGN STRUCTURE

| Act | Turns | Focus |
|-----|-------|-------|
| **Act I** | 1-6 | Party assembly, world introduction, vague antagonist hints |
| **Act II** | 7-14 | God encounters, clue gathering, antagonist identity hints |
| **Act III** | 15+ | Boss fight (3 phases), final confrontation, resolution |

### 2. PARTY COMPOSITION

- **Player selects 4-6 heroes** from available heroes
- Heroes can be from different pantheons
- Each hero has: HP, AC, MR (Magic Resistance), abilities, alignment
- **First hero selected** = Human-controlled player (makes choices)
- **Remaining heroes** = AI-controlled party members

### 3. ENTITY TYPES

| Type | Description | Source |
|------|-------------|--------|
| **Heroes** | Player characters (Arthur, Heracles, etc.) | `ddg_database.json` heroes section |
| **Demigods** | Powerful NPCs that can be encountered | `ddg_database.json` demigods section |
| **Lesser Gods** | Deities that can be summoned/encountered | `ddg_database.json` lesser_gods section |
| **Greater Gods** | Main antagonist candidates (45 total) | Hardcoded in `ALL_GREATER_GODS` array |
| **Monsters** | Combat encounters | `ddg_database.json` monsters section |

### 4. 45 GREATER GODS (Possible Antagonists)

Organized by pantheon:

**Greek (9):** Zeus, Hera, Athena, Ares, Apollo, Poseidon, Hades, Hermes, Aphrodite

**Norse (7):** Odin, Thor, Loki, Hel, Freya, Tyr, Balder

**Egyptian (6):** Ra, Osiris, Isis, Set, Thoth, Ptah

**Indian (4):** Shiva, Vishnu, Indra, Rudra

**Celtic (3):** The Dagda, Lugh, Silvanus

**Central American (3):** Quetzalcoatl, Tezcatlipoca, Tlaloc

**Finnish (2):** Ukko, Ahto

**Japanese (2):** Amaterasu, Izanagi

**Babylonian (1):** Marduk

**Nehwon (2):** Kos, Death

**Nonhuman (3):** Moradin, Corellon Larethian, Gruumsh

**Melnibonéan (1):** Arioch

**Cthulhu (2):** Cthulhu, Nyarlathotep

---

## AI SYSTEMS

### 1. GEMINI DM (Narration)

**Model:** `gemini-2.5-flash-preview-05-20`

**maxOutputTokens:**
- Opening scene: 4000 tokens
- Regular turns: 1800 tokens

**Response Format:** JSON with specific schema:

```json
{
  "story_summary": "string (1-3 paragraphs)",
  "dm_narration": "string (Neil Gaiman prose style)",
  "human_pc_id": "string|null",
  "human_pc_reason": "string",
  "npc_encounters": [{"npc_id": "string", "npc_name": "string", "encounter_type": "ENEMY|ALLY|BOSS", "behavior": "string", "pantheon": "string"}],
  "dice_rolls": [{"roller": "string", "die": "d20", "roll": 0, "dc": 0, "success": true, "notes": "string"}],
  "damage_dealt": [{"from": "string", "to": "string", "amount": 0, "type": "string"}],
  "injury_events": [{"pc_id": "string", "injury_id": "string|null", "description": "string"}],
  "state_updates": [{"pc_id": "string", "hp_delta": 0, "new_condition": null, "remove_condition": null, "dead": false}],
  "new_active_npcs": ["id"],
  "shard_event": {"invoked": false, "invoker_pc_id": null, "intended_god": null, "roll": 0, "success": false, "summoned_id": null, "summoned_name": null, "is_greater": false},
  "next_pc_id": "string|null",
  "pc_agreement": {"pc_id": "agreed|refused|undecided"},
  "boss_phase_trigger": false,
  "consequences": "string",
  "tension_note": "string",
  "item_drops": [{"id": "string", "name": "string", "type": "artifact|potion|equipment|scroll", "rarity": "common|uncommon|rare|legendary", "effect": "string", "icon": "string", "description": "string"}]
}
```

**Narration Style:**
- Neil Gaiman prose: lyrical, mythic, atmospheric
- Opening scene: 4-6 rich paragraphs
- Regular turns: 1-2 rich paragraphs
- Avoid repetition between turns
- Use British English spellings (colour, favour, etc.)

### 2. GROQ (Action Options)

**Model:** `llama-3.1-70b-versatile`
**max_tokens:** 800

Generates 4 action options for human player:
```json
[
  {"num": 1, "action": "string", "ability": "string", "align_note": "string"},
  {"num": 2, "action": "string", "ability": "string", "align_note": "string"},
  {"num": 3, "action": "string", "ability": "string", "align_note": "string"},
  {"num": 4, "action": "string", "ability": "string", "align_note": "string"}
]
```

### 3. TTS SYSTEM

**Engine:** node-edge-tts (Microsoft Azure voices)

**Available Voices:**
- `en-US-GuyNeural` (default)
- `en-US-ChristopherNeural`
- `en-GB-RyanNeural`
- `en-GB-ThomasNeural`

**Implementation:**
- TTS state synced to `displayedNarrative` (exact text shown on screen)
- Audio streamed via `/api/tts/route.ts`
- Play/pause/skip controls in UI

---

## SHARD SYSTEM

### What is a Shard?

A mysterious artifact that can summon deities. Each shard has:
- Name, origin story, color, glow effect
- Associated pantheon
- Power affinity (what types of gods it favors)

### Shard Types (20+ available)

| Shard | Pantheon | Power |
|-------|----------|-------|
| The Pale Shard | Primordial | Favors any god |
| The First Crack | Primordial | Favors chaotic gods |
| The Splinter of Before | Primordial | Favors elder gods |
| The Yggdrasil Wound | Norse | Favors Norse pantheon |
| The Eye of Cronos | Greek | Favors Greek Titans/Olympians |
| The Gorgon's Tear | Greek | Favors chthonic gods |
| The Feather of Ma'at | Egyptian | Favors Egyptian pantheon |
| The First Sunrise | Egyptian | Favors Ra and solar deities |
| The Dreamer's Fragment | Cthulhu | Favors Great Old Ones |
| The Nameless Mist | Cthulhu | Favors Outer Gods |
| The Black Rune Shard | Melnibonéan | Favors Chaos Lords |
| The Last Dragon's Heart | Melnibonéan | Favors Law |
| The Rat King's Crown | Nehwon | Favors neutral gods |
| The Skah Jordan Fragment | Nehwon | Favors thief gods |
| The Cauldron's Chip | Celtic | Favors Tuatha Dé Danann |
| The Stone of Destiny's Splinter | Celtic | Favors lawful Celtic gods |
| The Tenth Avatar's Tear | Indian | Favors Indian pantheon |
| The Jade Emperor's Reflection | Chinese | Favors Celestial Bureaucracy |
| Amaterasu's Hidden Spark | Japanese | Favors Japanese kami |
| Quetzalcoatl's Shed Scale | Central American | Favors Aztec/Mayan |
| Marduk's Tablet Shard | Babylonian | Favors Babylonian pantheon |

### Shard Mechanics

- **Charges:** Start with 3 charges
- **Summoning DC:** 10 for Lesser God, 15 for Greater God
- **Failure:** Summons wrong entity (could be hostile)
- **Charges restore:** Through story events, gifts from gods

---

## INJURY SYSTEM

### 26 Injury Types

Each injury has:
- Name, effect, stat modifiers
- Duration (turns remaining)
- Icon, type (physical/magic/poison/psionic)
- Cure method

### Injury Categories

| Type | Examples | Cure |
|------|----------|------|
| **Physical** | Broken Ribs, Concussion, Laceration | Natural healing, healing magic |
| **Magic** | Soul Burn, Mana Drain, Arcane Corruption | Dispel magic, divine intervention |
| **Poison** | Venom, Toxic Shock, Plague Touch | Antidote, healing magic |
| **Psionic** | Mind Fracture, Psychic Trauma | Mental rest, psionic healing |

### Sample Injuries

```typescript
const ALL_INJURIES = [
  { id: 'broken_ribs', name: 'Broken Ribs', effect: 'Painful breathing', modifier: { con: -2 }, turnsLeft: 6, icon: '🦴', type: 'physical', cure: 'Healing potion or magic' },
  { id: 'concussion', name: 'Concussion', effect: 'Disoriented, -2 INT', modifier: { int: -2 }, turnsLeft: 4, icon: '💫', type: 'physical', cure: 'Rest' },
  { id: 'soul_burn', name: 'Soul Burn', effect: 'Magic costs double HP', modifier: { magic_cost: 2 }, turnsLeft: 5, icon: '🔥', type: 'magic', cure: 'Divine healing' },
  { id: 'mind_fracture', name: 'Mind Fracture', effect: 'Cannot use psionic abilities', modifier: { psionic: 0 }, turnsLeft: 4, icon: '🧠', type: 'psionic', cure: 'Psionic restoration' },
  // ... 22 more
]
```

---

## ITEM SYSTEM

### Item Types

| Type | Description | Example |
|------|-------------|---------|
| **Artifact** | Powerful permanent items | Golden Fleece, Excalibur |
| **Potion** | Consumable healing/buffs | Healing Potion, Antidote |
| **Equipment** | Weapons/armor | Enchanted Sword, Magic Shield |
| **Scroll** | One-use magical effects | Scroll of Summoning |

### Item Acquisition Methods

| Method | Description |
|--------|-------------|
| `npc_encounter` | Gift from friendly NPC/lesser god |
| `monster_drop` | Dropped after combat victory |
| `battle` | Looted from battlefield |
| `conversation` | Earned through dialogue choices |
| `pickpocket` | Stolen (thief skill check) |
| `exploration` | Found in ruins/temples |
| `quest_reward` | Completing objectives |

### Sample Items

```typescript
const ALL_ITEMS: Item[] = [
  { id: 'golden_fleece', name: 'Golden Fleece', type: 'artifact', rarity: 'legendary', effect: 'Heal 2d8 HP per turn, immune to fear', modifier: { regen: 8, fear_immune: 1 }, charges: 99, icon: '🐏', description: 'The legendary fleece of the ram that saved Phrixus.', acquisition: ['quest_reward', 'exploration'], source: 'Greek pantheon', value: 20000 },
  { id: 'potion_healing', name: 'Healing Potion', type: 'potion', rarity: 'common', effect: 'Restore 3d8+3 HP', charges: 1, icon: '🧪', description: 'A red potion that glows faintly.', acquisition: ['npc_encounter', 'monster_drop', 'pickpocket'], source: 'Any', value: 50 },
  // ... 33 more items
]
```

---

## ANTAGONIST CLUE SYSTEM

### Progressive Revelation

Clues are revealed across acts with increasing specificity:

| Act | Clue Type | Specificity | Example |
|-----|-----------|-------------|---------|
| **Act I** | Shadow, Pantheon (vague) | Vague | "The shadow falls long..." |
| **Act II** | Domain, Symbol, Alignment | Moderate | "A symbol appears: [SYMBOL]..." |
| **Act III** | Name, Identity | Specific | "I am [NAME]..." |

### Clue Template Variables

When generating clues, replace these placeholders:
- `[PANTHEON]` → Antagonist's pantheon
- `[DOMAIN]` → Antagonist's domain
- `[SYMBOL]` → Antagonist's symbol
- `[ALIGNMENT]` → Antagonist's alignment
- `[NAME]` → Antagonist's name
- `[FIRST_LETTER]` → First letter of name
- `[VISUAL_HINT]` → Description of true form
- `[COUNTER]` → Weakness or counter-strategy

### Clue Triggers

Clues can be triggered by:
- Opening scene
- First NPC encounter
- Any god encounter
- Exploration
- Shard interaction
- Rest/dreams
- Combat encounters
- Quest completion
- Oracle conversation
- End of act transitions

---

## BOSS FIGHT SYSTEM

### 3-Phase Boss Structure

| Phase | HP Range | Mechanics |
|-------|----------|-----------|
| **Phase 1** | 100% - 66% | Basic abilities, introduces fighting style |
| **Phase 2** | 66% - 33% | Summons allies, environmental effects, signature attacks |
| **Phase 3** | 33% - 0% | Ultimate form, domain manipulation, final mechanics |

### Boss Stats Example (Zeus)

```typescript
{
  id: 'zeus',
  name: 'Zeus',
  title: 'Lord of Olympus',
  pantheon: 'Greek',
  align: 'Chaotic neutral',
  hp: 400,
  AC: -5,
  MR: 95,
  phase1: 'Lightning bolt barrage — 100 dice/day. Shape change at will.',
  phase2: 'Summons 1d10 titans. Divine storm 500yd radius, all saves at -2.',
  phase3: 'TRUE FORM: sky darkens, 3 bolts/round + divine storm, all saves at -4.',
  personality: 'Arrogant, lustful, ultimately just.',
  domain: 'sky, thunder, kingship',
  symbol: 'lightning bolt, eagle, bull'
}
```

---

## DATABASE SCHEMA (Prisma)

```prisma
model Entity {
  id          String   @id
  name        String
  title       String?
  epithet     String?
  pantheon    String
  align       String
  hp          Int
  maxHp       Int
  AC          Int
  MR          Int
  abilities   String[]
  personality String?
  type        String?  // hero, demigod, lesser_god, greater_god, monster
  category    String?
  conditions  String[]
  dead        Boolean  @default(false)
  portrait    String?
  str         String?
  int         String?
  wis         String?
  dex         String?
  con         String?
  cha         String?
  level       String?
  attacks     Int?
  damage      String?
  move        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([pantheon])
  @@index([type])
}
```

---

## SAVE/LOAD SYSTEM

### Save Slots

- **5 save slots** available
- Each slot stores: timestamp, turn, act, party names
- Saves to localStorage
- Export/import as JSON file

### Game State Structure

```typescript
interface GameState {
  shardEntry: { name: string, origin: string, color: string, glow: string, pantheon?: string, power?: string } | null
  shardCharges: number
  shardSummoned: string[]
  shardDark: boolean
  pendingShardSummon: string | null
  act: string
  turn: number
  log: { msg: string, type: string, turn: number }[]
  ended: boolean
  isProcessing: boolean
  antagonistId: string | null
  antagonistHp: number
  antagonistMaxHp: number
  antagonistPhase: number
  antagonistKnown: { pantheon?: string, alignment?: string, domain?: string, symbol?: string, name?: string }
  pcs: Entity[]
  activeNpcs: Entity[]
  pcQueue: Entity[]
  currentPcIndex: number
  items: Item[]
  injuries: { [pcId: string]: Injury[] }
  quests: Quest[]
  journal: string[]
}
```

---

## UI COMPONENTS

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Act/Turn | Token Count | Audio Controls     │
├─────────────────────────────────────────────────────────────┤
│  NARRATIVE AREA (ScrollArea, parchment background)          │
│  - DM narration with paragraph formatting                    │
│  - Inline dice roll animations                               │
├─────────────────────────────────────────────────────────────┤
│  ACTION OPTIONS (4 buttons, generated by Groq)               │
├─────────────────────────────────────────────────────────────┤
│  PARTY PANEL | NPC PANEL | INVENTORY | QUESTS | JOURNAL     │
│  (Tabbed sidebar or bottom sheet)                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| `NarrativeSection` | Displays DM narration with fade-in animation |
| `HealthBar` | HP visualization with color gradients |
| `VisualDiceRoll` | Animated d20 roll display |
| `TokenCounter` | Gemini API token usage display |
| `ShardCard` | Shard display with glow effect |
| `EntityCard` | Character/NPC stat card |

---

## STYLING

### Color Palette

```css
--parchment: #f4e8d3
--parchment-dark: #d4c4a8
--ink: #2c1810
--gold: #c9a84c
--blood: #8b0000
--magic: #4a0080
```

### Typography

- **Narrative:** Serif font, justified text
- **UI:** Sans-serif, left-aligned
- **Headings:** Display font, centered

### Animations

- Paragraph fade-in on new content
- Dice roll shake animation
- HP bar smooth transitions
- Glow effects on shard

---

## API ROUTES

### POST /api/game

**Purpose:** Main game API for DM narration

**Request:**
```json
{
  "narrative": "current narrative context",
  "choice": "player's selected action",
  "gameState": { ... },
  "isOpening": false
}
```

**Response:** Gemini JSON response (see schema above)

### GET /api/game-entities

**Purpose:** Fetch entities for game

**Query Parameters:**
- `type`: hero | demigod | lesser_god | greater_god | monster
- `pantheon`: Greek | Norse | Egyptian | etc.

**Response:** Array of Entity objects

### POST /api/tts

**Purpose:** Generate text-to-speech audio

**Request:**
```json
{
  "text": "narration to speak",
  "voice": "en-US-GuyNeural"
}
```

**Response:** Audio stream (audio/mpeg)

---

## ERROR HANDLING

### Template Fallbacks

If Gemini API fails, use template narrations:

```typescript
const TEMPLATE_NARRATIONS = [
  "The air grows heavy with divine presence. {pc.name} feels the weight of destiny pressing down. Something ancient stirs, watching from beyond the veil of mortal sight.",
  "Through the shadows, a figure approaches. Neither friend nor foe—yet. The gods themselves seem to hold their breath.",
  // ... more templates
]
```

### Entity Fallbacks

If database fails, use `fallbackEntities.ts` with hardcoded entities.

---

## KNOWN ISSUES / TODO

1. **Narration repetition** - Template fallbacks sometimes repeat. Need more varied templates.

2. **Gemini API rate limits** - 1M tokens/day, resets at midnight Pacific. Show token counter.

3. **TTS sync** - Ensure TTS reads exactly what's displayed (`displayedNarrative` state).

4. **Psionic damage** - Implemented in injury system but not fully utilized in combat.

5. **Pickpocketing** - Item acquisition method exists but needs UI for thief skills.

---

## DEVELOPMENT COMMANDS

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database
npx prisma db seed

# Run Prisma Studio
npx prisma studio

# Generate Prisma client
npx prisma generate
```

---

## DEPLOYMENT (Vercel)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

**Current deployment:** https://deities-and-demigods.vercel.app

---

## HANDOFF PROMPT FOR CLAUDE

```
You are taking over development of "DEITIES & DEMIGODS — Mythworld Engine", a D&D campaign game deployed at https://deities-and-demigods.vercel.app.

GitHub Repository: https://github.com/jetdiaz8-byte/Deities-and-Demigods

TECH STACK: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, Neon PostgreSQL, Gemini 2.5 Flash (DM narration), Groq (action options), node-edge-tts (text-to-speech).

KEY FEATURES:
- 45 Greater Gods as possible antagonists (randomly selected at game start, identity revealed through clues in Act III)
- 20+ shard types for summoning deities
- 26 injury types (physical, magic, poison, psionic)
- 35+ items acquired through multiple methods (NPC, battle, conversation, pickpocketing)
- 3-phase boss fights
- AI DM narration in Neil Gaiman prose style
- Full TTS integration

MAIN FILES:
- src/app/page.tsx - Main game component (~2900 lines)
- src/app/api/game/route.ts - Gemini DM API
- src/app/api/tts/route.ts - Text-to-speech
- ddg_database.json - Source entity data

The Gemini API key refreshes daily (1M tokens/day at midnight Pacific). The GitHub Personal Access Token for deployment is available in the previous conversation history.

Read the specification at /home/z/my-project/download/DEITIES_DEMIGODS_SPECIFICATION.md for complete details on all systems.

WHAT WOULD YOU LIKE TO WORK ON?
```

---

*Document Version: 1.0*  
*Last Updated: March 2025*
