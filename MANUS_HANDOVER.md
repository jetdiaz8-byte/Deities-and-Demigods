# MANUS HANDOVER — Deities & Demigods Mythworld Engine

> **Prepared by:** Z Agent (v2.40.0)
> **Date:** 2026-04-19
> **Purpose:** Complete UI redesign handover for Manus to take over responsive layout, visual polish, and cross-device optimization.

---

## 1. Project Overview

| Field | Value |
|---|---|
| **Repo** | `jetdiaz8-byte/Deities-and-Demigods` (main branch) |
| **Current Version** | `v2.40.0` |
| **Tech Stack** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TypeScript, Prisma, Vercel |
| **Local Path** | `/home/z/my-project/Deities-and-Demigods/` |
| **Deploy Target** | Vercel (auto-deploy on push to main) |

This is a tabletop RPG game engine with AI-driven narration, divine pantheon management, turn-based combat, and a rich visual identity rooted in gold/parchment/crimson aesthetics. The game supports 155+ characters across multiple mythological panthems (Greek, Norse, Egyptian, Babylonian, Chinese, Finnish, Mesopotamian, Lovecraftian, Dragonlance, and Zodiac).

---

## 2. Current Responsive State — The Problem

### 2.1 Binary Mobile/Desktop Split

The current layout has **only two breakpoints** in practice:

| Breakpoint | Tailwind Prefix | Width | What It Controls |
|---|---|---|---|
| Mobile (default) | (none) | 0–639px | Base layout, fixed-bottom PartyBar, bottom-bar actions |
| Tablet-ish | `sm:` / `md:` | 640–767px / 768–1023px | Minor spacing tweaks only — NOT a true tablet layout |
| Desktop | `lg:` | 1024px+ | Full sidebar + right panel, horizontal header, expanded controls |

**The problem:** There is **no dedicated tablet breakpoint**. The `md:` (768px) prefix is used only for minor spacing adjustments (reducing touch targets to `min-h-0 min-w-0`). A user on a 768–1023px device (iPad, Surface, Android tablet) gets the **mobile layout**, which wastes significant horizontal space. The 56px sidebar icon strip only appears at `lg:1024px+`, and the right panel (TurnCardShowcase + SidebarDiceArea) also only appears at `lg:`.

### 2.2 Breakdown by Area

**MythworldPage.tsx (1036 lines)** — The main orchestrator:
- `lg:hidden` — Menu button, MobileMoreMenu
- `hidden lg:inline-flex` — Inventory, Save, Load, Export buttons
- `hidden lg:flex` — Right Panel (320px sidebar with TurnCard + Dice)
- `lg:pb-0` — Removes bottom padding on desktop

**GameSidebar.tsx (1198 lines)** — The largest component:
- Desktop: Fixed right-0 icon strip, 56px wide (`hidden lg:flex`)
- Mobile: Bottom dock bar, fixed bottom (`md:hidden`), 6 scrollable tabs
- Dialog panels: Same popup pattern on both (Dialog max-w-2xl max-h-85vh)

**PartyBar.tsx (70 lines)** — Fixed bottom:
- Always visible on mobile, hidden on desktop
- Fixed bottom-0, z-80, safe-area padding

### 2.3 What "Tablet" Currently Looks Like

On a 768–1023px device:
- PartyBar still occupies the bottom strip
- No sidebar icon strip (hidden behind `lg:`)
- No right panel for TurnCard/Dice
- Same cramped mobile layout with wasted horizontal space
- Save/Load/Export buttons hidden
- Bottom-bar actions still stacked vertically

---

## 3. Key Files Reference

### 3.1 Core Game Files

