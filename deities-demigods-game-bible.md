# Deities & Demigods — Game Bible

> **Last Updated:** 2026-04-21
> **Version:** v2.43.2
> **Engine:** Mythworld Engine (Next.js 16 + AI)

---

## 1. Game Identity

| Field | Value |
|---|---|
| **Title** | Deities & Demigods — Mythworld Engine |
| **Genre** | AI-driven mythological RPG |
| **Repo** | `jetdiaz8-byte/Deities-and-Demigods` |
| **Tech Stack** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TypeScript, Prisma |
| **AI Backend** | Google Gemini 2.5 Flash (narration) + optional Groq (action generation) |
| **Deploy** | Vercel (auto-deploy on push to main) |
| **License** | Private |

---

## 2. Design Philosophy

- **Mythological Authenticity:** All 155+ characters are drawn from real-world mythology (Greek, Norse, Egyptian, Babylonian, Chinese, Finnish, Mesopotamian, Lovecraftian, Dragonlance, Celtic, Indian, Japanese, Central American, Melnibonean, Nehwon, Zodiac).
- **AI-Driven Narrative:** The AI Dungeon Master writes every narration passage, generates contextual action options, and resolves combat — no pre-written scripts.
- **AD&D 1e Framework:** Character stats (HP, AC, MR, ability scores, exceptional strength) follow Advanced Dungeons & Dragons 1st Edition conventions.
- **Three-Act Structure:** Every campaign follows Act I (Gathering), Act II (Investigation), Act III (Confrontation) with automatic transitions.
- **Gold/Parchment/Crimson Aesthetic:** The entire UI uses a dark fantasy palette rooted in gold (#D4AF37), parchment (#F5E6C8), and crimson (#DC143C).

---

## 3. Game Mechanics Summary

### 3.1 Turn Cycle
1. **Choose Action** — 3 contextual options + free-text custom action
2. **AI Narrates Outcome** — 300+ word passage with d20 resolution
3. **State Updates** — HP, conditions, items, quests, Shard, prophecy
4. **Next Turn** — Success rate recalculation, DOT processing, new options

### 3.2 Success Rate Formula
```
successRate = 50 + min(livingPCs × 2, 10) + prophecyBonus
  + min(alliedGods × 3, 15) + min(pcRenown, 8) + min(pcPower, 10)
  + alignmentHarmony + min(mythicalImpact × 2, 12) + antagonistPenalty
```
Clamped to [5%, 95%].

### 3.3 Combat Resolution
- d20 roll modified by ability scores, equipment, situational factors
- Natural 20 = critical success, Natural 1 = critical failure
- All dice displayed in the Dice Tray (right panel, desktop)
- Combat Overlay provides full-screen tactical view with contextual actions

### 3.4 Shard System
- 28 Shards across 14 pantheons, randomly assigned at campaign start
- 2 charges, Lesser Summon (1 charge) or Greater Summon (all charges + shardDark)
- DC 10 invocation roll, names tracked to prevent re-summoning
- Darkened Shards restored via Miracle (Test of Faith)

### 3.5 Test of Faith
- Triggers: death save, boss phase transition, desperate odds (success rate < 40%)
- Safeguards: 1 miracle per PC, 2 max total, 10-turn cooldown, Act II+ only
- Roll 18-20: Miracle (+8 success rate, revive, Shard restore)
- Roll 4-17: Fate Holds (no change)
- Roll 1-3: Murphy's Law (-5 success rate, item loss, Shard darkens)

### 3.6 Prophecy System
- States: Dormant (+0), Awakening (+3), Manifesting (+5), Fulfilled (+8), Broken (-5)
- Assigned at campaign start, progresses through narrative actions
- Prophecy transfer on character death (successor PC inherits)

### 3.7 Companion System
- Second selected PC becomes designated Companion
- Affinity levels: Stranger → Acquaintance → Ally → Friend → Devoted (or Hostile)
- Companion generates own action options at higher affinity
- Alignment and pantheon affect affinity gains/losses

### 3.8 Antagonist System
- 53 candidates: Greater Gods, Super Monsters, legendary beings
- Identity hidden until Act III, revealed through progressive clues
- Act III boss battle: 3 phases with escalating abilities
- If previously banished: returns at full power, party gains Archrival Summon

### 3.9 Items & Equipment
- 35 items across 6 acquisition methods (NPC, monster drop, exploration, pickpocket, conversation, quest)
- Rarity tiers: Common, Uncommon, Rare, Legendary
- Categories: Consumable (10), Equipment (8), Special (3), Quest (14)
- No shops — all items earned through play

### 3.10 Injuries
- 28 unique injuries across 5 categories (Physical, Magical, Poison, Environmental, Supernatural)
- DOT injuries drain HP per turn, duration via cure field
- Default 4 turns (DOT: 5 turns), curable via magic/potions/rest

---

## 4. Character Roster

### 4.1 Pantheons (15 total)
Greek, Norse, Egyptian, Babylonian, Chinese, Finnish, Mesopotamian, Lovecraftian, Dragonlance (Krynn), Celtic, Indian, Japanese, Central American, Melnibonean, Nehwon, Zodiac

### 4.2 Character Categories
| Category | Count | Description |
|---|---|---|
| Greater Gods | 35+ | Major deities (Zeus, Odin, Ra, etc.) |
| Demigods | 25+ | Half-mortal heroes (Hercules, Cuchulain, etc.) |
| Heroes | 40+ | Mortal heroes and legends |
| Monsters | 20+ | Mythological beasts and enemies |
| Lesser Gods | 35+ | Minor deities including 12 Zodiac signs |
| **Total** | **155+** | |

### 4.3 Stat Ranges
- HP: 50-200 (heroes), 300-450 (gods)
- AC: -12 to +4 (AD&D 1e scale, lower is better)
- MR: 0%-100% (gods typically 25-98%)
- Ability Scores: 3-25+ (18/xx exceptional strength for fighters)

---

## 5. UI Architecture

### 5.1 Layout (Desktop, 1024px+)
```
┌──────────────────────────────────────────────────────────┐
│ GameHeader — Title, TTS, Audio, Trophy, Region          │
├─────────┬────────────────────────────┬──────────────────┤
│ Sidebar │ Narrative Panel           │ Right Panel      │
│ (icons) │ DM narration (parchment)  │ ┌──────────────┐│
│ Party   │ Comic panels / scenes     │ │Card Showcase  ││ ← sticky top
│ NPCs    │ Test of Faith             │ │(auto-advance) ││
│ Map     │ Combat Tracker            │ ├──────────────┤│
│ Quests  │ Choice Panel              │ │  (spacer)    ││
│ Settings│                           │ ├──────────────┤│
│         │                           │ │Dice Tray     ││ ← sticky bottom
│         │                           │ │(BG3 dice)    ││
├─────────┴────────────────────────────┴──────────────────┤
│ PartyBar — Character portraits + HP bars                │
├──────────────────────────────────────────────────────────┤
│ Bottom Bar — Menu, Typing, Next Turn, Save/Load         │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Right Panel (Sticky Layout)
- **Card Showcase** (top, sticky): Auto-advancing portrait carousel, 5s interval, pantheon round-robin, boss auto-focus, play/pause/next/prev controls, character detail modal on inspect
- **Dice Tray** (bottom, sticky): BG3-style 3D animated dice, color-coded by type, last 5 rolls, critical hit/miss glow effects, roll count
- **Spacer** (middle, flex): Expandable area between the two sticky sections

### 5.3 Responsive Breakpoints
| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 0-639px | Single column, bottom dock, fixed PartyBar |
| Tablet-ish | 640-1023px | Same as mobile (no dedicated tablet layout) |
| Desktop | 1024px+ | Full three-column with sidebar + right panel |

### 5.4 Key UI Components (28 files)
| Component | File | Purpose |
|---|---|---|
| MythworldPage | `src/app/MythworldPage.tsx` (1043 lines) | Main game orchestrator |
| GameSidebar | `src/components/game/GameSidebar.tsx` (1198 lines) | Sidebar + 12 dialog panels |
| ChoicePanel | `src/components/game/ChoicePanel.tsx` (561 lines) | Action selection, custom text, confirm |
| SidebarDiceArea | `src/components/game/SidebarDiceArea.tsx` (361 lines) | Dice tray with BG3 dice |
| TurnCardShowcase | `src/components/game/TurnCardShowcase.tsx` (335 lines) | Portrait carousel |
| CombatOverlay | `src/components/game/CombatOverlay.tsx` (490 lines) | Full-screen combat UI |
| CombatTracker | `src/components/game/CombatTracker.tsx` (93 lines) | Inline combat status |
| GameHeader | `src/components/game/GameHeader.tsx` (406 lines) | Top banner |
| PartyBar | `src/components/game/PartyBar.tsx` (70 lines) | Bottom party portraits |
| GameComponents | `src/components/game/GameComponents.tsx` (320 lines) | HealthBar, NarrativeSection, TokenCounter |
| InteractiveDiceRoller | `src/components/game/InteractiveDiceRoller.tsx` (179 lines) | Standalone clickable die (NOT in ChoicePanel) |

### 5.5 Design Tokens
```css
--gold: #D4AF37; --gold-bright: #FFD700; --gold-dim: #8A7234;
--cream: #F5E6C8; --parchment: #3C2415;
--crimson: #DC143C; --purple: #7B2D8E; --emerald: #2ECC71;
--bg-primary: #0a0a0f; --bg-secondary: #12121a; --bg-card: #1a1a2e;
--font-title: 'Rivendell', serif;
--font-heading: 'Wonderland', serif;
--font-body: 'Fantasya', serif;
--font-narrative: 'Wisp', serif;
--font-combat: 'Arkana', serif;
```

### 5.6 Accessibility
- Minimum touch target: 44x44px
- Minimum font size: 11px floor
- `prefers-reduced-motion` respected (global CSS + per-component hooks)
- Keyboard-accessible controls
- Screen reader support on Victory/Death screens
- DOMPurify XSS protection on all HTML content

---

## 6. File Structure

### 6.1 Source Code
```
src/
  app/
    page.tsx              — Root page (SSR: false, imports MythworldEngine)
    layout.tsx            — Root layout, metadata, PWA config
    MythworldPage.tsx     — Main game component (1043 lines)
    globals.css           — Global styles, fonts, animations (1067 lines)
    codex/page.tsx        — In-game codex browser
    rulebook/page.tsx     — Player's handbook viewer
    dm-handbook/page.tsx  — DM guide viewer
  components/game/        — 28 game UI components
  hooks/
    useGameEngine.ts      — Core game engine (5976 lines, DO NOT MODIFY)
    useGameAudio.ts       — Audio engine (421 lines)
    use-mobile.ts         — Mobile detection (19 lines)
  lib/
    gameTypes.ts          — TypeScript interfaces (440 lines)
    gameHelpers.ts        — Shared utilities (696 lines)
    gameConstants.ts      — Game constants (317 lines)
    characterData.ts      — Character definitions (366 lines)
    characterTypes.ts     — Character type interfaces (32 lines)
    gameState.ts          — State management types (156 lines)
```

### 6.2 Documentation
```
download/
  Deities_Demigods_Players_Handbook.pdf  — Generated from generate_players_handbook.py
  Deities_Demigods_DM_Handbook.pdf       — Generated from generate_dm_handbook.py
  Deities_Demigods_Codex.pdf             — Generated from generate_codex.py
  DEITIES_DEMIGODS_SPECIFICATION.md      — Technical specification
  system_analysis_report.md              — System analysis
deities-demigods-game-bible.md           — This file (living document)
MANUS_HANDOVER.md                         — UI handover for Manus
MANUS_PROMPT.md                           — Manus task prompt
AUDIT_REPORT.md                           — Security/accessibility audit
worklog.md                                — Sprint history
```

---

## 7. Sprint History

| Version | Sprint | Key Changes |
|---|---|---|
| v2.32.0 | Fantasy Font Overhaul | 10 self-hosted fonts, full theming across all pages |
| v2.38.0 | Mobile Optimization | 100dvh viewport, safe-area, mobile-first responsive |
| v2.39.0 | Accessibility & UX | 11px font floor, reduced motion, keyboard access |
| v2.40.0 | Zodiac Pantheon | 12 zodiac lesser gods, portraits |
| v2.41.0 | Bug Fixes | 14 HIGH severity audit fixes, DOMPurify, AbortController |
| v2.42.0 | Combat Fixes | Early Act I combat guard, scene image sizing |
| v2.43.0 | UI Refinements | Sticky right panel, InteractiveDiceRoller removal |
| v2.43.1 | Fix attempt | Addressed build trigger issues |
| v2.43.2 | UI Polish | Sticky Card Showcase + Dice Tray, removed big dice from ChoicePanel, cleaned unused imports |

---

## 8. Commit & Tag Convention

- **Version bumps:** `v{X.Y.Z} — {description}`
- **UI changes:** `UI: {description}`
- **Always tag** after committing: `git tag v{X.Y.Z}`
- Example: `git commit -m "v2.43.2 — Sticky panel + dice cleanup"` → `git tag v2.43.2`

---

## 9. Known Issues & Future Work

| Issue | Severity | Notes |
|---|---|---|
| No tablet breakpoint | Medium | 768-1023px gets mobile layout |
| GameSidebar.tsx 1198 lines | High | Consider splitting into dialog panel components |
| useGameEngine.ts 5976 lines | High | Do NOT modify; future refactoring candidate |
| 13 instances of text-[9px] | Low | Below 11px font floor |
| useReducedMotion() duplicated | Low | Could extract to shared hook |

---

## 10. External Dependencies

| Package | Purpose |
|---|---|
| `next` (16.x) | Framework |
| `react` (19.x) | UI library |
| `tailwindcss` (4.x) | Styling |
| `shadcn/ui` | Component library |
| `prisma` | Database ORM |
| `framer-motion` | Animations |
| `dompurify` | XSS protection |
| `@dnd-kit` | Drag and drop |
| `z-ai-web-dev-sdk` | AI capabilities (image gen, web search) |
