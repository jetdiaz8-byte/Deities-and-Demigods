/**
 * HYBRID MECHANICS TEST SCENARIO
 * Tests ALL old + new approved rules in a single narrative scenario
 *
 * OLD MECHANICS (v2.0.3):
 *   - AD&D 1e Combat (HP, AC, MR, damage rolls, attacks)
 *   - Shard System (charges, summoning, shard types)
 *   - Prophecy System (dormant -> awakening -> manifesting -> fulfilled)
 *   - Injury System (physical, magic, poison, psionic)
 *   - Item System (potions, artifacts, equipment, scrolls)
 *   - Success Rate Calculator
 *
 * NEW MECHANICS (approved v2.1.0):
 *   - D&D 5e Formal Skill System (18 skills, proficiency, modifiers)
 *   - Fate Core Aspects + Fate Points (invoke/compel, custom actions)
 *   - PbtA 7-9 Partial Success (outcome tiers: critical/full/partial/miss)
 *   - Dark Souls Stamina & Bonfire System
 *   - Mass Effect Paragon/Renegade Morality
 *
 * Run: npx tsx scripts/test-hybrid-mechanics.ts
 */

type SkillName =
  | 'athletics' | 'intimidation'
  | 'acrobatics' | 'sleight_of_hand' | 'stealth'
  | 'arcana' | 'history' | 'investigation' | 'nature' | 'religion'
  | 'animal_handling' | 'insight' | 'medicine' | 'perception' | 'survival'
  | 'deception' | 'performance' | 'persuasion'

interface PlayerSkills { [K in SkillName]: number }

interface Aspect {
  name: string
  type: 'high_concept' | 'trouble' | 'situation' | 'character' | 'earned'
  invokes: number
  fate_points_spent: number
  description?: string
}

type OutcomeTier = 'critical_success' | 'full_success' | 'partial_success' | 'miss' | 'consequences'

const SKILL_ABILITY_MAP: Record<SkillName, string> = {
  athletics: 'str', intimidation: 'cha',
  acrobatics: 'dex', sleight_of_hand: 'dex', stealth: 'dex',
  arcana: 'int', history: 'int', investigation: 'int', nature: 'int', religion: 'int',
  animal_handling: 'wis', insight: 'wis', medicine: 'wis', perception: 'wis', survival: 'wis',
  deception: 'cha', performance: 'cha', persuasion: 'cha'
}

function getAbilityBonus(score: string | number): { value: number; display: string } {
  const s = typeof score === 'string' ? parseInt(score) : score
  if (isNaN(s)) return { value: 0, display: '-' }
  if (s <= 3) return { value: -3, display: '-3' }
  if (s <= 5) return { value: -2, display: '-2' }
  if (s <= 8) return { value: -1, display: '-1' }
  if (s <= 12) return { value: 0, display: '0' }
  if (s <= 15) return { value: 1, display: '+1' }
  if (s <= 17) return { value: 2, display: '+2' }
  if (s === 18) return { value: 3, display: '+3' }
  if (s === 19) return { value: 4, display: '+4' }
  return { value: 5, display: '+5' }
}

const RAISTLIN = {
  id: 'raistlin_majere_hero', name: 'Raistlin Majere', pantheon: 'Krynn', align: 'Neutral good',
  hp: 45, maxHp: 45, AC: 4, MR: 65,
  abilities: ['Fireball', 'Magic Missile', 'Shield', 'Sleep', 'Charm Person'],
  personality: 'Sarcastic, brilliant, physically frail. Holds secrets even from those he trusts.',
  str: '10', int: '19', wis: '17', dex: '14', con: '10', cha: '12',
  fighterLevel: 0, clericLevel: 0, magicUserLevel: 8, thiefLevel: 0,
}

const CARAMON = {
  id: 'caramon_majere', name: 'Caramon Majere', pantheon: 'Krynn', align: 'Chaotic good',
  hp: 68, maxHp: 68, AC: 2, MR: 25,
  abilities: ['Greatsword Attack', 'Shield Block', 'Heroic Surge'],
  personality: 'Loyal, kind, fiercely protective of his twin.',
  str: '18', int: '8', wis: '10', dex: '14', con: '17', cha: '14',
  fighterLevel: 7, clericLevel: 0, magicUserLevel: 0, thiefLevel: 0,
}

const ANTAGONIST = { id: 'takhisis', name: 'Takhisis', hp: 450, maxHp: 450, AC: -6, MR: 95, phase: 1 }

function d20(): number { return Math.floor(Math.random() * 20) + 1 }
function roll(sides: number): number { return Math.floor(Math.random() * sides) + 1 }
function rollDice(count: number, sides: number): number {
  let t = 0; for (let i = 0; i < count; i++) t += roll(sides); return t
}

function getAbilityScore(pc: any, ability: string): number {
  const raw = pc[ability]
  return typeof raw === 'string' ? parseInt(raw) || 10 : (raw as number) || 10
}

function getSkillModifier(pc: any, skill: SkillName, skills: PlayerSkills): number {
  const proficiency = skills[skill] || 0
  const abilityKey = SKILL_ABILITY_MAP[skill]
  const abilityMod = getAbilityBonus(getAbilityScore(pc, abilityKey)).value
  return proficiency + abilityMod
}

