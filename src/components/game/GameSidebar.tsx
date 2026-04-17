'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
// Sheet/Tabs removed — mobile now uses Dialog popups via icon dock
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
// Popover removed — Settings now uses Dialog
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BookOpen, ScrollText, Star, Crown, Skull, Sparkles, Swords, Users, Map as MapIcon, ClipboardList, Image as ImageIcon, Settings as SettingsIcon, MapPin, FileText } from 'lucide-react'
import { NarrativeSection } from '@/components/game/GameComponents'
import CharacterCard from '@/components/game/CharacterCard'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
import { hpCls, aCol, getEntityPortrait, getAbilityBonus } from '@/lib/gameHelpers'
import { getProphecyById } from '@/lib/prophecyData'
import type { GameState, SaveSlot } from '@/lib/gameTypes'
import type { Character } from '@/lib/characterTypes'

export interface GameSidebarProps {
  gameState: GameState
  activeTab: string
  setActiveTab: (tab: string) => void
  expandedPC: string | null
  setExpandedPC: (id: string | null) => void
  expandedNPC: string | null
  setExpandedNPC: (id: string | null) => void
  setSelectedPortrait: (portrait: CharacterPortrait | null) => void
  setPortraitModalOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  saveSlots: SaveSlot[]
  tokenUsage: { openrouter: { input: number; output: number; total: number }; lastCall: { api: string; input: number; output: number } }
  onOpenQuestJournal?: () => void
  conversationHistory?: { role: string; content: string }[]
  comicMode: boolean
  setComicMode: (enabled: boolean) => void
  comicArtStyle: 'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor'
  setComicArtStyle: (style: 'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor') => void
  dmSystemPrompt?: string
  galleryCharacter?: Character | null
  galleryPlaying?: boolean
  onGalleryTogglePlay?: () => void
  onGalleryNext?: () => void
  onGalleryPrev?: () => void
  questJournal?: any
  consequenceState?: any
  onTravelToLocation?: (name: string) => void
  quickeningState?: any
}

