# DEITIES & DEMIGODS - System Analysis Report

## 📊 PC SELECTION SYSTEM ANALYSIS

### Current Implementation
| Component | Current Behavior | Issue |
|-----------|------------------|-------|
| Party Selection | Human selects ALL party members (max 7) | ❌ No RNG by DM |
| Main PC | First selected hero becomes main PC | ⚠️ No special status |
| Companions | Other selected heroes become queue | ⚠️ Always human-controlled |
| Party Size | Human chooses 1-7 PCs | ⚠️ No DM-guided composition |

### User's Desired System
| Component | Desired Behavior | Status |
|-----------|------------------|--------|
| **1 Main PC** | Human selects from 99+ hero/demigod pool | ❌ NOT IMPLEMENTED |
| **1 Main Companion** | In story most of the time | ❌ NOT IMPLEMENTED |
| **3 PC Heroes** | RNG by DM, in story some of the time | ❌ NOT IMPLEMENTED |
| **3 PC Demigods** | RNG by DM, in story some of the time | ❌ NOT IMPLEMENTED |

### Critical Gap
**ALL PCs are currently HUMAN-CONTROLLED.** The DM only provides action options. There is NO RNG party member selection by the DM.

---

## 🎭 ENTITY POOL COUNTS

### Playable Characters (PC Pool)
| Category | Count | Source |
|----------|-------|--------|
| Heroes | 48 | NPC_NAMES.heroes |
| Krynn Heroes | 16 | KRYNN_HEROES |
| Demigods | 33 | NPC_NAMES.demigods |
| Krynn Demigods | 5 | KRYNN_DEMIGODS |
| **TOTAL PC-ELIGIBLE** | **102** | All pantheons |

### NPCs (DM-Controlled)
| Category | Count | Role |
|----------|-------|------|
| Greater Gods | 41 | Encounter, Ally, Enemy |
| Krynn Greater Gods | ~7 | Encounter, Ally, Enemy |
| Lesser Gods | 49 | Encounter, Ally, Enemy |
| Krynn Lesser Gods | 7 | Encounter, Ally, Enemy |
| Monsters | 16 | Enemy, Roadblock |
| **TOTAL NPCs** | **120** | All encounter types |

### Grand Total: 222 Entities

---

## 🎲 RNG SELECTION SYSTEMS

### Shard Origins (d28)
```
Total Shards: 28
- Original Shards: 19 (Primordial, Greek, Egyptian, Norse, Cthulhu, Melnibonéan, Nehwon, Celtic, Indian, Chinese, Japanese, Central American, Babylonian)
- Krynn Shards: 9 (Graygem, Blue Crystal, Dragonlance, Conclave Blood, Takhisis Crown, Knighthood Honor, Kender Curiosity, Wayreth Key, Fistandantilus Memory)

Selection: Math.floor(Math.random() * 28)
```

### Prophecies (d9)
```
Total Prophecies: 9
1. The Bearer's Burden (Sacrifice)
2. The Bloodline Awakens (Heritage)
3. The Betrayer's Path (Treachery)
4. The Deathless One (Reincarnation)
5. The Oracle's Choice (Fate)
6. The Nameless One (Identity)
7. The Last Defender (Protection)
8. The Unwritten (Defiance)
9. The Chosen One (Misdirection)

Selection: Math.floor(Math.random() * 9) + 1
```

### Antagonists (d53)
```
Greater Gods: 43 candidates
Super Monsters: 10 candidates (HP ≥ 280)
Total: 53 antagonists

Selection: Math.floor(Math.random() * 53)
```

---

## 📜 ACT STRUCTURE ANALYSIS

### Act I - Introduction
**Current Premise:**
- PCs introduced one at a time
- Antagonist is "shadow only"
- Shard revealed, prophecy bound
- Party assembles through story

**Missing Elements:**
- ❌ No explicit turn count for Act I → Act II transition
- ❌ No clear "assembly complete" trigger
- Current code checks: `allPCsIntroduced && allPCsAgreed`

### Act II - Journey
**Current Premise:**
- Full party assembled
- Introduce 1-2 gods per turn
- Antagonist clues revealed
- Prophecy manifestations begin

**Missing Elements:**
- ❌ No explicit turn count for Act II → Act III transition
- ❌ No boss trigger condition
- Current code: Manual phase trigger when antagonist HP drops

### Act III - Boss Fight
**Current Premise:**
- Antagonist identity REVEALED
- 3-Phase boss fight
- Prophecy resolution
- Victory or Death