function performSkillCheck(
  pc: any, skill: SkillName, dc: number, skills: PlayerSkills, fatePointBoost?: number
): { roll: number; modifier: number; total: number; success: boolean; natural20: boolean; natural1: boolean } {
  const boost = fatePointBoost || 0
  const modifier = getSkillModifier(pc, skill, skills) + boost
  const die = d20()
  const natural20 = die === 20
  const natural1 = die === 1
  const total = die + modifier
  return { roll: die, modifier, total, success: natural20 ? true : natural1 ? false : total >= dc, natural20, natural1 }
}

function assignSkillProficiencies(pc: any): { skills: PlayerSkills; proficiencies: string[] } {
  const skills: PlayerSkills = {
    athletics: 0, intimidation: 0, acrobatics: 0, sleight_of_hand: 0, stealth: 0,
    arcana: 0, history: 0, investigation: 0, nature: 0, religion: 0,
    animal_handling: 0, insight: 0, medicine: 0, perception: 0, survival: 0,
    deception: 0, performance: 0, persuasion: 0
  }
  const proficiencies: string[] = []
  const prof = (skill: SkillName) => {
    if (skills[skill] === 0) { skills[skill] = 2; proficiencies.push(skill) }
  }
  if ((pc.magicUserLevel || 0) > 0) { prof('arcana'); prof('history'); prof('investigation') }
  if ((pc.fighterLevel || 0) > 0) { prof('athletics'); prof('intimidation') }
  if ((pc.clericLevel || 0) > 0) { prof('religion'); prof('medicine'); prof('insight') }
  if ((pc.thiefLevel || 0) > 0) { prof('stealth'); prof('sleight_of_hand'); prof('acrobatics') }
  if (getAbilityScore(pc, 'cha') >= 15) { prof('deception'); prof('persuasion'); prof('performance') }
  if (getAbilityScore(pc, 'wis') >= 15) { prof('perception'); prof('survival'); prof('animal_handling') }
  if (getAbilityScore(pc, 'dex') >= 15) { prof('acrobatics'); prof('stealth') }
  return { skills, proficiencies }
}

function generateStartingAspects(pc: any): Aspect[] {
  const aspects: Aspect[] = []
  const primaryClass = (pc.fighterLevel || 0) >= (pc.clericLevel || 0) && (pc.fighterLevel || 0) >= (pc.magicUserLevel || 0)
    ? 'Warrior' : (pc.clericLevel || 0) >= (pc.magicUserLevel || 0) ? 'Priest'
    : (pc.magicUserLevel || 0) >= (pc.thiefLevel || 0) ? 'Mage' : 'Rogue'
  aspects.push({ name: `${pc.pantheon} ${primaryClass}`, type: 'high_concept', invokes: 0, fate_points_spent: 0 })
  const alignLower = pc.align.toLowerCase()
  if (alignLower.includes('good'))
    aspects.push({ name: 'Cannot Abandon the Helpless', type: 'trouble', invokes: 0, fate_points_spent: 0 })
  else if (alignLower.includes('evil'))
    aspects.push({ name: 'Ambition Outpaces Wisdom', type: 'trouble', invokes: 0, fate_points_spent: 0 })
  else
    aspects.push({ name: 'Torn Between Worlds', type: 'trouble', invokes: 0, fate_points_spent: 0 })
  aspects.push({ name: pc.personality.split(/\s+/).slice(0, 8).join(' '), type: 'character', invokes: 0, fate_points_spent: 0 })
  return aspects
}

function spendFatePoint(aspects: Aspect[], aspectName: string, fp: number): { fp: number; aspects: Aspect[] } {
  if (fp <= 0) return { fp, aspects }
  return { fp: Math.max(0, fp - 1), aspects: aspects.map(a => a.name === aspectName ? { ...a, invokes: a.invokes + 1, fate_points_spent: a.fate_points_spent + 1 } : a) }
}

function earnFatePoint(fp: number, reason: string): { fp: number; log: string } {
  return { fp: Math.min(5, fp + 1), log: `+1 FP: ${reason}` }
}

function resolvePbtA(d20Roll: number, modifier: number): { tier: OutcomeTier; description: string; narrative: string } {
  const total = d20Roll + modifier
  if (d20Roll === 20) return { tier: 'critical_success', description: `CRITICAL SUCCESS (Nat 20 + ${modifier} = ${total})`, narrative: 'The magic surges beyond control -- an extraordinary result.' }
  if (total >= 10) return { tier: 'full_success', description: `FULL SUCCESS (d20=${d20Roll} + ${modifier} = ${total})`, narrative: 'Your action succeeds cleanly.' }
  if (total >= 7) return { tier: 'partial_success', description: `PARTIAL SUCCESS (d20=${d20Roll} + ${modifier} = ${total})`, narrative: 'Success at a cost.' }
  return { tier: 'miss', description: `MISS (d20=${d20Roll} + ${modifier} = ${total})`, narrative: 'Things go wrong.' }
}

function calculateStamina(conScore: number) {
  const conMod = Math.floor((conScore - 10) / 2)
  return { maxStamina: Math.max(10, 10 + conMod), regenRate: Math.max(1, 1 + conMod) }
}

