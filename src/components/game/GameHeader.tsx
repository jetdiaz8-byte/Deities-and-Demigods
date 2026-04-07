'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BookOpen, ScrollText, Volume2, VolumeX, Menu, X, Clock,
  Music, VolumeOff, Volume1, Swords, Trophy, Skull
} from 'lucide-react'
import { HealthBar, NarrativeSection, TokenCounter } from '@/components/game/GameComponents'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
import { ACTS } from '@/lib/gameTypes'
import { getEntityPortrait, getAntagonist } from '@/lib/gameHelpers'
import type { GameState } from '@/lib/gameTypes'

function getClassIcon(pc: any) {
  const abs = (pc.abilities || []).join(' ').toLowerCase()
  if (abs.includes('divine') || abs.includes('paladin') || abs.includes('smite')) return <span className="class-icon-paladin text-xs">⚔️</span>
  if (abs.includes('arcane') || abs.includes('wizard') || abs.includes('spell')) return <span className="class-icon-mage text-xs">🔮</span>
  if (abs.includes('heal') || abs.includes('cleric') || abs.includes('restore')) return <span className="class-icon-cleric text-xs">✝️</span>
  if (abs.includes('stealth') || abs.includes('rogue') || abs.includes('sneak')) return <span className="class-icon-rogue text-xs">🗡️</span>
  if (abs.includes('nature') || abs.includes('ranger') || abs.includes('bow')) return <span className="class-icon-ranger text-xs">🏹</span>
  return <span className="class-icon-warrior text-xs">⚔️</span>
}

