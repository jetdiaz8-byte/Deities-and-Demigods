'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
          style={{ fontFamily: 'Cinzel, serif' }}
          title="Show Card Showcase"
        >
          <span style={{ filter: 'grayscale(0.3)' }}>&#x1F5BC;&#xFE0F;</span> Gallery
        </button>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════
  // SHOWCASE BANNER — Split layout: left name panel, center portrait, right stats
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
        <div className="flex flex-row" style={{ minHeight: '288px' }}>
          {/* ── LEFT PANEL: Name + info (vertically centered) ──────── */}
          <div
            className="flex flex-col justify-center items-start py-2 pl-3 pr-2 shrink-0"
            style={{
              width: '28%',
              minWidth: '120px',
              maxWidth: '180px',
              opacity: fading ? 0 : 1,
              transition: 'opacity 0.4s',
            }}
          >
            <div
              className="text-lg font-bold tracking-wide leading-tight"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#f0c860',
                textShadow: '0 0 10px rgba(212,175,55,0.3), 0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {charName}
            </div>
            {(charTitle || charDivineRank) && (
              <div
                className="text-[11px] tracking-wider mt-0.5 leading-tight"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color: '#9a8860',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                {[charDivineRank, charTitle].filter(Boolean).join(' / ')}
              </div>
            )}
            {displayCharacter?.pantheon && (
              <div
                className="text-[9px] uppercase tracking-widest mt-1"
                style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}
              >
                {displayCharacter.pantheon}
              </div>
            )}
            {/* Mini stat pills */}
            {displayCharacter && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {displayCharacter.hp != null && <span className="text-[9px] px-1 py-0.5 rounded bg-[#1a1510] border border-[#2e2008] text-[#9a8860]">HP {displayCharacter.hp}</span>}
                {displayCharacter.AC != null && <span className="text-[9px] px-1 py-0.5 rounded bg-[#1a1510] border border-[#2e2008] text-[#9a8860]">AC {displayCharacter.AC}</span>}
                {displayCharacter.align && <span className="text-[9px] px-1 py-0.5 rounded bg-[#1a1510] border border-[#2e2008] text-[#9a8860]">{displayCharacter.align}</span>}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <button
                onClick={() => setDetailOpen(true)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider transition-all text-[#d4af37]/60 hover:text-[#d4af37] border border-[#d4af37]/20 hover:border-[#d4af37]/50 hover:bg-black/40"
                title="Inspect Character"
              >
                &#128269; Details
              </button>
            </div>
          </div>

          {/* ── CENTER: Portrait (~480x288 showcase size — wow factor) ─────── */}
          <div
            className="relative overflow-hidden flex-1 flex items-center justify-center"
            style={{ minHeight: '288px' }}
          >
            <PortraitImage key={portrait} portrait={portrait} charName={charName} fading={fading} />

            {/* Subtle vignette around portrait edges */}
            <div className="absolute inset-0 pointer-events-none" style={{
              boxShadow: 'inset 0 0 20px rgba(10,8,6,0.3)',
            }} />
          </div>

          {/* ── RIGHT PANEL: Controls + turn info ──────────────────── */}
          <div
            className="flex flex-col justify-between py-2 pl-2 pr-3 shrink-0"
            style={{
              width: '18%',
              minWidth: '80px',
              maxWidth: '140px',
            }}
          >
            {/* Top: Controls */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="w-6 h-6 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-xs"
                title="Previous"
              >
                &#9664;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPlaying(v => !v) }}
                className="w-6 h-6 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-[10px]"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? '\u23F8' : '\u25B6'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="w-6 h-6 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-xs"
                title="Next"
              >
                &#9654;
              </button>
            </div>

            {/* Middle: Boss indicator */}
            {bossEntity && (
              <span className="text-[8px] uppercase tracking-wider text-center px-1 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/40" style={{ fontFamily: 'Cinzel, serif' }}>
                Boss
              </span>
            )}

            {/* Bottom: Turn + hide */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[8px] text-[#5a4d30] font-mono">
                Turn {turn}
              </div>
              <span className="text-[7px] text-[#3a3020]">
                {allCharacters.length} portraits
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); toggleHidden() }}
                className="w-5 h-5 flex items-center justify-center rounded text-[#5a4d30]/70 hover:text-[#8a7040] hover:bg-black/40 transition-all text-[10px]"
                title="Hide Gallery"
              >
                &#x2715;
              </button>
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
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s', maxWidth: '480px', maxHeight: '288px', width: '100%', height: 'auto' }}
      onError={() => setImgError(true)}
      loading="eager"
    />
  )
}
