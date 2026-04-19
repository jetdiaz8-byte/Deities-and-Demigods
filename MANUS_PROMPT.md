# MANUS PROMPT — UI Redesign Instructions for Deities & Demigods

> **To:** Manus (UI Redesign Agent)
> **From:** Z Agent Handover
> **Project:** Deities & Demigods Mythworld Engine
> **Repo:** `jetdiaz8-byte/Deities-and-Demigods` (main branch)
> **Current Version:** `v2.40.0`
> **Tech:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TypeScript

---

## YOUR MISSION

You are taking over the **UI redesign** of the Deities & Demigods Mythworld Engine — a tabletop RPG game with AI-driven narration, divine pantheon management, and turn-based combat. Your job is to make this game look and feel exceptional across **mobile, tablet, and desktop** while strictly preserving all existing game logic and functionality.

**You are a UI/UX specialist.** You may modify styles, layout, responsive breakpoints, component structure, and visual presentation. You must NOT modify game logic, state management, data structures, or API routes.

---

## 14 NON-NEGOTIABLE RULES

These rules are absolute. Violating any of them will break the game or violate the project's design philosophy.

### Rule 1: NO BLUE OR INDIGO PRIMARY COLORS
The palette is **gold/parchment/crimson/purple-divine**. CSS custom properties define the full palette in `globals.css :root`. The only blue in the entire app is `--accent-blue: #2d5a8b`, used exclusively for AC stat displays and companion system indicators. Never use `blue-*`, `indigo-*`, `sky-*`, or any blue-adjacent Tailwind color as a primary or prominent UI color. If you need a neutral, use gold-dim or parchment.

### Rule 2: shadcn/ui ONLY for Modals/Dialogs/Dropdowns
All modals, dialogs, dropdowns, popovers, and similar overlay components MUST use shadcn/ui primitives (`Dialog`, `DropdownMenu`, `Popover`, `Sheet`, `Drawer`, etc.). Do NOT build custom modal implementations. The project has 45 shadcn/ui components available in `src/components/ui/`. Currently only 10 are used — you may introduce others as needed.

### Rule 3: MOBILE-FIRST CSS
Write CSS with the mobile layout as the base (no breakpoint prefix). Apply `sm:`, `md:`, `lg:`, `xl:` prefixes only for progressive enhancement. Never write a desktop-first style and add mobile overrides. This means:
- Base classes = mobile appearance
- `md:` (768px) = tablet adjustments
- `lg:` (1024px) = desktop layout
- `xl:` (1280px) = wide desktop refinements

### Rule 4: 100dvh FOR FULL-HEIGHT
Use `100dvh` (not `100vh`, not `100%`) for all full-viewport-height elements. The CSS already provides a `-webkit-fill-available` fallback. Apply this to the game container, intro screen, dialog panels, and any viewport-filling element.

### Rule 5: SAFE-AREA INSETS ON FIXED-BOTTOM ELEMENTS
All fixed-bottom elements MUST include `env(safe-area-inset-bottom)` padding. Use the existing CSS variable `--safe-bottom` or inline the env() directly. Elements that need this:
- PartyBar (already implemented)
- Bottom dock bar in GameSidebar (already implemented)
- Floating Speak Button (already implemented)
- Bottom Bar action strip (already implemented)
- Any NEW fixed-bottom element you create

### Rule 6: TOUCH TARGETS 44×44px MINIMUM (Mobile)
All interactive elements (buttons, links, `[role="button"]`, `.touch-target`) must have `min-height: 44px` and `min-width: 44px` on mobile. The global CSS already enforces this via:
```css
@media (max-width: 768px) {
  button, .prose-expand-btn, [role='button'], .touch-target {
    min-height: 44px; min-width: 44px;
  }
}
```
Desktop may use smaller targets via `md:min-h-0 md:min-w-0`. Ensure any NEW interactive elements you add also meet this standard.

### Rule 7: FONT FLOOR 11px
No text in the application may render below 11px. The CSS variable `--font-size-min: 11px` is set globally. The floor is enforced via:
```css
body * { font-size: max(var(--font-size-min), inherit); }
```
Note: There are currently 13 instances of `text-[9px]` in the codebase that may bypass this floor. Part of your job is to audit and fix these. Never introduce new `text-[9px]` or `text-[10px]` classes.

