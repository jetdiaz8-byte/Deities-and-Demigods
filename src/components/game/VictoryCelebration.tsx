'use client'

import React, { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VictoryCelebrationProps {
  type: 'level_up' | 'boss_defeat' | 'quest_complete'
  title?: string
  subtitle?: string
  visible: boolean
  onDismiss: () => void
}

export function VictoryCelebration({ type, title, subtitle, visible, onDismiss }: VictoryCelebrationProps) {
  // Generate particles via useMemo to avoid setState in effect
  const particles = useMemo(() => {
    if (!visible) return []
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#d4af37', '#f0d878', '#8b6914', '#f0ebe3', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 6)],
    }))
  }, [visible])

  // Auto-dismiss timer
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  const defaults = {
    level_up: { title: 'LEVEL UP!', subtitle: 'Your power grows...' },
    boss_defeat: { title: 'VICTORY!', subtitle: 'The enemy has fallen!' },
    quest_complete: { title: 'QUEST COMPLETE', subtitle: 'Another chapter closes...' },
  }

  const defaultsForType = defaults[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      >
        {/* Particle burst */}
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
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative z-10 text-center pointer-events-auto"
          onClick={onDismiss}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className="text-5xl mb-2 block">
              {type === 'level_up' ? '⬆️' : type === 'boss_defeat' ? '👑' : '📜'}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
