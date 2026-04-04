'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import type { Item } from '@/lib/gameTypes'

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT TOOLTIP CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface TooltipState {
  item: Item | null
  position: { x: number; y: number }
  visible: boolean
}

interface EquipmentTooltipContextValue {
  tooltip: TooltipState
  showTooltip: (item: Item, rect: DOMRect) => void
  hideTooltip: () => void
}

const EquipmentTooltipContext = createContext<EquipmentTooltipContextValue>({
  tooltip: { item: null, position: { x: 0, y: 0 }, visible: false },
  showTooltip: () => {},
  hideTooltip: () => {},
})

export function useEquipmentTooltip() {
  return useContext(EquipmentTooltipContext)
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const rarityColors: Record<string, { name: string; border: string; bg: string; glow: string }> = {
  common: { name: '#9a8860', border: '#5a4d30', bg: 'rgba(90,77,48,0.08)', glow: 'rgba(154,136,96,0.15)' },
  uncommon: { name: '#4a9060', border: '#2a6040', bg: 'rgba(74,144,96,0.08)', glow: 'rgba(74,144,96,0.15)' },
  rare: { name: '#5a9fd4', border: '#306090', bg: 'rgba(90,159,212,0.08)', glow: 'rgba(90,159,212,0.15)' },
  legendary: { name: '#e8b040', border: '#8a6020', bg: 'rgba(232,176,64,0.08)', glow: 'rgba(232,176,64,0.2)' },
}

const typeIcons: Record<string, string> = {
  equipment: '⚔️',
  potion: '🧪',
  scroll: '📜',
  artifact: '✨',
}

const typeLabels: Record<string, string> = {
  equipment: 'Equipment',
  potion: 'Potion',
  scroll: 'Scroll',
  artifact: 'Artifact',
}

function EquipmentTooltipCard({ item, position }: { item: Item; position: { x: number; y: number } }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rarity = rarityColors[item.rarity] || rarityColors.common

  // Smart positioning: compute from position prop directly with some margin
  const adjustedPos = React.useMemo(() => {
    const maxX = typeof window !== 'undefined' ? window.innerWidth - 300 : 500
    const maxY = typeof window !== 'undefined' ? window.innerHeight - 250 : 400
    return {
      x: Math.min(Math.max(position.x, 12), maxX),
      y: Math.min(Math.max(position.y + 8, 12), maxY),
    }
  }, [position])

  return (
    <div
      ref={cardRef}
      className="fixed z-[300] pointer-events-none"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        animation: 'tooltipFadeIn 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="rounded-lg border p-3 shadow-xl max-w-[280px] min-w-[200px]"
        style={{
          background: 'linear-gradient(135deg, #1a1510, #12100c)',
          borderColor: rarity.border,
          boxShadow: `0 0 20px ${rarity.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
      >
        {/* Header: icon + name + type badge */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-2xl flex-shrink-0">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold" style={{ color: rarity.name, fontFamily: 'Cinzel, serif' }}>
              {item.name}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs">{typeIcons[item.type] || '📦'}</span>
              <span className="text-[10px] text-[#7a5f20]">{typeLabels[item.type] || item.type}</span>
              <span className="text-[10px] text-[#5a4d30]">·</span>
              <span className="text-[10px] capitalize" style={{ color: rarity.name }}>{item.rarity}</span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px mb-2" style={{ background: `linear-gradient(90deg, transparent, ${rarity.border}, transparent)` }} />

        {/* Effect description */}
        <div className="text-xs text-[#c9a84c] mb-2 leading-relaxed">
          {item.effect}
        </div>

        {/* Stats/Modifiers */}
        {item.modifier && Object.keys(item.modifier).length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] text-[#7a5f20] uppercase tracking-wider mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
              Modifiers
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.modifier).map(([key, val]) => (
                <span
                  key={key}
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    color: val >= 0 ? '#4a9060' : '#e05050',
                  }}
                >
                  {key}: {val >= 0 ? '+' : ''}{val}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Charges */}
        {item.charges !== undefined && item.maxCharges !== undefined && item.charges < 99 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(item.maxCharges, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-4 rounded-sm"
                  style={{
                    background: i < item.charges! ? '#d4af37' : '#2a2010',
                    border: '1px solid #3a3020',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#7a5f20]">{item.charges}/{item.maxCharges}</span>
          </div>
        )}

        {/* Lore/description */}
        {item.description && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'rgba(58,48,32,0.5)' }}>
            <div
              className="text-[11px] text-[#9a8860] italic leading-relaxed"
              style={{ fontFamily: '"IM Fell English", serif' }}
            >
              &ldquo;{item.description}&rdquo;
            </div>
          </div>
        )}

        {/* Value */}
        {item.value && (
          <div className="mt-2 text-[10px] text-[#7a5f20] flex items-center gap-1">
            <span>🪙</span> {item.value} gold
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EquipmentTooltipProvider({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    item: null,
    position: { x: 0, y: 0 },
    visible: false,
  })

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = useCallback((item: Item, rect: DOMRect) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setTooltip({
      item,
      position: { x: rect.left, y: rect.bottom },
      visible: true,
    })
  }, [])

  const hideTooltip = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }))
    }, 100)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <EquipmentTooltipContext.Provider value={{ tooltip, showTooltip, hideTooltip }}>
      {children}
      {/* Render tooltip card */}
      {tooltip.visible && tooltip.item && (
        <EquipmentTooltipCard item={tooltip.item} position={tooltip.position} />
      )}
    </EquipmentTooltipContext.Provider>
  )
}
