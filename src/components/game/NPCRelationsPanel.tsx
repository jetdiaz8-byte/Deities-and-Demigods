'use client'

import React from 'react'

type NPCRelation = {
  npcId: string
  npcName: string
  affinity: number
  trust: number
  status: 'stranger' | 'acquaintance' | 'friend' | 'ally' | 'rival' | 'enemy' | 'nemesis'
  lastInteraction: number
  history: { turn: number; action: string; affinityChange: number; trustChange: number }[]
}

export default function NPCRelationsPanel({
  relations,
  onNPCClick,
}: {
  relations: NPCRelation[]
  onNPCClick?: (npcId: string) => void
}) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const sorted = [...relations].sort((a, b) => b.affinity - a.affinity)

  const handleToggle = React.useCallback((npc: NPCRelation) => {
    setOpenId(v => (v === npc.npcId ? null : npc.npcId))
    onNPCClick?.(npc.npcId)
  }, [onNPCClick])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent, npc: NPCRelation) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle(npc)
    }
  }, [handleToggle])

  return (
    <div role="list" aria-label="NPC Relations">
      {sorted.map(npc => {
        const indicatorLeft = 50 + npc.affinity / 2
        const isOpen = openId === npc.npcId
        const affinityLabel = npc.affinity > 0 ? 'positive' : npc.affinity < 0 ? 'negative' : 'neutral'

        return (
          <div key={npc.npcId} role="listitem">
            {/* S2-F3: Keyboard-accessible NPC relation card */}
            <div
              className="npc-relation-card"
              role="button"
              tabIndex={0}
              aria-label={`${npc.npcName}, ${npc.status}, affinity ${npc.affinity > 0 ? '+' : ''}${npc.affinity}`}
              aria-expanded={isOpen}
              onClick={() => handleToggle(npc)}
              onKeyDown={(e) => handleKeyDown(e, npc)}
              style={{ outline: 'none' }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-gold, #c9a84c)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="npc-relation-portrait" aria-hidden="true">{npc.npcName.charAt(0)}</div>
              <div className="npc-relation-info">
                <div className={`npc-relation-name ${affinityLabel}`}>{npc.npcName}</div>
                <div className="npc-relation-bar" aria-hidden="true">
                  <div className="npc-relation-indicator" style={{ left: `${Math.max(0, Math.min(100, indicatorLeft))}%` }} />
                </div>
                <span className={`npc-status-badge ${npc.status}`} aria-label={`Status: ${npc.status}`}>{npc.status}</span>
              </div>
            </div>
            {isOpen && (
              <div
                className="npc-relation-history"
                role="region"
                aria-label={`Interaction history for ${npc.npcName}`}
              >
                {npc.history.slice(-5).map((h, idx) => (
                  <div key={idx} className="npc-relation-history-item">
                    <span className="turn" aria-label={`Turn ${h.turn}`}>T{h.turn}</span>{' '}
                    {h.action} ({h.affinityChange >= 0 ? '+' : ''}{h.affinityChange})
                  </div>
                ))}
                {npc.history.length === 0 && (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>No interactions recorded.</div>
                )}
              </div>
            )}
          </div>
        )
      })}
      {sorted.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center', color: '#5a4d30', fontStyle: 'italic' }}>
          No NPC relations yet. Explore the world to meet new characters.
        </div>
      )}
    </div>
  )
}
