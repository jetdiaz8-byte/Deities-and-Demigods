'use client'

import React, { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Package, Save, Upload, Download, X as XIcon } from 'lucide-react'
import { VisualDiceRoll } from '@/components/game/GameComponents'
import { IntroScreen } from '@/components/game/IntroScreen'
import { PartySelectionScreen } from '@/components/game/PartySelectionScreen'
import { GameHeader } from '@/components/game/GameHeader'
import { ChoicePanel } from '@/components/game/ChoicePanel'
import { GameSidebar } from '@/components/game/GameSidebar'
import { GameDialogs } from '@/components/game/GameDialogs'
import { QuestJournalModal } from '@/components/game/QuestJournalModal'
import { CombatTracker } from '@/components/game/CombatTracker'
import { TestOfFaith } from '@/components/game/TestOfFaith'
import { AchievementNotificationQueue } from '@/components/game/AchievementNotification'
import { AchievementsDialog } from '@/components/game/AchievementsDialog'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useGameAudio } from '@/hooks/useGameAudio'
import { getUnlockedCount, getTotalCount, getAchievementDef } from '@/lib/achievements'
import { version } from '../../package.json'

// ═══════════════════════════════════════════════════════════════════════════
// THIN ORCHESTRATOR — Routes to extracted screen components
// ═══════════════════════════════════════════════════════════════════════════

