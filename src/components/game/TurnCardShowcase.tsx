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

  // ── Shuffle helper ───────────────────────────────────────────────────
  const shuffle = useCallback((items: Character[]): Character[] => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }, [])

  // ── Init queue ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!allCharacters.length) return
    const t = window.setTimeout(() => {
      setCardQueue(shuffle(allCharacters))
      setActiveIndex(0)
    }, 0)
    return () => window.clearTimeout(t)
  }, [allCharacters, shuffle])

  // ── Advance logic ────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      setActiveIndex(prev => {
        const next = prev + 1
        if (next < cardQueue.length) return next
        setCardQueue(shuffle(allCharacters))
        return 0
      })
      setFading(false)
    }, 400)
  }, [cardQueue.length, allCharacters, shuffle])

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
  // SHOWCASE BANNER
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
        {/* ── Portrait area (16:9 cinematic frame) ──────────────────── */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setDetailOpen(true)}
        >
          {/* Portrait image — key forces remount on portrait change, resetting error state */}
          <PortraitImage key={portrait} portrait={portrait} charName={charName} fading={fading} />

          {/* Bottom gradient overlay for name readability */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.6) 40%, transparent 100%)',
            height: '55%',
          }} />

          {/* Top gradient overlay for controls readability */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, rgba(10,8,6,0.7) 0%, transparent 100%)',
            height: '40%',
          }} />

          {/* ── Controls overlay (top) ─────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 z-10 pointer-events-none">
            {/* Left: prev + play/pause */}
            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-sm"
                title="Previous"
              >
                &#9664;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPlaying(v => !v) }}
                className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-xs"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? '\u23F8' : '\u25B6'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="w-7 h-7 flex items-center justify-center rounded text-[#d4af37]/70 hover:text-[#d4af37] hover:bg-black/40 transition-all text-sm"
                title="Next"
              >
                &#9654;
              </button>
            </div>

            {/* Right: hide + boss indicator */}
            <div className="flex items-center gap-1 pointer-events-auto">
              {bossEntity && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-700/40" style={{ fontFamily: 'Cinzel, serif' }}>
                  Boss
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleHidden() }}
                className="w-7 h-7 flex items-center justify-center rounded text-[#5a4d30]/70 hover:text-[#8a7040] hover:bg-black/40 transition-all text-xs"
                title="Hide Gallery"
              >
                &#x2715;
              </button>
            </div>
          </div>

          {/* ── Name overlay (bottom) ──────────────────────────────── */}
          <div
            className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none"
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s' }}
          >
            <div className="flex items-end justify-between">
              <div>
                <div
                  className="text-lg font-bold tracking-wide"
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
                    className="text-[10px] tracking-wider mt-0.5"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      color: '#9a8860',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}
                  >
                    {[charDivineRank, charTitle].filter(Boolean).join(' / ')}
                  </div>
                )}
              </div>
              <div className="text-[9px] text-[#5a4d30] font-mono" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Turn {turn}
              </div>
            </div>
          </div>

          {/* Alignment border glow accent (left edge) */}
          <div className="absolute top-0 left-0 w-1 h-full pointer-events-none" style={{
            background: `linear-gradient(to bottom, transparent, ${borderColor}88, transparent)`,
          }} />

          {/* Tap hint (shows briefly on first render) */}
          <TurnTapHint />
        </div>

        {/* Caption bar */}
        <div
          className="px-3 py-1.5 border-t"
          style={{
            background: 'linear-gradient(90deg, #1a1510, #0d0a08)',
            borderColor: `${borderColor}44`,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}
            >
              {displayCharacter?.pantheon || 'Mythworld Pantheon'}
            </span>
            <span className="text-[9px] text-[#3a3020]">
              {allCharacters.length} portraits
            </span>
          </div>
        </div>
      </div>

      {/* ── Character Detail Modal ─────────────────────────────────── */}
      <CharacterDetailModal
        character={displayCharacter}
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
      className="w-full h-full object-contain"
      style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.4s' }}
      onError={() => setImgError(true)}
      loading="eager"
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TAP HINT — Fades in/out once on mount
// ═══════════════════════════════════════════════════════════════════════════

function TurnTapHint() {
  const [visible, setVisible] = useState(true)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Show after a short delay
    const showTimer = window.setTimeout(() => setOpacity(1), 1200)
    // Hide after 3 seconds
    const hideTimer = window.setTimeout(() => {
      setOpacity(0)
      window.setTimeout(() => setVisible(false), 600)
    }, 4200)
    return () => { window.clearTimeout(showTimer); window.clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      style={{ opacity, transition: 'opacity 0.6s ease' }}
    >
      <div
        className="px-3 py-1.5 rounded-full text-[10px] tracking-wider"
        style={{
          fontFamily: 'Cinzel, serif',
          color: '#d4af37',
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(212,175,55,0.3)',
          backdropFilter: 'blur(4px)',
        }}
      >
        Tap to inspect
      </div>
    </div>
  )
}
