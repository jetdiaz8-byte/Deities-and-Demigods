'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy } from 'lucide-react'
import { getAchievementDef, TIER_CONFIG, type AchievementDef } from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT NOTIFICATION — Dramatic toast that slides in from top-center
// ═══════════════════════════════════════════════════════════════════════════

interface AchievementNotificationProps {
  achievementId: string | null
  turnNumber: number
  onDismiss: () => void
}

export function AchievementNotification({ achievementId, turnNumber, onDismiss }: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const def = achievementId ? getAchievementDef(achievementId) : null

  useEffect(() => {
    if (!def) { setVisible(false); return }
    setDismissed(false)
    setVisible(true)
    // Auto-dismiss after 4 seconds with fade-out
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setDismissed(true)
        onDismiss()
      }, 500) // wait for slide-out animation
    }, 4000)
    return () => clearTimeout(timer)
  }, [achievementId, def, onDismiss])

  if (!def || dismissed) return null

  const tier = TIER_CONFIG[def.tier]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -120, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -120, opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto"
        >
          <div
            className="relative flex items-center gap-4 px-6 py-4 rounded-xl border shadow-2xl min-w-[340px] max-w-[420px]"
            style={{
              background: `linear-gradient(135deg, ${tier.bg}, rgba(10,8,6,0.97))`,
              borderColor: tier.border,
              boxShadow: `0 0 40px ${tier.glow}, 0 8px 32px rgba(0,0,0,0.7)`,
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-xl opacity-30"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${tier.glow}, transparent 70%)`,
              }}
            />

            {/* Close button */}
            <button
              onClick={() => { setVisible(false); setTimeout(onDismiss, 500) }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Animated icon */}
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-lg border text-3xl"
              style={{
                background: `linear-gradient(135deg, ${tier.bg}, rgba(0,0,0,0.3))`,
                borderColor: tier.border,
              }}
            >
              {def.icon}
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Trophy className="w-3.5 h-3.5" style={{ color: tier.color }} />
                <span
                  className="text-[9px] uppercase tracking-widest font-bold"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>
              <div
                className="text-base font-bold truncate"
                style={{ color: tier.color, fontFamily: 'Cinzel, serif' }}
              >
                {def.name}
              </div>
              <div className="text-xs text-[#a09070] leading-tight mt-0.5 line-clamp-2">
                {def.description}
              </div>
            </div>

            {/* Gold shimmer border animation */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent, ${tier.glow}, transparent)`,
                backgroundSize: '200% 100%',
                animation: 'achievementShimmer 2s ease-in-out infinite',
              }}
            />
          </div>

          <style jsx>{`
            @keyframes achievementShimmer {
              0%, 100% { background-position: 200% 0; }
              50% { background-position: -200% 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT NOTIFICATION QUEUE — Shows notifications one at a time
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementNotificationQueue({
  unlockQueue,
  currentTurn,
  onProcessed,
}: {
  unlockQueue: Array<{ id: string; turn: number }>
  currentTurn: number
  onProcessed: (id: string) => void
}) {
  const [currentIdx, setCurrentIdx] = useState(0)

  const current = unlockQueue[currentIdx]

  const handleDismiss = useCallback(() => {
    if (current) {
      onProcessed(current.id)
      setCurrentIdx(prev => prev + 1)
    }
  }, [current, onProcessed])

  // Reset index when queue changes
  useEffect(() => {
    setCurrentIdx(0)
  }, [unlockQueue.length])

  if (!current) return null

  return (
    <AchievementNotification
      achievementId={current.id}
      turnNumber={current.turn}
      onDismiss={handleDismiss}
    />
  )
}
