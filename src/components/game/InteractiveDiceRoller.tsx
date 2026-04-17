'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DiceRollerProps {
  dieType: string  // 'd4', 'd6', 'd8', 'd10', 'd12', 'd20'
  label?: string   // e.g. "Roll Damage" or "Roll Attack"
  onRoll: (result: number) => void
  disabled?: boolean
  bonus?: number   // e.g. +3 strength modifier
  showResult?: boolean
}

// S2-F4: Reduced motion hook
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const DIE_SHAPES: Record<string, string> = {
  d4: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  d6: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)',
  d8: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  d10: 'polygon(50% 0%, 95% 35%, 80% 90%, 20% 90%, 5% 35%)',
  d12: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
  d20: 'polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)',
}

export function InteractiveDiceRoller({ dieType, label = 'Roll', onRoll, disabled = false, bonus = 0, showResult = true }: DiceRollerProps) {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [tumble, setTumble] = useState(false)
  const prefersReduced = useReducedMotion()

  const maxRoll = parseInt(dieType.replace('d', ''))

  const roll = useCallback(() => {
    if (rolling || disabled) return
    setRolling(true)
    // S2-F4: Skip tumble animation in reduced-motion mode
    if (!prefersReduced) setTumble(true)
    setResult(null)

    // S2-F4: Shorter delay in reduced-motion (just compute, no animation)
    const delay = prefersReduced ? 50 : 800
    setTimeout(() => {
      const finalResult = Math.floor(Math.random() * maxRoll) + 1
      setResult(finalResult)
      setTumble(false)
      setRolling(false)
      onRoll(finalResult)
    }, delay)
  }, [rolling, disabled, maxRoll, onRoll, prefersReduced])

  const total = result !== null ? result + bonus : null

  // S2-F4: Inline keyframes for dice animation (avoids undefined class references)
  const diceKeyframes = prefersReduced ? '' : `
    @keyframes dice-tumble-anim {
      0% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(90deg) scale(0.9); }
      50% { transform: rotate(180deg) scale(1.05); }
      75% { transform: rotate(270deg) scale(0.95); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes dice-glow-gold {
      0% { box-shadow: 0 0 10px rgba(212,175,55,0.6); }
      50% { box-shadow: 0 0 25px rgba(212,175,55,0.9); }
      100% { box-shadow: 0 0 10px rgba(212,175,55,0.6); }
    }
    @keyframes dice-glow-red {
      0% { box-shadow: 0 0 10px rgba(139,38,53,0.6); }
      50% { box-shadow: 0 0 25px rgba(139,38,53,0.9); }
      100% { box-shadow: 0 0 10px rgba(139,38,53,0.6); }
    }
  `

  return (
    <div className="flex flex-col items-center gap-2">
      {/* S2-F4: Inline keyframes to replace missing global keyframes */}
      {!prefersReduced && <style>{diceKeyframes}</style>}

      {label && (
        <span className="text-xs font-title text-[#c9a84c] uppercase tracking-wider">{label}</span>
      )}

      <button
        onClick={roll}
        disabled={rolling || disabled}
        aria-label={`Roll ${dieType}${bonus ? ` +${bonus}` : ''}${result !== null ? `, last result: ${result}${bonus !== 0 ? ` (${total})` : ''}` : ''}`}
        className={`relative w-16 h-16 flex items-center justify-center cursor-pointer transition-all
          ${rolling && !prefersReduced ? 'scale-90' : 'hover:scale-110'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
        title={`Click to roll ${dieType}`}
        style={result === maxRoll && !prefersReduced ? { animation: 'dice-glow-gold 0.6s ease-out' } : result === 1 && !prefersReduced ? { animation: 'dice-glow-red 0.6s ease-out' } : undefined}
      >
        {/* Die shape */}
        <div
          className={`w-14 h-14 flex items-center justify-center transition-all duration-300
            ${tumble ? 'animate-[dice-tumble-anim_0.8s_ease-out]' : ''}
          `}
          style={{
            clipPath: DIE_SHAPES[dieType] || DIE_SHAPES.d20,
            background: result === maxRoll
              ? 'linear-gradient(135deg, #d4af37, #f0d878)'
              : result === 1
                ? 'linear-gradient(135deg, #8b2635, #cc3030)'
                : 'linear-gradient(135deg, #2a2a3a, #3a3a4a)',
            border: '2px solid #d4af37',
            boxShadow: result === maxRoll
              ? '0 0 20px rgba(212,175,55,0.6)'
              : '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          <AnimatePresence mode="wait">
            {tumble ? (
              <motion.span
                key="tumble"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1, rotate: prefersReduced ? 0 : 360 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold text-[#d4af37]"
                style={{ fontFamily: 'var(--font-heading)' }}
                aria-hidden="true"
              >
                ?
              </motion.span>
            ) : result !== null ? (
              <motion.span
                key={result}
                initial={prefersReduced ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                className="text-2xl font-bold text-[#f0ebe3]"
                style={{ fontFamily: 'var(--font-heading)' }}
                role="status"
                aria-live="polite"
              >
                {result}
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-title text-[#d4af37]"
              >
                {dieType.replace('d', 'D')}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>

      {showResult && result !== null && (
        <motion.div
          initial={prefersReduced ? { opacity: 1, y: 0 } : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
          role="status"
          aria-live="polite"
        >
          <div className="text-sm font-narrative text-[#c9a84c]">
            {result === maxRoll ? 'CRITICAL!' : result === 1 ? 'Fumble!' : `Rolled ${result}`}
            {bonus !== 0 && ` ${bonus > 0 ? '+' : ''}${bonus}`}
          </div>
          {total !== null && bonus !== 0 && (
            <div className={`text-lg font-bold ${total >= maxRoll ? 'text-[#d4af37]' : 'text-[#f0ebe3]'}`}
              style={{ fontFamily: 'var(--font-heading)' }}>
              Total: {total}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
