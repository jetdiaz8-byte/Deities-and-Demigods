# Deities & Demigods — Worklog

---

## v2.3.0 — UI Overhaul + Skill System Activation

**Date:** 2026-04-05
**Version:** 2.2.0 → 2.3.0

### Full Change Table

| # | File | Section | Change | Type |
|---|------|---------|--------|------|
| 1 | `src/components/game/IntroScreen.tsx` | Imports | Added `Flame, Award, Heart, Sparkles, Skull, Volume2` from lucide-react | Enhancement |
| 2 | `src/components/game/IntroScreen.tsx` | Feature Grid | Expanded from 4 items to **10 items**: Choose Your Hero, Inventory, Quests, Save/Load, Shards, Achievements, Injuries, Prophecies, Boss Fights, Voice Narration | Enhancement |
| 3 | `src/components/game/IntroScreen.tsx` | Layout | Changed grid from `grid-cols-2 md:grid-cols-4` → `grid-cols-2 md:grid-cols-5` for 2×5 layout | Enhancement |
| 4 | `src/components/game/IntroScreen.tsx` | Text Fix | "Enter your keys" → "Enter your key" (Groq removed, only Gemini key) | Bug Fix |
| 5 | `src/components/game/IntroScreen.tsx` | Description Fix | "Choose your heroes" → "Choose Your Hero" (only 1 PC) | Bug Fix |
| 6 | `src/components/game/IntroScreen.tsx` | Navigation | Added links to DM Handbook (`/dm-handbook`) and Codex (`/codex`) alongside Player's Guide | Enhancement |
| 7 | `src/app/rulebook/page.tsx` | Tab 1 Fix | "Start New Campaign" → ⚔ "Begin Your Legend" ⚔ (matching actual button) | Bug Fix |
| 8 | `src/app/rulebook/page.tsx` | Tab 1 Fix | "2-4 recommended" → "Select 1 main PC — DM auto-selects 1 companion" | Bug Fix |
| 9 | `src/app/rulebook/page.tsx` | New Tab 14 | **Achievements** — 4 tiers (bronze/silver/gold/legendary) with live counts, 7 categories, how earned | New Feature |
| 10 | `src/app/rulebook/page.tsx` | New Tab 15 | **Audio & Voice** — 8 ambient themes, SFX events, TTS narration, auto scene detection | New Feature |
| 11 | `src/app/rulebook/page.tsx` | New Tab 16 | **Difficulty & Balance** — Act-by-act ranges, 13 dynamic factors, pressure points | New Feature |
| 12 | `src/app/rulebook/page.tsx` | Imports | Added `Trophy, Volume2, Scale` from lucide-react, achievement data from `@/lib/achievements` | Enhancement |
| 13 | `src/app/dm-handbook/page.tsx` | Token Fix | Regular turn tokens: "4,000" → "6,000" (verified against `useGameEngine.ts` line 934) | Bug Fix |
| 14 | `src/app/dm-handbook/page.tsx` | New Tab 14 | **Achievement System** — How DM tracks awards, tier/category data, success rate formula integration | New Feature |
| 15 | `src/app/dm-handbook/page.tsx` | New Tab 15 | **Audio Engine** — 8 procedural themes with frequencies, 9 SFX events, scene detection algorithm | New Feature |
| 16 | `src/app/dm-handbook/page.tsx` | Imports | Added `Volume2, Music` from lucide-react, achievement data from `@/lib/achievements` | Enhancement |
| 17 | `src/app/codex/page.tsx` | Prophecy Fix | Hardcoded 8-item `PROPHECY_DATA` → imported from `@/lib/prophecyData` (now **9 actual prophecies** with real riddle text) | Bug Fix |
| 18 | `src/app/codex/page.tsx` | Heading Fix | "The Eight Prophecies" → "The {PROPHECIES.length} Prophecies" (dynamic) | Bug Fix |
| 19 | `src/app/codex/page.tsx` | Prophecy Display | Shows actual prophecy themes (Sacrifice, Heritage, etc.) and riddles instead of fabricated summaries | Enhancement |
| 20 | `src/app/codex/page.tsx` | New Section | **Achievements** — Total count, 4 tier cards with live counts, 7 category cards with icons | New Feature |
| 21 | `src/app/codex/page.tsx` | New Section | **Audio & Narration** — 8 procedural theme cards, 9 SFX badges, TTS info, auto scene detection | New Feature |
| 22 | `src/app/codex/page.tsx` | Imports | Added `PROPHECIES` from prophecyData, `ACHIEVEMENT_DEFS/TIER_CONFIG/CATEGORY_CONFIG` from achievements, `Trophy/Volume2` icons | Enhancement |
| 23 | `src/lib/gameHelpers.ts` | New Function | **`inferClassesFromCharacter(char)`** — Parses Krynn level field, non-Krynn abilities, and ability scores to infer AD&D class levels (fighter/cleric/magic-user/thief) | New Feature |
| 24 | `src/lib/gameHelpers.ts` | New Function | **`getClassLabel(entity)`** — Returns human-readable class string like "Fighter 25 / Thief 25 / Magic User 18" | New Feature |
| 25 | `src/hooks/useGameEngine.ts` | Wiring | `confirmPartySelection` now calls `inferClassesFromCharacter(mainPC)` to populate `fighterLevel/clericLevel/magicUserLevel/thiefLevel` on Entity before skill assignment | New Feature |
| 26 | `src/components/game/ActiveCharacterCard.tsx` | New Section | **Skills** — Shows D&D 5e skill proficiency badges (cyan) for heroes and demigods only, placed between Ability Scores and Conditions | New Feature |
| 27 | `src/components/game/PortraitModal.tsx` | New Section | **Skill Proficiencies** — Full-size skill badges with section header for heroes and demigods only, placed between Ability Scores and Domain/Symbol | New Feature |
| 28 | `package.json` | Version | `2.2.0` → `2.3.0` | Version Bump |

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Skills only for heroes/demigods as PCs | Gods use named divine abilities instead — preserving power fantasy and lore accuracy |
| Top 3 classes from inference | Keeps skill count manageable (max ~9 proficiencies) while reflecting character identity |
| Class inference from 3 sources (Krynn level, abilities text, ability scores) | Maximum compatibility with existing character data without requiring data migration |
| Gods keep abilities, not skills | Zeus doesn't need "+2 Persuasion" when he has "Lightning bolt barrage — 100 dice/day" |
| Achievement data imported live from source | Prevents future sync issues between docs and actual data |

### Settings Options (Deferred — In Memory)

| Category | Settings | Implementation Notes |
|----------|----------|---------------------|
| **Audio** | Master/SFX/Ambient Volume sliders, SFX toggle, Ambient toggle, TTS voice + toggle | All hooks exist in `useGameAudio.ts` — just needs UI |
| **Display** | Text size, Dark/Light theme (`next-themes` installed), Reduce animations | `next-themes` already in package.json |
| **Gameplay** | Difficulty (Easy/Normal/Hard), Show Dice Rolls, Narration Length, Auto-Save | Difficulty adjusts base success rate |
| **Accessibility** | High contrast, Large text, Dyslexia font, Screen reader mode | CSS-based, low effort |
| **Narrative** | Style (Gaiman/Tolkien/Lovecraft), Combat verbosity, Moral tone, Puzzle hints | Passed to Gemini prompt |
| **Data** | Export/Import saves, Clear saves, Reset settings | File download/upload |
