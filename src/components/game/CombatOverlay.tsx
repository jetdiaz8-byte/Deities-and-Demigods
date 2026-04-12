'use client'

import React from 'react'

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

export default function CombatOverlay({
  combatState,
  onClose,
  onFlee,
  onAction,
  onContinue,
  currentPower,
  gameState,
}: {
  combatState: CombatState
  onClose: () => void
  onFlee: () => void
  onAction: (text: string) => void
  onContinue: () => void
  currentPower?: any
  gameState?: {
    pcs?: Array<{ id: string; name: string; hp: number; maxHp: number; abilities?: string[]; personality?: string }>
    activeNPCs?: Array<{ id: string; name: string; encounter_type?: string; conditions?: string[] }>
    humanPCId?: string
  }
}) {
  const latest = combatState.log[combatState.log.length - 1]
  const current = combatState.turnOrder[combatState.currentTurnIndex]
  const allies = combatState.turnOrder.filter(c => c.isPlayer)
  const enemies = combatState.turnOrder.filter(c => !c.isPlayer)

  // --- Contextual text helpers derived from gameState ---
  const humanPC = gameState?.pcs?.find(p => p.id === gameState?.humanPCId) ?? gameState?.pcs?.[0]
  const pcName = humanPC?.name ?? null

  // Enemy: prefer the first alive enemy from activeNPCs, fallback to first combat enemy
  const enemyName =
    gameState?.activeNPCs?.[0]?.name ??
    enemies.find(e => !e.isDead)?.name ??
    null

  // Magical ability: pick first ability from PC that sounds magical
  const magicalKeywords = ['magic', 'spell', 'arcane', 'divine', 'fire', 'ice', 'lightning', 'shadow', 'holy', 'dark', 'enchant', 'summon', 'curse', 'heal', 'flame', 'frost', 'thunder']
  const pcAbility = humanPC?.abilities?.find(a =>
    magicalKeywords.some(k => a.toLowerCase().includes(k))
  ) ?? humanPC?.abilities?.[0] ?? null

  // Lowest-HP ally for healing
  const lowestHPAlly = gameState?.pcs
    ?.filter(p => !p.isDead && p.hp < p.maxHp)
    ?.sort((a, b) => (a.hp / Math.max(1, a.maxHp)) - (b.hp / Math.max(1, b.maxHp)))
    ?.[0]?.name ?? null

  const attackText = enemyName ? `I strike ${enemyName} with my weapon!` : 'I attack with my weapon!'
  const defendText = pcName ? `${pcName} takes a defensive stance!` : 'I take a defensive stance.'
  const castSpellText = pcAbility && pcName ? `${pcName} channels ${pcAbility}!` : 'I cast a spell!'
  const healText = lowestHPAlly ? `I focus my energy on healing ${lowestHPAlly}!` : 'I focus on healing.'
  const fleeText = enemyName ? `I flee from ${enemyName}!` : 'I attempt to flee!'
  const statusIcon = (s: string) => {
    const key = s.toLowerCase()
    if (key.includes('burn')) return '🔥'
    if (key.includes('poison')) return '💚'
    if (key.includes('stun')) return '⚡'
    if (key.includes('bless')) return '✨'
    if (key.includes('shield')) return '🛡️'
    return '•'
  }
  return (
    <div className={`combat-overlay ${latest?.isCritical ? 'screen-shake' : ''}`}>
      <div className="combat-banner">
        <button className="combat-close-btn" onClick={onClose}>X</button>
        <h2>COMBAT - Round {combatState.round || 1}</h2>
      </div>
      <div className="initiative-tracker">
        {combatState.turnOrder.map((c, i) => {
          const hpPct = Math.max(0, Math.min(100, Math.round((c.hp / Math.max(1, c.maxHp)) * 100)))
          const hpClass = hpPct > 75 ? 'healthy' : hpPct > 50 ? 'wounded' : hpPct > 25 ? 'bloodied' : 'critical'
          return (
            <div key={c.id} className={`initiative-slot ${i === combatState.currentTurnIndex ? 'active' : ''} ${c.isPlayer ? 'is-player' : ''} ${c.isDead ? 'dead' : ''}`}>
              <div className="initiative-portrait">{c.portrait ? <img src={c.portrait} alt={c.name} className="initiative-portrait" /> : c.name.charAt(0)}</div>
              {c.isDead && <span className="initiative-skull">☠</span>}
              <div className="initiative-name">{c.name}</div>
              <div className="initiative-status">{(c.statusEffects || []).slice(0, 3).map(s => <span key={s}>{statusIcon(s)}</span>)}</div>
              <div className="hp-bar-container">
                <div className={`hp-bar-fill ${hpClass}`} style={{ width: `${hpPct}%` }} />
                <span className="hp-text">{Math.max(0, c.hp)}/{c.maxHp}</span>
              </div>
            </div>
          )
        })}
      </div>
      {latest && (
        <div className={`damage-popup ${latest.result === 'heal' ? 'heal' : latest.isCritical ? 'critical' : latest.result === 'miss' ? 'miss' : 'damage'}`} style={{ position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
          {latest.actor} {latest.action} → {latest.target || 'target'} {latest.damage ? `for ${latest.damage} ${latest.damageType || ''}` : ''}
        </div>
      )}
      <div className="combat-columns">
        <div className="combat-column">
          <h4>Allies</h4>
          {allies.map(c => <div key={c.id} className={`combatant-row ${current?.id === c.id ? 'active' : ''}`}>{c.name} ({Math.max(0, c.hp)}/{c.maxHp})</div>)}
        </div>
        <div className="combat-column">
          <h4>Enemies</h4>
          {enemies.map(c => <div key={c.id} className={`combatant-row ${current?.id === c.id ? 'active' : ''}`}>{c.name} ({Math.max(0, c.hp)}/{c.maxHp})</div>)}
        </div>
      </div>
      <div className="combat-log">
        {combatState.log.slice(-10).map((e, idx) => (
          <div key={`${e.actor}-${idx}`} className="combat-log-entry">
            <span>[R{e.round}] </span>
            <span className={e.actor === current?.name ? 'actor-player' : 'actor-enemy'}>{e.actor}</span> {e.action} {e.target ? `→ ${e.target}` : ''} {typeof e.damage === 'number' ? `(${e.damage})` : ''}
          </div>
        ))}
      </div>
      {combatState.victory && (
        <div className={`combat-end-overlay ${combatState.victory === 'players' ? 'combat-victory' : 'combat-defeat'}`}>
          <div className="combat-end-title">{combatState.victory === 'players' ? 'VICTORY!' : 'DEFEAT'}</div>
          <button className="combat-end-btn" onClick={onContinue}>{combatState.victory === 'players' ? 'Continue Adventure' : 'Rise Again'}</button>
        </div>
      )}
      <div className="combat-action-bar">
        <button className="combat-action-btn" onClick={() => onAction(attackText)}>⚔ Attack</button>
        <button className="combat-action-btn" onClick={() => onAction(defendText)}>🛡 Defend</button>
        <button className="combat-action-btn" onClick={() => onAction(castSpellText)}>🔮 Cast Spell</button>
        <button className="combat-action-btn" onClick={() => onAction(healText)}>🩺 Heal</button>
        <button className="combat-action-btn divine-power-btn" onClick={() => onAction(`I unleash ${currentPower?.powerName || 'divine power'}!`)} disabled={!currentPower}>✨ {currentPower ? `Divine Power (${currentPower.attunement}%)` : 'No Power'}</button>
        <button className="combat-action-btn" onClick={() => onAction(fleeText)} disabled={combatState.phase !== 'player_turn'}>🏃 Flee</button>
      </div>
    </div>
  )
}