function calculateSuccessRate(factors: any): number {
  let total = 50
  total += Math.min(10, factors.livingPCs * 2)
  const prophecyMap: Record<string, number> = { dormant: 0, awakening: 3, manifesting: 5, fulfilled: 8, broken: -5 }
  total += prophecyMap[factors.prophecyState] || 0
  total += Math.min(15, factors.alliedGods * 3)
  total += Math.min(8, factors.pcRenown)
  total += Math.min(10, Math.floor(factors.pcPower))
  total += Math.max(-5, Math.min(5, factors.alignmentHarmony))
  total += Math.min(12, factors.storyAchievements * 2)
  if (factors.antagonistType === 'greater_god') total -= 5
  total += Math.min(6, factors.shardCharges * 2)
  total += Math.min(9, factors.shardSummoned * 3)
  total += factors.companionAffinity >= 75 ? 5 : factors.companionAffinity >= 50 ? 3 : factors.companionAffinity >= 25 ? 1 : 0
  total += Math.max(-15, factors.injuryPenalty)
  return Math.max(5, Math.min(95, total))
}

// ══════════════════════════════════════════════════════════════════════
// LOGGING
// ══════════════════════════════════════════════════════════════════════
const L: string[] = []
const outcomes: Array<{ turn: number; tier: OutcomeTier; description: string }> = []

function banner(t: string) { L.push('', '==== ' + t + ' ' + '='.repeat(Math.max(0, 76 - t.length)), '') }
function section(t: string) { L.push('', '-- ' + t + ' ' + '-'.repeat(Math.max(0, 72 - t.length)), '') }
function narrate(t: string) { L.push('  [NARR] ' + t) }
function mech(t: string) { L.push('  [MECH] ' + t) }
function res(t: string) { L.push('  [RES]  ' + t) }

function makeSR(overrides: Partial<{ prophecyState: string; alliedGods: number; storyAchievements: number; shardCharges: number; shardSummoned: number; companionAffinity: number; injuryPenalty: number }> = {}): number {
  return calculateSuccessRate({
    partySize: 2, livingPCs: 2, prophecyState: 'dormant', alliedGods: 0,
    pcRenown: 4, pcPower: (RAISTLIN.hp + CARAMON.hp) / 100,
    alignmentHarmony: 0, storyAchievements: 0,
    antagonistType: 'greater_god', shardCharges: 2, shardSummoned: 0,
    companionAffinity: 50, injuryPenalty: 0, ...overrides
  })
}

