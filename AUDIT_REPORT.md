# 🔍 FULL SYSTEM BUG AUDIT REPORT
## Deities & Demigods — Mythworld Engine
**Audited:** 100+ source files | 32,000+ lines of code  
**Scope:** Frontend, Backend, APIs, Database, Config, Dependencies, Security  
**Date:** v2.32.1

---

# A. MASTER ISSUE LIST

## 🔴 CRITICAL (8 issues)

### C-01: API Key Exposed to Any Unauthenticated Client
- **File:** `src/app/api/get-key/route.ts:4-6`
- **Type:** Security
- **Description:** Returns the raw OpenRouter API key in plaintext with zero auth. Anyone who discovers this endpoint steals the key and racks up charges.
- **Fix:** Delete this endpoint entirely. Frontend should call `/api/openrouter` which proxies server-side.

### C-02: Server-Side Request Forgery (SSRF) in LM Studio Proxy
- **File:** `src/app/api/lmstudio/route.ts:22,136`
- **Type:** Security
- **Description:** Accepts an arbitrary `url` query parameter and fetches it server-side. Attacker can scan internal services (AWS metadata, Redis, etc.) and exfiltrate data.
- **Fix:** Remove client-supplied URL. Read from env var only. If configurable, restrict to `localhost`/`127.0.0.1`.

### C-03: Free-Text Custom Actions Silently Dropped
- **File:** `src/app/MythworldPage.tsx:268-271`
- **Type:** Logic
- **Description:** `handleConfirmChoice` wraps `confirmChoice()` without passing the `customText` argument. When users type a custom action in ChoicePanel, the text is silently ignored — the DM never receives it.
- **Fix:** `const handleConfirmChoice = useCallback((customText?: string) => { confirmChoice(customText) }, [...])`

### C-04: Tailwind CSS v4 Config Completely Dead
- **File:** `tailwind.config.ts` (entire file)
- **Type:** Build/Config
- **Description:** Using Tailwind v4 with `@tailwindcss/postcss`, which abandons `tailwind.config.ts`. All shadcn/ui color tokens and plugin config are never read. `tailwindcss-animate` plugin silently fails.
- **Fix:** Migrate theme tokens to CSS-first `@theme` blocks in `globals.css`, or downgrade to Tailwind v3.

### C-05: TypeScript Build Errors Suppressed
- **File:** `next.config.ts:9`
- **Type:** Build/Config
- **Description:** `typescript: { ignoreBuildErrors: true }` allows type errors into production. Combined with `noImplicitAny: false` in tsconfig, TypeScript provides near-zero protection.
- **Fix:** Set `ignoreBuildErrors: false`. Set `noImplicitAny: true` in tsconfig.

### C-06: React Strict Mode Disabled
- **File:** `next.config.ts:11`
- **Type:** Config
- **Description:** `reactStrictMode: false` hides race conditions, missing cleanup bugs, and stale closures that only appear in production edge cases.
- **Fix:** Set `reactStrictMode: true`.

