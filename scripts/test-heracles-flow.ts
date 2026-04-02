// Test Flow: Heracles (Main) + Raistlin Majere Black (Companion)
// DM Test Run

import { GREATER_GODS, LESSER_GODS, DEMIGODS, HEROES } from '../src/lib/characterData'
import { ALL_KRYNN_CHARACTERS } from '../src/lib/krynnCharacters'
import { rollAntagonist } from '../src/lib/antagonistPool'
import { rollProphecy } from '../src/lib/prophecyData'

interface PartyMember {
  id: string
  name: string
  rank: string
  role: 'main' | 'companion' | 'rotating_hero' | 'rotating_demigod'
  presence: 'always' | 'mostly' | 'sometimes'
  align: string
  pantheon: string
  hp: number
  alive: boolean
  prophecyId?: number
}

function runTest() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║     DEITIES & DEMIGODS - MYTHWORLD ENGINE: LIVE TEST                ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝')
  console.log('')

  const party: PartyMember[] = []
  const usedIds = new Set<string>()

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: HUMAN SELECTION (FIXED)
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('═════════════════════════════════════════════════════════════')
  console.log('PHASE 1: HUMAN SELECTION')
  console.log('═════════════════════════════════════════════════════════════')
  
  // Main PC: Heracles
  const heracles = HEROES.find(h => h.id === 'heracles')!
  party.push({
    id: heracles.id,
    name: 'Heracles',
    rank: 'Hero',
    role: 'main',
    presence: 'always',
    align: heracles.align || 'Chaotic good',
    pantheon: heracles.pantheon,
    hp: heracles.hp || 150,
    alive: true
  })
  usedIds.add('heracles')
  
  console.log(`🎮 MAIN PC: Heracles (Greek Hero)`)
  console.log(`   Alignment: ${heracles.align}`)
  console.log(`   HP: ${heracles.hp}, STR: ${heracles.str}, CON: ${heracles.con}`)
  console.log(`   Abilities: ${(heracles.abilities || []).slice(0,3).join(', ')}...`)
  
  // Companion: Raistlin Majere Black (Demigod version from Krynn)
  const raistlin = ALL_KRYNN_CHARACTERS.find(k => k.id === 'raistlin_majere_demigod')!
  party.push({
    id: raistlin.id,
    name: 'Raistlin Majere',
    rank: 'Demigod',
    role: 'companion',
    presence: 'mostly',
    align: raistlin.align || 'Neutral evil',
    pantheon: 'Krynn',
    hp: raistlin.hp || 100,
    alive: true
  })
  usedIds.add('raistlin_majere_demigod')
  
  console.log(`\n🎮 COMPANION: Raistlin Majere (Krynn Demigod)`)
  console.log(`   Alignment: ${raistlin.align}`)
  console.log(`   HP: ${raistlin.hp}, INT: ${raistlin.int}`)
  console.log(`   Abilities: ${(raistlin.abilities || []).slice(0,3).join(', ')}...`)
  console.log('')

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: RNG SELECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('═════════════════════════════════════════════════════════════')
  console.log('PHASE 2: RNG SELECTION')
  console.log('═════════════════════════════════════════════════════════════')
  
  // Get available heroes and demigods
  const allHeroes = [...HEROES, ...ALL_KRYNN_CHARACTERS.filter(k => k.divineRank === 'Hero')]
  const allDemigods = [...DEMIGODS, ...ALL_KRYNN_CHARACTERS.filter(k => k.divineRank === 'Demigod')]
  
  const availableHeroes = allHeroes.filter(h => !usedIds.has(h.id))
  const availableDemigods = allDemigods.filter(d => !usedIds.has(d.id))
  
  // Roll 3 Heroes
  console.log(`\n🎲 RNG ROLLING FOR 3 ROTATING HEROES...`)
  for (let i = 0; i < 3 && availableHeroes.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableHeroes.length)
    const hero = availableHeroes.splice(idx, 1)[0]
    usedIds.add(hero.id)
    party.push({
      id: hero.id,
      name: hero.name,
      rank: 'Hero',
      role: 'rotating_hero',
      presence: 'sometimes',
      align: hero.align || 'Neutral',
      pantheon: hero.pantheon,
      hp: hero.hp || 50,
      alive: true
    })
    console.log(`   Hero ${i + 1}: ${hero.name} (${hero.pantheon})`)
  }
  
  // Roll 3 Demigods
  console.log(`\n🎲 RNG ROLLING FOR 3 ROTATING DEMIGODS...`)
  for (let i = 0; i < 3 && availableDemigods.length > 0; i++) {
    const idx = Math.floor(Math.random() * availableDemigods.length)
    const demigod = availableDemigods.splice(idx, 1)[0]
    usedIds.add(demigod.id)
    party.push({
      id: demigod.id,
      name: demigod.name,
      rank: 'Demigod',
      role: 'rotating_demigod',
      presence: 'sometimes',
      align: demigod.align || 'Neutral',
      pantheon: demigod.pantheon,
      hp: demigod.hp || 50,
      alive: true
    })
    console.log(`   Demigod ${i + 1}: ${demigod.name} (${demigod.pantheon})`)
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL PARTY
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('YOUR PARTY (8 PCs)')
  console.log('═════════════════════════════════════════════════════════════')
  
  party.forEach((p, i) => {
    const icon = p.presence === 'always' ? '⭐' : p.presence === 'mostly' ? '🌟' : '💫'
    console.log(`${i + 1}. ${icon} ${p.name} [${p.role.toUpperCase()}] (${p.pantheon} ${p.rank})`)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PROPHECY ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('PROPHECY (d9 roll)')
  console.log('═════════════════════════════════════════════════════════════')
  
  const prophecy = rollProphecy()
  party[0].prophecyId = prophecy.id
  
  console.log(`🎲 ROLL: ${prophecy.id}`)
  console.log('')
  console.log(`📜 YOU SEE THIS VISION:`)
  console.log('')
  console.log(`   "${prophecy.riddle}"`)
  console.log('')

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTAGONIST (DM SECRET)
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('═════════════════════════════════════════════════════════════')
  console.log('🔮 DM SECRET (HIDDEN FROM PLAYER)')
  console.log('═════════════════════════════════════════════════════════════')
  
  const antagonist = rollAntagonist()
  console.log(`Antagonist: ${antagonist.name} (${antagonist.type})`)
  console.log(`Prophecy: "${prophecy.name}" - ${prophecy.theme}`)
  console.log(`Act 1 Hint: ${prophecy.act1_hint}`)
  console.log('')
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SHARD
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('═════════════════════════════════════════════════════════════')
  console.log('SHARD ASSIGNED')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`   The Eye of Cronos`)
  console.log(`   "${`When Zeus overthrew his father, a single eye fell from Cronos's crown and became this shard. It remembers being part of something that ruled before the Olympians. It wants to rule again.`}"`)
  console.log('')
  console.log(`   Pantheon: Greek | Power: Favors Greek Titans and Olympians`)
  console.log('')

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUT FOR DM
  // ═══════════════════════════════════════════════════════════════════════════
  
  console.log('═════════════════════════════════════════════════════════════')
  console.log('═══════════════════ ACT 1 BEGINS ═══════════════════════════')
  console.log('═════════════════════════════════════════════════════════════')
  console.log('')
  console.log('DM: Take over from here. The player has chosen:')
  console.log(`    Main PC: Heracles (Greek Hero, Chaotic good)`)
  console.log(`    Companion: Raistlin Majere (Krynn Demigod, Neutral evil)`)
  console.log(`    Prophecy: ${prophecy.name} (ID: ${prophecy.id})`)
  console.log(`    Antagonist: ${antagonist.name} (${antagonist.pantheon}) - REVEAL IN ACT 3`)
  console.log('')
}

runTest()