**Missing Elements:**
- ❌ No explicit win condition (just antagonist HP = 0)
- ❌ No 50/50 success rate mechanic
- ❌ No party composition check for win chance

---

## 🏆 SUCCESS RATE ANALYSIS

### Current Implementation
| Mechanic | Status |
|----------|--------|
| Win Condition | Antagonist HP ≤ 0 |
| Loss Condition | All PCs dead |
| 50/50 Chance | ❌ NOT IMPLEMENTED |
| Party Composition Bonus | ❌ NOT IMPLEMENTED |
| Prophecy Resolution | ❌ NOT IMPLEMENTED |

### User's Desired 50/50 System
The user mentioned "50/50 chance to beat Final Boss in Act III" but this is **NOT IMPLEMENTED**. Current system is:
- Pure combat: Reduce antagonist HP to 0
- No dice roll for campaign success
- No prophecy-based outcome modifier

### Recommended Success Factors
1. **Party Composition** (DM-guided toward Fighter/Mage/Thief/Cleric balance)
2. **Prophecy Resolution** (Did the main PC fulfill their destiny?)
3. **Shard Usage** (Did they use charges wisely?)
4. **NPC Allies** (Did they make allies through Acts I-II?)
5. **Antagonist Clues** (Did they gather enough intel?)

---

## 🔧 REQUIRED IMPLEMENTATIONS

### 1. PC Selection Overhaul
```typescript
// NEEDED: New party selection logic
interface PartyComposition {
  mainPC: Entity           // Human selects from hero/demigod pool
  mainCompanion: Entity    // Human selects OR always present
  rngHeroes: Entity[]      // 3 heroes RNG by DM
  rngDemigods: Entity[]    // 3 demigods RNG by DM
}
```

### 2. Act Transition System
```typescript
// NEEDED: Clear act transitions
const ACT_THRESHOLDS = {
  ACT_1_TO_2: 10,  // After 10 turns
  ACT_2_TO_3: 25,  // After 25 turns
  FINAL_BOSS_HP: 0 // Victory condition
}
```

### 3. Success Rate Calculator
```typescript
// NEEDED: 50/50 base + modifiers
function calculateSuccessRate(party: Entity[], prophecy: Prophecy, clues: string[]): number {
  let base = 50 // 50/50
  if (hasBalancedParty(party)) base += 15
  if (prophecyFulfilled(prophecy)) base += 20
  if (clues.length >= 5) base += 15
  return Math.min(base, 95)
}
```

### 4. RNG Party Member Introduction
```typescript
// NEEDED: DM-controlled party expansion
function introduceRNGPartyMember(gs: GameState): Entity {
  const pool = gs.act === 'act1' ? HEROES : DEMIGODS
  const available = pool.filter(e => !gs.encounteredIds.includes(e.id))
  return available[Math.floor(Math.random() * available.length)]
}
```

---

## 📋 SUMMARY TABLE

| System | Current | Desired | Gap |
|--------|---------|---------|-----|
| Main PC Selection | Human (first of selection) | Human from 99+ pool | ⚠️ Partial |
| Main Companion | Human (second of selection) | Always in story | ❌ Missing |
| 3 RNG Heroes | ❌ Not implemented | DM-controlled introduction | ❌ Missing |
| 3 RNG Demigods | ❌ Not implemented | DM-controlled introduction | ❌ Missing |
| Act I Premise | ✅ Complete | Shadow antagonist, shard reveal | ✅ OK |
| Act II Premise | ✅ Complete | Full party, god encounters | ✅ OK |
| Act III Premise | ⚠️ Partial | Boss fight, prophecy resolution | ⚠️ Missing resolution |
| Success Rate | ❌ Not implemented | 50/50 + modifiers | ❌ Missing |
| Shard RNG | ✅ d28 | 28 shards | ✅ OK |
| Prophecy RNG | ✅ d9 | 9 prophecies | ✅ OK |
| Antagonist RNG | ✅ d53 | 53 candidates | ✅ OK |

---

## 🎯 RECOMMENDATION

The core RNG systems (Shard, Prophecy, Antagonist) are working correctly. The main gaps are:

1. **PC Selection System** - Needs complete overhaul to support RNG party members by DM
2. **Success Rate Mechanic** - 50/50 system not implemented
3. **Act Transitions** - No explicit turn-based transitions
4. **Prophecy Resolution** - No Act III prophecy payoff mechanic

Build priority:
1. 🔴 HIGH: Implement RNG party member system
2. 🔴 HIGH: Add success rate calculator with 50/50 base
3. 🟡 MEDIUM: Define act transition thresholds
4. 🟡 MEDIUM: Add prophecy resolution outcomes
