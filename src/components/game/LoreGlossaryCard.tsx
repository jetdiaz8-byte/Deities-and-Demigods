'use client'

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import Image from 'next/image'
import type { LoreEntry } from '@/lib/gameTypes'
import type { Entity } from '@/lib/gameTypes'

// ═══════════════════════════════════════════════════════════════════════════
// LORE GLOSSARY CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface LoreGlossaryState {
  glossary: Map<string, LoreEntry>
  showCard: (entry: LoreEntry, rect: DOMRect) => void
  hideCard: () => void
}

const LoreGlossaryContext = createContext<LoreGlossaryState>({
  glossary: new Map(),
  showCard: () => {},
  hideCard: () => {},
})

export function useLoreGlossary() {
  return useContext(LoreGlossaryContext)
}

// Build glossary from game entities
function buildGlossary(pcs: Entity[], activeNPCs: Entity[], npcHistory: Entity[]): Map<string, LoreEntry> {
  const map = new Map<string, LoreEntry>()
  const allEntities = [...pcs, ...activeNPCs, ...npcHistory]
  for (const e of allEntities) {
    if (e.name && !map.has(e.name.toLowerCase())) {
      map.set(e.name.toLowerCase(), {
        name: e.name,
        title: e.title || e.epithet,
        pantheon: e.pantheon || 'Unknown',
        portrait: e.portrait,
        personality: e.personality,
        type: e.type,
      })
    }
  }
  return map
}

// ═══════════════════════════════════════════════════════════════════════════
// LORE GLOSSARY PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface LoreGlossaryProviderProps {
  pcs: Entity[]
  activeNPCs: Entity[]
  npcHistory: Entity[]
  children: React.ReactNode
}

export function LoreGlossaryProvider({ pcs, activeNPCs, npcHistory, children }: LoreGlossaryProviderProps) {
  const [glossary] = useState(() => buildGlossary(pcs, activeNPCs, npcHistory))
  const [cardProps, setCardProps] = useState<{ entry: LoreEntry; x: number; y: number } | null>(null)

  // Rebuild glossary when entities change
  const glossaryRef = useRef(glossary)
  useEffect(() => {
    const updated = buildGlossary(pcs, activeNPCs, npcHistory)
    glossaryRef.current = updated
  }, [pcs, activeNPCs, npcHistory])

  // Global click listener for codex-inline-link elements
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.codex-inline-link') as HTMLElement | null
      if (target) {
        e.preventDefault()
        e.stopPropagation()
        const name = target.textContent?.trim()
        if (name) {
          const entry = glossaryRef.current.get(name.toLowerCase())
          if (entry) {
            const rect = target.getBoundingClientRect()
            setCardProps({ entry, x: rect.left, y: rect.bottom + 4 })
          }
        }
      }
    }
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  // Dismiss on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (cardProps) {
        const target = e.target as HTMLElement
        if (!target.closest('.lore-glossary-card') && !target.closest('.codex-inline-link')) {
          setCardProps(null)
        }
      }
    }
    if (cardProps) {
      document.addEventListener('mousedown', handleOutside)
      return () => document.removeEventListener('mousedown', handleOutside)
    }
  }, [cardProps])

  const showCard = useCallback((entry: LoreEntry, rect: DOMRect) => {
    setCardProps({ entry, x: rect.left, y: rect.bottom + 4 })
  }, [])

  const hideCard = useCallback(() => {
    setCardProps(null)
  }, [])

  return (
    <LoreGlossaryContext.Provider value={{ glossary: glossaryRef.current, showCard, hideCard }}>
      {children}
      <LoreGlossaryCard cardProps={cardProps} onClose={() => setCardProps(null)} />
    </LoreGlossaryContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// LORE GLOSSARY CARD — Floating info card
// ═══════════════════════════════════════════════════════════════════════════

function LoreGlossaryCard({
  cardProps,
  onClose,
}: {
  cardProps: { entry: LoreEntry; x: number; y: number } | null
  onClose: () => void
}) {
  if (!cardProps) return null

  const { entry, x, y } = cardProps

  // Intelligent positioning — avoid going off-screen
  const cardWidth = 280
  const cardMaxHeight = 200
  const adjustedX = Math.min(x, window.innerWidth - cardWidth - 16)
  const adjustedY = y + cardMaxHeight > window.innerHeight
    ? Math.max(8, y - cardMaxHeight - 40)
    : Math.min(y, window.innerHeight - cardMaxHeight - 16)

  const typeColors: Record<string, string> = {
    hero: '#4a90c0',
    demigod: '#a050a0',
    greater_god: '#d4af37',
    lesser_god: '#c9a84c',
    monster: '#c04040',
  }
  const typeColor = typeColors[entry.type || ''] || '#a08060'

  return (
    <div
      className="lore-glossary-card fixed z-[100] animate-slide-in"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: cardWidth,
      }}
    >
      <div
        className="rounded-lg border overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1a1510 0%, #0d0a08 100%)',
          borderColor: `${typeColor}40`,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 border-b flex items-center gap-2"
          style={{
            background: `linear-gradient(90deg, ${typeColor}15, transparent)`,
            borderBottomColor: `${typeColor}20`,
          }}
        >
          {/* Portrait thumbnail */}
          <div
            className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border"
            style={{ borderColor: `${typeColor}40` }}
          >
            {entry.portrait ? (
              <Image
                src={entry.portrait}
                alt={entry.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0d0a08] text-lg">
                {entry.type === 'greater_god' ? '👑' : entry.type === 'monster' ? '👹' : entry.type === 'demigod' ? '✨' : '⚔️'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-bold truncate"
              style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}
            >
              {entry.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{
                  background: `${typeColor}20`,
                  color: typeColor,
                  border: `1px solid ${typeColor}30`,
                  fontFamily: 'Cinzel, serif',
                }}
              >
                {entry.type?.replace('_', ' ') || 'unknown'}
              </span>
              <span className="text-[9px] text-[#8a7040] truncate">{entry.pantheon}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-2">
          {entry.title && (
            <div className="text-[10px] text-[#c9a84c] italic mb-1">{entry.title}</div>
          )}
          {(entry.personality || entry.description) && (
            <div className="text-[11px] text-[#a09080] leading-relaxed line-clamp-2" style={{ fontFamily: 'IM Fell English, serif' }}>
              {entry.personality || entry.description}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
