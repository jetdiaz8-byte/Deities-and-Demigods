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
  return (
    <div>
      {sorted.map(npc => {
        const indicatorLeft = 50 + npc.affinity / 2
        return (
          <div key={npc.npcId}>
            <div className="npc-relation-card" onClick={() => { setOpenId(v => (v === npc.npcId ? null : npc.npcId)); onNPCClick?.(npc.npcId) }}>
              <div className="npc-relation-portrait">{npc.npcName.charAt(0)}</div>
              <div className="npc-relation-info">
                <div className={`npc-relation-name ${npc.affinity > 0 ? 'positive' : npc.affinity < 0 ? 'negative' : 'neutral'}`}>{npc.npcName}</div>
                <div className="npc-relation-bar">
                  <div className="npc-relation-indicator" style={{ left: `${Math.max(0, Math.min(100, indicatorLeft))}%` }} />
                </div>
                <span className={`npc-status-badge ${npc.status}`}>{npc.status}</span>
              </div>
            </div>
            {openId === npc.npcId && (
              <div className="npc-relation-history">
                {npc.history.slice(-5).map((h, idx) => (
                  <div key={idx} className="npc-relation-history-item"><span className="turn">T{h.turn}</span> {h.action} ({h.affinityChange >= 0 ? '+' : ''}{h.affinityChange})</div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

