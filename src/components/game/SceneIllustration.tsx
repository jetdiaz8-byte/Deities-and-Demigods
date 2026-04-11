'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'

interface SceneIllustrationProps {
  narration: string
  act: string
  turn: number
  gameState: {
    activeNPCs: { id: string; conditions: string[]; encounter_type?: string }[]
    antagonistHp: number
    antagonistMaxHp: number
  }
}

function detectSceneName(narration: string, act: string): string {
  const lower = narration.toLowerCase()
  if (lower.includes('tavern') || lower.includes('inn')) return 'The Tavern'
  if (lower.includes('forest') || lower.includes('woods')) return 'The Ancient Forest'
  if (lower.includes('temple') || lower.includes('shrine') || lower.includes('sanctum')) return 'The Sacred Temple'
  if (lower.includes('ocean') || lower.includes('sea') || lower.includes('ship')) return 'The Endless Sea'
  if (lower.includes('battle') || lower.includes('fight') || lower.includes('combat')) return 'The Battlefield'
  if (lower.includes('cave') || lower.includes('dungeon') || lower.includes('depths')) return 'The Depths Below'
  if (lower.includes('mountain') || lower.includes('peak')) return 'The Mountain Pass'
  if (lower.includes('city') || lower.includes('town') || lower.includes('village')) return 'The Village'
  if (lower.includes('castle') || lower.includes('fortress') || lower.includes('keep')) return 'The Fortress'
  if (lower.includes('bridge') || lower.includes('crossing')) return 'The Bridge'
  if (act === 'act3') return 'The Final Stand'
  if (act === 'act2') return 'The Journey Continues'
  return 'The Road Ahead'
}

export function SceneIllustration({ narration, act, turn, gameState }: SceneIllustrationProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [visible, setVisible] = useState(false)
  const cacheRef = useRef<Map<number, string>>(new Map())
  const [prevAct, setPrevAct] = useState<string | null>(null)
  const failedTurnsRef = useRef<Set<number>>(new Set()) // Track failed turns (allow retry next turn)
  const fetchInProgressRef = useRef(false) // Prevent concurrent fetches

  const isKey = useMemo(() => {
    if (!narration) return false
    // Opening and first exploration
    if (turn === 0 || turn === 1) return true
    // Every 3rd turn (changed from 5 to generate more often)
    if (turn > 1 && turn % 3 === 0) return true
    // Act transition
    if (prevAct && prevAct !== act) return true
    // Boss encounter
    const hasBoss = gameState.activeNPCs.some(
      npc => npc.conditions.some(c => c.toLowerCase().includes('boss'))
    )
    if (hasBoss && turn > 0) return true
    return false
  }, [turn, act, narration, gameState, prevAct])

  const sceneName = useMemo(() => {
    return detectSceneName(narration, act)
  }, [narration, act])

  // Track act changes
  useEffect(() => {
    setPrevAct(act)
  }, [act])

  // Generate image for key moments
  useEffect(() => {
    if (!isKey) return
    // Skip turns that have already failed (but allow new turns to try)
    if (failedTurnsRef.current.has(turn)) return
    // Prevent concurrent fetches (e.g. React Strict Mode double-fire)
    if (fetchInProgressRef.current) return

    // Check cache
    const cached = cacheRef.current.get(turn)
    if (cached) {
      setImageUrl(cached)
      setLoading(false)
      setError(false)
      setVisible(true)
      return
    }

    // Build a SHORT prompt — pollinations.ai 500s on long URLs or nologo param
    const prompt = `${sceneName}, dark fantasy, oil painting, atmospheric`

    let cancelled = false
    fetchInProgressRef.current = true
    setLoading(true)
    setError(false)
    setVisible(false)

    const encodedPrompt = encodeURIComponent(prompt)
    const seed = turn * 137 + sceneName.length * 31
    // IMPORTANT: Do NOT use nologo=true — it causes 500 errors on pollinations.ai
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=512&seed=${seed}`

    // Retry logic — pollinations.ai rate-limits aggressively
    let retries = 0
    const maxRetries = 2
    const tryLoad = () => {
      if (cancelled) return
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (cancelled) return
        // Verify it's actually an image (not a JSON error response)
        cacheRef.current.set(turn, url)
        setImageUrl(url)
        setLoading(false)
        setTimeout(() => setVisible(true), 100)
      }
      img.onerror = () => {
        if (cancelled) return
        retries += 1
        if (retries < maxRetries) {
 // Retry with different seed after 3s delay
          window.setTimeout(() => {
            if (!cancelled) {
              const retryUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed + retries * 1000}`
              img.src = retryUrl
            }
          }, 3000)
        } else {
          failedTurnsRef.current.add(turn)
          setLoading(false)
          setError(true)
        }
      }
      img.src = url
    }
    tryLoad()

    return () => { cancelled = true; fetchInProgressRef.current = false }
  }, [isKey, turn, sceneName])

  // Don't render anything if not a key moment
  if (!isKey && !imageUrl) return null
  if (isKey && !imageUrl && !loading && !error) return null

  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{
      border: '2px solid #3a3020',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)',
      background: 'linear-gradient(135deg, #1a1510, #0d0a08)',
    }}>
      {/* Fantasy frame corners */}
      <div className="relative">
        {/* Corner ornaments */}
        <span className="absolute top-0 left-0 text-[#5a4018] text-lg leading-none" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute top-0 right-0 text-[#5a4018] text-lg leading-none rotate-90" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute bottom-0 left-0 text-[#5a4018] text-lg leading-none -rotate-90" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute bottom-0 right-0 text-[#5a4018] text-lg leading-none rotate-180" style={{ fontFamily: 'serif' }}>❧</span>

        {/* Image area */}
        <div>
          {loading && !error && (
            <div className="flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <div className="text-center">
                <div className="text-2xl mb-2 animate-pulse">🎨</div>
                <div className="text-xs text-[#8a7040] font-title uppercase tracking-wider">
                  Painting the scene...
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <div className="text-center">
                <div className="text-2xl mb-2 opacity-50">🖼️</div>
                <div className="text-xs text-[#5a4030] font-title uppercase tracking-wider">
                  Scene vision lost to the mists
                </div>
              </div>
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt={sceneName}
              className={`w-full object-cover transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ aspectRatio: '16/9' }}
              loading="eager"
            />
          )}

          {/* Bottom gradient overlay */}
          <div
            className="relative -mt-16 h-16 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to top, #0d0a08, transparent)',
            }}
          />
        </div>

        {/* Caption */}
        <div className="px-3 py-2 border-t border-[#2a2010]" style={{ background: 'linear-gradient(90deg, #1a1510, #0d0a08)' }}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}
            >
              {sceneName}
            </span>
            <span className="text-[10px] text-[#5a4030] font-title">
              Turn {turn}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
