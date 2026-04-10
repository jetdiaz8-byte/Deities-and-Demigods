'use client'

import React, { useState } from 'react'

interface PowerOption {
  name: string
  description: string
  type: 'offensive' | 'defensive' | 'utility' | 'support'
  source: string
}

interface AbsorbedPower {
  deityId: string
  deityName: string
  portrait: string
  powerName: string
  powerDescription: string
  powerType: 'offensive' | 'defensive' | 'utility' | 'support'
  attunement: number
  turnAbsorbed: number
  gambleResult: 'clean' | 'resistant' | 'rejection' | 'overload'
  pantheon: string
}

interface PendingQuickening {
  turn: number
  fallenId: string
  fallenName: string
  portrait: string
  pantheon: string
  divineRank: number
  powerOptions: PowerOption[]
  phase: 'offer' | 'absorbing' | 'complete'
}

interface ActiveEcho {
  deityId: string
  deityName: string
  portrait: string
  personality: string
  influenceDirection: 'good' | 'evil' | 'chaotic' | 'lawful' | 'neutral'
  influenceStrength: number
  turnAbsorbed: number
  isConflicted: boolean
  conflictTurnsRemaining: number
  farewellQuote: string
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'offensive': return '\u2694'
    case 'defensive': return '\uD83D\uDEE1'
    case 'utility': return '\uD83D\uDC41'
    case 'support': return '\u2764'
    default: return '\u2728'
  }
}

export default function QuickeningOverlay({
  pendingQuickening,
  currentPower,
  activeEcho,
  onPowerChosen,
  onDismiss,
  legendTitle,
}: {
  pendingQuickening: PendingQuickening | null
  currentPower: AbsorbedPower | null
  activeEcho: ActiveEcho | null
  onPowerChosen: (option: PowerOption) => void
  onDismiss: () => void
  legendTitle: string
}) {
  const [resultPhase, setResultPhase] = useState<'clean' | 'resistant' | 'rejection' | 'overload' | null>(null)

  if (!pendingQuickening) return null

  if (pendingQuickening.phase === 'absorbing') {
    return (
      <div className="quickening-overlay">
        <div className="quickening-bg" />
        <div className="quickening-center">
          <div className="portrait-cracking">
            {pendingQuickening.portrait && (
              <img
                src={pendingQuickening.portrait}
                alt={pendingQuickening.fallenName}
                className="portrait-shatter"
                style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 8 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
          <p className="absorbing-text">The Quickening takes hold...</p>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', color: '#c4b896', fontSize: 14, marginTop: 12, textAlign: 'center', maxWidth: 400 }}>
            The divine essence flows into you...
          </p>
        </div>
      </div>
    )
  }

  if (pendingQuickening.phase === 'complete') {
    return null
  }

  // Offer phase
  return (
    <div className="quickening-overlay">
      <div className="quickening-bg" />
      <button className="quickening-close-btn" onClick={onDismiss}>X</button>

      <div className="quickening-center">
        <h2 className="quickening-title">THE QUICKENING</h2>

        {/* Fallen Deity Portrait */}
        <div className="quickening-fallen">
          <div className="portrait-cracking">
            {pendingQuickening.portrait && (
              <img
                src={pendingQuickening.portrait}
                alt={pendingQuickening.fallenName}
                style={{ width: 150, height: 200, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(212,168,67,0.5)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
          <h3 className="quickening-fallen-name">{pendingQuickening.fallenName}</h3>
          <p className="quickening-fallen-pantheon">{pendingQuickening.pantheon}</p>
          <p className="quickening-transfer-text">DIVINE ESSENCE TRANSFERRING</p>
        </div>

        {/* Current Power Warning */}
        {currentPower && (
          <div className="quickening-warning">
            <h4>WARNING: Power Replacement</h4>
            <p>Absorbing a new power will <strong>DESTROY</strong> your current power:</p>
            <p className="current-power-name">{typeIcon(currentPower.powerType)} {currentPower.powerName}</p>
            <p className="current-echo-name">From: {currentPower.deityName} (Attunement: {currentPower.attunement}%)</p>
            {activeEcho && (
              <p className="current-echo-name">The echo of {activeEcho.deityName} will fade forever</p>
            )}
            <p style={{ fontSize: 11, color: '#cc8888', marginTop: 6 }}>This cannot be undone.</p>
          </div>
        )}

        {/* Power Options */}
        <h3 className="quickening-choose-title">Choose Your New Power</h3>
        <div className="power-choice-cards-container">
          {pendingQuickening.powerOptions.map((option, idx) => (
            <div key={idx} className="power-choice-card">
              <div className="power-choice-type">{typeIcon(option.type)} {option.type}</div>
              <div className="power-choice-name">{option.name}</div>
              <div className="power-choice-desc">{option.description}</div>
              {option.source && <div className="power-choice-source">From: {option.source}</div>}
              <button
                className="absorb-btn"
                onClick={() => onPowerChosen(option)}
              >
                ABSORB
              </button>
            </div>
          ))}
        </div>

        {/* Legend Title */}
        <p style={{ fontFamily: 'MedievalSharp, serif', color: '#5a4d30', fontSize: 11, marginTop: 16 }}>
          Your Legend: {legendTitle}
        </p>
      </div>
    </div>
  )
}