export function GameSidebar({
  gameState,
  activeTab,
  setActiveTab,
  expandedPC,
  setExpandedPC,
  expandedNPC,
  setExpandedNPC,
  setSelectedPortrait,
  setPortraitModalOpen,
  sidebarOpen,
  setSidebarOpen,
  saveSlots,
  tokenUsage,
  onOpenQuestJournal,
  conversationHistory,
  comicMode,
  setComicMode,
  comicArtStyle,
  setComicArtStyle,
  dmSystemPrompt,
  galleryCharacter,
  galleryPlaying,
  onGalleryTogglePlay,
  onGalleryNext,
  onGalleryPrev,
  questJournal,
  consequenceState,
  onTravelToLocation,
  quickeningState,
}: GameSidebarProps) {
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [questFilter, setQuestFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all')
  const [expandedChoiceHistory, setExpandedChoiceHistory] = useState(false)
  const [selectedMapPin, setSelectedMapPin] = useState<string | null>(null)

  const location = (gameState as unknown as Record<string, unknown>).location as string || ''
  const scene = (gameState as unknown as Record<string, unknown>).currentScene as string || ''
  const locText = location || scene || 'Unknown Realm'

  const iconBtnBase = 'w-10 h-10 rounded-lg flex items-center justify-center text-[#7a5f20] hover:text-[#d4af37] hover:bg-[#1a1510] transition-all cursor-pointer'
  const iconBtnActive = 'text-[#d4af37] bg-[#1a1510] border border-[#2e2008]'

  return (
    <>
      {/* Timeline animation keyframe injection */}
      <style>{`
        @keyframes timelineFadeIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP ICON STRIP */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <TooltipProvider delayDuration={200}>
        <div className="fixed right-0 top-0 h-full w-14 bg-[#110d07]/95 border-l border-[#2e2008] flex flex-col items-center py-2 gap-1 z-10 hidden lg:flex">
          {/* ── Section Icons ── */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'story' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'story' ? null : 'story')}>
                <BookOpen className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Story</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'pcs' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'pcs' ? null : 'pcs')}>
                <Users className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">PCs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'npcs' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'npcs' ? null : 'npcs')}>
                <Crown className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">NPCs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'quests' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'quests' ? null : 'quests')}>
                <ScrollText className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Quests</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'map' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'map' ? null : 'map')}>
                <MapIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Map</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'soul' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'soul' ? null : 'soul')}>
                <Sparkles className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Soul</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'graveyard' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'graveyard' ? null : 'graveyard')}>
                <Skull className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Graveyard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'prophecies' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'prophecies' ? null : 'prophecies')}>
                <Star className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Prophecies</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'logs' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'logs' ? null : 'logs')}>
                <ClipboardList className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Logs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'gallery' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'gallery' ? null : 'gallery')}>
                <ImageIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Gallery</TooltipContent>
          </Tooltip>

          {/* ── Settings ── */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'settings' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'settings' ? null : 'settings')}>
                <SettingsIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">Settings</TooltipContent>
          </Tooltip>

          {/* ── DM Notes ── */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className={`${iconBtnBase} ${openPanel === 'dmnotes' ? iconBtnActive : ''}`} onClick={() => setOpenPanel(openPanel === 'dmnotes' ? null : 'dmnotes')}>
                <FileText className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs">DM Notes</TooltipContent>
          </Tooltip>

          {/* ── Spacer ── */}
          <div className="flex-1" />

          {/* ── Bottom: Region indicator + Dice icon ── */}
          <div className="w-full flex flex-col items-center gap-1 pb-2 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-10 h-8 rounded-lg flex items-center justify-center text-[#7a5f20] hover:text-[#d4af37] hover:bg-[#1a1510] transition-all">
                  <MapPin className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-[#1a1510] text-[#c9a84c] border-[#2e2008] text-xs max-w-[180px]">{locText}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP POPUP DIALOG PANELS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Story Dialog ── */}
      <Dialog open={openPanel === 'story'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <BookOpen className="w-5 h-5" /> The Story So Far
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4 scroll-parchment">
            {gameState.storySummary ? (
              <NarrativeSection
                title="The Story So Far"
                content={gameState.storySummary}
                icon={<BookOpen className="w-5 h-5 text-[#d4af37]" />}
                variant="gold"
                defaultOpen={true}
              />
            ) : (
              <p className="text-[#5a4d30] italic text-sm">The tale has yet to begin…</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PCs Dialog ── */}
      <Dialog open={openPanel === 'pcs'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Users className="w-5 h-5" /> Player Characters
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            {gameState.pcs.map(pc => {
              const mapped = {
                id: pc.id,
                name: pc.name,
                category: pc.category || (pc.type === 'monster' ? 'monsters' : 'heroes'),
                title: pc.title || pc.epithet || 'Adventurer',
                pantheon: pc.pantheon || 'Unknown',
                align: pc.align || 'Neutral',
                hp: pc.hp,
                AC: pc.AC,
                MR: pc.MR,
                abilities: pc.abilities || [],
                personality: pc.personality || '',
                divineRank: pc.type === 'greater_god' ? 'Greater God' : pc.type === 'lesser_god' ? 'Lesser God' : pc.type === 'demigod' ? 'Demigod' : pc.type === 'monster' ? 'Monster' : 'Hero',
              }
              return (
              <React.Fragment key={pc.id}>
                <div className="mb-3">
                  <CharacterCard character={mapped as any} />
                </div>
                {pc.id === gameState.companionId && gameState.companionMood && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg text-[10px]" style={{
                    background: 'rgba(100,140,200,0.1)',
                    border: '1px solid rgba(100,140,200,0.15)',
                    color: '#8090b0'
                  }}>
                    💭 Mood: {gameState.companionMood}
                    <span className="ml-1 text-[#607090]">
                      (Affinity: {gameState.companionAffinity >= 25 ? '🤝' : gameState.companionAffinity < 0 ? '😠' : '😐'} {gameState.companionAffinity})
                    </span>
                  </div>
                )}
              </React.Fragment>
            )})}

            {/* Combat Status — Active Enemies */}
            {gameState.activeNPCs.filter(n => !n.dead).length > 0 && (
              <div className="mt-3 p-3 rounded-lg border border-red-900/30 bg-gradient-to-b from-[#1a0f0f] to-[#120808]">
                <div className="flex items-center gap-2 mb-2">
                  <Swords className="w-4 h-4 text-red-400" />
                  <span className="font-title text-xs text-red-400 uppercase tracking-wider">Active Combatants</span>
                </div>
                {gameState.activeNPCs.filter(n => !n.dead).map(npc => (
                  <div key={npc.id} className="flex items-center gap-2 p-2 rounded bg-[#0d0808] border border-red-900/20 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {(npc as any).encounter_type === 'BOSS' && <span className="text-xs">👑</span>}
                        <span className="text-xs text-red-300 font-title truncate">{npc.name}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-[#1a1010] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(0, Math.round(((npc.hp || 0) / (npc.maxHp || 1)) * 100))}%`,
                            background: (npc.hp || 0) / (npc.maxHp || 1) <= 0.2 ? '#cc3030' : '#cc5050'
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        HP: {Math.max(0, npc.hp || 0)}/{npc.maxHp || '?'}
                        {(npc as any).encounter_type === 'BOSS' && ` · Phase ${(gameState.antagonistId === npc.id) ? gameState.antagonistPhase : '?'}/3`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Battle Log — Recent Events */}
            {gameState.log.length > 0 && (
              <div className="mt-3">
                <NarrativeSection
                  title="Battle Log"
                  content={gameState.log.slice(0, 15).map(l => {
                    if (l.msg.startsWith('__')) return null // Skip special log entries
                    return l.msg
                  }).filter(Boolean).join('\n\n') || 'No events yet.'}
                  icon={<ScrollText className="w-4 h-4 text-[#a08060]" />}
                  variant="default"
                  defaultOpen={false}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NPCs Dialog ── */}
      <Dialog open={openPanel === 'npcs'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Crown className="w-5 h-5" /> Active NPCs
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            {gameState.activeNPCs.length === 0 ? (
              <p className="text-base text-[#5a4d30] italic p-3">No gods in current scene</p>
            ) : (
              gameState.activeNPCs.map(npc => (
                <NPCDetailCard
                  key={npc.id}
                  npc={npc}
                  expanded={expandedNPC === npc.id}
                  onToggle={() => setExpandedNPC(expandedNPC === npc.id ? null : npc.id)}
                  onPortraitClick={() => {
                    setSelectedPortrait(npc as CharacterPortrait)
                    setPortraitModalOpen(true)
                  }}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quests Dialog ── */}
      <Dialog open={openPanel === 'quests'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <ScrollText className="w-5 h-5" /> Quest Journal
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4 quest-journal">
            <div className="quest-journal-header">
              <h3>Quest Journal</h3>
              <div className="quest-stats">Active: {(questJournal?.quests || []).filter((q: any) => q.status === 'active').length} | Done: {questJournal?.totalQuestsCompleted || 0} | Locations: {questJournal?.totalLocationsDiscovered || 0}</div>
            </div>
            <div className="quest-filter-bar">
              {(['all', 'active', 'completed', 'failed'] as const).map(f => <button key={f} className={`quest-filter-btn ${questFilter === f ? 'active' : ''}`} onClick={() => setQuestFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}
            </div>
            <div className="quest-list">
              {(questJournal?.quests || [])
                .filter((q: any) => questFilter === 'all' ? true : q.status === questFilter)
                .sort((a: any, b: any) => (a.type === 'main' ? -1 : 1) - (b.type === 'main' ? -1 : 1) || ((a.turnGiven || 0) - (b.turnGiven || 0)))
                .map((q: any) => {
                  const completed = (q.objectives || []).filter((o: any) => o.isCompleted).length
                  const total = Math.max(1, (q.objectives || []).length)
                  return <div key={q.id} className={`quest-card quest-${q.type} quest-${q.status}`}>
                    <div className="quest-card-title">{q.type === 'main' ? '⭐' : q.type === 'side' ? '📋' : q.type === 'faction' ? '⚔️' : '💎'} {q.title}</div>
                    <div className="quest-card-desc">{q.description}</div>
                    <div className="quest-card-meta">{q.givenBy ? `Given by: ${q.givenBy}` : ''} {q.location ? `• 📍 ${q.location}` : ''}</div>
                    {(q.objectives || []).map((o: any, i: number) => <div key={i} className={`quest-objective ${o.isCompleted ? 'completed' : ''} ${o.isOptional ? 'optional' : ''}`}><span className="quest-objective-check">{o.isCompleted ? '☑' : '☐'}</span>{o.text}{o.isOptional ? ' (optional)' : ''}</div>)}
                    <div className="quest-progress-bar"><div className="quest-progress-fill" style={{ width: `${Math.round((completed / total) * 100)}%` }} /></div>
                    {q.reward && <div className="quest-card-details"><span className="reward">Reward: {q.reward}</span></div>}
                  </div>
                })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Map Dialog ── */}
      <Dialog open={openPanel === 'map'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <MapIcon className="w-5 h-5" /> World Map
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            <div className="world-map-container">
              <div className="world-map-grid" />
              {(questJournal?.locations || []).flatMap((loc: any) => (loc.connections || []).map((toId: string) => {
                const to = (questJournal?.locations || []).find((l: any) => l.id === toId)
                if (!to) return null
                const dx = (to.x || 0) - (loc.x || 0)
                const dy = (to.y || 0) - (loc.y || 0)
                const len = Math.sqrt(dx * dx + dy * dy)
                const angle = Math.atan2(dy, dx) * (180 / Math.PI)
                return <div key={`${loc.id}-${toId}`} className="map-connection-line" style={{ left: `${loc.x}%`, top: `${loc.y}%`, width: `${len}%`, transform: `rotate(${angle}deg)` }} />
              }))}
              {(questJournal?.locations || []).map((loc: any) => (
                <button key={loc.id} className={`map-pin ${loc.isCurrentlyAt ? 'current' : ''} ${loc.isDiscovered ? '' : 'undiscovered'}`} style={{ left: `${loc.x}%`, top: `${loc.y}%` }} onClick={() => setSelectedMapPin(prev => prev === loc.id ? null : loc.id)}>
                  <span className="map-pin-icon">{loc.icon || '📍'}</span>
                  <span className="map-pin-name">{loc.name}</span>
                </button>
              ))}
              {selectedMapPin && (() => {
                const loc = (questJournal?.locations || []).find((l: any) => l.id === selectedMapPin)
                if (!loc) return null
                const canTravel = !loc.isCurrentlyAt && !!onTravelToLocation
                return <div className="map-tooltip" style={{ left: `min(calc(${loc.x}% + 10px), calc(100% - 190px))`, top: `min(calc(${loc.y}% + 10px), calc(100% - 120px))` }}>
                  <div className="map-tooltip-name">{loc.icon || '📍'} {loc.name}</div>
                  <div className="map-tooltip-desc">{loc.description || 'Unknown region.'}</div>
                  <div className="map-tooltip-danger">{'☠'.repeat(Math.max(1, Number(loc.dangerLevel || 1)))}</div>
                  <button className="map-travel-btn" disabled={!canTravel} onClick={() => canTravel && onTravelToLocation?.(loc.name)}>Travel Here</button>
                </div>
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Soul Dialog ── */}
      <Dialog open={openPanel === 'soul'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Sparkles className="w-5 h-5" /> Soul & Consequences
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            <div className="choice-stats">Choices: {consequenceState?.totalChoicesMade || 0} | Alignment: {consequenceState?.alignment?.dominant || 'True Neutral'}</div>
            <div className="alignment-meter">
              <div className="alignment-title">Your Path: {consequenceState?.alignment?.title || 'Undecided Soul'}</div>
              <div className="text-xs text-[#a98d63]">Law/Chaos: {consequenceState?.alignment?.axis_law_chaos || 0} · Good/Evil: {consequenceState?.alignment?.axis_good_evil || 0}</div>
            </div>
            <div className="mt-2">
              {(consequenceState?.npcRelations || []).slice().sort((a: any, b: any) => b.affinity - a.affinity).map((r: any) => (
                <div key={r.npcId} className="npc-relation-card"><div className={`npc-relation-name ${r.affinity > 0 ? 'positive' : r.affinity < 0 ? 'negative' : 'neutral'}`}>{r.npcName}</div><div className={`npc-status-badge ${r.status}`}>{r.status}</div></div>
              ))}
            </div>
            <button className="quest-filter-btn mt-2" onClick={() => setExpandedChoiceHistory(v => !v)}>Choices {expandedChoiceHistory ? '▾' : '▸'}</button>
            {expandedChoiceHistory && (
              <div>
                {(consequenceState?.choices || []).map((c: any, idx: number) => (
                  <div key={idx} className="choice-entry"><div className="turn-num">Turn {c.turn}</div><div>{c.situation}</div><div className="chosen-text">{c.chosen}</div><div className="alt-text">{(c.alternatives || []).join(' · ')}</div><div className={c.rippleTriggered ? 'ripple-done' : 'ripple-pending'}>{c.rippleTriggered ? 'Ripple resolved' : `Ripple pending (turn ${c.rippleTurn || '?'})`}</div></div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Graveyard Dialog ── */}
      <Dialog open={openPanel === 'graveyard'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Skull className="w-5 h-5" /> The Graveyard
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-0">
            <div className="graveyard-header">
              <h3>The Graveyard</h3>
              <div className="graveyard-stats">
                <span>Fallen: {quickeningState?.absorptionHistory?.length || 0}</span>
                <span>Deities: {quickeningState?.totalDeityKills || 0}</span>
                <span>Monsters: {quickeningState?.totalMonstersAbsorbed || 0}</span>
              </div>
              <div className="graveyard-legend">Your Legend: {quickeningState?.currentLegendTitle || 'Mortal'}</div>
            </div>
            {(quickeningState?.absorptionHistory?.length || 0) > 0 ? (
              <>
                <div className="graveyard-grid">
                  {(quickeningState?.absorptionHistory || []).map((record: any, idx: number) => (
                    <div key={`${record.deityId}-${idx}`} className="graveyard-card">
                      {record.portrait ? (
                        <img src={record.portrait} alt={record.deityName} className="graveyard-card-portrait" onError={(e: any) => { e.target.style.display = 'none' }} />
                      ) : (
                        <div className="graveyard-card-portrait" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#555', fontSize: 24 }}>{record.deityName?.charAt(0) || '?'}</div>
                      )}
                      <div className="graveyard-card-name">{record.deityName}</div>
                      <div className="graveyard-card-turn">Turn {record.turn}</div>
                      <div className="graveyard-card-power">{record.powerAbsorbed}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="graveyard-empty">
                <div className="graveyard-empty-icon">💀</div>
                <div className="graveyard-empty-text">The graveyard is empty. The gods still reign.</div>
                <div className="graveyard-empty-hint">Slay a deity to begin the Quickening.</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Prophecies Dialog ── */}
      <Dialog open={openPanel === 'prophecies'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Star className="w-5 h-5" /> Prophecies & Shards
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            {gameState.shardEntry && (
              <Card className="mb-3 bg-gradient-to-r from-[rgba(60,40,80,.3)] to-[rgba(30,20,40,.2)] border-2" style={{ borderColor: gameState.shardEntry.color || '#808080' }}>
                <CardHeader className="p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: gameState.shardEntry.color || '#c080ff' }} />
                    <CardTitle className="text-sm" style={{ color: gameState.shardEntry.color || '#c080ff', fontFamily: 'var(--font-heading)' }}>
                      {gameState.shardEntry.name}
                    </CardTitle>
                    <Badge className="ml-auto text-[10px] bg-[rgba(60,40,80,.5)] text-[#c090d0]" style={{ borderColor: gameState.shardEntry.color || '#808080' }}>
                      {gameState.shardEntry.pantheon || 'Unknown'}
                    </Badge>
                  </div>
                  <CardDescription className="text-[10px] text-[#a08060] mt-2 italic">
                    {gameState.shardEntry.power}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs">
                  <div className="text-[#7a5f20] mb-2">Charges: {gameState.shardCharges}/2</div>
                  <div className="text-[10px] text-[#a08060] italic leading-relaxed">
                    The shard contains the prophecy. It chose its bearer. They cannot escape destiny.
                  </div>
                </CardContent>
              </Card>
            )}

            <h3 className="text-[#c9a84c] mb-3 text-base flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <ScrollText className="w-4 h-4" /> Bound Destinies
            </h3>
            {gameState.prophecies.length === 0 ? (
              <p className="text-[#5a4d30] italic text-sm">No prophecies have been revealed yet...</p>
            ) : (
              <div className="space-y-3">
                {gameState.prophecies.map((prophecy, index) => {
                  const pc = gameState.pcs.find(p => p.id === prophecy.pc_id)
                  const prophecyData = getProphecyById(prophecy.prophecyId)
                  const isMainPC = index === 0 && !pc?.dead
                  return (
                    <Card key={prophecy.pc_id} className={`bg-[#1a1510] ${isMainPC ? 'border-2 border-[#d4af37]' : 'border-[#3a3020]'} ${pc?.dead ? 'opacity-50' : ''}`}>
                      <CardHeader className="p-3 bg-gradient-to-r from-[rgba(80,40,100,.3)] to-[rgba(40,30,50,.2)]">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm text-[#d4af37]">
                            {pc?.name || 'Unknown Hero'}
                            {isMainPC && <span className="text-[#f0c860] ml-2 text-[10px]">★ MAIN BEARER</span>}
                            {pc?.dead && <span className="text-[#c05050] ml-2 text-xs">(FALLEN)</span>}
                          </CardTitle>
                          <Badge className="bg-[#2a1a30] text-[#c090d0] border-[#5a4060] text-[10px]">
                            {prophecy.state}
                          </Badge>
                        </div>
                        {prophecy.previous_holders.length > 0 && (
                          <CardDescription className="text-[10px] text-[#7a5f20] mt-1">
                            {prophecy.previous_holders.length} previous bearer(s) - the shard remembers
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="text-xs text-[#a08060] italic leading-relaxed font-narrative" style={{ fontFamily: 'var(--font-dialogue)' }}>
                          &ldquo;{prophecy.riddle}&rdquo;
                        </div>
                        {prophecyData && (
                          <div className="mt-2 pt-2 border-t border-[#3a3020]">
                            <div className="text-[10px] text-[#7a5f20] uppercase tracking-wider">
                              Theme: {prophecyData.theme}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-[#3a3020]">
              <p className="text-[10px] text-[#5a4d30] italic">
                The prophecy is bound to the SHARD, not just the hero. If the main bearer falls, the shard summons a replacement and the destiny transfers - heavier each time.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Logs Dialog ── */}
      <Dialog open={openPanel === 'logs'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <ClipboardList className="w-5 h-5" /> Chronicle of Events
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4 scroll-parchment">
            {gameState.log.length === 0 ? (
              <p className="text-[#5a4d30] italic text-sm">The story has not yet begun...</p>
            ) : (
              <div>
                {gameState.log.slice().reverse().map((entry, idx) => {
                  const dotColor = getLogDotColor(entry.type)
                  const glowColor = getLogGlowColor(entry.type)
                  return (
                    <div key={idx} className="flex gap-3" style={{ animation: 'timelineFadeIn 0.3s ease-out' }}>
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{ background: dotColor, boxShadow: `0 0 6px ${glowColor}` }}
                        />
                        <div className="w-px flex-1 bg-[#3a3020]" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-4 min-w-0">
                        <div className="text-[10px] text-[#7a5f20] uppercase tracking-wider font-title">Turn {entry.turn}</div>
                        <div className="text-xs text-[#c9a84c] font-narrative leading-relaxed mt-0.5">{entry.msg}</div>
                      </div>
                    </div>
                  )
                })}
                {/* Campaign Begin marker */}
                <div className="flex gap-3 items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="text-sm text-[#d4af37]" style={{ textShadow: '0 0 8px rgba(212,175,55,0.5)' }}>✦</div>
                  </div>
                  <div className="text-xs text-[#d4af37] font-title italic" style={{ fontFamily: 'var(--font-heading)' }}>
                    Campaign Begin
                  </div>
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* ── Gallery Dialog ── */}
      <Dialog open={openPanel === 'gallery'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <ImageIcon className="w-5 h-5" /> Gallery
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4">
            {galleryCharacter ? (
              <>
                <CharacterCard character={galleryCharacter as any} />
                <div className="gallery-controls">
                  <button onClick={onGalleryPrev}>‹</button>
                  <button onClick={onGalleryTogglePlay}>{galleryPlaying ? 'Pause' : 'Play'}</button>
                  <button onClick={onGalleryNext}>›</button>
                </div>
              </>
            ) : (
              <div className="text-xs text-[#9a8860]">No gallery character loaded.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={openPanel === 'settings'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <SettingsIcon className="w-5 h-5" /> Settings
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4 space-y-5">
            {/* ── Comic Panels ── */}
            <div>
              <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-3 font-title">Comic Panels</h4>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#a08060]">Enable Comic Panels</span>
                <button
                  onClick={() => setComicMode(!comicMode)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all ${comicMode ? 'bg-[#1f2a1a] text-[#60c080] border-[#2f5a3a] shadow-[0_0_8px_rgba(96,192,128,0.15)]' : 'bg-[#1a1510] text-[#8a7040] border-[#3a3020]'}`}
                >
                  {comicMode ? '✓ ON' : 'OFF'}
                </button>
              </div>
              <div>
                <label className="text-xs text-[#7a5f20] uppercase tracking-wider block mb-1.5">Art Style</label>
                <select
                  value={comicArtStyle}
                  onChange={e => setComicArtStyle(e.target.value as 'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor')}
                  className="w-full bg-[#1a1510] border border-[#2e2008] text-[#e8d9b0] text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#d4af37]/50 transition-colors"
                >
                  <option value="larry-elmore">Larry Elmore</option>
                  <option value="classic-comic">Classic Comic</option>
                  <option value="manga">Manga</option>
                  <option value="watercolor">Watercolor</option>
                </select>
              </div>
            </div>

            {/* ── Voice & Narration ── */}
            <div>
              <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-3 font-title">Voice & Narration</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                  <div className="text-[#7a5f20] text-xs">TTS Engine</div>
                  <div className="text-[#e8d9b0] font-bold mt-0.5">Browser</div>
                </div>
                <div className="p-3 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                  <div className="text-[#7a5f20] text-xs">Voice Speed</div>
                  <div className="text-[#e8d9b0] font-bold mt-0.5">1.0×</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-[#5a4d30] italic">
                Text-to-speech uses your browser&apos;s built-in speech synthesis engine. Neural voices are available in supported browsers.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DM NOTES DIALOG */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={openPanel === 'dmnotes'} onOpenChange={(open) => { if (!open) setOpenPanel(null) }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-[#110d07] border-[#2e2008] text-[#e8d9b0] p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-[#2e2008] flex-shrink-0">
            <DialogTitle className="text-[#d4af37] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <FileText className="w-5 h-5" /> DM Notes
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-5rem)] p-4 space-y-4">
            {/* ── Session Statistics ── */}
            <div>
              <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-2 font-title">Session Statistics</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2.5 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                  <div className="text-[#7a5f20] text-[10px]">Cloud Tokens</div>
                  <div className="text-blue-400 font-bold mt-0.5">{tokenUsage.openrouter.total.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                  <div className="text-[#7a5f20] text-[10px]">Turn</div>
                  <div className="text-[#e8d9b0] font-bold mt-0.5">{gameState.turn || 0}</div>
                </div>
                <div className="p-2.5 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                  <div className="text-[#7a5f20] text-[10px]">Act</div>
                  <div className="text-[#e8d9b0] font-bold mt-0.5">{(gameState as unknown as Record<string, unknown>).act as string || 'I'}</div>
                </div>
              </div>
            </div>

            {/* ── DM System Notes ── */}
            <div>
              <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-2 font-title">DM System Notes</h4>
              <div className="p-3 bg-[#1a1510] rounded-lg border border-[#2e2008] text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[#7a5f20]">Turn</span><span className="text-[#e8d9b0]">{gameState.turn || 0}</span></div>
                <div className="flex justify-between"><span className="text-[#7a5f20]">Act</span><span className="text-[#e8d9b0]">{(gameState as unknown as Record<string, unknown>).act as string || 'I'}</span></div>
                <div className="flex justify-between"><span className="text-[#7a5f20]">Shard</span><span className="text-[#e8d9b0]">{gameState.shardEntry?.name || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-[#7a5f20]">Pantheon</span><span className="text-[#e8d9b0]">{(gameState as unknown as Record<string, unknown>).pantheon as string || 'Unknown'}</span></div>
              </div>
              {dmSystemPrompt && (
                <div className="mt-2 p-3 bg-[#0d0a08] rounded-lg border border-[#2e2008]">
                  <div className="text-[10px] text-[#7a5f20] uppercase tracking-wider mb-1">DM System Prompt</div>
                  <div className="text-xs text-[#a08060] leading-relaxed max-h-32 overflow-y-auto">{dmSystemPrompt}</div>
                </div>
              )}
            </div>

            {/* ── DM Conversation Log ── */}
            {conversationHistory && conversationHistory.length > 0 && (
              <div>
                <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-2 font-title">DM Conversation Log</h4>
                <div className="space-y-2">
                  {conversationHistory.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-[#1a1510] rounded-lg border border-[#2e2008]">
                      <div className="flex items-center gap-2 mb-1.5">
                        {entry.role === 'user' ? (
                          <span className="text-sm">🗡️</span>
                        ) : (
                          <span className="text-sm">📜</span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: entry.role === 'user' ? '#c0a060' : '#6090c0' }}>
                          {entry.role === 'user' ? 'Player Action' : 'DM Response'}
                        </span>
                      </div>
                      <div className="text-xs text-[#a09080] leading-relaxed" style={{ maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.content.length > 200 ? entry.content.slice(0, 200) + '…' : entry.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE ICON DOCK */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 md:hidden transition-transform duration-300 ${openPanel ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-[#110d07]/98 border-t border-[#2e2008] px-1 pt-2 pb-[env(safe-area-inset-bottom,4px)]">
          <div className="grid grid-cols-6 gap-0.5">
            {[
              { key: 'story', icon: <BookOpen className="w-5 h-5" />, label: 'Story' },
              { key: 'pcs', icon: <Users className="w-5 h-5" />, label: 'PCs' },
              { key: 'npcs', icon: <Crown className="w-5 h-5" />, label: 'NPCs' },
              { key: 'quests', icon: <ScrollText className="w-5 h-5" />, label: 'Quests' },
              { key: 'map', icon: <MapIcon className="w-5 h-5" />, label: 'Map' },
              { key: 'soul', icon: <Sparkles className="w-5 h-5" />, label: 'Soul' },
              { key: 'graveyard', icon: <Skull className="w-5 h-5" />, label: '☠️' },
              { key: 'prophecies', icon: <Star className="w-5 h-5" />, label: '📜' },
              { key: 'logs', icon: <ClipboardList className="w-5 h-5" />, label: 'Logs' },
              { key: 'gallery', icon: <ImageIcon className="w-5 h-5" />, label: '🎴' },
              { key: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: '⚙️' },
              { key: 'dmnotes', icon: <FileText className="w-5 h-5" />, label: 'DM' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setOpenPanel(openPanel === item.key ? null : item.key)}
                className="flex flex-col items-center justify-center py-1.5 min-h-[44px] rounded-lg text-[#7a5f20] active:text-[#d4af37] active:bg-[#1a1510]/60 transition-all"
              >
                {item.icon}
                <span className="text-[9px] mt-0.5 leading-none">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE HELPERS — Color-coded dots for log event types
// ═══════════════════════════════════════════════════════════════════════════

function getLogDotColor(type: string): string {
  switch (type) {
    case 'combat': return '#ef4444'
    case 'discovery': return '#3b82f6'
    case 'dialogue': return '#a855f7'
    case 'injury': return '#f97316'
    case 'level_up': return '#d4af37'
    case 'quest': return '#22c55e'
    case 'narration': return '#c9a84c'
    default: return '#8b6914'
  }
}

function getLogGlowColor(type: string): string {
  switch (type) {
    case 'combat': return 'rgba(239,68,68,0.5)'
    case 'discovery': return 'rgba(59,130,246,0.5)'
    case 'dialogue': return 'rgba(168,85,247,0.5)'
    case 'injury': return 'rgba(249,115,22,0.5)'
    case 'level_up': return 'rgba(212,175,55,0.5)'
    case 'quest': return 'rgba(34,197,94,0.5)'
    case 'narration': return 'rgba(201,168,76,0.4)'
    default: return 'rgba(139,105,20,0.4)'
  }
}

function PCDetailCard({ pc, isHumanPC, expanded, injuries, onToggle }: {
  pc: import('@/lib/gameTypes').Entity
  isHumanPC: boolean
  expanded: boolean
  injuries: import('@/lib/gameTypes').Injury[]
  onToggle: () => void
}) {
  return (
    <Card
      className={`mb-3 cursor-pointer transition-all ${pc.dead ? 'opacity-30' : ''} ${isHumanPC ? 'border-2 border-[#d4af37]' : 'border border-[#4a4030]'}`}
      onClick={onToggle}
    >
      <CardHeader className="p-3 bg-gradient-to-r from-[rgba(60,45,15,.5)] to-[rgba(30,25,15,.3)]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#d4af37] font-name">
            {pc.name.replace(/\s*\([^)]*\)/g, '')} {isHumanPC && <span className="text-xs text-[#f0c860]">[YOU]</span>}
          </CardTitle>
          <span className="text-xs text-[#5a4d30]">{expanded ? '▼' : '▶'}</span>
        </div>
        <CardDescription className="text-xs text-[#a08060] font-narrative">{pc.title || pc.epithet || pc.pantheon}</CardDescription>
      </CardHeader>

      {/* Always visible stats */}
      <CardContent className="p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">HP</span><span className={`font-bold ${hpCls(Number(pc.hp), Number(pc.maxHp))}`}>{Math.max(0, Number(pc.hp) || 0)}/{Number(pc.maxHp) || '?'}</span></div>
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">AC</span><span className="text-[#f0e0c0] font-bold">{pc.AC}</span></div>
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">MR</span><span className="text-[#f0e0c0]">{pc.MR}{typeof pc.MR === 'number' ? '%' : ''}</span></div>
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">Align</span><span className="font-title text-sm" style={{ color: aCol(pc.align) }}>{pc.align}</span></div>
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">Pantheon</span><span className="text-[#c9a84c]">{pc.pantheon}</span></div>
      </CardContent>

      {/* Expanded abilities section */}
      {expanded && (
        <div className="border-t border-[#3a3020] p-3 bg-[#0d0a08]/50">
          {/* Ability Scores */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">⚔️ Ability Scores</div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3 p-2 bg-[#1a1510] rounded">
            {[
              { abbr: 'STR', full: 'Strength', val: pc.str },
              { abbr: 'INT', full: 'Intelligence', val: pc.int },
              { abbr: 'WIS', full: 'Wisdom', val: pc.wis },
              { abbr: 'DEX', full: 'Dexterity', val: pc.dex },
              { abbr: 'CON', full: 'Constitution', val: pc.con },
              { abbr: 'CHA', full: 'Charisma', val: pc.cha }
            ].map(ability => {
              const bonus = getAbilityBonus(ability.val)
              const bonusColor = bonus.value > 0 ? '#50c060' : bonus.value < 0 ? '#c05050' : '#9a8860'
              return (
                <div key={ability.abbr} className="text-center p-1 bg-[#0d0a08] rounded">
                  <div className="text-[#c9a84c] font-bold text-sm">{ability.abbr}</div>
                  <div className="text-[#f0e0c0] text-base font-bold">{ability.val || '-'}</div>
                  <div className="text-xs font-bold" style={{ color: bonusColor }}>{bonus.display}</div>
                </div>
              )
            })}
          </div>

          {/* Character Description */}
          {pc.personality && (
            <>
              <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">📜 Character Description</div>
              <div className="text-xs text-[#a08060] italic font-narrative mb-3 p-2 bg-[#1a1510] rounded">
                {pc.personality}
              </div>
            </>
          )}

          {/* Full Stats */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">📊 Complete Stats</div>
          <div className="grid grid-cols-2 gap-1 text-xs mb-3 p-2 bg-[#1a1510] rounded">
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Type:</span><span className="text-[#c9a84c]">{pc.type || pc.category || 'Hero'}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Max HP:</span><span className="text-[#f0e0c0]">{pc.maxHp}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">AC:</span><span className="text-[#f0e0c0]">{pc.AC}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">MR:</span><span className="text-[#f0e0c0]">{pc.MR}{typeof pc.MR === 'number' ? '%' : ''}</span></div>
            {pc.level && <div className="flex justify-between pr-2 col-span-2"><span className="text-[#8a7040]">Level:</span><span className="text-[#c9a84c]">{pc.level}</span></div>}
            {pc.attacks && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Attacks:</span><span className="text-[#f0e0c0]">{pc.attacks}/rd</span></div>}
            {pc.damage && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Damage:</span><span className="text-[#f0e0c0]">{pc.damage}</span></div>}
            {pc.move && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Move:</span><span className="text-[#f0e0c0]">{pc.move}</span></div>}
            <div className="flex justify-between pr-2 col-span-2"><span className="text-[#8a7040]">Alignment:</span><span style={{ color: aCol(pc.align) }}>{pc.align}</span></div>
          </div>

          {/* Abilities */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">⚡ Abilities & Powers</div>
          {pc.abilities && pc.abilities.length > 0 ? (
            <div className="space-y-1 mb-3">
              {pc.abilities.map((ability, idx) => (
                <div key={idx} className="text-xs text-[#c9a84c] bg-[#1a1510] p-2 rounded border-l-2 border-[#5a4018]">
                  {ability}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#5a4d30] italic mb-3">No abilities recorded</div>
          )}

          {/* Inventory */}
          {pc.inventory && pc.inventory.length > 0 && (
            <>
              <div className="text-xs text-[#7a5f20] uppercase tracking-wider mt-3 mb-2 font-title">🎒 Inventory</div>
              <div className="space-y-1">
                {pc.inventory.map((item, idx) => (
                  <div key={idx} className="text-xs text-[#a08060] bg-[#1a1510] p-2 rounded">
                    {item.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Injuries - always visible if present */}
      {injuries.length > 0 && (
        <div className="px-3 pb-3 pt-0">
          <div className="pt-2 border-t border-[#3a3020]">
            {injuries.map(inj => (
              <div key={inj.id} className="text-xs text-[#f08040] font-narrative">
                {inj.icon} {inj.name} — {inj.effect} ({inj.turnsLeft}t)
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function NPCDetailCard({ npc, expanded, onToggle, onPortraitClick }: {
  npc: import('@/lib/gameTypes').Entity
  expanded: boolean
  onToggle: () => void
  onPortraitClick: () => void
}) {
  const npcColor = npc.category === 'greater_gods' ? '#e8b040' : npc.category === 'lesser_gods' ? '#b0a060' : '#a06060'
  const npcType = npc.category === 'greater_gods' ? 'Greater God' : npc.category === 'lesser_gods' ? 'Lesser God' : npc.type === 'monster' ? 'Monster' : 'Entity'

  return (
    <Card
      className={`mb-3 cursor-pointer transition-all border border-[#4a4030] ${npc.dead ? 'opacity-30' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: npcColor }}
      onClick={onToggle}
    >
      <CardHeader className="p-3 bg-gradient-to-r from-[rgba(60,45,15,.5)] to-[rgba(30,25,15,.3)]">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {/* NPC Portrait - Full portrait (768x1344 aspect ratio) */}
            <div
              className="relative w-14 rounded overflow-hidden flex-shrink-0 bg-[#1a1510] border border-[#4a4030] cursor-pointer hover:ring-2 hover:ring-[#d4af37]/50 transition-all"
              style={{ aspectRatio: '768/1344' }}
              onClick={(e) => {
                e.stopPropagation()
                onPortraitClick()
              }}
            >
              <img
                src={getEntityPortrait(npc)}
                alt={npc.name}
                className="object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                {npc.category === 'greater_gods' && <Crown className="w-3 h-3" style={{ color: npcColor }} />}
                {npc.category === 'lesser_gods' && <Star className="w-3 h-3" style={{ color: npcColor }} />}
                {npc.type === 'monster' && <Skull className="w-3 h-3" style={{ color: npcColor }} />}
                <CardTitle className="text-base font-name" style={{ color: npcColor }}>
                  {npc.name}
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#a08060] font-narrative">{npc.title || npcType} · {npc.pantheon}</CardDescription>
            </div>
          </div>
          <span className="text-xs text-[#5a4d30]">{expanded ? '▼' : '▶'}</span>
        </div>
      </CardHeader>

      {/* Always visible stats */}
      <CardContent className="p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-[#8a7040] font-narrative">HP</span>
          <span className={`font-bold ${hpCls(npc.hp, npc.maxHp)}`}>{Math.max(0, npc.hp)}/{npc.maxHp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8a7040] font-narrative">AC</span>
          <span className="text-[#f0e0c0] font-bold">{npc.AC}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8a7040] font-narrative">MR</span>
          <span className="text-[#f0e0c0]">{npc.MR}{typeof npc.MR === 'number' ? '%' : ''}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8a7040] font-narrative">Align</span>
          <span className="font-title text-sm" style={{ color: aCol(npc.align) }}>{npc.align}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8a7040] font-narrative">Pantheon</span>
          <span className="text-[#c9a84c]">{npc.pantheon}</span>
        </div>
      </CardContent>

      {/* Expanded abilities section */}
      {expanded && (
        <div className="border-t border-[#3a3020] p-3 bg-[#0d0a08]/50">
          {/* Ability Scores */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">⚔️ Ability Scores</div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3 p-2 bg-[#1a1510] rounded">
            {[
              { abbr: 'STR', full: 'Strength', val: npc.str },
              { abbr: 'INT', full: 'Intelligence', val: npc.int },
              { abbr: 'WIS', full: 'Wisdom', val: npc.wis },
              { abbr: 'DEX', full: 'Dexterity', val: npc.dex },
              { abbr: 'CON', full: 'Constitution', val: npc.con },
              { abbr: 'CHA', full: 'Charisma', val: npc.cha }
            ].map(ability => {
              const bonus = getAbilityBonus(ability.val)
              const bonusColor = bonus.value > 0 ? '#50c060' : bonus.value < 0 ? '#c05050' : '#9a8860'
              return (
                <div key={ability.abbr} className="text-center p-1 bg-[#0d0a08] rounded">
                  <div className="text-[#c9a84c] font-bold text-sm">{ability.abbr}</div>
                  <div className="text-[#f0e0c0] text-base font-bold">{ability.val || '-'}</div>
                  <div className="text-xs font-bold" style={{ color: bonusColor }}>{bonus.display}</div>
                </div>
              )
            })}
          </div>

          {/* Character Description */}
          {npc.personality && (
            <>
              <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">📜 Character Description</div>
              <div className="text-xs text-[#a08060] italic font-narrative mb-3 p-2 bg-[#1a1510] rounded">
                {npc.personality}
              </div>
            </>
          )}

          {/* Full Stats */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">📊 Complete Stats</div>
          <div className="grid grid-cols-2 gap-1 text-xs mb-3 p-2 bg-[#1a1510] rounded">
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Type:</span><span style={{ color: npcColor }}>{npcType}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Max HP:</span><span className="text-[#f0e0c0]">{npc.maxHp}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">AC:</span><span className="text-[#f0e0c0]">{npc.AC}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">MR:</span><span className="text-[#f0e0c0]">{npc.MR}{typeof npc.MR === 'number' ? '%' : ''}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Pantheon:</span><span className="text-[#c9a84c]">{npc.pantheon}</span></div>
            <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Alignment:</span><span style={{ color: aCol(npc.align) }}>{npc.align}</span></div>
            {npc.level && <div className="flex justify-between pr-2 col-span-2"><span className="text-[#8a7040]">Level:</span><span className="text-[#c9a84c]">{npc.level}</span></div>}
            {npc.attacks && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Attacks:</span><span className="text-[#f0e0c0]">{npc.attacks}/rd</span></div>}
            {npc.damage && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Damage:</span><span className="text-[#f0e0c0]">{npc.damage}</span></div>}
            {npc.move && <div className="flex justify-between pr-2"><span className="text-[#8a7040]">Move:</span><span className="text-[#f0e0c0]">{npc.move}</span></div>}
          </div>

          {/* Abilities */}
          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2 font-title">⚡ Abilities & Powers</div>
          {npc.abilities && npc.abilities.length > 0 ? (
            <div className="space-y-1 mb-3">
              {npc.abilities.map((ability, idx) => (
                <div key={idx} className="text-xs text-[#c9a84c] bg-[#1a1510] p-2 rounded border-l-2" style={{ borderLeftColor: npcColor }}>
                  {ability}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#5a4d30] italic mb-3">No abilities recorded</div>
          )}
        </div>
      )}

      {/* Conditions - always visible if present */}
      {npc.conditions && npc.conditions.length > 0 && (
        <div className="px-3 pb-3 pt-0">
          <div className="pt-2 border-t border-[#3a3020]">
            {npc.conditions.map((cond, idx) => (
              <div key={idx} className="text-xs text-[#f08040] font-narrative">
                ⚠ {cond}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
