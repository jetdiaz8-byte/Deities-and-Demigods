'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Package, Save, Upload, Download } from 'lucide-react'
import { VisualDiceRoll } from '@/components/game/GameComponents'
import { IntroScreen } from '@/components/game/IntroScreen'
import { PartySelectionScreen } from '@/components/game/PartySelectionScreen'
import { GameHeader } from '@/components/game/GameHeader'
import { ChoicePanel } from '@/components/game/ChoicePanel'
import { GameSidebar } from '@/components/game/GameSidebar'
import { GameDialogs } from '@/components/game/GameDialogs'
import { TestOfFaith } from '@/components/game/TestOfFaith'
import { AchievementNotificationQueue } from '@/components/game/AchievementNotification'
import { AchievementsDialog } from '@/components/game/AchievementsDialog'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useGameAudio } from '@/hooks/useGameAudio'
import { getUnlockedCount, getTotalCount } from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// THIN ORCHESTRATOR — Routes to extracted screen components
// ═══════════════════════════════════════════════════════════════════════════

export default function MythworldEngine() {
  const {
    gameState, setGameState,
    geminiKey, setGeminiKey,
    groqKey, setGroqKey,
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
    confirmChoice,
    advanceTurn,
    exportStory,
    speakNarrative,
    stopSpeaking,
    invokeShard,
    handleUseItem,
    resolveTestOfFaith,
    // Achievement System
    achievementTracker,
    achievementUnlocks,
    showAchievementsDialog,
    setShowAchievementsDialog,
  } = useGameEngine()

  // ── AUDIO ENGINE ─────────────────────────────────────────────────────
  const audio = useGameAudio()

  // Achievement notification handler
  const [processedAchievements, setProcessedAchievements] = useState<Set<string>>(new Set())
  const pendingAchievements = achievementUnlocks.filter(a => !processedAchievements.has(a.id))

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Phase Routing
  // ═══════════════════════════════════════════════════════════════════════════

  // ── INTRO SCREEN ───────────────────────────────────────────────────────
  if (gamePhase === 'intro') {
    return (
      <IntroScreen
        geminiKey={geminiKey}
        setGeminiKey={setGeminiKey}
        groqKey={groqKey}
        setGroqKey={setGroqKey}
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
      <div className="min-h-screen bg-[#060403] flex flex-col">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&family=Special+Elite&display=swap');
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: none; }
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
            className="flex-1 overflow-y-auto p-3 md:p-4 md:mr-80"
            style={{ background: 'rgba(6,4,3,.98)' }}
          >
            {narrativeContent.map((item, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: item.html }} />
            ))}

            {/* Test of Faith Prompt */}
            <TestOfFaith
              gameState={gameState}
              resolveTestOfFaith={resolveTestOfFaith}
            />

            {/* Human Choice Panel */}
            <ChoicePanel
              gameState={gameState}
              selectOption={selectOption}
              confirmChoice={confirmChoice}
              setShardDialogOpen={setShardDialogOpen}
            />
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
        <div className="flex gap-2 items-center p-2 bg-[#181208] border-t border-[#2e2008] flex-wrap">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="md:hidden border-[#5a4018] text-[#9a8860]"
          >
            ☰ Menu
          </Button>

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
          <span className="text-[10px] text-[#5a4d30]">|</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${groqKey ? 'bg-[#40c080]' : 'bg-[#804040]'}`} />
            <span className="text-[10px] text-[#5a4d30]">Groq</span>
          </div>

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

          {/* API Key Inputs (bottom bar) */}
          <Input
            type="password"
            placeholder="Gemini key..."
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            className="w-32 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30] text-xs"
          />
          <Input
            type="password"
            placeholder="Groq key..."
            value={groqKey}
            onChange={e => setGroqKey(e.target.value)}
            className="w-28 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30] text-xs"
          />
        </div>

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