export default function MythworldEngine() {
  const {
    gameState, setGameState,
    geminiKey, setGeminiKey,
    gamePhase, setGamePhase,
    availableHeroes,
    selectedParty, setSelectedParty,
    previewHero, setPreviewHero,
    saveSlots,
    showSaveDialog, setShowSaveDialog,
    showLoadDialog, setShowLoadDialog,
    showInventoryDialog, setShowInventoryDialog,
    activeTab, setActiveTab,
    expandedPC, setExpandedPC,
    expandedNPC, setExpandedNPC,
    narrativeContent,
    shardDialogOpen, setShardDialogOpen,
    shardSummonName, setShardSummonName,
    sidebarOpen, setSidebarOpen,
    statusMessage,
    lastDMNarrative,
    portraitModalOpen, setPortraitModalOpen,
    selectedPortrait, setSelectedPortrait,
    ttsVoice, setTtsVoice,
    isSpeaking,
    tokenUsage,
    narrRef,
    // ── FUNCTIONS ──────────────────────────────────────────────────────────
    startNewCampaign,
    confirmPartySelection,
    loadGame,
    deleteSave,
    saveGame,
    selectOption,
    selectCompanionOption,
    confirmChoice,
    advanceTurn,
    exportStory,
    speakNarrative,
    stopSpeaking,
    invokeShard,
    handleUseItem,
    resolveTestOfFaith,
    // Combat Flash
    combatFlashType,
    // Achievement System
    achievementTracker,
    achievementUnlocks,
    showAchievementsDialog,
    setShowAchievementsDialog,
  } = useGameEngine()

  // ── AUDIO ENGINE ─────────────────────────────────────────────────────
  const audio = useGameAudio()

  // Combat flash overlay ref
  const flashRef = useRef<HTMLDivElement>(null)

  // Typing mode toggle for narrative reveal
  const [typingMode, setTypingMode] = React.useState(false)

  // Quest Journal modal state
  const [showQuestJournal, setShowQuestJournal] = React.useState(false)

  // Ember particle positions — generated once
  const emberPositions = useMemo(() =>
    Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 12}s`,
      delay: `${Math.random() * 10}s`,
      width: `${2 + Math.random() * 3}px`,
      height: `${2 + Math.random() * 3}px`,
    })),
  [])

  // Act-dependent atmosphere class
  const atmosphereClass = gameState.act === 'act1' ? 'atmosphere-act1' : gameState.act === 'act2' ? 'atmosphere-act2' : 'atmosphere-act3'

  // Day/night cycle based on turn count
  const timeOfDay = useMemo(() => {
    const cycle = gameState.turn % 40 // Full cycle every 40 turns
    if (cycle < 10) return 'time-dawn'
    if (cycle < 20) return 'time-day'
    if (cycle < 30) return 'time-dusk'
    return 'time-night'
  }, [gameState.turn])

  // Achievement notification handler
  const [processedAchievements, setProcessedAchievements] = useState<Set<string>>(new Set())
  const pendingAchievements = achievementUnlocks.filter(a => !processedAchievements.has(a.id))

  // ── TOAST NOTIFICATION SYSTEM ─────────────────────────────────────────
  const [toasts, setToasts] = React.useState<{ id: string; title: string; desc: string; icon: string }[]>([])

  const showToast = React.useCallback((title: string, desc: string, icon: string = '🏆') => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id, title, desc, icon }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  // Achievement toast — watch for newly unlocked achievements
  const lastAchievementCount = React.useRef(0)
  React.useEffect(() => {
    if (achievementUnlocks.length > lastAchievementCount.current && lastAchievementCount.current > 0) {
      const latest = achievementUnlocks[achievementUnlocks.length - 1]
      const def = getAchievementDef(latest.id)
      showToast(def?.name || 'Achievement Unlocked', def?.description || 'Something happened', '🏆')
    }
    lastAchievementCount.current = achievementUnlocks.length
  }, [achievementUnlocks, showToast])

  // ── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────
  // 1-9: Select PC action | A/B/C: Select companion action | Enter: Confirm
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle keys when game is active and waiting for input
      if (!gameState.waitingForHuman && !gameState.isProcessing && !gameState.ended) return

      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      const key = e.key.toUpperCase()

      // Number keys 1-9 select PC options
      if (key >= '1' && key <= '9' && gameState.waitingForHuman) {
        const idx = parseInt(key) - 1
        if (idx < gameState.humanOptions.length) {
          e.preventDefault()
          selectOption(idx)
          return
        }
      }

      // Letter keys A-C select companion options
      if (['A', 'B', 'C'].includes(key) && gameState.waitingForHuman && gameState.companionOptions.length > 0) {
        const idx = key.charCodeAt(0) - 65 // A=0, B=1, C=2
        if (idx < gameState.companionOptions.length) {
          e.preventDefault()
          selectCompanionOption(idx)
          return
        }
      }

      // Enter confirms choice or advances turn
      if (key === 'ENTER') {
        e.preventDefault()
        if (gameState.pendingHumanChoice !== null) {
          confirmChoice()
        } else if (!gameState.waitingForHuman && !gameState.isProcessing) {
          advanceTurn()
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameState.waitingForHuman, gameState.isProcessing, gameState.ended, gameState.humanOptions, gameState.companionOptions, gameState.pendingHumanChoice, gameState.pendingCompanionChoice, selectOption, selectCompanionOption, confirmChoice, advanceTurn])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Phase Routing
  // ═══════════════════════════════════════════════════════════════════════════

  // ── INTRO SCREEN ───────────────────────────────────────────────────────
  if (gamePhase === 'intro') {
    return (
      <IntroScreen
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        startNewCampaign={startNewCampaign}
        saveSlots={saveSlots}
        setShowLoadDialog={setShowLoadDialog}
      />
    )
  }

  // ── PARTY SELECTION SCREEN ─────────────────────────────────────────────
  if (gamePhase === 'party_select') {
    return (
      <PartySelectionScreen
        availableHeroes={availableHeroes}
        selectedParty={selectedParty}
        setSelectedParty={setSelectedParty}
        previewHero={previewHero}
        setPreviewHero={setPreviewHero}
        confirmPartySelection={confirmPartySelection}
        setGamePhase={setGamePhase}
        statusMessage={statusMessage}
      />
    )
  }

  // ── MAIN GAME UI ───────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#060403] flex flex-col" data-screen-root>
        {/* Screen Effects */}
        <style>{`
          @keyframes screen-flash-red {
            0% { box-shadow: inset 0 0 100px rgba(200,0,0,0.4); }
            100% { box-shadow: inset 0 0 0 transparent; }
          }
          @keyframes screen-flash-gold {
            0% { box-shadow: inset 0 0 100px rgba(200,170,50,0.3); }
            100% { box-shadow: inset 0 0 0 transparent; }
          }
          @keyframes screen-flash-green {
            0% { box-shadow: inset 0 0 80px rgba(0,180,80,0.3); }
            100% { box-shadow: inset 0 0 0 transparent; }
          }
          @keyframes screen-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px) translateY(2px); }
            40% { transform: translateX(4px) translateY(-2px); }
            60% { transform: translateX(-3px) translateY(1px); }
            80% { transform: translateX(3px); }
          }
          @keyframes screen-darken {
            0% { filter: brightness(0.3); }
            100% { filter: brightness(1); }
          }
          .screen-effect-red { animation: screen-flash-red 0.6s ease-out; }
          .screen-effect-gold { animation: screen-flash-gold 0.8s ease-out; }
          .screen-effect-green { animation: screen-flash-green 0.6s ease-out; }
          .screen-effect-shake { animation: screen-shake 0.4s ease-out; }
          .screen-effect-dark { animation: screen-darken 1.2s ease-out; }
        `}</style>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Special+Elite&display=swap');
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: none; }
          }
          @keyframes fadeOut {
            from { opacity: 1; transform: none; }
            to { opacity: 0; transform: translateY(-4px); }
          }
          @keyframes diceSpin {
            0% { transform: rotate(0deg) scale(1.05); }
            25% { transform: rotate(90deg) scale(.95); }
            50% { transform: rotate(180deg) scale(1.05); }
            75% { transform: rotate(270deg) scale(.95); }
            100% { transform: rotate(360deg) scale(1.05); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 10px rgba(212,175,55,0.3); }
            50% { box-shadow: 0 0 20px rgba(212,175,55,0.5); }
          }
          .die-spinning { animation: diceSpin .08s steps(1) infinite; }
          .turn-block { animation: fadeIn 0.45s ease; }
          .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
          ::-webkit-scrollbar { width: 5px; height: 4px; }
          ::-webkit-scrollbar-thumb { background: #7a5f20; border-radius: 3px; }
          ::-webkit-scrollbar-track { background: #110d07; }
        `}</style>

        {/* STICKY HEADER */}
        <GameHeader
          gameState={gameState}
          isSpeaking={isSpeaking}
          ttsVoice={ttsVoice}
          setTtsVoice={setTtsVoice}
          speakNarrative={speakNarrative}
          stopSpeaking={stopSpeaking}
          lastDMNarrative={lastDMNarrative}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setSelectedPortrait={setSelectedPortrait}
          setPortraitModalOpen={setPortraitModalOpen}
          sfxEnabled={audio.sfxEnabled}
          ambientEnabled={audio.ambientEnabled}
          volume={audio.volume}
          sfxVolume={audio.sfxVolume}
          ambientVolume={audio.ambientVolume}
          toggleSfx={audio.toggleSfx}
          toggleAmbient={audio.toggleAmbient}
          setVolume={audio.setVolume}
          setSfxVolume={audio.setSfxVolume}
          setAmbientVolume={audio.setAmbientVolume}
          achievementCount={getUnlockedCount(achievementTracker)}
          achievementTotal={getTotalCount()}
          onOpenAchievements={() => setShowAchievementsDialog(true)}
          onOpenQuestJournal={() => setShowQuestJournal(true)}
        />

        {/* Dice Rolls Display */}
        {gameState.lastDiceRolls.length > 0 && (
          <div className="px-3 py-2">
            {gameState.lastDiceRolls.map((roll, idx) => (
              <VisualDiceRoll
                key={idx}
                die={roll.die}
                roll={roll.roll}
                dc={roll.dc}
                success={roll.success}
                roller={roll.roller}
                notes={roll.notes}
              />
            ))}
          </div>
        )}

        {/* Main Content Area with Fixed Sidebar */}
        <div className="flex flex-1 relative">
          {/* Narrative Panel */}
          <div
            ref={narrRef}
            className={`flex-1 overflow-y-auto p-3 md:p-4 md:mr-80 scroll-smooth ${atmosphereClass}`}
            style={{ 
              background: gameState.act === 'act1' 
                ? 'rgba(6,4,3,.98)' 
                : gameState.act === 'act2' 
                  ? 'rgba(8,4,2,.98)' 
                  : 'rgba(12,2,2,.98)',
              transition: 'background 1s ease'
            }}
          >
            {/* Ornate Corners Wrapper */}
            <div className="relative">
              <span className="dragon-corner-tl">🐉</span>
              <span className="dragon-corner-br">🐉</span>
              {narrativeContent.map((item, idx) => {
                const isLast = idx === narrativeContent.length - 1
                if (typingMode && !isLast) {
                  return <div key={idx} dangerouslySetInnerHTML={{ __html: item.html }} style={{ opacity: 0.6 }} />
                }
                return <div key={idx} dangerouslySetInnerHTML={{ __html: item.html }} />
              })}
            </div>

            {/* Test of Faith Prompt */}
            <TestOfFaith
              gameState={gameState}
              resolveTestOfFaith={resolveTestOfFaith}
            />

            {/* Combat Tracker */}
            <CombatTracker gameState={gameState} />

            {/* Human Choice Panel */}
            <ChoicePanel
              gameState={gameState}
              selectOption={selectOption}
              selectCompanionOption={selectCompanionOption}
              confirmChoice={confirmChoice}
              setShardDialogOpen={setShardDialogOpen}
            />

            {/* Scroll anchor — auto-scroll targets this */}
            <div id="narrative-bottom" />
            {/* Fog of War Overlay */}
            <div className="fog-overlay" />
          </div>

          {/* Desktop Sidebar + Mobile Sheet Drawer */}
          <GameSidebar
            gameState={gameState}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            expandedPC={expandedPC}
            setExpandedPC={setExpandedPC}
            expandedNPC={expandedNPC}
            setExpandedNPC={setExpandedNPC}
            setSelectedPortrait={setSelectedPortrait}
            setPortraitModalOpen={setPortraitModalOpen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            saveSlots={saveSlots}
            tokenUsage={tokenUsage}
          />
        </div>

        {/* Bottom Bar */}
        <div className="flex gap-2 items-center p-2 bg-[#181208] border-t border-[#2e2008] flex-wrap relative z-[41] md:mr-80">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="md:hidden border-[#5a4018] text-[#9a8860]"
          >
            ☰ Menu
          </Button>

          <button
            onClick={() => setTypingMode(!typingMode)}
            className={`p-1.5 rounded text-xs transition-all ${typingMode ? 'text-[#d4af37] bg-[#2a2015]' : 'text-[#5a4d30] hover:text-[#8a7040]'}`}
            title={typingMode ? 'Typing mode ON' : 'Typing mode OFF'}
          >
            ✍️
          </button>

          <Button
            onClick={advanceTurn}
            disabled={gameState.ended || gameState.waitingForHuman || gameState.isProcessing}
            className="bg-gradient-to-b from-[#362200] to-[#1e1100] hover:from-[#502f00] hover:to-[#301a00] text-[#f0c860] border border-[#7a5f20]"
            style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.12em' }}
          >
            ⚡ Next Turn
          </Button>

          <span className="flex-1 text-xs text-[#5a4d30] italic truncate min-w-[150px]">{statusMessage}</span>

          {/* Key Status */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${geminiKey ? 'bg-[#40c080]' : 'bg-[#804040]'}`} />
            <span className="text-[10px] text-[#5a4d30]">Gem2.5</span>
          </div>
          <span className="text-[8px] text-[#3a3020]">v{version}</span>

          {/* Inventory Button */}
          <Button
            onClick={() => setShowInventoryDialog(true)}
            variant="outline"
            size="sm"
            className="border-[#5a4018] text-[#9a8860]"
          >
            <Package className="w-4 h-4 mr-1" />
            <Badge variant="secondary" className="ml-1 text-[10px]">{gameState.inventory.length}</Badge>
          </Button>

          {/* Save Button */}
          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            size="sm"
            className="border-[#5a4018] text-[#9a8860]"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>

          {/* Load Button */}
          <Button
            onClick={() => setShowLoadDialog(true)}
            variant="outline"
            size="sm"
            className="border-[#5a4018] text-[#9a8860]"
          >
            <Upload className="w-4 h-4 mr-1" /> Load
          </Button>

          {/* Export Button */}
          <Button
            onClick={exportStory}
            variant="outline"
            size="sm"
            className="border-[#5a4018] text-[#9a8860]"
          >
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>

          {/* API Key Input (bottom bar) */}
          <Input
            type="password"
            placeholder="Gemini key..."
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            className="w-40 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30] text-xs"
          />
        </div>

        {/* Achievement Toast Notifications */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="pointer-events-auto px-4 py-3 rounded-lg border border-[#d4af37]/50 bg-gradient-to-r from-[#2a2015] to-[#1a1510] shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center gap-3 animate-slide-in"
              style={{ animation: 'fadeIn 0.3s ease, fadeOut 0.3s ease 3.7s' }}
            >
              <span className="text-2xl">{toast.icon}</span>
              <div>
                <div className="font-title text-sm text-[#d4af37]">{toast.title}</div>
                <div className="text-xs text-[#a08060] font-narrative">{toast.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Combat Flash Overlay */}
        <div ref={flashRef} className={`combat-flash-overlay ${combatFlashType === 'damage' ? 'flash-damage' : combatFlashType === 'heal' ? 'flash-heal' : combatFlashType === 'crit' ? 'flash-crit' : ''}`} />

        {/* Atmospheric Vignette */}
        <div className="vignette-overlay" />

        {/* Day/Night Cycle Overlay */}
        <div className={`time-cycle-overlay ${timeOfDay}`} />

        {/* Floating Embers */}
        <div className="ember-container">
          {emberPositions.map((e, i) => (
            <div
              key={i}
              className="ember"
              style={{
                left: e.left,
                animationDuration: e.duration,
                animationDelay: e.delay,
                width: e.width,
                height: e.height,
              }}
            />
          ))}
        </div>

        {/* Quest Journal Modal */}
        <QuestJournalModal
          open={showQuestJournal}
          onOpenChange={setShowQuestJournal}
          gameState={gameState}
        />

        {/* All Dialogs */}
        <GameDialogs
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          saveSlots={saveSlots}
          saveGame={saveGame}
          showLoadDialog={showLoadDialog}
          setShowLoadDialog={setShowLoadDialog}
          loadGame={loadGame}
          deleteSave={deleteSave}
          showInventoryDialog={showInventoryDialog}
          setShowInventoryDialog={setShowInventoryDialog}
          handleUseItem={handleUseItem}
          shardDialogOpen={shardDialogOpen}
          setShardDialogOpen={setShardDialogOpen}
          shardSummonName={shardSummonName}
          setShardSummonName={setShardSummonName}
          invokeShard={invokeShard}
          portraitModalOpen={portraitModalOpen}
          setPortraitModalOpen={setPortraitModalOpen}
          selectedPortrait={selectedPortrait}
          setSelectedPortrait={setSelectedPortrait}
          gameState={gameState}
        />
      </div>

      {/* Achievement Notification Toasts */}
      <AchievementNotificationQueue
        unlockQueue={pendingAchievements}
        currentTurn={gameState.turn}
        onProcessed={(id) => setProcessedAchievements(prev => new Set(prev).add(id))}
      />

      {/* Achievements Dialog */}
      <AchievementsDialog
        open={showAchievementsDialog}
        onClose={() => setShowAchievementsDialog(false)}
        tracker={achievementTracker}
      />
    </TooltipProvider>
  )
}
