'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ScrollText, Star, Crown, Skull, Sparkles, CheckCircle, Swords } from 'lucide-react'
import { NarrativeSection } from '@/components/game/GameComponents'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
import { hpCls, aCol, getEntityPortrait, getAbilityBonus } from '@/lib/gameHelpers'
import { getProphecyById } from '@/lib/prophecyData'
import type { GameState, SaveSlot } from '@/lib/gameTypes'

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
  tokenUsage: { gemini: { input: number; output: number; total: number }; lastCall: { api: string; input: number; output: number } }
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
}: GameSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - top offset accounts for sticky header */}
      <div className="fixed right-0 top-0 h-screen w-80 bg-[#110d07]/95 border-l border-[#2e2008] flex flex-col z-40 hidden md:flex sidebar-parchment">
        {/* Spacer for sticky header — pushes all content below the header */}
        <div className="flex-shrink-0 h-[190px]" />
        
        {/* Story So Far - Below header, inside scrollable area */}
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pb-24 scroll-parchment">
        {gameState.storySummary && (
          <div className="border-b border-[#2e2008] p-3 flex-shrink-0">
            <NarrativeSection 
              title="The Story So Far" 
              content={gameState.storySummary} 
              icon={<BookOpen className="w-5 h-5 text-[#d4af37]" />}
              variant="gold"
              defaultOpen={false}
            />
          </div>
        )}
        <DesktopTabs
          gameState={gameState}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          expandedPC={expandedPC}
          setExpandedPC={setExpandedPC}
          expandedNPC={expandedNPC}
          setExpandedNPC={setExpandedNPC}
          setSelectedPortrait={setSelectedPortrait}
          setPortraitModalOpen={setPortraitModalOpen}
          tokenUsage={tokenUsage}
        />
        </div>
      </div>

      {/* Mobile Sheet Drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[85%] max-w-sm bg-[#110d07] border-[#2e2008] p-0 overflow-y-auto">
          <SheetHeader className="p-3 border-b border-[#2e2008]">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[#d4af37] font-title">Game Info</SheetTitle>
              <a 
                href="/codex" 
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-[#2a2010] to-[#1a1510] border border-[#5a4018] rounded hover:border-[#d4af37] hover:text-[#f0c860] text-[#c9a84c] transition-all"
                style={{ fontFamily: 'Cinzel, serif' }}
              >
                <BookOpen className="w-3 h-3" />
                Codex
              </a>
            </div>
          </SheetHeader>
          
          {/* Story So Far - Mobile */}
          {gameState.storySummary && (
            <div className="border-b border-[#2e2008] p-3">
              <NarrativeSection 
                title="The Story So Far" 
                content={gameState.storySummary} 
                icon={<BookOpen className="w-4 h-4 text-[#d4af37]" />}
                variant="gold"
                defaultOpen={true}
              />
            </div>
          )}
          
          <MobileTabs
            gameState={gameState}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            expandedNPC={expandedNPC}
            setExpandedNPC={setExpandedNPC}
            setSelectedPortrait={setSelectedPortrait}
            setPortraitModalOpen={setPortraitModalOpen}
            tokenUsage={tokenUsage}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DESKTOP TABS — Full detail view
// ═══════════════════════════════════════════════════════════════════════════

