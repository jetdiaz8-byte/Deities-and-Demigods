'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VictoryCelebrationProps {
  type: 'level_up' | 'boss_defeat' | 'quest_complete'
  title?: string
  subtitle?: string
  visible: boolean
  onDismiss: () => void
}

// S2-F4: Reduced motion hook
function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function VictoryCelebration({ type, title, subtitle, visible, onDismiss }: VictoryCelebrationProps) {
  const prefersReduced = useReducedMotion()

  // S2-F6: Keyboard dismiss + screen reader announcement
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDismiss()
    }
  }, [onDismiss])

  // Generate particles via useMemo to avoid setState in effect
  const particles = useMemo(() => {
    if (!visible || prefersReduced) return []
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#d4af37', '#f0d878', '#8b6914', '#f0ebe3', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 6)],
    }))
  }, [visible, prefersReduced])

  // Auto-dismiss timer
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onDismiss])

  // Announce to screen readers — S2-F6
  useEffect(() => {
    if (visible) {
      const el = document.getElementById('victory-screen-announce')
      if (el) {
        const defaults = {
          level_up: 'Level Up! Your power grows...',
          boss_defeat: 'Victory! The enemy has fallen!',
          quest_complete: 'Quest Complete. Another chapter closes...',
        }
        el.textContent = `${title || defaults[type]}. ${subtitle || ''}`
      }
    }
  }, [visible, type, title, subtitle])

  const defaults = {
    level_up: { title: 'LEVEL UP!', subtitle: 'Your power grows...' },
    boss_defeat: { title: 'VICTORY!', subtitle: 'The enemy has fallen!' },
    quest_complete: { title: 'QUEST COMPLETE', subtitle: 'Another chapter closes...' },
  }

  const defaultsForType = defaults[type]
  const iconEmoji = type === 'level_up' ? '⬆️' : type === 'boss_defeat' ? '👑' : '📜'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="victory-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : undefined }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="alertdialog"
          aria-modal="true"
          aria-label={`${title || defaultsForType.title}`}
        >
          {/* Screen reader live region — S2-F6 */}
          <div id="victory-screen-announce" className="sr-only" aria-live="assertive" role="alert" />

          {/* S2-F4: Confetti particles — disabled in reduced-motion */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: '50vw', y: '50vh', scale: 0, opacity: 1 }}
              animate={{
                x: `${p.x}vw`,
                y: `${p.y}vh`,
                scale: [0, 1.5, 0.5],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
              className="absolute w-3 h-3 rounded-full"
              style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
            />
          ))}

          {/* Main text */}
          <motion.div
            initial={prefersReduced ? { opacity: 1, scale: 1, rotate: 0 } : { scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { type: 'spring', damping: 15, stiffness: 200 }}
            className="relative z-10 text-center pointer-events-auto"
            onClick={onDismiss}
          >
            <motion.div
              animate={prefersReduced ? {} : { scale: [1, 1.1, 1] }}
              transition={prefersReduced ? {} : { repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-5xl mb-2 block" aria-hidden="true">
                {iconEmoji}
              </span>
            </motion.div>
            <h2
              className="text-4xl font-title text-[#d4af37] tracking-widest mb-2"
              style={{
                fontFamily: 'var(--font-title)',
                textShadow: '0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.3)',
              }}
            >
              {title || defaultsForType.title}
            </h2>
            <p className="text-lg text-[#f0ebe3] font-narrative">
              {subtitle || defaultsForType.subtitle}
            </p>
            <span className="block mt-4 text-xs text-[#8a7040] font-title uppercase tracking-widest">
              Click or press Escape to dismiss
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
