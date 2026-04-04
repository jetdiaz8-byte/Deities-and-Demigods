'use client'
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollText, Star, CheckCircle, Circle, Clock } from 'lucide-react'
import type { GameState } from '@/lib/gameTypes'

interface QuestJournalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: GameState
}

export function QuestJournalModal({ open, onOpenChange, gameState }: QuestJournalModalProps) {
  const mainQuests = gameState.quests.filter(q => q.type === 'main')
  const sideQuests = gameState.quests.filter(q => q.type === 'side')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-auto max-h-[80vh] overflow-hidden p-0 border-2 border-[#5a4a30]" 
        style={{ background: 'linear-gradient(135deg, #1e1a12, #2a2218)' }}>
        {/* Leather journal header */}
        <div className="relative p-4 border-b-2 border-[#3a2a10]" style={{
          background: 'linear-gradient(135deg, #2a1a0a, #1a1208)',
        }}>
          {/* Stitching effect */}
          <div className="absolute top-2 left-4 right-4 flex items-center gap-1 opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#8b6914]" />
            ))}
          </div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-[#d4af37]" style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)' }}>
              <ScrollText className="w-6 h-6" />
              Quest Journal
            </DialogTitle>
            <DialogDescription className="sr-only">View your active and completed quests</DialogDescription>
          </DialogHeader>
        </div>

        {/* Journal pages */}
        <div className="relative overflow-y-auto p-3 sm:p-6 space-y-6" style={{ 
          minHeight: '300px',
        }}>
          {/* Page vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
          }} />

          {/* Main Quests */}
          <div className="relative">
            <h3 className="text-lg font-title text-[#d4af37] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Main Quests
              <span className="flex-1 h-px bg-[#3a2a10]" />
            </h3>
            {mainQuests.length === 0 ? (
              <p className="text-[#a08060] italic font-narrative">No main quests active...</p>
            ) : (
              mainQuests.map(quest => (
                <div key={quest.id} className={`mb-4 p-4 rounded-lg border ${quest.status === 'completed' ? 'border-[#3a2a10] opacity-60' : 'border-2 border-[#d4af37]/50'}`}
                  style={{ background: 'rgba(26,21,16,0.8)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className={`w-4 h-4 ${quest.status === 'completed' ? 'text-[#5a4a30]' : 'text-[#d4af37]'}`} />
                    <span className="font-title text-base text-[#f0ebe3]">{quest.title}</span>
                    <Badge className={`ml-auto text-[10px] ${
                      quest.status === 'completed' ? 'bg-[#2a4a2a] text-[#60c060]' :
                      quest.status === 'active' ? 'bg-[#4a3a10] text-[#d4af37]' :
                      'bg-[#2a2a3a] text-[#9a9a9a]'
                    }`}>{quest.status}</Badge>
                  </div>
                  <p className="text-sm text-[#a08060] font-narrative mb-3">{quest.description}</p>
                  <div className="space-y-1.5">
                    {quest.objectives.map((obj, idx) => (
                      <div key={idx} className={`flex items-center gap-2 text-sm font-narrative ${obj.completed ? 'text-[#60c060]' : 'text-[#a08060]'}`}>
                        {obj.completed ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-[#5a4a30]" />}
                        {obj.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Side Quests */}
          {sideQuests.length > 0 && (
            <div className="relative border-t border-[#3a2a10] pt-4">
              <h3 className="text-lg font-title text-[#8b6914] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Side Quests
                <span className="flex-1 h-px bg-[#2a2010]" />
              </h3>
              {sideQuests.map(quest => (
                <div key={quest.id} className={`mb-3 p-3 rounded-lg border ${quest.status === 'completed' ? 'opacity-50' : ''}`}
                  style={{ background: 'rgba(26,21,16,0.6)', borderColor: '#3a2a10' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <ScrollText className="w-3.5 h-3.5 text-[#5a4018]" />
                    <span className="text-sm font-title text-[#c9a84c]">{quest.title}</span>
                  </div>
                  <p className="text-xs text-[#7a5f20] font-narrative">{quest.description}</p>
                  <div className="mt-2 space-y-1">
                    {quest.objectives.map((obj, idx) => (
                      <div key={idx} className={`flex items-center gap-1.5 text-xs ${obj.completed ? 'text-[#4a9060]' : 'text-[#5a4a30]'}`}>
                        {obj.completed ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {obj.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hidden Quests hint */}
          {gameState.quests.filter(q => q.type === 'hidden').length === 0 && gameState.turn > 5 && (
            <div className="relative border-t border-[#3a2a10] pt-4">
              <p className="text-xs text-[#5a4a30] italic font-narrative text-center">
                ✦ There may be hidden quests waiting to be discovered... ✦
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