### Rule 8: prefers-reduced-motion ON ALL ANIMATIONS
Every animation and transition you add must respect the user's `prefers-reduced-motion` setting. The global CSS already provides a blanket override, but for JS-driven animations, use the `useReducedMotion()` pattern (currently duplicated in 4 files — see MANUS_HANDOVER.md for details). For any new animation:
```typescript
const prefersReducedMotion = useReducedMotion(); // or window.matchMedia
if (prefersReducedMotion) { /* skip or simplify */ }
```

### Rule 9: PRESERVE ALL S1-F* AND S2-F* CODE COMMENT MARKERS
Sprint markers (e.g., `// S2-F1:`, `/* S2-F4: */`) are used for auditing and change tracking. Do NOT delete, rename, or relocate these comments. If you modify code near a marker, keep the marker in the same logical position with the same text.

### Rule 10: NO GAME LOGIC CHANGES
You may ONLY modify:
- CSS/Tailwind classes
- Component JSX structure (for layout purposes)
- Component imports (e.g., adding a shadcn/ui component)
- CSS custom properties and animations in globals.css
- Responsive breakpoint class prefixes

You must NOT modify:
- `useGameEngine.ts` (5976 lines of game logic)
- Any function in `src/lib/` that computes game state
- API routes in `src/app/api/`
- Data structures, type definitions in `gameTypes.ts`, `gameState.ts`
- Character data in `characterData.ts`, `krynnCharacters.ts`
- Achievement logic, combat math, AI prompts

### Rule 11: COMMIT FORMAT
Use one of these formats:
- `v{X.Y.Z} — {description}` for version bumps
- `UI: {description}` for UI-only changes
- Tag each version bump: `git tag v{X.Y.Z}`

### Rule 12: DO NOT START SPRINT 3 OR SPRINT 4 ITEMS
The following items are documented but **must not be started** by you. They are reserved for a future sprint:

**Sprint 3 (8 items — DO NOT START):**
1. Dynamic bottom spacing (PartyBar-aware padding)
2. Minimap responsive resize
3. Landscape orientation dialog optimization
4. ChoicePanel touch optimization
5. Portrait responsive scaling
6. Font loading optimization (preload/subset)
7. aria-hidden on decorative elements
8. AlignmentMeter responsive design

**Sprint 4 (3 items — DO NOT START):**
1. GPU-heavy animation simplification
2. Dice rotation animation refinement
3. Render-blocking CSS elimination

**Bug audit (79+ items — DO NOT START):** security, game logic, quality issues.

### Rule 13: MAINTAIN PORTRAIT COMPATIBILITY
The portrait system uses the path pattern `/portraits/{category}/{id}.png?v=3`. Do NOT change this pattern. All 48 lesser-god portraits, hero portraits, and monster portraits rely on this. If you add new portrait displays, use the `getPortraitPath()` function from `characterData.ts` or `getEntityPortrait()` from `gameHelpers.ts`.

### Rule 14: TEST ON THREE VIEWPORTS
Before committing, verify your changes look correct at:
1. **Mobile:** 375px × 812px (iPhone) — party bar visible, touch targets, safe-area
2. **Tablet:** 810px × 1080px (iPad) — your new breakpoint zone
3. **Desktop:** 1440px × 900px (laptop) — sidebar + right panel, expanded controls

---

## 4 PRIORITY TIERS (Execute in Order)

### TIER 1: Tablet Breakpoint (Highest Priority)

**Goal:** Create a true tablet layout for the 768–1023px zone. Currently this zone shows the cramped mobile layout.

**What to do:**
- Introduce a `md:` breakpoint strategy (768px) as the "tablet" breakpoint
- On tablet: Show the sidebar icon strip (currently `hidden lg:flex` → consider `hidden md:flex`)
- On tablet: Show the right panel (TurnCardShowcase + SidebarDiceArea) — possibly narrower than 320px
- On tablet: Hide or transform the bottom PartyBar (use sidebar member list instead)
- On tablet: Show header action buttons (Inventory, Save, Load, Export)
- Adjust dialog sizes for tablet (`md:` max-width changes)
- Ensure touch targets remain 44px at this breakpoint (finger-friendly tablets)
- Key files: `MythworldPage.tsx`, `GameSidebar.tsx`, `PartyBar.tsx`, `GameHeader.tsx`

