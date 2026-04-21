'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Package, Save, Upload, Download, X as XIcon } from 'lucide-react'
import DOMPurify from 'dompurify'

// H-11: Configure DOMPurify to allow safe HTML tags only (strip scripts, iframes, etc.)
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'a', 'hr', 'sub', 'sup'],
  ALLOWED_ATTR: ['class', 'style', 'href', 'data-name', 'data-shard'],
}

function sanitizeHtml(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, PURIFY_CONFIG)
  }
  // Server-side: basic regex strip (fallback, should never render server-side for this component)
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
import { HealthBar, NarrativeSection, TokenCounter, LoreGlossaryProvider } from '@/components/game/GameComponents'
import { IntroScreen } from '@/components/game/IntroScreen'
import { PartySelectionScreen } from '@/components/game/PartySelectionScreen'
import { GameHeader } from '@/components/game/GameHeader'
import { EquipmentTooltipProvider } from '@/components/game/EquipmentTooltip'
import PartyBar from '@/components/game/PartyBar'
import CharacterCard from '@/components/game/CharacterCard'
import CombatOverlay from '@/components/game/CombatOverlay'
import QuickeningOverlay from '@/components/game/QuickeningOverlay'
import AlignmentMeter from '@/components/game/AlignmentMeter'
import NPCRelationsPanel from '@/components/game/NPCRelationsPanel'
import { ALL_CHARACTERS } from '@/lib/characterData'
import type { Character } from '@/lib/characterTypes'
import { ChoicePanel } from '@/components/game/ChoicePanel'
import { GameSidebar } from '@/components/game/GameSidebar'
import { GameDialogs } from '@/components/game/GameDialogs'
import { QuestJournalModal } from '@/components/game/QuestJournalModal'
import { CombatTracker } from '@/components/game/CombatTracker'
import { TurnCardShowcase } from '@/components/game/TurnCardShowcase'
import { SidebarDiceArea } from '@/components/game/SidebarDiceArea'
import { TestOfFaith } from '@/components/game/TestOfFaith'
import { AchievementNotificationQueue } from '@/components/game/AchievementNotification'
import { AchievementsDialog } from '@/components/game/AchievementsDialog'
import { useGameEngine } from '@/hooks/useGameEngine'
import { useGameAudio } from '@/hooks/useGameAudio'
import { getUnlockedCount, getTotalCount, getAchievementDef } from '@/lib/achievements'
import { version } from '../../package.json'

const ComicPanel = dynamic(() => import('@/components/game/ComicPanel'), { ssr: false })

// ═══════════════════════════════════════════════════════════════════════════
// GAIMAN LOADING PAGE — Shown while engine initializes
// ═══════════════════════════════════════════════════════════════════════════
function GaimanLoadingPage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)' }}>
      <div className="text-center px-8 max-w-lg">
        <div className="mb-6">
          <span className="text-4xl block mb-4" style={{ filter: 'brightness(0.8)' }}>✦</span>
          <h1 className="text-2xl font-title tracking-widest mb-6" style={{ fontFamily: 'var(--font-title)', color: '#d4af37', textShadow: '0 0 30px rgba(212,175,55,0.3)' }}>
            BETWEEN WORLDS
          </h1>
        </div>
        <p className="text-base font-narrative italic leading-relaxed" style={{ color: '#6b5c4c', animation: 'pulse 3s ease-in-out infinite' }}>
          The threads of fate are still being woven...
        </p>
        <p className="text-sm mt-6 font-narrative" style={{ color: '#3d3530' }}>
          Between one world and the next, a story stirs...
        </p>
        <div className="mt-8 flex justify-center">
          <div className="w-px h-16" style={{ background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.4), transparent)' }} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE MORE MENU — Collapses secondary actions for small screens
