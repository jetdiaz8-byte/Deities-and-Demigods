'use client'

import React from 'react'
import Image from 'next/image'
import { Swords, Skull, Crown, Shield, Zap, Heart, Wand2, Footprints, Sparkles, X } from 'lucide-react'
import type { Entity } from '@/lib/gameTypes'
import { getEntityPortrait } from '@/lib/gameHelpers'

type CombatantTurn = {
  id: string
  name: string
  portrait: string
  initiative: number
  hp: number
  maxHp: number
  ac: number
  isPlayer: boolean
  statusEffects: string[]
  isDead: boolean
}

type CombatLogEntry = {
  round: number
  actor: string
  action: string
  target?: string
  damage?: number
  damageType?: string
  isCritical: boolean
  result: 'hit' | 'miss' | 'save' | 'death' | 'heal' | 'flee'
  narration: string
}

type CombatState = {
  isActive: boolean
  round: number
  turnOrder: CombatantTurn[]
  currentTurnIndex: number
  phase: 'initiative' | 'player_turn' | 'enemy_turn' | 'resolution'
  log: CombatLogEntry[]
  victory: 'players' | 'enemies' | null
}

const statusIcon = (s: string) => {
  const key = s.toLowerCase()
  if (key.includes('burn')) return '🔥'
  if (key.includes('poison')) return '💚'
  if (key.includes('stun')) return '⚡'
  if (key.includes('bless')) return '✨'
  if (key.includes('shield')) return '🛡️'
  if (key.includes('fear')) return '😱'
  if (key.includes('charm')) return '💜'
  if (key.includes('slow')) return '🐌'
  if (key.includes('haste')) return '💨'
  if (key.includes('blind')) return '🙈'
  return '•'
}

