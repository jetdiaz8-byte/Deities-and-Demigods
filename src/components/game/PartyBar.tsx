'use client'

import React from 'react'
import CharacterCard from '@/components/game/CharacterCard'
import { getEntityPortrait } from '@/lib/gameHelpers'
import type { Entity } from '@/lib/gameTypes'

type PartyBarProps = {
  members: Entity[]
  activeId?: string | null
  isProcessing?: boolean
}

const toCardCharacter = (member: Entity) => ({
  id: member.id,
  name: member.name,
  category: member.category || (member.type === 'monster' ? 'monsters' : 'heroes'),
  title: member.title || member.epithet || 'Adventurer',
  pantheon: member.pantheon || 'Unknown',
  align: member.align || 'Neutral',
  hp: member.hp,
  AC: member.AC,
  MR: member.MR,
  abilities: member.abilities || [],
  personality: member.personality || '',
  divineRank: member.type === 'greater_god' ? 'Greater God' : member.type === 'lesser_god' ? 'Lesser God' : member.type === 'demigod' ? 'Demigod' : member.type === 'monster' ? 'Monster' : 'Hero',
})

export default function PartyBar({ members, activeId, isProcessing = false }: PartyBarProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const expandedMember = members.find(m => m.id === expandedId) || null

  if (!members.length) return null

  return (
    <div className="party-bar-wrap">
      {expandedMember && (
        <div className={`party-card-expand ${expandedMember ? 'open' : ''}`} onClick={() => setExpandedId(null)}>
          <div className="party-card-expand__panel" onClick={(e) => e.stopPropagation()}>
            <button className="party-card-expand__close" onClick={() => setExpandedId(null)}>X</button>
            <CharacterCard character={toCardCharacter(expandedMember) as any} />
          </div>
        </div>
      )}
      <div className="party-bar">
        {members.map(member => {
          const hpPct = Math.max(0, Math.min(100, Math.round(((member.hp || 0) / Math.max(1, member.maxHp || 1)) * 100)))
          const hpClass = hpPct >= 60 ? 'hp-high' : hpPct >= 30 ? 'hp-mid' : 'hp-low'
          const isActive = member.id === activeId
          return (
            <div
              key={member.id}
              className={`party-bar__member ${isActive ? 'active' : ''} ${member.dead ? 'dead' : ''} ${isProcessing && isActive ? 'processing' : ''}`}
              onClick={() => setExpandedId(prev => (prev === member.id ? null : member.id))}
              title={member.name}
            >
              <img src={getEntityPortrait(member)} alt={member.name} className="party-bar__portrait" loading="lazy" />
              <div className="party-bar__name">{member.name.split(' ')[0]}</div>
              <div className="party-bar__hp-bar">
                <div className={`party-bar__hp-fill ${hpClass}`} style={{ width: `${hpPct}%` }} />
              </div>
              <div className="party-bar__hp-text">{Math.max(0, member.hp || 0)}/{member.maxHp || '?'}</div>
            </div>
          )
        })}
      </div>
      {isProcessing && <div className="party-bar__loading-note">The gods are weaving your fate...</div>}
    </div>
  )
}