| File | Lines | Role | What Manus Should Focus On |
|---|---|---|---|
| `src/app/MythworldPage.tsx` | 1036 | Main game orchestrator | Layout grid, responsive class swaps, bottom-bar, floating buttons |
| `src/app/globals.css` | 1067 | Global styles, fonts, animations | CSS custom properties, font floor, responsive utilities, safe-area |
| `src/components/game/GameSidebar.tsx` | 1198 | Sidebar + dialog panels | Desktop icon strip, mobile dock, 12 dialog panels |
| `src/components/game/PartyBar.tsx` | 70 | Fixed bottom party bar | Layout, expand-on-tap, portrait sizing |
| `src/components/game/GameHeader.tsx` | 406 | Top header bar | Responsive title, action buttons, region indicator |
| `src/components/game/ChoicePanel.tsx` | 621 | Player choice cards | Card layout, spacing, touch targets |
| `src/components/game/PartySelectionScreen.tsx` | 497 | Character selection | Grid layout, card sizes |
| `src/components/game/IntroScreen.tsx` | 549 | Intro/splash screen | Hero area, CTA buttons |
| `src/components/game/PortraitModal.tsx` | 529 | Character portrait viewer | Image sizing, modal layout |
| `src/components/game/ActiveCharacterCard.tsx` | 346 | Active character display | Layout, stat bars, portrait |
| `src/components/game/TurnCardShowcase.tsx` | 335 | Turn card display | Card sizing, animations |
| `src/components/game/SidebarDiceArea.tsx` | 360 | Dice rolling area | Layout, dice display |
| `src/components/game/SceneIllustration.tsx` | 379 | AI-generated scene art | Image display, overlay effects |
| `src/components/game/CombatOverlay.tsx` | 490 | Combat UI overlay | Layout, action buttons, health bars |

### 3.2 All Game Components (29 files, 9,281 total lines)

| File | Lines |
|---|---|
| GameSidebar.tsx | 1198 |
| ChoicePanel.tsx | 621 |
| IntroScreen.tsx | 549 |
| PortraitModal.tsx | 529 |
| PartySelectionScreen.tsx | 497 |
| CombatOverlay.tsx | 490 |
| GameDialogs.tsx | 453 |
| GameHeader.tsx | 406 |
| SceneIllustration.tsx | 379 |
| SidebarDiceArea.tsx | 360 |
| ActiveCharacterCard.tsx | 346 |
| TurnCardShowcase.tsx | 335 |
| CharacterDetailModal.tsx | 332 |
| GameComponents.tsx | 320 |
| AchievementsDialog.tsx | 296 |
| LoreGlossaryCard.tsx | 235 |
| EquipmentTooltip.tsx | 234 |
| TestOfFaith.tsx | 183 |
| InteractiveDiceRoller.tsx | 179 |
| AchievementNotification.tsx | 179 |
| QuickeningOverlay.tsx | 173 |
| VictoryCelebration.tsx | 148 |
| DeathScreen.tsx | 129 |
| QuestJournalModal.tsx | 127 |
| CharacterCard.tsx | 126 |
| ComicPanel.tsx | 117 |
| NPCRelationsPanel.tsx | 99 |
| CombatTracker.tsx | 93 |
| PartyBar.tsx | 70 |
| AlignmentMeter.tsx | 40 |
| RegionIndicator.tsx | 38 |

### 3.3 Hooks & Libs (DO NOT MODIFY game logic)

| File | Lines | Notes |
|---|---|---|
| `src/hooks/useGameEngine.ts` | 5976 | ⛔ ENTIRE GAME ENGINE — do not touch |
| `src/hooks/useGameAudio.ts` | 421 | Audio engine |
| `src/hooks/use-mobile.ts` | 19 | Simple mobile detection |
| `src/lib/gameTypes.ts` | 440 | TypeScript types |
| `src/lib/gameHelpers.ts` | 696 | Shared utilities |
| `src/lib/gameConstants.ts` | 317 | Game constants |
| `src/lib/characterData.ts` | 366 | Character definitions |
| `src/lib/characterTypes.ts` | 32 | Character types |
| `src/lib/gameState.ts` | 156 | State management types |

---

## 4. Design System

### 4.1 Color Palette (CSS Custom Properties in `:root`)

