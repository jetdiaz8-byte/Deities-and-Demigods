'use client'

import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameState } from '@/lib/gameTypes'

interface DeathScreenProps {
  gameState: GameState
  visible: boolean
  onDismiss: () => void
}

// S2-F4: Reduced motion hook
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function DeathScreen({ gameState, visible, onDismiss }: DeathScreenProps) {
  const deadPC = gameState.pcs.find(p => p.dead && p.id === gameState.humanPCId)
  const prefersReduced = useReducedMotion()

  // S2-F6: Keyboard dismiss + screen reader announcement
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDismiss()
    }
  }, [onDismiss])

  // Announce to screen readers when visible
  useEffect(() => {
    if (visible && deadPC) {
      const el = document.getElementById('death-screen-announce')
      if (el) el.textContent = `${deadPC.name} has fallen. The prophecy remains unfulfilled. Click or press Enter to continue.`
    }
  }, [visible, deadPC])

  const fadeDuration = prefersReduced ? 0 : 1
  const scaleAnimation = prefersReduced
    ? { scale: 1, rotateY: 0 }
    : { scale: 0.8, rotateY: 15 }
  const scaleTransition = prefersReduced
    ? { duration: 0 }
    : { duration: 2, ease: 'easeInOut' as const }

  return (
    <AnimatePresence>
      {visible && deadPC && (
        <motion.div
          key="death-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={onDismiss}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="alertdialog"
          aria-modal="true"
          aria-label="Character Death"
          aria-describedby="death-screen-announce"
        >
          {/* Screen reader live region — S2-F6 */}
          <div id="death-screen-announce" className="sr-only" aria-live="assertive" role="alert" />

          {/* Dark overlay with red tint */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, rgba(40,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
          }} />

          {/* Shattered portrait effect */}
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, ...scaleAnimation }}
            transition={prefersReduced ? { duration: 0 } : { delay: 0.5, duration: 1 }}
            className="relative z-10 text-center"
            style={prefersReduced ? scaleAnimation : {}}
          >
            {/* Grim reaper / skull */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReduced ? { duration: 0 } : { delay: 0.5, duration: 1 }}
              className="text-6xl mb-4"
            >
              💀
            </motion.div>

            <motion.h2
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: 1, duration: 1 }}
              className="text-3xl font-title text-red-500 tracking-widest mb-2"
              style={{ fontFamily: 'var(--font-title)', textShadow: '0 0 20px rgba(200,0,0,0.5)' }}
            >
              FALLEN
            </motion.h2>

            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: 1.5, duration: 1 }}
            >
              <p className="text-xl font-name text-[#8b2635] mb-4">
                {deadPC.name}
              </p>
              <p className="text-sm text-[#5a4040] italic font-narrative max-w-md mx-auto">
                The prophecy remains unfulfilled... but the shard will find another bearer.
              </p>
            </motion.div>

            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={prefersReduced ? { duration: 0 } : { delay: 2.5, duration: 1 }}
              className="mt-8"
            >
              <span className="text-xs text-[#5a4040] font-title uppercase tracking-widest">
                Click or press Enter to continue
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