export default function CombatOverlay({
  combatState,
  onClose,
  onFlee,
  onAction,
  onContinue,
  currentPower,
  gameState,
  lastDMNarrative,
}: {
  combatState: CombatState
  onClose: () => void
  onFlee: () => void
  onAction: (text: string) => void
  onContinue: () => void
  currentPower?: any
  gameState?: {
    pcs?: Entity[]
    activeNPCs?: Entity[]
    humanPCId?: string
    companionId?: string
    antagonistId?: string
    antagonistHp?: number
    antagonistMaxHp?: number
    antagonistPhase?: number
    act?: string
  }
  lastDMNarrative?: string
}) {
  const latest = combatState.log[combatState.log.length - 1]
  const current = combatState.turnOrder[combatState.currentTurnIndex]

  // ── Real data from gameState ──────────────────────────────────────────────
  const humanPC = gameState?.pcs?.find(p => p.id === gameState?.humanPCId) ?? gameState?.pcs?.[0]
  const companion = gameState?.companionId ? gameState?.pcs?.find(p => p.id === gameState.companionId) : null
  const aliveAllies = (gameState?.pcs ?? []).filter(p => !p.dead)
  const aliveEnemies = (gameState?.activeNPCs ?? []).filter(n => !n.dead && (n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS'))

  // Primary target: first alive enemy (prefer BOSS)
  const primaryTarget = aliveEnemies.find(e => e.encounter_type === 'BOSS') ?? aliveEnemies[0]
  const enemyName = primaryTarget?.name ?? null
  const enemyIsBoss = primaryTarget?.encounter_type === 'BOSS'
  const isAntagonist = primaryTarget?.id === gameState?.antagonistId

  // PC abilities for contextual buttons
  const magicalKeywords = ['magic', 'spell', 'arcane', 'divine', 'fire', 'ice', 'lightning', 'shadow', 'holy', 'dark', 'enchant', 'summon', 'curse', 'heal', 'flame', 'frost', 'thunder', 'turn undead', 'lay on hands', 'smite']
  const pcAbilities = humanPC?.abilities ?? []
  const hasSpell = pcAbilities.some(a => magicalKeywords.some(k => a.toLowerCase().includes(k)))
  const hasHeal = pcAbilities.some(a => /heal|cure|restore|lay on|potion/i.test(a))
  const hasRanged = pcAbilities.some(a => /bow|crossbow|sling|dart|throw/i.test(a))
  const pcAbility = pcAbilities.find(a => magicalKeywords.some(k => a.toLowerCase().includes(k))) ?? null

  // Lowest-HP ally for healing context
  const lowestHPAlly = aliveAllies
    .filter(p => p.hp < p.maxHp)
    .sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)))[0]

  // Truncate narration for display
  const combatContext = lastDMNarrative
    ? lastDMNarrative.length > 280
      ? lastDMNarrative.slice(0, 280) + '...'
      : lastDMNarrative
    : null

  // ── Contextual action builders ────────────────────────────────────────────
  const buildAttackText = () => enemyName
    ? `I strike at ${enemyName} with my weapon!`
    : 'I attack the nearest enemy!'

  const buildRangedText = () => enemyName
    ? `I loose an arrow at ${enemyName} from afar!`
    : 'I fire at the enemy from range!'

  const buildDefendText = () => humanPC
    ? `${humanPC.name} raises their guard, bracing for the next blow.`
    : 'I take a defensive stance, raising my shield.'

  const buildSpellText = () => {
    if (pcAbility && humanPC) {
      return `${humanPC.name} channels ${pcAbility}${enemyName ? ` against ${enemyName}` : ''}!`
    }
    return enemyName ? `I cast a spell at ${enemyName}!` : 'I cast a spell!'
  }

  const buildHealText = () => lowestHPAlly
    ? `I tend to ${lowestHPAlly.name}'s wounds with healing magic.`
    : 'I focus my energy on healing.'

  const buildFleeText = () => enemyName
    ? `I attempt to retreat from ${enemyName}!`
    : 'I attempt to flee from combat!'

  const actions = [
    { icon: <Swords className="w-4 h-4" />, label: 'Attack', text: buildAttackText(), highlight: false },
    ...(hasRanged ? [{ icon: <Footprints className="w-4 h-4" />, label: 'Ranged', text: buildRangedText(), highlight: false }] : []),
    { icon: <Shield className="w-4 h-4" />, label: 'Defend', text: buildDefendText(), highlight: false },
    ...(hasSpell ? [{ icon: <Wand2 className="w-4 h-4" />, label: pcAbility ?? 'Cast Spell', text: buildSpellText(), highlight: true }] : []),
    ...(hasHeal || lowestHPAlly ? [{ icon: <Heart className="w-4 h-4" />, label: 'Heal', text: buildHealText(), highlight: lowestHPAlly !== undefined && (lowestHPAlly.hp / lowestHPAlly.maxHp) < 0.4 }] : []),
    ...(currentPower ? [{ icon: <Sparkles className="w-4 h-4" />, label: `Divine Power`, text: `I unleash ${currentPower.powerName || 'divine power'}!`, highlight: true }] : []),
    { icon: <Footprints className="w-4 h-4 rotate-180" />, label: 'Flee', text: buildFleeText(), highlight: false, danger: true },
  ]

  return (
    <div className={`combat-overlay ${latest?.isCritical ? 'screen-shake' : ''}`}>
      {/* ── Close button ─────────────────────────────────────────────── */}
      <button
        className="combat-close-btn min-h-[44px] min-w-[44px]"
        onClick={onClose}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 1010, borderRadius: 6, border: '1px solid #5a3030', background: 'rgba(20,5,5,.8)', color: '#a08060', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
      >
        <X className="w-4 h-4" />
      </button>

      {/* ── Combat Banner ────────────────────────────────────────────── */}
      <div className="combat-banner">
        <h2 style={{ fontFamily: 'var(--font-combat)', fontSize: 'clamp(20px, 5vw, 28px)', color: '#D4AF37', margin: 0, textShadow: '0 0 10px rgba(212,175,55,0.3)' }}>⚔ COMBAT — Round {combatState.round || 1}</h2>
        {combatState.phase && (
          <div style={{ fontSize: 12, color: '#D4AF37', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            {combatState.phase === 'player_turn' ? '🗡 Your Move' :
             combatState.phase === 'enemy_turn' ? '💀 Enemy Turn' :
             combatState.phase === 'resolution' ? '⚖ Resolution' : '🎲 Initiative'}
          </div>
        )}
      </div>

      {/* ── Combat Context (DM narration excerpt) ────────────────────── */}
      {combatContext && (
        <div style={{
          padding: '10px 16px',
          background: 'linear-gradient(135deg, rgba(20,15,10,.9), rgba(10,8,5,.7))',
          borderBottom: '1px solid rgba(100,80,40,.2)',
          borderTop: '1px solid rgba(100,80,40,.15)',
          fontSize: 13,
          color: '#c4b896',
          fontStyle: 'italic',
          lineHeight: 1.5,
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{ fontSize: 11, color: '#8A7A50', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
            📜 Battle Context
          </div>
          {combatContext}
        </div>
      )}

      {/* ── Main Combat Area: Allies & Enemies with portraits ────────── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>

        {/* ── Enemies Section ────────────────────────────────────────── */}
        {aliveEnemies.length > 0 && (
          <div style={{ background: 'rgba(40,10,10,.3)', border: '1px solid rgba(139,0,0,.3)', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Skull className="w-4 h-4 text-red-400" />
              <span style={{ fontSize: 11, color: '#DC143C', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Enemies ({aliveEnemies.length})
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(139,0,0,.2)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aliveEnemies.map(enemy => {
                const hpPct = Math.max(0, Math.min(100, Math.round((enemy.hp / Math.max(1, enemy.maxHp)) * 100)))
                const hpColor = hpPct > 60 ? '#4ade80' : hpPct > 30 ? '#fbbf24' : '#ef4444'
                const isBoss = enemy.encounter_type === 'BOSS'
                const isAntag = enemy.id === gameState?.antagonistId
                return (
                  <div key={enemy.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: isAntag ? 'rgba(80,0,0,.2)' : 'rgba(0,0,0,.2)',
                    border: `1px solid ${isAntag ? 'rgba(180,40,40,.3)' : 'rgba(80,40,40,.15)'}`,
                    borderRadius: 6,
                  }}>
                    <div style={{
                      width: 40, height: 52, borderRadius: 4, overflow: 'hidden',
                      border: `2px solid ${isAntag ? '#a03030' : '#5a2020'}`,
                      position: 'relative', flexShrink: 0,
                    }}>
                      <Image
                        src={getEntityPortrait(enemy)}
                        alt={enemy.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {isBoss && (
                        <div style={{ position: 'absolute', top: -1, right: -1, width: 16, height: 16, background: '#8b0000', borderRadius: '0 4px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Crown className="w-3 h-3 text-yellow-400" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 13, color: isAntag ? '#e04040' : '#cc5050',
                          fontWeight: isBoss ? 700 : 500,
                          fontFamily: 'var(--font-heading)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {enemy.name}
                        </span>
                        {isAntag && gameState?.act === 'act3' && gameState?.antagonistPhase && (
                          <span style={{ fontSize: 11, color: '#a06060', border: '1px solid rgba(160,60,60,.3)', padding: '1px 5px', borderRadius: 3 }}>
                            Phase {gameState.antagonistPhase}/3
                          </span>
                        )}
                        {enemy.title && (
                          <span style={{ fontSize: 11, color: '#8a6060', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {enemy.title}
                          </span>
                        )}
                      </div>
                      <div style={{
                        height: 6, background: '#1a1010', borderRadius: 3, overflow: 'hidden',
                        border: '1px solid rgba(100,40,40,.2)',
                      }}>
                        <div style={{
                          width: `${hpPct}%`, height: '100%', borderRadius: 2,
                          background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#8a7060' }}>
                          {Math.max(0, enemy.hp)}/{enemy.maxHp} HP
                        </span>
                        <span style={{ fontSize: 11, color: '#6a5a50' }}>
                          AC {enemy.AC}
                        </span>
                      </div>
                      {(enemy.conditions?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                          {enemy.conditions!.map(s => (
                            <span key={s} style={{
                              fontSize: 11, padding: '1px 5px', borderRadius: 3,
                              background: 'rgba(100,60,60,.2)', border: '1px solid rgba(100,60,60,.2)',
                              color: '#c0a090',
                            }}>
                              {statusIcon(s)} {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Allies Section ─────────────────────────────────────────── */}
        {aliveAllies.length > 0 && (
          <div style={{ background: 'rgba(20,20,10,.3)', border: '1px solid rgba(100,80,40,.2)', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield className="w-4 h-4 text-[#d4af37]" />
              <span style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
                Allies ({aliveAllies.length})
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(100,80,40,.2)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {aliveAllies.map(ally => {
                const hpPct = Math.max(0, Math.min(100, Math.round((ally.hp / Math.max(1, ally.maxHp)) * 100)))
                const hpColor = hpPct > 60 ? '#4ade80' : hpPct > 30 ? '#fbbf24' : '#ef4444'
                const isActive = ally.id === gameState?.humanPCId
                const isCompanion = ally.id === gameState?.companionId
                return (
                  <div key={ally.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: isActive ? 'rgba(212,175,55,.06)' : 'rgba(0,0,0,.15)',
                    border: `1px solid ${isActive ? 'rgba(212,175,55,.2)' : 'rgba(80,60,40,.1)'}`,
                    borderRadius: 6,
                  }}>
                    <div style={{
                      width: 40, height: 52, borderRadius: 4, overflow: 'hidden',
                      border: `2px solid ${isActive ? '#d4af37' : isCompanion ? '#7090c0' : '#3a3a4a'}`,
                      position: 'relative', flexShrink: 0,
                    }}>
                      <Image
                        src={getEntityPortrait(ally)}
                        alt={ally.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 13,
                          color: isActive ? '#d4af37' : isCompanion ? '#90a0c0' : '#c4b896',
                          fontWeight: isActive ? 700 : 500,
                          fontFamily: 'var(--font-heading)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {ally.name}
                        </span>
                        {isActive && <span style={{ fontSize: 11, color: '#d4af37', border: '1px solid rgba(212,175,55,.3)', padding: '1px 5px', borderRadius: 3 }}>YOU</span>}
                        {isCompanion && !isActive && <span style={{ fontSize: 11, color: '#7090c0', border: '1px solid rgba(112,144,192,.3)', padding: '1px 5px', borderRadius: 3 }}>ALLY</span>}
                      </div>
                      <div style={{
                        height: 6, background: '#1a1510', borderRadius: 3, overflow: 'hidden',
                        border: '1px solid rgba(80,60,40,.2)',
                      }}>
                        <div style={{
                          width: `${hpPct}%`, height: '100%', borderRadius: 2,
                          background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#8a8060' }}>
                          {Math.max(0, ally.hp)}/{ally.maxHp} HP
                        </span>
                        <span style={{ fontSize: 11, color: '#6a6050' }}>
                          AC {ally.AC}
                        </span>
                      </div>
                      {(ally.conditions?.length ?? 0) > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                          {ally.conditions!.map(s => (
                            <span key={s} style={{
                              fontSize: 11, padding: '1px 5px', borderRadius: 3,
                              background: 'rgba(80,80,60,.2)', border: '1px solid rgba(80,80,60,.2)',
                              color: '#c0b090',
                            }}>
                              {statusIcon(s)} {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Combat Log ─────────────────────────────────────────────── */}
        {combatState.log.length > 0 && (
          <div style={{
            maxHeight: 'clamp(100px, 20vh, 200px)', overflow: 'auto', padding: 10,
            background: 'rgba(0,0,0,.4)', borderTop: '1px solid #333',
            borderBottom: '1px solid #333', borderRadius: 6,
          }}>
            <div style={{ fontSize: 11, color: '#8A7A50', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Combat Log
            </div>
            {combatState.log.slice(-8).map((e, idx) => (
              <div key={`${e.actor}-${idx}`} className="combat-log-entry" style={{
                padding: '3px 0',
                fontSize: 12,
                color: '#a09080',
                borderBottom: idx < Math.min(combatState.log.length, 8) - 1 ? '1px solid rgba(60,50,40,.15)' : 'none',
              }}>
                <span style={{ color: '#5a5040' }}>[R{e.round}] </span>
                <span style={{ color: e.result === 'miss' ? '#cc5050' : e.result === 'heal' ? '#4ade80' : '#c4b896', fontWeight: 600 }}>
                  {e.actor}
                </span>
                {' '}{e.action}
                {e.target ? <span> → <span style={{ color: '#e0c090' }}>{e.target}</span></span> : ''}
                {typeof e.damage === 'number' && (
                  <span style={{
                    color: e.result === 'heal' ? '#4ade80' : e.isCritical ? '#ffd700' : '#ef4444',
                    fontWeight: 700,
                  }}>
                    {' '}({e.damage}{e.damageType ? ` ${e.damageType}` : ''}{e.isCritical ? ' ✦' : ''})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Damage Popup ───────────────────────────────────────────── */}
        {latest && (
          <div className={`damage-popup ${latest.result === 'heal' ? 'heal' : latest.isCritical ? 'critical' : latest.result === 'miss' ? 'miss' : 'damage'}`}
            style={{ position: 'relative', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
            {latest.actor} {latest.action} → {latest.target || 'target'}
            {latest.damage ? ` for ${latest.damage} ${latest.damageType || ''}` : ''}
            {latest.isCritical ? ' ✦ CRITICAL' : ''}
          </div>
        )}
      </div>

      {/* ── Victory / Defeat Overlay ─────────────────────────────────── */}
      {combatState.victory && (
        <div className={`combat-end-overlay ${combatState.victory === 'players' ? 'combat-victory' : 'combat-defeat'}`}>
          <div className="combat-end-title" style={{ fontFamily: 'var(--font-combat)' }}>{combatState.victory === 'players' ? '🏆 VICTORY!' : '💀 DEFEAT'}</div>
          <button className="combat-end-btn" onClick={onContinue} style={{ fontFamily: 'var(--font-button)' }}>
            {combatState.victory === 'players' ? 'Continue Adventure' : 'Rise Again'}
          </button>
        </div>
      )}

      {/* ── Contextual Action Bar ────────────────────────────────────── */}
      <div className="combat-action-bar" style={{ gap: 6 }}>
        {actions.map((action, idx) => (
          <button
            key={idx}
            className={`combat-action-btn ${action.danger ? 'danger' : ''}`}
            onClick={() => onAction(action.text)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px',
              minHeight: 44,
              background: action.highlight
                ? 'rgba(80,60,20,.4)'
                : action.danger
                  ? 'rgba(60,20,20,.3)'
                  : 'rgba(40,30,20,.4)',
              border: action.highlight
                ? '1px solid rgba(212,175,55,.4)'
                : action.danger
                  ? '1px solid rgba(139,0,0,.3)'
                  : '1px solid #555',
              color: action.highlight ? '#f0d878' : action.danger ? '#cc5050' : '#c4b896',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-button)',
              fontSize: 13,
              transition: 'all .2s',
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