**Success criteria:** An iPad user sees a distinctly different, more spacious layout than a phone user — with sidebar navigation, visible dice area, and no wasted horizontal space.

### TIER 2: Desktop Optimization (High Priority)

**Goal:** Polish the existing desktop layout (1024px+) for better visual hierarchy and information density.

**What to do:**
- Review and refine the sidebar icon strip layout (56px wide)
- Optimize the right panel width and content arrangement
- Improve dialog panel layouts for wider screens
- Enhance the GameHeader for desktop (more horizontal space for info)
- Consider a wider PartyBar or transforming it into a horizontal strip for desktop
- Review TurnCardShowcase sizing and animation
- Refine choice card layouts for desktop width
- Key files: `GameSidebar.tsx`, `MythworldPage.tsx`, `TurnCardShowcase.tsx`, `ChoicePanel.tsx`

**Success criteria:** Desktop feels like a premium gaming interface — information-rich but not cluttered, with clear visual hierarchy.

### TIER 3: Mobile Refinements (Medium Priority)

**Goal:** Improve the existing mobile layout without changing the fundamental structure.

**What to do:**
- Audit and fix the 13 `text-[9px]` violations (raise to 11px minimum)
- Review choice card spacing and readability on small screens
- Optimize PartyBar member card sizing
- Improve intro screen layout on small phones (320px viewport)
- Review floating button positioning and overlap prevention
- Optimize combat overlay layout for portrait phones
- Key files: globals.css, `ChoicePanel.tsx`, `PartyBar.tsx`, `IntroScreen.tsx`, `CombatOverlay.tsx`

**Success criteria:** Mobile feels refined and polished — no tiny text, comfortable touch targets, no overlapping elements.

### TIER 4: Visual Polish (Lower Priority)

**Goal:** Elevate the overall visual quality with micro-interactions and detail work.

**What to do:**
- Add smooth transitions for breakpoint changes (layout shifts should feel fluid)
- Refine hover states on desktop (cards, buttons, sidebar icons)
- Improve loading states and skeleton screens
- Add subtle entrance animations for new content
- Polish the gold/parchment visual identity — ensure consistency across all panels
- Review and refine all CSS custom property usage
- Consider extracting duplicated `useReducedMotion()` to shared hook
- Key files: `globals.css`, all component files

**Success criteria:** The game feels premium and cohesive — every interaction has a polished, intentional feel.

---

## KEY FILES QUICK REFERENCE

| File | Lines | Your Focus |
|---|---|---|
| `src/app/MythworldPage.tsx` | 1036 | Layout grid, responsive swaps |
| `src/app/globals.css` | 1067 | CSS variables, animations, responsive utilities |
| `src/components/game/GameSidebar.tsx` | 1198 | Sidebar + 12 dialog panels |
| `src/components/game/PartyBar.tsx` | 70 | Fixed bottom bar |
| `src/components/game/GameHeader.tsx` | 406 | Top header |
| `src/components/game/ChoicePanel.tsx` | 621 | Choice cards |
| `src/components/game/ActiveCharacterCard.tsx` | 346 | Character display |
| `src/components/game/TurnCardShowcase.tsx` | 335 | Turn card |
| `src/components/game/SidebarDiceArea.tsx` | 360 | Dice area |

---

## DO NOT MODIFY

- `src/hooks/useGameEngine.ts` — Game engine (5976 lines)
- `src/hooks/useGameAudio.ts` — Audio engine (421 lines)
- `src/lib/*` — All library files (game logic, data, types)
- `src/app/api/*` — All API routes
- `src/app/rulebook/page.tsx`, `src/app/dm-handbook/page.tsx` — Static pages
- `src/components/ui/*` — shadcn/ui primitives (modify only via `npx shadcn` CLI)

---

## REFERENCE

For full project details, component breakdowns, color system, animation catalog, and architecture decisions, see `MANUS_HANDOVER.md` in the project root.
