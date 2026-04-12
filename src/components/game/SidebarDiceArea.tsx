'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DiceRoll } from '@/lib/gameTypes'

interface SidebarDiceAreaProps {
  diceRolls: DiceRoll[]
}

// BG3-style dice face shapes — exact geometric clip-paths
const DICE_SHAPES: Record<number, string> = {
  4: 'polygon(50% 5%, 3% 95%, 97% 95%)',
  6: 'polygon(8% 2%, 92% 2%, 98% 8%, 98% 92%, 92% 98%, 8% 98%, 2% 92%, 2% 8%)',
  8: 'polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)',
  10: 'polygon(50% 0%, 97% 30%, 82% 95%, 18% 95%, 3% 30%)',
  12: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
  20: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
}

// BG3-style color scheme per die type
const DICE_COLORS: Record<number, { bg: string; border: string; glow: string; face: string }> = {
  4: { bg: 'linear-gradient(135deg, #8b1a1a, #cc3333)', border: '#ff4444', glow: 'rgba(204,51,51,0.5)', face: '#ffe0e0' },
  6: { bg: 'linear-gradient(135deg, #1a3a6b, #2255aa)', border: '#4488dd', glow: 'rgba(34,85,170,0.5)', face: '#d0e4ff' },
  8: { bg: 'linear-gradient(135deg, #1a5a2a, #228844)', border: '#44cc66', glow: 'rgba(34,136,68,0.5)', face: '#d0ffd8' },
  10: { bg: 'linear-gradient(135deg, #4a1a6b, #6633aa)', border: '#9966dd', glow: 'rgba(102,51,170,0.5)', face: '#e4d0ff' },
  12: { bg: 'linear-gradient(135deg, #6b4a1a, #aa7722)', border: '#ddaa44', glow: 'rgba(170,119,34,0.5)', face: '#fff4d0' },
  20: { bg: 'linear-gradient(135deg, #6b5a1a, #aa8822)', border: '#ddbb44', glow: 'rgba(170,136,34,0.5)', face: '#fffce0' },
}

// Parse die notation to get sides
function parseDieSides(die: string): number {
  const match = die.toLowerCase().match(/(\d+)d(\d+)/)
  if (match) return parseInt(match[2])
  return 20
}