function DesktopTabs({ gameState, activeTab, setActiveTab, expandedPC, setExpandedPC, expandedNPC, setExpandedNPC, setSelectedPortrait, setPortraitModalOpen, tokenUsage }: {
  gameState: GameState
  activeTab: string
  setActiveTab: (tab: string) => void
  expandedPC: string | null
  setExpandedPC: (id: string | null) => void
  expandedNPC: string | null
  setExpandedNPC: (id: string | null) => void
  setSelectedPortrait: (portrait: CharacterPortrait | null) => void
  setPortraitModalOpen: (open: boolean) => void
  tokenUsage: { gemini: { input: number; output: number; total: number }; lastCall: { api: string; input: number; output: number } }
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
      <TabsList className="flex border-b border-[#2e2008] bg-transparent flex-shrink-0">
        <TabsTrigger value="pcs" className="flex-1 text-base py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">PCs</TabsTrigger>
        <TabsTrigger value="npcs" className="flex-1 text-base py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">NPCs</TabsTrigger>
        <TabsTrigger value="quests" className="flex-1 text-base py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">Quests</TabsTrigger>
        <TabsTrigger value="prophecies" className="flex-1 text-base py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">📜</TabsTrigger>
        <TabsTrigger value="logs" className="flex-1 text-base py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">Logs</TabsTrigger>
      </TabsList>

      {/* PCs Tab */}
      <TabsContent value="pcs" className="flex-1 overflow-y-auto p-3 m-0 min-h-0">
        {gameState.pcs.map(pc => (
          <React.Fragment key={pc.id}>
            <PCDetailCard
              pc={pc}
              isHumanPC={pc.id === gameState.humanPCId}
              expanded={expandedPC === pc.id}
              injuries={gameState.injuries[pc.id] || []}
              onToggle={() => setExpandedPC(expandedPC === pc.id ? null : pc.id)}
            />
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
        ))}

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
      </TabsContent>

      {/* NPCs Tab */}
      <TabsContent value="npcs" className="flex-1 overflow-y-auto p-3 m-0 min-h-0">
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
      </TabsContent>

      {/* Quests Tab */}
      <TabsContent value="quests" className="flex-1 overflow-y-auto p-3 m-0 min-h-0">
        {gameState.quests.map(quest => (
          <Card key={quest.id} className={`mb-3 ${quest.status === 'completed' ? 'opacity-50' : ''}`} style={{ borderColor: quest.type === 'main' ? '#c9a84c' : '#5a4018' }}>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                {quest.type === 'main' ? <Star className="w-5 h-5 text-[#c9a84c]" /> : <ScrollText className="w-5 h-5 text-[#5a4018]" />}
                <CardTitle className="text-lg text-[#c9a84c]" style={{ fontFamily: 'Cinzel, serif' }}>{quest.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 text-base space-y-2">
              <p className="text-[#9a8860]">{quest.description}</p>
              {quest.objectives.map((obj, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-sm ${obj.completed ? 'text-[#4a9060]' : 'text-[#5a4d30]'}`}>
                  {obj.completed ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-[#5a4d30]" />}
                  {obj.text}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Prophecies Tab */}
      <TabsContent value="prophecies" className="flex-1 overflow-y-auto p-3 m-0 min-h-0">
        {gameState.shardEntry && (
          <Card className="mb-3 bg-gradient-to-r from-[rgba(60,40,80,.3)] to-[rgba(30,20,40,.2)] border-2" style={{ borderColor: gameState.shardEntry.color || '#808080' }}>
            <CardHeader className="p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: gameState.shardEntry.color || '#c080ff' }} />
                <CardTitle className="text-sm" style={{ color: gameState.shardEntry.color || '#c080ff', fontFamily: 'Cinzel, serif' }}>
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

        <h3 className="text-[#c9a84c] mb-3 text-base flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
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
                    <div className="text-xs text-[#a08060] italic leading-relaxed font-narrative" style={{ fontFamily: '"IM Fell English", serif' }}>
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
      </TabsContent>

      {/* Logs Tab */}
      <TabsContent value="logs" className="flex-1 overflow-y-auto p-3 m-0 min-h-0">
        <h3 className="text-[#c9a84c] mb-3 text-base flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <BookOpen className="w-4 h-4" /> Chronicle of Events
        </h3>
        {gameState.log.length === 0 ? (
          <p className="text-[#5a4d30] italic text-sm">The story has not yet begun...</p>
        ) : (
          <div className="space-y-2">
            {gameState.log.slice().reverse().map((entry, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded border-l-2 text-xs ${
                  entry.type === 'combat' ? 'border-red-600 bg-red-950/20' :
                  entry.type === 'discovery' ? 'border-blue-500 bg-blue-950/20' :
                  entry.type === 'dialogue' ? 'border-purple-500 bg-purple-950/20' :
                  'border-[#5a4018] bg-[#1a1510]'
                }`}
              >
                <div className="text-[#7a5f20] text-[10px] uppercase tracking-wider mb-1">Turn {entry.turn}</div>
                <div className="text-[#c9a84c] font-narrative leading-relaxed">{entry.msg}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Token Usage Summary */}
        <div className="mt-4 pt-3 border-t border-[#3a3020]">
          <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-2">Session Statistics</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-[#1a1510] rounded">
              <div className="text-[#7a5f20]">Gemini Tokens</div>
              <div className="text-blue-400 font-bold">{tokenUsage.gemini.total.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="rules" className="flex-1 overflow-y-auto p-3 m-0 text-sm text-[#9a8860] leading-relaxed min-h-0">
        <h3 className="text-[#c9a84c] mb-2 text-base" style={{ fontFamily: 'Cinzel, serif' }}>HOW IT WORKS</h3>
        <p><strong className="text-[#9a8860]">Gemini 2.5 Flash</strong> is your DM — narrates in Neil Gaiman style, controls all NPCs, enforces D&D 5e + DDG rules.</p>
        <p className="mt-2"><strong className="text-[#9a8860]">You</strong> control one PC per turn — the one the story determines is most relevant.</p>

        <h3 className="text-[#c9a84c] mt-4 mb-2 text-base" style={{ fontFamily: 'Cinzel, serif' }}>ALIGNMENT RULES</h3>
        <p>Lawful Good: Cannot deceive, betray, or harm innocents.</p>
        <p>Chaotic Evil: Always acts in self-interest first.</p>
        <p>Neutral: Weighs cost vs. benefit each turn.</p>

        <h3 className="text-[#c9a84c] mt-4 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>NEW FEATURES</h3>
        <p>• <strong>Party Selection</strong>: Choose your starting heroes</p>
        <p>• <strong>Inventory</strong>: Collect and use items</p>
        <p>• <strong>Quest Tracking</strong>: Follow objectives</p>
        <p>• <strong>Save/Load</strong>: Multiple save slots</p>
      </TabsContent>
    </Tabs>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE TABS — Compact view
// ═══════════════════════════════════════════════════════════════════════════

function MobileTabs({ gameState, activeTab, setActiveTab, expandedNPC, setExpandedNPC, setSelectedPortrait, setPortraitModalOpen, tokenUsage }: {
  gameState: GameState
  activeTab: string
  setActiveTab: (tab: string) => void
  expandedNPC: string | null
  setExpandedNPC: (id: string | null) => void
  setSelectedPortrait: (portrait: CharacterPortrait | null) => void
  setPortraitModalOpen: (open: boolean) => void
  tokenUsage: { gemini: { input: number; output: number; total: number }; lastCall: { api: string; input: number; output: number } }
}) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
      <TabsList className="flex border-b border-[#2e2008] bg-transparent">
        <TabsTrigger value="pcs" className="flex-1 text-sm py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">PCs</TabsTrigger>
        <TabsTrigger value="npcs" className="flex-1 text-sm py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">NPCs</TabsTrigger>
        <TabsTrigger value="quests" className="flex-1 text-sm py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">Quests</TabsTrigger>
        <TabsTrigger value="prophecies" className="flex-1 text-sm py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">📜</TabsTrigger>
        <TabsTrigger value="logs" className="flex-1 text-sm py-3 data-[state=active]:text-[#c9a84c] data-[state=active]:border-b-2 data-[state=active]:border-[#c9a84c]">Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="pcs" className="p-3 m-0">
        {gameState.pcs.map(pc => (
          <React.Fragment key={pc.id}>
            <Card className={`mb-3 ${pc.dead ? 'opacity-30' : ''} ${pc.id === gameState.humanPCId ? 'border-2 border-[#d4af37]' : 'border border-[#4a4030]'}`}>
              <CardHeader className="p-3 bg-gradient-to-r from-[rgba(60,45,15,.5)] to-[rgba(30,25,15,.3)]">
                <CardTitle className="text-base text-[#d4af37] font-name">
                  {pc.name.replace(/\s*\([^)]*\)/g, '')} {pc.id === gameState.humanPCId && <span className="text-xs text-[#f0c860]">[YOU]</span>}
                </CardTitle>
                <CardDescription className="text-xs text-[#a08060]">{pc.epithet || pc.pantheon}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 text-sm space-y-2">
                <div className="flex justify-between"><span className="text-[#8a7040]">HP</span><span className={`font-bold ${hpCls(pc.hp, pc.maxHp)}`}>{Math.max(0, pc.hp)}/{pc.maxHp}</span></div>
                <div className="flex justify-between"><span className="text-[#8a7040]">AC</span><span className="text-[#f0e0c0] font-bold">{pc.AC}</span></div>
                <div className="flex justify-between"><span className="text-[#8a7040]">Align</span><span className="text-sm" style={{ color: aCol(pc.align) }}>{pc.align}</span></div>
                <div className="flex justify-between">
                  <span className="text-[#8a7040]">Fight?</span>
                  <span className="font-bold text-sm" style={{ color: gameState.pcAgreements[pc.id] === true ? '#50c050' : gameState.pcAgreements[pc.id] === false ? '#c05050' : '#8a7040' }}>
                    {gameState.pcAgreements[pc.id] === true ? 'Agreed' : gameState.pcAgreements[pc.id] === false ? 'Refused' : 'Undecided'}
                  </span>
                </div>
              </CardContent>
            </Card>
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
        ))}
      </TabsContent>

      <TabsContent value="npcs" className="p-3 m-0">
        {gameState.activeNPCs.length === 0 ? (
          <p className="text-sm text-[#5a4d30] italic">No gods in current scene</p>
        ) : (
          gameState.activeNPCs.map(npc => {
            const npcColor = npc.category === 'greater_gods' ? '#e8b040' : npc.category === 'lesser_gods' ? '#b0a060' : '#a06060'
            const npcType = npc.category === 'greater_gods' ? 'Greater God' : npc.category === 'lesser_gods' ? 'Lesser God' : npc.type === 'monster' ? 'Monster' : 'Entity'
            return (
              <Card 
                key={npc.id} 
                className={`mb-3 cursor-pointer transition-all border border-[#4a4030] ${npc.dead ? 'opacity-30' : ''}`}
                style={{ borderLeftWidth: '4px', borderLeftColor: npcColor }}
                onClick={() => setExpandedNPC(expandedNPC === npc.id ? null : npc.id)}
              >
                <CardHeader className="p-3 bg-gradient-to-r from-[rgba(60,45,15,.5)] to-[rgba(30,25,15,.3)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {npc.category === 'greater_gods' && <Crown className="w-4 h-4" style={{ color: npcColor }} />}
                      {npc.category === 'lesser_gods' && <Star className="w-4 h-4" style={{ color: npcColor }} />}
                      {npc.type === 'monster' && <Skull className="w-4 h-4" style={{ color: npcColor }} />}
                      <CardTitle className="text-sm font-name" style={{ color: npcColor }}>
                        {npc.name}
                      </CardTitle>
                    </div>
                    <span className="text-xs text-[#5a4d30]">{expandedNPC === npc.id ? '▼' : '▶'}</span>
                  </div>
                  <CardDescription className="text-xs text-[#a08060] font-narrative">{npc.title || npcType} · {npc.pantheon}</CardDescription>
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
                {expandedNPC === npc.id && (
                  <div className="border-t border-[#3a3020] p-3 bg-[#0d0a08]/50">
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
          })
        )}
      </TabsContent>

      <TabsContent value="quests" className="p-3 m-0">
        {gameState.quests.map(quest => (
          <Card key={quest.id} className={`mb-3 ${quest.status === 'completed' ? 'opacity-50' : ''}`} style={{ borderColor: quest.type === 'main' ? '#c9a84c' : '#5a4018' }}>
            <CardHeader className="p-3">
              <div className="flex items-center gap-2">
                {quest.type === 'main' ? <Star className="w-4 h-4 text-[#c9a84c]" /> : <ScrollText className="w-4 h-4 text-[#5a4018]" />}
                <CardTitle className="text-base text-[#c9a84c]">{quest.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 text-sm space-y-2">
              <p className="text-[#9a8860]">{quest.description}</p>
              {quest.objectives.map((obj, idx) => (
                <div key={idx} className={`flex items-center gap-2 text-sm ${obj.completed ? 'text-[#4a9060]' : 'text-[#5a4d30]'}`}>
                  {obj.completed ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-[#5a4d30]" />}
                  {obj.text}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
      
      {/* Mobile Prophecies Tab */}
      <TabsContent value="prophecies" className="p-3 m-0">
        <h3 className="text-[#c9a84c] mb-3 text-sm flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <ScrollText className="w-4 h-4" /> Prophecies
        </h3>
        {gameState.prophecies.length === 0 ? (
          <p className="text-[#5a4d30] italic text-sm">No prophecies have been revealed yet...</p>
        ) : (
          <div className="space-y-3">
            {gameState.prophecies.map(prophecy => {
              const pc = gameState.pcs.find(p => p.id === prophecy.pc_id)
              return (
                <Card key={prophecy.pc_id} className={`bg-[#1a1510] border-[#3a3020] ${pc?.dead ? 'opacity-50' : ''}`}>
                  <CardHeader className="p-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm text-[#d4af37]">
                        {pc?.name || 'Unknown'}
                        {pc?.dead && <span className="text-[#c05050] ml-2 text-xs">(DEAD)</span>}
                      </CardTitle>
                      <Badge className="bg-[#2a1a30] text-[#c090d0] text-[10px]">{prophecy.state}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-xs text-[#a08060] italic leading-relaxed">
                      &ldquo;{prophecy.riddle.slice(0, 150)}{prophecy.riddle.length > 150 ? '...' : ''}&rdquo;
                    </div>
                    {prophecy.previous_holders.length > 0 && (
                      <div className="text-[10px] text-[#7a5f20] mt-2">
                        Previously held by {prophecy.previous_holders.length} fallen hero(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="logs" className="p-3 m-0">
        <h3 className="text-[#c9a84c] mb-3 text-sm flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <BookOpen className="w-4 h-4" /> Chronicle
        </h3>
        {gameState.log.length === 0 ? (
          <p className="text-[#5a4d30] italic text-sm">The story has not yet begun...</p>
        ) : (
          <div className="space-y-2">
            {gameState.log.slice().reverse().slice(0, 20).map((entry, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded border-l-2 text-xs ${
                  entry.type === 'combat' ? 'border-red-600 bg-red-950/20' :
                  entry.type === 'discovery' ? 'border-blue-500 bg-blue-950/20' :
                  entry.type === 'dialogue' ? 'border-purple-500 bg-purple-950/20' :
                  'border-[#5a4018] bg-[#1a1510]'
                }`}
              >
                <div className="text-[#7a5f20] text-[10px] uppercase tracking-wider mb-1">Turn {entry.turn}</div>
                <div className="text-[#c9a84c] font-narrative leading-relaxed">{entry.msg}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Token Usage Summary - Mobile */}
        <div className="mt-4 pt-3 border-t border-[#3a3020]">
          <h4 className="text-[#c9a84c] text-xs uppercase tracking-wider mb-2">Session Stats</h4>
          <div className="text-xs">
            <div className="p-2 bg-[#1a1510] rounded">
              <div className="text-[#7a5f20]">Gemini</div>
              <div className="text-blue-400 font-bold">{tokenUsage.gemini.total.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

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
        <div className="flex justify-between"><span className="text-[#8a7040] font-narrative">HP</span><span className={`font-bold ${hpCls(pc.hp, pc.maxHp)}`}>{Math.max(0, pc.hp)}/{pc.maxHp}</span></div>
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
              <Image
                src={getEntityPortrait(npc)}
                alt={npc.name}
                fill
                className="object-contain"
                unoptimized
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