// ═══════════════════════════════════════════════════════════════════════════
function MobileMoreMenu({ onInventory, onSave, onLoad, onExport, inventoryCount }: {
  onInventory: () => void
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  inventoryCount: number
}) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const close = React.useCallback(() => setOpen(false), [])

  return (
    <div ref={menuRef} className="relative lg:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center px-2 rounded text-xs text-[#9a8860] border border-[#5a4018] hover:bg-[#2a2015]"
        aria-label="More actions"
      >
        ⋮
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-44 rounded-lg border border-[#3a3020] bg-[#181208]/95 backdrop-blur-sm shadow-lg overflow-hidden z-[200]"
          role="menu"
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#9a8860] hover:bg-[#2a2015] hover:text-[#d4af37] transition-colors text-left"
            onClick={() => { close(); onInventory() }}
            role="menuitem"
          >
            <Package className="w-4 h-4" /> Inventory
            <Badge variant="secondary" className="ml-auto text-[10px]">{inventoryCount}</Badge>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#9a8860] hover:bg-[#2a2015] hover:text-[#d4af37] transition-colors text-left"
            onClick={() => { close(); onSave() }}
            role="menuitem"
          >
            <Save className="w-4 h-4" /> Save Game
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#9a8860] hover:bg-[#2a2015] hover:text-[#d4af37] transition-colors text-left"
            onClick={() => { close(); onLoad() }}
            role="menuitem"
          >
            <Upload className="w-4 h-4" /> Load Game
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#9a8860] hover:bg-[#2a2015] hover:text-[#d4af37] transition-colors text-left"
            onClick={() => { close(); onExport() }}
            role="menuitem"
          >
            <Download className="w-4 h-4" /> Export Chronicle
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MYTHWORLD ENGINE — Loaded via next/dynamic ssr:false in page.tsx
// No SSR guards needed — this component ONLY runs client-side.
// All browser APIs (localStorage, speechSynthesis, etc.) are safe here.
// ═══════════════════════════════════════════════════════════════════════════

export default function MythworldEngine() {
  const gameEngineResult = useGameEngine()

  // Null guard: if engine is not ready, show Gaiman-style loading page.
  // We pass the result as a prop to an inner component so hooks in the
  // inner component are always called in the same order regardless of
  // whether the engine is ready on the first render.
  if (!gameEngineResult) {
    return <GaimanLoadingPage />
  }

  // Pass engine result to inner component that holds all game hooks & UI
  return <MythworldEngineWithEngine result={gameEngineResult} />
}

/**
 * Inner engine component — receives a guaranteed-non-null gameEngineResult
 * so all hooks and destructuring run unconditionally on every render.
 */
function MythworldEngineWithEngine({ result }: { result: NonNullable<ReturnType<typeof useGameEngine>> }) {
  const {
    gameState,
    setGameState,
    openrouterKey, setOpenrouterKey,
    aiProvider, setAiProvider,
    engineMode, setEngineMode,
    lmStudioUrl, setLmStudioUrl,
    lmStudioModel, setLmStudioModel,
    comicMode, setComicMode,
    comicPanels,
    comicArtStyle, setComicArtStyle,
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
    diceRollsForDisplay,
    lastTurnReadyTime,
    portraitModalOpen, setPortraitModalOpen,
    selectedPortrait, setSelectedPortrait,
    ttsVoice, setTtsVoice,
    ttsEngine, setTtsEngine,
    browserVoices, browserVoiceName, setBrowserVoiceName,
    isSpeaking,
    tokenUsage,
    conversationHistory,
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
    unlockTTS,
    triggerPendingTTSFromUserGesture,
    stopSpeaking,
    invokeShard,
    handleUseItem,
    resolveTestOfFaith,
    buildDMSystem,
    combatState,
    setCombatState,
    combatOverlayMinimized,
    setCombatOverlayMinimized,
    questJournal,
    consequenceState,
    quickeningState,
    handlePowerChosen,
    dismissQuickening,
    rippleEcho,
    // Combat Flash
    combatFlashType,
    // Achievement System
    achievementTracker,
    achievementUnlocks,
    showAchievementsDialog,
    setShowAchievementsDialog,
  } = result

  // ── AUDIO ENGINE ─────────────────────────────────────────────────────
  const audio = useGameAudio()

  // Combat flash overlay ref
  const flashRef = useRef<HTMLDivElement>(null)

  // Typing mode toggle for narrative reveal
  const [typingMode, setTypingMode] = React.useState(false)
  const [showFullNarration, setShowFullNarration] = React.useState(false)
  const [graveyardExpanded, setGraveyardExpanded] = React.useState<string | null>(null)

  // Quest Journal modal state
  const [showQuestJournal, setShowQuestJournal] = React.useState(false)
  const [galleryModalOpen, setGalleryModalOpen] = React.useState(false)
  const allGalleryCharacters = useMemo(() => {
    const validCategories = new Set(['greater-gods', 'demigods', 'heroes', 'krynn', 'lesser-gods', 'monsters'])
    const dedupe = new Set<string>()
    return ALL_CHARACTERS
      .filter(c => validCategories.has(c.category))
      .filter(c => {
        const key = `${c.category}:${c.id}`
        if (dedupe.has(key)) return false
        dedupe.add(key)
        return true
      })
  }, [])
  const [galleryQueue, setGalleryQueue] = useState<Character[]>([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryPlaying, setGalleryPlaying] = useState(true)

  // Deterministic ember positions prevent server/client hydration mismatch.
  const emberPositions = useMemo(() =>
    Array.from({ length: 15 }).map((_, i) => {
      const n1 = (i * 37 + 11) % 100
      const n2 = (i * 19 + 7) % 100
      const n3 = (i * 29 + 13) % 100
      const n4 = (i * 23 + 17) % 100
      const n5 = (i * 31 + 5) % 100
      return {
        left: `${n1}%`,
        duration: `${8 + (n2 / 100) * 12}s`,
        delay: `${(n3 / 100) * 10}s`,
        width: `${2 + (n4 / 100) * 3}px`,
        height: `${2 + (n5 / 100) * 3}px`,
      }
    }),
  [])

  // Act-dependent atmosphere class
  const atmosphereClass = gameState?.act === 'act1' ? 'atmosphere-act1' : gameState?.act === 'act2' ? 'atmosphere-act2' : 'atmosphere-act3'

  // Day/night cycle based on turn count
  const timeOfDay = useMemo(() => {
    const cycle = (gameState?.turn ?? 0) % 40 // Full cycle every 40 turns
    if (cycle < 10) return 'time-dawn'
    if (cycle < 20) return 'time-day'
    if (cycle < 30) return 'time-dusk'
    return 'time-night'
  }, [gameState?.turn])

  // Achievement notification handler
  const [processedAchievements, setProcessedAchievements] = useState<Set<string>>(new Set())
  const pendingAchievements = (achievementUnlocks ?? []).filter(a => !processedAchievements.has(a.id))
  const narrativeCount = (narrativeContent ?? []).length
  const latestNarrativeHtml = (narrativeContent ?? [])[Math.max(0, narrativeCount - 1)]?.html || ''
  const latestNarrativeText = useMemo(
    () => latestNarrativeHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    [latestNarrativeHtml],
  )
  // v2.24.0: Stabilize collapse — only toggle when the user hasn't already expanded
  const [userExpanded, setUserExpanded] = React.useState(false)
  // Reset userExpanded when turn changes (new narration)
  React.useEffect(() => {
    setUserExpanded(false)
    setShowFullNarration(false)
  }, [narrativeCount])
  const shouldCollapseNarration = latestNarrativeText.length > 1200 && !userExpanded
  const handleToggleNarration = React.useCallback(() => {
    setUserExpanded(prev => !prev)
    setShowFullNarration(prev => !prev)
  }, [])
  const shuffleCharacters = React.useCallback((items: Character[]) => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }, [])
  useEffect(() => {
    if (!allGalleryCharacters.length) return
    const t = window.setTimeout(() => {
      setGalleryQueue(shuffleCharacters(allGalleryCharacters))
      setGalleryIndex(0)
    }, 0)
    return () => window.clearTimeout(t)
  }, [allGalleryCharacters, shuffleCharacters])
  useEffect(() => {
    if (!galleryPlaying || !galleryQueue.length) return
    const t = window.setInterval(() => {
      setGalleryIndex(prev => {
        const next = prev + 1
        if (next < galleryQueue.length) return next
        setGalleryQueue(shuffleCharacters(allGalleryCharacters))
        return 0
      })
    }, 5000)
    return () => window.clearInterval(t)
  }, [galleryPlaying, galleryQueue.length, shuffleCharacters, allGalleryCharacters])
  const galleryCharacter = galleryQueue[galleryIndex] || allGalleryCharacters[0] || null
  const galleryNext = React.useCallback(() => {
    setGalleryIndex(prev => (galleryQueue.length ? (prev + 1) % galleryQueue.length : 0))
  }, [galleryQueue.length])
  const galleryPrev = React.useCallback(() => {
    setGalleryIndex(prev => (galleryQueue.length ? (prev - 1 + galleryQueue.length) % galleryQueue.length : 0))
  }, [galleryQueue.length])

  // ── TOAST NOTIFICATION SYSTEM ─────────────────────────────────────────
  const [toasts, setToasts] = React.useState<{ id: string; title: string; desc: string; icon: string }[]>([])
  const [relationNotifs, setRelationNotifs] = React.useState<Array<{ id: string; name: string; delta: number }>>([])
  const prevRelationsRef = React.useRef<Record<string, number>>({})
  const [pathHintExpanded, setPathHintExpanded] = React.useState(false)
  const latestChoice = consequenceState?.choices?.[0]
  const showPathHint = !!latestChoice?.alternatives?.length && (gameState?.turn - (latestChoice?.turn || 0) <= 2)

  const showToast = React.useCallback((title: string, desc: string, icon: string = '\uD83C\uDFC6') => {
    const id = `toast-${Date.now()}`
    setToasts(prev => [...prev, { id, title, desc, icon }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  // Achievement toast — watch for newly unlocked achievements
  const lastAchievementCount = React.useRef(0)
  React.useEffect(() => {
    if ((achievementUnlocks?.length ?? 0) > lastAchievementCount.current && lastAchievementCount.current > 0) {
      const latest = achievementUnlocks[achievementUnlocks.length - 1]
      const def = getAchievementDef(latest.id)
      showToast(def?.name || 'Achievement Unlocked', def?.description || 'Something happened', '\uD83C\uDFC6')
    }
    lastAchievementCount.current = achievementUnlocks?.length ?? 0
  }, [achievementUnlocks, showToast])

  const handleConfirmChoice = React.useCallback((customText?: string) => {
    triggerPendingTTSFromUserGesture()
    confirmChoice(customText)
  }, [triggerPendingTTSFromUserGesture, confirmChoice])

  const handleAdvanceTurn = React.useCallback(() => {
    unlockTTS()
    triggerPendingTTSFromUserGesture()
    advanceTurn()
  }, [unlockTTS, triggerPendingTTSFromUserGesture, advanceTurn])

  useEffect(() => {
    const prev = prevRelationsRef.current
    const next: Record<string, number> = {}
    for (const r of (consequenceState?.npcRelations || [])) {
      next[r.npcId] = r.affinity
      const old = prev[r.npcId]
      if (typeof old === 'number' && old !== r.affinity) {
        const delta = r.affinity - old
        const id = `${r.npcId}-${Date.now()}`
        setRelationNotifs(curr => [...curr, { id, name: r.npcName, delta }].slice(-5))
        window.setTimeout(() => setRelationNotifs(curr => curr.filter(n => n.id !== id)), 3000)
      }
    }
    prevRelationsRef.current = next
  }, [consequenceState?.npcRelations])

  const submitQuickAction = React.useCallback((text: string) => {
    confirmChoice(text)
  }, [confirmChoice])


  // ── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────
  // 1-9: Select PC action | A/B/C: Select companion action | Enter: Confirm
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only handle keys when game is active and waiting for input
      if (!gameState?.waitingForHuman && !gameState?.isProcessing && !gameState?.ended) return

      // Don't trigger if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return

      const key = e.key.toUpperCase()

      // Number keys 1-9 select PC options
      if (key >= '1' && key <= '9' && gameState?.waitingForHuman) {
        const idx = parseInt(key) - 1
        if (idx < (gameState?.humanOptions ?? []).length) {
          e.preventDefault()
          selectOption(idx)
          return
        }
      }

      // Letter keys A-C select companion options
      if (['A', 'B', 'C'].includes(key) && gameState?.waitingForHuman && (gameState?.companionOptions ?? []).length > 0) {
        const idx = key.charCodeAt(0) - 65 // A=0, B=1, C=2
        if (idx < (gameState?.companionOptions ?? []).length) {
          e.preventDefault()
          selectCompanionOption(idx)
          return
        }
      }

      // Enter confirms choice or advances turn
      if (key === 'ENTER') {
        e.preventDefault()
        if (gameState?.pendingHumanChoice !== null && gameState?.pendingHumanChoice !== undefined) {
          handleConfirmChoice()
        } else if (!gameState?.waitingForHuman && !gameState?.isProcessing) {
          handleAdvanceTurn()
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [gameState?.waitingForHuman, gameState?.isProcessing, gameState?.ended, gameState?.humanOptions, gameState?.companionOptions, gameState?.pendingHumanChoice, gameState?.pendingCompanionChoice, selectOption, selectCompanionOption, handleConfirmChoice, handleAdvanceTurn])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Phase Routing
  // ═══════════════════════════════════════════════════════════════════════════

  // ── INTRO SCREEN ───────────────────────────────────────────────────────
  if (gamePhase === 'intro') {
    return (
      <IntroScreen
        openrouterKey={openrouterKey}
        setOpenrouterKey={setOpenrouterKey}
        aiProvider={aiProvider}
        setAiProvider={setAiProvider}
        engineMode={engineMode}
        setEngineMode={setEngineMode}
        lmStudioUrl={lmStudioUrl}
        setLmStudioUrl={setLmStudioUrl}
        lmStudioModel={lmStudioModel}
        setLmStudioModel={setLmStudioModel}
        startNewCampaign={startNewCampaign}
        saveSlots={saveSlots}
        setShowLoadDialog={setShowLoadDialog}
        quickeningState={quickeningState}
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
      <EquipmentTooltipProvider>
      <LoreGlossaryProvider pcs={gameState?.pcs ?? []} activeNPCs={gameState?.activeNPCs ?? []} npcHistory={gameState?.npcHistory ?? []}>
      <div className="min-h-screen bg-[#060403] flex flex-col pb-28 lg:pb-0" data-screen-root onClickCapture={triggerPendingTTSFromUserGesture}>
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
          button, a, [role="button"], .fantasy-tooltip { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
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
          ttsEngine={ttsEngine}
          setTtsEngine={setTtsEngine}
          browserVoices={browserVoices}
          browserVoiceName={browserVoiceName}
          setBrowserVoiceName={setBrowserVoiceName}
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

        {/* Main Content Area with Right Panel */}
        <div className="flex flex-1 relative overflow-hidden mythworld-main-layout">
          {/* Narrative Panel */}
          <div
            ref={narrRef}
            className={`flex-1 min-w-0 overflow-y-auto p-2 sm:p-3 md:p-4 pb-6 md:pb-8 scroll-smooth ${atmosphereClass}`}
            style={{
              background: gameState?.act === 'act1'
                ? 'rgba(6,4,3,.98)'
                : gameState?.act === 'act2'
                  ? 'rgba(8,4,2,.98)'
                  : 'rgba(12,2,2,.98)',
              transition: 'background 1s ease'
            }}
          >
            {/* Ornate Corners Wrapper */}
            <div className="relative">
              <span className="dragon-corner-tl">🐉</span>
              <span className="dragon-corner-br">🐉</span>
              {(narrativeContent ?? []).map((item, idx) => {
                const isLast = idx === (narrativeContent ?? []).length - 1
                const collapseClass = isLast && shouldCollapseNarration && !showFullNarration
                  ? 'dm-narration-collapsed line-clamp-3 overflow-hidden'
                  : ''
                if (typingMode && !isLast) {
                  return <div key={idx} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.html) }} style={{ opacity: 0.6 }} />
                }
                return (
                  <div
                    key={isLast ? `turn-${idx}-last` : idx}
                    className={isLast ? `dm-narration-block scroll-parchment ${collapseClass}` : undefined}
                    style={isLast ? { position: 'relative' } : undefined}
                  >
                    <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.html) }} />
                  </div>
                )
              })}
              {shouldCollapseNarration && (
                <div className="mt-2 mb-3 text-center">
                  <button
                    onClick={handleToggleNarration}
                    className="min-h-[44px] px-4 py-2 text-xs rounded border text-[#5c3317] bg-[rgba(139,90,43,0.15)] border-[#b8956a] hover:bg-[rgba(139,90,43,0.25)] transition-all"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '.08em' }}
                  >
                    {showFullNarration ? 'Show less ▲' : 'Continue reading ▼'}
                  </button>
                </div>
              )}
              {(comicPanels ?? []).length > 0 && (
                <div className="-mx-2 sm:-mx-3 md:-mx-4 mt-4">
                  <ComicPanel panels={comicPanels} artStyle={comicArtStyle} />
                </div>
              )}
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
              confirmChoice={handleConfirmChoice}
              setShardDialogOpen={setShardDialogOpen}
              lastTurnReadyTime={lastTurnReadyTime}
            />

            {/* Scroll anchor — auto-scroll targets this */}
            <div id="narrative-bottom" />
            {/* Spacer for fixed bottom bars (PartyBar ~110px + BottomBar ~50px) */}
            <div style={{ height: '170px', flexShrink: 0 }} />
            {/* Fog of War Overlay */}
            <div className="fog-overlay" />
          </div>

          {/* Desktop Sidebar Icon Strip + Mobile Sheet Drawer */}
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
            onOpenQuestJournal={() => setShowQuestJournal(true)}
            conversationHistory={conversationHistory}
            comicMode={comicMode}
            setComicMode={setComicMode}
            comicArtStyle={comicArtStyle}
            setComicArtStyle={setComicArtStyle}
            dmSystemPrompt={buildDMSystem(gameState, true, false)}
            galleryCharacter={galleryCharacter as any}
            galleryPlaying={galleryPlaying}
            onGalleryTogglePlay={() => setGalleryPlaying(v => !v)}
            onGalleryNext={galleryNext}
            onGalleryPrev={galleryPrev}
            questJournal={questJournal}
            consequenceState={consequenceState}
            onTravelToLocation={(name: string) => submitQuickAction(`I travel to ${name}`)}
            quickeningState={quickeningState}
          />

          {/* Right Panel — Portrait Gallery + Dice Tray (desktop only) */}
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 mr-14 border-l border-[#2e2008] bg-[#0a0806]/95 sticky top-0 h-screen overflow-hidden">
            {/* Sticky top: Card Showcase */}
            <div className="flex-shrink-0 max-h-[45vh] overflow-y-auto">
              <TurnCardShowcase turn={gameState?.turn ?? 0} gameState={gameState} />
            </div>
            {/* Scrollable spacer / middle area */}
            <div className="flex-1 overflow-y-auto min-h-0" />
            {/* Sticky bottom: Dice Tray */}
            <div className="flex-shrink-0">
              <SidebarDiceArea diceRolls={diceRollsForDisplay ?? []} />
            </div>
          </div>
        </div>

        <PartyBar
          members={gameState?.pcs ?? []}
          activeId={gameState?.humanPCId}
          isProcessing={!!gameState?.isProcessing}
        />
        {combatState?.isActive && !combatOverlayMinimized && (
          <CombatOverlay
            combatState={combatState as any}
            gameState={gameState as any}
            lastDMNarrative={lastDMNarrative}
            onClose={() => setCombatOverlayMinimized(true)}
            onFlee={() => submitQuickAction('I attempt to flee from combat!')}
            onAction={submitQuickAction}
            onContinue={() => {
              setCombatState((prev: any) => ({ ...prev, isActive: false, victory: null }))
              setCombatOverlayMinimized(false)
            }}
            currentPower={quickeningState?.currentPower}
          />
        )}
        {/* Quickening Overlay */}
        {quickeningState?.pendingQuickening && (
          <QuickeningOverlay
            pendingQuickening={quickeningState.pendingQuickening}
            currentPower={quickeningState.currentPower}
            activeEcho={quickeningState.activeEcho}
            onPowerChosen={handlePowerChosen}
            onDismiss={dismissQuickening}
            legendTitle={quickeningState.currentLegendTitle}
          />
        )}
        {combatState?.isActive && combatOverlayMinimized && (
          <button className="combat-indicator" onClick={() => setCombatOverlayMinimized(false)}>
            <span>Combat R{combatState.round || 1}</span>
          </button>
        )}

        {(questJournal?.locations?.length || 0) >= 2 && (
          <button className="mini-map" onClick={() => { setSidebarOpen(true); setActiveTab('map') }}>
            {(questJournal.locations || []).map(loc => (
              <span key={loc.id} className={`mini-map-dot ${loc.isCurrentlyAt ? 'current' : ''}`} style={{ left: `${loc.x}%`, top: `${loc.y}%` }} />
            ))}
          </button>
        )}

        {/* Echo Indicator */}
        {quickeningState?.activeEcho && (
          <div className={`echo-indicator ${quickeningState.activeEcho.isConflicted ? 'conflicted' : ''}`} title={`${quickeningState.activeEcho.deityName} — ${quickeningState.activeEcho.influenceDirection} influence`}>
            {quickeningState.activeEcho.portrait ? (
              <img src={quickeningState.activeEcho.portrait} alt={quickeningState.activeEcho.deityName} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <span style={{ fontSize: 16 }}>{quickeningState.activeEcho.deityName.charAt(0)}</span>
            )}
            <div className="echo-indicator-tooltip">
              <div style={{ fontWeight: 'bold', color: '#d4a843' }}>{quickeningState.activeEcho.deityName}</div>
              <div>{quickeningState.activeEcho.influenceDirection} influence</div>
              {quickeningState.activeEcho.isConflicted && <div style={{ color: '#cc4444' }}>CONFLICTED ({quickeningState.activeEcho.conflictTurnsRemaining} turns)</div>}
            </div>
          </div>
        )}

        {/* S2-F8: Floating Speak Button — positioned above bottom bar (110px) + safe area + gap */}
        {lastDMNarrative && !gameState?.isProcessing && (
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking()
              } else {
                unlockTTS()
                speakNarrative()
              }
            }}
            aria-label={isSpeaking ? 'Stop narration' : 'Speak narration'}
            className={`fixed right-4 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
              isSpeaking
                ? 'bg-gradient-to-br from-red-800 to-red-900 border-2 border-red-500 shadow-[0_0_20px_rgba(220,50,50,0.4)]'
                : 'bg-gradient-to-br from-[#1a3040] to-[#0f2030] border-2 border-[#3a7a9a] shadow-[0_0_15px_rgba(60,140,180,0.3)] hover:shadow-[0_0_25px_rgba(60,140,180,0.5)]'
            }`}
            style={{ bottom: 'calc(110px + env(safe-area-inset-bottom, 0px) + 12px)' }}
            title={isSpeaking ? 'Stop narration' : 'Speak narration'}
          >
            {isSpeaking ? (
              <span className="text-red-200 text-xl">⏹</span>
            ) : (
              <span className="text-[#7ac0e0] text-xl">🔊</span>
            )}
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
        )}

        {/* S2-F2: Bottom Bar — fixed above PartyBar, accounts for safe-area */}
        <div className="flex gap-2 items-center p-2 bg-[#181208] border-t border-[#2e2008]" style={{ position: 'fixed', bottom: 'calc(0px + env(safe-area-inset-bottom, 0px) + 54px)', left: 0, right: 0, zIndex: 79, marginRight: undefined }}>
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="lg:hidden border-[#5a4018] text-[#9a8860] min-h-[44px]"
          >
            ☰ Menu
          </Button>

          <button
            onClick={() => setTypingMode(!typingMode)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded text-xs transition-all ${typingMode ? 'text-[#d4af37] bg-[#2a2015]' : 'text-[#5a4d30] hover:text-[#8a7040]'}`}
            title={typingMode ? 'Typing mode ON' : 'Typing mode OFF'}
          >
            ✍️
          </button>

          <Button
            onClick={handleAdvanceTurn}
            disabled={!!gameState?.ended || !!gameState?.waitingForHuman || !!gameState?.isProcessing}
            className="bg-gradient-to-b from-[#362200] to-[#1e1100] hover:from-[#502f00] hover:to-[#301a00] text-[#f0c860] border border-[#7a5f20] min-h-[44px]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '.12em' }}
          >
            ⚡ Next Turn
          </Button>

          <span className="flex-1 text-xs text-[#5a4d30] italic truncate min-w-0">{statusMessage}</span>

          {/* API Status */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${engineMode === 'dual' ? 'bg-[#a070f0]' : engineMode === 'openrouter' ? 'bg-[#40c080]' : 'bg-[#60a0f0]'}`} />
            <span className="text-[10px] text-[#5a4d30]">{engineMode === 'dual' ? 'Hybrid' : engineMode === 'openrouter' ? 'Cloud' : 'Local'}</span>
          </div>

          {/* Desktop: show all buttons directly */}
          <span className="text-[10px] text-[#3a3020] hidden lg:inline">v{version}</span>

          <Button
            onClick={() => setShowInventoryDialog(true)}
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex border-[#5a4018] text-[#9a8860] min-h-[44px]"
          >
            <Package className="w-4 h-4 mr-1" />
            <Badge variant="secondary" className="ml-1 text-[10px]">{gameState?.inventory?.length ?? 0}</Badge>
          </Button>

          <Button
            onClick={() => setShowSaveDialog(true)}
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex border-[#5a4018] text-[#9a8860] min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>

          <Button
            onClick={() => setShowLoadDialog(true)}
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex border-[#5a4018] text-[#9a8860] min-h-[44px]"
          >
            <Upload className="w-4 h-4 mr-1" /> Load
          </Button>

          <Button
            onClick={exportStory}
            variant="outline"
            size="sm"
            className="hidden lg:inline-flex border-[#5a4018] text-[#9a8860]"
          >
            <Download className="w-4 h-4 mr-1" /> Export Chronicle
          </Button>

          {/* Mobile: More menu */}
          <MobileMoreMenu
            onInventory={() => setShowInventoryDialog(true)}
            onSave={() => setShowSaveDialog(true)}
            onLoad={() => setShowLoadDialog(true)}
            onExport={exportStory}
            inventoryCount={gameState?.inventory?.length ?? 0}
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
        <div className="fixed right-4 top-20 z-[200] flex flex-col gap-2">
          {relationNotifs.map(n => (
            <div key={n.id} className={`relation-notification ${n.delta >= 0 ? 'positive' : 'negative'}`}>
              <div>{n.name}'s opinion {n.delta >= 0 ? 'improved' : 'declined'} ({n.delta >= 0 ? '+' : ''}{n.delta})</div>
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
        {galleryModalOpen && galleryCharacter && (
          <div className="gallery-modal" onClick={() => setGalleryModalOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} className="relative max-w-[360px] w-[92vw]">
              <button className="party-card-expand__close" onClick={() => setGalleryModalOpen(false)}>X</button>
              <CharacterCard character={galleryCharacter as any} />
              <div className="gallery-controls">
                <button onClick={galleryPrev}>‹</button>
                <button onClick={() => setGalleryPlaying(v => !v)}>{galleryPlaying ? 'Pause' : 'Play'}</button>
                <button onClick={galleryNext}>›</button>
              </div>
            </div>
          </div>
        )}

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
      </LoreGlossaryProvider>
      </EquipmentTooltipProvider>

      {/* Achievement Notification Toasts */}
      <AchievementNotificationQueue
        unlockQueue={pendingAchievements}
        currentTurn={gameState?.turn ?? 0}
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