```css
/* Core Dark Theme */
--bg-primary: #0a0a0f;       /* Deep dark background */
--bg-secondary: #12121a;     /* Card/panel backgrounds */
--bg-card: #1a1a2e;          /* Elevated cards */

/* Gold Scale (PRIMARY ACCENT) */
--gold: #D4AF37;             /* Main gold */
--gold-bright: #FFD700;      /* Bright gold highlights */
--gold-dim: #8A7234;         /* Dimmed gold */
--gold-muted: #6B5B2A;       /* Muted gold */
--gold-dark: #5A4A28;        /* Dark gold */
--accent-gold: #c9a84c;      /* Gold accent */
--accent-gold-dim: #8a7234;  /* Dimmed accent gold */

/* Parchment/Cream (TEXT) */
--cream: #F5E6C8;            /* Primary text */
--cream-dim: #D4C8B0;        /* Secondary text */
--parchment: #3C2415;        /* Warm dark brown */
--parchment-light: #5C4030;  /* Lighter brown */

/* Crimson (DANGER/COMBAT) */
--crimson: #DC143C;          /* Primary danger */
--crimson-deep: #A00D2A;     /* Deep danger */
--accent-red: #8b2252;       /* Dark magenta danger */

/* Purple (MAGIC) */
--purple: #7B2D8E;           /* Magic/shard accent */
--purple-deep: #5A1A6E;      /* Deep purple */
--purple-glow: #9B4DCA;      /* Glow effect */

/* Supporting */
--emerald: #2ECC71;          /* Success/healing */
--emerald-deep: #1FA85A;     /* Deep emerald */
--accent-blue: #2d5a8b;      /* Info ONLY (used for AC stat display) */
--accent-green: #2d6b4f;     /* Success */
```

**CRITICAL RULE:** Do NOT use blue or indigo as primary colors. Blue (`--accent-blue: #2d5a8b`) is used ONLY for specific stat displays (AC value) and companion system indicators. The palette is gold-dominant.

### 4.2 Typography

| Token | Value | Usage |
|---|---|---|
| `--font-size-min` | `11px` | **Absolute floor — no text below this** |
| `--font-size-body` | `clamp(12px, 2.2vw, 16px)` | Body text |
| Font stack | `'Cinzel', 'Palatino Linotype', serif` | Headings |
| Body font | `'Georgia', serif` | Body text |
| Monospace | `'Courier New', monospace` | Code/stats |

### 4.3 Spacing & Sizing

| Token | Value |
|---|---|
| `--sidebar-width` | `320px` (desktop sidebar) |
| Minimum touch target | `44px × 44px` (mobile) |
| PartyBar height | ~80px (portrait 48×64 + padding) |
| Sidebar icon strip | `56px` wide (desktop) |
| Bottom bar | `54px` above PartyBar |

---

## 5. Responsive Breakpoint Architecture

### 5.1 Current Tailwind Breakpoints

| Name | Min Width | Usage in Project |
|---|---|---|
| `sm:` | 640px | Minor layout tweaks (91 occurrences) |
| `md:` | 768px | Touch target reduction, minor spacing (31 occurrences) |
| `lg:` | 1024px | **Primary desktop boundary** (12 occurrences) |
| `xl:` | 1280px | Rare (2 occurrences) |

### 5.2 The Missing Tablet Zone

The range 768–1023px (`md:` to just before `lg:`) is an underserved zone. Users with iPads (810px), Surface Go (910px), and small laptops (1024px) all get the mobile layout. This zone needs its own breakpoint strategy.

---

## 6. Sprint History & Markers

### Sprint 1 (v2.38.0) — Critical Mobile Optimization
All changes tagged with comments. Key patterns:
- `100dvh` viewport with `-webkit-fill-available` fallback
- `env(safe-area-inset-bottom)` on all fixed-bottom elements
- Mobile-first responsive (base = mobile)
- Touch targets 44px enforced globally via CSS
- PartyBar fixed bottom with safe-area padding
- `md:` → `lg:` breakpoint migration

### Sprint 2 (v2.39.0) — Accessibility & UX
Code markers present in the codebase:
- `S2-F1` — Minimum font floor 11px (globals.css)
- `S2-F2` — Bottom Bar with safe-area (MythworldPage.tsx)
- `S2-F3` — Keyboard-accessible NPC panel (NPCRelationsPanel.tsx)
- `S2-F4` — Reduced motion support (multiple files)
- `S2-F6` — Keyboard dismiss + screen reader (Victory/Death screens)
- `S2-F7` — IntroScreen double-tap fix
- `S2-F8` — Floating Speak Button positioning (MythworldPage.tsx)

**⚠️ PRESERVE ALL S2-F* markers in code comments. Do not delete or rename them.**

### Zodiac Pantheon (v2.40.0)
- 12 zodiac lesser gods added to characterData.ts
- All 12 portraits verified in `public/portraits/lesser-gods/`
- Portrait path pattern: `/portraits/{category}/{id}.png?v=3`

---