function getPantheonFrame(pantheon: string): string {
  const p = (pantheon || '').toLowerCase()
  if (p.includes('greek') || p.includes('olympian') || p.includes('mount olympus')) return 'portrait-frame-greek'
  if (p.includes('norse') || p.includes('asgardian') || p.includes('aesir') || p.includes('vanir')) return 'portrait-frame-norse'
  if (p.includes('egyptian') || p.includes('pharaoh') || p.includes('heliopolitan')) return 'portrait-frame-egyptian'
  if (p.includes('celtic') || p.includes('fey') || p.includes('sidhe') || p.includes('tuatha')) return 'portrait-frame-celtic'
  if (p.includes('asian') || p.includes('chinese') || p.includes('japanese') || p.includes('celestial')) return 'portrait-frame-asian'
  return 'portrait-frame-default'
}

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
  ambientEnabled: boolean
  volume: number
  sfxVolume: number
  ambientVolume: number
  toggleSfx: () => void
  toggleAmbient: () => void
  setVolume: (v: number) => void
  setSfxVolume: (v: number) => void
  setAmbientVolume: (v: number) => void
  // Achievements
  achievementCount: number
  achievementTotal: number
  onOpenAchievements: () => void
  // Quest Journal
  onOpenQuestJournal?: () => void
  // Scene Music
  detectedSceneTheme?: string
  isAutoSceneMode?: boolean
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
  ambientEnabled,
  volume,
  sfxVolume,
  ambientVolume,
  toggleSfx,
  toggleAmbient,
  setVolume,
  setSfxVolume,
  setAmbientVolume,
  // Achievements
  achievementCount,
  achievementTotal,
  onOpenAchievements,
  onOpenQuestJournal,
  detectedSceneTheme,
  isAutoSceneMode,
}: GameHeaderProps) {
  const [showAudioPanel, setShowAudioPanel] = useState(false)
  const [showAmbientThemes, setShowAmbientThemes] = useState(false)
  const [ambientTheme, setAmbientTheme] = useState('dungeon')
  const [antagonistRevealPlayed, setAntagonistRevealPlayed] = useState(false)
  const [sceneNotification, setSceneNotification] = useState<string | null>(null)

  const themes = [
    { id: 'tavern', label: '🍺 Tavern', color: '#c9a84c' },
    { id: 'dungeon', label: '🏚️ Dungeon', color: '#8b6914' },
    { id: 'forest', label: '🌲 Forest', color: '#4a9060' },
    { id: 'battle', label: '⚔️ Battle', color: '#c04040' },
    { id: 'temple', label: '⛪ Temple', color: '#a080d0' },
    { id: 'ocean', label: '🌊 Ocean', color: '#4090c0' },
  ]

  // Show notification when auto-detected theme changes
  const prevAutoThemeRef = React.useRef(detectedSceneTheme)
  React.useEffect(() => {
    if (isAutoSceneMode && detectedSceneTheme && detectedSceneTheme !== prevAutoThemeRef.current && prevAutoThemeRef.current) {
      const themeLabel = themes.find(t => t.id === detectedSceneTheme)?.label || detectedSceneTheme
      setSceneNotification(`🎵 Scene: ${themeLabel}`)
      const timer = setTimeout(() => setSceneNotification(null), 3000)
      return () => clearTimeout(timer)
    }
    prevAutoThemeRef.current = detectedSceneTheme
  }, [detectedSceneTheme, isAutoSceneMode, themes])
  const currentTheme = themes.find(t => t.id === ambientTheme) || themes[1]
  const revealed = gameState.act === ACTS.THREE
  React.useEffect(() => {
    if (revealed && !antagonistRevealPlayed) {
      setAntagonistRevealPlayed(true)
    }
  }, [revealed, antagonistRevealPlayed])

  return (
    <header className="sticky top-0 z-50 bg-[#0a0806]/95 backdrop-blur-sm border-b-2 border-[#5a4018] medieval-banner relative safe-top">
      <div className="medieval-banner-texture" />
      <span className="dragon-corner-tl">🐉</span>
      <span className="dragon-corner-br">🐉</span>
      {/* Top Bar - Title, Voice Controls & Token Counter */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2015] overflow-x-auto scrollbar-hide">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
            <button
              onClick={() => onOpenQuestJournal?.()}
              className="hidden sm:flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-[#1a2010] to-[#101510] border border-[#3a5018] rounded hover:border-[#4a9060] hover:text-[#60e0a0] text-[#4a9060] transition-all"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <BookOpen className="w-3 h-3" />
              Journal
            </button>
          </div>
          <p className="text-[10px] md:text-xs text-[#8a7040] tracking-widest uppercase">
            Turn {gameState.turn} · {gameState.act === 'act1' ? 'Act I' : gameState.act === 'act2' ? 'Act II' : 'Final Boss'}
            <span className="ml-2">
              {(() => {
                const cycle = gameState.turn % 40
                if (cycle < 10) return '🌅'
                if (cycle < 20) return '☀️'
                if (cycle < 30) return '🌇'
                return '🌙'
              })()}
            </span>
          </p>
        </div>

        {/* Audio Toggle Buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* SFX Toggle - desktop only */}
          <button
            onClick={toggleSfx}
            className="relative p-1.5 rounded transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
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

          {/* Ambient Theme Selector */}
          <div className="relative">
            <button
              onClick={() => ambientEnabled ? setShowAmbientThemes(prev => !prev) : toggleAmbient()}
              className="p-2.5 md:p-1.5 rounded transition-all flex items-center gap-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
              title={ambientEnabled ? `Ambiance: ${currentTheme.label}` : 'Enable Ambient Music'}
            >
              {ambientEnabled ? (
                <>
                  <Music className="w-4 h-4" style={{ color: currentTheme.color }} />
                  <span className="hidden lg:inline text-[10px] font-title" style={{ color: currentTheme.color }}>{currentTheme.label.split(' ')[1]}</span>
                </>
              ) : (
                <VolumeOff className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showAmbientThemes && (
              <div className="absolute top-full mt-1 right-0 z-[60] p-2 bg-[#1a1510] border border-[#3a3020] rounded-lg shadow-xl shadow-black/60 min-w-[140px]">
                <div className="text-[10px] uppercase tracking-wider text-[#8a7040] font-title mb-1 px-2">Ambiance</div>
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setAmbientTheme(t.id); setShowAmbientThemes(false) }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${ambientTheme === t.id ? 'bg-[rgba(212,175,55,.1)] text-[#d4af37]' : 'text-[#a08060] hover:bg-[rgba(212,175,55,.05)] hover:text-[#c9a84c]'}`}
                  >
                    {t.label}
                  </button>
                ))}
                <div className="mt-1 pt-1 border-t border-[#2a2010]">
                  <button
                    onClick={() => { toggleAmbient(); setShowAmbientThemes(false) }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-[#804040] hover:bg-[rgba(180,60,40,.1)] transition-all"
                  >
                    <VolumeOff className="w-3 h-3 inline mr-1" /> Disable
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Volume Slider Panel - Desktop only */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setShowAudioPanel(!showAudioPanel)}
              className="p-2.5 md:p-1.5 rounded text-[#d4af37] hover:bg-[#3a3020] transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
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

                  {/* Music Volume */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#8a7040] font-title">Music</span>
                      <span className="text-[10px] text-[#c9a84c]">{Math.round(ambientVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2a2015] accent-[#d4af37]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Scene Theme Notification */}
        {sceneNotification && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[70] px-3 py-1.5 rounded-lg bg-[#1a1510] border border-[#d4af37]/40 shadow-lg animate-slide-in" style={{ animation: 'fadeIn 0.3s ease' }}>
            <span className="text-xs text-[#d4af37] font-title">{sceneNotification}</span>
          </div>
        )}

        {/* Voice Narration Controls - Prominent - hidden on mobile (narrator panel handles it) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#1a1510] border border-[#3a3020] rounded-lg min-w-0">
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
            <SelectTrigger className="w-[80px] md:w-[110px] h-8 text-xs bg-[#0d0a08] border-[#3a3020] text-[#c9a84c]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1510] border-[#3a3020]">
              <SelectItem value="guy" className="text-xs text-[#c9a84c]">🧙 DM (Guy)</SelectItem>
              <SelectItem value="christopher" className="text-xs text-[#c9a84c]">📜 Christopher</SelectItem>
              <SelectItem value="brian" className="text-xs text-[#c9a84c]">🗡️ Brian</SelectItem>
              <SelectItem value="ryan" className="text-xs text-[#c9a84c]">👑 Ryan (British)</SelectItem>
              <SelectItem value="aria" className="text-xs text-[#c9a84c]">✨ Aria</SelectItem>
              <SelectItem value="jenny" className="text-xs text-[#c9a84c]">🌟 Jenny</SelectItem>
              <SelectItem value="connor" className="text-xs text-[#c9a84c]">🍀 Connor (Irish)</SelectItem>
              <SelectItem value="thomas" className="text-xs text-[#c9a84c]">📖 Thomas (Storyteller)</SelectItem>
              <SelectItem value="davis" className="text-xs text-[#c9a84c]">🏛️ Davis (Sage)</SelectItem>
              <SelectItem value="jason" className="text-xs text-[#c9a84c]">🌑 Jason (Mysterious)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TokenCounter geminiTokens={gameState.geminiTokensUsed} />

        {/* Achievements Trophy Button */}
        <button
          onClick={onOpenAchievements}
          className="relative p-2 text-[#d4af37] hover:bg-[#1a1510] border border-[#3a3020] rounded-lg transition-all hover:border-[#d4af37]/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            className="relative p-2.5 rounded transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
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
          <button
            onClick={toggleAmbient}
            className="p-2.5 rounded transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={ambientEnabled ? `Disable: ${currentTheme.label}` : 'Enable Ambient Music'}
          >
            {ambientEnabled ? (
              <Music className="w-4 h-4" style={{ color: currentTheme.color }} />
            ) : (
              <VolumeOff className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden ml-2 p-2 text-[#d4af37] hover:bg-[#3a3020] rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Party Bar - Sticky */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide bg-[#0d0a08] md:pr-80">
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
              {/* Portrait thumbnail */}
              <div className={`portrait-frame ${getPantheonFrame(pc.pantheon || pc.category || '')}`}>
              <div className={`relative w-full rounded overflow-hidden bg-[#0d0a08] border border-[#3a3020] mb-1 ${isActive ? 'portrait-locket portrait-locket-active' : 'portrait-locket'}`} style={{ aspectRatio: '3/4' }}>
                <Image
                  src={getEntityPortrait(pc)}
                  alt={pc.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
                {/* Damage/Death overlay */}
                {pc.dead && (
                  <div className="absolute inset-0 bg-black/70 grayscale" />
                )}
                {!pc.dead && pc.hp > 0 && pc.hp < pc.maxHp * 0.3 && (
                  <div className="absolute inset-0 bg-red-900/30 animate-pulse pointer-events-none" />
                )}
                {!pc.dead && injuries.length > 0 && (
                  <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 pointer-events-none">
                    {injuries.slice(0, 3).map((inj, i) => (
                      <span key={i} className="text-[10px] leading-none drop-shadow-lg">{inj.icon}</span>
                    ))}
                  </div>
                )}
              </div>
              </div>
              <div className="font-bold text-[#d4af37] truncate font-name text-[10px] md:text-xs text-center">
                {getClassIcon(pc)}
                {pc.name.replace(/\s*\([^)]*\)/g, '').split(/\s+/).slice(-1)[0]}
              </div>
              <HealthBar current={pc.hp} max={pc.maxHp} size="sm" showLabel={false} />
              <div className="text-[9px] text-center text-gray-400 mt-0.5">
                {Math.max(0, pc.hp)}/{pc.maxHp}
              </div>
              {injuries.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {injuries.slice(0, 2).map((inj, i) => (
                    <div key={i} className="text-[9px] md:text-[10px] text-center truncate px-1 rounded" style={{ 
                      background: 'rgba(180,60,40,0.15)', 
                      color: '#cc8060',
                      border: '1px solid rgba(180,60,40,0.2)'
                    }}>
                      {inj.icon} {inj.name} ({inj.turnsLeft}t)
                    </div>
                  ))}
                  {injuries.length > 2 && (
                    <div className="text-[9px] text-center text-[#806050]">+{injuries.length - 2} more</div>
                  )}
                </div>
              )}
              {isActive && !pc.dead && (
                <div className="text-[10px] text-center text-[#d4af37] uppercase mt-0.5">You</div>
              )}
            </div>
          )
        })}

        {/* Antagonist Card — Identity hidden until Act III reveal */}
        {gameState.act !== ACTS.ONE && gameState.antagonistId && (() => {
          const antagonist = getAntagonist(gameState.antagonistId)
          return (
          <div
            onClick={() => {
              if (antagonist && revealed) {
                setSelectedPortrait(antagonist as CharacterPortrait)
                setPortraitModalOpen(true)
              }
            }}
            className={`flex-shrink-0 w-20 md:w-28 p-1.5 md:p-2 rounded text-xs border cursor-pointer hover:ring-2 transition-all ${revealed ? `border-red-900/50 hover:ring-red-500/50 ${antagonistRevealPlayed ? 'antagonist-reveal' : ''}` : 'border-[#2a2020] hover:ring-[#4a3030]'}`}
            style={{ background: 'linear-gradient(145deg, #1a1010 0%, #120808 100%)', borderTop: `3px solid ${revealed ? '#8b0000' : '#3a2020'}` }}
          >
            {/* Portrait thumbnail — shadow silhouette until Act III */}
            <div className={`portrait-frame ${revealed && antagonist ? getPantheonFrame(antagonist.pantheon || (antagonist as any).category || '') : 'portrait-frame-default'}`}>
            <div className="relative w-full rounded overflow-hidden bg-[#0d0a08] mb-1" style={{ aspectRatio: '3/4' }}>
              {revealed && antagonist ? (
                <Image
                  src={getEntityPortrait(antagonist)}
                  alt={antagonist.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skull className="w-8 h-8 text-[#3a2020]" />
                </div>
              )}
            </div>
            </div>
            <div className={`font-bold truncate font-name text-[10px] md:text-xs text-center ${revealed ? 'text-[#c04040]' : 'text-[#4a3030]'}`}>
              {revealed ? antagonist?.name : 'The Shadow'}
            </div>
            <HealthBar current={gameState.antagonistHp} max={gameState.antagonistMaxHp} size="sm" showLabel={false} />
            <div className="text-[9px] text-center text-gray-400 mt-0.5">
              {revealed ? `${gameState.antagonistHp}/${gameState.antagonistMaxHp}` : '???'}
            </div>
            <div className={`text-[8px] text-center uppercase mt-0.5 ${revealed ? 'text-red-400' : 'text-[#3a2020]'}`}>
              {revealed ? `Phase ${gameState.antagonistPhase}/3` : 'Unknown'}
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
        <div className="border-t border-[#2e2008] bg-gradient-to-r from-[#0d0a08] to-[#100a05] md:pr-80">
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
