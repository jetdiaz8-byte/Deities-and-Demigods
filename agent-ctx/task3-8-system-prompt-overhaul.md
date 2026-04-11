# Task 3-8: System Prompt Overhaul — COMPLETE

## Summary
Overhauled the Gemini/OpenRouter system prompt in `buildDMSystem()` (src/hooks/useGameEngine.ts).

## Changes Made

### 1. Removed shard god-summoning from system prompt
- **Line 2168**: Replaced `Charges: ${gs.shardCharges}/2 | Summoned: ${gs.shardSummoned.join(',') || 'none'}` with `Charges: ${gs.shardCharges}/3 | Shield Used: ${(gs as any).shardShieldUsed ? 'YES' : 'no'}`
- **Line ~2095 (original)**: Removed `PENDING: summon "${gs.pendingShardSummon}" with d20 roll DC10.` conditional block
- **Line ~2245 (original JSON schema)**: Removed entire `"shard_event":{"invoked":false,"invoker_pc_id":null,"intended_god":"string|null","roll":0,"success":false,"summoned_id":"string|null","summoned_name":"string|null","is_greater":false}` from JSON output schema

### 2. Added new shard 3-charge system (Rule 11)
- **Lines 2086-2107**: Replaced old rule 11 "THE SHARD IS CENTRAL" with comprehensive 3-charge system:
  - CHARGE 1: Shard Insight (player-invoked question to shard)
  - CHARGE 2: Shard Shield (auto-triggered death prevention)
  - CHARGE 3: Shard's Final Word (Act III only prophecy lens)
  - Display format: 🔮(3) 🔮🔮🔮 notation
  - Explicit: no damage, no roll boosts, no god summoning

### 3. Overhauled narration style rules (Rule 3)
- **Lines 1952-1971**: Replaced generic narration rules with turn-specific structure:
  - TURN 0: Shard-only intro (2 paragraphs, ~1500 chars, TTS-friendly)
  - TURN 1: Full introduction (PC relevance, shard relevance, companion reason, prophecy tease, hook, dialogue)
  - REGULAR TURNS (2+): Hard 80-150 word paragraph limit
  - CRITICAL: Never repeat/rephrase previous narration

### 4. Overhauled story pacing rules (Rule 10a)
- **Lines 2023-2085**: Replaced simple Act I/II/III notes with detailed turn-by-turn structure:
  - Act I (Turns 0-21): Explicit turn ranges for each party member join, shard event, first blood
  - Party Foreground Rotation rules
  - Act II (Turns 22-35): Quickening trigger, God Ally Recruitment rules
  - Act II→III Trigger: Narrative (not turn-count) based
  - Act III: 4 phases (Revelation, Preparation, Boss Fight, The Question)

### 5. Updated JSON OUTPUT schema
- **Removed**: `shard_event` object entirely
- **Added**: `"shard_insight_used":false` after `clue_revealed` field

### 6. Updated PbTA outcome tiers (Rule 16)
- **Lines 2134-2138**: Replaced blind mechanical penalty descriptions:
  - partial_success: AI narrates cost, includes damage in damage_dealt/state_updates
  - miss: AI narrates consequences, NEVER apply blind mechanical penalties

### 7. Added v2.19.0 note
- **Line 2141**: Added `v2.19.0: All damage is handled via damage_dealt/state_updates. No blind HP penalties on miss/partial.`

## Pre-existing TS errors (NOT introduced by this change)
- Line 3: Cannot find module 'react' (missing types in environment)
- Line 4883: 'cd' is of type 'unknown' (pre-existing)
- Line 4885: Spread types issue (pre-existing)

## Verification
- TypeScript compilation: No new errors introduced by changes
- All changes confined to `buildDMSystem()` function
- No changes to `buildDefaultOptions`, `confirmChoice`, `renderResult`, or other functions
