'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ALL_CHARACTERS, getPortraitPath } from '@/lib/characterData'
import type { Character } from '@/lib/characterTypes'
import { CharacterDetailModal } from './CharacterDetailModal'

// ═══════════════════════════════════════════════════════════════════════════
// ALIGNMENT BORDER COLORS (from CharacterCard)
// ═══════════════════════════════════════════════════════════════════════════

const ALIGNMENT_BORDER: Record<string, string> = {
  'chaotic evil': '#8B0000',
  'lawful good': '#4169E1',
  'neutral evil': '#6B008B',
  'chaotic good': '#228B22',
  neutral: '#808080',
  'lawful evil': '#4B0082',
  'chaotic neutral': '#DAA520',
  'lawful neutral': '#4682B4',
  'neutral good': '#2E8B57',
}

const getBorderColor = (alignment?: string) => {
  if (!alignment) return '#808080'
  return ALIGNMENT_BORDER[alignment.toLowerCase()] || '#808080'
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'turn-card-showcase-hidden'
const AUTO_ADVANCE_MS = 5000

// ═══════════════════════════════════════════════════════════════════════════
// TURNCARDSHOWCASE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface TurnCardShowcaseProps {
  turn: number
  gameState?: {
    activeNPCs?: { id: string; conditions: string[]; name?: string }[]
    antagonistHp?: number
    antagonistMaxHp?: number
  } | null
}