### C-07: ESLint Effectively Neutered
- **File:** `eslint.config.mjs:10-44`
- **Type:** Config
- **Description:** Nearly every meaningful rule disabled: `no-unused-vars`, `react-hooks/exhaustive-deps`, `no-console`, `no-unreachable`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-non-null-assertion`. Linter catches nothing.
- **Fix:** Re-enable at minimum: `exhaustive-deps`, `no-console`, `no-unused-vars`, `no-explicit-any`.

### C-08: 19 TypeScript Errors — Prisma Client Stale
- **File:** Multiple API routes
- **Type:** Build
- **Description:** `prisma.entity` not found on PrismaClient. The `Entity` model exists in schema but generated client is out of date. All entity API routes will fail at runtime.
- **Fix:** Run `npx prisma generate`. Verify Entity model in schema.

---

## 🟠 HIGH (14 issues)

### H-01: CORS Wildcard Enables Cross-Origin Abuse
- **File:** `src/app/api/lmstudio/route.ts:9-13`
- **Type:** Security
- **Fix:** Restrict `Access-Control-Allow-Origin` to your domain.

### H-02: Unhandled JSON.parse Crash in Entity Formatting
- **File:** `src/app/api/game-entities/route.ts:110`
- **File:** `src/app/api/entities/route.ts:78`
- **Type:** Logic/Security
- **Description:** `JSON.parse(e.abilities)` inside `.map()` without try-catch. One corrupt row crashes the entire endpoint with 500.
- **Fix:** Wrap in try-catch with fallback array.

### H-03: Outer Catch Returns 200, Masking Real Errors
- **File:** `src/app/api/game-entities/route.ts:218-227`
- **Type:** Logic
- **Description:** All errors (including programming bugs) return 200 with fallback data. Client can't distinguish real vs fallback data.
- **Fix:** Return 500 for non-DB errors. Add `{ fallback: true }` flag.

### H-04: `total` Count Ignores Search/Exclude Filters
- **File:** `src/app/api/entities/route.ts:65`
- **Type:** Logic
- **Description:** Count query doesn't include search/minHp/excludeIds filters. Pagination reports wrong totals.
- **Fix:** Use same `where` object for both `findMany` and `count`.

### H-05: Map Connection Line CSS Rotation Broken
- **File:** `src/components/game/GameSidebar.tsx:438-445`
- **Type:** Rendering
- **Description:** `transform: rotate()` rotates around element center, not top-left. All connection lines appear offset/incorrect.
- **Fix:** Add `transform-origin: 0% 50%` to connection line elements.

### H-06: PartySelectionScreen setInterval Memory Leak
- **File:** `src/components/game/PartySelectionScreen.tsx:60-76`
- **Type:** Memory Leak
- **Description:** Fate roll creates `setInterval` that's never cleaned up on unmount. Causes state update warnings and potential leaks.
- **Fix:** Store interval ID in ref, clear in useEffect cleanup.

### H-07: `useGameAudio.ts` Ref Accessed During Render
- **File:** `src/hooks/useGameAudio.ts:396`
- **Type:** State
- **Description:** `manualOverride.current` read at component top-level during render causes stale render bugs.
- **Fix:** Move to `useMemo`/`useState` derivation.

### H-08: `.text-xs/.text-sm/.text-base` Forces Fantasy Font on ALL Small Text
- **File:** `src/app/globals.css:168`
- **Type:** CSS/UX
- **Description:** `.caption, .text-xs, .text-sm, .text-base { font-family: var(--font-caption) }` applies Wonder Night fantasy font to EVERY Tailwind size utility. Form labels, table cells, UI text all get decorative font.
- **Fix:** Remove `.text-xs, .text-sm, .text-base` from selector.

### H-09: Font Licensing Risk
- **File:** `src/app/globals.css:16-35`, `public/fonts/`
- **Type:** Legal
- **Description:** Several fonts sourced from Envato Elements (subscription required). Lapsed subscription = license violation.
- **Fix:** Verify active subscription or replace with properly licensed alternatives.

### H-10: No Timeout on External API Calls
- **File:** `src/app/api/openrouter/route.ts`, `lmstudio/route.ts`, `generate-image/route.ts`
- **Type:** Performance/Integration
- **Description:** No `AbortController` timeout on fetch calls to external services. Hanging requests waste serverless execution time.
- **Fix:** Add 30-second AbortController timeout to all external fetches.

### H-11: `dangerouslySetInnerHTML` with AI Content (XSS Risk)
- **File:** `src/app/MythworldPage.tsx:515,523`
- **Type:** Security
- **Description:** Narrative HTML from AI (Gemini/LM Studio) rendered without sanitization. Malicious or malformed AI output could execute scripts.
- **Fix:** Sanitize with DOMPurify before rendering.

### H-12: Build Script Race Condition on `.config` Backup
- **File:** `package.json:7-8`
- **Type:** Build
- **Description:** `mv .config .config_bak` before prisma generate — if process is killed, `.config` stays renamed permanently.
- **Fix:** Use `trap 'mv .config_bak .config 2>/dev/null' EXIT`.

### H-13: `NEXT_PUBLIC_OPENROUTER_API_KEY` Exposed to Client Bundle
- **File:** `src/app/api/openrouter/route.ts:14`, `get-key/route.ts:5`
- **Type:** Security
- **Description:** `NEXT_PUBLIC_` prefix bakes the API key into client-side JavaScript, visible to anyone.
- **Fix:** Remove `NEXT_PUBLIC_` fallback. Use only server-side `OPENROUTER_API_KEY`.

### H-14: Z-Index Chaos — 15+ Overlapping Fixed Layers
- **File:** `src/app/globals.css` (multiple lines)
- **Type:** CSS/Rendering
- **Description:** Z-index values range from 10 to 9999 with no system. Gallery modal (9000) renders UNDER atmospheric layers (9996-9999). Combat overlay (1000) vs quickening (1050) ordering unclear.
- **Fix:** Establish documented z-index scale: base(0-99), dropdowns(100-499), fixed-UI(500-899), overlays(900-1199), atmospheric(9000-9010), flash(9999).

---

## 🟡 MEDIUM (24 issues)

### M-01: Biased Sort-Based Shuffle in `/api/entities`
- **File:** `src/app/api/entities/route.ts:58-59`
- **Type:** Logic
- **Fix:** Use Fisher-Yates shuffle (already in game-entities route).

### M-02: LIKE Wildcard Injection in Search
- **File:** `src/app/api/entities/route.ts:42-48`
- **Type:** Security/Performance
- **Fix:** Escape `%` and `_` in search string. Cap search length.

### M-03: No Rate Limiting on TTS Endpoint
- **File:** `src/app/api/tts/route.ts`
- **Type:** Security/Performance
- **Fix:** Add in-memory rate limiting. Reduce max text length.

### M-04: Image Generation Returns 200 on Failure
- **File:** `src/app/api/generate-image/route.ts:57-63`
- **Type:** Logic
- **Fix:** Return 202 with `{ placeholder: true }` flag.

### M-05: `selectOption(-1)` Magic Number Fragile
- **File:** `src/components/game/ChoicePanel.tsx:458`
- **Type:** State
- **Fix:** Create explicit `clearSelection()` function.

### M-06: `autoFocus` on Textarea Triggers Mobile Keyboard
- **File:** `src/components/game/ChoicePanel.tsx:481`
- **Type:** UX/Accessibility
- **Fix:** Remove autoFocus or trigger only after user interaction.

### M-07: SVG Cooldown Text Transform Incorrect
- **File:** `src/components/game/ChoicePanel.tsx:96`
- **Type:** Rendering
- **Fix:** Remove conflicting Tailwind `rotate-90` class from `<text>` element.

### M-08: All Dice Visually Shown as d20
- **File:** `src/components/game/GameComponents.tsx:129-136`
- **Type:** Rendering
- **Fix:** Map each die to its correct `sides` value from parsed dice.

### M-09: Division by Zero When `maxHp` is 0
- **File:** `src/components/game/CombatTracker.tsx:32`
- **Type:** Rendering
- **Fix:** Use `pc.maxHp || 1` as divisor.

### M-10: CharacterDetailModal Image Error Not Reset on Character Change
- **File:** `src/components/game/CharacterDetailModal.tsx:193`
- **Type:** Rendering
- **Fix:** Add `useEffect(() => setImageError(false), [character])`.

### M-11: DeathScreen Exit Animation Never Plays
- **File:** `src/components/game/DeathScreen.tsx:14-20`
- **Type:** Rendering
- **Fix:** Move `visible` check inside `AnimatePresence`.

### M-12: `Math.random()` in `<style>` Keyframes
- **File:** `src/components/game/SceneIllustration.tsx:241-269`
- **Type:** Rendering/Performance
- **Fix:** Use CSS custom properties on individual particle elements.

### M-13: Fate Roll Bias Towards Last Hero
- **File:** `src/components/game/PartySelectionScreen.tsx:67-71`
- **Type:** UX/Logic
- **Fix:** Use `Math.floor(Math.random() * filteredHeroes.length)` directly.

### M-14: Non-Null Assertion on Game Engine Result
- **File:** `src/app/MythworldPage.tsx:124`
- **Type:** Type Safety
- **Fix:** Add null guard before destructuring.

### M-15: QuickeningOverlay Absorbing Phase Has No Escape
- **File:** `src/components/game/QuickeningOverlay.tsx:78-105`
- **Type:** UX
- **Fix:** Add dismiss/skip button or timeout.

### M-16: Double-Fire on Mobile Touch+Click
- **File:** `src/components/game/IntroScreen.tsx:416-418`
- **Type:** UX
- **Fix:** Use only `onClick` or add `e.preventDefault()` on `onTouchStart`.

### M-17: GameSidebar Unsafe Type Cast
- **File:** `src/components/game/GameSidebar.tsx:87-89`
- **Type:** Type Safety
- **Fix:** Add `location`/`currentScene` to GameState type definition.

### M-18: ComicPanel Expanded Image Shows Without URL Guard
- **File:** `src/components/game/ComicPanel.tsx:111`
- **Type:** Rendering
- **Fix:** Add `expanded.imageUrl &&` guard before `<img>`.

### M-19: `checkLmConnection` Stale Closure
- **File:** `src/components/game/IntroScreen.tsx:55-85`
- **Type:** State
- **Fix:** Wrap in `useCallback` with proper deps.

### M-20: Next-auth v4 with React 19
- **File:** `package.json`
- **Type:** Dependency
- **Fix:** Upgrade to Auth.js v5 or pin React 18.

### M-21: Zod v4 Compatibility Risk
- **File:** `package.json`
- **Type:** Dependency
- **Fix:** Verify all consumers use v4 API correctly.

### M-22: Render-Blocking Google Fonts Import
- **File:** `src/app/globals.css:9`
- **Type:** Performance
- **Fix:** Remove `@import url(...)` — fonts already self-hosted.

### M-23: Missing Mobile Alternative for Character Details
- **File:** `src/app/globals.css:883`
- **Type:** CSS/UX
- **Fix:** Implement bottom sheet or modal for mobile.

### M-24: `.font-title` Class Uses Wrong Variable
- **File:** `src/app/globals.css:156`
- **Type:** CSS/Logic
- **Description:** `.font-title` applies `--font-heading` (Wonderland), not `--font-title` (Rivendell). Developers expect Rivendell but get Wonderland.
- **Fix:** Change to `var(--font-title)`.

---

## 🟢 LOW (26 issues)

| # | File | Type | Description |
|---|------|------|-------------|
| L-01 | `api/entities/route.ts:11` | Logic | `limit` can be 0 or negative |
| L-02 | `api/entities/route.ts:13` | Logic | `minHp` NaN from non-numeric input |
| L-03 | `api/openrouter/route.ts:78-83` | Code Quality | Redundant conditional branches |
| L-04 | `api/tts/route.ts:94-98` | Logic | Temp file cleanup ordering (safe but unclear) |
| L-05 | `api/game-entities/route.ts:62,81,143` | Code Quality | Dragon IDs triplicated, `isDragon` dead code |
| L-06 | `api/game-entities/route.ts:99-100` | Code Quality | `title` and `epithet` are identical |
| L-07 | `api/game-entities/route.ts:104-106` | Code Quality | `hp`, `maxHp`, `HP` redundant |
| L-08 | `api/entity/[id]/route.ts:16-39` | Performance | 3 sequential DB queries instead of 1 |
| L-09 | `api/entity/[id]/route.ts:45` | Security | Raw DB entity returned with internal fields |
| L-10 | `app/layout.tsx:21-22` | Performance | Unnecessary Google Fonts preconnect |
| L-11 | `prisma/schema.prisma` | Code Quality | No migration strategy (db push only) |
| L-12 | Multiple API routes | Code Quality | ~50 `any` type usages |
| L-13 | `GameSidebar.tsx` | Code Quality | ~30 `any` types (quests, NPC relations, consequence state) |
| L-14 | `useGameEngine.ts` | Code Quality | 32 console.log calls (debug hotspot) |
| L-15 | `SidebarDiceArea.tsx:211` | Code Quality | Unused eslint-disable directive |
| L-16 | `useGameAudio.ts:402` | Code Quality | Unused eslint-disable directive |
| L-17 | `CombatOverlay.tsx:153,158` | UX | Flee and Ranged use same icon |
| L-18 | `CombatOverlay.tsx:456` | Rendering | Actions use index as key |
| L-19 | `QuickeningOverlay.tsx:74` | Dead Code | `resultPhase` state never used |
| L-20 | `GameHeader.tsx:93,107-111` | Dead Code | `antagonistRevealPlayed` unused |
| L-21 | `GameHeader.tsx:201-240` | UX | Volume panel no click-outside dismiss |
| L-22 | `Multiple files` | DRY | `ALIGNMENT_BORDER` duplicated in 3 files |
| L-23 | `Multiple files` | DRY | `abilityScoreColor`/`alignColor` duplicated |
| L-24 | `SceneIllustration.tsx:200-209` | State | Stale ref closure in `isKey` memo |
| L-25 | `ActiveCharacterCard.tsx:116` | Rendering | Score parsing fails for "18/10" format |
| L-26 | `TestOfFaith.tsx:49` | UX | "Trust Fate" always rolls exactly 10 |

---

# B. PARETO ANALYSIS (80/20)

The top 20% of issues causing 80% of system risk:

| Rank | Issue | Impact |
|------|-------|--------|
| 1 | **C-03: Free-text actions silently dropped** | Core game mechanic broken — players can't type custom actions |
| 2 | **C-01: API key exposed** | Financial risk — anyone can steal and use the key |
| 3 | **C-02: SSRF in LM Studio proxy** | Security — internal infrastructure scannable |
| 4 | **C-05/C-06: TS errors + StrictMode off** | Type safety provides zero protection; bugs hidden until production |
| 5 | **C-07: ESLint neutered** | No automated bug detection — relies entirely on manual review |
| 6 | **C-04: Tailwind config dead** | Theme system non-functional; potential visual regressions |
| 7 | **H-08: Caption font on ALL small text** | Every small UI element gets decorative font — pervasive visual issue |
| 8 | **H-05: Map lines broken** | Core navigation feature visually broken |
| 9 | **H-11: XSS via dangerouslySetInnerHTML** | AI content could execute scripts |
| 10 | **H-02: JSON.parse crash** | One corrupt DB row crashes entire entity endpoint |

**Estimated impact if fixed:** Eliminates 2 critical gameplay bugs, 3 critical security vulnerabilities, and restores automated bug detection.

---

# C. EISENHOWER MATRIX

## 🔴 Urgent + Important (Breaks system / security risk)
- C-01: API key exposed → Delete `/api/get-key`
- C-02: SSRF → Lock down LM Studio URL
- C-03: Free-text actions dropped → Pass `customText` parameter
- C-08: Prisma client stale → Run `prisma generate`
- H-11: XSS via AI content → Add DOMPurify
- H-13: `NEXT_PUBLIC_` key exposure → Remove public fallback

## 🟠 Important, Not Urgent (Architecture / scalability)
- C-04: Tailwind config dead → Migrate to CSS-first
- C-05: TS errors suppressed → Fix type errors, re-enable
- C-06: StrictMode off → Enable and fix issues
- C-07: ESLint neutered → Re-enable rules incrementally
- H-02: JSON.parse crash → Add try-catch wrappers
- H-03: Error masking → Return proper status codes
- H-10: No API timeouts → Add AbortController
- H-14: Z-index chaos → Establish scale system
- M-01 through M-24: Medium issues batch

## 🟡 Urgent, Not Important (Minor UX bugs)
- H-05: Map connection lines broken
- H-06: setInterval memory leak
- H-08: Fantasy font on ALL small text
- M-06: Mobile keyboard auto-focus
- M-08: All dice shown as d20
- M-09: Division by zero
- M-13: Fate roll bias
- M-16: Double-fire on mobile touch

## 🟢 Not Urgent, Not Important (Cosmetic / low-value)
- L-01 through L-26: All low-severity issues
- Dead code cleanup (L-05, L-06, L-07, L-19, L-20)
- DRY violations (L-22, L-23)
- Console.log cleanup (L-14)
- Stale eslint-disable directives (L-15, L-16)

---

# D. SYSTEM HEALTH SUMMARY

| Metric | Score |
|--------|-------|
| **Overall Codebase Score** | **42/100** |
| **Stability** | Fragile — multiple critical logic bugs |
| **Security** | Poor — exposed API key, SSRF, XSS vectors |
| **Type Safety** | Near-zero — errors suppressed, `noImplicitAny` off |
| **Code Quality** | Below average — heavy `any` usage, DRY violations |
| **Test Coverage** | 0% — no tests exist |
| **Technical Debt** | **High** |

### Top 5 Risks
1. Players can't type custom actions (core mechanic broken)
2. API key stealable by anyone (financial risk)
3. Internal services scannable via SSRF
4. TypeScript and ESLint provide zero bug protection
5. Tailwind theme system non-functional

---

# E. FIX ROADMAP

## 🚨 Immediate Fixes (Today)
1. **Fix free-text actions** — Pass `customText` in `handleConfirmChoice` (C-03)
2. **Delete `/api/get-key`** — Remove API key exposure (C-01)
3. **Lock down LM Studio URL** — Remove SSRF vector (C-02)
4. **Run `prisma generate`** — Fix 19 TS errors (C-08)
5. **Remove `.text-xs/.text-sm/.text-base` from caption selector** (H-08)

## 📅 Short-Term (This Week)
6. Add DOMPurify for AI content sanitization (H-11)
7. Remove `NEXT_PUBLIC_OPENROUTER_API_KEY` fallback (H-13)
8. Add try-catch around JSON.parse in entity routes (H-02)
9. Fix map connection line transform-origin (H-05)
10. Fix setInterval cleanup in PartySelectionScreen (H-06)
11. Add AbortController timeouts to all external API calls (H-10)
12. Remove Google Fonts @import (M-22)

## 📋 Medium-Term (Next Sprint)
13. Re-enable React StrictMode (C-06)
14. Set `ignoreBuildErrors: false` and fix type errors (C-05)
15. Re-enable critical ESLint rules (C-07)
16. Fix all HIGH severity issues (H-03, H-04, H-09, H-12, H-14)
17. Add rate limiting to TTS endpoint (M-03)
18. Fix `noImplicitAny: false` in tsconfig
19. Clean up ~50 `any` types across codebase

## 🔧 Long-Term Refactors (Next Month)
20. Migrate Tailwind config to CSS-first `@theme` (C-04)
21. Establish z-index scale system (H-14)
22. Replace Envato Elements fonts with properly licensed alternatives (H-09)
23. Upgrade next-auth v4 → Auth.js v5 for React 19 (M-20)
24. Add `.env.example` documenting all required env vars
25. Implement test suite (currently 0% coverage)
26. DRY cleanup: extract shared utilities for alignment colors, ability score colors
27. Remove 32 console.log calls from useGameEngine.ts
28. Remove dead code (unused state, duplicate dragon IDs, redundant fields)

---

*Total issues found: 72 (8 Critical, 14 High, 24 Medium, 26 Low)*
