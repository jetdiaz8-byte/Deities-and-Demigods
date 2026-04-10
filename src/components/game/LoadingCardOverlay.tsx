'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ALL_CHARACTERS } from '@/lib/characterData'
import type { Character } from '@/lib/characterTypes'
import CharacterCard from '@/components/game/CharacterCard'

type LoadingCardOverlayProps = {
  closing?: boolean
  onSkip: () => void
}

const VALID_CATEGORIES = new Set(['greater-gods', 'demigods', 'heroes', 'krynn', 'lesser-gods', 'monsters'])

const shuffleCharacters = (items: Character[]) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function LoadingCardOverlay({ closing = false, onSkip }: LoadingCardOverlayProps) {
  const allCharacters = useMemo(() => {
    const dedupe = new Set<string>()
    return ALL_CHARACTERS
      .filter(c => VALID_CATEGORIES.has(c.category))
      .filter(c => {
        const key = `${c.category}:${c.id}`
        if (dedupe.has(key)) return false
        dedupe.add(key)
        return true
      })
  }, [])

  const [queue, setQueue] = useState<Character[]>(() => shuffleCharacters(allCharacters))
  const [activeIndex, setActiveIndex] = useState(0)
  const [cardFading, setCardFading] = useState(false)
  const [cycleResetTick, setCycleResetTick] = useState(0)

  const advanceCard = useCallback(() => {
    setCardFading(true)
    window.setTimeout(() => {
      setActiveIndex(prev => {
        const next = prev + 1
        if (next < queue.length) return next
        setQueue(shuffleCharacters(allCharacters))
        return 0
      })
      setCardFading(false)
    }, 500)
  }, [queue.length, allCharacters])

  useEffect(() => {
    if (!queue.length) return
    const timer = window.setInterval(() => {
      advanceCard()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [queue.length, cycleResetTick, advanceCard])

  const activeCharacter = queue[activeIndex] || allCharacters[0] || null

  return (
    <div className={`loading-card-overlay ${closing ? 'closing' : ''}`}>
      <div className="loading-card-overlay__content">
        {activeCharacter && (
          <div className={cardFading ? 'card-fade-exit' : 'card-fade-enter'}>
            <CharacterCard character={activeCharacter} />
          </div>
        )}
        <button
          className="loading-card-overlay__next"
          onClick={() => {
            advanceCard()
            setCycleResetTick(v => v + 1)
          }}
        >
          Next ›
        </button>
        <div className="loading-card-overlay__text">
          The gods are weaving your fate...
          <span className="loading-card-overlay__dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
        </div>
      </div>
      <button className="loading-card-overlay__skip" onClick={onSkip}>Skip</button>
    </div>
  )
}