// Single BG3-style dice face with 3D effect
function BG3DieFace({ sides, value, isRolling, isCritical, isFumble }: {
  sides: number
  value?: number
  isRolling: boolean
  isCritical?: boolean
  isFumble?: boolean
}) {
  const colors = DICE_COLORS[sides] || DICE_COLORS[20]
  const shape = DICE_SHAPES[sides] || DICE_SHAPES[20]
  const isD6 = sides === 6

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: 44, height: 44 }}
      animate={
        isRolling
          ? {
              y: [0, -18, -4, -22, -8, -16, -2, -10, 0],
              rotate: [0, 90, 180, 270, 360, 450, 540, 630, 720],
              scale: [1, 1.15, 0.9, 1.2, 0.85, 1.1, 0.95, 1.05, 1],
            }
          : isCritical
            ? { scale: [1, 1.3, 1.15, 1.25, 1.2], rotate: [0, -5, 3, -2, 0] }
            : isFumble
              ? { scale: [1, 0.8, 1.1, 0.9, 1], rotate: [0, 8, -5, 3, 0] }
              : { scale: [0.5, 1.1, 1], y: [-10, 2, 0] }
      }
      transition={
        isRolling
          ? { duration: 1.2, ease: 'easeOut' }
          : { duration: 0.5, ease: 'easeOut' }
      }
    >
      {/* Glow effect behind die */}
      {!isRolling && (isCritical || isFumble) && (
        <div
          className="absolute inset-0 rounded-full blur-md"
          style={{
            background: isCritical ? 'radial-gradient(circle, rgba(212,175,55,0.6), transparent 70%)' : 'radial-gradient(circle, rgba(200,0,0,0.5), transparent 70%)',
          }}
        />
      )}

      {/* 3D die face */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          clipPath: isD6 ? 'none' : shape,
          borderRadius: isD6 ? 6 : 0,
          background: colors.bg,
          border: isD6 ? `2px solid ${colors.border}` : 'none',
          boxShadow: isRolling
            ? `0 4px 20px ${colors.glow}, inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.15)`
            : isCritical
              ? `0 0 25px rgba(212,175,55,0.8), 0 0 50px rgba(212,175,55,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)`
              : isFumble
                ? `0 0 25px rgba(200,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)`
                : `0 2px 10px ${colors.glow}, inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.15)`,
          transform: 'perspective(200px) rotateX(5deg)',
        }}
      >
        {/* Inner highlight for 3D depth */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: isD6 ? 'none' : shape,
            borderRadius: isD6 ? 5 : 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
          }}
        />

        {/* Value text */}
        <AnimatePresence mode="wait">
          {isRolling ? (
            <motion.span
              key="roll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 font-bold text-lg"
              style={{ color: colors.face, fontFamily: 'var(--font-heading)', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              ?
            </motion.span>
          ) : value !== undefined ? (
            <motion.span
              key={value}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              className="relative z-10 font-bold text-lg"
              style={{
                color: isCritical ? '#ffd700' : isFumble ? '#ff4444' : colors.face,
                fontFamily: 'var(--font-heading)',
                textShadow: isCritical
                  ? '0 0 10px rgba(255,215,0,0.8), 0 1px 3px rgba(0,0,0,0.6)'
                  : isFumble
                    ? '0 0 10px rgba(255,0,0,0.6), 0 1px 3px rgba(0,0,0,0.6)'
                    : '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              {value}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="relative z-10 text-xs font-title"
              style={{ color: colors.face, fontFamily: 'var(--font-heading)' }}
            >
              {sides === 20 ? 'D20' : `D${sides}`}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Drop shadow beneath die */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: isRolling ? 20 : 30,
          height: 4,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.3)',
          filter: 'blur(2px)',
          transition: 'all 0.3s',
        }}
      />
    </motion.div>
  )
}

// Main sidebar dice area component
export function SidebarDiceArea({ diceRolls }: SidebarDiceAreaProps) {
  const [visibleRolls, setVisibleRolls] = useState<DiceRoll[]>([])
  const [animatingKeys, setAnimatingKeys] = useState<Set<number>>(new Set())
  const animatingKeysRef = useRef<Set<number>>(new Set())
  const prevLengthRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect new dice rolls and trigger animation
  useEffect(() => {
    if (diceRolls.length > prevLengthRef.current) {
      const newStart = prevLengthRef.current
      const newRolls = diceRolls.slice(newStart)

      // Set animating state for new rolls (via ref to avoid dependency cycle)
      const newKeys = new Set(animatingKeysRef.current)
      for (let i = newStart; i < diceRolls.length; i++) {
        newKeys.add(i)
      }
      animatingKeysRef.current = newKeys
      setAnimatingKeys(newKeys)

      // After tumble animation, reveal result
      const tumbleTimers = newRolls.map((_, idx) =>
        setTimeout(() => {
          animatingKeysRef.current.delete(newStart + idx)
          setAnimatingKeys(new Set(animatingKeysRef.current))
        }, 1200)
      )

      // Update visible rolls (keep last 5)
      setVisibleRolls(diceRolls.slice(-5))

      return () => tumbleTimers.forEach(clearTimeout)
    }
    prevLengthRef.current = diceRolls.length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diceRolls.length, diceRolls])

  // Auto-scroll to bottom on new rolls
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [visibleRolls.length])

  // If no rolls yet, show idle dice display
  if (diceRolls.length === 0) {
    return (
      <div className="px-3 py-2 flex-shrink-0">
        <div
          className="p-3 rounded-lg border border-[#2e2008] bg-gradient-to-b from-[#18120a] to-[#110d07]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{'🎲'}</span>
            <span className="text-[10px] text-[#7a5f20] uppercase tracking-wider font-title">Dice Tray</span>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="flex items-center justify-center opacity-30">
              <BG3DieFace sides={20} isRolling={false} />
            </div>
            <div className="flex items-center justify-center opacity-20">
              <BG3DieFace sides={6} isRolling={false} />
            </div>
            <div className="flex items-center justify-center opacity-15">
              <BG3DieFace sides={12} isRolling={false} />
            </div>
          </div>
          <div className="text-center text-[10px] text-[#3a3020] italic">
            Dice will appear here during encounters
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 flex-shrink-0">
      <div
        ref={containerRef}
        className="rounded-lg border border-[#2e2008] bg-gradient-to-b from-[#18120a] to-[#110d07] overflow-hidden"
        style={{ maxHeight: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#2e2008] bg-[#1a1510]/50">
          <div className="flex items-center gap-2">
            <span className="text-sm">{'🎲'}</span>
            <span className="text-[10px] text-[#7a5f20] uppercase tracking-wider font-title">Dice Tray</span>
          </div>
          <span className="text-[9px] text-[#5a4d30]">
            {diceRolls.length} roll{diceRolls.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Scrollable roll history */}
        <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 230 }}>
          {visibleRolls.map((roll, idx) => {
            const globalIdx = diceRolls.length - visibleRolls.length + idx
            const isAnimating = animatingKeys.has(globalIdx)
            const sides = parseDieSides(roll.die)
            const isCritical = roll.roll === sides && !isAnimating
            const isFumble = roll.roll === 1 && !isAnimating
            const rollKey = `${roll.roller}-${roll.die}-${roll.roll}-${globalIdx}`

            return (
              <motion.div
                key={rollKey}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`p-2 rounded-lg border transition-all duration-500 ${
                  isCritical
                    ? 'bg-gradient-to-r from-amber-950/60 to-yellow-900/40 border-amber-500/50 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    : isFumble
                      ? 'bg-gradient-to-r from-red-950/60 to-red-900/40 border-red-500/40 shadow-[0_0_10px_rgba(200,0,0,0.2)]'
                      : roll.success
                        ? 'bg-gradient-to-r from-emerald-950/50 to-green-900/30 border-emerald-500/30'
                        : 'bg-gradient-to-r from-rose-950/50 to-red-900/30 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* BG3 Die Face */}
                  <BG3DieFace
                    sides={sides}
                    value={isAnimating ? undefined : roll.roll}
                    isRolling={isAnimating}
                    isCritical={isCritical}
                    isFumble={isFumble}
                  />

                  {/* Roll Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-[#7a5f20] uppercase tracking-wider font-title truncate">
                      {roll.roller}
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-base font-bold ${
                          isCritical
                            ? 'text-amber-400'
                            : isFumble
                              ? 'text-red-400'
                              : roll.success
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                        }`}
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {isAnimating ? '...' : roll.roll}
                      </span>
                      {roll.dc > 0 && !isAnimating && (
                        <span className="text-[10px] text-gray-500">vs DC {roll.dc}</span>
                      )}
                    </div>
                    {!isAnimating && (
                      <div className="mt-0.5">
                        {isCritical ? (
                          <span className="text-[10px] text-amber-400 font-title">{'🎯'} NATURAL {sides}!</span>
                        ) : isFumble ? (
                          <span className="text-[10px] text-red-400 font-title">{'💀'} CRITICAL FAIL!</span>
                        ) : roll.success ? (
                          <span className="text-[10px] text-emerald-400">{'✦'} Hit</span>
                        ) : (
                          <span className="text-[10px] text-rose-400">{'✗'} Miss</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {roll.notes && !isAnimating && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#2e2008]/50">
                    <div className="text-[9px] text-[#8a7a60] italic leading-relaxed">
                      &ldquo;{roll.notes}&rdquo;
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
