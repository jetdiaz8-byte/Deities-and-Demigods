'use client'
import React from 'react'
import { Swords, Skull, Crown } from 'lucide-react'
import type { GameState } from '@/lib/gameTypes'
import { getEntityPortrait } from '@/lib/gameHelpers'
import Image from 'next/image'

interface CombatTrackerProps {
  gameState: GameState
}

export function CombatTracker({ gameState }: CombatTrackerProps) {
  const enemies = gameState.activeNPCs.filter(n => !n.dead)
  if (enemies.length === 0) return null

  return (
    <div className="mb-4 p-3 rounded-lg border border-red-900/40" style={{
      background: 'linear-gradient(135deg, rgba(26,10,10,0.8), rgba(16,6,6,0.6))',
      backdropFilter: 'blur(4px)',
    }}>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-red-400 animate-pulse" />
        <span className="text-xs font-title text-red-400 uppercase tracking-wider">Combat Tracker</span>
        <span className="flex-1 h-px bg-red-900/30" />
        <span className="text-[10px] text-red-300/60 font-narrative">{enemies.length} enem{enemies.length === 1 ? 'y' : 'ies'}</span>
      </div>

      <div className="space-y-2">
        {/* Player party entries */}
        {gameState.pcs.filter(p => !p.dead).map(pc => {
          const isActive = pc.id === gameState.humanPCId
          const hpPct = Math.max(0, pc.hp) / pc.maxHp
          return (
            <div key={pc.id} className={`flex items-center gap-2 p-2 rounded-lg transition-all ${isActive ? 'bg-[rgba(212,175,55,.08)] border border-[#d4af37]/20' : 'bg-[rgba(0,0,0,.2)] border border-transparent'}`}>
              <div className="relative w-8 h-10 rounded overflow-hidden border border-[#3a3a4a]" style={{ aspectRatio: '3/4' }}>
                <Image src={getEntityPortrait(pc)} alt={pc.name} fill className="object-contain" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-name text-[#d4af37] truncate">{pc.name.split(' ').pop()}</span>
                  {isActive && <span className="text-[8px] text-[#d4af37] uppercase">You</span>}
                </div>
                <div className="mt-1 h-1.5 bg-[#1a1010] rounded-full overflow-hidden">
                  <div className="h-full rounded-full hp-bar-smooth transition-all" style={{
                    width: `${Math.round(hpPct * 100)}%`,
                    background: hpPct > 0.6 ? 'linear-gradient(90deg, #2d8a4e, #4ade80)' : hpPct > 0.3 ? 'linear-gradient(90deg, #a16207, #fbbf24)' : 'linear-gradient(90deg, #991b1b, #ef4444)',
                  }} />
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">{Math.max(0, pc.hp)}/{pc.maxHp} HP</div>
              </div>
            </div>
          )
        })}

        {/* Enemy entries */}
        {enemies.map(npc => {
          const hpPct = Math.max(0, npc.hp || 0) / (npc.maxHp || 1)
          const isBoss = (npc as Record<string, unknown>).encounter_type === 'BOSS'
          const isAntagonist = gameState.antagonistId === npc.id
          return (
            <div key={npc.id} className={`flex items-center gap-2 p-2 rounded-lg ${isAntagonist ? 'border border-red-800/40 bg-[rgba(100,0,0,.1)]' : 'bg-[rgba(0,0,0,.2)]'}`}>
              <div className="relative w-8 h-10 rounded overflow-hidden border border-red-900/30" style={{ aspectRatio: '3/4' }}>
                {isAntagonist && gameState.act === 'act3' ? (
                  <Image src={getEntityPortrait(npc)} alt={npc.name} fill className="object-contain" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a0808]">
                    <Skull className="w-4 h-4 text-red-900/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {isBoss && <Crown className="w-3 h-3 text-red-400" />}
                  <span className="text-xs font-name truncate" style={{ color: isAntagonist ? '#c04040' : '#cc5050' }}>{npc.name}</span>
                </div>
                <div className="mt-1 h-1.5 bg-[#1a1010] rounded-full overflow-hidden">
                  <div className="h-full rounded-full hp-bar-smooth" style={{
                    width: `${Math.round(hpPct * 100)}%`,
                    background: hpPct <= 0.2 ? 'linear-gradient(90deg, #991b1b, #ef4444)' : 'linear-gradient(90deg, #8b2635, #cc5050)',
                  }} />
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  {isAntagonist ? `${gameState.antagonistHp}/${gameState.antagonistMaxHp}` : `${Math.max(0, npc.hp || 0)}/${npc.maxHp || '?'}`}
                  {isBoss && ` · Phase ${isAntagonist ? gameState.antagonistPhase : '?'}/3`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
