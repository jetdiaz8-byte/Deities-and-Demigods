'use client'

import React, { useState, useMemo } from 'react'
import { X, Trophy, Lock, ChevronDown } from 'lucide-react'
import {
  ACHIEVEMENT_DEFS,
  TIER_CONFIG,
  CATEGORY_CONFIG,
  getUnlockedCount,
  getTotalCount,
  getCategoryProgress,
  type AchievementDef,
  type AchievementRecord,
  type AchievementCategory,
  type AchievementTracker,
} from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS DIALOG — Full achievement gallery with filtering
// ═══════════════════════════════════════════════════════════════════════════

interface AchievementsDialogProps {
  open: boolean
  onClose: () => void
  tracker: AchievementTracker
}

export function AchievementsDialog({ open, onClose, tracker }: AchievementsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [selectedTier, setSelectedTier] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'legendary'>('all')

  const unlockedCount = getUnlockedCount(tracker)
  const totalCount = getTotalCount()
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const filteredAchievements = useMemo(() => {
    let results = ACHIEVEMENT_DEFS

    if (selectedCategory !== 'all') {
      results = results.filter(a => a.category === selectedCategory)
    }
    if (selectedTier !== 'all') {
      results = results.filter(a => a.tier === selectedTier)
    }

    // Sort: unlocked first (by tier desc), then locked (by tier desc)
    const tierOrder: Record<string, number> = { legendary: 0, gold: 1, silver: 2, bronze: 3 }
    results.sort((a, b) => {
      const aRec = tracker.records[a.id]
      const bRec = tracker.records[b.id]
      const aUnlocked = aRec?.unlocked ? 0 : 1
      const bUnlocked = bRec?.unlocked ? 0 : 1
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
      return (tierOrder[a.tier] || 3) - (tierOrder[b.tier] || 3)
    })

    return results
  }, [selectedCategory, selectedTier, tracker])

  const categories: Array<{ value: AchievementCategory | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🏆' },
    ...Object.entries(CATEGORY_CONFIG).map(([key, val]) => ({
      value: key as AchievementCategory,
      label: val.label,
      icon: val.icon,
    })),
  ]

  const tiers: Array<{ value: 'all' | 'bronze' | 'silver' | 'gold' | 'legendary'; label: string }> = [
    { value: 'all', label: 'All Tiers' },
    { value: 'bronze', label: '🥉 Bronze' },
    { value: 'silver', label: '🥈 Silver' },
    { value: 'gold', label: '🥇 Gold' },
    { value: 'legendary', label: '👑 Legendary' },
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #12100c 0%, #0a0806 100%)',
          borderColor: '#3a3020',
          boxShadow: '0 0 60px rgba(212,175,55,0.1), 0 25px 50px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-[#2e2008] bg-gradient-to-r from-[#1a1510] to-[#12100c]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-[#8a7040] hover:text-[#d4af37] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#d4af37]" />
            <h2
              className="text-lg text-[#d4af37] tracking-wider"
              style={{ fontFamily: '"Cinzel Decorative", serif' }}
            >
              ACHIEVEMENTS
            </h2>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[#1a1510] rounded-full overflow-hidden border border-[#2e2008]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, #cd7f32, ${progressPct > 50 ? '#ffd700' : '#c0c0c0'}, ${progressPct > 75 ? '#ff6bff' : '#ffd700'})`,
                }}
              />
            </div>
            <span className="text-xs text-[#c9a84c] font-bold whitespace-nowrap">
              {unlockedCount}/{totalCount}
              <span className="text-[#8a7040] ml-1">({progressPct}%)</span>
            </span>
          </div>

          {/* Category & Tier filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]'
                    : 'bg-[#0d0a08] border-[#2e2008] text-[#8a7040] hover:border-[#5a4018] hover:text-[#c9a84c]'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Tier filter (secondary) */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tiers.map(tier => (
              <button
                key={tier.value}
                onClick={() => setSelectedTier(tier.value)}
                className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider transition-all ${
                  selectedTier === tier.value
                    ? 'bg-[#3a3020] text-[#d4af37]'
                    : 'text-[#5a4d30] hover:text-[#8a7040]'
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: 'calc(85vh - 200px)' }}>
          {/* Category progress bars (when 'all' selected) */}
          {selectedCategory === 'all' && selectedTier === 'all' && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(Object.entries(CATEGORY_CONFIG) as [AchievementCategory, typeof CATEGORY_CONFIG[AchievementCategory]][]).map(([key, cfg]) => {
                const prog = getCategoryProgress(tracker, key)
                return (
                  <div key={key} className="bg-[#0d0a08] rounded-lg border border-[#2e2008] p-2 text-center">
                    <div className="text-base mb-0.5">{cfg.icon}</div>
                    <div className="text-[9px] text-[#8a7040] uppercase tracking-wider">{cfg.label}</div>
                    <div className="text-[10px] text-[#c9a84c] font-bold mt-0.5">
                      {prog.unlocked}/{prog.total}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Achievement Cards */}
          {filteredAchievements.map(def => {
            const rec = tracker.records[def.id]
            const unlocked = rec?.unlocked
            const tier = TIER_CONFIG[def.tier]

            return (
              <div
                key={def.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  unlocked
                    ? 'border-opacity-60'
                    : 'opacity-60 border-[#1a1510]'
                }`}
                style={{
                  background: unlocked
                    ? `linear-gradient(135deg, ${tier.bg}, rgba(10,8,6,0.5))`
                    : 'rgba(10,8,6,0.3)',
                  borderColor: unlocked ? tier.border : '#1a1510',
                  boxShadow: unlocked ? `0 0 10px ${tier.glow}` : 'none',
                }}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border text-xl ${
                    unlocked ? '' : 'grayscale'
                  }`}
                  style={{
                    background: unlocked
                      ? `linear-gradient(135deg, ${tier.bg}, rgba(0,0,0,0.3))`
                      : 'rgba(30,25,18,0.5)',
                    borderColor: unlocked ? tier.border : '#2e2008',
                  }}
                >
                  {unlocked ? def.icon : <Lock className="w-4 h-4 text-[#5a4d30]" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold truncate"
                      style={{
                        color: unlocked ? tier.color : '#5a4d30',
                        fontFamily: 'Cinzel, serif',
                      }}
                    >
                      {unlocked ? def.name : '???'}
                    </span>
                    {unlocked && (
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          color: tier.color,
                          background: `${tier.color}20`,
                          border: `1px solid ${tier.color}40`,
                        }}
                      >
                        {tier.label}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8a7040] leading-tight mt-0.5">
                    {unlocked ? def.description : def.hidden ? 'Hidden achievement' : def.description}
                  </div>
                  {unlocked && rec?.unlockedAt && (
                    <div className="text-[9px] text-[#5a4d30] mt-0.5">
                      Unlocked on Turn {rec.unlockedAt}
                    </div>
                  )}
                </div>

                {/* Checkmark */}
                {unlocked && (
                  <div
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: `${tier.color}30`, color: tier.color }}
                  >
                    ✓
                  </div>
                )}
              </div>
            )
          })}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-8 text-[#5a4d30] text-sm">
              No achievements match your filters.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2e2008] bg-[#0d0a08] text-center">
          <span className="text-[10px] text-[#5a4d30]">
            Hidden achievements are revealed when unlocked. Keep exploring!
          </span>
        </div>
      </div>
    </div>
  )
}