## 7. shadcn/ui Components in Use

### Currently Used in Game Components

| Component | Where Used |
|---|---|
| Button | ChoicePanel, PartySelectionScreen, GameDialogs, GameHeader, CharacterDetailModal, PortraitModal, ActiveCharacterCard, IntroScreen, MythworldPage |
| Badge | GameSidebar, ChoicePanel, PartySelectionScreen, ActiveCharacterCard, GameDialogs, CharacterDetailModal, PortraitModal, TurnCardShowcase, QuestJournalModal, GameHeader, MythworldPage |
| Dialog | GameSidebar, ChoicePanel, AchievementsDialog, QuestJournalModal, CharacterDetailModal, PortraitModal, GameDialogs |
| Card | GameSidebar, ChoicePanel, PartySelectionScreen, ActiveCharacterCard, IntroScreen |
| Select | GameHeader, PartySelectionScreen |
| Input | GameDialogs, MythworldPage |
| ScrollArea | CharacterDetailModal, PortraitModal, ActiveCharacterCard |
| Separator | CharacterDetailModal, PortraitModal, ActiveCharacterCard, codex/page |
| Tooltip | GameSidebar (sidebar icon tooltips) |
| Tabs | codex/page |

### Available but Unused (35 components)
accordion, alert, alert-dialog, aspect-ratio, breadcrumb, calendar, carousel, chart, checkbox, collapsible, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, sheet, skeleton, slider, sonner, switch, table, textarea, toggle, toggle-group, toaster, toast

**Rule:** For any new modal/dialog/dropdown/popover, use shadcn/ui components. Do NOT build custom implementations.

---

## 8. Architecture Decisions

### 8.1 State Management
- All game state lives in `useGameEngine.ts` (5976 lines) — a single massive hook
- State is passed down via props to all components
- MythworldPage.tsx is the orchestrator that calls `useGameEngine()` and distributes state

### 8.2 Portrait System
- Path function: `getPortraitPath({ category, id })` → `/portraits/{category}/{id}.png?v=3`
- Alternative: `getEntityPortrait(entity)` in gameHelpers.ts (same pattern, different input shape)
- Portrait categories: `heroes`, `monsters`, `lesser-gods`, `greater-gods`, `demigods`
- Next.js Image with `fill` + `object-contain` + `unoptimized`
- `onError` fallback: icon + first letter of name

### 8.3 Dialog Pattern
- All sidebar panels use shadcn `<Dialog>` with `sm:max-w-2xl max-h-[85vh]`
- Desktop: Triggered by sidebar icon strip clicks
- Mobile: Triggered by bottom dock tab taps
- Same component renders both — no separate mobile/desktop implementations

### 8.4 Animation System
- 27 `@keyframes` in globals.css
- Additional inline keyframes in MythworldPage, IntroScreen, SceneIllustration, InteractiveDiceRoller, EquipmentTooltip, GameSidebar, AchievementNotification
- All animations respect `prefers-reduced-motion` via:
  - Global CSS: `animation: none !important; transition: none !important;`
  - Per-component `useReducedMotion()` hook (duplicated in 4 files)
  - Component-level `@media (prefers-reduced-motion: reduce)` blocks

---

## 9. Known Issues & Risks

| Issue | Severity | Details |
|---|---|---|
| GameSidebar.tsx (1198 lines) | 🔴 High | Consider splitting into individual dialog panel components |
| useGameEngine.ts (5976 lines) | 🔴 High | Do NOT touch — but note for future refactoring |
| 13 instances of `text-[9px]` | 🟡 Medium | Below the 11px font floor — CSS override may not catch all |
| `useReducedMotion()` duplicated 4x | 🟡 Low | Could be extracted to shared `src/hooks/useReducedMotion.ts` |
| Zodiac portrait cache | 🟢 Resolved | All 12 portraits verified in repo. Upload replacements match byte-for-byte. |
| Vercel cache | 🟢 Low | If portraits still don't load live, redeploy triggers cache bust (`?v=3`) |

---

## 10. Commit & Tag Convention

- **Version bumps:** `v{X.Y.Z} — {description}`
- **UI changes:** `UI: {description}`
- **Always tag** after committing: `git tag v{X.Y.Z}`
- Example: `git commit -m "v2.41.0 — Tablet breakpoint"` → `git tag v2.41.0`
