'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sword, Users, Sparkles, SkipForward } from 'lucide-react'
import type { GameState, GameOption } from '@/lib/gameTypes'

export interface ChoicePanelProps {
  gameState: GameState
  selectOption: (index: number) => void
  confirmChoice: () => void
  setShardDialogOpen: (open: boolean) => void
}

export function ChoicePanel({
  gameState,
  selectOption,
  confirmChoice,
  setShardDialogOpen,
}: ChoicePanelProps) {
  if (!gameState.waitingForHuman || gameState.humanOptions.length === 0) return null

  return (
    <Card className="mt-4 border-2 border-[#c9a84c] bg-gradient-to-br from-[rgba(30,20,0,.5)] to-[rgba(10,0,20,.4)] shadow-[0_0_16px_rgba(200,160,60,.2)]">
      <CardHeader className="bg-gradient-to-r from-[rgba(80,55,0,.6)] to-[rgba(20,10,0,.4)] border-b border-[#7a5f20]">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '1.1rem', color: '#f0c860', letterSpacing: '.12em' }}>
            YOUR TURN
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#c9a84c' }}>
            {gameState.pcs.find(p => p.id === gameState.humanPCId)?.name}
          </span>
          {gameState.shardCharges > 0 && !gameState.shardDark && (
            <Badge
              className="ml-auto cursor-pointer hover:bg-[rgba(60,0,100,.6)]"
              style={{ background: 'rgba(60,0,100,.5)', color: gameState.shardEntry?.color || '#c080ff', border: `1px solid ${gameState.shardEntry?.color || '#888'}` }}
              onClick={() => setShardDialogOpen(true)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {gameState.shardEntry?.name?.split(' ').pop()} ({gameState.shardCharges})
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Section divider for PC Actions */}
        <div className="text-[#d4af37] text-xs uppercase tracking-wider mb-2 font-title flex items-center gap-2">
          <Sword className="w-4 h-4" />
          <span>Your Actions</span>
          <span className="flex-1 h-px bg-[#3a3020]" />
        </div>
        
        {gameState.humanOptions.slice(0, 3).map((opt, idx) => (
          <div
            key={idx}
            onClick={() => selectOption(idx)}
            className={`flex gap-3 p-4 rounded cursor-pointer transition-all ${gameState.pendingHumanChoice === idx
                ? 'border-2 border-[#d4af37] bg-gradient-to-r from-[rgba(90,60,10,.5)] to-[rgba(60,40,10,.4)] shadow-[inset_0_0_12px_rgba(212,175,55,.2)]'
                : 'border border-[#4a4030] bg-gradient-to-b from-[#1a1610] to-[#12100c] hover:border-[#d4af37] hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              }`}
          >
            <div className="text-[#d4af37] font-bold font-title text-2xl">{opt.num}</div>
            <div className="flex-1">
              <div className="text-[#f0e0c0] font-narrative text-lg">{opt.action}</div>
              <div className="text-sm text-[#b08050] mt-1 font-narrative">
                [{opt.ability}]
                {opt.align_note && (
                  <Badge className="ml-2 text-xs bg-[rgba(212,175,55,.15)] text-[#c0a060] border border-[#5a4030]">
                    {opt.align_note}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Section divider for Companion Suggestions */}
        {gameState.humanOptions.length > 3 && gameState.humanOptions[3]?.source === 'companion' && (
          <div className="text-[#90a0c0] text-xs uppercase tracking-wider mt-4 mb-2 font-title flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{gameState.humanOptions[3].companion_name || 'Companion'} Suggests</span>
            <span className="flex-1 h-px bg-[#3a3020]" />
          </div>
        )}
        
        {gameState.humanOptions.slice(3, 5).map((opt, idx) => (
          <div
            key={idx + 3}
            onClick={() => selectOption(idx + 3)}
            className={`flex gap-3 p-4 rounded cursor-pointer transition-all ${gameState.pendingHumanChoice === idx + 3
                ? 'border-2 border-[#7090c0] bg-gradient-to-r from-[rgba(40,60,100,.5)] to-[rgba(30,40,70,.4)] shadow-[inset_0_0_12px_rgba(100,140,200,.2)]'
                : opt.source === 'companion'
                  ? 'border border-[#3a4050] bg-gradient-to-b from-[#15181e] to-[#0e1015] hover:border-[#7090c0] hover:shadow-[0_0_10px_rgba(100,140,200,0.15)]'
                  : 'border border-[#4a4030] bg-gradient-to-b from-[#1a1610] to-[#12100c] hover:border-[#d4af37] hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]'
              }`}
          >
            <div className={`font-bold font-title text-2xl ${opt.source === 'companion' ? 'text-[#7090c0]' : 'text-[#d4af37]'}`}>{opt.num}</div>
            <div className="flex-1">
              <div className="text-[#f0e0c0] font-narrative text-lg">{opt.action}</div>
              <div className="text-sm text-[#b08050] mt-1 font-narrative">
                [{opt.ability}]
                {opt.align_note && (
                  <Badge className={`ml-2 text-xs ${opt.source === 'companion' ? 'bg-[rgba(100,140,200,.15)] text-[#90a0c0] border border-[#3a4050]' : 'bg-[rgba(212,175,55,.15)] text-[#c0a060] border border-[#5a4030]'}`}>
                    {opt.align_note}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Skip Turn */}
        {gameState.humanOptions.length >= 6 && (
          <div
            onClick={() => selectOption(5)}
            className={`flex gap-3 p-3 rounded cursor-pointer transition-all border-dashed ${gameState.pendingHumanChoice === 5
                ? 'border-2 border-[#5a4d30] bg-gradient-to-r from-[rgba(50,40,20,.3)] to-[rgba(30,25,15,.2)]'
                : 'border border-[#3a3020] bg-[#0d0a08] hover:border-[#5a4d30]'
              }`}
          >
            <div className="text-[#5a4d30] font-bold font-title text-xl">{gameState.humanOptions[5].num}</div>
            <div className="flex-1">
              <div className="text-[#7a6a50] font-narrative">{gameState.humanOptions[5].action}</div>
            </div>
            <SkipForward className="w-5 h-5 text-[#5a4d30]" />
          </div>
        )}

        {/* Extra options (e.g. archrival summon at index 6) */}
        {gameState.humanOptions.length > 6 && gameState.humanOptions.slice(6).map((opt, idx) => {
          const actualIdx = idx + 6
          return (
            <div
              key={actualIdx}
              onClick={() => selectOption(actualIdx)}
              className={`flex gap-3 p-3 rounded cursor-pointer transition-all border-dashed ${gameState.pendingHumanChoice === actualIdx
                  ? 'border-2 border-[#c05050] bg-gradient-to-r from-[rgba(80,20,20,.3)] to-[rgba(50,15,15,.2)]'
                  : 'border border-[#3a2020] bg-[#0d0808] hover:border-[#c05050]'
                }`}
            >
              <div className="text-[#c05050] font-bold font-title text-xl">{opt.num}</div>
              <div className="flex-1">
                <div className="text-[#d09090] font-narrative">{opt.action}</div>
              </div>
              <Sparkles className="w-5 h-5 text-[#c05050]" />
            </div>
          )
        })}

        <div className="flex items-center gap-3 pt-3 border-t border-[#3a3020]">
          <Button
            onClick={confirmChoice}
            disabled={gameState.pendingHumanChoice === null}
            className="bg-gradient-to-b from-[#5a3a10] to-[#3a2510] hover:from-[#7a5020] hover:to-[#5a3a15] text-[#f0d878] border-2 border-[#8a6020] font-title tracking-wider px-6 text-lg py-5"
          >
            ⚔ Confirm Choice ⚔
          </Button>
          <span className="text-sm text-[#a08050] italic font-narrative">
            {gameState.pendingHumanChoice !== null ? `Option ${gameState.pendingHumanChoice + 1} selected` : 'Select an action above'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
