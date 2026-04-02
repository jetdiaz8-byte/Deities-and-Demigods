'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { X, Trophy } from 'lucide-react'
import { getAchievementDef, TIER_CONFIG, type AchievementDef } from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT NOTIFICATION — Animated toast that slides in from top-right
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
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setDismissed(true)
        onDismiss()
      }, 400) // wait for slide-out animation
    }, 5000)
    return () => clearTimeout(timer)
  }, [achievementId, def, onDismiss])

  if (!def || dismissed) return null

  const tier = TIER_CONFIG[def.tier]

  return (
    <div
      className={`fixed top-20 right-4 z-[200] transition-all duration-400 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[280px] max-w-[360px]"
        style={{
          background: `linear-gradient(135deg, ${tier.bg}, rgba(10,8,6,0.95))`,
          borderColor: tier.border,
          boxShadow: `0 0 30px ${tier.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-xl opacity-30"
          style={{
            background: `radial-gradient(ellipse at 20% 50%, ${tier.glow}, transparent 70%)`,
          }}
        />

        {/* Close button */}
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 400) }}
          className="absolute top-1.5 right-1.5 text-gray-500 hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon */}
        <div
          className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg border text-2xl"
          style={{
            background: `linear-gradient(135deg, ${tier.bg}, rgba(0,0,0,0.3))`,
            borderColor: tier.border,
          }}
        >
          {def.icon}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Trophy className="w-3 h-3" style={{ color: tier.color }} />
            <span
              className="text-[9px] uppercase tracking-widest font-bold"
              style={{ color: tier.color }}
            >
              {tier.label}
            </span>
          </div>
          <div
            className="text-sm font-bold truncate"
            style={{ color: tier.color, fontFamily: 'Cinzel, serif' }}
          >
            {def.name}
          </div>
          <div className="text-[11px] text-[#a09070] leading-tight mt-0.5 line-clamp-2">
            {def.description}
          </div>
        </div>

        {/* Animated shimmer border (for gold+) */}
        {(def.tier === 'gold' || def.tier === 'legendary') && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${tier.glow}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'achievementShimmer 2s ease-in-out infinite',
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes achievementShimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
      `}</style>
    </div>
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
