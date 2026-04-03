'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BookOpen, ScrollText, Volume2, VolumeX, Menu, X, Clock,
  VolumeOff, Volume1, Swords, Trophy
} from 'lucide-react'
import { HealthBar, NarrativeSection, TokenCounter } from '@/components/game/GameComponents'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
import { ACTS } from '@/lib/gameTypes'
import { getEntityPortrait, getAntagonist } from '@/lib/gameHelpers'
import type { GameState } from '@/lib/gameTypes'

export interface GameHeaderProps {
  gameState: GameState
  isSpeaking: boolean
  ttsVoice: string
  setTtsVoice: (voice: string) => void
  speakNarrative: () => void
  stopSpeaking: () => void
  lastDMNarrative: string
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setSelectedPortrait: (portrait: CharacterPortrait | null) => void
  setPortraitModalOpen: (open: boolean) => void
  // Audio
  sfxEnabled: boolean
  volume: number
  sfxVolume: number
  toggleSfx: () => void
  setVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  // Achievements
  achievementCount: number
  achievementTotal: number
  onOpenAchievements: () => void
}

export function GameHeader({
  gameState,
  isSpeaking,
  ttsVoice,
  setTtsVoice,
  speakNarrative,
  stopSpeaking,
  lastDMNarrative,
  sidebarOpen,
  setSidebarOpen,
  setSelectedPortrait,
  setPortraitModalOpen,
  // Audio
  sfxEnabled,
  volume,
  sfxVolume,
  toggleSfx,
  setVolume,
  setSfxVolume,
  // Achievements
  achievementCount,
  achievementTotal,
  onOpenAchievements,
}: GameHeaderProps) {
  const [showAudioPanel, setShowAudioPanel] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#0a0806]/95 backdrop-blur-sm border-b-2 border-[#5a4018]">
      {/* Top Bar - Title, Voice Controls & Token Counter */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2015]">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-title text-lg md:text-2xl text-[#d4af37] tracking-wider" style={{ fontFamily: '"Cinzel Decorative", serif' }}>
              DEITIES & DEMIGODS
            </h1>
            <a 
              href="/rulebook" 
              className="hidden sm:flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-[#1a2a20] to-[#0d1510] border border-[#2a5038] rounded hover:border-[#40c080] hover:text-[#60e0a0] text-[#40a070] transition-all"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <BookOpen className="w-3 h-3" />
              Guide
            </a>
            <a 
              href="/codex" 
              className="hidden sm:flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-[#2a2010] to-[#1a1510] border border-[#5a4018] rounded hover:border-[#d4af37] hover:text-[#f0c860] text-[#c9a84c] transition-all"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <ScrollText className="w-3 h-3" />
              Codex
            </a>
          </div>
          <p className="text-[10px] md:text-xs text-[#8a7040] tracking-widest uppercase">
            Turn {gameState.turn} · {gameState.act === 'act1' ? 'Act I' : gameState.act === 'act2' ? 'Act II' : 'Final Boss'}
          </p>
        </div>

        {/* Audio Toggle Buttons */}
        <div className="flex items-center gap-1.5">
          {/* SFX Toggle */}
          <button
            onClick={toggleSfx}
            className="relative p-1.5 rounded transition-all"
            title={sfxEnabled ? 'Disable SFX' : 'Enable SFX'}
          >
            <Swords
              className={`w-4 h-4 transition-colors ${
                sfxEnabled ? 'text-[#d4af37]' : 'text-gray-500'
              }`}
            />
            {!sfxEnabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-[2px] bg-gray-600 rotate-45 rounded-full" />
              </div>
            )}
          </button>

          {/* Volume Slider Panel - Desktop only */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setShowAudioPanel(!showAudioPanel)}
              className="p-1.5 rounded text-[#d4af37] hover:bg-[#3a3020] transition-all"
              title="Volume Settings"
            >
              {volume === 0 ? (
                <VolumeOff className="w-4 h-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Expandable Volume Panel */}
            {showAudioPanel && (
              <div className="absolute top-full mt-1 right-32 z-[60] p-3 bg-[#1a1510] border border-[#3a3020] rounded-lg shadow-xl shadow-black/60 min-w-[180px]">
                <div className="space-y-2.5">
                  {/* Master Volume */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#8a7040] font-title">Master</span>
                      <span className="text-[10px] text-[#c9a84c]">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2a2015] accent-[#d4af37]"
                    />
                  </div>

                  {/* SFX Volume */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#8a7040] font-title">SFX</span>
                      <span className="text-[10px] text-[#c9a84c]">{Math.round(sfxVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={sfxVolume}
                      onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2a2015] accent-[#d4af37]"
                    />
                  </div>


                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Voice Narration Controls - Prominent */}
        <div className="flex items-center gap-2 px-3 py-1 bg-[#1a1510] border border-[#3a3020] rounded-lg">
          {isSpeaking ? (
            <Button
              onClick={stopSpeaking}
              size="sm"
              className="bg-red-900/70 hover:bg-red-800/70 text-red-200 border border-red-600/50 gap-1"
            >
              <VolumeX className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <Button
              onClick={speakNarrative}
              disabled={!lastDMNarrative || gameState.isProcessing}
              size="sm"
              className={`gap-1 ${lastDMNarrative && !gameState.isProcessing 
                ? 'bg-gradient-to-r from-[#2a4050] to-[#1a2d3d] hover:from-[#3a5060] hover:to-[#2a4050] text-[#7ac0e0] border border-[#3a6a8a]' 
                : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Speak</span>
            </Button>
          )}
          <Select value={ttsVoice} onValueChange={setTtsVoice}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-[#0d0a08] border-[#3a3020] text-[#c9a84c]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1510] border-[#3a3020]">
              <SelectItem value="guy" className="text-xs text-[#c9a84c]">🧙 DM (Guy)</SelectItem>
              <SelectItem value="christopher" className="text-xs text-[#c9a84c]">📜 Christopher</SelectItem>
              <SelectItem value="brian" className="text-xs text-[#c9a84c]">🗡️ Brian</SelectItem>
              <SelectItem value="ryan" className="text-xs text-[#c9a84c]">👑 Ryan (British)</SelectItem>
              <SelectItem value="aria" className="text-xs text-[#c9a84c]">✨ Aria</SelectItem>
              <SelectItem value="jenny" className="text-xs text-[#c9a84c]">🌟 Jenny</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TokenCounter geminiTokens={gameState.geminiTokensUsed} />

        {/* Achievements Trophy Button */}
        <button
          onClick={onOpenAchievements}
          className="relative p-2 text-[#d4af37] hover:bg-[#1a1510] border border-[#3a3020] rounded-lg transition-all hover:border-[#d4af37]/60"
          title={`Achievements: ${achievementCount}/${achievementTotal}`}
        >
          <Trophy className="w-4 h-4" />
          {achievementCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-[#0a0806] bg-[#d4af37] rounded-full">
              {achievementCount}
            </span>
          )}
        </button>

        {/* Mobile Audio Buttons */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleSfx}
            className="relative p-1.5 rounded transition-all"
            title={sfxEnabled ? 'Disable SFX' : 'Enable SFX'}
          >
            <Swords
              className={`w-4 h-4 transition-colors ${
                sfxEnabled ? 'text-[#d4af37]' : 'text-gray-500'
              }`}
            />
            {!sfxEnabled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-[2px] bg-gray-600 rotate-45 rounded-full" />
              </div>
            )}
          </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden ml-2 p-2 text-[#d4af37] hover:bg-[#3a3020] rounded"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Party Bar - Sticky */}
      <div className="flex gap-1 p-2 overflow-x-auto bg-[#0d0a08]">
        {gameState.pcs.map(pc => {
          const isActive = pc.id === gameState.humanPCId
          const injuries = gameState.injuries[pc.id] || []
          return (
            <div
              key={pc.id}
              onClick={() => {
                setSelectedPortrait(pc as CharacterPortrait)
                setPortraitModalOpen(true)
              }}
              className={`
                flex-shrink-0 w-20 md:w-28 p-1.5 md:p-2 rounded text-xs cursor-pointer
                hover:ring-2 hover:ring-[#d4af37]/50 transition-all
                ${pc.dead ? 'opacity-30' : ''} 
                ${isActive ? 'border-2 border-[#d4af37] pulse-glow' : 'border border-[#3a3020]'}
              `}
              style={{ 
                background: 'linear-gradient(145deg, #1a1814 0%, #12100e 100%)', 
                borderTop: `3px solid ${pc.type === 'hero' ? '#4a90c0' : '#a050a0'}` 
              }}
            >
              {/* Full Portrait - 768x1344 aspect ratio */}
              <div className="relative w-full rounded overflow-hidden bg-[#0d0a08] border border-[#3a3020] mb-1" style={{ aspectRatio: '768/1344' }}>
                <Image
                  src={getEntityPortrait(pc)}
                  alt={pc.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="font-bold text-[#d4af37] truncate font-name text-[10px] md:text-xs text-center">
                {pc.name.replace(/\s*\([^)]*\)/g, '').split(/\s+/).slice(-1)[0]}
              </div>
              <HealthBar current={pc.hp} max={pc.maxHp} size="sm" showLabel={false} />
              <div className="text-[9px] text-center text-gray-400 mt-0.5">
                {Math.max(0, pc.hp)}/{pc.maxHp}
              </div>
              {isActive && !pc.dead && (
                <div className="text-[8px] text-center text-[#d4af37] uppercase mt-0.5">You</div>
              )}
              {injuries.length > 0 && (
                <div className="text-[8px] text-center">{injuries.map(i => i.icon).join('')}</div>
              )}
            </div>
          )
        })}

        {/* Antagonist Card */}
        {gameState.act !== ACTS.ONE && gameState.antagonistId && (() => {
          const antagonist = getAntagonist(gameState.antagonistId)
          return (
          <div
            onClick={() => {
              if (antagonist) {
                setSelectedPortrait(antagonist as CharacterPortrait)
                setPortraitModalOpen(true)
              }
            }}
            className="flex-shrink-0 w-20 md:w-28 p-1.5 md:p-2 rounded text-xs border border-red-900/50 cursor-pointer hover:ring-2 hover:ring-red-500/50 transition-all"
            style={{ background: 'linear-gradient(145deg, #1a1010 0%, #120808 100%)', borderTop: '3px solid #8b0000' }}
          >
            {/* Full Portrait - 768x1344 aspect ratio */}
            <div className="relative w-full rounded overflow-hidden bg-[#0d0a08] border border-red-900/50 mb-1" style={{ aspectRatio: '768/1344' }}>
              {antagonist && (
                <Image
                  src={getEntityPortrait(antagonist)}
                  alt={antagonist.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
            <div className="font-bold text-[#c04040] truncate font-name text-[10px] md:text-xs text-center">
              {gameState.act === ACTS.THREE ? antagonist?.name : '???'}
            </div>
            <HealthBar current={gameState.antagonistHp} max={gameState.antagonistMaxHp} size="sm" showLabel={false} />
            <div className="text-[9px] text-center text-gray-400 mt-0.5">
              {gameState.antagonistHp}/{gameState.antagonistMaxHp}
            </div>
            <div className="text-[8px] text-center text-red-400 uppercase mt-0.5">
              Phase {gameState.antagonistPhase}/3
            </div>
          </div>
        )})()}
      </div>
      
      {/* Story Summary - Moved to narrative panel to avoid sidebar overlap */}
      {gameState.storySummary && (
        <div className="border-t border-[#2e2008] bg-[#0d0a08] md:hidden">
          <NarrativeSection 
            title="The Story So Far" 
            content={gameState.storySummary} 
            icon={<BookOpen className="w-4 h-4 text-[#d4af37]" />}
            variant="gold"
            defaultOpen={false}
          />
        </div>
      )}
      
      {/* Journey So Far - TLDR Summary */}
      {gameState.journeySoFar && (
        <div className="border-t border-[#2e2008] bg-gradient-to-r from-[#0d0a08] to-[#100a05]">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-[#d4af37]" />
              <span className="text-xs font-title text-[#d4af37] uppercase tracking-wider">Our Journey So Far</span>
            </div>
            <p className="text-xs text-[#a08060] italic font-narrative leading-relaxed">
              {gameState.journeySoFar}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}

