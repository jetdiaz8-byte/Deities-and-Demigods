'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import type { GameState } from '@/lib/gameTypes'

interface TestOfFaithProps {
  gameState: GameState
  resolveTestOfFaith: (roll: number) => void
}

export function TestOfFaith({ gameState, resolveTestOfFaith }: TestOfFaithProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [finalRoll, setFinalRoll] = useState<number | null>(null)

  const triggerText: Record<string, string> = {
    death_save: `${gameState.testOfFaithContext?.pcName} has fallen. The shard stirs — offering one chance to defy death itself.`,
    boss_phase: `The antagonist grows stronger. The shard pulses with desperate energy — offering one chance to turn the tide.`,
    desperate_odds: `The odds have never been worse. The shard burns cold — offering one chance for the universe to choose a side.`
  }

  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timers on unmount to prevent state updates on dead components
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current)
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current)
    }
  }, [])

  const rollDice = useCallback(() => {
    if (isRolling || finalRoll !== null) return
    setIsRolling(true)

    // Spin for 2 seconds, then reveal
    rollTimerRef.current = setTimeout(() => {
      const result = Math.floor(Math.random() * 20) + 1
      setFinalRoll(result)
      setIsRolling(false)

      // Apply the result after a dramatic pause
      resolveTimerRef.current = setTimeout(() => resolveTestOfFaith(result), 1500)
    }, 2000)
  }, [isRolling, finalRoll, resolveTestOfFaith])

  const trustFate = useCallback(() => {
    if (isRolling || finalRoll !== null) return
    // v2.44.0: Trust Fate set to 12 — slightly better than random average (10.5)
    // to reward the narrative choice of surrendering to fate
    setFinalRoll(12)
    resolveTimerRef.current = setTimeout(() => resolveTestOfFaith(12), 1000)
  }, [isRolling, finalRoll, resolveTestOfFaith])

  if (!gameState.pendingTestOfFaith) return null

  const ctx = gameState.testOfFaithContext
  const resultColor = finalRoll === null
    ? '#d4af37'
    : finalRoll >= 18 ? '#fbbf24'
    : finalRoll <= 3 ? '#ef4444'
    : '#9ca3af'

  const resultGlow = finalRoll === null
    ? 'rgba(212,175,55,0.3)'
    : finalRoll >= 18 ? 'rgba(251,191,36,0.4)'
    : finalRoll <= 3 ? 'rgba(239,68,68,0.4)'
    : 'rgba(156,163,175,0.2)'

  return (
    <div className="mt-4" style={{
      border: `2px solid ${resultColor}`,
      borderRadius: '8px',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, rgba(20,15,5,0.95), rgba(10,5,15,0.9))',
      boxShadow: `0 0 20px ${resultGlow}, inset 0 0 20px ${resultGlow}`,
      textAlign: 'center',
      animation: 'fadeIn 0.6s ease'
    }}>
      <div style={{
        fontFamily: 'var(--font-title)',
        fontSize: '1.1rem',
        color: resultColor,
        letterSpacing: '.12em',
        marginBottom: '0.75rem'
      }}>
        ✦ TEST OF FAITH ✦
      </div>

      <p style={{
        color: '#b0a080',
        fontStyle: 'italic',
        fontFamily: 'var(--font-dialogue)',
        lineHeight: '1.7',
        marginBottom: '1.5rem',
        fontSize: '0.95rem'
      }}>
        {ctx ? triggerText[ctx.trigger] || 'The shard offers a chance...' : 'The shard offers a chance...'}
      </p>

      {/* DICE */}
      <div
        onClick={rollDice}
        style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 1.5rem',
          borderRadius: finalRoll !== null ? '12px' : '50%',
          background: 'linear-gradient(135deg, #2a1f0a, #1a1208)',
          border: `2px solid ${resultColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isRolling || finalRoll !== null ? 'default' : 'pointer',
          boxShadow: `0 0 15px ${resultGlow}`,
          transition: 'all 0.5s ease',
          animation: isRolling ? 'diceSpin 0.08s steps(1) infinite' : 'none'
        }}
      >
        <span style={{
          fontFamily: 'var(--font-title)',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: resultColor,
          textShadow: `0 0 10px ${resultGlow}`,
          transition: 'all 0.3s ease'
        }}>
          {isRolling ? '⚡' : finalRoll !== null ? finalRoll : 'd20'}
        </span>
      </div>

      {finalRoll === null && !isRolling && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={rollDice}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              letterSpacing: '.1em',
              padding: '0.75rem 2rem',
              background: 'linear-gradient(to bottom, #5a3a10, #3a2510)',
              color: '#f0d878',
              border: '2px solid #8a6020',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⚡ ROLL THE DICE ⚡
          </button>

          <button
            onClick={trustFate}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.85rem',
              letterSpacing: '.08em',
              padding: '0.6rem 1.5rem',
              background: 'linear-gradient(to bottom, #2a2018, #1a1510)',
              color: '#7a6a50',
              border: '1px solid #3a3020',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Trust Fate
          </button>
        </div>
      )}

      <p style={{
        color: '#5a4d30',
        fontSize: '0.75rem',
        marginTop: '1rem'
      }}>
        {finalRoll !== null
          ? finalRoll >= 18 ? 'THE UNIVERSE HAS SPOKEN — AND IT FAVORS YOU'
          : finalRoll <= 3 ? "THE GODS HAVE ABANDONED YOU — MURPHY'S LAW"
          : 'FATE IS NEUTRAL — THE STORY CONTINUES'
          : 'Tap the dice to test the hand of fate'}
      </p>
    </div>
  )
}