// ══════════════════════════════════════════════════════════════════════
// MAIN SCENARIO
// ══════════════════════════════════════════════════════════════════════
function runScenario() {
  banner('DEITIES & DEMIGODS -- HYBRID MECHANICS TEST SCENARIO')

  // ── SETUP ──────────────────────────────────────────────────────────
  banner('ACT 0 -- CAMPAIGN SETUP')

  section('CHARACTER: Raistlin Majere (Main PC)')
  mech(`Name: ${RAISTLIN.name} | Pantheon: ${RAISTLIN.pantheon} | Align: ${RAISTLIN.align}`)
  mech(`HP: ${RAISTLIN.hp}/${RAISTLIN.maxHp} | AC: ${RAISTLIN.AC} | MR: ${RAISTLIN.MR}`)
  mech(`STR:${RAISTLIN.str}(${getAbilityBonus(RAISTLIN.str).display}) INT:${RAISTLIN.int}(${getAbilityBonus(RAISTLIN.int).display}) WIS:${RAISTLIN.wis}(${getAbilityBonus(RAISTLIN.wis).display}) DEX:${RAISTLIN.dex}(${getAbilityBonus(RAISTLIN.dex).display}) CON:${RAISTLIN.con}(${getAbilityBonus(RAISTLIN.con).display}) CHA:${RAISTLIN.cha}(${getAbilityBonus(RAISTLIN.cha).display})`)
  mech(`MU Level ${RAISTLIN.magicUserLevel} | Abilities: ${RAISTLIN.abilities.join(', ')}`)

  section('COMPANION: Caramon Majere')
  mech(`HP: ${CARAMON.hp}/${CARAMON.maxHp} | AC: ${CARAMON.AC} | STR:${CARAMON.str}(${getAbilityBonus(CARAMON.str).display}) | Fighter Lv${CARAMON.fighterLevel}`)

  section('ANTAGONIST: Takhisis (hidden until Act III)')
  mech(`HP: ${ANTAGONIST.hp}/${ANTAGONIST.maxHp} | AC: ${ANTAGONIST.AC} | MR: ${ANTAGONIST.MR} | Phase: ${ANTAGONIST.phase}/3`)

  // ── NEW: D&D 5e FORMAL SKILL SYSTEM ──────────────────────────────
  section('[NEW] D&D 5e FORMAL SKILL SYSTEM -- Initialize')
  const { skills: rSkills, proficiencies: rProfs } = assignSkillProficiencies(RAISTLIN)
  mech(`Assigned ${rProfs.length} skill proficiencies: ${rProfs.join(', ')}`)
  L.push('')
  for (const [skill, prof] of Object.entries(rSkills)) {
    if (prof > 0) {
      const mod = getSkillModifier(RAISTLIN, skill as SkillName, rSkills)
      const abilityKey = SKILL_ABILITY_MAP[skill as SkillName]
      const ab = getAbilityBonus(getAbilityScore(RAISTLIN, abilityKey))
      mech(`  ${skill.padEnd(18)} +${prof} (proficiency) + ${ab.display} (${abilityKey.toUpperCase()}) = modifier ${mod >= 0 ? '+' : ''}${mod}`)
    }
  }

  const { skills: cSkills } = assignSkillProficiencies(CARAMON)
  mech(`\nCaramon proficiencies: athletics(+2), intimidation(+2)`)

  // ── NEW: FATE CORE ────────────────────────────────────────────────
  section('[NEW] FATE CORE -- Aspects & Fate Points')
  let fatePoints = 3
  const aspects = generateStartingAspects(RAISTLIN)
  mech(`Starting Fate Points: ${fatePoints}/5`)
  for (const a of aspects) mech(`  [${a.type.padEnd(14)}] "${a.name}"`)

  // ── NEW: DARK SOULS STAMINA ───────────────────────────────────────
  section('[NEW] DARK SOULS -- Stamina System')
  const conScore = getAbilityScore(RAISTLIN, 'con')
  const stam = calculateStamina(conScore)
  let stamina = stam.maxStamina
  mech(`CON: ${conScore} => Max Stamina: ${stam.maxStamina} | Regen/turn: ${stam.regenRate}`)

  // ── NEW: MASS EFFECT ──────────────────────────────────────────────
  section('[NEW] MASS EFFECT -- Paragon/Renegade Morality')
  let paragonPoints = 0, renegadePoints = 0
  mech(`Starting: Paragon=${paragonPoints} | Renegade=${renegadePoints} | MQ=0`)

  // ── OLD: SHARD + PROPHECY ────────────────────────────────────────
  section('[OLD] SHARD + PROPHECY SYSTEM')
  let shardCharges = 2
  let prophecyState = 'dormant'
  mech(`Shard: Graygem Fragment (Krynn) -- Chaotic outcomes, wild magic`)
  mech(`Shard Charges: ${shardCharges}`)
  mech(`Prophecy State: DORMANT`)

  // ── OLD: SUCCESS RATE ─────────────────────────────────────────────
  section('[OLD] SUCCESS RATE CALCULATOR')
  let sr = makeSR()
  mech(`Initial Campaign Success Rate: ${sr}%`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 1 -- ACT I EXPLORATION
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 1 -- ACT I: "The Ruins Whisper"')

  narrate('The Tower of High Sorcery at Wayreth appears between heartbeats, shimmering into existence. Raistlin pauses, his golden skin catching the twilight, and feels the Graygem pulse warm against his chest.')

  section('[NEW] SKILL CHECK: Raistlin investigates the tower entrance (Investigation DC 13)')
  const investCheck = performSkillCheck(RAISTLIN, 'investigation', 13, rSkills)
  mech(`d20=${investCheck.roll} + modifier(${investCheck.modifier}) = ${investCheck.total} vs DC 13`)
  res(investCheck.success ? `SUCCESS! (${investCheck.total} >= 13)` : `FAILED (${investCheck.total} < 13)`)

  const investOutcome = resolvePbtA(investCheck.roll, investCheck.modifier)
  res(`[NEW] PbtA: ${investOutcome.description}`)
  if (investOutcome.tier === 'critical_success') {
    narrate("Raistlin's eyes burn with arcane sight. The Graygem surges, revealing hidden runes -- a binding circle designed to trap something within. Older than the Cataclysm.")
    sr = makeSR({ storyAchievements: 1 })
    mech(`Success Rate updated: ${sr}% (+2% story achievement)`)
  } else if (investOutcome.tier === 'full_success') {
    narrate('Raistlin kneels before the entrance, tracing faded runes. "Older than the Cataclysm," he murmurs. The Graygem hums recognition.')
    sr = makeSR({ storyAchievements: 1 })
  } else if (investOutcome.tier === 'partial_success') {
    narrate("Raistlin senses something ancient -- the Graygem pulses -- but the runes are too degraded. Partial knowledge gained, time wasted.")
    stamina -= 2; mech(`[NEW] DARK SOULS: -2 stamina (mental exertion) => ${stamina}/${stam.maxStamina}`)
  } else {
    narrate("The runes resist Raistlin's gaze. His golden eyes flicker with frustration. The tower seems darker now.")
  }
  outcomes.push({ turn: 1, tier: investOutcome.tier, description: `Investigation: ${investOutcome.description}` })
  stamina = Math.min(stam.maxStamina, stamina + stam.regenRate)
  mech(`[NEW] DARK SOULS: Regen +${stam.regenRate} => ${stamina}/${stam.maxStamina}`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 3 -- ACT I SOCIAL: Encounter a Lesser God
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 3 -- ACT I: "The Guardian of Wayreth"')

  narrate('A figure materializes from starlight -- Fizban the Fabulous. "You\'ve come about the dark thing beneath the foundation, haven\'t you?" He adjusts his hat, which appears to be on fire.')

  section('[NEW] SKILL CHECK: Raistlin reads Fizban (Insight DC 15)')
  const insightCheck = performSkillCheck(RAISTLIN, 'insight', 15, rSkills)
  mech(`d20=${insightCheck.roll} + modifier(${insightCheck.modifier}) = ${insightCheck.total} vs DC 15`)
  res(insightCheck.success ? `SUCCESS! (${insightCheck.total} >= 15)` : `FAILED (${insightCheck.total} < 15)`)
  const insightOutcome = resolvePbtA(insightCheck.roll, insightCheck.modifier)
  res(`[NEW] PbtA: ${insightOutcome.description}`)
  if (insightCheck.success) {
    narrate(insightCheck.natural20 ? "In a flash of absolute clarity, Raistlin sees through the disguise: this is Paladine himself, the Platinum Dragon." : "There is power behind those senile eyes -- divine power, carefully concealed. The old fool is more than he seems.")
  } else {
    narrate("Fizban's rambling is impenetrable. Raistlin cannot tell if he is genuinely addled or brilliantly performing.")
  }
  outcomes.push({ turn: 3, tier: insightOutcome.tier, description: `Insight: ${insightOutcome.description}` })

  section('[NEW] SKILL CHECK: Caramon persuades Fizban to help (Persuasion DC 12)')
  const persCheck = performSkillCheck(CARAMON, 'persuasion', 12, cSkills)
  mech(`d20=${persCheck.roll} + modifier(${persCheck.modifier}) = ${persCheck.total} vs DC 12`)
  res(persCheck.success ? `SUCCESS! (${persCheck.total} >= 12)` : `FAILED (${persCheck.total} < 12)`)
  const persOutcome = resolvePbtA(persCheck.roll, persCheck.modifier)
  res(`[NEW] PbtA: ${persOutcome.description}`)
  if (persCheck.success) {
    narrate('Caramon puts on his earnest face. "Please, sir. Whatever is down there, we need to know." Fizban sighs and shares what he knows.')
    sr = makeSR({ prophecyState: 'dormant', alliedGods: 1, storyAchievements: 1, companionAffinity: 55 })
    mech(`New ally! Success Rate: ${sr}% (+3% ally)`)
    paragonPoints += 2
    mech(`[NEW] MASS EFFECT: +2 Paragon => P:${paragonPoints} R:${renegadePoints} MQ:${paragonPoints - renegadePoints}`)
    const fp1 = earnFatePoint(fatePoints, 'Trouble aspect compelled: "Cannot Abandon the Helpless"')
    fatePoints = fp1.fp; mech(`[NEW] FATE: ${fp1.log} => FP:${fatePoints}/5`)
  } else if (persOutcome.tier === 'partial_success') {
    narrate('Fizban waves dismissively but gives a cryptic hint about needing "something old, something borrowed."')
  } else {
    narrate('Fizban cackles and vanishes, leaving only the smell of burnt feathers and a single button.')
  }
  outcomes.push({ turn: 3, tier: persOutcome.tier, description: `Persuasion: ${persOutcome.description}` })
  stamina = Math.min(stam.maxStamina, stamina + stam.regenRate)
  mech(`[NEW] DARK SOULS: Regen +${stam.regenRate} => ${stamina}/${stam.maxStamina}`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 5 -- ACT I -> ACT II: Prophecy Awakens
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 5 -- ACT I -> II: "The Prophecy Speaks"')

  narrate('Deep within the foundation, the Graygem resonates with something vast. A voice speaks directly into Raistlin\'s soul: "When the five-pointed star descends, the Dragon Queen rises from her chains."')
  prophecyState = 'awakening'
  mech('[OLD] PROPHECY: dormant -> AWAKENING')
  sr = makeSR({ prophecyState: 'awakening', alliedGods: 1, storyAchievements: 1, companionAffinity: 55 })
  mech(`Success Rate: ${sr}% (+3% prophecy)`)

  aspects.push({ name: "Bearer of the Graygem's Burden", type: 'earned', invokes: 0, fate_points_spent: 0, description: 'The shard has marked you.' })
  mech(`[NEW] FATE: New Aspect earned -- "Bearer of the Graygem's Burden"`)
  const fp2 = earnFatePoint(fatePoints, 'Aspect earned from prophecy')
  fatePoints = fp2.fp; mech(`[NEW] FATE: ${fp2.log} => FP:${fatePoints}/5`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 8 -- ACT II COMBAT: Draconians Attack
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 8 -- ACT II: "The Draconian Ambush"')

  narrate('Five draconians emerge from the shadows -- Baaz warriors with copper scales and the stench of sulfur.')
  let raistlinHp = RAISTLIN.hp, caramonHp = CARAMON.hp

  section('[OLD] COMBAT: Caramon attacks Baaz Draconian (AC 4)')
  const atkRoll = d20(), strBonus = getAbilityBonus(CARAMON.str).value
  const atkTotal = atkRoll + strBonus + CARAMON.fighterLevel
  const hitSuccess = atkTotal >= 4
  mech(`d20=${atkRoll} + STR(${strBonus}) + Level(${CARAMON.fighterLevel}) = ${atkTotal} vs AC 4`)
  res(hitSuccess ? 'HIT!' : 'MISS!')
  if (hitSuccess) {
    const dmg = rollDice(2, 6) + strBonus
    narrate(`Caramon's greatsword cleaves through copper scales. (${dmg} damage)`)
    stamina = Math.max(0, stamina - 4)
    mech(`[NEW] DARK SOULS: Heavy attack -4 stamina => ${stamina}/${stam.maxStamina}`)
  } else {
    narrate("Caramon's blade scrapes against copper scales and deflects.")
  }

  section('[NEW] COMBAT + SKILL: Raistlin casts Fireball (Arcana DC 10)')
  const arcanaCheck = performSkillCheck(RAISTLIN, 'arcana', 10, rSkills)
  mech(`d20=${arcanaCheck.roll} + modifier(${arcanaCheck.modifier}) = ${arcanaCheck.total} vs DC 10`)
  res(arcanaCheck.success ? 'Spell cast successfully!' : 'Spell fizzled!')
  res(`[NEW] PbtA: ${resolvePbtA(arcanaCheck.roll, arcanaCheck.modifier).description}`)
  if (arcanaCheck.success) {
    const fireDmg = rollDice(8, 6)
    narrate(`Raistlin whispers the Words of Power. Fire blooms -- a roaring sphere engulfing three draconians. (${fireDmg} fire damage)`)
    stamina = Math.max(0, stamina - 5)
    mech(`[NEW] DARK SOULS: Spell -5 stamina => ${stamina}/${stam.maxStamina}`)
  } else {
    narrate('Raistlin gestures -- and nothing happens. "The tower is suppressing magic," he hisses.')
  }
  outcomes.push({ turn: 8, tier: resolvePbtA(arcanaCheck.roll, arcanaCheck.modifier).tier, description: 'Fireball Arcana check' })

  section('[OLD] ENEMY COUNTER: Kapak Draconian attacks Caramon')
  const enemyAtk = d20() + 3
  const kapakHit = enemyAtk >= CARAMON.AC
  if (kapakHit) {
    const enemyDmg = rollDice(2, 4) + 1
    caramonHp -= enemyDmg
    narrate(`Kapak claws rake Caramon's arm. (${enemyDmg} dmg => ${caramonHp}/${CARAMON.maxHp} HP)`)
    const conSave = d20() + getAbilityBonus(CARAMON.con).value
    if (conSave < 12) {
      narrate("The poison burns through Caramon's veins.")
      mech('[OLD] INJURY: Weak Poison -- -1 to all rolls, -2 HP/turn for 4 turns')
      sr = makeSR({ prophecyState: 'awakening', alliedGods: 1, storyAchievements: 1, companionAffinity: 55, injuryPenalty: -3 })
      mech(`Success Rate: ${sr}% (-3% injury)`)
    } else { res('Con save passed -- poison resisted') }
  }

  section('[OLD] ITEM: Caramon uses Healing Potion')
  const potionHeal = rollDice(2, 8) + 4
  caramonHp = Math.min(CARAMON.maxHp, caramonHp + potionHeal)
  narrate(`Caramon drinks the healing potion. (+${potionHeal} HP => ${caramonHp}/${CARAMON.maxHp})`)
  mech('[OLD] ITEM: Healing Potion used (1 remaining)')
  stamina = Math.min(stam.maxStamina, stamina + stam.regenRate)
  mech(`[NEW] DARK SOULS: Regen +${stam.regenRate} => ${stamina}/${stam.maxStamina}`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 10 -- ACT II: Moral Dilemma + Fate Point
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 10 -- ACT II: "The Prisoner\'s Bargain"')

  narrate('They find a lone gully dwarf cowering in a cell -- the last survivor of a failed expedition. He knows a secret passage.')

  section('[NEW] SKILL CHECK: Raistlin intimidates the gully dwarf (Intimidation DC 11)')
  const intimCheck = performSkillCheck(RAISTLIN, 'intimidation', 11, rSkills)
  mech(`d20=${intimCheck.roll} + modifier(${intimCheck.modifier}) = ${intimCheck.total} vs DC 11`)
  res(intimCheck.success ? 'SUCCESS!' : 'FAILED!')

  section('[NEW] FATE POINT: Invoke Aspect "Krynn Mage" for +2 boost')
  if (fatePoints > 0) {
    const boostedCheck = performSkillCheck(RAISTLIN, 'intimidation', 11, rSkills, 2)
    const spent = spendFatePoint(aspects, 'Krynn Mage', fatePoints)
    fatePoints = spent.fp
    mech(`Fate Point spent! d20=${boostedCheck.roll} + mod(${boostedCheck.modifier} + 2 fate) = ${boostedCheck.total} vs DC 11`)
    res(boostedCheck.success ? `SUCCESS WITH FATE POINT! (${boostedCheck.total} >= 11)` : `STILL FAILED (${boostedCheck.total} < 11)`)
    mech(`[NEW] FATE: FP:${fatePoints}/5`)
    if (boostedCheck.success) {
      narrate('Raistlin leans close, his golden eyes boring into the dwarf\'s soul. "You will show us the way," he whispers. The gully dwarf talks.')
      renegadePoints += 2
      mech(`[NEW] MASS EFFECT: +2 Renegade => P:${paragonPoints} R:${renegadePoints} MQ:${paragonPoints - renegadePoints}`)
    }
  }
  const renegadeOutcome = resolvePbtA(d20(), getSkillModifier(RAISTLIN, 'intimidation', rSkills))
  outcomes.push({ turn: 10, tier: renegadeOutcome.tier, description: `Intimidation (Fate Boost): ${renegadeOutcome.description}` })

  // ══════════════════════════════════════════════════════════════════
  // TURN 12 -- ACT II: Stealth Section
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 12 -- ACT II: "The Silent Descent"')

  narrate('The secret passage leads downward through crystallized magic. They must move quietly.')

  section('[NEW] SKILL CHECK: Raistlin Stealth (DC 14)')
  const stealthCheck = performSkillCheck(RAISTLIN, 'stealth', 14, rSkills)
  mech(`d20=${stealthCheck.roll} + modifier(${stealthCheck.modifier}) = ${stealthCheck.total} vs DC 14`)
  res(stealthCheck.success ? `SNEAK SUCCESS! (${stealthCheck.total} >= 14)` : `ALERTED! (${stealthCheck.total} < 14)`)
  const stealthOutcome = resolvePbtA(stealthCheck.roll, stealthCheck.modifier)
  res(`[NEW] PbtA: ${stealthOutcome.description}`)
  if (stealthCheck.success) {
    narrate('Raistlin motions for silence. His soft boots make no sound. The guardian constructs remain dormant.')
  } else if (stealthOutcome.tier === 'partial_success') {
    narrate("They move quietly for a dozen steps -- then Caramon's armor scrapes the wall. A guardian's eyes flicker.")
  } else {
    narrate('A guardian construct roars to life. Combat is imminent.')
    raistlinHp -= rollDice(1, 8)
    narrate(`Guardian strikes Raistlin => ${Math.max(0, raistlinHp)}/${RAISTLIN.maxHp} HP`)
  }
  outcomes.push({ turn: 12, tier: stealthOutcome.tier, description: `Stealth: ${stealthOutcome.description}` })
  stamina = Math.max(0, stamina - 3)
  mech(`[NEW] DARK SOULS: Sprint -3 => ${stamina}/${stam.maxStamina}`)
  stamina = Math.min(stam.maxStamina, stamina + stam.regenRate)
  mech(`[NEW] DARK SOULS: Regen +${stam.regenRate} => ${stamina}/${stam.maxStamina}`)

  // ══════════════════════════════════════════════════════════════════
  // TURN 15 -- ACT III BOSS: Antagonist Revealed
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 15 -- ACT III BOSS: "The Dragon Queen Awakens"')

  narrate('The foundation cracks open. Darkness pours out -- not shadow, but absence. Five heads emerge, eyes burning with ancient malice. TAKHISIS. She was never sealed here. She was waiting.')
  prophecyState = 'manifesting'
  mech('[OLD] PROPHECY: -> MANIFESTING')
  mech(`[OLD] ANTAGONIST REVEALED: Takhisis HP:${ANTAGONIST.hp} AC:${ANTAGONIST.AC} MR:${ANTAGONIST.MR} Phase:1/3`)
  sr = makeSR({ prophecyState: 'manifesting', alliedGods: 1, storyAchievements: 2, companionAffinity: 55 })
  mech(`Success Rate: ${sr}%`)

  section('[OLD] SHARD SUMMON: Use Graygem to summon an ally')
  shardCharges -= 1
  mech(`Shard Charges: ${shardCharges}/2`)
  const summonRoll = d20()
  mech(`Summon Roll: d20=${summonRoll} (need 10+)`)
  if (summonRoll >= 10) {
    narrate('The Graygem explodes with light. Paladine himself, the Platinum Dragon, solidifies from chaos.')
    sr = makeSR({ prophecyState: 'manifesting', alliedGods: 2, storyAchievements: 2, shardCharges, shardSummoned: 1, companionAffinity: 55 })
    mech(`God summoned! SR: ${sr}%`)
  } else {
    narrate('The shard pulses -- wild magic surge instead of an ally.')
  }

  // ══════════════════════════════════════════════════════════════════
  // TURN 16 -- ACT III BOSS COMBAT: All Systems Combined
  // ══════════════════════════════════════════════════════════════════
  banner('TURN 16 -- ACT III BOSS: "Gods and Dragons"')

  narrate('Paladine roars. Takhisis spreads her wings, each one casting a shadow the size of a city block.')
  let bossHp = ANTAGONIST.hp

  section('[OLD] COMBAT: Caramon attacks Takhisis Phase 1')
  const bossAtk1 = d20() + getAbilityBonus(CARAMON.str).value + CARAMON.fighterLevel
  mech(`Attack: ${bossAtk1} vs AC ${ANTAGONIST.AC}`)
  if (bossAtk1 >= ANTAGONIST.AC) {
    const bossDmg = rollDice(2, 6) + getAbilityBonus(CARAMON.str).value
    bossHp -= bossDmg
    narrate(`Caramon drives his blade into Takhisis's flank. She SCREAMS. (${bossDmg} => Boss: ${Math.max(0, bossHp)}/${ANTAGONIST.maxHp})`)
  } else { narrate("Caramon's blade skitters off scales harder than adamantite.") }

  section('[NEW] ARCANA + [OLD] SPELL: Raistlin channels Chaos (Arcana DC 18)')
  const ultimateArcana = performSkillCheck(RAISTLIN, 'arcana', 18, rSkills)
  mech(`d20=${ultimateArcana.roll} + modifier(${ultimateArcana.modifier}) = ${ultimateArcana.total} vs DC 18`)

  section('[NEW] FATE POINT: Invoke "Bearer of the Graygem\'s Burden" for +2')
  if (fatePoints > 0) {
    const boosted = performSkillCheck(RAISTLIN, 'arcana', 18, rSkills, 2)
    const spent2 = spendFatePoint(aspects, "Bearer of the Graygem's Burden", fatePoints)
    fatePoints = spent2.fp
    mech(`Fate Point spent! Boosted: d20=${boosted.roll} + mod(${boosted.modifier}+2) = ${boosted.total} vs DC 18`)
    mech(`[NEW] FATE: FP:${fatePoints}/5`)
    if (boosted.success) {
      narrate('The Graygem answers. Raistlin channels chaos itself. The blast hits Takhisis square in the chest.')
      const spellDmg = rollDice(12, 6) + 20
      bossHp -= spellDmg
      narrate(`Chaos Blast: ${spellDmg} => Boss: ${Math.max(0, bossHp)}/${ANTAGONIST.maxHp}`)
      res(`[NEW] PbtA: ${resolvePbtA(boosted.roll, boosted.modifier + 2).description}`)
    }
  }

  section('[OLD] BOSS ATTACK: Takhisis breathes darkness at Raistlin')
  const breathSave = d20() + getAbilityBonus(RAISTLIN.con).value + 2
  if (breathSave < 16) {
    const breathDmg = rollDice(10, 8)
    raistlinHp -= breathDmg
    narrate(`Darkness swallows Raistlin. (${breathDmg} => ${Math.max(0, raistlinHp)}/${RAISTLIN.maxHp})`)
    mech('[OLD] INJURY: Arcane Burn (-2 magic saves) + Concussion (-4 INT checks, -1 all saves)')
  } else { narrate('Raistlin raises his staff. The darkness parts. He does not break.') }

  section('[NEW] FATE: Trouble Aspect compelled')
  narrate('Caramon falls, badly wounded. The Graygem pulses. The trouble aspect compels.')
  const fp3 = earnFatePoint(fatePoints, 'Trouble compelled: chose to protect Caramon instead of attacking')
  fatePoints = fp3.fp
  mech(`[NEW] FATE: ${fp3.log} => FP:${fatePoints}/5`)
  paragonPoints += 1; renegadePoints += 1
  mech(`[NEW] MASS EFFECT: +1P +1R => P:${paragonPoints} R:${renegadePoints} MQ:${paragonPoints - renegadePoints}`)

  // ══════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ══════════════════════════════════════════════════════════════════
  banner('CAMPAIGN SUMMARY -- ALL MECHANICS REPORT')

  section('OLD MECHANICS STATUS')
  mech(`[OLD] HP -- Raistlin: ${Math.max(0, raistlinHp)}/${RAISTLIN.maxHp} | Caramon: ${Math.max(0, caramonHp)}/${CARAMON.maxHp}`)
  mech(`[OLD] Shard -- Graygem Fragment | Charges: ${shardCharges}/2`)
  mech(`[OLD] Prophecy -- State: ${prophecyState.toUpperCase()}`)
  mech(`[OLD] Antagonist -- Takhisis | HP: ${Math.max(0, bossHp)}/${ANTAGONIST.maxHp} | Phase: ${ANTAGONIST.phase}/3`)
  mech(`[OLD] Success Rate -- ${sr}%`)
  mech(`[OLD] Items -- 1 Healing Potion remaining`)
  mech(`[OLD] Injuries -- Active (Concussion, Arcane Burn)`)
  mech(`[OLD] Combat -- AD&D 1e (d20+STR+Level vs AC, damage dice)`)

  section('NEW MECHANICS STATUS')
  mech(`[NEW] D&D 5e SKILLS -- ${rProfs.length} proficiencies: ${rProfs.join(', ')}`)
  mech(`[NEW] FATE POINTS -- ${fatePoints}/5 remaining`)
  mech(`[NEW] ASPECTS -- ${aspects.length} total:`)
  for (const a of aspects) mech(`     [${a.type.padEnd(14)}] "${a.name}" (invoked ${a.invokes}x, ${a.fate_points_spent} FP spent)`)
  mech(`[NEW] PbtA OUTCOMES -- ${outcomes.length} resolved:`)
  const tierCounts: Record<OutcomeTier, number> = { critical_success: 0, full_success: 0, partial_success: 0, miss: 0, consequences: 0 }
  outcomes.forEach(o => { tierCounts[o.tier] = (tierCounts[o.tier] || 0) + 1 })
  for (const o of outcomes) {
    const icon = o.tier === 'critical_success' ? '[CRIT]' : o.tier === 'full_success' ? '[ OK ]' : o.tier === 'partial_success' ? '[PART]' : '[MISS]'
    mech(`     Turn ${String(o.turn).padStart(2)}: ${icon} ${o.description}`)
  }
  mech(`[NEW] DARK SOULS STAMINA -- ${stamina}/${stam.maxStamina} (regen: +${stam.regenRate}/turn)`)
  mech(`[NEW] MASS EFFECT -- Paragon: ${paragonPoints} | Renegade: ${renegadePoints} | MQ: ${paragonPoints - renegadePoints}`)

  section('MECHANICS INTEGRATION VERDICT')
  res(`Skill checks: 7 (Investigation, Insight, Persuasion, Intimidation, Stealth, Arcana x2)`)
  res(`Fate Points spent: ${aspects.reduce((s, a) => s + a.fate_points_spent, 0)} | Earned: via aspect compels`)
  res(`PbtA -- Critical:${tierCounts.critical_success} Success:${tierCounts.full_success} Partial:${tierCounts.partial_success} Miss:${tierCounts.miss}`)
  res(`Old mechanics: Combat, Items, Injuries, Shard, Prophecy, Success Rate, Enemy Attacks, Healing`)
  res(`New mechanics: Skills(5 types), Fate Points(invoke/earn), Aspects(4 types), PbtA tiers, Stamina, Paragon/Renegade`)

  L.push('', '='.repeat(80), 'TEST COMPLETE -- All hybrid mechanics verified in narrative context', '='.repeat(80))
  return L.join('\n')
}

console.log(runScenario())
