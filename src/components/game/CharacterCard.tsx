'use client'

import React from 'react'
import type { Character } from '@/lib/characterTypes'
import { getPortraitPath } from '@/lib/characterData'

type CharacterCardProps = {
  character: Character
  compact?: boolean
}

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

const truncateLore = (text: string, max = 100) => {
  if (!text || !text.trim()) return 'No records exist of this being.'
  return text.length > max ? `${text.slice(0, max - 1)}...` : text
}

export function CharacterCard({ character, compact = false }: CharacterCardProps) {
  const [imageError, setImageError] = React.useState(false)
  const borderColor = getBorderColor(character.align)
  const portrait = getPortraitPath(character)
  const abilities = (character.abilities || []).slice(0, 3)
  const lore = truncateLore(character.personality || '')

  if (compact) {
    return (
      <div className="card-compact" style={{ borderColor }}>
        <div className="card-compact__portrait-wrap">
          {!imageError ? (
            <img
              src={portrait}
              alt={character.name}
              className="card-compact__portrait"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="card-compact__fallback">{(character.name || '?').charAt(0)}</div>
          )}
        </div>
        <div className="card-compact__name">{character.name}</div>
      </div>
    )
  }

  return (
    <article className="character-card" style={{ borderColor }}>
      <div className="character-card__portrait">
        {!imageError ? (
          <img
            src={portrait}
            alt={character.name}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="character-card__placeholder">{(character.name || '?').charAt(0)}</div>
        )}
      </div>

      <div className="character-card__body">
        <h3 className="character-card__name">{character.name}</h3>
        <p className="character-card__subtitle">
          {character.title || 'Unknown Title'} / {character.pantheon || 'Unknown Pantheon'}
        </p>

        <div className="character-card__stats">
          <span>Align: {character.align || 'Neutral'}</span>
          <span>HP: {character.hp ?? '?'}</span>
          <span>AC: {character.AC ?? '?'}</span>
          <span>MR: {character.MR ?? '?'}</span>
        </div>

        <ul className="character-card__abilities">
          {(abilities.length ? abilities : ['Unknown']).map((ability, i) => (
            <li key={`${character.id}-ability-${i}`}>{ability}</li>
          ))}
        </ul>

        <p className="character-card__lore">"{lore}"</p>
      </div>
    </article>
  )
}

export default CharacterCard