export function TurnCardShowcase({ turn, gameState }: TurnCardShowcaseProps) {
  // ── Hide state (persisted to localStorage) ────────────────────────────
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })

  const toggleHidden = useCallback(() => {
    setHidden(prev => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* noop */ }
      return next
    })
  }, [])

  // ── Carousel state ───────────────────────────────────────────────────
  const [cardQueue, setCardQueue] = useState<Character[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [fading, setFading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // ── Character pool ───────────────────────────────────────────────────
  const allCharacters = useMemo(() => {
    const validCategories = new Set(['greater-gods', 'demigods', 'heroes', 'krynn', 'lesser-gods', 'monsters'])
    const dedupe = new Set<string>()
    return ALL_CHARACTERS.filter(c => validCategories.has(c.category)).filter(c => {
      const key = `${c.category}:${c.id}`
      if (dedupe.has(key)) return false
      dedupe.add(key)
      return true
    })
  }, [])

  // ── Per-pantheon round-robin ────────────────────────────────────────
  // Groups characters by pantheon and queues them so every pantheon gets
  // exposure. Re-shuffles each pantheon when a full round completes.
  const pantheonGroups = useMemo(() => {
    const groups: Record<string, Character[]> = {}
    for (const c of allCharacters) {
      const pan = c.pantheon || 'Unknown'
      if (!groups[pan]) groups[pan] = []
      groups[pan].push(c)
    }
    // Sort pantheons by size descending, then alphabetical
    return Object.entries(groups).sort((a, b) => {
      if (b[1].length !== a[1].length) return b[1].length - a[1].length
      return a[0].localeCompare(b[0])
    })
  }, [allCharacters])

  const buildPantheonQueue = useCallback((): Character[] => {
    const queue: Character[] = []
    for (const [_, members] of pantheonGroups) {
      const shuffled = [...members]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      queue.push(...shuffled)
    }
    return queue
  }, [pantheonGroups])

  // ── Init queue ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!allCharacters.length) return
    const t = window.setTimeout(() => {
      setCardQueue(buildPantheonQueue())
      setActiveIndex(0)
    }, 0)
    return () => window.clearTimeout(t)
  }, [allCharacters, buildPantheonQueue])

  // ── Advance logic ────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      setActiveIndex(prev => {
        const next = prev + 1
        if (next < cardQueue.length) return next
        // Full round complete — reshuffle all pantheons
        setCardQueue(buildPantheonQueue())
        return 0
      })
      setFading(false)
    }, 400)
  }, [cardQueue.length, allCharacters, buildPantheonQueue])

  // ── Auto-advance timer ───────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !cardQueue.length) return
    const timer = setInterval(() => {
      advance()
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [playing, cardQueue.length, advance])

  const goNext = useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % Math.max(1, cardQueue.length))
      setFading(false)
    }, 400)
  }, [cardQueue.length])

  const goPrev = useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      setActiveIndex(prev => (prev - 1 + cardQueue.length) % Math.max(1, cardQueue.length))
      setFading(false)
    }, 400)
  }, [cardQueue.length])

  // ── Boss auto-focus: pause on boss NPC and show their card ───────────
  const bossEntity = useMemo(() => {
    if (!gameState?.activeNPCs?.length) return null
    const boss = gameState.activeNPCs.find(npc =>
      npc.conditions.some((c: string) => c.toLowerCase().includes('boss'))
    )
    if (!boss) return null
    return allCharacters.find(c => c.id === boss.id || c.name?.toLowerCase() === boss.name?.toLowerCase()) || null
  }, [gameState, allCharacters])

  // When boss is active, override the active character
  const displayCharacter = bossEntity || cardQueue[activeIndex] || null
  const nextCharacter = cardQueue[(activeIndex + 1) % Math.max(1, cardQueue.length)] || null

  // ── Preload next portrait ────────────────────────────────────────────
  useEffect(() => {
    if (!nextCharacter || typeof window === 'undefined') return
    const preload = new Image()
    preload.src = getPortraitPath(nextCharacter)
  }, [nextCharacter?.id])

  // ── Derived display values ───────────────────────────────────────────
  const borderColor = displayCharacter ? getBorderColor(displayCharacter.align) : '#3a3020'
  const portrait = displayCharacter ? getPortraitPath(displayCharacter) : ''
  const charName = displayCharacter?.name || ''
  const charTitle = displayCharacter?.title || ''
  const charDivineRank = displayCharacter?.divineRank

  // ── Portrait error fallback ──────────────────────────────────────────

  // ═════════════════════════════════════════════════════════════════════
  // HIDDEN STATE — Floating restore button
  // ═════════════════════════════════════════════════════════════════════
  if (hidden) {
    return (
      <div className="my-3">
        <button
          onClick={toggleHidden}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase tracking-wider transition-all text-[#5a4d30] hover:text-[#d4af37] border border-[#2e2008] hover:border-[#3a3020]"
          style={{ fontFamily: 'var(--font-heading)' }}
          title="Show Card Showcase"
        >
          <span style={{ filter: 'grayscale(0.3)' }}>&#x1F5BC;&#xFE0F;</span> Gallery
        </button>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════
  // SHOWCASE — Portrait fills panel, controls overlaid, name below (full width)
  // ═════════════════════════════════════════════════════════════════════
  return (
    <>
      <div
        className="my-3 rounded-lg overflow-hidden relative group"
        style={{
          border: `2px solid ${borderColor}`,
          boxShadow: `0 0 20px rgba(0,0,0,0.5), 0 0 30px ${borderColor}22`,
          background: 'linear-gradient(135deg, #1a1510, #0d0a08)',
          transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
        }}
      >
        <div className="flex flex-col">
          {/* PORTRAIT: Fills available width, name/title overlaid on top, controls on bottom */}
          <div
            className="relative overflow-hidden flex items-center justify-center bg-[#0a0806]"
          >
            <PortraitImage key={portrait} portrait={portrait} charName={charName} fading={fading} />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
              boxShadow: 'inset 0 0 30px rgba(10,8,6,0.4)',
            }} />

            {/* NAME + TITLE — overlaid on top of portrait */}
            <div
              className="absolute top-0 left-0 right-0 px-3 pt-2 pb-3"
              style={{
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.4s',
                background: 'linear-gradient(to bottom, rgba(10,8,6,0.85), rgba(10,8,6,0.4), transparent)',
                pointerEvents: 'none',
              }}
            >
              <div
                className="text-sm font-bold tracking-wide leading-tight"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: '#f0c860',
                  textShadow: '0 0 10px rgba(212,175,55,0.3), 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {charName}
              </div>
              {(charTitle || charDivineRank) && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#7a5f20] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                    {charTitle || charDivineRank}
                  </span>
                  {displayCharacter?.pantheon && (
                    <Badge className="text-[8px] px-1 py-0 bg-[#1a1510] text-[#d4af37] border-[#3a3020] flex-shrink-0">{displayCharacter.pantheon}</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Controls overlaid on portrait — bottom-right, semi-transparent */}
            <div
              className="absolute bottom-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
              style={{
                opacity: fading ? 0 : undefined,
                transition: 'opacity 0.4s',
              }}
            >
              <button onClick={(e) => { e.stopPropagation(); goPrev() }} className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/90 hover:text-[#d4af37] bg-black/50 hover:bg-black/70 transition-all text-xs backdrop-blur-sm">&#8249;</button>
              <button onClick={(e) => { e.stopPropagation(); setPlaying(v => !v) }} className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/90 hover:text-[#d4af37] bg-black/50 hover:bg-black/70 transition-all text-[10px] backdrop-blur-sm">{playing ? '\u23F8' : '\u25B6'}</button>
              <button onClick={(e) => { e.stopPropagation(); goNext() }} className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/90 hover:text-[#d4af37] bg-black/50 hover:bg-black/70 transition-all text-xs backdrop-blur-sm">&#8250;</button>
              <button onClick={(e) => { e.stopPropagation(); setDetailOpen(true) }} className="ml-1 w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] bg-black/50 hover:bg-black/70 transition-all text-[9px] backdrop-blur-sm" title="Inspect">{'\uD83D\uDD0D'}</button>
              {bossEntity && <span className="ml-1 text-[7px] px-1 py-0.5 rounded bg-red-900/70 text-red-300 border border-red-700/40 backdrop-blur-sm" style={{ fontFamily: 'var(--font-heading)' }}>Boss</span>}
              <button onClick={(e) => { e.stopPropagation(); toggleHidden() }} className="ml-1 w-5 h-5 flex items-center justify-center rounded text-[#5a4d30]/80 hover:text-[#8a7040] bg-black/50 hover:bg-black/70 transition-all text-[10px] backdrop-blur-sm">{'\u2715'}</button>
            </div>
          </div>
        </div>

        {/* Alignment border glow accent (left edge) */}
        <div className="absolute top-0 left-0 w-1 h-full pointer-events-none" style={{
          background: `linear-gradient(to bottom, transparent, ${borderColor}88, transparent)`,
        }} />
      </div>

      {/* ── Character Detail Modal ─────────────────────────────────── */}
      <CharacterDetailModal
        character={detailOpen ? displayCharacter : null}
        onClose={() => setDetailOpen(false)}
        onNext={() => { goNext() }}
        onPrev={() => { goPrev() }}
        hasNext={cardQueue.length > 1}
        hasPrev={cardQueue.length > 1}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTRAIT IMAGE — Self-contained with error fallback, remounts on portrait change
// ═══════════════════════════════════════════════════════════════════════════

function PortraitImage({ portrait, charName, fading }: { portrait: string; charName: string; fading: boolean }) {
  const [imgError, setImgError] = useState(false)

  if (!portrait || imgError) {
    return (
      <div
        className="w-full h-full flex items-center justify-center text-6xl"
        style={{ background: 'linear-gradient(135deg, #1a1510, #0d0a08)', opacity: fading ? 0 : 1, transition: 'opacity 0.4s' }}
      >
        {charName ? charName.charAt(0) : '?'}
      </div>
    )
  }

  return (
    <img
      src={portrait}
      alt={charName}
      className="object-contain"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s', width: '100%', height: 'auto', maxHeight: '60vh' }}
      onError={() => setImgError(true)}
      loading="eager"
    />
  )
}
