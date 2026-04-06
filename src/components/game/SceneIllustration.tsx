'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Image from 'next/image'

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

// Detect if this is a key moment for illustration
function isKeyMoment(
  turn: number,
  act: string,
  prevActRef: React.MutableRefObject<string | null>,
  gameState: SceneIllustrationProps['gameState']
): boolean {
  // Every 5th turn
  if (turn > 0 && turn % 5 === 0) return true

  // Act transition
  if (prevActRef.current && prevActRef.current !== act) return true

  // Boss encounter
  const hasBoss = gameState.activeNPCs.some(
    npc => npc.conditions.some(c => c.toLowerCase().includes('boss'))
  )
  if (hasBoss && turn > 0) return true

  return false
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
  const prevActRef = useRef<string | null>(null)
  const apiFailedRef = useRef(false) // Stop retrying after first API failure per session
  const fetchInProgressRef = useRef(false) // Prevent concurrent fetches

  const isKey = useMemo(() => {
    if (turn === 0 || !narration) return false
    return isKeyMoment(turn, act, prevActRef, gameState)
  }, [turn, act, narration, gameState])

  const sceneName = useMemo(() => {
    return detectSceneName(narration, act)
  }, [narration, act])

  // Track act changes
  useEffect(() => {
    prevActRef.current = act
  }, [act])

  // Generate image for key moments
  useEffect(() => {
    if (!isKey) return
    // Don't retry if the API has already failed this session
    if (apiFailedRef.current) return
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

    // Build prompt
    const prompt = `Dark fantasy RPG scene illustration: ${sceneName}. Neil Gaiman style, atmospheric, cinematic lighting, oil painting quality, moody, mythical, detailed, 16:9 aspect ratio. No text or letters. Fantasy art style reminiscent of Frank Frazetta and Yoshitaka Amano.`

    let cancelled = false
    fetchInProgressRef.current = true
    setLoading(true)
    setError(false)
    setVisible(false)

    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size: '1344x768' }),
    })
      .then(res => {
        // If image gen is disabled (503 with disabled flag), bail immediately
        if (res.status === 503 || !res.ok) {
          apiFailedRef.current = true
          setLoading(false)
          setError(true)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (cancelled || !data) return
        const url = `data:image/png;base64,${data.base64}`
        cacheRef.current.set(turn, url)
        setImageUrl(url)
        setLoading(false)
        // Fade in after image loads
        setTimeout(() => setVisible(true), 100)
      })
      .catch(() => {
        if (cancelled) return
        apiFailedRef.current = true // Mark API as failed for the rest of the session
        setLoading(false)
        setError(true)
      })
      .finally(() => {
        if (!cancelled) fetchInProgressRef.current = false
      })

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
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a1510 0%, #0d0a08 50%, #1a1510 100%)',
                }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2 animate-pulse">🎨</div>
                  <div className="text-xs text-[#8a7040] font-title uppercase tracking-wider">
                    Painting the scene...
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a1510 0%, #0d0a08 50%, #1a1510 100%)',
                }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2 opacity-50">🖼️</div>
                  <div className="text-xs text-[#5a4030] font-title uppercase tracking-wider">
                    Scene vision lost to the mists
                  </div>
                </div>
              </div>
            </div>
          )}

          {imageUrl && (
            <Image
              src={imageUrl}
              alt={sceneName}
              fill
              className={`object-cover transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
              unoptimized
            />
          )}

          {/* Bottom gradient overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
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
