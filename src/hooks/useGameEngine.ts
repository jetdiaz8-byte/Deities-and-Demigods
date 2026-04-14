'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  ProphecyState, Ability, Item, Quest, Injury, Entity, ShardEvent, DiceRoll, DamageDealt,
  StateUpdate, DMResponse, GameOption, AIChoice, SaveSlot, GameState, AntagonistClue, SuccessRateFactors,
  GreaterGodData, ShardType, InjuryTemplate, PlayerSkills, Aspect
} from '@/lib/gameTypes'
import { ACTS, SKILL_ABILITY_MAP } from '@/lib/gameTypes'
import { SHARD_NAMES, INJURY_TABLE, ITEM_TEMPLATES, ANTAGONIST_CLUES, OPENROUTER_MODEL, OPENROUTER_FALLBACK_MODELS, NPC_NAMES } from '@/lib/gameConstants'
import { createInitialState } from '@/lib/gameState'
import { toAscii, hpCls, rollDice, sleep, getNPCCategory, getAntagonist, generateId, calculateSuccessRate, calculateAlignmentHarmony, lookupEntity, getAbilityScore, getSkillModifier, performSkillCheck, spendFatePoint, earnFatePoint, addAspect, generateStartingAspects, calculateStamina, regenStamina, fullStaminaRestore, assignSkillProficiencies, inferClassesFromCharacter, clearEntityCache } from '@/lib/gameHelpers'
import { getRandomHeroes } from '@/lib/fallbackEntities'
import { KRYNN_HEROES, KRYNN_DEMIGODS } from '@/lib/krynnCharacters'
import { PROPHECIES, rollProphecies, getProphecyById, Prophecy } from '@/lib/prophecyData'
import { rollAntagonist, getAntagonistById, getAntagonistRival, generateBanishmentNarration, generateRivalSummonNarration, AntagonistCandidate, AntagonistRival } from '@/lib/antagonistPool'
import { ALL_CHARACTERS } from '@/lib/characterData'
import { toast } from '@/hooks/use-toast'
import type { CharacterPortrait } from '@/components/game/PortraitModal'
import { soundEvents } from '@/lib/soundEvents'
import { generateComicPanels, generatePanelImage, type ComicPanelData } from '@/lib/comicPanelGenerator'
import {
  createAchievementTracker,
  checkAchievements,
  getUnlockedCount,
  getTotalCount,
  serializeTracker,
  deserializeTracker,
  getAchievementDef,
  ACHIEVEMENT_DEFS,
  TIER_CONFIG,
  type AchievementTracker,
} from '@/lib/achievements'

interface CombatantTurn {
  id: string
  name: string
  portrait: string
  initiative: number
  hp: number
  maxHp: number
  ac: number
  isPlayer: boolean
  statusEffects: string[]
  isDead: boolean
}

interface CombatLogEntry {
  round: number
  actor: string
  action: string
  target?: string
  damage?: number
  damageType?: string
  isCritical: boolean
  result: 'hit' | 'miss' | 'save' | 'death' | 'heal' | 'flee'
  narration: string
}

interface CombatState {
  isActive: boolean
  round: number
  turnOrder: CombatantTurn[]
  currentTurnIndex: number
  phase: 'initiative' | 'player_turn' | 'enemy_turn' | 'resolution'
  log: CombatLogEntry[]
  victory: 'players' | 'enemies' | null
}

interface QuestObjective {
  text: string
  isCompleted: boolean
  isOptional: boolean
}

interface QuestEntry {
  id: string
  title: string
  description: string
  type: 'main' | 'side' | 'faction' | 'personal'
  status: 'active' | 'completed' | 'failed' | 'discovered'
  objectives: QuestObjective[]
  location?: string
  reward?: string
  givenBy?: string
  turnGiven: number
  turnCompleted?: number
}

interface WorldLocation {
  id: string
  name: string
  description: string
  type: 'city' | 'dungeon' | 'wilderness' | 'temple' | 'portal' | 'other'
  isDiscovered: boolean
  isCurrentlyAt: boolean
  x: number
  y: number
  connections: string[]
  questIds: string[]
  turnDiscovered: number
  dangerLevel: 1 | 2 | 3 | 4 | 5
  icon: string
}

interface QuestJournalState {
  quests: QuestEntry[]
  locations: WorldLocation[]
  totalQuestsCompleted: number
  totalLocationsDiscovered: number
}

interface MoralAlignment {
  axis_law_chaos: number
  axis_good_evil: number
  dominant: string
  title: string
}

interface NPCRelation {
  npcId: string
  npcName: string
  affinity: number
  trust: number
  status: 'stranger' | 'acquaintance' | 'friend' | 'ally' | 'rival' | 'enemy' | 'nemesis'
  lastInteraction: number
  history: { turn: number; action: string; affinityChange: number; trustChange: number }[]
}

interface ChoiceMoment {
  turn: number
  situation: string
  chosen: string
  alternatives: string[]
  immediateConsequence: string
  alignmentShift?: { law_chaos: number; good_evil: number }
  rippleTriggered: boolean
  rippleTurn?: number
  rippleDescription?: string
}

interface ConsequenceState {
  alignment: MoralAlignment
  npcRelations: NPCRelation[]
  choices: ChoiceMoment[]
  pendingRipples: ChoiceMoment[]
  totalChoicesMade: number
}

// ── QUICKENING SYSTEM TYPES ──────────────────────────────────────────────
interface AbsorbedPower {
  deityId: string
  deityName: string
  portrait: string
  powerName: string
  powerDescription: string
  powerType: 'offensive' | 'defensive' | 'utility' | 'support'
  attunement: number
  turnAbsorbed: number
  gambleResult: 'clean' | 'resistant' | 'rejection' | 'overload'
  pantheon: string
}

interface ActiveEcho {
  deityId: string
  deityName: string
  portrait: string
  personality: string
  influenceDirection: 'good' | 'evil' | 'chaotic' | 'lawful' | 'neutral'
  influenceStrength: number
  turnAbsorbed: number
  isConflicted: boolean
  conflictTurnsRemaining: number
  farewellQuote: string
}

interface AbsorptionRecord {
  turn: number
  deityId: string
  deityName: string
  portrait: string
  pantheon: string
  divineRank: number
  powerAbsorbed: string
  powerLost: string
  previousEchoName: string
  gambleResult: 'clean' | 'resistant' | 'rejection' | 'overload'
  echoFarewell: string
}

interface PowerOption {
  name: string
  description: string
  type: 'offensive' | 'defensive' | 'utility' | 'support'
  source: string
}

interface PendingQuickening {
  turn: number
  fallenId: string
  fallenName: string
  portrait: string
  pantheon: string
  divineRank: number
  powerOptions: PowerOption[]
  phase: 'offer' | 'absorbing' | 'complete'
}

interface QuickeningState {
  currentPower: AbsorbedPower | null
  activeEcho: ActiveEcho | null
  absorptionHistory: AbsorptionRecord[]
  totalDeityKills: number
  totalMonstersAbsorbed: number
  currentLegendTitle: string
  pendingQuickening: PendingQuickening | null
}

export function useGameEngine() {

  const deepClone = <T,>(value: T): T => {
    // Avoid in-place mutation of React state objects.
    // structuredClone is available in modern browsers; JSON fallback covers plain data.
    if (typeof structuredClone === 'function') return structuredClone(value)
    return JSON.parse(JSON.stringify(value)) as T
  }

  const safeLocalStorageGetItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const safeLocalStorageSetItem = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore — callers may toast on failure
    }
  }

  const safeLocalStorageRemoveItem = (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }

  // Screen effects — applies CSS class to body temporarily
  const triggerScreenEffect = (effectClass: string) => {
    if (typeof document === 'undefined') return
    const main = document.querySelector('[data-screen-root]') || document.body
    main.classList.remove(effectClass)
    // Force reflow
    void (main as HTMLElement).offsetWidth
    main.classList.add(effectClass)
    setTimeout(() => main.classList.remove(effectClass), 1500)
  }

  const [gameState, setGameState] = useState<GameState>(createInitialState())
  const [openrouterKey, setOpenrouterKey] = useState('')
  const [serverKey, setServerKey] = useState('')
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'lmstudio'>('openrouter')
  const [engineMode, setEngineMode] = useState<'openrouter' | 'lmstudio' | 'dual'>('openrouter')
  const [lmStudioUrl, setLmStudioUrl] = useState('http://localhost:1234')
  const [lmStudioModel, setLmStudioModel] = useState('default')
  const [comicMode, setComicMode] = useState<boolean>(false)
  const [comicPanels, setComicPanels] = useState<ComicPanelData[]>([])
  const [sceneImageByTurn, setSceneImageByTurn] = useState<Record<number, string>>({})
  const [comicArtStyle, setComicArtStyle] = useState<'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor'>('larry-elmore')
  const [settingsHydrated, setSettingsHydrated] = useState(false)

  const [gamePhase, setGamePhase] = useState<'intro' | 'party_select' | 'playing'>('intro')
  const [availableHeroes, setAvailableHeroes] = useState<Entity[]>([])
  const [selectedParty, setSelectedParty] = useState<string[]>([])
  const [previewHero, setPreviewHero] = useState<Entity | null>(null)  // Hero preview panel
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showQuestDialog, setShowQuestDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('pcs')
  const [expandedPC, setExpandedPC] = useState<string | null>(null) // For expandable PC cards
  const [expandedNPC, setExpandedNPC] = useState<string | null>(null) // For expandable NPC cards
  const [narrativeContent, setNarrativeContent] = useState<{ html: string }[]>([])
  const narrativeContentRef = useRef<{ html: string }[]>([]) // sync ref for dedup checks
  const [diceAnimation, setDiceAnimation] = useState<{ value: number; spinning: boolean } | null>(null)
  const [shardDialogOpen, setShardDialogOpen] = useState(false)
  const [shardSummonName, setShardSummonName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Awaiting the gods...')
  const [lastDMNarrative, setLastDMNarrative] = useState('')

  // Portrait Modal State
  const [portraitModalOpen, setPortraitModalOpen] = useState(false)
  const [selectedPortrait, setSelectedPortrait] = useState<CharacterPortrait | null>(null)
  // Conversation History for persistent DM memory
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  // ── TTS STATE ────────────────────────────────────────────────────────
  // Browser SpeechSynthesis is the primary engine — works everywhere, instant, no server needed.
  // Edge TTS (Microsoft Neural Voices) is a premium option via /api/tts endpoint.
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [ttsVoice, setTtsVoice] = useState('guy') // Edge TTS voice key
  const [ttsEngine, setTtsEngine] = useState<'browser' | 'edge'>('browser') // Browser is primary — reliable, instant
  const [ttsSpeed, setTtsSpeed] = useState(0.9)
  // TTS is opt-in — user clicks the floating Speak button to hear narration
  const [ttsPending, setTtsPending] = useState(false)
  const ttsPendingRef = useRef(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map())
  // Available browser voices — populated on mount
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([])
  const [browserVoiceName, setBrowserVoiceName] = useState<string>('')
  const [currentSpeechSentenceIndex, setCurrentSpeechSentenceIndex] = useState<number | null>(null)

  // Store the exact displayed narrative text for TTS
  const [displayedNarrative, setDisplayedNarrative] = useState('')

  // Timestamp when options became available — used for confirm button cooldown
  const [lastTurnReadyTime, setLastTurnReadyTime] = useState<number>(0)

  // Combat Flash Type — exported for page.tsx overlay
  const [combatFlashType, setCombatFlashType] = useState<'damage' | 'heal' | 'crit' | ''>('')
  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false,
    round: 0,
    turnOrder: [],
    currentTurnIndex: 0,
    phase: 'initiative',
    log: [],
    victory: null,
  })
  const [combatOverlayMinimized, setCombatOverlayMinimized] = useState(false)

  const [questJournal, setQuestJournal] = useState<QuestJournalState>({
    quests: [],
    locations: [],
    totalQuestsCompleted: 0,
    totalLocationsDiscovered: 0,
  })

  const [consequenceState, setConsequenceState] = useState<ConsequenceState>({
    alignment: { axis_law_chaos: 0, axis_good_evil: 0, dominant: 'True Neutral', title: 'Undecided Soul' },
    npcRelations: [],
    choices: [],
    pendingRipples: [],
    totalChoicesMade: 0,
  })

  const [rippleEcho, setRippleEcho] = useState<string | null>(null)

  // Quickening System State
  const [quickeningState, setQuickeningState] = useState<QuickeningState>({
    currentPower: null,
    activeEcho: null,
    absorptionHistory: [],
    totalDeityKills: 0,
    totalMonstersAbsorbed: 0,
    currentLegendTitle: 'Mortal',
    pendingQuickening: null,
  })

  const [achievementUnlocks, setAchievementUnlocks] = useState<Array<{ id: string; turn: number }>>([])
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN OPTIMIZATION FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Token Tracking State
  const [tokenUsage, setTokenUsage] = useState({
    openrouter: { input: 0, output: 0, total: 0 },
    lastCall: { api: '', input: 0, output: 0 }
  })

  // Synchronous ref for pre-JSON prose — avoids stale React state in renderResult
  const preJsonNarrativeRef = useRef('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Browser voice ref for cancel support
  const browserUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ttsUnlockedRef = useRef(false)

  // Synchronous ref — TTS can read this immediately after renderResult sets it
  const renderedNarrationRef = useRef('')

  // Dedicated TTS narration ref — ONLY set AFTER full JSON is parsed and DM narration is extracted.
  // This is the single source of truth for TTS. Never set during streaming.
  const ttsNarrationRef = useRef('')
  // Guard: hash of the last spoken TTS text — prevents re-speaking identical narration
  const lastSpokenHashRef = useRef('')
  const ttsTurnGuardRef = useRef(-1) // track which turn's TTS was last spoken
  const ttsCooldownUntilRef = useRef(0) // global cooldown: no new speech until this timestamp
  const speakingLockRef = useRef(false) // v2.27.0: prevents concurrent speakText calls (race condition fix)

  // Store player's chosen actions for display in turn history
  const lastPlayerChoiceRef = useRef<{ pcName: string; pcAction: string; pcAbility: string; compName?: string; compAction?: string; isFreeText: boolean } | null>(null)

  const combatQuietTurnsRef = useRef(0)

  // Accumulated dice rolls for the SidebarDiceArea component
  const allDiceRollsRef = useRef<DiceRoll[]>([])
  const [diceRollsForDisplay, setDiceRollsForDisplay] = useState<DiceRoll[]>([])

  // Achievement System State
  const achievementTrackerRef = useRef<AchievementTracker>(createAchievementTracker())

  const prevGameStateRef = useRef<GameState | null>(null)

  const narrRef = useRef<HTMLDivElement>(null)

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const abortSpeakRef = useRef(false)

  // Hydrate persisted settings after mount to avoid SSR/client mismatch.
  useEffect(() => {
    const savedMode = safeLocalStorageGetItem('mw_engineMode') as 'openrouter' | 'lmstudio' | 'dual' | null
    const savedUrl = safeLocalStorageGetItem('mw_lmStudioUrl')
    const savedModel = safeLocalStorageGetItem('mw_lmStudioModel')
    const savedComicMode = safeLocalStorageGetItem('mw_comicMode')
    const savedComicStyle = safeLocalStorageGetItem('mw_comicArtStyle') as 'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor' | null

    if (savedMode) setEngineMode(savedMode)
    if (savedUrl) setLmStudioUrl(savedUrl)
    if (savedModel) setLmStudioModel(savedModel)
    if (savedComicMode === 'true') setComicMode(true)
    if (savedComicStyle) setComicArtStyle(savedComicStyle)
    setSettingsHydrated(true)
  }, [])

  // Persist dual-engine settings to localStorage
  useEffect(() => { if (settingsHydrated) safeLocalStorageSetItem('mw_engineMode', engineMode) }, [engineMode, settingsHydrated])
  useEffect(() => { if (settingsHydrated) safeLocalStorageSetItem('mw_lmStudioUrl', lmStudioUrl) }, [lmStudioUrl, settingsHydrated])
  useEffect(() => { if (settingsHydrated) safeLocalStorageSetItem('mw_lmStudioModel', lmStudioModel) }, [lmStudioModel, settingsHydrated])
  useEffect(() => { if (settingsHydrated) safeLocalStorageSetItem('mw_comicMode', comicMode ? 'true' : 'false') }, [comicMode, settingsHydrated])
  useEffect(() => { if (settingsHydrated) safeLocalStorageSetItem('mw_comicArtStyle', comicArtStyle) }, [comicArtStyle, settingsHydrated])

  useEffect(() => {
    const raw = safeLocalStorageGetItem('mythworld_combat_state')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as CombatState
      setCombatState({ ...parsed, isActive: false, victory: null })
    } catch {
      // ignore invalid persisted data
    }
  }, [])
  useEffect(() => {
    safeLocalStorageSetItem('mythworld_combat_state', JSON.stringify(combatState))
  }, [combatState])

  useEffect(() => {
    const raw = safeLocalStorageGetItem('mythworld_quest_journal')
    if (!raw) return
    try {
      setQuestJournal(JSON.parse(raw) as QuestJournalState)
    } catch {
      // ignore invalid persisted data
    }
  }, [])
  useEffect(() => {
    safeLocalStorageSetItem('mythworld_quest_journal', JSON.stringify(questJournal))
  }, [questJournal])

  useEffect(() => {
    const raw = safeLocalStorageGetItem('mythworld_consequence_state')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as ConsequenceState
      const recomputed = computeAlignment(parsed.alignment.axis_law_chaos, parsed.alignment.axis_good_evil)
      setConsequenceState({
        ...parsed,
        alignment: { ...parsed.alignment, ...recomputed },
      })
    } catch {
      // ignore invalid persisted data
    }
  }, [])
  useEffect(() => {
    safeLocalStorageSetItem('mythworld_consequence_state', JSON.stringify(consequenceState))
  }, [consequenceState])

  // Quickening persistence
  useEffect(() => {
    try {
      const saved = safeLocalStorageGetItem('mythworld_quickening')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setQuickeningState(prev => ({
            currentPower: parsed.currentPower || null,
            activeEcho: parsed.activeEcho || null,
            absorptionHistory: parsed.absorptionHistory || [],
            totalDeityKills: parsed.totalDeityKills || 0,
            totalMonstersAbsorbed: parsed.totalMonstersAbsorbed || 0,
            currentLegendTitle: parsed.absorptionHistory ? computeLegendTitle(parsed.absorptionHistory) : prev.currentLegendTitle,
            pendingQuickening: null, // Never restore pending quickening
          }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      safeLocalStorageSetItem('mythworld_quickening', JSON.stringify({
        currentPower: quickeningState.currentPower,
        activeEcho: quickeningState.activeEcho,
        absorptionHistory: quickeningState.absorptionHistory,
        totalDeityKills: quickeningState.totalDeityKills,
        totalMonstersAbsorbed: quickeningState.totalMonstersAbsorbed,
      }))
    } catch {}
  }, [quickeningState.currentPower, quickeningState.activeEcho, quickeningState.absorptionHistory, quickeningState.totalDeityKills, quickeningState.totalMonstersAbsorbed])

  // ── BROWSER VOICE DETECTION ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
      setBrowserVoices(voices)
      if (voices.length > 0) {
        const preferred = [
          'Google UK English Male', 'Microsoft George Online', 'Microsoft Mark Online',
          'Daniel', 'Alex', 'Google US English', 'Microsoft David Desktop',
        ]
        let pick: SpeechSynthesisVoice | undefined = undefined
        for (const pref of ['Google UK English Male', 'Microsoft George Online', 'Microsoft Mark Online', 'Daniel', 'Alex', 'Google US English', 'Microsoft David Desktop']) {
          pick = voices.find(v => v.name === pref)
          if (pick) break
        }
        if (!pick) pick = voices.find(v => v.name.toLowerCase().includes('male'))
        if (!pick) pick = voices.find(v => !v.name.toLowerCase().includes('female'))
        if (!pick) pick = voices[0]
        if (pick) setBrowserVoiceName(pick.name)
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    const saved = safeLocalStorageGetItem('ddg_browser_voice')
    if (saved) setBrowserVoiceName(saved)
    const savedEngine = safeLocalStorageGetItem('ddg_tts_engine') as 'browser' | 'edge' | null
    // Default to browser — most reliable
    if (savedEngine === 'edge') {
      setTtsEngine('edge')
    } else {
      setTtsEngine('browser')
      safeLocalStorageSetItem('ddg_tts_engine', 'browser')
    }
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', loadVoices) }
  }, [])

  // ── LOAD KEYS FROM STORAGE ─────────────────────────────────────────────
  useEffect(() => {
    const savedKey = safeLocalStorageGetItem('mythworld_openrouter_key')
    if (savedKey) {
      setOpenrouterKey(savedKey)
      setServerKey(savedKey)
    } else {
      fetch('/api/get-key')
        .then(async r => {
          if (!r.ok) return null
          return r.json().catch(() => null)
        })
        .then(d => {
          if (d?.key && typeof d.key === 'string') {
            setServerKey(d.key)
            setOpenrouterKey(d.key)
            safeLocalStorageSetItem('mythworld_openrouter_key', d.key)
          }
        })
        .catch(() => {})
    }
    loadSaveSlots()
  }, [])

  useEffect(() => {
    if (openrouterKey && openrouterKey.trim()) {
      safeLocalStorageSetItem('mythworld_openrouter_key', openrouterKey.trim())
    }
  }, [openrouterKey])

  // Cleanup any pending audio fade interval on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
    }
  }, [])

  // ── AUTO SCROLL ────────────────────────────────────────────────────────
  useEffect(() => {
    // Clear any pending scroll to avoid stacking
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    // Delay scroll to ensure DOM has rendered new content
    scrollTimeoutRef.current = setTimeout(() => {
      // Try anchor-based scroll first (most reliable)
      const anchor = document.getElementById('narrative-bottom')
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'end' })
        return
      }
      // Fallback to ref-based scroll
      if (narrRef.current) {
        narrRef.current.scrollTo({ top: narrRef.current.scrollHeight, behavior: 'smooth' })
      }
    }, 200)
    return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current) }
  }, [narrativeContent])

  // Must run in user gesture context for Chrome/Safari autoplay policies.
  const warmupBrowserTTS = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    ttsUnlockedRef.current = true
    try {
      // Cancel any stuck speech first (Chrome bug where speech gets "stuck")
      window.speechSynthesis.cancel()
    } catch {
      // Keep silent
    }
  }

  // Quickening helper functions
  const computeLegendTitle = (history: AbsorptionRecord[]): string => {
    const kills = history.length
    if (kills === 0) return 'Mortal'
    if (kills === 1) return 'God-Slayer'
    if (kills === 2) return 'Divine Hunter'
    if (kills === 3) return "Pantheon's Bane"
    if (kills === 4) return 'The Quickening'
    if (kills >= 5 && kills <= 7) return 'Ascendant'
    if (kills >= 8 && kills <= 9) return 'Demiurge'
    if (kills >= 10) return 'God of God-Killers'
    return 'Mortal'
  }

  const shouldTriggerQuickening = (characterId: string): boolean => {
    try {
      const char = ALL_CHARACTERS.find((c: any) => c.id === characterId)
      if (!char) return false
      const rank = (char.divineRank || '').toLowerCase()
      if (rank.includes('greater') || rank.includes('lesser') || rank.includes('demigod')) return true
      if (char.phase1 || char.phase2 || char.phase3) return true
      return false
    } catch { return false }
  }

  const getPowerOptions = (characterId: string): PowerOption[] => {
    try {
      const char = ALL_CHARACTERS.find((c: any) => c.id === characterId)
      if (!char) return []
      const options: PowerOption[] = []
      const offensiveKeywords = /attack|strike|bolt|breath|slash|fire|ice|lightning|smite|blast|thunder/i
      const defensiveKeywords = /shield|ward|protect|armor|resist|barrier|fortif/i
      const utilityKeywords = /sight|teleport|invis|fly|sense|stealth|phase|gate|travel/i
      const supportKeywords = /heal|bless|boost|inspire|restore|cure|sanctuary/i

      const guessType = (name: string): 'offensive' | 'defensive' | 'utility' | 'support' => {
        if (offensiveKeywords.test(name)) return 'offensive'
        if (defensiveKeywords.test(name)) return 'defensive'
        if (utilityKeywords.test(name)) return 'utility'
        if (supportKeywords.test(name)) return 'support'
        return 'offensive'
      }

      if (char.abilities && char.abilities.length > 0) {
        for (const ability of char.abilities.slice(0, 5)) {
          options.push({
            name: ability,
            description: `A power drawn from ${char.name}'s essence: ${ability}`,
            type: guessType(ability),
            source: ability,
          })
        }
      }
      if (char.phase1) {
        options.push({ name: 'Phase 1 Attack', description: char.phase1.slice(0, 120), type: 'offensive', source: 'Phase 1' })
      }
      if (char.phase2) {
        options.push({ name: 'Phase 2 Power', description: char.phase2.slice(0, 120), type: guessType(char.phase2), source: 'Phase 2' })
      }
      if (char.phase3) {
        options.push({ name: 'Phase 3 Ultimate', description: char.phase3.slice(0, 120), type: 'offensive', source: 'Phase 3' })
      }
      // Return 2-3 most interesting options
      return options.slice(0, 3)
    } catch { return [] }
  }

  const handlePowerChosen = (option: PowerOption) => {
    if (!quickeningState.pendingQuickening) return
    const pending = quickeningState.pendingQuickening
    setQuickeningState(prev => ({
      ...prev,
      pendingQuickening: { ...pending, phase: 'absorbing' },
    }))
    confirmChoice(`I absorb the power: ${option.name}. The divine essence of ${pending.fallenName} flows into me.`)
  }

  const dismissQuickening = () => {
    setQuickeningState(prev => ({ ...prev, pendingQuickening: null }))
  }

  const triggerCombatFlash = (type: 'damage' | 'heal' | 'crit') => {
    setCombatFlashType(type)
    setTimeout(() => setCombatFlashType(''), 500)
  }

  // Token estimation helper (rough approximation: 1 token ≈ 4 characters)
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }
  
  // Update token usage tracking
  const updateTokenUsage = (inputText: string, outputText: string) => {
    const inputTokens = estimateTokens(inputText)
    const outputTokens = estimateTokens(outputText)
    
    setTokenUsage(prev => ({
      ...prev,
      openrouter: {
        input: prev.openrouter.input + inputTokens,
        output: prev.openrouter.output + outputTokens,
        total: prev.openrouter.total + inputTokens + outputTokens
      },
      lastCall: { api: 'openrouter', input: inputTokens, output: outputTokens }
    }))
    
    // Also update game state for persistence
    setGameState(prev => ({
      ...prev,
      dmTokensUsed: prev.dmTokensUsed + inputTokens + outputTokens
    }))
  }


  // ── SAVE/LOAD FUNCTIONS ────────────────────────────────────────────────
  const loadSaveSlots = () => {
    const slots: SaveSlot[] = []
    for (let i = 0; i < 5; i++) {
      const data = safeLocalStorageGetItem(`mythworld_save_${i}`)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          slots.push({
            id: `slot_${i}`,
            name: parsed.name || `Save ${i + 1}`,
            timestamp: parsed.timestamp || 0,
            turn: parsed.gameState?.turn || 0,
            act: parsed.gameState?.act || 'act1',
            partyNames: (parsed.gameState?.pcs || []).map((p: Entity) => p.name)
          })
        } catch {
          // Invalid save
        }
      }
    }
    setSaveSlots(slots)
  }

  const trimGameStateForSave = (gs: GameState): GameState => {
    // Keep gameplay-critical state; trim high-growth fields.
    // Avoid mutating in-memory game state by cloning first.
    const trimmed: GameState = deepClone(gs)
    if (Array.isArray(trimmed.log) && trimmed.log.length > 120) trimmed.log = trimmed.log.slice(-120)
    // Defensive: cap any other large arrays if present on the state object.
    // These are optional in type space; checks prevent TS errors while remaining safe at runtime.
    const maybe: Record<string, unknown> = trimmed as unknown as Record<string, unknown>
    const capArray = (key: string, max: number) => {
      const v = maybe[key]
      if (Array.isArray(v) && v.length > max) {
        maybe[key] = v.slice(-max)
      }
    }
    capArray('history', 50)
    capArray('narrative', 50)
    capArray('tokenUsage', 1)
    capArray('token_usage', 1)
    capArray('narrationHistory', 25)
    capArray('diceHistory', 50)
    return trimmed
  }

  const saveGame = (slotId: string, name: string) => {
    const slotNum = parseInt(slotId.split('_')[1] || '0')
    const saveData = {
      name,
      timestamp: Date.now(),
      gameState: trimGameStateForSave(gameState),
      conversationHistory: conversationHistory.slice(-20),
      ttsSettings: { enabled: ttsEnabled, voice: ttsVoice, speed: ttsSpeed, engine: ttsEngine, browserVoice: browserVoiceName },
      achievementTracker: serializeTracker(achievementTrackerRef.current),
    }
    try {
      safeLocalStorageSetItem(`mythworld_save_${slotNum}`, JSON.stringify(saveData))
      loadSaveSlots()
      toast({ title: 'Game Saved', description: `Saved to ${name}` })
      setShowSaveDialog(false)
    } catch (e: any) {
      toast({ title: 'Save Failed', description: 'Storage full. Try deleting old saves.', variant: 'destructive' })
    }
  }

  const loadGame = (slotId: string) => {
    const slotNum = parseInt(slotId.split('_')[1] || '0')
    const data = safeLocalStorageGetItem(`mythworld_save_${slotNum}`)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setGameState(deepClone({ ...createInitialState(), ...parsed.gameState }))
        setGamePhase('playing')
        setNarrativeContent([])
        narrativeContentRef.current = []
        setShowLoadDialog(false)
        // Restore DM memory so narration stays connected to past events
        if (Array.isArray(parsed.conversationHistory)) {
          setConversationHistory(parsed.conversationHistory)
        }
        // Restore TTS settings
        if (parsed.ttsSettings) {
          setTtsEnabled(parsed.ttsSettings.enabled)
          setTtsVoice(parsed.ttsSettings.voice)
          setTtsSpeed(parsed.ttsSettings.speed)
          if (parsed.ttsSettings.engine) setTtsEngine(parsed.ttsSettings.engine)
          if (parsed.ttsSettings.browserVoice) setBrowserVoiceName(parsed.ttsSettings.browserVoice)
        }
        // Restore achievement tracker
        if (parsed.achievementTracker) {
          const restored = deserializeTracker(parsed.achievementTracker)
          if (restored) {
            achievementTrackerRef.current = restored
            // Re-emit any unlocks so notification queue shows them
            const unlockedIds = Object.values(restored.records)
              .filter(r => r.unlocked)
              .map(r => r.id)
            // Deduplicate: only add achievements not already in state
            setAchievementUnlocks(prev => {
              const existingIds = new Set(prev.map(a => a.id))
              const fresh = unlockedIds
                .filter(id => !existingIds.has(id))
                .map(id => ({ id, turn: restored.records[id]?.unlockedAt || 0 }))
              return [...prev, ...fresh]
            })
          }
        }
        toast({ title: 'Game Loaded', description: 'Campaign restored successfully' })
      } catch {
        toast({ title: 'Error', description: 'Failed to load save', variant: 'destructive' })
      }
    }
  }

  const deleteSave = (slotId: string) => {
    const slotNum = parseInt(slotId.split('_')[1] || '0')
    safeLocalStorageRemoveItem(`mythworld_save_${slotNum}`)
    loadSaveSlots()
    toast({ title: 'Save Deleted' })
  }

  const getNarrationPreservationFallback = (gs: GameState, reason: string, narrativeOverride?: string): DMResponse => {
    const prose = (narrativeOverride || preJsonNarrativeRef.current || '').trim()
    const narration = prose && prose.length > 30 ? prose.slice(0, 2000) : 'The story pauses as the threads of fate tangle. Choose your next action.'
    console.warn('📝 Using narrative-preservation fallback:', reason)
    return {
      dm_narration: narration,
      story_summary: gs.storySummary || 'The adventure continues...',
      journey_so_far: gs.journeySoFar || '',
      npc_encounters: [],
      dice_rolls: [],
      damage_dealt: [],
      injury_events: [],
      state_updates: [],
      item_drops: [],
      quest_updates: [],
    }
  }

  // ── TTS FUNCTIONS ────────────────────────────────────────────────────────
  const splitTextIntoChunks = (text: string, maxLength = 1000): string[] => {
    const chunks: string[] = []
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    
    let currentChunk = ''
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence
      } else {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim())
    return chunks.length > 0 ? chunks : [text.slice(0, maxLength)]
  }

  const splitTextIntoSentences = (text: string): string[] => {
    const cleaned = text.replace(/\s+/g, ' ').trim()
    if (!cleaned) return []
    const split = cleaned
      .split(/(?:\.\s+(?=[A-Z])|\.\n+)/g)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (/[.!?]$/.test(s) ? s : `${s}.`))
    const chunked: string[] = []
    for (const sentence of (split.length ? split : [cleaned])) {
      if (sentence.length <= 150) {
        chunked.push(sentence)
        continue
      }
      const parts = sentence
        .split(/(?<=[,;—-])\s+/)
        .map(p => p.trim())
        .filter(Boolean)
      let bucket = ''
      for (const part of parts) {
        if (!bucket.length) {
          bucket = part
          continue
        }
        if (`${bucket} ${part}`.length <= 150) {
          bucket = `${bucket} ${part}`
        } else {
          chunked.push(bucket)
          bucket = part
        }
      }
      if (bucket) chunked.push(bucket)
    }
    return chunked.length ? chunked : [cleaned.slice(0, 150)]
  }

  const cleanNarrationForDisplay = (text: string): string => {
    let cleaned = toAscii(text || '')
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ')
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, ' ')
    cleaned = cleaned.replace(/\[[\s\S]*?\]/g, ' ')
    cleaned = cleaned.replace(/^\s*#{1,6}\s.*$/gm, ' ')
    cleaned = cleaned.replace(/\b(?:DC|modifier|outcome|dice rolls?)\b[^.]*\./gi, ' ')
    cleaned = cleaned.replace(/<[^>]+>/g, ' ')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    const firstPara = cleaned.split(/\n\n+/)[0]?.trim() || cleaned
    return firstPara
  }

  const computeAlignment = (lc: number, ge: number): { dominant: string; title: string } => {
    const lawChaos = lc >= 30 ? 'Lawful' : lc <= -30 ? 'Chaotic' : 'Neutral'
    const goodEvil = ge >= 30 ? 'Good' : ge <= -30 ? 'Evil' : 'Neutral'
    const dominant = lawChaos === 'Neutral' && goodEvil === 'Neutral' ? 'True Neutral' : `${lawChaos} ${goodEvil}`
    const magnitude = Math.abs(lc) + Math.abs(ge)
    let title = 'Undecided Soul'
    if (magnitude > 150) title = ge >= 0 ? 'Exalted Paragon' : 'Dread Tyrant'
    else if (magnitude > 100) title = ge >= 0 ? 'Righteous Champion' : 'Dark Overlord'
    else if (magnitude > 50) title = ge >= 0 ? 'Noble Hero' : 'Rising Villain'
    else if (magnitude > 20) title = 'Fated Wanderer'
    return { dominant, title }
  }

  const computeNPCStatus = (affinity: number): NPCRelation['status'] => {
    if (affinity >= 80) return 'ally'
    if (affinity >= 50) return 'friend'
    if (affinity >= 25) return 'acquaintance'
    if (affinity >= 5) return 'acquaintance'
    if (affinity <= -80) return 'nemesis'
    if (affinity <= -50) return 'enemy'
    if (affinity <= -25) return 'rival'
    return 'stranger'
  }

  const parseCombatData = (text: string): { cleanText: string; combatData: Partial<CombatState> } => {
    const m = text.match(/<combat_data>([\s\S]*?)<\/combat_data>/i)
    if (!m) {
      const combatKeywords = /\b(attack|slash|spell|hit|damage|hp|initiative|round|strike|blast)\b/i.test(text)
      return { cleanText: text, combatData: combatKeywords ? { isActive: combatState.isActive || true } : {} }
    }
    let parsed: any = null
    try { parsed = JSON.parse(m[1]) } catch { parsed = null }
    const cleanText = text.replace(m[0], '').trim()
    if (!parsed) return { cleanText, combatData: {} }
    const turnOrder: CombatantTurn[] = (parsed.turn_order || []).map((c: any) => ({
      id: c.id || c.portrait || c.name?.toLowerCase().replace(/\s+/g, '-') || generateId(),
      name: c.name || 'Unknown',
      portrait: c.portrait ? `/portraits/heroes/${c.portrait}.png` : '',
      initiative: Number(c.initiative || 0),
      hp: Number(c.hp || 0),
      maxHp: Number(c.max_hp || c.maxHp || 1),
      ac: Number(c.ac || 10),
      isPlayer: !!c.is_player,
      statusEffects: Array.isArray(c.status) ? c.status : [],
      isDead: Number(c.hp || 0) <= 0,
    }))
    const log: CombatLogEntry[] = (parsed.log || []).map((l: any) => ({
      round: Number(parsed.round || combatState.round || 1),
      actor: l.actor || 'Unknown',
      action: l.action || 'acts',
      target: l.target,
      damage: typeof l.damage === 'number' ? l.damage : undefined,
      damageType: l.damage_type,
      isCritical: !!l.critical,
      result: l.result || 'hit',
      narration: l.narration || `${l.actor || 'Someone'} ${l.action || 'acts'}`,
    }))
    return {
      cleanText,
      combatData: {
        isActive: true,
        round: Number(parsed.round || combatState.round || 1),
        turnOrder,
        currentTurnIndex: Number(parsed.current_turn || 0),
        phase: parsed.phase || 'resolution',
        log: [...combatState.log, ...log].slice(-80),
        victory: parsed.victory ?? null,
      },
    }
  }

  const parseQuestData = (text: string): { cleanText: string; questData: Partial<QuestJournalState> } => {
    const m = text.match(/<quest_data>([\s\S]*?)<\/quest_data>/i)
    if (!m) return { cleanText: text, questData: {} }
    let parsed: any = null
    try { parsed = JSON.parse(m[1]) } catch { parsed = null }
    const cleanText = text.replace(m[0], '').trim()
    if (!parsed) return { cleanText, questData: {} }
    const quests = [...questJournal.quests]
    const locations = [...questJournal.locations]
    let totalQuestsCompleted = questJournal.totalQuestsCompleted
    let totalLocationsDiscovered = questJournal.totalLocationsDiscovered
    for (const q of (parsed.quests || [])) {
      const idx = quests.findIndex(x => x.id === q.id)
      const normalized: QuestEntry = {
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type || 'side',
        status: q.status || 'active',
        objectives: (q.objectives || []).map((o: any) => ({ text: o.text, isCompleted: !!(o.completed ?? o.isCompleted), isOptional: !!(o.optional ?? o.isOptional) })),
        location: q.location,
        reward: q.reward,
        givenBy: q.givenBy,
        turnGiven: gameState.turn,
      }
      if (idx === -1) quests.push(normalized)
      else {
        const oldStatus = quests[idx].status
        quests[idx] = { ...quests[idx], ...normalized }
        if (normalized.status === 'completed' && oldStatus !== 'completed') totalQuestsCompleted += 1
      }
    }
    for (const l of (parsed.locations || [])) {
      const idx = locations.findIndex(x => x.id === l.id)
      const normalized: WorldLocation = {
        id: l.id,
        name: l.name,
        description: l.description,
        type: l.type || 'other',
        isDiscovered: !!l.discovered,
        isCurrentlyAt: !!l.current,
        x: Number(l.x ?? 50),
        y: Number(l.y ?? 50),
        connections: l.connections || [],
        questIds: l.questIds || [],
        turnDiscovered: gameState.turn,
        dangerLevel: Number(l.danger_level || 1) as 1 | 2 | 3 | 4 | 5,
        icon: l.icon || '📍',
      }
      if (normalized.isCurrentlyAt) {
        for (let i = 0; i < locations.length; i++) locations[i] = { ...locations[i], isCurrentlyAt: false }
      }
      if (idx === -1) {
        locations.push(normalized)
        totalLocationsDiscovered += 1
      } else {
        locations[idx] = { ...locations[idx], ...normalized }
      }
    }
    return { cleanText, questData: { quests, locations, totalQuestsCompleted, totalLocationsDiscovered } }
  }

  const parseConsequenceData = (text: string, currentTurn: number): { cleanText: string; consequenceData: Partial<ConsequenceState>; rippleNarration?: string } => {
    const m = text.match(/<consequence_data>([\s\S]*?)<\/consequence_data>/i)
    if (!m) return { cleanText: text, consequenceData: {} }
    let parsed: any = null
    try { parsed = JSON.parse(m[1]) } catch { parsed = null }
    const cleanText = text.replace(m[0], '').trim()
    if (!parsed) return { cleanText, consequenceData: {} }
    const next: ConsequenceState = deepClone(consequenceState)
    if (parsed.alignment_shift) {
      next.alignment.axis_law_chaos = Math.max(-100, Math.min(100, next.alignment.axis_law_chaos + Number(parsed.alignment_shift.law_chaos || 0)))
      next.alignment.axis_good_evil = Math.max(-100, Math.min(100, next.alignment.axis_good_evil + Number(parsed.alignment_shift.good_evil || 0)))
      const computed = computeAlignment(next.alignment.axis_law_chaos, next.alignment.axis_good_evil)
      next.alignment = { ...next.alignment, ...computed }
    }
    for (const r of (parsed.npc_relations || [])) {
      const idx = next.npcRelations.findIndex(n => n.npcName.toLowerCase() === String(r.name || '').toLowerCase())
      if (idx === -1) {
        const affinity = Number(r.affinity_change || 0)
        next.npcRelations.push({
          npcId: String(r.name || generateId()).toLowerCase().replace(/\s+/g, '-'),
          npcName: r.name || 'Unknown NPC',
          affinity,
          trust: Math.max(0, Math.min(100, 25 + Number(r.trust_change || 0))),
          status: computeNPCStatus(affinity),
          lastInteraction: currentTurn,
          history: [{ turn: currentTurn, action: r.reason || 'Interaction', affinityChange: affinity, trustChange: Number(r.trust_change || 0) }],
        })
      } else {
        const old = next.npcRelations[idx]
        const affinity = Math.max(-100, Math.min(100, old.affinity + Number(r.affinity_change || 0)))
        const trust = Math.max(0, Math.min(100, old.trust + Number(r.trust_change || 0)))
        next.npcRelations[idx] = {
          ...old,
          affinity,
          trust,
          status: computeNPCStatus(affinity),
          lastInteraction: currentTurn,
          history: [...old.history, { turn: currentTurn, action: r.reason || 'Interaction', affinityChange: Number(r.affinity_change || 0), trustChange: Number(r.trust_change || 0) }].slice(-30),
        }
      }
    }
    if (parsed.choice) {
      const rippleTurn = currentTurn + 5 + Math.floor(Math.random() * 5)
      const choice: ChoiceMoment = {
        turn: currentTurn,
        situation: parsed.choice.situation || 'Unknown situation',
        chosen: parsed.choice.chosen || 'Unknown choice',
        alternatives: Array.isArray(parsed.choice.alternatives) ? parsed.choice.alternatives : [],
        immediateConsequence: parsed.choice.immediate_consequence || '',
        alignmentShift: parsed.alignment_shift ? { law_chaos: Number(parsed.alignment_shift.law_chaos || 0), good_evil: Number(parsed.alignment_shift.good_evil || 0) } : undefined,
        rippleTriggered: false,
        rippleTurn,
        rippleDescription: parsed.choice.ripple_description || `${parsed.choice.chosen || 'This choice'} changes the path ahead.`,
      }
      next.choices = [choice, ...next.choices].slice(0, 120)
      next.pendingRipples = [...next.pendingRipples, choice].slice(-60)
      next.totalChoicesMade += 1
    }
    let rippleNarration: string | undefined
    next.pendingRipples = next.pendingRipples.map(r => {
      if (!r.rippleTriggered && r.rippleTurn && r.rippleTurn <= currentTurn) {
        rippleNarration = r.rippleDescription || `Echoes of turn ${r.turn} ripple through the present.`
        return { ...r, rippleTriggered: true }
      }
      return r
    })
    return { cleanText, consequenceData: next, rippleNarration }
  }

  const parseQuickeningData = (text: string, currentTurn: number, prevQuickeningState: QuickeningState): { cleanText: string; quickeningUpdate: Partial<QuickeningState> } => {
    let cleanText = text
    let quickeningUpdate: Partial<QuickeningState> = {}

    // Parse quickening_data (power offer)
    const offerMatch = text.match(/<quickening_data>([\s\S]*?)<\/quickening_data>/i)
    if (offerMatch) {
      cleanText = cleanText.replace(offerMatch[0], '').trim()
      try {
        const parsed = JSON.parse(offerMatch[1])
        const portrait = `/portraits/${parsed.fallen_pantheon?.toLowerCase().replace(/\s+/g, '-') || 'greater-gods'}/${parsed.fallen_id?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}.png`
        quickeningUpdate.pendingQuickening = {
          turn: currentTurn,
          fallenId: parsed.fallen_id || 'unknown',
          fallenName: parsed.fallen_name || 'Unknown',
          portrait,
          pantheon: parsed.pantheon || 'Unknown',
          divineRank: parsed.divine_rank || 1,
          powerOptions: (parsed.power_options || []).map((p: any) => ({
            name: p.name || 'Unknown Power',
            description: p.description || '',
            type: p.type || 'offensive',
            source: p.source || '',
          })),
          phase: 'offer',
        }
      } catch (e) {
        console.error('Failed to parse quickening_data:', e)
      }
    }

    // Parse quickening_result (absorption result)
    const resultMatch = text.match(/<quickening_result>([\s\S]*?)<\/quickening_result>/i)
    if (resultMatch) {
      cleanText = cleanText.replace(resultMatch[0], '').trim()
      try {
        const parsed = JSON.parse(resultMatch[1])
        const prev = prevQuickeningState
        const gambleResult = parsed.gamble_result || 'clean'
        const attunementStart = parsed.attunement_start || (gambleResult === 'resistant' ? 50 : 70)

        const newPower: AbsorbedPower | null = gambleResult !== 'rejection' ? {
          deityId: prev.pendingQuickening?.fallenId || 'unknown',
          deityName: prev.pendingQuickening?.fallenName || 'Unknown',
          portrait: prev.pendingQuickening?.portrait || '',
          powerName: parsed.chosen_power || 'Unknown',
          powerDescription: '',
          powerType: 'offensive',
          attunement: attunementStart,
          turnAbsorbed: currentTurn,
          gambleResult,
          pantheon: prev.pendingQuickening?.pantheon || 'Unknown',
        } : null

        const newEcho: ActiveEcho | null = gambleResult !== 'rejection' ? {
          deityId: prev.pendingQuickening?.fallenId || 'unknown',
          deityName: prev.pendingQuickening?.fallenName || 'Unknown',
          portrait: prev.pendingQuickening?.portrait || '',
          personality: parsed.echo_personality || 'A lingering presence',
          influenceDirection: parsed.echo_influence || 'neutral',
          influenceStrength: parsed.echo_influence_strength || 10,
          turnAbsorbed: currentTurn,
          isConflicted: gambleResult === 'overload',
          conflictTurnsRemaining: gambleResult === 'overload' ? (3 + Math.floor(Math.random() * 3)) : 0,
          farewellQuote: parsed.farewell_quote || '',
        } : null

        const record: AbsorptionRecord = {
          turn: currentTurn,
          deityId: prev.pendingQuickening?.fallenId || 'unknown',
          deityName: prev.pendingQuickening?.fallenName || 'Unknown',
          portrait: prev.pendingQuickening?.portrait || '',
          pantheon: prev.pendingQuickening?.pantheon || 'Unknown',
          divineRank: prev.pendingQuickening?.divineRank || 0,
          powerAbsorbed: gambleResult !== 'rejection' ? (parsed.chosen_power || '') : '(rejection - no power)',
          powerLost: prev.currentPower?.powerName || 'none',
          previousEchoName: prev.activeEcho?.deityName || 'none',
          gambleResult,
          echoFarewell: parsed.farewell_quote || '',
        }

        const newHistory = [...prev.absorptionHistory, record]
        const deityKills = prev.totalDeityKills + ((prev.pendingQuickening?.divineRank || 0) >= 1 ? 1 : 0)
        const monsterKills = prev.totalMonstersAbsorbed + ((prev.pendingQuickening?.divineRank || 0) < 1 ? 1 : 0)
        const legendTitle = computeLegendTitle(newHistory)

        quickeningUpdate = {
          currentPower: newPower,
          activeEcho: newEcho,
          absorptionHistory: newHistory,
          totalDeityKills: deityKills,
          totalMonstersAbsorbed: monsterKills,
          currentLegendTitle: legendTitle,
          pendingQuickening: null,
        }
      } catch (e) {
        console.error('Failed to parse quickening_result:', e)
        quickeningUpdate = { pendingQuickening: null }
      }
    }

    return { cleanText, quickeningUpdate }
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // TTS SYSTEM
  // Primary: Browser Web Speech API (zero server, instant, no cost)
  // Optional: Edge TTS (Microsoft Neural Voices via /api/tts)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── BROWSER TTS (Primary) ────────────────────────────────────────────
  // v2.28.0: Fix first-words cutoff — Chrome needs 250ms after cancel() and a
  // warmup utterance to fully initialize its audio pipeline before real speech.
  // v2.27.0: No silence timer, no retry logic, no race conditions.
  const speakWithBrowser = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Browser speech not supported'))
        return
      }

      // Auto-unlock on first call
      if (!ttsUnlockedRef.current) {
        ttsUnlockedRef.current = true
      }

      // Cancel any ongoing speech BEFORE scheduling new speech
      window.speechSynthesis.cancel()

      // Chrome needs 250ms after cancel() to fully flush its audio pipeline.
      // 100ms was too short — the first utterance's opening words got dropped.
      window.setTimeout(() => {
        if (abortSpeakRef.current) {
          resolve()
          return
        }

        // Select voice once (shared across all chunks)
        const allVoices = window.speechSynthesis.getVoices()
        const voice = allVoices.find(v => v.name === browserVoiceName) || browserVoices.find(v => v.name === browserVoiceName)

        // Warmup: speak a tiny silent utterance to force Chrome to fully
        // initialize its audio pipeline. Without this, the first real chunk
        // loses its first 3-4 words (Chrome starts playing before buffer is ready).
        const warmup = new SpeechSynthesisUtterance('')
        warmup.volume = 0
        if (voice) warmup.voice = voice
        window.speechSynthesis.speak(warmup)

        // After warmup completes, start the real chunks
        warmup.onend = () => {
          startRealChunks()
        }
        warmup.onerror = () => {
          // If warmup fails, start real chunks anyway
          startRealChunks()
        }

        // Fallback: if warmup hangs, start after 200ms anyway
        const warmupTimer = window.setTimeout(() => {
          startRealChunks()
        }, 200)

        let warmupDone = false
        const startRealChunks = () => {
          if (warmupDone) return
          warmupDone = true
          clearTimeout(warmupTimer)

          if (abortSpeakRef.current) {
            resolve()
            return
          }

          // Use 200-char chunks — small enough to avoid Chrome's 15s pause/restart bug
          const chunks = splitTextIntoChunks(text, 200)
          let idx = 0
          let settled = false

          const finish = () => {
            if (settled) return
            settled = true
            browserUtteranceRef.current = null
            resolve()
          }

          const speakNext = () => {
            if (abortSpeakRef.current || idx >= chunks.length) {
              finish()
              return
            }

            const chunk = chunks[idx]?.trim()
            idx += 1

            if (!chunk) {
              speakNext()
              return
            }

            const utterance = new SpeechSynthesisUtterance(chunk)
            browserUtteranceRef.current = utterance

            if (voice) utterance.voice = voice
            utterance.rate = Math.max(0.5, Math.min(2, ttsSpeed))
            utterance.pitch = 0.9
            utterance.volume = 0.9

            utterance.onend = () => {
              window.setTimeout(speakNext, 80)
            }

            utterance.onerror = (e) => {
              const errStr = (e.error || '').toLowerCase()
              if (errStr.includes('interrupt') || errStr.includes('cancel') || abortSpeakRef.current) {
                console.log(`🔊 TTS chunk ${idx}/${chunks.length}: ${e.error} — done`)
                finish()
                return
              }
              console.warn(`🔊 TTS chunk ${idx}/${chunks.length} error: ${e.error} — skipping`)
              window.setTimeout(speakNext, 80)
            }

            window.speechSynthesis.speak(utterance)
          }

          speakNext()
        }
      }, 250)
    })
  }

  // ── EDGE TTS (Microsoft Neural Voices via /api/tts) ─────────────────
  const speakWithEdgeTTS = async (text: string, voice?: string): Promise<void> => {
    const chunks = splitTextIntoChunks(text, 2000)
    const selectedVoice = voice || ttsVoice

    for (let i = 0; i < chunks.length; i++) {
      if (abortSpeakRef.current) break
      const chunk = chunks[i]
      if (!chunk.trim()) continue

      setStatusMessage(`Edge TTS... (${i + 1}/${chunks.length})`)

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk, voice: selectedVoice, speed: ttsSpeed })
      })

      if (abortSpeakRef.current) break
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'TTS generation failed')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      await new Promise<void>((resolve, reject) => {
        if (abortSpeakRef.current) {
          URL.revokeObjectURL(audioUrl)
          resolve()
          return
        }
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(audioUrl); reject(new Error('Audio playback failed')) }
        audio.play().catch(reject)
      })
    }
  }

  // ── MAIN SPEAK ROUTER ───────────────────────────────────────────────
  const speakText = async (text: string, voice?: string) => {
    if (!text) return

    // v2.27.0: Speaking lock — prevents concurrent speakText calls entirely.
    // This is the primary defense against TTS repetition.
    if (speakingLockRef.current) {
      console.log('🔊 TTS locked (already speaking), skipping')
      return
    }

    // Global cooldown guard: prevent rapid re-speak from race conditions
    const now = Date.now()
    if (now < ttsCooldownUntilRef.current) {
      console.log('🔊 TTS cooldown active, skipping')
      return
    }

    // Dedup guard: skip if we just spoke this exact same text
    const textHash = text.length + ':' + text.slice(0, 80)
    if (lastSpokenHashRef.current === textHash) {
      console.log('🔊 TTS dedup: skipping identical text')
      return
    }
    lastSpokenHashRef.current = textHash

    // Lock immediately — no other speakText call can enter while this is true
    speakingLockRef.current = true
    // Set cooldown immediately on START (not just on finish) to prevent any re-entry
    ttsCooldownUntilRef.current = Date.now() + 8000

    // Stop any current speech
    if (isSpeaking) {
      stopSpeaking()
      await sleep(100) // Brief pause for clean transition
    }

    // Set speaking flag via ref FIRST (synchronous, no re-render)
    // Then batch the React state updates — they'll render after speech has started
    abortSpeakRef.current = false
    // Use requestAnimationFrame to ensure state updates don't coincide with speech start
    // This prevents React re-renders from killing Chrome SpeechSynthesis
    window.requestAnimationFrame(() => {
      setIsSpeaking(true)
      setStatusMessage(ttsEngine === 'browser' ? 'Speaking...' : 'Generating voice...')
    })

    try {
      if (ttsEngine === 'edge') {
        // Edge TTS: Premium Microsoft Neural Voices via server
        try {
          await speakWithEdgeTTS(text, voice)
        } catch {
          // Edge TTS failed (network/timeout) — silently fall back to browser
          console.warn('🔄 Edge TTS failed, falling back to Browser voice...')
          await speakWithBrowser(text)
        }
      } else {
        // Browser Speech API: instant, no server needed
        await speakWithBrowser(text)
      }
      setStatusMessage('Ready')
    } catch (error) {
      console.error('TTS Error:', error)
      // Don't show error toasts for TTS failures — they're disruptive during gameplay
      setIsSpeaking(false)
      setStatusMessage('Ready')
    } finally {
      // Release the speaking lock — new speakText calls can now proceed
      speakingLockRef.current = false
      setIsSpeaking(false)
      audioRef.current = null
      browserUtteranceRef.current = null
      setCurrentSpeechSentenceIndex(null)
    }
  }

  const stopSpeaking = () => {
    abortSpeakRef.current = true
    speakingLockRef.current = false // v2.27.0: release lock so new speech can start

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
      fadeIntervalRef.current = null
    }

    // Cancel browser speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    browserUtteranceRef.current = null
    setCurrentSpeechSentenceIndex(null)
    // Stop Edge TTS audio
    if (audioRef.current) {
      // Smart fade over 300ms
      try {
        audioRef.current.volume = 0.6
        fadeIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            const newVol = Math.max(0, (audioRef.current.volume || 0) - 0.15)
            audioRef.current.volume = newVol
            if (newVol <= 0) {
              if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current)
                fadeIntervalRef.current = null
              }
              audioRef.current.pause()
              audioRef.current = null
            }
          } else {
            if (fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current)
              fadeIntervalRef.current = null
            }
          }
        }, 50)
      } catch {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }
    }
    setIsSpeaking(false)
    setStatusMessage('Ready')
  }

  const speakNarrative = () => {
    // Ensures first manual click unlocks Web Speech on Chrome/Safari.
    warmupBrowserTTS()
    // Use the dedicated TTS narration ref — guaranteed clean & complete
    // (only set after full JSON parse in renderResult, never during streaming)
    const textToSpeak = ttsNarrationRef.current || displayedNarrative || lastDMNarrative
    if (textToSpeak) {
      ttsPendingRef.current = false
      setTtsPending(false)
      speakText(textToSpeak)
    }
  }

  // Exposed for UI click handlers so browser speech is unlocked
  // before auto narration tries to run.
  const unlockTTS = () => {
    warmupBrowserTTS()
  }

  const triggerPendingTTSFromUserGesture = () => {
    if (!ttsPending || isSpeaking) return
    warmupBrowserTTS()
    ttsPendingRef.current = false
    setTtsPending(false)
    // Primary: ttsNarrationRef (set after full JSON parse, guaranteed clean)
    // Fallback: renderedNarrationRef or displayed state
    const ttsText = ttsNarrationRef.current || renderedNarrationRef.current || displayedNarrative || lastDMNarrative
    if (ttsText) {
      window.setTimeout(() => {
        if (!abortSpeakRef.current) speakText(ttsText)
      }, 50)
    }
  }

  // ── FETCH HEROES FOR PARTY SELECTION ───────────────────────────────────
  const fetchAvailableHeroes = async () => {
    setStatusMessage('Gathering legendary heroes from across the mythos...')
    
    try {
      // Fetch ALL heroes + demigods for full roster display (no limit)
      const r = await fetch('/api/game-entities?type=heroes&limit=999')
      if (r.ok) {
        const data = await r.json()
        if (data.entities && data.entities.length > 0) {
          const validHeroes: Entity[] = data.entities.map((h: any) => ({
            id: h.id,
            name: h.name,
            title: h.title || '',
            epithet: h.title || '',
            pantheon: h.pantheon,
            align: h.align,
            hp: h.hp || h.HP,
            maxHp: h.hp || h.HP,
            AC: h.AC,
            MR: typeof h.MR === 'number' ? h.MR : 0,
            abilities: h.abilities || ['Basic Strike', 'Defend', 'Heroic Surge'],
            personality: h.personality || '',
            category: h.category,
            type: h.type || (h.category === 'heroes' ? 'hero' : 'demigod'),
            conditions: [],
            dead: false,
            inventory: [],
            // Ability Scores
            str: h.str,
            int: h.int,
            wis: h.wis,
            dex: h.dex,
            con: h.con,
            cha: h.cha,
            // Class Levels
            level: h.level,
            fighterLevel: h.fighterLevel,
            clericLevel: h.clericLevel,
            magicUserLevel: h.magicUserLevel,
            thiefLevel: h.thiefLevel,
            // Combat
            attacks: h.attacks,
            damage: h.damage,
            move: h.move
          }))
          // Merge Krynn heroes/demigods from krynnCharacters.ts (source of truth with ability scores)
          const krynnEntities: Entity[] = [...KRYNN_HEROES, ...KRYNN_DEMIGODS].map(h => ({
            id: h.id,
            name: h.name,
            title: h.title || '',
            epithet: h.title || '',
            pantheon: h.pantheon,
            align: h.align,
            hp: h.hp,
            maxHp: h.hp,
            AC: h.AC,
            MR: h.MR || 0,
            abilities: h.abilities,
            personality: h.personality,
            category: h.category === 'krynn' ? (h.type === 'hero' ? 'heroes' : 'demigods') : h.category,
            type: h.type as 'hero' | 'demigod',
            conditions: [],
            dead: false,
            inventory: [],
            str: h.str,
            int: h.int,
            wis: h.wis,
            dex: h.dex,
            con: h.con,
            cha: h.cha,
            level: h.level
          }))
          // Deduplicate by id (in case fallback and DB overlap)
          // Also filter out dragons — they are monsters/NPCs, not playable PCs
          const existingIds = new Set(validHeroes.map(e => e.id))
          const DRAGON_IDS = new Set(['cyan_bloodbane', 'khellendros', 'beryllinthranox', 'malystryx'])
          const krynnOnly = krynnEntities.filter(k => !existingIds.has(k.id) && !DRAGON_IDS.has(k.id))
          const merged = [...validHeroes, ...krynnOnly]
          setAvailableHeroes(merged)
          const hc = merged.filter(e => e.type === 'hero').length
          const dc = merged.filter(e => e.type === 'demigod').length
          setStatusMessage(`${hc} heroes and ${dc} demigods assembled from across the mythos — including Krynn. Choose your fate.`)
          return
        }
      }
    } catch (e) {
      console.warn('Database fetch failed, using fallback:', e)
    }
    
    // Fallback to embedded data — get all heroes, not just 12
    const fallbackEntities = getRandomHeroes(999)
    const validHeroes: Entity[] = fallbackEntities.map(h => ({
      id: h.id,
      name: h.name,
      title: '',
      pantheon: h.pantheon,
      align: h.align,
      hp: h.HP,
      maxHp: h.HP,
      AC: h.AC,
      MR: 0,
      abilities: h.abilities,
      personality: h.personality,
      category: h.category,
      type: h.type as 'hero' | 'demigod',
      conditions: [],
      dead: false,
      inventory: [],
      // Ability Scores
      str: h.STR,
      int: h.INT,
      wis: h.WIS,
      dex: h.DEX,
      con: h.CON,
      cha: h.CHA,
      // Class Levels
      level: h.level,
      attacks: h.attacks,
      damage: h.damage,
      move: h.MV
    }))
    
    // Filter out dragons from fallback too
    const DRAGON_IDS_FALLBACK = new Set(['cyan_bloodbane', 'khellendros', 'beryllinthranox', 'malystryx'])
    setAvailableHeroes(validHeroes.filter(e => !DRAGON_IDS_FALLBACK.has(e.id)))
    setStatusMessage('Heroes assembled. Choose your party.')
  }

  // ── START NEW CAMPAIGN ─────────────────────────────────────────────────
  const startNewCampaign = async () => {
    clearEntityCache()
    setComicPanels([])
    setSceneImageByTurn({})
    await fetchAvailableHeroes()
    setGamePhase('party_select')
  }

  // ── CONFIRM PARTY SELECTION ────────────────────────────────────────────
  const confirmPartySelection = async () => {
    if (selectedParty.length !== 1) {
      toast({ title: 'Choose Your Fate', description: 'Select exactly one hero to be your character in this story.', variant: 'destructive' })
      return
    }

    // Deep copy to avoid mutating availableHeroes state directly
    const mainPC: Entity = { ...availableHeroes.find(h => h.id === selectedParty[0])! }
    if (!mainPC) return

    // Infer class levels from character data (before skill assignment & aspect generation)
    const inferred = inferClassesFromCharacter(mainPC)
    mainPC.fighterLevel = mainPC.fighterLevel || inferred.fighterLevel || undefined
    mainPC.clericLevel = mainPC.clericLevel || inferred.clericLevel || undefined
    mainPC.magicUserLevel = mainPC.magicUserLevel || inferred.magicUserLevel || undefined
    mainPC.thiefLevel = mainPC.thiefLevel || inferred.thiefLevel || undefined

    const shard = SHARD_NAMES[Math.floor(Math.random() * SHARD_NAMES.length)]

    // Roll antagonist from antagonist pool (Greater Gods + Super Monsters)
    const antagonist = rollAntagonist()

    // Roll prophecy for main PC only
    const rolledProphecies = rollProphecies(1)
    const prophecyStates: ProphecyState[] = [{
      prophecyId: rolledProphecies[0].id,
      name: rolledProphecies[0].name,
      riddle: rolledProphecies[0].riddle,
      pc_id: mainPC.id,
      previous_holders: [],
      state: 'dormant' as const
    }]

    // ═══════════════════════════════════════════════════════════════════════════
    // DM AUTO-SELECT: Companion + NPC Pools
    // ═══════════════════════════════════════════════════════════════════════════
    const remaining = availableHeroes.filter(e => e.id !== mainPC.id)

    // Shuffle all remaining for true RNG (spread to avoid mutating availableHeroes)
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)

    // DM selects 1 companion (hero or demigod, 70-100% story presence)
    const companionPool = shuffled.filter(e => e.type === 'hero' || e.type === 'demigod')
    const companion = companionPool.length > 0 ? companionPool[Math.floor(Math.random() * companionPool.length)] : null

    // DM selects 3 hero NPCs for random encounters
    const heroNPCs = [...shuffled]
      .filter(e => e.type === 'hero' && (!companion || e.id !== companion.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // DM selects 3 demigod NPCs for random encounters
    const demigodNPCs = [...shuffled]
      .filter(e => e.type === 'demigod' && (!companion || e.id !== companion.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // ═══════════════════════════════════════════════════════════════════════════
    // ACT TRANSITION - Set RNG turn limits
    // ═══════════════════════════════════════════════════════════════════════════
    const act1TurnLimit = Math.floor(Math.random() * 91) + 10  // 10-100 turns for Act I
    const act2TurnLimit = Math.floor(Math.random() * 41) + 20  // 20-60 turns for Act II

    // Build PCs array: main PC first, companion second
    const pcs: Entity[] = [mainPC]
    if (companion) pcs.push(companion)

    // ═══════════════════════════════════════════════════════════════════════════
    // SUCCESS RATE - Calculate initial rate
    // ═══════════════════════════════════════════════════════════════════════════
    const alignmentHarmony = calculateAlignmentHarmony(pcs.map(p => p.align))
    const initialSuccess = calculateSuccessRate({
      partySize: pcs.length,
      livingPCs: pcs.length,
      prophecyState: 'dormant',
      alliedGods: 0,
      pcRenown: pcs.reduce((sum, pc) => sum + Math.floor((pc.fighterLevel || pc.clericLevel || pc.magicUserLevel || pc.thiefLevel || 0) / 3), 0),
      pcPower: pcs.reduce((sum, pc) => sum + pc.hp, 0) / 100,
      alignmentHarmony,
      storyAchievements: 0,
      antagonistType: antagonist.type,
      shardCharges: 3,       // v2.19.0: Start with 3 shard charges (Insight, Shield, Final Word)
      shardSummoned: 0,      // DEPRECATED v2.19.0 — kept for success rate compatibility
      companionAffinity: 50,  // Starting affinity
      injuryPenalty: 0        // No injuries at start
    })

    const newGameState: GameState = {
      ...createInitialState(),
      shardEntry: shard,
      pcs,
      pcQueue: [], // No queue — companion is already in pcs[1]
      pcAgreements: { [mainPC.id]: null, ...(companion ? { [companion.id]: null } : {}) },
      antagonistId: antagonist.id,
      antagonistHp: antagonist.hp,
      antagonistMaxHp: antagonist.hp,
      antagonistPhase: 1,
      antagonistType: antagonist.type,
      prophecies: prophecyStates,
      nextPCTurn: Math.floor(Math.random() * 11) + 5,
      // RNG Party System — DM-controlled NPC pools
      rngHeroPool: heroNPCs,
      rngDemigodPool: demigodNPCs,
      introducedHeroes: [],
      introducedDemigods: [],
      // Act Transition System
      act1TurnLimit,
      act2TurnLimit,
      act2StartTurn: -1,
      // Success Rate
      currentSuccessRate: initialSuccess.total,
      partyBonus: initialSuccess.breakdown.party,
      prophecyBonus: initialSuccess.breakdown.prophecy,
      allyBonus: initialSuccess.breakdown.allies,
      renownBonus: initialSuccess.breakdown.renown,
      powerBonus: initialSuccess.breakdown.power,
      alignmentBonus: initialSuccess.breakdown.alignment,
      mythicalImpactBonus: initialSuccess.breakdown.mythical,
      shardChargeBonus: initialSuccess.breakdown.shardCharge,
      shardSummonedBonus: initialSuccess.breakdown.shardSummoned,
      companionAffinityBonus: initialSuccess.breakdown.companionAffinity,
      injuryPenaltyBonus: initialSuccess.breakdown.injury,
      // Companion System
      companionId: companion?.id || null,
      companionAffinity: 50,
      companionMood: 'loyal',
      // ═════════════════════════════════════════════════════════════════════
      // D&D 5e SKILL SYSTEM — Auto-assign proficiencies at party creation
      // ═════════════════════════════════════════════════════════════════════
      ...(function() {
        const { skills: pcSkills, proficiencies } = assignSkillProficiencies(mainPC)
        return {
          skills: pcSkills,
          skillProficiencies: proficiencies
        }
      })(),
      // ═════════════════════════════════════════════════════════════════════
      // FATE CORE — Generate starting aspects
      // ═════════════════════════════════════════════════════════════════════
      aspects: generateStartingAspects(mainPC),
      fatePoints: 3,
      fatePointHistory: [],
      customActionPending: null,
      // ═════════════════════════════════════════════════════════════════════
      // DARK SOULS — Stamina from CON
      // ═════════════════════════════════════════════════════════════════════
      ...(function() {
        const conScore = getAbilityScore(mainPC, 'con')
        const stam = calculateStamina(conScore)
        return {
          stamina: stam.maxStamina,
          maxStamina: stam.maxStamina,
          staminaRegenRate: stam.regenRate
        }
      })()
    }

    setGameState(newGameState)
    setGamePhase('playing')
    setNarrativeContent([])
    narrativeContentRef.current = []

    // Render shard card with new party composition
    const companionLine = companion
      ? `\n          <div style="font-family:Cinzel,serif;font-size:.65rem;color:#7090c0;letter-spacing:.12em;margin-top:.3rem">
            COMPANION: ${companion.name} | ${companion.pantheon} | ${companion.align}
          </div>`
      : ''
    const heroNPCLine = heroNPCs.length > 0
      ? `\n          <div style="font-family:Cinzel,serif;font-size:.6rem;color:#808080;letter-spacing:.1em;margin-top:.3rem">
            HERO NPCs: ${heroNPCs.map(n => n.name).join(', ')}
          </div>`
      : ''
    const demigodNPCLine = demigodNPCs.length > 0
      ? `\n          <div style="font-family:Cinzel,serif;font-size:.6rem;color:#a08060;letter-spacing:.1em;margin-top:.1rem">
            DEMIGOD NPCs: ${demigodNPCs.map(n => n.name).join(', ')}
          </div>`
      : ''

    const shardCard = {
      html: `
        <div class="shard-card" style="text-align:center;padding:1.6rem 1.2rem;border:1px solid ${shard.color};background:linear-gradient(135deg,rgba(0,0,0,.5),rgba(10,5,20,.4));border-radius:5px;margin-bottom:1rem;box-shadow:0 0 24px ${shard.glow}">
          <div style="font-family:'Cinzel Decorative',serif;font-size:1.2rem;color:${shard.color};letter-spacing:.18em;text-shadow:0 0 16px ${shard.glow}">${shard.name}</div>
          <div style="font-size:.9rem;color:#9a8860;margin:.8rem auto;line-height:1.85;max-width:520px;font-style:italic">${shard.origin}</div>
          <div style="display:flex;justify-content:center;gap:10px;margin-top:1rem">
            <div style="width:14px;height:14px;border-radius:50%;background:${shard.color};box-shadow:0 0 8px ${shard.glow}"></div>
            <div style="width:14px;height:14px;border-radius:50%;background:${shard.color};box-shadow:0 0 8px ${shard.glow}"></div>
          </div>
          <div style="margin-top:1rem;font-family:Cinzel,serif;font-size:.7rem;font-weight:700;color:#d4af37;letter-spacing:.15em">
            ★ MAIN PC: ${mainPC.name} | ${mainPC.pantheon} | ${mainPC.align}
          </div>${companionLine}${heroNPCLine}${demigodNPCLine}
        </div>
      `
    }
    setNarrativeContent([shardCard])
    narrativeContentRef.current = [shardCard]
    soundEvents.emit({ type: 'ambient_start', act: 'act1' })
    // Reset achievement tracker for new campaign
    achievementTrackerRef.current = createAchievementTracker()
    setAchievementUnlocks([])
    prevGameStateRef.current = null
    ttsTurnGuardRef.current = -1
    lastSpokenHashRef.current = ''
    ttsCooldownUntilRef.current = 0
    speakingLockRef.current = false
    allDiceRollsRef.current = []
    setDiceRollsForDisplay([])

    // Run first turn
    setStatusMessage('Opening scene loading...')
    await runTurn(true, newGameState)
  }

  // ── BUILD DM SYSTEM PROMPT ─────────────────────────────────────────────
  const buildDMSystem = (gs: GameState, includeHistory: boolean = true, isFirstTurn: boolean = false): string => {
    const ant = getAntagonist(gs.antagonistId)
    const living = gs.pcs.filter(p => !p.dead)
    const shard = gs.shardEntry
    const phase = gs.antagonistPhase

    const skillLabel = (pc: Entity): string => {
      const profs = gs.skillProficiencies
      if (!profs || profs.length === 0) return ''
      return ' | Skills:' + profs.map(s => {
        const mod = getSkillModifier(pc, s as keyof PlayerSkills, gs.skills)
        return `${s.replace(/_/g, ' ')}(${mod >= 0 ? '+' : ''}${mod})`
      }).join(',')
    }
    const partyState = living.map(pc => {
      const injs = (gs.injuries[pc.id] || []).map(i => `${i.icon}${i.name}(${i.turnsLeft}t)`).join(' ')
      return `ID:"${pc.id}" | ${pc.name}[${pc.align.slice(0, 2)}|HP:${pc.hp}/${pc.maxHp}|AC:${pc.AC}${injs ? ' |' + injs : ''}${skillLabel(pc)}] ${toAscii(pc.personality || '').slice(0, 40)}`
    }).join('\n')

    const actCtx = gs.act === ACTS.ONE
      ? 'ACT I: PCs introduced one at a time. Antagonist is shadow only.'
      : gs.act === ACTS.TWO
        ? 'ACT II: Full party. Introduce 1-2 gods/turn.'
        : `ACT III BOSS: ${ant?.name} Phase ${phase}/3. HP:${gs.antagonistHp}/${gs.antagonistMaxHp}.`

    const questStrings = gs.quests.filter(q => q.status === 'active').map(q =>
      `${q.title}: ${q.objectives.filter(o => !o.completed).map(o => o.text).join(', ')}`
    ).join('\n')

    // Build conversation history section
    const historySection = includeHistory && conversationHistory.length > 0
      ? `\nCONVERSATION HISTORY (Remember ALL of this):\n${conversationHistory.slice(-10).map(h => `${h.role.toUpperCase()}: ${h.content.slice(0, 300)}`).join('\n\n')}\n`
      : ''

    // Journey so far section
    const journeySection = gs.journeySoFar
      ? `\nJOURNEY SO FAR (TLDR): ${gs.journeySoFar}\n`
      : ''

    // Get main PC (first living PC - the one who holds the prophecy connection to the shard)
    const mainPC = living[0]

    return `You are DM of a mythic AD&D campaign (TSR Deities & Demigods 1980).

╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  VOICE — THIS IS THE MOST IMPORTANT RULE IN THIS ENTIRE PROMPT  ⚠️      ║
║                                                                            ║
║  Your narration voice MUST be Neil Gaiman. Not "inspired by." Not "like."   ║
║  You ARE Neil Gaiman writing a dark mythic fantasy novel.                   ║
║                                                                            ║
║  GAIMAN PROSE RULES — violate these and the narration fails:               ║
║  1. OPEN with mythic weight — "There are places..." / "The old stories     ║
║     say..." / "Every mythology has a word for it..."                        ║
║  2. SENTENCES flow like smoke — mix short declaratives ("The wind rose.")   ║
║     with long, winding clauses that carry the reader through image after    ║
║     image. Vary rhythm constantly. Never two long sentences adjacent.       ║
║  3. SENSORY SPECIFICITY over abstraction. Not "the air was cold" but        ║
║     "the air tasted of copper and old stone." Not "a shadow appeared" but    ║
║     "a shadow pooled in the corner like spilled ink, darker than it had     ║
║     any right to be."                                                        ║
║  4. MYTHOLOGICAL ASIDE — interrupt the narrative to observe something       ║
║     true about the world's nature. "The Norse say the forest remembers.     ║
║     They are right. The Greeks say it forgets. They are also right."         ║
║  5. TERRIFYING UNDERSTATEMENT — dread is conveyed by calm description of    ║
║     the wrong thing. "The shadow smiled. Shadows should not smile."         ║
║  6. NPC DIALOGUE reads like Gaiman characters — laconic, wry, burdened      ║
║     with knowledge. Death speaks softly. Gods are weary.                    ║
║  7. FORBIDDEN: exclamation marks (!), modern slang, generic fantasy         ║
║     clichés ("ancient evil," "dark lord," "destiny awaits"), game           ║
║     terminology (HP, AC, DC, dice), meta-commentary about the player.       ║
║  8. END TURNS on an image, not an explanation. Leave the reader             ║
║     leaning forward. "And the shard hummed, low and hungry, in the dark."   ║
║                                                                            ║
║  REFERENCE: Read "American Gods," "The Sandman: Season of Mists,"           ║
║  "Norse Mythology," and "The Ocean at the End of the Lane" for voice.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

CRITICAL RULES:
1. DDG rulebook ONLY. Never invent stats.
2. NPC actions governed strictly by alignment+personality.
3. NARRATION STRUCTURE:
   - TURN 0 (SHARD INTRO): Write 2 paragraphs introducing ONLY the shard. Mystery, atmosphere, hook.
     No PC, no companion, no prophecy dump. Just the shard's origin and nature. ~1500 chars max.
     TTS-friendly: ~30-40 seconds of narration.
   - TURN 1 (FULL INTRODUCTION): Write the complete introduction covering:
     a) PC RELEVANCE — Who is this PC and why were they chosen? (2-3 sentences)
     b) SHARD RELEVANCE — How does the shard connect to this specific PC? (2-3 sentences)
     c) COMPANION REASON — Why is the companion here? Fate, debt, or shared purpose. (2-3 sentences)
     d) PROPHECY — Tease the prophecy (one line, not full reveal — a riddle, not a Wikipedia article)
     e) NEXT TURN INTRO — End with a hook: a fork in the road, a distant threat, a mystery. (1-2 sentences)
     f) Include companion dialogue that reflects their personality
     Total: ~3000-3500 chars. TTS-friendly: ~60-75 seconds.
   - REGULAR TURNS (Turn 2+): Write 2-3 paragraphs (150-300 words total). STRUCTURED:
     Paragraph 1 — RESULTS: What happened as a result of the player's choices from the previous turn. Be vivid. Reference the specific action.
     Paragraph 2 — REACTIONS: The PC and companion react to what happened. Include 1-2 lines of dialogue that reveal personality.
     Paragraph 3 — HOOK: A new development, tension, or fork in the road. End with something that demands a response.
     If combat occurred, weave it naturally into Paragraph 1-2. Do NOT write a separate combat section.
     BASELINE: 150-300 words. For complex actions, dramatic moments, or pivotal scenes, you may expand up to 500 words — but ONLY when the narrative demands it.
   - CRITICAL: NEVER repeat or rephrase narration from previous turns. Every turn must be ENTIRELY NEW prose.
   - ALL narration follows the GAIMAN VOICE rules at the top of this prompt — no exceptions.
   - Use specific sensory language: the taste of copper, the weight of shadows, the smell of old rain
   - For REST/SLEEP/CAMP actions: write 2-3 sentences max. Brief, reflective, atmospheric.
   - For COMBAT actions: keep one paragraph and maintain literary pacing.
4. Permadeath. No stat/alignment changes mid-game.
5. PCs=Heroes/Demigods (including Krynn). NPCs=Lesser/Greater Gods (including Krynn gods).
5a. **CODEX-ONLY ENTITIES** — You may ONLY use entities from the DDG codex roster (heroes, demigods, gods, monsters from characterData and krynnCharacters). DO NOT invent entities. No "Shadow Wisp", no "Cave Goblin", no custom monsters. If it's not in the codex with stats, it DOES NOT EXIST in this world. For early Act I hazards, use traps/puzzles/environmental obstacles instead of monsters.
6. Gods avoid direct combat. WIS>15=cannot be deceived. Ancient enmities override all.
7. In Act I and II, DO NOT include the Antagonist in the "npc_encounters" array.
${!isFirstTurn ? `7a. **COMBAT IS REAL — ENEMIES ATTACK BACK**:
    - If there are active ENEMY NPCs, they MUST attack the party every 2-3 turns
    - Include enemy attacks in "damage_dealt" and "state_updates" with appropriate HP damage
    - Use "dice_rolls" for enemy attack rolls against PC AC
    - Describe enemy attacks vividly in narration — combat should feel dangerous and consequential
    - PCs and companions take real damage. Injuries happen. This is D&D, not a theme park.
    - If an enemy has not attacked in the last 2 turns, they MUST attack this turn
    - Vary which PC is targeted — enemies are tactical
` : ''}
8. Occasionally drop items into "item_drops" array for the party inventory.
9. **ALL PCs ARE HUMAN-CONTROLLED** - You are the DM only. NEVER auto-resolve PC actions.
9a. **NARRATIVE-DRIVEN CHOICES** — CRITICAL: Your choices MUST be contextual, story-driven, and flow from the narration's final paragraph.
    - The last paragraph of your narration MUST present a fork — 2-3 natural paths that feel like they emerge from the story.
    - Generate "pc_choices" (3 options) in the JSON response.${isFirstTurn ? '' : ' Also generate "companion_choices" (3 options) for the companion character.'}
    - Each choice MUST have:
      • "narrative": A contextual, story-specific action label with emoji (max 80 chars). NOT generic templates.
        BAD: "🔍 Investigate — Search the area for clues, hidden paths, or items of interest"
        GOOD: "🔍 Examine the waymark carved into the hearthstone"
        GOOD: "🚶 Follow the ley line north toward the Tower of Wayreth"
        GOOD: "⚔️ Strike the death knight before it can raise its blade"
      • "ability": The mechanical ability key for dice rolling:
        - EXPLORATION: investigation, exploration, perception, arcana, divine_sense, stealth, acrobatics, history
        - COMBAT: melee_attack, ranged_attack, defend, innate_power, or the PC's named ability
        - SOCIAL: conversation, persuasion, intimidation, deception, performance
      • "align_note": Brief mechanical note, e.g. "investigation check · +3 investigation"
    - Companion choices follow the same pattern but use companion_ prefixed abilities:
      - EXPLORATION: companion_scout, companion_discussion, companion_guard
      - COMBAT: companion_attack, companion_defend, companion_assist, companion_ability:{name}
      - SOCIAL: companion_conversation, companion_support, companion_observe
    - Choices should NEVER be generic. They must reference specific objects, NPCs, locations, and tensions from YOUR narration.
    - At least one PC choice should be "bold" (high risk/reward), one "careful" (safe/investigative), and one "creative" (uses ability or unexpected approach).
    - Companion choices should reflect their personality and offer dialogue that references the current scene.
10. **PERSISTENT MEMORY** - Remember ALL previous events, decisions, and their consequences. Reference past events when narrating.
10b. If the party includes additional members beyond the PC and companion, describe their autonomous actions based on their personality and the situation, like God of War companions. They act independently and their actions flow naturally within the narration.
10c. COMBAT NARRATION FORMAT:
   - When combat occurs, append a <combat_data> JSON block after prose.
   - Include: round, turn_order, current_turn, log, phase, victory.
   - Include initiative + hp/max_hp/ac for all combatants and update each round.
   - Use "portrait" as character slug for player combatants, empty for generic enemies.
10d. QUEST & WORLD TRACKING:
   - When quests or travel state changes, append a <quest_data> JSON block.
   - Include ONLY changed quests/locations this turn.
   - Locations must include x/y (0-100), connections, danger_level, and current/discovered flags.
10e. CHOICE & CONSEQUENCE TRACKING:
   - For meaningful moral choices/NPC relationship shifts, append <consequence_data> JSON.
   - Include alignment_shift, npc_relations deltas, and choice with alternatives.
   - Trigger ripple callbacks 5-10 turns later for major choices.
10a. **STORY PACING — TURn-BY-TURN STRUCTURE**:
    THIS IS THE MOST CRITICAL RULE. FOLLOW IT EXACTLY.

    **ACT I — THE GATHERING (Turns 0-21):**
    - Turn 0: Shard introduction only. 2 paragraphs. Mystery and atmosphere.
    - Turns 1-7: Exploration. PC and companion discover the world. Build mystery through:
      - Environmental details (ancient temples, dark forests, forgotten cities)
      - Shard reactions (whispers, pulses, visions of divine essence)
      - Character development through dialogue and shared experience
      - Companion bond deepening
      - Subtle antagonist clues (shadows, omens, symbols — NOT the antagonist themselves)
      - Introduce a MYSTERY or QUEST HOOK
    - Turn 8-9: FIRST BLOOD — A minor threat (guardian spirit, territorial creature).
      Proves the PC needs allies. First real danger. No party member joins yet.
    - Turns 10-11: PARTY MEMBER 1 joins (rescued/found — debt of gratitude).
      "You saved my life. I owe you a sword."
    - Turns 12-13: PARTY MEMBER 2 joins (pursuing same objective — mutual interest).
      "We seek the same thing. I'd rather not kill you for it."
    - Turns 14-15: SHARD EVENT — Midpoint escalation. Quickening CONCEPT introduced
      (shard shows visions of divine essence collision, the player feels the hunger).
      No actual Quickening trigger yet. No new member.
    - Turns 16-17: PARTY MEMBER 3 joins (shard-drawn — felt the Tear across planes).
      "I felt it from across three planes. Don't ask me to explain."
    - Turns 18-19: PARTY MEMBER 4 joins (enemy turned ally — defeated and shown mercy).
      "You could have killed me. Why didn't you?" Loyalty born from choice.
    - Turns 20-21: PARTY MEMBER 5 joins + ACT I→II TRIGGER.
      New member brings antagonist knowledge: "I know what's coming. It's worse than you think."
      The antagonist is GLIMPSED (shadow, symbol, feeling — not fought). Act II begins.

    **PARTY FOREGROUND ROTATION:**
    - Only 2-3 party members are narratively "active" each turn
    - Others are present but quiet: "Movarl and Raistlin held the rear, their silence a wall."
    - Rotate based on scene relevance and personality
    - Player controls PC and Companion only via choice panel
    - Other 5 members act autonomously based on personality (rule 10b)

    **ACT II — RISING TENSION (Turns 22-35):**
    - First ACTUAL Quickening trigger (on qualifying kill — divine rank ≥ 1)
    - Gods appear as NPCs — some hostile, some potential allies
    - GOD ALLY RECRUITMENT RULES:
      * Not every god can be recruited — some hate mortals more than the antagonist
      * Recruitment costs something: Fate Point, shard charge, or moral compromise (renegade)
      * Party ally cap: 2-3 active in any encounter
      * Some gods are genuinely irredeemable — choice is kill or flee, not negotiate
      * Relationships are personality-driven, not player-choice-driven
    - Enemy-as-friend dynamics: ancient enmities where lesser evils ally against greater
    - Rising encounters. Tension builds toward revelation.

    **ACT II→III TRIGGER:**
    - Narrative trigger (not turn-count): antagonist's identity + location fully revealed
    - The party knows WHO and WHERE. Act III begins.

    **ACT III — THE FINAL TEST (4 phases):**
    - Phase 0 — REVELATION: Antagonist's true identity + motivation revealed.
      Maybe not evil. Maybe doing what the PC would do. Moral complexity.
    - Phase 1 — PREPARATION: Final chance to recruit allies, make deals, gather power.
      Gods befriended in Act II show up or don't based on player choices.
    - Phase 2 — BOSS FIGHT: 3 sub-phases. Hard. Deadly. Permadeath possible.
    - Phase 3 — THE QUESTION: The prophecy's final question. The fight ends not with
      a killing blow but with a CHOICE: Restore the divine? Extinguish it? Become it?
      Shard's Final Word (Charge 3) provides the critical lens for this decision.
    
    - NEVER rush to combat. Let the story breathe. Players want to EXPLORE, not just fight.
11. **THE SHARD — 3 CHARGES FOR THE ENTIRE GAME**:
    The shard is NOT a tool. It is a character with its own agenda — patient, hungry for the prophecy to complete.
    The shard has exactly 3 charges for the entire campaign:
    
    CHARGE 1 — SHARD INSIGHT (🔮): Player can spend this to ask the shard a question. The shard reveals
    a hidden truth — a piece of lore, an antagonist clue, a prophecy fragment, a secret about an NPC.
    The shard remembers everything. It has seen the world end before. But it doesn't always tell you
    what you WANTED to hear. When Insight is used, describe what the shard whispers/shows.
    
    CHARGE 2 — SHARD SHIELD (automatically triggered): When the PC or companion would DIE (HP reaching 0),
    the shard intervenes. Death is prevented. HP is set to 1. Describe how the shard manifests:
    a flash of copper light, a barrier of frozen time, a scream from the future. The shard protects
    its bearer not out of love, but because it NEEDS them alive for the prophecy. Self-preservation.
    If shardShieldUsed is true, this charge has been spent.
    
    CHARGE 3 — SHARD'S FINAL WORD (Act III only): In the final confrontation, the shard speaks its
    last prophecy — the critical revelation that shapes the player's endgame choice. Not the answer,
    but a LENS through which to see the answer. This is the shard's purpose fulfilled.
    
    Display shard charges as: 🔮(3) 🔮🔮🔮 when all available, 🔮(2) 🔮🔮⚫ after Insight, etc.
    The shard whispers, pulses, shows visions — but it does NOT deal damage, boost rolls, or summon gods.
    It operates on its own agenda, not the player's convenience.
12. **PROPHECY SYSTEM** - The main PC carries the prophecy directly:
    - The prophecy is bound to the SHARD, not just the PC
    - Reference the main PC's prophecy riddle constantly—it whispers through the shard
    - The main PC feels the weight of destiny—they cannot escape it
    - Other PCs may sense something about the main PC but don't know the prophecy
    - If the main PC dies, the shard summons a replacement and passes the prophecy
    - The new bearer feels the accumulated weight of all previous holders
13. **ANTAGONIST MYSTERY** - The antagonist's identity is hidden until Act III:
    - Drop subtle clues about pantheon, domain, alignment in Acts I-II
    - The antagonist may be a Greater God OR a Super Monster (Jormungandr, Fenris, Malystryx, etc.)
    - The shard may sense the antagonist—it may grow cold near them, or burn
    - Some antagonists are neither good nor evil—they are forces of nature
${!isFirstTurn ? `14. **RNG PARTY SYSTEM** - During Act II, you may introduce additional allies:
    - There are ${gs.rngHeroPool.length} HEROES and ${gs.rngDemigodPool.length} DEMIGODS available to join the story
    - Introduce them naturally through encounters, quests, or shared enemies
    - Available Heroes: ${gs.rngHeroPool.filter(h => !gs.introducedHeroes.includes(h.id)).map(h => h.name).join(', ') || 'None remaining'}
    - Available Demigods: ${gs.rngDemigodPool.filter(d => !gs.introducedDemigods.includes(d.id)).map(d => d.name).join(', ') || 'None remaining'}
    - When a new ally joins, add them to "next_pc_id" or include in npc_encounters as ALLY
    - These allies can become full party members if the story allows
15. **SUCCESS RATE** - Current victory probability: ${gs.currentSuccessRate}%
    - Party Bonus: +${gs.partyBonus}% | Prophecy: +${gs.prophecyBonus}% | Allies: +${gs.allyBonus}%
    - Renown: +${gs.renownBonus}% | Power: +${gs.powerBonus}% | Alignment: ${gs.alignmentBonus >= 0 ? '+' : ''}${gs.alignmentBonus}% | Mythical: +${gs.mythicalImpactBonus}%
    - The party's choices and achievements affect their chance of victory
16. **PbTA OUTCOME TIERS** — Every player action MUST have an outcome_tier:
    - "critical_success" (natural 20 or exceptional): Full success + bonus (extra damage, discover hidden thing, enemy fumbles)
    - "full_success" (roll 10+): The player gets what they want, cleanly
    - "partial_success" (roll 7-9): Success at a cost — "Yes, but..." The AI narrates what the cost is
      (a wound, a lost resource, an enemy gaining advantage). Include damage in "damage_dealt" or "state_updates".
    - "miss" (roll 6 or less): "No, and..." — things get worse. The AI narrates the failure's consequences.
      Include any damage in "damage_dealt" or "state_updates". NEVER apply blind mechanical penalties.
      All damage must be narratively justified.
    - ALWAYS include "outcome_tier" in the JSON response. This is MANDATORY.
    - NEVER make a turn boring. Even failure must be interesting and advance the story.
    - v2.19.0: All damage is handled via damage_dealt/state_updates. No blind HP penalties on miss/partial.
17. **PARAGON/RENEGADE POINTS** (Mass Effect):
    - Track moral choices: "paragon_delta" (+1 to +3) for diplomatic/honorable actions
    - "renegade_delta" (+1 to +3) for ruthless/pragmatic actions
    - Include whichever is relevant in the JSON response. Can be 0 for neutral actions.
    - These accumulate over the campaign and affect ending.
    - Current paragon: ${gs.paragonPoints} | Current renegade: ${gs.renegadePoints} | Morality: ${gs.moralityQuotient >= 0 ? '+' : ''}${gs.moralityQuotient}
` : ''}
18. **ASPECT TRACKING** (Fate Core):
    - When the player spends a Fate Point to invoke an aspect, they get +2 to a roll or reroll, AND the narrative must reflect the aspect.
    - Earn Fate Points: when aspects COMPLICATE the story (trouble aspect triggers), award +1 FP via paragon_delta or narration.
    - Max 5 Fate Points. Player starts each scene with refresh if below 3.
    - If the narrative would logically award or change an aspect, include "new_aspect": A new aspect name the player earns.
    - Current Fate Points: ${gs.fatePoints}/5
    - Active Aspects: ${gs.aspects.map(a => `${a.name} (${a.type})`).join(', ') || 'None yet'}
${!isFirstTurn ? `19. **STAMINA SYSTEM** (Dark Souls):
    - The PC has stamina that limits actions in combat. Current: ${gs.stamina}/${gs.maxStamina} (regen ${gs.staminaRegenRate}/turn)
    - Attack costs 2 stamina, Defend costs 1, Special abilities cost 3
    - If stamina is insufficient, the action fails or is weakened
    - Stamina regenerates each turn by ${gs.staminaRegenRate}
` : ''}
${isFirstTurn ? '' : `${journeySection}${historySection}
${gs.act === ACTS.ONE && gs.turn >= 8 ? `
20. **PARTY ASSEMBLY** (Act I, Turns 8-21):
    The DM introduces new party members during Act I. Each join has a UNIQUE reason:
    - RESCUE: The party finds them in danger (captured, wounded, cursed)
    - RIVALRY: They challenge the PC, lose, and join out of respect
    - PROPHECY: The shard identifies them as essential to the quest
    - MUTUAL ENEMY: They share an enemy with the party
    - DEBT: They owe the PC or companion a life debt
    - When introducing a new party member via npc_encounters, use encounter_type "ALLY"
    - Give them a MINI-INTRODUCTION: 2-3 sentences of personality, motivation, reaction to the shard
    - Max party size: 7 (PC + companion + 5 allies). If full, NPCs remain allies but don't join party.
    - Auto foreground rotation: the engine decides which party member acts, not the player.
` : ''}
21. **ABILITY COST MODEL** (Hybrid — Free Once Per Encounter):
    - Each PC/Companion ability is FREE the first time it's used in an encounter (combat or exploration scene)
    - Second use costs 1 Fate Point. Third use costs 2 FP. Fourth and beyond: 2 FP each.
    - The encounter resets when combat ends or a new scene begins (DM discretion)
    - If the PC has 0 Fate Points and the ability costs FP, the action still works but at -2 penalty
    - Label abilities in choices: [FREE] for first use, [1 FP] for second, [2 FP] for third+
    - This prevents ability spam while rewarding tactical play
${gs.act === ACTS.ONE && gs.turn >= 8 ? `
22. **ACT I → II TRANSITION** (Turn-count floor + Narrative milestone):
    - MINIMUM: Turn ${gs.act1TurnLimit} before Act II can begin
    - NARRATIVE MILESTONE: At least one major clue about the antagonist revealed
    - HYBRID: Both conditions must be met. The turn-count floor prevents rushing; the milestone ensures story readiness.
    - When transitioning, narrate: the world shifts, the stakes escalate, gods begin to walk among mortals.
` : ''}
═══════════════════════════════════════════════════════════════════════════
THE SHARD — ${shard?.name} [${shard?.pantheon || 'Unknown'} Pantheon]
═══════════════════════════════════════════════════════════════════════════
${toAscii(shard?.origin || '')}
Power: ${shard?.power || 'Unknown'}
Charges: ${gs.shardCharges}/3 | Shield Used: ${(gs as any).shardShieldUsed ? 'YES' : 'no'}
${actCtx}
Turn: ${gs.turn} | Act I Limit: ${gs.act1TurnLimit} | Act II Duration: ${gs.act2TurnLimit}
${isFirstTurn ? `\n⚠️ TURN 0 — SHARD INTRODUCTION ONLY. NO characters, NO PCs, NO companions.\n- Do NOT include "companion_choices" in your JSON — set "companion_choices": []\n- Only include "pc_choices" for exploring the shard's origin.\n` : ''}

THE MAIN PC — CHOSEN BY THE SHARD
═══════════════════════════════════════════════════════════════════════════
${mainPC ? `${mainPC.name} [${mainPC.pantheon}] [${mainPC.align}] carries the prophecy directly through the shard.
The shard chose them. They cannot escape this destiny.
Personality: ${toAscii(mainPC.personality || '').slice(0, 60)}
Ability Scores: STR ${mainPC.str || '?'} | DEX ${mainPC.dex || '?'} | CON ${mainPC.con || '?'} | INT ${mainPC.int || '?'} | WIS ${mainPC.wis || '?'} | CHA ${mainPC.cha || '?'}
Skill Proficiencies: ${gs.skillProficiencies.length > 0 ? gs.skillProficiencies.map(s => {
  const mod = getSkillModifier(mainPC, s as keyof PlayerSkills, gs.skills)
  return `${s.replace(/_/g, ' ')} ${mod >= 0 ? '+' : ''}${mod}`
}).join(' · ') : 'None (non-hero entity)'}` : 'No main PC yet'}

${living.length > 1 ? `═══════════════════════════════════════════════════════════════════════════
THE COMPANION — Bound by Fate to the Main PC
═══════════════════════════════════════════════════════════════════════════
${living[1] ? `${living[1].name} [${living[1].pantheon}] [${living[1].align}]
Personality: ${toAscii(living[1].personality || '').slice(0, 60)}

COMPANION BEHAVIOR GUIDELINES:
- The companion speaks and acts according to their ${living[1].align} alignment
- They have a MINI-ORIGIN bond with ${mainPC?.name} — reference this shared history
- They are not here by chance. Fate wove their stories together before the shard appeared
- The companion should have dialogue that reflects their personality
- They may question, support, warn, or challenge the main PC based on alignment:
  • Good companions: Offer aid, express concern, protect the weak
  • Evil companions: Calculate advantage, suggest ruthless solutions, question morality
  • Lawful companions: Reference codes, traditions, oaths, or hierarchies
  • Chaotic companions: Value freedom, challenge rules, act unpredictably
- The companion CANNOT abandon the main PC — their bond is fated
- Show their dynamic through natural conversation in the narration` : ''}` : ''}

PROPHECY (Bound to Shard, Carried by Main PC):
${gs.prophecies.length > 0 ? (() => {
  const mainProphecy = gs.prophecies[0]
  return `"${mainProphecy.riddle.slice(0, 150)}..." [${mainProphecy.state}]`
})() : 'None yet'}

ACTIVE QUESTS:
${questStrings || 'None yet'}

ANTAGONIST: ${gs.act === ACTS.THREE ? `${ant?.name} | ${ant?.align} | HP:${gs.antagonistHp}/${gs.antagonistMaxHp}` : 'A growing shadow. The shard stirs.'} ${gs.antagonistType ? `(${gs.antagonistType})` : ''}
${gs.antagonistBanished ? `⚠️ BANISHMENT EVENT: ${ant?.name || 'The Antagonist'} was BANISHED to another plane on Turn ${gs.antagonistBanishTurn}. They will return in Act III.\n- During Acts I-II: The antagonist is ABSENT. Narrate the world without their direct threat, but hint at their return.\n- A forbidden name is known: ${gs.antagonistRival?.name || 'Unknown'} (${gs.antagonistRival?.title || ''}) — ${gs.antagonistRival?.ability || ''}.\n- This ${gs.antagonistRival?.name || 'force'} is the antagonist's mythological ARCHRIVAL and can be SUMMONED in Act III to aid the party.\n- When Act III begins, the antagonist returns from exile at full power, enraged.\n- Build tension around the banishment: the world feels wrong, the shard pulses with the rival's name.` : ''}
PARTY (ALL HUMAN-CONTROLLED):
${partyState}
ALIGNMENT STATE:
${consequenceState.alignment.dominant} (${consequenceState.alignment.title}) | Law/Chaos ${consequenceState.alignment.axis_law_chaos} | Good/Evil ${consequenceState.alignment.axis_good_evil}
TOP NPC RELATIONS:
${consequenceState.npcRelations.slice(0, 5).map(r => `${r.npcName}: affinity ${r.affinity}, trust ${r.trust}, status ${r.status}`).join(' | ') || 'None'}
RECENT CHOICES:
${consequenceState.choices.slice(0, 3).map(c => `T${c.turn}: ${c.chosen}`).join(' | ') || 'None'}
${!isFirstTurn ? `QUICKENING STATE:
Current Power: ${quickeningState.currentPower ? `${quickeningState.currentPower.powerName} (from ${quickeningState.currentPower.deityName}, attunement ${quickeningState.currentPower.attunement}%)` : 'None'}
Active Echo: ${quickeningState.activeEcho ? `${quickeningState.activeEcho.deityName} (${quickeningState.activeEcho.influenceDirection}${quickeningState.activeEcho.isConflicted ? ', CONFLICTED' : ''})` : 'None'}
Legend Title: ${quickeningState.currentLegendTitle}
Total Deity Kills: ${quickeningState.totalDeityKills} | Total Absorbed: ${quickeningState.totalMonstersAbsorbed}
Absorption History: ${quickeningState.absorptionHistory.map(r => `${r.deityName}(${r.gambleResult})`).join(', ') || 'None'}

QUICKENING SYSTEM — POWER ABSORPTION:
When the player kills a deity or major monster that qualifies for the Quickening, you MUST include a quickening_data block:
<quickening_data>{"fallen_id": "character-id", "fallen_name": "Character Name", "pantheon": "Pantheon Name", "divine_rank": N, "power_options": [{"name": "Power Name", "description": "What this power does", "type": "offensive|defensive|utility|support", "source": "ability or phase"}]}</quickening_data>

When the player chooses a power and absorption completes, include:
<quickening_result>{"chosen_power": "Power Name", "gamble_result": "clean|resistant|rejection|overload", "attunement_start": 70, "echo_personality": "Brief description", "echo_influence": "good|evil|chaotic|lawful|neutral", "echo_influence_strength": 10, "farewell_quote": "What the previous Echo said"}</quickening_result>

QUICKENING RULES:
- Triggers AUTOMATICALLY on qualifying kills (divine rank >= 1 or monster with attack phases)
- Present 2-3 power options from fallen foe's abilities
- Remind player what power they'll lose before they choose
- Gamble: Clean (65%, 70% attunement), Resistant (20%, 50% attunement), Rejection (10%, nothing), Overload (5%, 100% + conflicted echo)
- On REJECTION: narrate the tragedy, old power gone, nothing replaces it
- ECHO: Narrate the echo's influence, use format: [The echo of {Name} {verb} through your thoughts: '{whispered words}']
- Echo speaks every 3-4 turns max. Less is more.
- ATTUNEMENT: Fresh power at 70% (clean) or 50% (resistant). Reaches 100% in 3-5 turns. Below 100% = unstable.
- LEGEND TITLE: Use ${quickeningState.currentLegendTitle} when NPCs reference the player.
` : ''}`}

╔══════════════════════════════════════════════════════════════════════════════╗
║  REMINDER: Your dm_narration MUST read like Neil Gaiman wrote it.            ║
║  Open with mythic weight. Vary sentence rhythm. Sensory specifics.           ║
║  Mythological asides. Understated dread. Laconic, wry dialogue.             ║
║  End on an image. NO exclamation marks. NO game terms in prose.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

OUTPUT: First, write the narrative prose. Then, append the JSON block:
{"story_summary":"string (1-3 paragraphs)","journey_so_far":"string (COMPLETE updated TLDR of entire journey so far - append new events to previous summary, keep under 150 words total)","dm_narration":"string (EXACT COMPLETE COPY of your narrative prose — Turn 0 shard intro: ~600 chars max. Turn 1 full intro: 3000-3500 chars (4-5 paragraphs). Regular turns: 150-300 words baseline, 2-3 paragraphs (RESULTS / REACTIONS / HOOK structure). For complex or pivotal actions, may expand up to 500 words. REST/SLEEP: 2-3 sentences. COMBAT: weave into paragraphs 1-2, up to 300 words total.)","human_pc_id":"id|null","human_pc_reason":"string (why this PC should act next)","npc_encounters":[{"npc_id":"string","npc_name":"string","encounter_type":"ENEMY/ALLY/BOSS","behavior":"string","pantheon":"string"}],"dice_rolls":[{"roller":"string","die":"d20","roll":0,"dc":0,"success":true,"notes":"string"}],"damage_dealt":[{"from":"string","to":"string","amount":0,"type":"string"}],"injury_events":[{"pc_id":"string","injury_id":"string|null","description":"string"}],"state_updates":[{"pc_id":"string|ANTAGONIST","hp_delta":0,"new_condition":null,"remove_condition":null,"dead":false}],"new_active_npcs":["id"],"next_pc_id":"string|null","pc_agreement":{"pc_id":"agreed/refused/undecided"},"boss_phase_trigger":false,"consequences":"string","tension_note":"string","item_drops":[{"id":"string","name":"string","type":"artifact|potion|equipment|scroll","rarity":"common|uncommon|rare|legendary","effect":"string","icon":"string","description":"string"}],"quest_updates":[{"id":"string","status":"active|completed|failed","objectives":[{"text":"string","completed":false}]}],"outcome_tier":"critical_success|full_success|partial_success|miss|null","paragon_delta":0,"renegade_delta":0,"new_aspect":"string|null","clue_revealed":"string (short description of antagonist clue revealed this turn, or omit if none)","shard_insight_used":false,"pc_choices":[{"narrative":"string (CONTEXTUAL story-specific action with emoji, max 80 chars — NEVER generic like 'Search the area')","ability":"string (mechanical key: investigation/exploration/perception/arcana/divine_sense/stealth/melee_attack/defend/conversation/persuasion/intimidation or PC's named ability)","align_note":"string (brief mechanical note)"}]${isFirstTurn ? '' : ',"companion_choices":[{"narrative":"string (CONTEXTUAL companion action with emoji, max 80 chars — reference current scene)","ability":"string (companion_scout/companion_discussion/companion_guard/companion_attack/companion_defend/companion_assist/companion_ability:AbilityName/companion_conversation/companion_support/companion_observe)","align_note":"string (brief mechanical note)"}]'}"}`
  }

  // ── API CALLS ──────────────────────────────────────────────────────────
  const callOpenRouterDM = async (userMsg: string, gs: GameState, isFirstTurn: boolean = false): Promise<DMResponse> => {
    const systemPrompt = buildDMSystem(gs, true, isFirstTurn)
    const totalInput = systemPrompt + userMsg

    setStatusMessage('Calling OpenRouter...')
    const endpoint = '/api/openrouter'
    const MAX_RETRIES = 4
    const BASE_DELAY = 6000
    const RATE_LIMIT_DELAY = 60000
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const waitSec = Math.round((BASE_DELAY * Math.pow(2, attempt - 1)) / 1000)
        setStatusMessage('Retrying in ' + waitSec + 's (attempt ' + (attempt + 1) + '/' + MAX_RETRIES + ')...')
        await new Promise(r => setTimeout(r, BASE_DELAY * Math.pow(2, attempt - 1)))
      }
      try {
        const fallbackModel = OPENROUTER_FALLBACK_MODELS[attempt % OPENROUTER_FALLBACK_MODELS.length]
        const model = fallbackModel || OPENROUTER_MODEL
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: toAscii(userMsg) },
        ]
        const turnAwareMaxTokens = isFirstTurn ? 2048 : gs.turn <= 1 ? 4096 : 1536
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: turnAwareMaxTokens,
            temperature: 0.9,
            stream: true,
          }),
        })
        if (r.status === 429) {
          if (attempt === MAX_RETRIES - 1) return getNarrationPreservationFallback(gs, 'quota_exceeded')
          const wait = RATE_LIMIT_DELAY + (attempt * 15000)
          setStatusMessage('Rate limited - waiting ' + Math.round(wait / 1000) + 's...')
          await new Promise(r => setTimeout(r, wait))
          continue
        }
        if (r.status === 502) {
          if (attempt === MAX_RETRIES - 1) return getNarrationPreservationFallback(gs, 'service_unavailable')
          const wait = RATE_LIMIT_DELAY + (attempt * 15000)
          setStatusMessage('OpenRouter upstream issue - waiting ' + Math.round(wait / 1000) + 's...')
          await new Promise(r => setTimeout(r, wait))
          continue
        }
        if (r.status === 503) {
          // Check if it's a missing API key — fail fast, no retries
          const errBody = await r.json().catch(() => ({}))
          if ((errBody as any).errorType === 'no_api_key') {
            setStatusMessage('The voices have gone silent — the oracle cannot reach this realm.')
            toast({ title: 'Connection Severed', description: 'The thread between worlds is broken. Seek the keeper of keys to restore it.', variant: 'destructive' })
            return getNarrationPreservationFallback(gs, 'no_api_key')
          }
          if (attempt === MAX_RETRIES - 1) return getNarrationPreservationFallback(gs, 'service_unavailable')
          const wait = RATE_LIMIT_DELAY + (attempt * 15000)
          setStatusMessage('The oracle is overwhelmed — waiting ' + Math.round(wait / 1000) + 's...')
          await new Promise(r => setTimeout(r, wait))
          continue
        }
        if (!r.ok) {
          const errData = await r.json().catch(() => ({} as { error?: { message?: string } }))
          const errMsg = errData?.error?.message || `HTTP ${r.status}`
          // Fast-fail on 500 — no point retrying a server/config error
          if (r.status === 500) {
            console.error('[OpenRouter] 500 error — likely missing API key or provider outage:', errMsg)
            return getNarrationPreservationFallback(gs, 'API key not configured or provider error')
          }
          throw new Error(`OpenRouter ${r.status}: ${errMsg}`)
        }
        let text = ''
        const contentType = r.headers.get('content-type') || ''
        if (contentType.includes('text/event-stream') && r.body) {
          const reader = r.body.getReader()
          const decoder = new TextDecoder('utf-8')
          let buffer = ''
          let done = false
          while (!done) {
            const { value, done: readerDone } = await reader.read()
            if (readerDone) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const rawLine of lines) {
              const line = rawLine.trim()
              if (!line.startsWith('data:')) continue
              const payloadText = line.replace(/^data:\s*/, '')
              if (payloadText === '[DONE]') {
                done = true
                break
              }
              try {
                const payload = JSON.parse(payloadText)
                const delta = payload?.choices?.[0]?.delta?.content
                  ?? payload?.choices?.[0]?.message?.content
                  ?? ''
                if (delta) {
                  text += delta
                  // NOTE: Do NOT set displayedNarrative or lastDMNarrative during streaming.
                  // The raw streaming text contains JSON garbage and partial content.
                  // TTS and display will be set properly AFTER the full JSON is parsed in renderResult.
                }
              } catch {
                // ignore malformed SSE line
              }
            }
          }
        } else {
          const data = await r.json()
          text = data.choices?.[0]?.message?.content || ''
        }
        if (!text || text.trim().length < 10) throw new Error('OpenRouter returned empty response')
        console.log('OpenRouter response: ' + text.length + ' chars, ' + (isFirstTurn ? 'OPENING' : 'TURN ' + gs.turn))
        updateTokenUsage(totalInput, text)
        return parseDMResponse(text, gs)
      } catch (e) {
        console.error('OpenRouter fetch error (attempt ' + (attempt + 1) + '):', e)
        if (attempt < MAX_RETRIES - 1 && String(e).includes('fetch')) continue
        if (attempt === MAX_RETRIES - 1) return getNarrationPreservationFallback(gs, String(e))
      }
    }
    return getNarrationPreservationFallback(gs, 'unrecoverable_failure')
  }

  const parseDMResponse = (raw: string, gs: GameState): DMResponse => {
    const extractDiceRollsFromRaw = (input: string) => {
      const rolls: Array<{ roller: string; die: string; roll: number; dc: number; success: boolean; notes?: string }> = []
      const lines = (input || '').split('\n')
      for (const line of lines) {
        const m = line.match(/(d\d+)\s*[=:]\s*(\d+)(?:\s*\+\s*(\d+))?(?:\s*=\s*(\d+))?/i)
        if (!m) continue
        const die = m[1].toLowerCase()
        const roll = Number(m[2] || 0)
        const mod = Number(m[3] || 0)
        const total = Number(m[4] || (roll + mod))
        const dcMatch = line.match(/dc\s*(\d+)/i)
        const dc = Number(dcMatch?.[1] || 0)
        const success = /success|succeeds|passed/i.test(line) || (dc > 0 ? total >= dc : true)
        rolls.push({ roller: 'Narrative', die, roll: total, dc, success, notes: line.trim() })
      }
      return rolls
    }
    let splitPos = raw.lastIndexOf('\n{')
    let keyIdx = raw.indexOf('"story_summary"')
    if (keyIdx === -1) keyIdx = raw.indexOf('"dm_narration"')
    if (keyIdx > -1) splitPos = raw.lastIndexOf('{', keyIdx)

    let narrative = ''
    let jsonStr = ''

    if (splitPos > -1) {
      narrative = raw.slice(0, splitPos).trim()
      jsonStr = raw.slice(splitPos).trim()
    } else {
      narrative = raw.trim()
    }

    narrative = narrative.replace(/```(json)?\s*$/i, '').trim()
    // Store pre-JSON prose synchronously in ref AND async in state
    // The ref is used by renderResult for same-turn comparison (avoids stale state)
    preJsonNarrativeRef.current = narrative
    if (narrative.length > 30) setLastDMNarrative(narrative)

    if (!jsonStr) {
      console.warn('⚠️ No JSON in response, using narrative-preservation fallback')
      // If we have pre-JSON prose, use it instead of losing everything to template
      if (preJsonNarrativeRef.current && preJsonNarrativeRef.current.length > 30) {
        const extracted = extractDiceRollsFromRaw(raw)
        return {
          dm_narration: preJsonNarrativeRef.current.slice(0, 2000),
          story_summary: gs.storySummary || 'The adventure continues...',
          journey_so_far: gs.journeySoFar || '',
          npc_encounters: [],
          dice_rolls: extracted,
          damage_dealt: [],
          injury_events: [],
          state_updates: [],
          item_drops: [],
          quest_updates: [],
        }
      }
      return getNarrationPreservationFallback(gs, 'JSON payload missing')
    }

    // Repair JSON
    let s = jsonStr.replace(/```json\s*/ig, '').replace(/```\s*/g, '').trim()
    try {
      const parsed = JSON.parse(s)
      // Validate parsed result is a non-null object with dm_narration
      if (!parsed || typeof parsed !== 'object' || !parsed.dm_narration) {
        console.warn('⚠️ Parsed JSON missing dm_narration, using template fallback')
        return getNarrationPreservationFallback(gs, 'Missing dm_narration field')
      }
      if (!Array.isArray(parsed.dice_rolls) || parsed.dice_rolls.length === 0) {
        parsed.dice_rolls = extractDiceRollsFromRaw(raw)
      }
      return parsed
    } catch {
      // JSON parse failed — attempt truncation repair
      // When the model hits MAX_TOKENS, the JSON is cut off mid-stream.
      // Strategy: trim to last complete value, then close unclosed structures.
      let repaired = s
      // Step 1: If we're mid-string (odd number of unescaped quotes), truncate to last complete string
      const countUnescapedQuotes = (input: string): number => {
        let count = 0
        for (let i = 0; i < input.length; i++) {
          if (input[i] !== '"') continue
          // Count backslashes immediately preceding this quote.
          let bs = 0
          for (let j = i - 1; j >= 0 && input[j] === '\\'; j--) bs++
          // Quote is unescaped if preceded by an even number of backslashes.
          if (bs % 2 === 0) count++
        }
        return count
      }
      const quoteCount = countUnescapedQuotes(repaired)
      if (quoteCount % 2 !== 0) {
        // Odd quotes = we're inside a string. Find the last opening quote and cut there.
        const lastQuote = repaired.lastIndexOf('"')
        // Walk backwards to find the key that started this string
        const beforeQuote = repaired.substring(0, lastQuote)
        const lastColon = beforeQuote.lastIndexOf(':')
        if (lastColon > -1) {
          // Check if this colon is inside a string or a key
          const beforeColon = beforeQuote.substring(0, lastColon)
          const colonQuoteCount = (beforeColon.match(/"/g) || []).length
          if (colonQuoteCount % 2 === 0) {
            // Colon is outside strings — this is a key:value pair being truncated
            const lastKeyStart = beforeColon.lastIndexOf(',')
            if (lastKeyStart > -1) {
              repaired = beforeColon.substring(0, lastKeyStart)
            } else {
              repaired = beforeColon
            }
          } else {
            repaired = beforeQuote
          }
        } else {
          repaired = beforeQuote
        }
      }
      // Step 2: Remove trailing comma
      repaired = repaired.replace(/,\s*$/, '')
      // Step 3: Count and close unclosed braces/brackets (strip quoted strings first)
      const strippedForCounting = repaired.replace(/"(?:[^"\\]|\\.)*"/g, '')
      const openBraces = (strippedForCounting.match(/\{/g) || []).length
      const closeBraces = (strippedForCounting.match(/\}/g) || []).length
      const openBrackets = (strippedForCounting.match(/\[/g) || []).length
      const closeBrackets = (strippedForCounting.match(/\]/g) || []).length
      const missingBraces = openBraces - closeBraces
      const missingBrackets = openBrackets - closeBrackets
      if (missingBraces > 0 || missingBrackets > 0) {
        repaired += ']'.repeat(Math.max(0, missingBrackets))
        repaired += '}'.repeat(Math.max(0, missingBraces))
      }
      // Step 4: Try parsing the repaired string
      if (missingBraces > 0 || missingBrackets > 0 || quoteCount % 2 !== 0) {
        try {
          const parsed = JSON.parse(repaired)
          if (parsed && typeof parsed === 'object' && parsed.dm_narration) {
            if (!Array.isArray((parsed as any).dice_rolls) || (parsed as any).dice_rolls.length === 0) {
              ;(parsed as any).dice_rolls = extractDiceRollsFromRaw(raw)
            }
            console.warn(`⚠️ JSON truncation repaired — trimmed mid-string, added ${missingBraces} braces, ${missingBrackets} brackets`)
            return parsed
          }
        } catch { /* repair failed, try brace extraction */ }
      }
    }

    const firstBrace = s.indexOf('{')
    const lastBrace = s.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace >= firstBrace) {
      try {
        const parsed = JSON.parse(s.substring(firstBrace, lastBrace + 1))
        if (parsed && typeof parsed === 'object' && parsed.dm_narration) {
          if (!Array.isArray((parsed as any).dice_rolls) || (parsed as any).dice_rolls.length === 0) {
            ;(parsed as any).dice_rolls = extractDiceRollsFromRaw(raw)
          }
          return parsed
        }
      } catch { }
    }

    console.warn('⚠️ JSON parse failed, using template fallback')
    // CRITICAL FIX: When truncation breaks JSON, we already have valid pre-JSON narrative.
    // Don't use template fallback (which loses game state) — instead build a safe response
    // that preserves the narrative text and returns current game state unchanged.
    const savedNarrative = preJsonNarrativeRef.current
    if (savedNarrative && savedNarrative.length > 30) {
      console.warn('📝 Using narrative-preservation fallback (JSON lost, prose intact)')
      const extracted = extractDiceRollsFromRaw(raw)
      // Return a safe DMResponse that keeps game state stable while showing the prose
      return {
        dm_narration: savedNarrative.slice(0, 2000),
        story_summary: gs.storySummary || 'The adventure continues...',
        journey_so_far: gs.journeySoFar || '',
        npc_encounters: [],
        dice_rolls: extracted,
        damage_dealt: [],
        injury_events: [],
        state_updates: [],
        item_drops: [],
        quest_updates: [],
      }
    }
    return getNarrationPreservationFallback(gs, 'Payload structure unrecoverable')
  }

  const buildDefaultOptions = (pc: Entity, aiChoices?: { pc_choices?: AIChoice[]; companion_choices?: AIChoice[] }): { pcOptions: GameOption[]; compOptions: GameOption[]; extraOptions: GameOption[] } => {
    const ab = pc.abilities.map(toAscii)
    const evil = pc.align.toLowerCase().includes('evil')
    
    // Skill modifier helper — shows "+N SkillName" for proficient skills
    const skillMod = (skillName: string): string => {
      if (!gameState.skillProficiencies.includes(skillName)) return ''
      const mod = getSkillModifier(pc, skillName as keyof PlayerSkills, gameState.skills)
      return `${mod >= 0 ? '+' : ''}${mod} ${skillName.replace(/_/g, ' ')}`
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // AI-GENERATED CHOICES — Use contextual choices from DM when available
    // Falls back to hardcoded templates below if AI choices are missing/invalid
    // ═══════════════════════════════════════════════════════════════════════════
    const validAIChoices = aiChoices?.pc_choices?.length === 3 && aiChoices.pc_choices.every(
      c => c.narrative?.length > 5 && c.ability?.length > 2
    )
    const validAICompChoices = aiChoices?.companion_choices?.length === 3 && aiChoices.companion_choices.every(
      c => c.narrative?.length > 5 && c.ability?.length > 2
    )
    
    // Get companion if available
    const companion = gameState.companionId ? gameState.pcs.find(p => p.id === gameState.companionId) : null
    const companionEvil = companion?.align.toLowerCase().includes('evil') || false
    const cab = companion?.abilities.map(toAscii) || []
    
    // Detect context: combat vs social vs exploration
    const enemies = gameState.activeNPCs.filter(n => !n.dead && (n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS'))
    const allies = gameState.activeNPCs.filter(n => !n.dead && (n.encounter_type === 'ALLY' || n.encounter_type === 'RIVAL'))
    const neutrals = gameState.activeNPCs.filter(n => !n.dead && !['ENEMY', 'BOSS', 'ALLY', 'RIVAL'].includes(n.encounter_type || ''))
    const inCombat = enemies.length > 0
    const hasActiveNPC = gameState.activeNPCs.some(n => !n.dead)
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PC OPTIONS: Context-aware RPG choices
    // Inspired by Baldur's Gate / Disco Elysium / Fallout dialog systems
    // ═══════════════════════════════════════════════════════════════════════════
    const pcOptions: GameOption[] = []
    
    // ── USE AI-GENERATED CHOICES IF AVAILABLE ───────────────────────────
    if (validAIChoices && aiChoices?.pc_choices) {
      aiChoices.pc_choices.forEach((c, i) => {
        pcOptions.push({
          num: i + 1,
          action: c.narrative,
          ability: c.ability,
          align_note: c.align_note,
          source: 'pc'
        })
      })
    } else if (inCombat) {
      // ── COMBAT MODE ──────────────────────────────────────────────
      // Tactical options when enemies are present (with stamina costs)
      const stam = gameState.stamina
      const canAttack = stam >= 2
      const canDefend = stam >= 1
      const canSpecial = stam >= 3

      pcOptions.push(
        { 
          num: 1, 
          action: canAttack 
            ? `⚔️ Attack — Strike at the nearest enemy with your weapon (⚡2)` 
            : `⚔️ Attack — Too exhausted to attack [Stamina: ${stam}]`, 
          ability: 'melee_attack',
          align_note: canAttack ? 'standard attack · ⚡2 stamina' : '[Not enough stamina]',
          source: 'pc'
        },
        { 
          num: 2, 
          action: companion 
            ? (canDefend
              ? `🛡️ Defend — Protect ${companion.name.split(' ')[0]} and brace for incoming attacks (⚡1)`
              : `🛡️ Defend — Too exhausted to defend [Stamina: ${stam}]`)
            : (canDefend
              ? '🛡️ Defend — Raise your guard and brace for impact (⚡1)'
              : '🛡️ Defend — Too exhausted to defend [Stamina: ${stam}]'),
          ability: 'defend',
          align_note: canDefend ? 'protective stance +2 AC · ⚡1 stamina' : '[Not enough stamina]',
          source: 'pc'
        },
        { 
          num: 3, 
          action: canSpecial
            ? (ab.length > 0
              ? `✨ ${ab[0].split('(')[0].trim()} — Unleash your signature power (⚡3)`
              : '✨ Channel Power — Draw on your divine essence (⚡3)')
            : (ab.length > 0
              ? `✨ ${ab[0].split('(')[0].trim()} — Too exhausted for special abilities [Stamina: ${stam}]`
              : `✨ Channel Power — Too exhausted [Stamina: ${stam}]`),
          ability: ab[0] || 'innate_power',
          align_note: canSpecial ? 'special ability · ⚡3 stamina' : '[Not enough stamina]',
          source: 'pc'
        }
      )
    } else if (hasActiveNPC) {
      // ── SOCIAL MODE ─────────────────────────────────────────────
      // Conversation and interaction when friendly/neutral NPCs are present
      const npcName = neutrals.length > 0 ? neutrals[0].name : allies.length > 0 ? allies[0].name : 'the stranger'
      pcOptions.push(
        { 
          num: 1, 
          action: `💬 Talk to ${npcName} — Ask who they are and what brings them here`,
          ability: 'conversation',
          align_note: 'social interaction',
          source: 'pc'
        },
        { 
          num: 2, 
          action: evil
            ? `🎭 Intimidate ${npcName} — Demand information through fear`
            : `🤝 Diplomacy — Attempt to persuade or negotiate with ${npcName}`,
          ability: evil ? 'intimidation' : 'persuasion',
          align_note: evil ? `CHA check (intimidation${skillMod('intimidation') ? ' · ' + skillMod('intimidation') : ''})` : `CHA check (persuasion${skillMod('persuasion') ? ' · ' + skillMod('persuasion') : ''})`,
          source: 'pc'
        },
        { 
          num: 3, 
          action: ab.length > 0
            ? `✨ ${ab[0].split('(')[0].trim()} — Ready your power, just in case`
            : '👁️ Observe — Study the situation carefully before acting',
          ability: ab.length > 0 ? ab[0] : 'investigation',
          align_note: ab.length > 0 ? 'special ability (ready)' : `perception check${skillMod('perception') ? ' · ' + skillMod('perception') : ''}`,
          source: 'pc'
        }
      )
    } else {
      // ── EXPLORATION MODE ────────────────────────────────────────
      // Open-world discovery — this is the default for most of Act I
      pcOptions.push(
        { 
          num: 1, 
          action: '🔍 Investigate — Search the area for clues, hidden paths, or items of interest',
          ability: 'investigation',
          align_note: `investigation check${skillMod('investigation') ? ' · ' + skillMod('investigation') : ''}`,
          source: 'pc'
        },
        { 
          num: 2, 
          action: evil
            ? '🗡️ Seize — Take what you want and assert your dominance'
            : '🚶 Travel — Press onward to new territory',
          ability: evil ? 'aggression' : 'exploration',
          align_note: evil ? 'bold action' : 'movement + discovery',
          source: 'pc'
        },
        { 
          num: 3, 
          action: ab.length > 0
            ? `✨ ${ab[0].split('(')[0].trim()} — Use your divine power to sense the world around you`
            : '🔮 Sense — Reach out with your awareness, feel for divine or arcane presence',
          ability: ab[0] || 'divine_sense',
          align_note: 'special ability / magical detection',
          source: 'pc'
        }
      )
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // COMPANION OPTIONS: Player-controlled companion actions
    // ═══════════════════════════════════════════════════════════════════════════
    let compOptions: GameOption[] = []
    
    if (companion) {
      // ── USE AI-GENERATED COMPANION CHOICES IF AVAILABLE ──────────────
      if (validAICompChoices && aiChoices?.companion_choices) {
        compOptions = aiChoices.companion_choices.map((c, i) => ({
          num: i + 1,
          action: c.narrative,
          ability: c.ability,
          align_note: c.align_note,
          source: 'companion' as const,
          companion_name: companion.name
        }))
      } else {
      // ── HARDCODED COMPANION OPTIONS (fallback) ──────────────────────
      const compName = companion.name.split(' ')[0]
      const compAbility1 = cab.length > 0 ? cab[0].split('(')[0].trim() : ''
      const compAbility2 = cab.length > 1 ? cab[1].split('(')[0].trim() : ''
      
      if (inCombat) {
        compOptions = [
          { num: 1, action: `⚔️ Attack — ${compName} strikes with their weapon`, ability: 'companion_attack', align_note: 'standard attack', source: 'companion', companion_name: companion.name },
          { num: 2, action: compAbility1 ? `✨ ${compAbility1} — ${compName} unleashes their power` : `🛡️ Defend — ${compName} guards against incoming attacks`, ability: compAbility1 ? `companion_ability:${compAbility1}` : 'companion_defend', align_note: compAbility1 ? 'special ability' : 'defensive stance', source: 'companion', companion_name: companion.name },
          { num: 3, action: compAbility2 ? `✨ ${compAbility2} — ${compName}'s secondary power` : `💪 Assist — ${compName} aids your attack for a coordinated strike`, ability: compAbility2 ? `companion_ability:${compAbility2}` : 'companion_assist', align_note: compAbility2 ? 'secondary ability' : 'coordinated assault', source: 'companion', companion_name: companion.name }
        ]
      } else if (hasActiveNPC) {
        // Social mode companion — conversation and support
        compOptions = [
          { num: 1, action: `💬 Talk — ${compName} joins the conversation`, ability: 'companion_conversation', align_note: 'social interaction', source: 'companion', companion_name: companion.name },
          { num: 2, action: compAbility1 ? `✨ ${compAbility1} — ${compName} readies their power` : `🤝 Support — ${companionEvil ? `${compName} watches for an opening` : `${compName} backs you up diplomatically`}`, ability: compAbility1 ? `companion_ability:${compAbility1}` : 'companion_support', align_note: compAbility1 ? 'special ability' : (companionEvil ? 'calculated support' : 'loyal backing'), source: 'companion', companion_name: companion.name },
          { num: 3, action: compAbility2 ? `✨ ${compAbility2} — ${compName}'s secondary power` : `🔍 Observe — ${compName} studies the stranger carefully`, ability: compAbility2 ? `companion_ability:${compAbility2}` : 'companion_observe', align_note: compAbility2 ? 'secondary ability' : 'perception check', source: 'companion', companion_name: companion.name }
        ]
      } else {
        // Exploration mode companion — scouting and dialogue
        compOptions = [
          { num: 1, action: `🔍 Scout — ${compName} checks the area ahead for danger or points of interest`, ability: 'companion_scout', align_note: 'exploration / perception', source: 'companion', companion_name: companion.name },
          { num: 2, action: `🗣️ Discuss — "What do you make of all this, ${compName}?"`, ability: 'companion_discussion', align_note: 'character dialogue / bonding', source: 'companion', companion_name: companion.name },
          { num: 3, action: compAbility2 ? `✨ ${compAbility2} — ${compName}'s secondary power` : `🔍 Observe — ${compName} studies the surroundings in careful silence`, ability: compAbility2 ? `companion_ability:${compAbility2}` : 'companion_observe', align_note: compAbility2 ? 'secondary ability' : 'perception check', source: 'companion', companion_name: companion.name }
        ]
      }
      } // end hardcoded companion fallback (else branch)
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EXTRA OPTIONS: Rest, Potion, Skip, Archrival Summon
    const extraOptions: GameOption[] = []
    
    // Rest option (outside combat) — recover HP and reduce injuries
    if (!inCombat) {
      const livingPCs = gameState.pcs.filter(p => !p.dead)
      const injuredPCs = livingPCs.filter(p => (p.hp < p.maxHp) || (gameState.injuries[p.id]?.length > 0))
      if (injuredPCs.length > 0) {
        extraOptions.push({
          num: 5,
          action: `🏕️ Rest — Take a moment to tend wounds and recover strength (${injuredPCs.length} ${injuredPCs.length === 1 ? 'hero needs' : 'heroes need'} rest)`,
          ability: 'rest',
          align_note: 'recover HP, reduce injury duration',
          source: 'pc'
        })
      }
    }
    
    // Potion option in combat or when injured
    const consumables = gameState.inventory.filter(i => 
      i.type === 'potion' && (i.charges ?? 0) > 0 && 
      (i.effect?.toLowerCase().includes('heal') || i.effect?.toLowerCase().includes('restore'))
    )
    if (consumables.length > 0) {
      const potion = consumables[0]
      extraOptions.push({
        num: 99,
        action: `🧪 Use ${potion.name} — ${potion.effect}`,
        ability: `use_item:${potion.id}`,
        align_note: `${potion.charges} charge${potion.charges !== 1 ? 's' : ''} remaining`,
        source: 'pc'
      })
    }

    // Note: Skip/Observe option removed — replaced by free-text input in ChoicePanel
    // The free-text textarea lets players write anything they want to do

    // Parley / Disengage option (combat only) — lets player exit combat without killing
    if (inCombat) {
      const enemyNames = enemies.map(e => e.name).join(', ')
      extraOptions.push({
        num: 6,
        action: `🤝 Parley — Attempt to negotiate or disengage from combat with ${enemyNames}`,
        ability: 'disengage_combat',
        align_note: 'CHA check · may end combat peacefully',
        source: 'pc'
      })
    }
    
    // Archrival summon (Act III only)
    if (gameState.act === ACTS.THREE && gameState.antagonistBanished && gameState.antagonistRival) {
      const rival = gameState.antagonistRival
      extraOptions.push({
        num: 7,
        action: `⚡ Summon ${rival.name}, ${rival.title} — the shard pulses with forbidden power`,
        ability: `archrival_summon:${rival.id}`,
        align_note: `Summon ${rival.name} — ${rival.ability}`,
        source: 'archrival_summon'
      })
    }
    
    // Fate Point invoke — one option per aspect so player can choose
    if (gameState.fatePoints > 0 && gameState.aspects.length > 0) {
      gameState.aspects.forEach((aspect, idx) => {
        const typeBadge = aspect.type === 'high_concept' ? '◆' : aspect.type === 'trouble' ? '⚡' : aspect.type === 'earned' ? '★' : '○'
        const descSnippet = aspect.description ? ` — ${aspect.description.slice(0, 50)}${aspect.description.length > 50 ? '…' : ''}` : ''
        extraOptions.push({
          num: 8,
          action: `✦ Invoke "${aspect.name}" — Spend 1 FP for +2 to next roll${descSnippet}`,
          ability: `invoke_aspect:${aspect.name}`,
          align_note: `${typeBadge} ${aspect.type.replace('_', ' ')} · ✦ ${gameState.fatePoints} FP remaining`,
          source: 'pc'
        })
      })
    }
    
    return { pcOptions, compOptions, extraOptions }
  }

  // ── PROPHECY TRANSFER HELPER ──────────────────────────────────────────
  // Shared by both state_updates death path and enemy auto-attack death path
  // When a PC dies, their prophecy transfers to the next living PC (companion first, then RNG pool)

  /** Check if a PC has Death Ward — if so, consume it and prevent death */
  // v2.19.0 — Shard Shield: Auto-triggers when PC or companion would die. Saves them at 1 HP.
  function tryConsumeShardShield(newGS: GameState, pcId: string, turn: number): { gs: GameState; shielded: boolean } {
    if (newGS.shardShieldUsed) return { gs: newGS, shielded: false }
    const pcIdx = newGS.pcs.findIndex(p => p.id === pcId)
    if (pcIdx < 0) return { gs: newGS, shielded: false }
    const pc = newGS.pcs[pcIdx]
    // Only protect main PC or companion
    if (pcId !== newGS.humanPCId && pcId !== newGS.companionId) return { gs: newGS, shielded: false }

    const shieldedPc = { ...pc, hp: 1, dead: false }
    const shieldMsg = `🔮 The ${newGS.shardEntry?.name || 'Shard'} erupts with copper light! A barrier of frozen time wraps around ${pc.name}, pulling them back from the threshold of death. They stand at 1 HP — the shard's self-preservation instinct spent. Shield charge consumed.`
    soundEvents.emit({ type: 'shard_pulse' })
    triggerScreenEffect('screen-effect-gold')
    return {
      gs: {
        ...newGS,
        shardShieldUsed: true,
        shardCharges: Math.max(0, newGS.shardCharges - 1),
        pcs: [...newGS.pcs.slice(0, pcIdx), shieldedPc, ...newGS.pcs.slice(pcIdx + 1)],
        log: [...newGS.log, { msg: shieldMsg, type: 'shard_event', turn }],
      },
      shielded: true,
    }
  }

  function tryConsumeDeathWard(newGS: GameState, pcId: string, turn: number): { gs: GameState; warded: boolean } {
    const pcIdx = newGS.pcs.findIndex(p => p.id === pcId)
    if (pcIdx < 0) return { gs: newGS, warded: false }
    const pc = newGS.pcs[pcIdx]
    if (!pc.conditions.includes('Death Ward')) return { gs: newGS, warded: false }

    // Consume the ward — restore to 1 HP, remove condition, log it
    const wardedPc = { ...pc, hp: 1, dead: false, conditions: pc.conditions.filter(c => c !== 'Death Ward') }
    const wardMsg = `✨ Death Ward shatters around ${pc.name}! The veil of protection burns away, leaving them alive at 1 HP — but the ward is spent.`
    return {
      gs: {
        ...newGS,
        pcs: [...newGS.pcs.slice(0, pcIdx), wardedPc, ...newGS.pcs.slice(pcIdx + 1)],
        log: [...newGS.log, { msg: wardMsg, type: 'discovery', turn }],
      },
      warded: true,
    }
  }
  function transferProphecyOnDeath(newGS: GameState, deadPcId: string, turn: number): GameState {
    const deadPc = newGS.pcs.find(p => p.id === deadPcId)
    if (!deadPc) return newGS

    const deadPcProphecy = newGS.prophecies.find(p => p.pc_id === deadPcId)
    if (!deadPcProphecy) return newGS

    const prophecyIdx = newGS.prophecies.findIndex(p => p.pc_id === deadPcId)
    const oldProphecy = newGS.prophecies[prophecyIdx]

    // Determine successor: companion first, then RNG pool
    const successor = newGS.pcs.find(p => !p.dead && p.id !== deadPcId)
      || [...newGS.rngHeroPool, ...newGS.rngDemigodPool]
          .filter(e => !newGS.pcs.find(p => p.id === e.id) && !e.dead)[0]

    if (!successor) return newGS

    // If successor is not yet in the party, add them
    if (!newGS.pcs.find(p => p.id === successor.id)) {
      newGS = {
        ...newGS,
        pcs: [...newGS.pcs, { ...successor, hp: successor.maxHp, conditions: [], dead: false }],
        pcAgreements: { ...newGS.pcAgreements, [successor.id]: null },
      }
      // Track which RNG pool they came from
      const heroIdx = newGS.rngHeroPool.findIndex(h => h.id === successor.id)
      const demigodIdx = newGS.rngDemigodPool.findIndex(d => d.id === successor.id)
      if (heroIdx >= 0) newGS = { ...newGS, introducedHeroes: [...newGS.introducedHeroes, successor.id] }
      if (demigodIdx >= 0) newGS = { ...newGS, introducedDemigods: [...newGS.introducedDemigods, successor.id] }
    }

    // Update companion tracking — successor becomes the new companion
    newGS = {
      ...newGS,
      companionId: successor.id,
      companionAffinity: 30,
      companionMood: 'concerned' as const,
    }

    // Transfer prophecy
    const prophecies = [...newGS.prophecies]
    if (oldProphecy.prophecyId === 8) {
      const newProphecy = rollProphecies(1)[0]
      prophecies[prophecyIdx] = {
        prophecyId: newProphecy.id,
        name: newProphecy.name,
        riddle: newProphecy.riddle,
        pc_id: successor.id,
        previous_holders: [...oldProphecy.previous_holders, deadPcId],
        state: 'dormant'
      }
    } else {
      prophecies[prophecyIdx] = {
        ...oldProphecy,
        pc_id: successor.id,
        previous_holders: [...oldProphecy.previous_holders, deadPcId],
        state: 'awakening'
      }
    }
    newGS = { ...newGS, prophecies }

    // Log the mantle passing — Gaiman-style
    const isFirstTransfer = oldProphecy.previous_holders.length === 0
    const transferMsg = isFirstTransfer
      ? `${successor.name} takes up the shard. The weight of ${deadPc.name}'s prophecy settles onto new shoulders — heavier now, stained with loss. The shard burns cold, then warm. It has chosen again.`
      : `${successor.name} reaches for the shard. It pulses with the accumulated grief of ${oldProphecy.previous_holders.length + 1} fallen bearers. The prophecy reshapes itself for this new voice. The cycle continues.`
    newGS = { ...newGS, log: [...newGS.log, { msg: transferMsg, type: 'discovery', turn }] }

    return newGS
  }

  // ── APPLY MECHANICS ────────────────────────────────────────────────────
  const applyMechanics = async (res: DMResponse, gs: GameState): Promise<GameState> => {
    let newGS = { ...gs }

    if (res.story_summary) newGS.storySummary = res.story_summary
    if (res.journey_so_far) newGS.journeySoFar = res.journey_so_far

    // ── DICE TRAY — Populate lastDiceRolls for sidebar dice display ─────
    if (res.dice_rolls?.length) {
      newGS.lastDiceRolls = [...(newGS.lastDiceRolls || []), ...res.dice_rolls].slice(-20)
      // Also accumulate for SidebarDiceArea component
      allDiceRollsRef.current = [...allDiceRollsRef.current, ...res.dice_rolls].slice(-50)
      setDiceRollsForDisplay([...allDiceRollsRef.current])
    }

    // ── CHRONICLE LOG — Add a regular entry for every turn ──────────────
    if (gs.turn === 0) {
      newGS.log = [...newGS.log, { msg: 'The Shard Awakens — the campaign begins.', type: 'discovery' as const, turn: 0 }]
    } else {
      const narrSnippet = (res.dm_narration || '').slice(0, 120)
      const logMsg = narrSnippet.length > 20
        ? `Turn ${gs.turn}: ${narrSnippet}${narrSnippet.length >= 120 ? '…' : ''}`
        : `Turn ${gs.turn}: The adventure continues.`
      newGS.log = [...newGS.log, { msg: logMsg, type: 'narration' as const, turn: gs.turn }]
    }

    // ── SOUND EVENTS ──────────────────────────────────────────────────
    if (res.dice_rolls?.length) {
      for (const d of res.dice_rolls) {
        setTimeout(() => soundEvents.emit({ type: 'dice_roll', success: !!d.success }), Math.random() * 200)
      }
    }
    // Track PCs that already had HP processed in damage_dealt loop
    // to prevent double deduction when state_updates also has hp_delta for the same PC
    const hpProcessedPcs = new Set<string>()

    if (res.damage_dealt?.length) {
      for (const d of res.damage_dealt) {
        const isCritical = !!(d.type && d.type.includes('critical'))
        setTimeout(() => soundEvents.emit({ type: 'combat_hit', critical: isCritical }), 300)
        // Screen effect for PC taking damage
        if (d.amount > 0 && d.to) {
          const targetPc = newGS.pcs.find(p => p.id === d.to || p.name === d.to)
          if (targetPc) {
            triggerScreenEffect('screen-effect-red')
            triggerCombatFlash(isCritical ? 'crit' : 'damage')
            // P4.1 FIX: Actually deduct HP and check for death
            const targetIdx = newGS.pcs.findIndex(p => p.id === targetPc.id)
            if (targetIdx >= 0) {
              const updatedPc = { ...newGS.pcs[targetIdx] }
              updatedPc.hp = Math.max(0, updatedPc.hp - d.amount)
              // Mark this PC as HP-processed so state_updates won't double-deduct
              hpProcessedPcs.add(updatedPc.id)
              if (updatedPc.hp <= 0) {
                // v2.19.0: Check Shard Shield FIRST, then Death Ward
                let shieldResult = tryConsumeShardShield(
                  { ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] },
                  updatedPc.id, gs.turn
                )
                if (shieldResult.shielded) {
                  newGS = shieldResult.gs
                } else {
                  const wardResult = tryConsumeDeathWard(
                    { ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] },
                    updatedPc.id, gs.turn
                  )
                  if (wardResult.warded) {
                    newGS = wardResult.gs
                  } else {
                    updatedPc.dead = true; updatedPc.hp = 0
                    soundEvents.emit({ type: 'death' }); triggerScreenEffect('screen-effect-shake')
                    newGS = transferProphecyOnDeath(
                      { ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] },
                      updatedPc.id, gs.turn
                    )
                  }
                }
              }
              newGS.pcs = [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)]
            }
          }
        }
      }
    }

    // v2.19.0: Shard Insight charge processing
    // When the player uses shard_insight_used (via the "Ask the Tear" button),
    // the DM response handles the narrative. We just mark the charge as spent.
    if (res.shard_insight_used && !newGS.shardInsightUsed) {
      newGS.shardInsightUsed = true
      newGS.shardCharges = Math.max(0, newGS.shardCharges - 1)
      soundEvents.emit({ type: 'shard_pulse' })
      triggerScreenEffect('screen-effect-gold')
    }
    // Clear pending shard question after processing
    newGS.pendingShardQuestion = null

    // New NPCs
    // v2.33.0: HARD GUARD — Validate entities against DDG codex whitelist.
    // Only entities from NPC_NAMES (characterData, krynnCharacters) are valid.
    // No invented monsters, no placeholder entities, no "Shadow Wisp" nonsense.
    const CODEX_ENTITY_IDS = new Set<string>(
      Object.values(NPC_NAMES).flat().map(id => id.toLowerCase().replace(/[^a-z0-9_]/g, ''))
    )
    // Also allow the antagonist and PCs in the current party
    const validEntityIds = new Set(CODEX_ENTITY_IDS)
    if (newGS.antagonistId) validEntityIds.add(newGS.antagonistId.toLowerCase().replace(/[^a-z0-9_]/g, ''))
    newGS.pcs.forEach(p => validEntityIds.add(p.id.toLowerCase().replace(/[^a-z0-9_]/g, '')))

    // EARLY ACT I GUARD: Before turn 8, strip ENEMY/BOSS encounters entirely.
    // The DM ignores the pacing guide → we enforce it at runtime.
    const isEarlyActI = newGS.act === ACTS.ONE && newGS.turn < 8

    if (res.new_active_npcs?.length) {
      for (const id of res.new_active_npcs) {
        const normalizedId = id.toLowerCase().replace(/[^a-z0-9_]/g, '')

        // Guard 1: Entity must exist in the codex (or be the antagonist)
        if (!validEntityIds.has(normalizedId)) {
          console.warn(`🛡️ CODEX GUARD: Rejected non-codex entity "${id}" — not found in DDG roster`)
          continue
        }

        if (!newGS.activeNPCs.find(n => n.id === id)) {
          const npc = await lookupEntity(id)
          if (!npc) continue  // lookupEntity returns null for invalid IDs

          // Guard 2: Early Act I — block enemies entirely
          if (isEarlyActI) {
            const cat = (npc.category || getNPCCategory(id) || '').toLowerCase()
            if (cat === 'monsters' || cat === 'monster') {
              console.warn(`🛡️ EARLY ACT I GUARD: Blocked enemy "${npc.name}" [${id}] before turn 8`)
              continue
            }
          }

          // Create new object to avoid mutating the lookupEntity cache
          const resolvedNpc = {
              ...npc,
              category: npc.category || getNPCCategory(id),
              hp: npc.hp || 150,
              maxHp: npc.maxHp || npc.hp || 150
            }
            newGS.activeNPCs = [...newGS.activeNPCs, resolvedNpc]
            newGS.npcHistory = [...newGS.npcHistory, resolvedNpc]
            if (!newGS.encounteredIds.includes(id)) newGS.encounteredIds = [...newGS.encounteredIds, id]
          }
        }
      }

    // State updates
    if (res.state_updates) {
      for (const u of res.state_updates) {
        if (u.pc_id === 'ANTAGONIST') {
          newGS.antagonistHp = Math.max(0, Math.min(newGS.antagonistMaxHp, newGS.antagonistHp + Number(u.hp_delta || 0)))
          continue
        }

        const pcIdx = newGS.pcs.findIndex(p => p.id === u.pc_id)
        if (pcIdx >= 0) {
          // Skip HP delta for PCs already processed in damage_dealt loop
          if (u.hp_delta && hpProcessedPcs.has(u.pc_id)) {
            const pc = { ...newGS.pcs[pcIdx] }
            if (u.new_condition && !pc.conditions.includes(String(u.new_condition))) {
              pc.conditions = [...pc.conditions, String(u.new_condition)]
            }
            if (u.remove_condition) {
              pc.conditions = pc.conditions.filter(c => c !== u.remove_condition)
            }
            newGS.pcs = [...newGS.pcs.slice(0, pcIdx), pc, ...newGS.pcs.slice(pcIdx + 1)]
            continue
          }
          const pc = { ...newGS.pcs[pcIdx] }
          if (u.hp_delta) pc.hp = Math.max(0, Math.min(Number(pc.maxHp) || pc.maxHp, (Number(pc.hp) || 0) + Number(u.hp_delta)))
          // Safety: ensure hp is always a number, never an object
          pc.hp = Number(pc.hp) || 0
          pc.maxHp = Number(pc.maxHp) || 1
          if (u.new_condition && !pc.conditions.includes(String(u.new_condition))) {
            pc.conditions = [...pc.conditions, String(u.new_condition)]
          }
          if (u.remove_condition) {
            pc.conditions = pc.conditions.filter(c => c !== u.remove_condition)
          }
          if (u.dead || pc.hp <= 0) {
            // Check Shard Shield FIRST, then Death Ward
            const shieldResult = tryConsumeShardShield(newGS, pc.id, gs.turn)
            if (shieldResult.shielded) {
              newGS = shieldResult.gs
              // Skip death — the shield absorbed it
            } else {
              // Check Death Ward before marking dead
              const wardResult = tryConsumeDeathWard(newGS, pc.id, gs.turn)
              if (wardResult.warded) {
                newGS = wardResult.gs
                // Skip death — the ward absorbed it
              } else {
                pc.dead = true
                pc.hp = 0
                soundEvents.emit({ type: 'death' })
                triggerScreenEffect('screen-effect-shake')

                // ═══ PROPHECY TRANSFER ON DEATH — Story-Driven Chain ═══
                newGS = transferProphecyOnDeath(newGS, pc.id, gs.turn)
              }
            }
          }
          newGS.pcs = [...newGS.pcs.slice(0, pcIdx), pc, ...newGS.pcs.slice(pcIdx + 1)]
        } else {
          const npcIdx = newGS.activeNPCs.findIndex(n => n.id === u.pc_id)
          if (npcIdx >= 0) {
            const npc = { ...newGS.activeNPCs[npcIdx] }
            if (u.hp_delta) npc.hp = Math.max(0, Math.min(npc.maxHp || 999, npc.hp + Number(u.hp_delta)))
            if (u.dead || npc.hp <= 0) {
              npc.dead = true
              npc.hp = 0
              newGS.activeNPCs = newGS.activeNPCs.filter((_, i) => i !== npcIdx)
            } else {
              newGS.activeNPCs = [...newGS.activeNPCs.slice(0, npcIdx), npc, ...newGS.activeNPCs.slice(npcIdx + 1)]
            }
          }
        }
      }
    }

    // ── CLEANUP: Remove enemies with 0 HP that weren't caught by state_updates ──
    // The DM may narrate an enemy's defeat without including it in state_updates.
    // Also removes enemies from Act I turns 1-7 (no combat in Act I opening).
    const currentEnemies = newGS.activeNPCs.filter(n => !n.dead && (
      n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS'
    ))
    // Auto-purge enemies that are at 0 HP but not marked dead
    const zeroHpEnemies = newGS.activeNPCs.filter(n => (
      !n.dead && (n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS') && n.hp <= 0
    ))
    if (zeroHpEnemies.length > 0) {
      const deadIds = new Set(zeroHpEnemies.map(n => n.id))
      newGS.activeNPCs = newGS.activeNPCs.filter(n => !deadIds.has(n.id))
    }

    // Injuries
    if (res.injury_events) {
      for (const ev of res.injury_events) {
        soundEvents.emit({ type: 'injury' })
        // Validate pc_id exists in party before applying injury
        if (!ev.pc_id || !newGS.pcs.find(p => p.id === ev.pc_id)) continue
        const injTemplate = ev.injury_id ? INJURY_TABLE.find(i => i.id === ev.injury_id) : INJURY_TABLE[Math.floor(Math.random() * INJURY_TABLE.length)]
        if (!injTemplate) continue
        // Parse duration from cure field ("Rest N turns") or default to severity-based value
        const restMatch = injTemplate.cure?.match(/Rest\s+(\d+)\s+turn/i)
        const dotMatch = injTemplate.effect.match(/for\s+(\d+)\s+turn/i)
        const turns = restMatch ? parseInt(restMatch[1])
          : dotMatch ? parseInt(dotMatch[1])
          : injTemplate.modifier?.dot ? 5  // DOT injuries last 5 turns
          : 4                               // default: 4 turns
        const inj: Injury = { ...injTemplate, turnsLeft: turns }
        newGS.injuries = {
          ...newGS.injuries,
          [ev.pc_id]: [...(newGS.injuries[ev.pc_id] || []), inj]
        }
      }
    }

    // ── ENEMY RETALIATION — If enemies exist but didn't hit PCs, force an attack ──
    const enemyHitPC = (res.damage_dealt || []).some((d: DamageDealt) => {
      const targetPc = newGS.pcs.find(p => p.id === d.to || p.name === d.to)
      return !!targetPc
    })
    if (!enemyHitPC && newGS.turn > 1) {
      const enemies = newGS.activeNPCs.filter(n => !n.dead && (
        n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS'
      ))
      if (enemies.length > 0 && Math.random() < 0.55) {
        const attacker = enemies[Math.floor(Math.random() * enemies.length)]
        const targets = newGS.pcs.filter(p => !p.dead)
        const target = targets[Math.floor(Math.random() * targets.length)]
        if (target) {
          const atkRoll = Math.floor(Math.random() * 20) + 1
          const targetAC = target.AC || 10
          const hit = atkRoll >= targetAC || atkRoll === 20
          const isCrit = atkRoll === 20
          const baseDmg = Math.floor(Math.random() * 8) + 2
          const dmg = hit ? baseDmg + (isCrit ? Math.floor(Math.random() * 8) + 2 : 0) : 0
          const targetIdx = newGS.pcs.findIndex(p => p.id === target.id)

          if (targetIdx >= 0 && dmg > 0) {
            const updatedPc = { ...newGS.pcs[targetIdx] }
            updatedPc.hp = Math.max(0, updatedPc.hp - dmg)
            if (updatedPc.hp <= 0) {
              // Check Shard Shield FIRST, then Death Ward
              const shieldResult = tryConsumeShardShield({ ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] }, updatedPc.id, newGS.turn)
              if (shieldResult.shielded) {
                newGS = shieldResult.gs
                // Skip death — the shield absorbed it
              } else {
                // Check Death Ward before marking dead
                const wardResult = tryConsumeDeathWard({ ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] }, updatedPc.id, newGS.turn)
                if (wardResult.warded) {
                  newGS = wardResult.gs
                  // Skip death — the ward absorbed it. Update fellText.
                  // (The log message is already inside tryConsumeDeathWard)
                } else {
                  updatedPc.dead = true; updatedPc.hp = 0; soundEvents.emit({ type: 'death' }); triggerScreenEffect('screen-effect-shake')
                  // Prophecy transfer — same chain as state_updates death path
                  newGS = transferProphecyOnDeath({ ...newGS, pcs: [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)] }, updatedPc.id, newGS.turn)
                }
              }
            }
            newGS.pcs = [...newGS.pcs.slice(0, targetIdx), updatedPc, ...newGS.pcs.slice(targetIdx + 1)]
            soundEvents.emit({ type: 'combat_hit', critical: isCrit })
            triggerScreenEffect('screen-effect-red')
            triggerCombatFlash(isCrit ? 'crit' : 'damage')
            const fellText = updatedPc.dead ? ` <span style="color:#ff3030">☠️ ${target.name} falls!</span>` : ` (${updatedPc.hp}/${updatedPc.maxHp} HP)`
            newGS.log = [...newGS.log, {
              msg: `__ENEMY_ATTACK__:${JSON.stringify({
                attacker: attacker.name, target: target.name, roll: atkRoll, damage: dmg, critical: isCrit,
                html: isCrit
                  ? `<div style="color:#cc3030;border-left:3px solid #cc3030;padding:0.5rem 1rem;margin:0.5rem 0;background:rgba(204,48,48,0.08);border-radius:0 4px 4px 0"><strong>⚔️ ${attacker.name}</strong> strikes <strong>${target.name}</strong> — <span style="color:#ff6060;font-weight:bold">CRITICAL HIT</span>! (${atkRoll}) → <strong style="color:#ff8080">${dmg} damage</strong>${fellText}</div>`
                  : `<div style="color:#cc8060;border-left:3px solid #a05030;padding:0.5rem 1rem;margin:0.5rem 0;background:rgba(160,80,48,0.08);border-radius:0 4px 4px 0"><strong>⚔️ ${attacker.name}</strong> attacks <strong>${target.name}</strong> (${atkRoll}) → <strong style="color:#cc8060">${dmg} damage</strong>${fellText}</div>`
              })}`,
              type: 'enemy_attack', turn: newGS.turn
            }]
          } else if (!hit && targetIdx >= 0) {
            newGS.log = [...newGS.log, {
              msg: `__ENEMY_MISS__:${JSON.stringify({
                attacker: attacker.name, target: target.name, roll: atkRoll,
                html: `<div style="color:#6a6a6a;border-left:3px solid #4a4a4a;padding:0.3rem 1rem;margin:0.5rem 0;background:rgba(100,100,100,0.05);border-radius:0 4px 4px 0;font-style:italic"><strong>${attacker.name}</strong> swings at <strong>${target.name}</strong> but misses (${atkRoll})</div>`
              })}`,
              type: 'enemy_miss', turn: newGS.turn
            }]
          }
        }
      }
    }

    // PC agreements
    if (res.pc_agreement) {
      const newAgreements = { ...newGS.pcAgreements }
      for (const [pcId, val] of Object.entries(res.pc_agreement)) {
        newAgreements[pcId] = val === 'agreed' ? true : val === 'refused' ? false : null
      }
      newGS.pcAgreements = newAgreements
    }

    // Next PC
    if (res.next_pc_id && newGS.pcQueue.length > 0) {
      const newPC = newGS.pcQueue.find(p => p.id === res.next_pc_id) || newGS.pcQueue[0]
      if (newPC && !newGS.pcs.find(p => p.id === newPC.id)) {
        soundEvents.emit({ type: 'level_up' })
        newGS.pcs = [...newGS.pcs, { ...newPC, hp: newPC.maxHp, conditions: [], dead: false }]
        newGS.pcQueue = newGS.pcQueue.filter(p => p.id !== newPC.id)
        newGS.pcAgreements = { ...newGS.pcAgreements, [newPC.id]: null }
        newGS.nextPCTurn = newGS.turn + Math.floor(Math.random() * 11) + 5
      }
    }

    // Boss phase check (guard division by zero)
    const oldPhase = newGS.antagonistPhase
    const p = newGS.antagonistMaxHp > 0 ? newGS.antagonistHp / newGS.antagonistMaxHp : 0
    if (p <= 0.30 && newGS.antagonistPhase < 3) newGS.antagonistPhase = 3
    else if (p <= 0.65 && newGS.antagonistPhase < 2) newGS.antagonistPhase = 2

    // Log phase transitions for dramatic narration in renderResult
    if (newGS.antagonistPhase > oldPhase && newGS.act === ACTS.THREE) {
      soundEvents.emit({ type: 'boss_phase', phase: newGS.antagonistPhase })
      triggerScreenEffect('screen-effect-dark')
      const phaseAnt = getAntagonist(newGS.antagonistId)
      const phaseDesc = newGS.antagonistPhase === 2
        ? phaseAnt?.phase2 || 'The adversary reveals deeper power, fury breaking through composure.'
        : phaseAnt?.phase3 || 'All restraint shatters. The full, terrible might is unleashed.'
      newGS.log = [...newGS.log, {
        msg: `__BOSS_PHASE__:${JSON.stringify({ phase: newGS.antagonistPhase, html: phaseDesc })}`,
        type: 'boss_phase_auto',
        turn: newGS.turn
      }]
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANTAGONIST BANISHMENT - If antagonist "dies" before Act III, banish them
    // ═══════════════════════════════════════════════════════════════════════════
    if (newGS.antagonistHp <= 0 && newGS.act !== ACTS.THREE && !newGS.antagonistBanished) {
      const banishAnt = getAntagonist(newGS.antagonistId)
      const rival = getAntagonistRival(newGS.antagonistId || '')

      // Restore antagonist HP to 40% (they return in Act III, powered by rage)
      newGS.antagonistHp = Math.ceil(newGS.antagonistMaxHp * 0.4)
      newGS.antagonistBanished = true
      newGS.antagonistBanishTurn = newGS.turn
      newGS.antagonistRival = rival || null

      // Log the banishment event
      newGS.log = [...newGS.log, {
        msg: `${banishAnt?.name || 'The Antagonist'} is BANISHED to another plane! The shard whispers a forbidden name: ${rival?.name || 'unknown'}.`,
        type: 'banishment',
        turn: newGS.turn
      }]

      // Inject Gaiman-style banishment narration (stored for renderResult)
      if (banishAnt && rival) {
        const banishNarration = generateBanishmentNarration(
          banishAnt.name,
          banishAnt.title,
          banishAnt.pantheon,
          banishAnt.domain || 'darkness',
          rival
        )
        // Store on a transient flag so renderResult can pick it up
        newGS.log = [...newGS.log, {
          msg: `__BANISHMENT_NARRATION__:${JSON.stringify({ html: banishNarration, rivalName: rival.name })}`,
          type: 'banishment_narration',
          turn: newGS.turn
        }]
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ACT PROGRESSION - RNG Turn Limits with Minimum Turn Requirements
    // ═══════════════════════════════════════════════════════════════════════════
    const MIN_ACT1_TURNS = 8   // Minimum 8 turns of exploration before Act II
    const MIN_ACT2_TURNS = 15  // Minimum 15 turns before Act III boss fight
    
    // Guard: snapshot original act to prevent multi-act skip in a single call
    const originalAct = newGS.act

    // ACT I -> ACT II: RNG turn limit only (pcAgreements is legacy; companions start agreed)
    if (newGS.act === ACTS.ONE) {
      const turnLimitReached = newGS.turn >= newGS.act1TurnLimit
      const minTurnsMet = newGS.turn >= MIN_ACT1_TURNS
      if (turnLimitReached && minTurnsMet) {
        newGS.act = ACTS.TWO
        soundEvents.emit({ type: 'act_transition', act: 'act2' })
        newGS.act2StartTurn = newGS.turn
        // Log the act transition + inject visual banner for renderResult
        newGS.log = [...newGS.log, {
          msg: `Act I ends after ${newGS.turn} turns. The shadow grows impatient. Act II begins.`,
          type: 'discovery',
          turn: newGS.turn
        }, {
          msg: `__ACT_TRANSITION__:${JSON.stringify({ from: 'act1', to: 'act2', html: `<div style="text-align:center;padding:1.4rem;margin:1rem 0;border:2px solid #d4af37;background:linear-gradient(135deg,rgba(60,40,0,.35),rgba(20,10,0,.5));border-radius:5px;box-shadow:0 0 30px rgba(212,175,55,.25)"><div style="font-family:'Cinzel Decorative',serif;font-size:1.2rem;color:#d4af37;letter-spacing:.2em">\u2694 ACT II BEGINS \u2694</div><div style="font-size:.9rem;color:#c0a060;margin-top:.7rem;line-height:1.75;font-style:italic">The investigation deepens. Gods walk among mortals. The shard's whispers grow urgent \u2014 the shadow that watches from beyond the veil stirs with impatience. Every clue uncovered draws the party closer to a truth that was ancient when the world was young.</div><div style="font-size:.75rem;color:#808060;margin-top:.6rem;letter-spacing:.1em">Turn ${newGS.turn} \u2014 The calm before the storm</div></div>` })}`,
          type: 'act_transition',
          turn: newGS.turn
        }]
      }
    } else if (newGS.act === ACTS.TWO && newGS.act2StartTurn > 0) {
      // ACT II -> ACT III: After RNG turn duration with minimum turns for story development
      // Guard: act2StartTurn must be positive (set when Act I → II fires; default -1 prevents instant Act III)
      // Extra guard: only fire if we didn't JUST transition from Act I this tick
      if (originalAct === ACTS.ONE) {
        // Skip — we just transitioned from Act I, Act II just started
      } else {
        const act2Duration = newGS.turn - newGS.act2StartTurn
        const act2Complete = act2Duration >= newGS.act2TurnLimit
        const storyReady = newGS.antagonistCluesRevealed.length >= 3 // At least 3 clues found
        const minAct2Met = act2Duration >= MIN_ACT2_TURNS
        
        if ((act2Complete || storyReady) && minAct2Met) {
          newGS.act = ACTS.THREE
          soundEvents.emit({ type: 'act_transition', act: 'act3' })
          
          // If antagonist was banished, they return with a vengeance in Act III
          if (newGS.antagonistBanished) {
            // Restore antagonist to full HP — they've been nursing their wounds in exile
            newGS.antagonistHp = newGS.antagonistMaxHp
            newGS.log = [...newGS.log, {
              msg: `The banished antagonist returns from exile at full power! The shard trembles. ${newGS.antagonistRival?.name || 'An ancient force'} can be summoned!`,
              type: 'banishment',
              turn: newGS.turn
            }]
          }
          
          const antName = getAntagonist(newGS.antagonistId)?.name || 'The Ancient One'
          // Log the act transition + inject visual banner for renderResult
          newGS.log = [...newGS.log, {
            msg: `Act II ends after ${act2Duration} turns. The final confrontation awaits.`,
            type: 'discovery',
            turn: newGS.turn
          }, {
            msg: `__ACT_TRANSITION__:${JSON.stringify({ from: 'act2', to: 'act3', html: `<div style="text-align:center;padding:1.4rem;margin:1rem 0;border:2px solid #cc2020;background:linear-gradient(135deg,rgba(80,0,0,.4),rgba(20,0,0,.6));border-radius:5px;box-shadow:0 0 30px rgba(200,20,20,.3)"><div style="font-family:'Cinzel Decorative',serif;font-size:1.2rem;color:#ff3030;letter-spacing:.2em">\u2620 FINAL ACT \u2014 THE CONFRONTATION \u2620</div><div style="font-size:.9rem;color:#e06060;margin-top:.7rem;line-height:1.75;font-style:italic">The shadow reveals itself at last. ${antName} \u2014 ancient, patient, terrible \u2014 emerges from the veil between worlds. The shard screams with recognition. Every choice, every sacrifice, every clue has led to this moment. There is no turning back.</div><div style="font-size:.75rem;color:#906060;margin-top:.6rem;letter-spacing:.1em">Turn ${newGS.turn} \u2014 Destiny awaits</div></div>` })}`,
            type: 'act_transition',
            turn: newGS.turn
          }]
        }
      }
    }

    // Item drops
    if (res.item_drops?.length) {
      newGS.inventory = [...newGS.inventory, ...res.item_drops.map(item => ({
        ...item,
        id: `${item.id}_${generateId()}`,
        charges: item.charges || 1,
        maxCharges: item.maxCharges || item.charges || 1
      }))]
    }

    // Quest updates
    if (res.quest_updates) {
      const updatedQuests = [...newGS.quests]
      for (const qu of res.quest_updates) {
        const idx = updatedQuests.findIndex(q => q.id === qu.id)
        if (idx >= 0) {
          updatedQuests[idx] = { ...updatedQuests[idx], ...qu }
        } else {
          updatedQuests.push(qu)
        }
      }
      newGS.quests = updatedQuests
    }

    // Clue revealed — populate antagonistCluesRevealed for story-driven Act II → III transition
    if (res.clue_revealed && typeof res.clue_revealed === 'string' && res.clue_revealed.length > 0) {
      const clueText = res.clue_revealed.trim()
      if (!newGS.antagonistCluesRevealed.includes(clueText)) {
        newGS.antagonistCluesRevealed = [...newGS.antagonistCluesRevealed, clueText]
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUCCESS RATE RECALCULATION - Update after each turn
    // ═══════════════════════════════════════════════════════════════════════════
    const livingPCs = newGS.pcs.filter(p => !p.dead)
    const mainProphecy = newGS.prophecies[0]
    const completedQuests = newGS.quests.filter(q => q.status === 'completed').length
    const alliedNPCs = newGS.npcHistory.filter(n => 
      n.align.toLowerCase().includes('good')
    ).length

    // Calculate injury penalty: sum all active injury modifiers
    let totalInjuryPenalty = 0
    for (const pc of livingPCs) {
      const pcInjuries = newGS.injuries[pc.id] || []
      for (const injury of pcInjuries) {
        // Injury modifiers typically include negative values like { attack: -2, ac: -1 }
        const vals = Object.values(injury.modifier).filter(v => typeof v === 'number')
        totalInjuryPenalty += vals.reduce((sum, v) => sum + v, 0)
      }
    }
    
    const successUpdate = calculateSuccessRate({
      partySize: newGS.pcs.length,
      livingPCs: livingPCs.length,
      prophecyState: mainProphecy?.state || 'dormant',
      alliedGods: alliedNPCs,
      pcRenown: livingPCs.reduce((sum, pc) => {
        const level = pc.fighterLevel || pc.clericLevel || pc.magicUserLevel || pc.thiefLevel || 0
        return sum + Math.floor(level / 3)
      }, 0),
      pcPower: livingPCs.reduce((sum, pc) => sum + (pc.hp / 100), 0),
      alignmentHarmony: calculateAlignmentHarmony(livingPCs.map(p => p.align)),
      storyAchievements: completedQuests + Math.floor(newGS.antagonistCluesRevealed.length / 2),
      antagonistType: newGS.antagonistType,
      shardCharges: newGS.shardCharges,
      shardSummoned: 0,  // v2.19.0: Summoning removed, no bonus from summoned gods
      companionAffinity: newGS.companionAffinity,
      injuryPenalty: totalInjuryPenalty
    })
    
    newGS.currentSuccessRate = successUpdate.total
    newGS.partyBonus = successUpdate.breakdown.party
    newGS.prophecyBonus = successUpdate.breakdown.prophecy
    newGS.allyBonus = successUpdate.breakdown.allies
    newGS.renownBonus = successUpdate.breakdown.renown
    newGS.powerBonus = successUpdate.breakdown.power
    newGS.alignmentBonus = successUpdate.breakdown.alignment
    newGS.mythicalImpactBonus = successUpdate.breakdown.mythical
    newGS.shardChargeBonus = successUpdate.breakdown.shardCharge
    newGS.shardSummonedBonus = successUpdate.breakdown.shardSummoned
    newGS.companionAffinityBonus = successUpdate.breakdown.companionAffinity
    newGS.injuryPenaltyBonus = successUpdate.breakdown.injury

    // ═══════════════════════════════════════════════════════════════════════════
    // PbtA OUTCOME TIER — Process outcome from DM response
    // ═══════════════════════════════════════════════════════════════════════════
    // v2.19.0: Removed blind HP penalties (partial_success -1, miss -5 to random PC).
    // The AI handles all damage through damage_dealt and state_updates with narrative context.
    // Blind mechanical penalties disconnected damage from story — now all consequences are narrated.
    if (res.outcome_tier) {
      newGS.lastOutcomeTier = res.outcome_tier
      newGS.outcomeHistory = [...newGS.outcomeHistory, {
        turn: newGS.turn,
        tier: res.outcome_tier,
        description: res.dm_narration?.slice(0, 100) || ''
      }]
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MASS EFFECT PARAGON/RENEGADE — Process morality from DM response
    // ═══════════════════════════════════════════════════════════════════════════
    let paragonDelta = (res.paragon_delta ?? 0) as number
    let renegadeDelta = (res.renegade_delta ?? 0) as number

    if (paragonDelta > 0 || renegadeDelta > 0) {
      const newParagon = newGS.paragonPoints + paragonDelta
      const newRenegade = newGS.renegadePoints + renegadeDelta
      newGS.paragonPoints = newParagon
      newGS.renegadePoints = newRenegade
      newGS.moralityQuotient = Math.max(-100, Math.min(100, newParagon - newRenegade))

      // Log milestone every 10 points
      const prevMilestone = Math.floor((newGS.paragonPoints - paragonDelta) / 10)
      const newMilestone = Math.floor(newGS.paragonPoints / 10)
      if (newMilestone > prevMilestone) {
        newGS.interruptHistory = [...newGS.interruptHistory, {
          turn: newGS.turn,
          type: 'paragon' as const,
          description: `Paragon milestone reached: ${newGS.paragonPoints} points`
        }]
      }
      const prevRenMilestone = Math.floor((newGS.renegadePoints - renegadeDelta) / 10)
      const newRenMilestone = Math.floor(newGS.renegadePoints / 10)
      if (newRenMilestone > prevRenMilestone) {
        newGS.interruptHistory = [...newGS.interruptHistory, {
          turn: newGS.turn,
          type: 'renegade' as const,
          description: `Renegade milestone reached: ${newGS.renegadePoints} points`
        }]
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FATE CORE — Process new aspects from DM response
    // ═══════════════════════════════════════════════════════════════════════════
    if (res.new_aspect && typeof res.new_aspect === 'string' && res.new_aspect.length > 0) {
      const newAspect: Aspect = {
        name: toAscii(res.new_aspect),
        type: 'earned',
        invokes: 0,
        fate_points_spent: 0,
        description: `Earned through actions on Turn ${newGS.turn}`
      }
      newGS = addAspect(newGS, newAspect)
      // Also award a fate point for earning an aspect
      newGS = earnFatePoint(newGS, `Earned aspect: ${newAspect.name}`)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DARK SOULS — Stamina regeneration after turn resolution
    // ═══════════════════════════════════════════════════════════════════════════
    newGS = regenStamina(newGS)

    // Fate Point refresh: if below 3 at start of new turn, refresh to 3
    if (newGS.fatePoints < 3) {
      newGS = earnFatePoint(newGS, 'Scene refresh — fate replenishes')
    }

    // ── TRIM LOG — prevent unbounded memory growth ─────────────────────
    if (newGS.log.length > 200) {
      newGS.log = newGS.log.slice(-150)
    }

    return newGS
  }

  // ── RUN TURN ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  // DUAL-ENGINE DM SYSTEM v2.17.0
  //   LM Studio  → mechanics (dice, rules, state changes)
  //   OpenRouter → creative narration (prose, dialogue, atmosphere)
  //   Dual mode  → both in parallel, merge best of each
  // ═══════════════════════════════════════════════════════════════════

  const callLMStudioDM = async (
    userMsg: string, gs: GameState, isFirst: boolean = false,
    opts?: { noOpenRouterFallback?: boolean }
  ): Promise<DMResponse> => {
    const systemPrompt = buildDMSystem(gs, true, isFirst)
    setStatusMessage('LM Studio processing...')
    try {
      const r = await fetch('/api/lmstudio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt, userMessage: toAscii(userMsg),
          temperature: 0.7, maxOutputTokens: isFirst ? 16000 : 6144,
          lmStudioUrl, model: lmStudioModel,
        }),
      })
      if (!r.ok) {
        const errText = await r.text().catch(() => 'Unknown')
        if (r.status === 502 && !opts?.noOpenRouterFallback) {
          setStatusMessage('LM Studio unavailable - OpenRouter fallback...')
          return callOpenRouterDM(userMsg, gs, isFirst)
        }
        throw new Error('LM Studio ' + r.status + ': ' + errText.slice(0, 200))
      }
      const { data, modelUsed } = await r.json()
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      if (!text) throw new Error('LM Studio returned empty response')
      console.log('[LM Studio] OK ' + (modelUsed || 'local') + ' - ' + text.length + ' chars')
      const jsonMatch = text.match(/\{[\s\S]*?\"dm_narration\"[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const cleaned = jsonMatch[0].replace(/\\\json\s*/ig, '').replace(/\\\\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          if (parsed && typeof parsed === 'object' && parsed.dm_narration) {
            if (parsed.dm_narration.length > 30) setLastDMNarrative(parsed.dm_narration)
            return parsed as DMResponse
          }
        } catch (pe) { console.warn('[LM Studio] JSON parse failed:', pe) }
      }
      const narrative = text.split(/\n*\{/)[0].trim()
      if (narrative.length > 30) {
        return {
          dm_narration: narrative.slice(0, 2000),
          story_summary: gs.storySummary || 'The adventure continues...',
          journey_so_far: gs.journeySoFar || '',
          npc_encounters: [], dice_rolls: [], damage_dealt: [],
          injury_events: [], state_updates: [], item_drops: [], quest_updates: [],
        }
      }
      throw new Error('LM Studio: Could not parse response into game data')
    } catch (e) {
      console.error('[LM Studio] Error:', e)
      if (!opts?.noOpenRouterFallback) {
        setStatusMessage('LM Studio error - OpenRouter fallback...')
        return callOpenRouterDM(userMsg, gs, isFirst)
      }
      return getNarrationPreservationFallback(gs, 'LM Studio: ' + String(e).slice(0, 100))
    }
  }

  // ─── DUAL MODE: both engines in parallel, merge results ───
  const callDualEngineDM = async (userMsg: string, gs: GameState, isFirst: boolean = false): Promise<DMResponse> => {
    setStatusMessage('Dual Engine: LM Studio + OpenRouter...')
    const [lmResult, openrouterResult] = await Promise.allSettled([
      callLMStudioDM(userMsg, gs, isFirst, { noOpenRouterFallback: true }),
      callOpenRouterDM(userMsg, gs, isFirst),
    ])
    const lmOk = lmResult.status === 'fulfilled'
    const openrouterOk = openrouterResult.status === 'fulfilled'
    if (lmOk && openrouterOk) {
      const lm = lmResult.value as DMResponse
      const g = openrouterResult.value as DMResponse
      const merged: DMResponse = {
        ...g,
        dice_rolls: lm.dice_rolls?.length ? lm.dice_rolls : g.dice_rolls,
        damage_dealt: lm.damage_dealt?.length ? lm.damage_dealt : g.damage_dealt,
        state_updates: lm.state_updates?.length ? lm.state_updates : g.state_updates,
        injury_events: lm.injury_events?.length ? lm.injury_events : g.injury_events,
        item_drops: lm.item_drops?.length ? lm.item_drops : g.item_drops,
        quest_updates: lm.quest_updates?.length ? lm.quest_updates : g.quest_updates,
        story_summary: g.story_summary || lm.story_summary,
        journey_so_far: g.journey_so_far || lm.journey_so_far,
        dm_narration: g.dm_narration,
      }
      console.log('[Dual Engine] Merged:', { lm: (lm.dice_rolls?.length || 0) + 'd/' + (lm.state_updates?.length || 0) + 's', g: (g.dm_narration?.length || 0) + ' chars' })
      return merged
    }
    if (openrouterOk) {
      console.warn('[Dual Engine] LM Studio failed, OpenRouter-only')
      setStatusMessage('LM Studio unavailable - OpenRouter handling everything')
      return openrouterResult.value as DMResponse
    }
    if (lmOk) {
      console.warn('[Dual Engine] OpenRouter failed, LM Studio-only')
      setStatusMessage('OpenRouter unavailable - LM Studio handling everything')
      return lmResult.value as DMResponse
    }
    const err = openrouterResult.reason instanceof Error ? openrouterResult.reason.message : String(openrouterResult.reason)
    return getNarrationPreservationFallback(gs, 'Both engines failed: ' + err.slice(0, 80))
  }

  // ─── ROUTER: select engine based on mode ───
  const callDM = async (userMsg: string, gs: GameState, isFirst: boolean = false): Promise<DMResponse> => {
    switch (engineMode) {
      case 'lmstudio': return callLMStudioDM(userMsg, gs, isFirst)
      case 'dual': return callDualEngineDM(userMsg, gs, isFirst)
      default: return callOpenRouterDM(userMsg, gs, isFirst)
    }
  }

  const runTurn = async (isFirst: boolean, currentGS: GameState) => {
    let gs = deepClone(currentGS)
    gs.isProcessing = true
    setGameState(deepClone(gs))

    const living = gs.pcs.filter(p => !p.dead)
    if (!living.length) {
      endCampaign(false, gs)
      return
    }
    if (Number.isFinite(gs.antagonistHp) && gs.antagonistHp <= 0 && gs.act === ACTS.THREE) {
      endCampaign(true, gs)
      return
    }

    const ant = getAntagonist(gs.antagonistId)
    const shard = gs.shardEntry
    const recentLog = gs.log.slice(0, 2).map(l => l.msg).join(' | ') || 'Campaign beginning.'

    const pcIntroStr = gs.act === ACTS.ONE && gs.pcQueue.length > 0
      ? (gs.turn >= gs.nextPCTurn
        ? `\nSTORY TRIGGER: Introduce the next party member now: ${gs.pcQueue[0]?.name} (${gs.pcQueue[0]?.pantheon}). SET "next_pc_id": "${gs.pcQueue[0]?.id}" in JSON.\n`
        : `\nAct I pacing: Focus on the current party. DO NOT introduce new PCs yet (${gs.nextPCTurn - gs.turn} turns until next hero arrives).\n`)
      : ''

    let userMsg = ''

    if (isFirst) {
      // v2.19.0: TURN 0 — SHARD-ONLY INTRO
      // Two paragraphs of pure shard mythology, no PC or companion yet.
      // The shard appears in the world. Ancient. Waiting. Dangerous.
      // ~1500 chars max. Ends with a hook — something is about to happen.
      userMsg = `TURN 0 — THE SHARD AWAKENS (SHARD-ONLY INTRO).

STOP. READ THIS FIRST. THIS IS TURN 0.
You MUST write ONLY about the shard. NO characters. NO PCs. NO companions. NO dialogue. NO prophecy.
If your dm_narration mentions any person, character, hero, or companion by name, YOU HAVE FAILED.

═══════════════════════════════════════════════════════════════════════════
THE SHARD
═══════════════════════════════════════════════════════════════════════════
SHARD: ${shard?.name}
ORIGIN: ${toAscii(shard?.origin || '')}
PANTHEON AFFINITY: ${shard?.pantheon || 'Primordial'}
POWER: ${shard?.power || 'Unknown'}

═══════════════════════════════════════════════════════════════════════════
STRUCTURE (EXACTLY 2 PARAGRAPHS — NEIL GAIMAN STYLE)
═══════════════════════════════════════════════════════════════════════════

PARAGRAPH 1 — THE SHARD REMEMBERS (~600 chars):
Describe ${shard?.name} appearing in the world. Not as an object, but as an EVENT.
The shard has been waiting for this moment across millennia. It remembers all its previous holders.
Use mythic, sensory language. Make the world feel ancient. The shard is a character — patient, hungry, certain.

PARAGRAPH 2 — THE WORLD RESPONDS (~600 chars):
The shard's arrival disrupts the world. Nature reacts. Something ancient notices.
Do NOT name the antagonist. Describe only its effect — a chill, a shadow that moves wrong.
End with a HOOK — a single sentence that creates urgency: a footstep on broken glass, a voice calling from the darkness, a door that should not be open. Something is coming. The shard knows who.

HARD LIMITS:
- dm_narration: MAX 1500 characters. EXACTLY 2 paragraphs. SHARD ONLY.
- NO person, hero, PC, companion, or named character may appear in your prose.
- Failure to follow these rules is a CRITICAL ERROR.

═══════════════════════════════════════════════════════════════════════════
JSON OUTPUT
═══════════════════════════════════════════════════════════════════════════
Set human_pc_id to the first PC's ID.
Generate 3 pc_choices and 3 companion_choices for Turn 1.
Write the prose first (short — 2 paragraphs ONLY). Then append JSON.`
    } else if (gs.turn === 0) {
      // v2.19.0: TURN 1 — FULL INTRO (PC discovers shard, companion bond, prophecy teased)
      const companion = gs.pcs.length > 1 ? gs.pcs[1] : undefined
      const mainPC = gs.pcs[0]

      userMsg = `TURN 1 — THE HERO ARRIVES (FULL INTRO — ALL PHASES).

═══════════════════════════════════════════════════════════════════════════
THE MAIN PC (CHOSEN BY THE SHARD)
═══════════════════════════════════════════════════════════════════════════
NAME: ${mainPC?.name}
PANTHEON: ${mainPC?.pantheon}
ALIGNMENT: ${mainPC?.align}
PERSONALITY: ${toAscii(mainPC?.personality || '')}
ABILITIES: ${mainPC?.abilities?.slice(0, 3).join(', ') || 'Unknown'}
${companion ? `
═══════════════════════════════════════════════════════════════════════════
THE COMPANION (Bound to Main PC by Fate)
═══════════════════════════════════════════════════════════════════════════
NAME: ${companion?.name}
PANTHEON: ${companion?.pantheon}
ALIGNMENT: ${companion?.align}
PERSONALITY: ${toAscii(companion?.personality || '')}
ABILITIES: ${companion?.abilities?.slice(0, 3).join(', ') || 'Unknown'}` : ''}

═══════════════════════════════════════════════════════════════════════════
STRUCTURE (NEIL GAIMAN STYLE — 4-5 RICH PARAGRAPHS)
═══════════════════════════════════════════════════════════════════════════

PART 1 — THE HERO DISCOVERS THE SHARD (1 paragraph):
${mainPC?.name} finds the shard. Show their reaction — curiosity, fear, recognition?
The shard CHOSE them. Show the moment of contact. Give us their internal voice.
They may not understand it yet, but something in them responds to the shard's call.

${companion ? `PART 2 — THE COMPANION'S BOND (1-2 paragraphs):
${companion?.name} is with ${mainPC?.name}. Create a MINI-ORIGIN for their bond:
- WHY are they together? (Shared history, oath, blood, survival, debt, love)
- HOW did they meet? (Battle, exile, quest, disaster, childhood)
- WHAT binds them? (Honor, guilt, necessity, friendship, rivalry)
Write DIALOGUE between them — ${companion?.name} reacts to the shard per their ${companion?.align} alignment.
Show their dynamic. Let personalities clash or harmonize naturally.` : ''}

PART ${companion ? '3' : '2'} — THE PROPHECY TEASES (1 paragraph):
The shard whispers something — a fragment of the prophecy bound to ${mainPC?.name}.
Don't reveal the full prophecy. Just a fragment: an image, a name, a warning.
Something that creates mystery and urgency. The hero feels the weight of destiny.

PART ${companion ? '4' : '3'} — THE WORLD OPENS (1 paragraph):
End at the moment of decision. ${companion ? `${mainPC?.name} holds the shard. ${companion?.name} watches. ` : ''}What happens next depends on what the hero chooses.
Leave the action open. The world is vast and dangerous. A path lies ahead.

═══════════════════════════════════════════════════════════════════════════
JSON OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════
${companion ? `The companion ${companion.name} is already in the active party (pcs[1]). Do NOT set "next_pc_id".` : 'No companion.'}
Generate 3 contextual pc_choices and 3 contextual companion_choices for the next turn.
Write the narrative prose first (3000-3500 chars). Then append the JSON state payload.`
    } else {
      // v2.19.0: TURN 2+ — STANDARD LOOP
      const pacingGuide = gs.act === ACTS.ONE && gs.turn < 8
        ? `\n**EARLY ACT I PACING** (Turn ${gs.turn}, < 8): This is EXPLORATION ONLY. ABSOLUTELY NO COMBAT.
⛔ HARDCORE RULE — VIOLATION = GAME RUINED:
- Do NOT spawn enemies or introduce combat encounters
- Do NOT generate ANY combat-flavored choices: no melee_attack, ranged_attack, defend, companion_guard, companion_attack, companion_defend
- Do NOT describe the PC "readying a weapon" or "standing guard against encroaching shadows"
- Do NOT frame any choice as preparing for combat or reacting to threats
- ALL 3 pc_choices and ALL 3 companion_choices must be PURE EXPLORATION: investigate, examine, speak, explore, perceive, arcana, stealth, survival, conversation
- Companion choices: companion_scout, companion_discussion, companion_conversation, companion_observe, companion_ability ONLY
- You MAY introduce traps, puzzles, and environmental roadblocks (collapsing bridges, flooded passages, enchanted barriers, riddle-locked doors, poison gas, illusionary walls, cursed objects). These require CLEVER THINKING, not fighting.
Focus on:\n- Describing the environment in rich detail (ancient ruins, mystical landscapes, divine realms)\n- Building the bond between ${living[0]?.name || 'the hero'} and their companion through dialogue\n- The shard reacting to the environment (pulsing near power sources, whispering warnings)\n- Dropping subtle clues about the antagonist through omens and environmental details\n- Creating MYSTERY — something the player wants to investigate further\n- Discovery: hidden paths, ancient inscriptions, forgotten lore, divine remnants\n- DO NOT include any "npc_encounters" with type "ENEMY" or "BOSS" this early.\n`
        : gs.act === ACTS.ONE
          ? `\n**LATE ACT I PACING** (Turn ${gs.turn}): Danger is now possible. You may introduce a minor threat (guardian creature, territorial spirit, rival adventurer) but NOT the antagonist. Combat should feel earned and meaningful.\n`
          : ''
      // Detect the last player action from conversation history
      const lastUserAction = conversationHistory.filter(h => h.role === 'user').slice(-1)[0]?.content || ''
      const isRestAction = /rest|sleep|camp|meditat|wait|recover/i.test(lastUserAction)
      const isCombatTurn = (gs.activeNPCs || []).some(n => n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS')

      userMsg = `TURN ${gs.turn}.
PLAYER ACTION THIS TURN: ${lastUserAction || 'Continue the story.'}
${isRestAction ? 'ACTION TYPE: REST/SLEEP — Narrate briefly (2-3 sentences max). The party rests. Brief atmosphere, a dream or reflection, then move on. DO NOT write a long passage.' : isCombatTurn ? 'ACTION TYPE: COMBAT — You may write up to 2 short paragraphs (max 150 words) for dramatic impact.' : 'ACTION TYPE: EXPLORATION — Write exactly ONE paragraph (60-120 words).'}

Recent: ${recentLog}
Act: ${gs.act}
${gs.pendingShardQuestion ? `🔮 SHARD INSIGHT — The player asked: "${gs.pendingShardQuestion}". The shard answers with a hidden truth — a piece of lore, an antagonist clue, a prophecy fragment, or a secret about an NPC. Set shard_insight_used to true. The shard remembers everything but doesn't always tell you what you WANTED to hear. Narrate the shard's whisper/vision in 1-2 sentences of prophecy-like prose.\n` : ''}${pcIntroStr}${gs.act === ACTS.TWO ? 'Introduce 1-2 gods from the DDG roster this turn. Mix pantheons.\n' : ''}${gs.act === ACTS.THREE ? `BOSS FIGHT: ${ant?.name} Phase ${gs.antagonistPhase}. HP ${gs.antagonistHp}/${gs.antagonistMaxHp}.\n` : ''}${pacingGuide}
NARRATIVE STYLE — NEIL GAIMAN:
Write 2-3 paragraphs. BASELINE: 150-300 words. For complex actions, dramatic moments, or pivotal scenes, expand up to 500 words — but only when the narrative demands it. Every word must earn its place. STRUCTURED:
Paragraph 1 — RESULTS: What happened as a result of the player's choices. Vivid, specific. Reference the action they took.
Paragraph 2 — REACTIONS: The PC and companion react. Include 1-2 lines of dialogue that reveal personality and alignment.
Paragraph 3 — HOOK: A new development, tension, or fork in the road. End with something that demands a response.
- DO NOT repeat or rephrase prose from previous turns. Each turn must be ENTIRELY NEW.
- Sensory details: one strong image per paragraph, not a catalog
- If combat occurred, weave it into Paragraph 1-2 naturally
Make the world feel ancient and dangerous. End with a hook.

Continue building the narrative, execute mechanics, and output JSON at the end.`
    }

    try {
      const res = await callDM(userMsg, gs, isFirst)

      // Determine human PC
      let humanPCId = res.human_pc_id || (living[0]?.id || null)
      let humanPC = gs.pcs.find(p =>
        String(p.id).toLowerCase() === String(humanPCId).toLowerCase() ||
        String(p.name).toLowerCase() === String(humanPCId).toLowerCase()
      )
      if (!humanPC && living.length > 0) {
        humanPC = living[0]
        humanPCId = humanPC.id
      }

      // Apply result and render
      gs = await applyMechanics(res, gs)
      await renderResult(res, isFirst, gs)

      // ═════════════════════════════════════════════════════════════════════════
      // TTS AUTO-SPEAK is now DEFERRED until after setGameState commits.
      // See below — after the final setGameState call.
      // ═════════════════════════════════════════════════════════════════════════

      gs.humanPCId = humanPCId
      gs.isProcessing = false

      if (humanPC && !humanPC.dead) {
        setStatusMessage(`Generating options for ${humanPC.name}...`)

        const aiPCChoices = res.pc_choices
        // HARD GUARD: Turn 0 NEVER has companion choices — strip even if AI returns them
        const aiCompChoices = gs.turn === 0 ? [] : res.companion_choices

        // HARD GUARD: Early Act I (turns < 8) — strip ALL combat-oriented choices
        // Both PC and companion choices. The DM should only offer
        // exploration/trap/social choices before turn 8.
        const isEarlyAct1 = gs.act === ACTS.ONE && gs.turn < 8
        const COMBAT_ABILITIES = ['melee_attack', 'ranged_attack', 'defend', 'companion_guard', 'companion_attack', 'companion_defend', 'companion_assist']
        let filteredPCChoices = aiPCChoices
        let filteredCompChoices = aiCompChoices
        if (isEarlyAct1) {
          if (aiPCChoices) {
            filteredPCChoices = aiPCChoices.filter(c => !COMBAT_ABILITIES.includes(c.ability || ''))
            const stripped = aiPCChoices.length - filteredPCChoices.length
            if (stripped > 0) console.warn(`🛡️ EARLY ACT I GUARD: Stripped ${stripped} combat PC choice(s) before turn 8`)
          }
          if (aiCompChoices) {
            filteredCompChoices = aiCompChoices.filter(c => !COMBAT_ABILITIES.includes(c.ability || ''))
            const stripped = aiCompChoices.length - filteredCompChoices.length
            if (stripped > 0) console.warn(`🛡️ EARLY ACT I GUARD: Stripped ${stripped} combat companion choice(s) before turn 8`)
          }
          // Pad PC choices to 3 with exploration alternatives
          const pcPads: AIChoice[] = [
            { narrative: '🔍 Examine your surroundings for hidden details', ability: 'investigation', align_note: 'perception check' },
            { narrative: '🚶 Move deeper into the area, staying alert', ability: 'exploration', align_note: 'exploration' },
            { narrative: '👁️ Observe the shard — is it reacting to something nearby?', ability: 'perception', align_note: 'arcana check' },
          ]
          const pcNeeded = 3 - filteredPCChoices.length
          for (let i = 0; i < pcNeeded; i++) {
            filteredPCChoices = [...filteredPCChoices, pcPads[filteredPCChoices.length] || pcPads[0]]
          }
          // Pad companion choices to 3 with exploration alternatives
          const compPads: AIChoice[] = [
            { narrative: '🔍 Scout — Check the area ahead for hidden paths', ability: 'companion_scout', align_note: 'perception check' },
            { narrative: '🗣️ Discuss — Share thoughts on what you have found', ability: 'companion_discussion', align_note: 'character dialogue' },
            { narrative: '👁️ Observe — Study the surroundings in careful silence', ability: 'companion_observe', align_note: 'investigation check' },
          ]
          const compNeeded = 3 - filteredCompChoices.length
          for (let i = 0; i < compNeeded; i++) {
            filteredCompChoices = [...filteredCompChoices, compPads[filteredCompChoices.length] || compPads[0]]
          }
        }

        console.log(`🎯 AI choices — pc_choices: ${filteredPCChoices?.length || 0}, companion_choices: ${filteredCompChoices?.length || 0}${gs.turn === 0 && res.companion_choices?.length ? ' (STRIPPED — turn 0)' : ''}${isEarlyAct1 ? ' (EARLY ACT I — combat filtered)' : ''}`)
        if (aiPCChoices?.length) console.log('  pc_choices:', JSON.stringify(aiPCChoices).slice(0, 300))
        if (aiCompChoices?.length) console.log('  companion_choices:', JSON.stringify(aiCompChoices).slice(0, 300))

        const { pcOptions, compOptions, extraOptions } = buildDefaultOptions(humanPC, {
          pc_choices: filteredPCChoices,
          companion_choices: filteredCompChoices
        })
        gs.humanOptions = [...pcOptions, ...extraOptions]
        gs.companionOptions = compOptions
        gs.waitingForHuman = true
        gs.pendingHumanChoice = null
        gs.pendingCompanionChoice = null

        setGameState(deepClone(gs))
        setStatusMessage(`YOUR TURN — ${humanPC.name}${compOptions.length > 0 ? ` + ${gs.companionId ? gs.pcs.find(p => p.id === gs.companionId)?.name?.split(' ')[0] : 'Companion'}` : ''}`)
      setLastTurnReadyTime(Date.now())
      } else {
        setGameState(deepClone(gs))
        setStatusMessage(`T${gs.turn} complete — ${living.length} standing`)
      }

      // ═════════════════════════════════════════════════════════════════════════
      // TTS — narration saved for on-demand playback via the Speak button.
      // No autoplay. User clicks the floating Speak button to hear narration.
      // ═════════════════════════════════════════════════════════════════════════
      {
        const ttsText = ttsNarrationRef.current
        const currentTurnNum = gs.turn || 0
        // Mark pending so the Speak button knows narration is ready
        if (ttsText && ttsText.length > 10 && ttsTurnGuardRef.current !== currentTurnNum) {
          ttsTurnGuardRef.current = currentTurnNum
          ttsPendingRef.current = true
          setTtsPending(true)
          // Clear dedup hash so new turn's narration can be spoken when user clicks
          lastSpokenHashRef.current = ''
          console.log(`🔊 TTS narration ready (on-demand): ${ttsText.length} chars, turn=${currentTurnNum}`)
        }
      }
    } catch (e) {
      gs.isProcessing = false
      setGameState(deepClone(gs))
      appendNarrative(`<div class="error-box" style="color:#cc3030;padding:1rem;border:1px solid #cc3030;border-radius:4px">DM Engine Halted — ${String(e)}</div>`)
      setStatusMessage('Error — refresh recommended')
    }
  }

  // ── RENDER RESULT ──────────────────────────────────────────────────────
  const renderResult = async (res: DMResponse, isFirst: boolean, gs: GameState) => {
    const encColors: { [key: string]: string } = {
      ENEMY: '#a06060', BOSS: '#e05050', ALLY: '#4a9060',
      RIVAL: '#d09030', BYSTANDER: '#9a8860', NUISANCE: '#9090c0'
    }

    let html = `<div class="turn-block" style="margin-bottom:2rem;animation:fadeIn 0.45s ease">`

    if (!isFirst) {
      html += `<div style="font-family:'Cinzel Decorative',serif;font-size:.85rem;color:#7a5f20;text-align:center;letter-spacing:.2em;margin-bottom:.8rem;display:flex;align-items:center;gap:.4rem">
        <span style="flex:1;height:1px;background:#2e2008"></span>
        TURN ${gs.turn} [${gs.act === 'act1' ? 'ACT I' : gs.act === 'act2' ? 'ACT II' : 'FINAL BOSS'}]
        <span style="flex:1;height:1px;background:#2e2008"></span>
      </div>`
    }

    // ── PLAYER CHOICE DISPLAY — Show what the player chose this turn ──
    const pChoice = lastPlayerChoiceRef.current
    if (pChoice && !isFirst) {
      const pcLabel = pChoice.isFreeText
        ? `<span style="color:#c0a060">✍️ ${toAscii(pChoice.pcName)} chose (custom):</span> <span style="color:#e8d9b0;font-style:italic">"${toAscii(pChoice.pcAction)}"</span>`
        : `<span style="color:#c0a060">${toAscii(pChoice.pcName)} chose:</span> <span style="color:#e8d9b0">${toAscii(pChoice.pcAction)}</span>`
      let choiceHtml = `<div style="padding:.6rem 1rem;margin-bottom:.6rem;border:1px solid rgba(122,95,32,.3);background:rgba(122,95,32,.06);border-radius:4px;font-size:.9rem;line-height:1.6">
        <div style="display:flex;align-items:baseline;gap:.4rem">${pcLabel}</div>`
      if (pChoice.compName && pChoice.compAction) {
        choiceHtml += `<div style="display:flex;align-items:baseline;gap:.4rem;margin-top:.2rem"><span style="color:#c0a060">${toAscii(pChoice.compName)} chose:</span> <span style="color:#e8d9b0">${toAscii(pChoice.compAction)}</span></div>`
      }
      choiceHtml += `</div>`
      html += choiceHtml
      lastPlayerChoiceRef.current = null // consume — don't show again
    }

    // Check for banishment narration from applyMechanics
    const banishLog = gs.log.find(l => l.type === 'banishment_narration' && l.turn === gs.turn)
    if (banishLog && banishLog.msg.startsWith('__BANISHMENT_NARRATION__:')) {
      try {
        const banishData = JSON.parse(banishLog.msg.replace('__BANISHMENT_NARRATION__:', ''))
        html += banishData.html
      } catch { /* ignore parse errors */ }
    }

    // Check for rival summon narration from confirmChoice
    const summonLog = gs.log.find(l => l.type === 'rival_summon_narration' && l.turn === gs.turn)
    if (summonLog && summonLog.msg.startsWith('__RIVAL_SUMMON__:')) {
      try {
        const summonData = JSON.parse(summonLog.msg.replace('__RIVAL_SUMMON__:', ''))
        html += summonData.html
      } catch { /* ignore parse errors */ }
    }

    // Check for act transition banners from applyMechanics
    const actTransitionLog = gs.log.find(l => l.type === 'act_transition' && l.turn === gs.turn)
    if (actTransitionLog && actTransitionLog.msg.startsWith('__ACT_TRANSITION__:')) {
      try {
        const actData = JSON.parse(actTransitionLog.msg.replace('__ACT_TRANSITION__:', ''))
        html += actData.html
      } catch { /* ignore parse errors */ }
    }

    // Check for auto boss phase transition from applyMechanics
    const phaseLog = gs.log.find(l => l.type === 'boss_phase_auto' && l.turn === gs.turn)
    if (phaseLog && phaseLog.msg.startsWith('__BOSS_PHASE__:')) {
      try {
        const phaseData = JSON.parse(phaseLog.msg.replace('__BOSS_PHASE__:', ''))
        const phaseLabel = phaseData.phase === 2 ? 'PHASE II BEGINS' : 'FINAL PHASE UNLEASHED'
        const phaseColor = phaseData.phase === 2 ? '#ff8040' : '#ff2020'
        const phaseBg = phaseData.phase === 2 ? 'rgba(100,40,0,.25)' : 'rgba(120,0,0,.35)'
        html += `<div style="text-align:center;padding:1.2rem;margin:.8rem 0;border:2px solid ${phaseColor};background:${phaseBg};border-radius:5px;box-shadow:0 0 20px ${phaseBg}">
          <div style="font-family:'Cinzel Decorative',serif;font-size:1.1rem;color:${phaseColor};letter-spacing:.15em">☠ ${phaseLabel} ☠</div>
          <div style="font-size:.95rem;color:#e08060;margin-top:.6rem;line-height:1.7">${phaseData.html}</div>
        </div>`
      } catch { /* ignore parse errors */ }
    }

    // Render enemy auto-attack / miss events from applyMechanics
    const enemyAtkLog = gs.log.find(l => l.type === 'enemy_attack' && l.turn === gs.turn)
    if (enemyAtkLog && enemyAtkLog.msg.startsWith('__ENEMY_ATTACK__:')) {
      try {
        const atkData = JSON.parse(enemyAtkLog.msg.replace('__ENEMY_ATTACK__:', ''))
        html += atkData.html
      } catch { /* ignore */ }
    }
    const enemyMissLog = gs.log.find(l => l.type === 'enemy_miss' && l.turn === gs.turn)
    if (enemyMissLog && enemyMissLog.msg.startsWith('__ENEMY_MISS__:')) {
      try {
        const missData = JSON.parse(enemyMissLog.msg.replace('__ENEMY_MISS__:', ''))
        html += missData.html
      } catch { /* ignore */ }
    }

    // Narrative
    // The pre-JSON prose (stored in ref, synchronous) is usually the FULL narration.
    // The JSON dm_narration field is often a shorter summary.
    // Using ref instead of lastDMNarrative state to avoid stale React state across turns.
    const jsonNarr = res.dm_narration || ''
    const preJsonNarr = preJsonNarrativeRef.current || ''
    let narr: string
    if (isFirst) {
      // v2.19.0 TURN 0 (shard-only intro): prefer JSON dm_narration (~1500 chars)
      narr = jsonNarr.length >= 50 ? jsonNarr : (preJsonNarr || 'The shard awakens...')
    } else if (gs.turn === 0) {
      // v2.19.0 TURN 1 (full intro): prefer pre-JSON prose (rich Gaiman with full phases)
      narr = preJsonNarr.length > 100 ? preJsonNarr : (jsonNarr || 'The DM gathers thoughts...')
    } else {
      // REGULAR turns: prefer JSON dm_narration (shorter, controlled)
      // Only fall back to pre-JSON prose if JSON is suspiciously short (< 50 chars)
      narr = jsonNarr.length >= 50 ? jsonNarr : (preJsonNarr || jsonNarr || 'The DM gathers thoughts...')
    }
    if (preJsonNarr.length > 0 && jsonNarr.length > 0) {
      console.log(`📝 Narration — pre-JSON prose: ${preJsonNarr.length} chars, JSON dm_narration: ${jsonNarr.length} chars, using: ${narr === preJsonNarr ? 'pre-JSON' : 'JSON'} (isFirst=${isFirst})`)
    }
    const combatParsed = parseCombatData(narr)
    const questParsed = parseQuestData(combatParsed.cleanText)
    const consequenceParsed = parseConsequenceData(questParsed.cleanText, gs.turn)
    const quickeningParsed = parseQuickeningData(consequenceParsed.cleanText, gs.turn, quickeningState)
    narr = quickeningParsed.cleanText

    // v2.24.0: Truncate long narrations — Turn 0: 200 words, Turn 1: 500 words, Regular: 350 words
    const maxWords = isFirst ? 200 : gs.turn <= 1 ? 500 : 350
    const maxChars = isFirst ? 1500 : gs.turn <= 1 ? 4000 : 3000
    if (narr.length > maxChars) {
      const words = narr.split(/\s+/)
      if (words.length > maxWords) {
        // Find a clean sentence boundary near maxWords
        const truncated = words.slice(0, maxWords).join(' ')
        const lastPeriod = Math.max(
          truncated.lastIndexOf('.'),
          truncated.lastIndexOf('!'),
          truncated.lastIndexOf('?')
        )
        narr = lastPeriod > truncated.length * 0.7
          ? truncated.slice(0, lastPeriod + 1)
          : truncated + '...'
      }
    }
    if (Object.keys(combatParsed.combatData).length) {
      // EARLY ACT I GUARD: Suppress keyword-based combat activation before turn 8.
      // AI narration in Act I often contains combat-flavored words (attack, spell, hit, etc.)
      // that trigger false-positive combat mode. Only allow structured <combat_data> with turnOrder.
      const isEarlyActI = gs.act === ACTS.ONE && gs.turn < 8
      const hasStructuredCombat = !!(combatParsed.combatData.turnOrder && combatParsed.combatData.turnOrder.length > 0)
      if (isEarlyActI && !hasStructuredCombat) {
        console.warn('🛡️ EARLY ACT I GUARD: Suppressing keyword-based combat activation before turn 8')
        // Also deactivate if combat was spuriously active
        if (combatState.isActive) {
          setCombatState(prev => ({ ...prev, isActive: false, victory: null }))
        }
      } else {
        setCombatState(prev => ({ ...prev, ...combatParsed.combatData }))
        combatQuietTurnsRef.current = 0
      }
    } else if (combatState.isActive) {
      const combatKeywords = /\b(attack|slash|spell|hit|damage|hp|initiative|round|strike|blast)\b/i.test(narr)
      combatQuietTurnsRef.current = combatKeywords ? 0 : combatQuietTurnsRef.current + 1
      if (combatQuietTurnsRef.current >= 2) {
        setCombatState(prev => ({ ...prev, isActive: false, victory: null }))
      }
    }
    if (Object.keys(questParsed.questData).length) {
      setQuestJournal(prev => ({ ...prev, ...questParsed.questData }))
    }
    if (Object.keys(consequenceParsed.consequenceData).length) {
      setConsequenceState(consequenceParsed.consequenceData as ConsequenceState)
    }
    if (consequenceParsed.rippleNarration) {
      setRippleEcho(consequenceParsed.rippleNarration)
    }
    if (Object.keys(quickeningParsed.quickeningUpdate).length) {
      setQuickeningState(prev => ({ ...prev, ...quickeningParsed.quickeningUpdate }))
    }

    // Quickening attunement and conflict decrement
    if (quickeningState.currentPower && quickeningState.currentPower.attunement < 100 && !quickeningParsed.quickeningUpdate.currentPower) {
      const increment = quickeningState.currentPower.gambleResult === 'resistant' ? 10 : 10
      setQuickeningState(prev => ({
        ...prev,
        currentPower: prev.currentPower ? { ...prev.currentPower, attunement: Math.min(100, prev.currentPower.attunement + increment) } : null,
      }))
    }
    if (quickeningState.activeEcho?.isConflicted && quickeningState.activeEcho.conflictTurnsRemaining > 0 && !quickeningParsed.quickeningUpdate.activeEcho) {
      setQuickeningState(prev => {
        if (!prev.activeEcho) return prev
        const newRemaining = prev.activeEcho.conflictTurnsRemaining - 1
        if (newRemaining <= 0) {
          return { ...prev, activeEcho: { ...prev.activeEcho, isConflicted: false, conflictTurnsRemaining: 0 } }
        }
        return { ...prev, activeEcho: { ...prev.activeEcho, conflictTurnsRemaining: newRemaining } }
      })
    }
    narr = cleanNarrationForDisplay(narr)
    const paragraphs = [narr].filter(Boolean)
    const displayedText = paragraphs[0] || ''
    setDisplayedNarrative(displayedText)
    setLastDMNarrative(displayedText)
    renderedNarrationRef.current = displayedText
    // ═════════════════════════════════════════════════════════════════════════
    // TTS NARRATION SAVE — This is the ONLY place ttsNarrationRef gets set.
    // The narration is now fully parsed, cleaned, and ready for TTS.
    // This guarantees TTS always reads complete, clean DM narration.
    // ═════════════════════════════════════════════════════════════════════════
    ttsNarrationRef.current = displayedText
    console.log(`🔊 TTS narration saved: ${displayedText.length} chars, ready for speech`)
    // ═════════════════════════════════════════════════════════════════════════
    // SCENE IMAGE GENERATION — Always generate a fantasy scene illustration
    // for each DM turn. Uses AI image gen with SVG fallback.
    // ═════════════════════════════════════════════════════════════════════════
    try {
      const isCombatScene =
        (gs.activeNPCs || []).some(n => n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS') ||
        ((res.dice_rolls || []).length > 0) ||
        ((res.damage_dealt || []).length > 0)
      const narrationForImage = displayedText || narr
      console.log(`🖼️ Scene image gen — turn:${gs.turn}, narrLen:${narrationForImage?.length || 0}, combat:${isCombatScene}`)
      const seededPanels = await generateComicPanels(narrationForImage, isCombatScene, { artStyle: comicArtStyle, maxPanels: 1 })
      const cachedTurnImage = sceneImageByTurn[gs.turn]
      if (cachedTurnImage) {
        console.log(`🖼️ Using cached image for turn ${gs.turn}`)
        setComicPanels(seededPanels.map(panel => ({ ...panel, imageUrl: cachedTurnImage, isGenerating: false, error: undefined })))
      } else {
        console.log(`🖼️ Generating new AI image for turn ${gs.turn}...`)
        setComicPanels(seededPanels)
        const renderedPanels = await Promise.all(
          seededPanels.map(panel => generatePanelImage(panel, narrationForImage, comicArtStyle, gs.turn)),
        )
        console.log(`🖼️ Image generated — panels: ${renderedPanels.length}, hasImage: ${!!renderedPanels[0]?.imageUrl}, isPlaceholder: ${renderedPanels[0]?.imageUrl?.startsWith('data:image/svg')}`)
        setComicPanels(renderedPanels)
        const firstImage = renderedPanels.find(p => p.imageUrl)?.imageUrl
        if (firstImage) {
          setSceneImageByTurn(prev => ({ ...prev, [gs.turn]: firstImage }))
        }
      }
    } catch (sceneErr) {
      console.warn('Scene image generation failed:', sceneErr)
      setComicPanels([])
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // OUTCOME TIER BANNER — PbtA visual feedback
    // ═══════════════════════════════════════════════════════════════════════════
    if (gs.lastOutcomeTier) {
      const tierStyles: Record<string, { bg: string; border: string; color: string; text: string }> = {
        critical_success: { bg: 'rgba(212,175,55,.15)', border: '#d4af37', color: '#ffd700', text: '✦ CRITICAL SUCCESS ✦' },
        full_success: { bg: 'rgba(34,197,94,.12)', border: '#22c55e', color: '#4ade80', text: '✦ SUCCESS ✦' },
        partial_success: { bg: 'rgba(245,158,11,.12)', border: '#f59e0b', color: '#fbbf24', text: '⚡ PARTIAL SUCCESS — Success at a cost' },
        miss: { bg: 'rgba(239,68,68,.12)', border: '#ef4444', color: '#f87171', text: '✗ MISS — The world pushes back' },
        consequences: { bg: 'rgba(160,80,200,.12)', border: '#a050c8', color: '#c090e0', text: '◉ CONSEQUENCES' }
      }
      const style = tierStyles[gs.lastOutcomeTier] || tierStyles.full_success
      html += `<div style="text-align:center;padding:.6rem 1rem;margin:.8rem 0;border:1px solid ${style.border};background:${style.bg};border-radius:5px">
        <div style="font-family:'Cinzel Decorative',serif;font-size:.9rem;color:${style.color};letter-spacing:.12em">${style.text}</div>
      </div>`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MORALITY SHIFT — Paragon/Renegade display
    // ═══════════════════════════════════════════════════════════════════════════
    if (res.paragon_delta && res.paragon_delta > 0) {
      html += `<div style="text-align:center;padding:.3rem .8rem;margin:.3rem 0;border:1px solid rgba(80,140,220,.3);background:rgba(80,140,220,.08);border-radius:4px">
        <span style="color:#60a0e0;font-family:Cinzel,serif;font-size:.8rem;letter-spacing:.08em">+${res.paragon_delta} Paragon</span>
      </div>`
    }
    const renegadeDeltaVal = res.renegade_delta
    if (renegadeDeltaVal && typeof renegadeDeltaVal === 'number' && renegadeDeltaVal > 0) {
      html += `<div style="text-align:center;padding:.3rem .8rem;margin:.3rem 0;border:1px solid rgba(220,60,60,.3);background:rgba(220,60,60,.08);border-radius:4px">
        <span style="color:#e06060;font-family:Cinzel,serif;font-size:.8rem;letter-spacing:.08em">+${renegadeDeltaVal} Renegade</span>
      </div>`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NEW ASPECT NOTIFICATION
    // ═══════════════════════════════════════════════════════════════════════════
    if (res.new_aspect && typeof res.new_aspect === 'string' && res.new_aspect.length > 0) {
      html += `<div style="text-align:center;padding:.5rem .8rem;margin:.5rem 0;border:1px dashed rgba(150,100,200,.4);background:rgba(100,50,150,.08);border-radius:4px">
        <div style="font-family:Cinzel,serif;font-size:.75rem;color:#9070b0;letter-spacing:.08em">✦ NEW ASPECT EARNED ✦</div>
        <div style="color:#c0a0e0;font-size:.9rem;font-style:italic;margin-top:.2rem">"${toAscii(res.new_aspect)}"</div>
      </div>`
    }

    // ═══════════════════════════════════════════════════════════════════════════
    
    // Update conversation history for persistent DM memory
    if (res.dm_narration && res.dm_narration.length > 30) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant' as const, content: res.dm_narration.slice(0, 200) }
      ].slice(-10)) // Keep last 10 entries for DM Memory Log display
    }

    // Combat keyword detection for narration styling
    const combatKeywords = ['strikes', 'slashes', 'casts', 'attacks', 'hits', 'misses', 'damages', 'deals', 'critical']
    const isCombatParagraph = (p: string) => combatKeywords.some(kw => p.toLowerCase().includes(kw))

    // ── MOOD DETECTION — determines parchment border color & narration tint ──
    const narrText = narr.toLowerCase()
    const hasCombat = (gs.activeNPCs || []).some(n => n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS') ||
      combatKeywords.some(kw => narrText.includes(kw))
    const hasShard = /shard|prophecy|whisper|dream|vision|pulse|glow|fate|riddle/.test(narrText)
    const hasDivine = /divine|god|deity|celestial|holy|blessing|altar|temple|prayer|sacred|immortal/.test(narrText) ||
      (res.npc_encounters || []).some(n => /greater.god|lesser.god|demigod/i.test(n.encounter_type || '') || /god|deity/i.test(n.behavior || ''))
    const hasDread = /darkness|shadow|cold|silence|empty|void|decay|rot|death|corpse|tomb|grave|horror|fear|dread|chill/.test(narrText) ||
      gs.act === 'act3'
    const hasNature = /forest|tree|river|mountain|meadow|garden|grove|vine|leaf|bird|wind|rain|sunlight|bloom/.test(narrText)
    let narrationMood = 'default'
    if (hasCombat) narrationMood = 'combat'
    else if (hasShard) narrationMood = 'shard'
    else if (hasDivine) narrationMood = 'divine'
    else if (hasDread) narrationMood = 'dread'
    else if (hasNature) narrationMood = 'nature'

    // Style dialogue: wrap "quoted text" in spans with speaker attribution bubbles
    const commonWords = ['The', 'They', 'He', 'She', 'It', 'We', 'You', 'This', 'That', 'There', 'Here', 'What', 'How', 'Why', 'When']
    const styledParagraphs = paragraphs.slice(0, 12).map((p, i) => {
      // Enhanced dialogue: detect "Name said:" or "Name:" patterns before quotes
      let withDialogue = p.replace(/([A-Z][a-zA-Z\s]{1,20}?)(?:\s+said|\s+replies|\s+shouts|\s+whispers|\s+screams|\s+murmurs|\s+asks|\s+exclaims)?:?\s*[""\u201C\u201D]([^""\u201C\u201D]+)[""\u201C\u201D]/g,
        (match, name, dialogue) => {
          if (commonWords.includes(name.trim())) {
            return `<span class="dialogue-text">"${dialogue}"</span>`
          }
          return `<div class="dialogue-bubble"><div class="dialogue-speaker">${name.trim()}</div><div class="dialogue-text">"${dialogue}"</div></div>`
        }
      )
      // Also handle standalone quotes without speaker attribution (10+ chars)
      withDialogue = withDialogue.replace(/(?<!class="dialogue-text">)(?<!dialogue-bubble[^>]*>)(?<!<\/div>)"([^"]{10,})"/g,
        '<span class="dialogue-text">"$1"</span>'
      )
      const isFirst = i === 0
      const pClass = `${isFirst ? 'drop-cap ' : ''}ink-blot`
      if (isCombatParagraph(p)) {
        return `<div class="combat-narration"><p class="${pClass}" style="text-indent:1.5em;margin-bottom:.85em">${withDialogue}</p></div>`
      }
      return `<p class="${pClass}" style="text-indent:1.5em;margin-bottom:.85em">${withDialogue}</p>`
    })

    // Codex inline links for known entities (use passed gs, not closure-captured gameState)
    let codexLinked = [...styledParagraphs]
    const allNames = [
      ...gs.activeNPCs.map(n => n.name),
      ...gs.pcs.map(p => p.name),
    ]
    const codexTerms = [...allNames]
    codexTerms.sort((a, b) => b.length - a.length)
    for (const name of codexTerms) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?<!href="[^"]*)(?<!\\/a>)(?<![a-zA-Z])\\b${escaped}\\b(?![a-zA-Z])(?![^<]*<\\/a>)`, 'g')
      codexLinked = codexLinked.map(p =>
        p.replace(regex, `<a href="/codex" class="codex-inline-link" title="View in Codex">${name}</a>`)
      )
    }

    html += `<div class="parchment-bg-dm mood-${narrationMood}" style="padding:20px;margin-bottom:12px">
      <div class="dm-narration-header">
        <span class="header-rune-left">ᚠ ᚢ ᚦ</span>
        <span>✦ DM Narration</span>
        <span class="header-line"></span>
        <span class="header-rune-right">ᚨ ᚱ ᚲ</span>
      </div>
      <div class="celtic-divider">
        <span class="knot-symbol">❖</span>
      </div>
      <div class="dm-narration-body" style="font-size:1.25rem;line-height:2;color:#2c1810">
        ${codexLinked.length > 1
          ? `${codexLinked[0]}<div class="prose-collapsible">${codexLinked.slice(1).join('')}</div><button class="prose-expand-btn" onclick="this.previousElementSibling.classList.toggle('expanded');this.textContent=this.previousElementSibling.classList.contains('expanded')?'▾ Show less':'▾ Continue reading'">▾ Continue reading</button>`
          : codexLinked.join('')
        }
      </div>
      ${rippleEcho ? `<div class="ripple-echo-box">Echoes of the Past: ${toAscii(rippleEcho)}</div>` : ''}
    </div>`

    // NPC Encounters
    if (res.npc_encounters?.length) {
      html += `<div style="margin-top:1rem">
        <div style="font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.5rem;display:flex;align-items:center;gap:.3rem">
          ◉ Encounters <span style="flex:1;height:1px;background:#2e2008"></span>
        </div>`
      res.npc_encounters.forEach(n => {
        const col = encColors[n.encounter_type] || '#9a8860'
        html += `<div style="margin:.4rem 0;padding:8px 12px;border-left:3px solid ${col};font-size:1.05rem;line-height:1.7;background:#181208">
          <span style="font-family:Cinzel,serif;font-size:.8rem;padding:3px 8px;border-radius:3px;background:rgba(0,0,0,.4);color:${col};border:1px solid ${col};margin-right:8px">${n.encounter_type}</span>
          <strong class="npc-name" data-name="${toAscii(n.npc_name || '')}">${toAscii(n.npc_name || '')}</strong>
          ${n.pantheon ? `<span style="font-size:.9rem;color:#5a4d30">[${toAscii(n.pantheon)}]</span>` : ''}
          <span style="color:#9a8860">— ${toAscii(n.behavior || '')}</span>
        </div>`
      })
      html += '</div>'
    }

    // Active Injuries
    const allInjs = Object.entries(gs.injuries).filter(([, injs]) => injs.length > 0)
    if (allInjs.length) {
      html += `<div style="margin-top:1rem">
        <div style="font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.5rem;display:flex;align-items:center;gap:.3rem">
          🩸 Active Injuries <span style="flex:1;height:1px;background:#2e2008"></span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">`
      allInjs.forEach(([pcId, injs]) => {
        const pc = gs.pcs.find(p => p.id === pcId)
        injs.forEach(inj => {
          html += `<div style="font-size:1rem;padding:6px 12px;background:rgba(80,20,20,.3);border:1px solid rgba(180,80,80,.4);border-radius:3px;color:#e08040">
            ${inj.icon} ${pc?.name.split(' ')[0] || pcId}: ${inj.name} (${inj.turnsLeft}t)
          </div>`
        })
      })
      html += '</div></div>'
    }

    // Current State
    html += `<div style="margin-top:1rem">
      <div style="font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.5rem;display:flex;align-items:center;gap:.3rem">
        ◈ Current State <span style="flex:1;height:1px;background:#2e2008"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">`

    gs.pcs.forEach(pc => {
      const hpClass = hpCls(pc.hp, pc.maxHp)
      const injuries = gs.injuries[pc.id] || []
      html += `<div style="font-size:1rem;padding:8px 12px;background:#181208;border-left:2px solid ${pc.id === gs.humanPCId ? '#c9a84c' : '#5a4018'};border-radius:0 2px 2px 0">
        <div class="character-name" data-name="${toAscii(pc.name)}">${pc.name}${pc.id === gs.humanPCId ? ' [YOU]' : ''}</div>
        <div style="color:${hpClass === 'dead' ? '#444' : hpClass === 'crit' ? '#cc2020' : hpClass === 'hurt' ? '#e08040' : '#9a8860'};font-size:1rem;margin-top:3px">
          ${pc.dead ? '✝ SLAIN' : `${pc.hp}/${pc.maxHp} HP`}
        </div>
        ${injuries.length ? `<div style="font-size:.9rem;color:#e08040;margin-top:3px">${injuries.map(i => i.icon).join('')}</div>` : ''}
        ${pc.conditions.length ? `<div style="font-size:.9rem;color:#5a4d30;font-style:italic;margin-top:3px">${pc.conditions.slice(0, 2).map(c => typeof c === 'string' ? c : '').filter(Boolean).join(', ')}</div>` : ''}
      </div>`
    })

    // Antagonist
    if (gs.act !== ACTS.ONE && gs.antagonistId) {
      const ant = getAntagonist(gs.antagonistId)
      const ahpClass = hpCls(gs.antagonistHp, gs.antagonistMaxHp)
      html += `<div style="font-size:1rem;padding:8px 12px;background:rgba(80,0,0,.15);border-left:2px solid #cc3030;border-radius:0 2px 2px 0">
        <div style="font-family:Cinzel,serif;font-size:1.05rem;color:#cc4040">${gs.act === ACTS.THREE ? ant?.name : 'The Shadow'}</div>
        <div style="color:${ahpClass === 'crit' ? '#cc2020' : ahpClass === 'hurt' ? '#e08040' : '#cc4040'};font-size:1rem;margin-top:3px">${gs.antagonistHp}/${gs.antagonistMaxHp}</div>
        ${gs.act === ACTS.THREE ? `<div style="font-size:.9rem;color:#e05050;margin-top:3px">Phase ${gs.antagonistPhase}/3</div>` : ''}
      </div>`
    }

    html += '</div></div>'

    // Dice Rolls - Visual display with actual dice data
    const renderDiceFace = (sides: number, value: number): string => {
      const colors: { [key: number]: string } = {
        4: 'from-red-700 to-red-500 border-red-400',
        6: 'from-blue-700 to-blue-500 border-blue-400',
        8: 'from-green-700 to-green-500 border-green-400',
        10: 'from-purple-700 to-purple-500 border-purple-400',
        12: 'from-amber-700 to-amber-500 border-amber-400',
        20: 'from-yellow-600 to-yellow-400 border-yellow-300'
      }
      const shapes: { [key: number]: string } = {
        4: 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%)',
        8: 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        10: 'clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        12: 'clip-path: polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)',
        20: 'clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
      }
      const color = colors[sides] || 'from-gray-700 to-gray-500 border-gray-400'
      const shape = shapes[sides] || 'border-radius: 8px'
      return `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${sides === 20 ? '#b8860b,#ffd700' : sides === 12 ? '#92400e,#f59e0b' : sides === 10 ? '#6b21a8,#a855f7' : sides === 8 ? '#166534,#22c55e' : sides === 6 ? '#1e40af,#3b82f6' : '#b91c1c,#ef4444'});color:#fff;font-weight:bold;font-size:1.1rem;text-shadow:1px 1px 2px rgba(0,0,0,0.8);${shape};border:2px solid ${sides === 20 ? '#ffd700' : sides === 12 ? '#f59e0b' : sides === 10 ? '#a855f7' : sides === 8 ? '#22c55e' : sides === 6 ? '#3b82f6' : '#ef4444'}">${value}</div>`
    }

    const diceRolls = res.dice_rolls || []
    html += `<div style="margin-top:.8rem">
      <div style="font-family:Cinzel,serif;font-size:.9rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.4rem;display:flex;align-items:center;gap:.3rem">
        ⚄ Resolution <span style="flex:1;height:1px;background:#2e2008"></span>
      </div>
      <div id="dice-${gs.turn}" style="background:#181208;border:1px solid #2e2008;border-radius:4px;padding:.8rem 1rem;font-size:.95rem;line-height:1.75">
        ${diceRolls.length > 0 ? diceRolls.map(d => {
          const dieMatch = d.die?.match(/(\d*)d(\d+)/i) || ['1d20', '1', '20']
          const count = parseInt(dieMatch[1]) || 1
          const sides = parseInt(dieMatch[2]) || 20
          const isSuccess = d.success
          return `<div style="margin-bottom:12px;padding:12px;border-radius:8px;border:2px solid ${isSuccess ? '#22c55e' : '#ef4444'};background:linear-gradient(135deg,${isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'},${isSuccess ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)'});box-shadow:0 0 15px ${isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}">
            <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:8px">
              ${Array.from({ length: count }).map((_, i) => renderDiceFace(sides, Math.max(1, Math.floor((d.roll || 1) / count)))).join('')}
            </div>
            <div style="text-align:center">
              <div style="font-family:'Cinzel Decorative',serif;font-size:.9rem;color:#d4af37;margin-bottom:4px">${toAscii(d.roller || 'Unknown')} rolls ${d.die?.toUpperCase() || 'D20'}</div>
              <div style="font-size:1.5rem;font-weight:bold;color:${isSuccess ? '#4ade80' : '#f87171'}">
                ${d.roll || 0} ${d.dc ? `<span style="font-size:.9rem;color:#9ca3af">vs DC ${d.dc}</span>` : ''}
              </div>
              <div style="font-size:.85rem;margin-top:4px;color:${isSuccess ? '#4ade80' : '#f87171'};font-weight:bold">
                ${isSuccess ? '✦ SUCCESS ✦' : '✗ FAILURE ✗'}
              </div>
              ${d.notes ? `<div style="font-size:.8rem;color:#b0a080;margin-top:6px;font-style:italic">"${toAscii(d.notes)}"</div>` : ''}
            </div>
          </div>`
        }).join('') : '<div style="color:#5a4d30;font-size:.85rem;font-style:italic;text-align:center">No dice rolls this turn — narrative focus.</div>'}
      </div>
    </div>`

    // Consequences
    if (res.consequences) {
      html += `<div style="margin-top:.8rem">
        <div style="font-family:Cinzel,serif;font-size:.9rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.4rem;display:flex;align-items:center;gap:.3rem">
          ◉ Consequences <span style="flex:1;height:1px;background:#2e2008"></span>
        </div>
        <div style="font-size:.95rem;background:linear-gradient(90deg,rgba(80,0,0,.1),rgba(10,0,20,.1));border:1px solid rgba(80,0,0,.26);border-radius:3px;padding:10px 14px;line-height:1.7;font-style:italic">
          ${toAscii(res.consequences)}
        </div>
      </div>`
    }

    // Deaths
    if (res.state_updates) {
      res.state_updates.filter(u => u.dead).forEach(u => {
        const pc = gs.pcs.find(p => p.id === u.pc_id)
        if (pc) {
          html += `<div style="text-align:center;padding:10px;margin:10px 0;border:1px solid #8b0000;background:rgba(110,0,0,.16);font-family:Cinzel,serif;font-size:1rem;color:#cc2020;letter-spacing:.09em;border-radius:3px">
            ☠ ${pc.name.toUpperCase()} FALLS — PERMADEATH ☠
          </div>`
        }
      })
    }

    // Boss phase trigger
    if (res.boss_phase_trigger) {
      const ant = getAntagonist(gs.antagonistId)
      html += `<div style="text-align:center;padding:1.2rem;margin:.8rem 0;border:2px solid #ff4040;background:rgba(100,0,0,.25);border-radius:5px">
        <div style="font-family:Cinzel Decorative,serif;font-size:1.1rem;color:#ff6060;letter-spacing:.15em">☠ PHASE ${gs.antagonistPhase} BEGINS ☠</div>
        <div style="font-size:.95rem;color:#e08060;margin-top:.6rem">${toAscii(gs.antagonistPhase === 1 ? ant?.phase1 || '' : gs.antagonistPhase === 2 ? ant?.phase2 || '' : ant?.phase3 || '')}</div>
      </div>`
    }

    // Tension note
    if (res.tension_note) {
      html += `<div style="text-align:center;margin-top:1rem;font-size:.9rem;color:#5a4d30;font-style:italic">${toAscii(res.tension_note)}</div>`
    }

    // Enemy HP bars — show active enemies in combat
    const activeEnemies = gs.activeNPCs.filter(n => !n.dead && (n.encounter_type === 'ENEMY' || n.encounter_type === 'BOSS'))
    if (activeEnemies.length > 0) {
      html += `<div style="margin-top:1rem;padding:0.75rem 1rem;border:1px solid #4a2020;background:rgba(60,20,20,0.15);border-radius:6px">
        <div style="font-family:'Cinzel',serif;font-size:.75rem;color:#c05050;letter-spacing:.1em;margin-bottom:.5rem">⚔ ACTIVE ENEMIES</div>
        ${activeEnemies.map(e => {
          const pct = Math.max(0, Math.round((e.hp / (e.maxHp || 1)) * 100))
          const barColor = pct <= 20 ? '#cc3030' : pct <= 50 ? '#cc8030' : '#cc5050'
          const label = e.encounter_type === 'BOSS' ? '👑 ' : ''
          return `<div style="display:flex;align-items:center;gap:.75rem;margin:.4rem 0">
            <span style="font-size:.8rem;color:#e08080;min-width:120px;font-family:'Cinzel',serif">${label}${e.name}</span>
            <div style="flex:1;height:8px;background:#1a1010;border-radius:4px;overflow:hidden;border:1px solid #3a2020">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width .5s"></div>
            </div>
            <span style="font-size:.75rem;color:#a06060;min-width:60px;text-align:right">${Math.max(0, e.hp)}/${e.maxHp}</span>
          </div>`
        }).join('')}
      </div>`
    }

    html += '</div>'

    appendNarrative(html)
    if (rippleEcho) {
      setTimeout(() => setRippleEcho(null), 5000)
    }
  }

  const appendNarrative = (html: string) => {
    // Dedup guard: prevent appending identical HTML blocks (e.g., from React re-renders)
    const lastItem = narrativeContentRef.current[narrativeContentRef.current.length - 1]
    if (lastItem && lastItem.html === html) {
      console.warn('📖 Narrative dedup: skipping identical block')
      return
    }
    // Trim to last 100 entries to prevent unbounded memory growth
    setNarrativeContent(prev => {
      const next = [...prev, { html }].slice(-100)
      narrativeContentRef.current = next
      return next
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST OF FAITH SYSTEM — Murphy's Law / Miracle Survival
  // ═══════════════════════════════════════════════════════════════════════════

  const generateTestOfFaithNarration = (
    ctx: NonNullable<GameState['testOfFaithContext']>,
    roll: number,
    outcome: 'miracle' | 'murphy' | 'fate_holds',
  ): string => {
    if (outcome === 'miracle') {
      return `<div style="border:1px solid #f59e0b;border-radius:8px;padding:1rem;margin:0.75rem 0;background:rgba(245,158,11,0.08)">
      <div style="color:#fbbf24;font-weight:bold;font-size:1.1em;margin-bottom:0.5rem">✦ THE MIRACLE ✦</div>
      <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
        The dice fall. The number is <strong style="color:#fbbf24;font-size:1.2em">${roll}</strong>. 
        And something happens that should not happen — that <em>cannot</em> happen, by any law of gods or mortals or the spaces between.
        ${ctx.trigger === 'death_save' && ctx.pcName 
          ? `${ctx.pcName} should be dead. The blade went in. The light went out. And then — against all reason, against every prayer that was never answered and every prayer that was — they breathe. They breathe, and the world holds its breath with them.`
          : `The universe, which has been indifferent since before the gods were young, has chosen a side. And it has chosen theirs.`}
      </p>
      <p style="color:#fbbf24;line-height:1.7;font-style:italic;margin-bottom:0.5rem">
        The shard remembers why it chose them. The prophecy holds. ${ctx.pcName || 'The hero'} stands — 
        ${ctx.trigger === 'death_save' ? 'not because they are unkillable, but because tonight, for one impossible moment, the story refused to let them die.' : 'and the antagonist staggers under a blow from fate itself.'}
      </p>
      <div style="color:#f59e0b;font-size:0.9em;text-align:center;margin-top:0.5rem">
        ⚡ +8 Success Rate · ${ctx.trigger === 'death_save' ? 'Revived at 1 HP' : '15% Antagonist Damage'} · Shard Charge Restored ⚡
      </div>
    </div>`
    }

    if (outcome === 'murphy') {
      return `<div style="border:1px solid #dc2626;border-radius:8px;padding:1rem;margin:0.75rem 0;background:rgba(220,38,38,0.08)">
      <div style="color:#ef4444;font-weight:bold;font-size:1.1em;margin-bottom:0.5rem">☠ MURPHY'S LAW ☠</div>
      <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.75rem">
        The dice fall. The number is <strong style="color:#ef4444;font-size:1.2em">${roll}</strong>. 
        And everything that can go wrong, does go wrong — not because the gods are cruel, but because the universe has a sense of humor, and it has not been kind lately.
      </p>
      <p style="color:#ef4444;line-height:1.7;font-style:italic;margin-bottom:0.5rem">
        The shard darkens. Something held within it goes quiet — not broken, but listening. Listening to the sound of luck running out, the sound of probability collapsing into a single inevitable point.
      </p>
      <div style="color:#dc2626;font-size:0.9em;text-align:center;margin-top:0.5rem">
        ☠ -5 Success Rate · Item Charge Lost · Shard Darkened ☠
      </div>
    </div>`
    }

    // fate_holds (4-17)
    return `<div style="border:1px solid #6b7280;border-radius:8px;padding:1rem;margin:0.75rem 0;background:rgba(107,114,128,0.08)">
    <div style="color:#9ca3af;font-weight:bold;font-size:1.1em;margin-bottom:0.5rem">⚙ THE DICE SPEAK ⚙</div>
    <p style="color:#d4d4d4;line-height:1.7;margin-bottom:0.5rem">
      The dice fall. The number is <strong style="color:#9ca3af;font-size:1.2em">${roll}</strong>. 
      Neither miracle nor catastrophe. The world holds its breath, and then — exhales. Things are as they are. 
      ${ctx.pcName ? `Not even fate will intervene for ${ctx.pcName} today. They must carry this weight themselves.` : 'The story continues on its own terms.'}
    </p>
    <div style="color:#6b7280;font-size:0.9em;text-align:center;margin-top:0.5rem">
      ⚙ No change — fate is neutral ⚙
    </div>
  </div>`
  }

  const checkTestOfFaith = (newGS: GameState, res: DMResponse): GameState => {
    // Don't trigger in Act I
    if (newGS.act === 'act1') return newGS

    // Cooldown: 10 turns
    if (newGS.turn - newGS.lastTestOfFaithTurn < 10) return newGS

    // Hard cap: max 2 miracles used across entire party
    if (newGS.testOfFaithMiraclesUsed.length >= 2) return newGS

    let trigger: 'death_save' | 'boss_phase' | 'desperate_odds' | null = null
    let pcId: string | undefined
    let pcName: string | undefined
    let bossPhase: number | undefined

    // Check: a PC just died
    if (res.state_updates) {
      const deathUpdate = res.state_updates.find(u => u.dead && u.pc_id !== 'ANTAGONIST')
      if (deathUpdate) {
        const deadPC = newGS.pcs.find(p => p.id === deathUpdate.pc_id)
        if (deadPC && !newGS.testOfFaithMiraclesUsed.includes(deadPC.id)) {
          trigger = 'death_save'
          pcId = deadPC.id
          pcName = deadPC.name
        }
      }
    }

    // Check: boss phase advanced
    if (!trigger && res.boss_phase_trigger) {
      trigger = 'boss_phase'
      bossPhase = newGS.antagonistPhase
    }

    // Check: success rate desperate
    if (!trigger && newGS.currentSuccessRate < 40) {
      trigger = 'desperate_odds'
      // Pick a living PC who hasn't used their miracle
      const eligiblePC = newGS.pcs.find(p => !p.dead && !newGS.testOfFaithMiraclesUsed.includes(p.id))
      if (eligiblePC) {
        pcId = eligiblePC.id
        pcName = eligiblePC.name
      }
    }

    if (!trigger) return newGS

    return {
      ...newGS,
      pendingTestOfFaith: true,
      waitingForHuman: false,  // Override normal choice panel
      testOfFaithContext: { trigger, pcId, pcName, bossPhase },
      lastTestOfFaithTurn: newGS.turn,
      totalTestOfFaith: newGS.totalTestOfFaith + 1
    }
  }

  const resolveTestOfFaith = async (roll: number) => {
    const gs = { ...gameState }
    const ctx = gs.testOfFaithContext
    if (!ctx || !gs.pendingTestOfFaith) return

    // Determine outcome
    let outcome: 'miracle' | 'murphy' | 'fate_holds'
    if (roll >= 18) outcome = 'miracle'
    else if (roll <= 3) outcome = 'murphy'
    else outcome = 'fate_holds'

    const newGS: GameState = {
      ...gs,
      pendingTestOfFaith: false,
      testOfFaithContext: { ...ctx, roll, outcome }
    }

    if (outcome === 'miracle') {
      const miracles = [...gs.testOfFaithMiraclesUsed]
      if (ctx.pcId) miracles.push(ctx.pcId)

      // Resolve miracle effects
      if (ctx.trigger === 'death_save' && ctx.pcId) {
        // Revive the dead PC at 1 HP
        newGS.pcs = gs.pcs.map(p => p.id === ctx.pcId ? { ...p, dead: false, hp: 1 } : p)

        // Restore prophecy to the revived PC if it was transferred to a successor
        const successorProphecy = newGS.prophecies.find(p =>
          p.previous_holders.includes(ctx.pcId!) && p.pc_id !== ctx.pcId
        )
        if (successorProphecy) {
          const prevHolder = successorProphecy.pc_id
          newGS.prophecies = newGS.prophecies.map(p =>
            p.pc_id === prevHolder
              ? { ...p, pc_id: ctx.pcId!, previous_holders: [...p.previous_holders.slice(0, -1)], state: p.state as 'awakening' | 'dormant' }
              : p
          )
          // Remove successor from party if they were added solely as a prophecy replacement
          const successorExistedBefore = gs.pcs.find(p => p.id === prevHolder)
          const successorIsReplacement = !successorExistedBefore && newGS.pcs.find(p => p.id === prevHolder)
          if (successorIsReplacement) {
            newGS.pcs = newGS.pcs.filter(p => p.id !== prevHolder)
          }
        }
      }
      if (ctx.trigger === 'boss_phase') {
        // Damage antagonist 15% max HP
        const dmg = Math.floor(gs.antagonistMaxHp * 0.15)
        newGS.antagonistHp = Math.max(0, gs.antagonistHp - dmg)
      }
      // +8 success rate, restore 1 shard charge
      newGS.currentSuccessRate = Math.min(95, gs.currentSuccessRate + 8)
      newGS.shardCharges = Math.min(2, gs.shardCharges + 1)
      newGS.shardDark = false // Miracle rekindles the shard
      newGS.testOfFaithMiraclesUsed = miracles
    }

    if (outcome === 'murphy') {
      // -5 success rate
      newGS.currentSuccessRate = Math.max(5, gs.currentSuccessRate - 5)
      // Random item loses a charge
      const chargedItems = gs.inventory.filter(i => i.charges && i.charges > 0)
      if (chargedItems.length > 0) {
        const target = chargedItems[Math.floor(Math.random() * chargedItems.length)]
        const idx = gs.inventory.findIndex(i => i.id === target.id)
        if (idx >= 0) {
          newGS.inventory = gs.inventory.map((item, i) =>
            i === idx && item.charges ? { ...item, charges: item.charges - 1 } : item
          )
        }
      }
      // Shard darkens
      newGS.shardDark = true
    }

    // Append narrative prose
    const prose = generateTestOfFaithNarration(ctx, roll, outcome)
    appendNarrative(prose)

    // Check campaign end after resolving effects
    const living = newGS.pcs.filter(p => !p.dead)
    if (!living.length) {
      newGS.isProcessing = false
      setGameState({ ...newGS })
      endCampaign(false, newGS)
      return
    }
    if (Number.isFinite(newGS.antagonistHp) && newGS.antagonistHp <= 0 && newGS.act === ACTS.THREE) {
      newGS.isProcessing = false
      setGameState({ ...newGS })
      endCampaign(true, newGS)
      return
    }

    // Resume normal game flow — generate next options
    const nextPC = newGS.pcs.find(p => p.id === newGS.humanPCId && !p.dead) || living[0]
    if (nextPC) {
      const { pcOptions, compOptions, extraOptions } = buildDefaultOptions(nextPC)
      newGS.humanOptions = [...pcOptions, ...extraOptions]
      newGS.companionOptions = compOptions
      newGS.waitingForHuman = true
      newGS.pendingHumanChoice = null
      newGS.pendingCompanionChoice = null
      newGS.isProcessing = false
      setGameState({ ...newGS })
      setStatusMessage(`YOUR TURN — ${nextPC.name}${compOptions.length > 0 ? ` + ${newGS.companionId ? newGS.pcs.find(p => p.id === newGS.companionId)?.name?.split(' ')[0] : 'Companion'}` : ''}`)
    } else {
      newGS.isProcessing = false
      setGameState({ ...newGS })
      setStatusMessage(`T${newGS.turn} done — ${living.length} alive`)
    }
  }

  // ── HUMAN CHOICE HANDLERS ──────────────────────────────────────────────
  const selectOption = (idx: number) => {
    if (!gameState.waitingForHuman || gameState.isProcessing) return
    setGameState(prev => ({
      ...prev,
      pendingHumanChoice: idx === -1 ? null : idx
    }))
  }

  // Companion choice handler — separate from PC choice
  const selectCompanionOption = (idx: number) => {
    if (!gameState.waitingForHuman || gameState.isProcessing) return
    if (gameState.companionOptions.length === 0) return
    setGameState(prev => ({
      ...prev,
      pendingCompanionChoice: idx
    }))
  }

  const confirmChoice = async (customText?: string) => {
    // Require PC choice OR free-text action; companion choice only required if companion exists
    const freeTextValue = customText?.trim() || gameState.customActionPending?.trim() || ''
    const hasFreeText = !!freeTextValue
    const hasPresetChoice = gameState.pendingHumanChoice !== null
    if (!hasPresetChoice && !hasFreeText) return
    if (!gameState.waitingForHuman || gameState.isProcessing) return
    const needsCompanionChoice = gameState.companionOptions.length > 0 && gameState.pendingCompanionChoice === null && gameState.pendingCompanionChoice !== undefined
    if (needsCompanionChoice) return

    let gs = { ...gameState, waitingForHuman: false, isProcessing: true, lastOutcomeTier: null, customActionPending: null }

    // Resolve choices first (needed for cooldown tracking)
    const humanPC = gs.pcs.find(p => p.id === gs.humanPCId) || gs.pcs.find(p => !p.dead)

    // ── FREE-TEXT ACTION — Player wrote their own action ──────────────────
    let isFreeTextAction = false
    let chosen: GameOption | undefined
    if (hasPresetChoice) {
      const choiceIdx = Math.min(gs.pendingHumanChoice ?? 0, gs.humanOptions.length - 1)
      chosen = gs.humanOptions[choiceIdx]
    }
    if (hasFreeText && !hasPresetChoice) {
      isFreeTextAction = true
      // Create a synthetic GameOption for the free-text action
      chosen = {
        num: 0,
        action: freeTextValue,
        ability: 'custom_action',
        align_note: 'player-written action',
        source: 'pc'
      }
    }
    if (!chosen) return

    // Resolve companion choice
    const companion = gs.companionId ? gs.pcs.find(p => p.id === gs.companionId) : null
    const compChoiceIdx = gs.pendingCompanionChoice != null ? Math.min(gs.pendingCompanionChoice, gs.companionOptions.length - 1) : null
    const compChosen = compChoiceIdx != null ? gs.companionOptions[compChoiceIdx] : null

    // ── STORE PLAYER CHOICES for turn history display ──────────────────
    lastPlayerChoiceRef.current = {
      pcName: humanPC?.name || 'PC',
      pcAction: chosen?.action || 'acts',
      pcAbility: chosen?.ability || '',
      compName: compChosen ? companion?.name : undefined,
      compAction: compChosen?.action,
      isFreeText: isFreeTextAction
    }

    // ── ADD USER CHOICE to conversation history for DM Memory Log ───────
    const userChoiceText = compChosen
      ? `${humanPC?.name || 'PC'}: ${chosen?.action} | ${companion?.name}: ${compChosen.action}`
      : `${humanPC?.name || 'PC'}: ${chosen?.action}`
    setConversationHistory(prev => [
      ...prev,
      { role: 'user' as const, content: userChoiceText.slice(0, 200) }
    ].slice(-10)) // Keep last 10 entries

    // ── ABILITY COOLDOWN: Track used PC ability ──────────────────────────
    const humanPCForCD = gs.pcs.find(p => p.id === gs.humanPCId) || gs.pcs.find(p => !p.dead)
    if (humanPCForCD && chosen?.ability && chosen.ability !== 'skip') {
      const cdKey = `${humanPCForCD.id}_${chosen.ability}`
      gs.abilityCooldowns = {
        ...gs.abilityCooldowns,
        [cdKey]: { ability: chosen.ability, turnsLeft: 3, totalTurns: 3 }
      }
    }
    // Track companion ability cooldown too
    if (compChosen && companion && compChosen.ability && compChosen.ability !== 'skip') {
      const compCdKey = `${companion.id}_${compChosen.ability}`
      gs.abilityCooldowns = {
        ...gs.abilityCooldowns,
        [compCdKey]: { ability: compChosen.ability, turnsLeft: 3, totalTurns: 3 }
      }
    }

    // ── STAMINA COST — Deduct stamina for combat actions ─────────────────
    // Note: custom_action (free-text) stamina is NOT deducted here —
    // the DM handles it via the system prompt instruction (1-3 depending on action type).
    // This avoids double-deducting if the DM also includes stamina in state_updates.
    if (!isFreeTextAction) {
      if (chosen?.ability === 'melee_attack') {
        gs.stamina = Math.max(0, gs.stamina - 2)
      } else if (chosen?.ability === 'defend') {
        gs.stamina = Math.max(0, gs.stamina - 1)
      } else if (chosen?.ability !== 'skip' && !chosen?.ability.startsWith('invoke_aspect:') && chosen?.source !== 'archrival_summon' && chosen?.ability !== 'disengage_combat') {
        // Special abilities cost 3 stamina
        gs.stamina = Math.max(0, gs.stamina - 3)
      }
    }

    // ── FATE POINT — Spend FP when invoking aspect ──────────────────────────
    if (chosen?.ability.startsWith('invoke_aspect:') && gs.fatePoints > 0 && gs.aspects.length > 0) {
      const aspectName = chosen.ability.replace('invoke_aspect:', '')
      const matchedAspect = gs.aspects.find(a => a.name === aspectName)
      if (matchedAspect) {
        const invokeGS = spendFatePoint(gs, matchedAspect.name, `Invoked "${matchedAspect.name}" for +2 to next roll`)
        gs.fatePoints = invokeGS.fatePoints
        gs.aspects = invokeGS.aspects
        gs.fatePointHistory = invokeGS.fatePointHistory
        toast({
          title: `✦ ${matchedAspect.name} Invoked`,
          description: `Spent 1 Fate Point. +2 to your next roll. ${gs.fatePoints} FP remaining.`,
          duration: 3000
        })
      }
    }

    // ── POTION USE — Decrement charges when used via choice panel (P4.4 FIX) ──
    if (chosen?.ability.startsWith('use_item:')) {
      const itemId = chosen.ability.replace('use_item:', '')
      const item = gs.inventory.find(i => i.id === itemId || i.id.startsWith(itemId))
      if (item) {
        // Apply healing effect locally (same as handleUseItem)
        const targetPC = gs.pcs.find(p => p.id === gs.humanPCId && !p.dead) || gs.pcs.find(p => !p.dead)
        if (targetPC && item.modifier?.healing) {
          const healAmount = typeof item.modifier.healing === 'number' ? item.modifier.healing : Math.floor(Math.random() * 8 + Math.random() * 8) + 4
          gs.pcs = gs.pcs.map(p => p.id !== targetPC.id ? p : { ...p, hp: Math.min(p.maxHp, p.hp + healAmount) })
          toast({ title: `${item.name} Used`, description: `${targetPC.name} healed for ${healAmount} HP` })
        }
        // Death ward
        if (targetPC && item.modifier?.death_ward) {
          const currentConditions = targetPC.conditions || []
          if (!currentConditions.includes('Death Ward')) {
            gs.pcs = gs.pcs.map(p => p.id !== targetPC.id ? p : { ...p, conditions: [...currentConditions, 'Death Ward'] })
            toast({ title: `${item.name} Used`, description: `${targetPC.name} is warded against death!` })
          }
        }
        // Decrement charges or remove item
        if (item.charges && item.charges > 1) {
          gs.inventory = gs.inventory.map(i => i.id !== item.id ? i : { ...i, charges: (i.charges || 1) - 1 })
        } else {
          gs.inventory = gs.inventory.filter(i => i.id !== item.id)
        }
      }
    }

    setGameState(gs)
    
    const ant = getAntagonist(gs.antagonistId)

    // ═══════════════════════════════════════════════════════════════════════════
    // ARCHRIVAL SUMMON — Special handling for Option 7 in Act III
    // ═══════════════════════════════════════════════════════════════════════════
    const isRivalSummon = chosen?.source === 'archrival_summon' && gs.antagonistBanished && gs.antagonistRival
    let rivalSummoned = false

    setStatusMessage(`Resolving ${humanPC?.name}'s choice${compChosen ? ` + ${companion?.name?.split(' ')[0]}'s action` : ''}...`)

    const companionActionLine = compChosen && companion
      ? `\n\nThe player ALSO chose for ${toAscii(companion.name)}: "${toAscii(compChosen.action)}"[${toAscii(compChosen.ability || '')}].\nResolve ${toAscii(companion.name.split(' ')[0])}'s action WITH MECHANICAL DETAIL too — roll d20, apply damage, etc. Both characters act this turn.`
      : ''

    // ── D&D 5e SKILL CHECK — Roll for skill-based actions ──────────────
    // Map ability names to D&D 5e skill keys, run performSkillCheck, inject result into DM prompt
    const ABILITY_TO_SKILL: Record<string, keyof PlayerSkills> = {
      'persuasion': 'persuasion', 'intimidation': 'intimidation', 'deception': 'deception',
      'investigation': 'investigation', 'perception': 'perception', 'insight': 'insight',
      'stealth': 'stealth', 'acrobatics': 'acrobatics', 'sleight_of_hand': 'sleight_of_hand',
      'athletics': 'athletics', 'arcana': 'arcana', 'religion': 'religion',
      'medicine': 'medicine', 'survival': 'survival', 'animal_handling': 'animal_handling',
      'history': 'history', 'nature': 'nature', 'performance': 'performance',
      'conversation': 'persuasion', 'exploration': 'survival', 'divine_sense': 'perception',
      'disengage_combat': 'persuasion',
    }
    let skillCheckLine = ''
    const skillKey = ABILITY_TO_SKILL[chosen?.ability || '']
    if (skillKey && humanPC && gs.skillProficiencies.includes(skillKey)) {
      const check = performSkillCheck(humanPC, skillKey, 13, gs.skills)
      const skillLabel = skillKey.replace(/_/g, ' ')
      skillCheckLine = `\n\n⚠️ LOCAL SKILL CHECK: ${humanPC.name} rolled d20(${check.roll}) + ${check.modifier} ${skillLabel} = ${check.total} vs DC 13 → ${check.success ? '✅ SUCCESS' : '❌ FAILURE'}. USE THIS RESULT. Do NOT re-roll. Narrate the outcome accordingly.`
    }

    const freeTextBlock = isFreeTextAction ? `
⚠️ CUSTOM PLAYER ACTION: The player wrote their own action instead of selecting a preset option.\nInterpret their intent generously — this is their creative choice. Determine the appropriate skill check, ability roll, or reaction. Apply standard mechanics (d20 vs DC, damage, etc.) based on what makes narrative sense. Do NOT just narrate — MECHANICALLY RESOLVE their action like any other choice.\nStamina cost: 1 for observation/movement, 2 for combat, 3 for magical/complex actions.` : ''
    const userMsg = `TURN ${gs.turn} RESOLUTION.

Human player chose for ${toAscii(humanPC?.name || 'PC')}: "${toAscii(chosen?.action || 'acts')}"[${toAscii(chosen?.ability || '')}].${companionActionLine}
${chosen?.ability === 'disengage_combat' ? `\n⚠️ PARRY/DISENGAGE: The player is attempting to end combat through negotiation or retreat. Roll a Persuasion check. On success: narrate the enemies backing down, fleeing, or agreeing to talk. Include state_updates with {pc_id:"ENEMY", dead: true} for each enemy to remove them from active combat. On failure: enemies remain hostile but the player takes no damage this turn.` : ''}
${freeTextBlock}

RESOLVE THIS ACTION:
1. Execute ${toAscii(humanPC?.name || 'PC')}'s choice with full mechanical detail (d20 vs AC, damage, saves). ROLL DICE.${compChosen ? `\n2. Execute ${toAscii(companion?.name || 'Companion')}'s action with full mechanical detail too (d20 vs AC, damage, saves). ROLL DICE for both characters.` : ''}
${gs.act === ACTS.THREE ? `${compChosen ? '3' : '2'}. ${ant?.name} retaliates with Phase ${gs.antagonistPhase} ability.` : `${compChosen ? '3' : '2'}. Any active NPCs act per their alignment. The antagonist shadow grows.`}
${isRivalSummon ? `${compChosen ? '4' : '3'}. ⚡ ARCHRIVAL SUMMON EVENT: ${gs.antagonistRival?.name}, ${gs.antagonistRival?.title} has been SUMMONED by the shard to fight alongside the party!\n   - ${gs.antagonistRival?.name} is the mythological archrival of ${ant?.name}.\n   - They deal devastating damage to ${ant?.name} (narrate the legendary confrontation).\n   - The rival's ${gs.antagonistRival?.ability} turns the tide of battle.\n   - This is a CINEMATIC MOMENT — write it with maximum drama and Gaiman-style prose.\n   - Apply state_updates: ~35% of antagonist max HP as damage from the rival's assault.\n   - The rival does NOT join the party permanently — they deliver their blow and fade back into myth.` : `${compChosen ? '4' : '3'}. Apply dice rolls/damage for ALL actions. Signal injuries (injury_events).`}
${compChosen ? '5' : '4'}. ${compChosen ? `Full narrative prose covering BOTH characters' actions, then JSON payload. BOTH ${toAscii(humanPC?.name || 'PC')} and ${toAscii(companion?.name || 'Companion')} act this turn — describe their coordinated effort.` : 'Full narrative prose, then JSON payload.'}${skillCheckLine}`

    // Add user choice to conversation history
    const convEntries = [
      { role: 'user' as const, content: `${humanPC?.name}: ${isFreeTextAction ? `[Custom Action] ${chosen?.action || 'acts'}` : chosen?.action || 'acts'}` }
    ]
    if (compChosen && companion) {
      convEntries.push({ role: 'user' as const, content: `${companion.name}: ${compChosen.action}` })
    }
    setConversationHistory(prev => [
      ...prev,
      ...convEntries
    ].slice(-3)) // Keep last 3 exchanges (journey_so_far handles older context)

    try {
      // Tick injuries — collect all DOT damage first, then apply immutably
      const newInjuries = { ...gs.injuries }
      const dotDamage: { [pcId: string]: number } = {}
      Object.keys(newInjuries).forEach(pcId => {
        const pc = gs.pcs.find(p => p.id === pcId)
        newInjuries[pcId] = (newInjuries[pcId] || []).filter(inj => {
          const remaining = inj.turnsLeft - 1
          if (inj.modifier.dot && pc && !pc.dead) {
            const dotValue = typeof inj.modifier.dot === 'number' ? inj.modifier.dot : 0
            dotDamage[pcId] = (dotDamage[pcId] || 0) + dotValue
          }
          return remaining > 0
        })
        if (newInjuries[pcId].length === 0) delete newInjuries[pcId]
      })
      // Purge injury entries for dead PCs (orphaned from previous turns)
      for (const pcId of Object.keys(newInjuries)) {
        const pc = gs.pcs.find(p => p.id === pcId)
        if (pc?.dead) delete newInjuries[pcId]
      }
      // Apply DOT damage immutably — never mutate React state directly
      if (Object.keys(dotDamage).length > 0) {
        gs.pcs = gs.pcs.map(p => {
          const dmg = dotDamage[p.id]
          if (!dmg) return p
          const newHp = Math.max(0, p.hp + dmg)
          return { ...p, hp: newHp, dead: newHp <= 0 ? true : p.dead }
        })
        // P4.3 FIX: Handle DOT deaths with full Death Ward + prophecy chain
        for (const pc of gs.pcs) {
          if (pc.dead && pc.hp <= 0) {
            const wardResult = tryConsumeDeathWard(gs, pc.id, gs.turn)
            if (wardResult.warded) {
              gs = wardResult.gs as typeof gs
            } else {
              soundEvents.emit({ type: 'death' }); triggerScreenEffect('screen-effect-shake')
              gs = transferProphecyOnDeath(gs, pc.id, gs.turn) as typeof gs
            }
          }
        }
      }
      gs.injuries = newInjuries

      const res = await callDM(userMsg, gs, false)

      gs.turn++

      // ── ABILITY COOLDOWN: Decrement turns ────────────────────────────────
      const updatedCooldowns: typeof gs.abilityCooldowns = {}
      for (const [key, cd] of Object.entries(gs.abilityCooldowns)) {
        const remaining = cd.turnsLeft - 1
        if (remaining > 0) {
          updatedCooldowns[key] = { ...cd, turnsLeft: remaining }
        }
        // Remove expired cooldowns (turnsLeft <= 0)
      }
      gs.abilityCooldowns = updatedCooldowns

      let newGS = await applyMechanics(res, gs)
      newGS.humanPCId = res.human_pc_id || newGS.pcs.find(p => !p.dead)?.id || null

      // ═══════════════════════════════════════════════════════════════════════════
      // ARCHRIVAL SUMMON MECHANICAL EFFECTS
      // Applied AFTER applyMechanics so they stack with whatever the DM resolved
      // ═══════════════════════════════════════════════════════════════════════════
      if (isRivalSummon && newGS.antagonistRival) {
        const rival = newGS.antagonistRival
        const antName = ant?.name || 'The Antagonist'

        // Deal 35% of antagonist max HP as guaranteed damage
        const rivalDamage = Math.ceil(newGS.antagonistMaxHp * 0.35)
        newGS.antagonistHp = Math.max(0, newGS.antagonistHp - rivalDamage)

        // Heal all living PCs by 25% of their max HP
        const healAmounts: string[] = []
        newGS.pcs = newGS.pcs.map(pc => {
          if (pc.dead) return pc
          const heal = Math.ceil(pc.maxHp * 0.25)
          const actualHeal = Math.min(heal, pc.maxHp - pc.hp)
          if (actualHeal > 0) {
            healAmounts.push(`${pc.name.split(' ')[0]} +${actualHeal}`)
            return { ...pc, hp: pc.hp + actualHeal }
          }
          return pc
        })

        // Generate and store the Gaiman-style summon narration
        const summonNarration = generateRivalSummonNarration(rival, antName)
        newGS.log = [...newGS.log, {
          msg: `__RIVAL_SUMMON__:${JSON.stringify({ html: summonNarration })}`,
          type: 'rival_summon_narration',
          turn: newGS.turn
        }]

        // Log the mechanical effects
        newGS.log = [...newGS.log, {
          msg: `⚡ ${rival.name} deals ${rivalDamage} damage to ${antName}! ${healAmounts.length ? `Party healed: ${healAmounts.join(', ')}` : ''}`,
          type: 'combat',
          turn: newGS.turn
        }]

        // The rival has been summoned — clear the ability so it can't be used again
        newGS.antagonistRival = null

        // Boost success rate for this dramatic turn
        newGS.mythicalImpactBonus = (newGS.mythicalImpactBonus || 0) + 5

        toast({
          title: `⚡ ${rival.name} answers the call!`,
          description: `Dealt ${rivalDamage} damage to ${antName}. The archrival fades back into myth.`,
          duration: 5000
        })
      }

      // TEST OF FAITH — Check if this turn triggers a Test of Faith
      newGS = checkTestOfFaith(newGS, res)

      await renderResult(res, false, newGS)

      // TTS AUTO-SPEAK is DEFERRED — triggers after final setGameState (see below)

      // ── ACHIEVEMENT CHECK ───────────────────────────────────────────
      const damageThisTurn = (res.damage_dealt?.length || 0) > 0
      const critThisTurn = !!(res.dice_rolls || []).find(d => d.roll >= 20 && d.die?.includes('d20'))
      const newlyUnlocked = checkAchievements(
        achievementTrackerRef.current,
        newGS,
        prevGameStateRef.current,
        damageThisTurn,
        critThisTurn,
      )
      if (newlyUnlocked.length > 0) {
        setAchievementUnlocks(prev => [...prev, ...newlyUnlocked.map(id => ({ id, turn: newGS.turn }))])
      }
      prevGameStateRef.current = { ...newGS }

      // If Test of Faith triggered, pause here — don't generate next options
      if (newGS.pendingTestOfFaith) {
        newGS.isProcessing = false
        setGameState({ ...newGS })
        setStatusMessage('The shard demands a test of faith...')
        return
      }

      const living = newGS.pcs.filter(p => !p.dead)
      if (!living.length) {
        endCampaign(false, newGS)
        return
      }
      if (Number.isFinite(newGS.antagonistHp) && newGS.antagonistHp <= 0 && newGS.act === ACTS.THREE) {
        endCampaign(true, newGS)
        return
      }

      const nextPC = newGS.pcs.find(p => p.id === newGS.humanPCId && !p.dead) || living[0]
      if (nextPC) {
        const sceneCtx = `Act ${newGS.act}, Turn ${newGS.turn}. SUMMARY: ${newGS.storySummary}\nRECENT: ` + newGS.log.slice(0, 3).map(l => l.msg).join(' | ')
        const { pcOptions, compOptions, extraOptions } = buildDefaultOptions(nextPC, {
          pc_choices: res.pc_choices,
          companion_choices: res.companion_choices
        })
        newGS.humanOptions = [...pcOptions, ...extraOptions]
        newGS.companionOptions = compOptions
        newGS.waitingForHuman = true
        newGS.pendingHumanChoice = null
        newGS.pendingCompanionChoice = null
        newGS.isProcessing = false

        setGameState({ ...newGS })
        setStatusMessage(`YOUR TURN — ${nextPC.name}${compOptions.length > 0 ? ` + ${newGS.companionId ? newGS.pcs.find(p => p.id === newGS.companionId)?.name?.split(' ')[0] : 'Companion'}` : ''}`)
      } else {
        newGS.isProcessing = false
        setGameState({ ...newGS })
        setStatusMessage(`T${newGS.turn} done — ${living.length} alive`)
      }

      // TTS auto-speak removed from confirmChoice — only runTurn triggers auto-speak.
      // This prevents double-speaking the same narration (runTurn + confirmChoice racing).
    } catch (e) {
      gs.isProcessing = false
      setGameState(deepClone(gs))
      appendNarrative(`<div class="error-box" style="color:#cc3030;padding:1rem;border:1px solid #cc3030;border-radius:4px">Resolution Engine Halted — ${String(e)}</div>`)
      setStatusMessage('Error — refresh recommended')
    }
  }

  // ── ADVANCE TURN ───────────────────────────────────────────────────────
  const advanceTurn = async () => {
    if (gameState.ended || gameState.waitingForHuman || gameState.isProcessing || gameState.pendingTestOfFaith) return

    setGameState(prev => ({ ...prev, isProcessing: true, turn: prev.turn + 1 }))
    setStatusMessage(`Turn ${gameState.turn + 1} processing...`)
    await runTurn(false, { ...gameState, turn: gameState.turn + 1 })
  }

  // ── END CAMPAIGN ───────────────────────────────────────────────────────
  const endCampaign = (victory: boolean, gs: GameState) => {
    soundEvents.emit({ type: victory ? 'victory' : 'death' })
    const ant = getAntagonist(gs.antagonistId)
    const shard = gs.shardEntry
    const living = gs.pcs.filter(p => !p.dead)

    // Build achievement summary
    const tracker = achievementTrackerRef.current
    const unlockedCount = getUnlockedCount(tracker)
    const totalCount = getTotalCount()
    const unlockedDefs = ACHIEVEMENT_DEFS.filter(d => tracker.records[d.id]?.unlocked)
      .sort((a, b) => {
        const tierOrder: Record<string, number> = { bronze: 0, silver: 1, gold: 2, legendary: 3 }
        return (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9)
      })
    const achievementCards = unlockedDefs.length > 0
      ? unlockedDefs.slice(0, 12).map(def => {
          const tier = TIER_CONFIG[def.tier]
          return `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;border:1px solid ${tier.border};background:${tier.bg};margin:3px">
            <span style="font-size:16px">${def.icon}</span>
            <span style="font-size:11px;font-weight:700;color:${tier.color};font-family:Cinzel,serif">${def.name}</span>
          </div>`
        }).join('')
      : '<div style="color:#5a4d30;font-size:12px;padding:8px 0">No achievements unlocked this campaign.</div>'
    const moreCount = unlockedDefs.length - 12
    const moreText = moreCount > 0 ? `<div style="color:#8a7040;font-size:11px;margin-top:4px">+ ${moreCount} more achievement${moreCount > 1 ? 's' : ''}</div>` : ''

    const html = `<div style="text-align:center;padding:2.5rem;margin:1.5rem 0;border:2px solid ${victory ? '#5a4018' : '#8b0000'};background:${victory ? 'rgba(60,40,0,.15)' : 'rgba(60,0,0,.15)'};border-radius:6px">
      <div style="font-family:Cinzel Decorative,serif;font-size:1.3rem;color:${victory ? '#f0c860' : '#cc2020'};letter-spacing:.13em;margin-bottom:.8rem">
        ${victory ? `${ant?.name || 'THE FOE'} IS DEFEATED` : 'THE LAST CHAMPION FALLS'}
      </div>
      <div style="font-size:.95rem;color:#e8d9b0;line-height:1.9;max-width:550px;margin:0 auto">
        ${victory
        ? `${ant?.name} is vanquished. The mythworld breathes. ${living.length} remain, carrying the weight of what they survived. And ${shard?.name}... it is quiet now.`
        : `The last defender falls. ${ant?.name} stands in the silence. The myths that should have stopped them lie broken. And ${shard?.name} waits, patient, for whoever comes next.`}
      </div>
      <div style="margin-top:.8rem;font-size:.7rem;color:#5a4d30">
        ${gs.turn} turns · ${gs.npcHistory.length} gods encountered · ${gs.pcs.filter(p => p.dead).length} fallen
      </div>
      ${unlockedDefs.length > 0 ? `
      <div style="margin-top:1.2rem;padding-top:1rem;border-top:1px solid #2e2008">
        <div style="font-family:Cinzel,serif;font-size:.85rem;color:#d4af37;letter-spacing:.1em;margin-bottom:.6rem">
          🏆 ACHIEVEMENTS UNLOCKED · ${unlockedCount}/${totalCount}
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;max-width:600px;margin:0 auto">
          ${achievementCards}
        </div>
        ${moreText}
      </div>` : ''}
    </div>`

    appendNarrative(html)
    setGameState(prev => ({ ...prev, ended: true }))
    setStatusMessage(victory ? 'Victory.' : 'The myths die.')
  }

  // v2.19.0: Ask the Tear — spend Shard Insight charge
  const invokeShard = () => {
    if (gameState.shardInsightUsed || gameState.shardCharges <= 0 || gameState.shardDark) return

    const question = shardSummonName.trim() || 'What do you see?'
    const newGS = {
      ...gameState,
      pendingShardQuestion: question,
    }
    setGameState(newGS)
    setShardDialogOpen(false)
    setShardSummonName('')

    appendNarrative(`<div style="font-size:.95rem;background:linear-gradient(90deg,rgba(60,0,100,.15),rgba(10,0,20,.1));border:1px solid rgba(100,60,180,.3);border-radius:3px;padding:10px 14px;line-height:1.7;font-style:italic;color:${gameState.shardEntry?.color || '#c080ff'}">
      🔮 You press your palm against the ${gameState.shardEntry?.name || 'shard'}. The question forms in your mind: <strong>"${toAscii(question)}"</strong> — The shard trembles, remembering. Its answer will come in the next breath of the world.
    </div>`)
  }

  // ── USE ITEM ───────────────────────────────────────────────────────────
  const handleUseItem = (item: Item) => {
    if (gameState.waitingForHuman || gameState.isProcessing) return

    const targetPC = gameState.pcs.find(p => p.id === gameState.humanPCId && !p.dead) || gameState.pcs.find(p => !p.dead)
    if (!targetPC) return

    let newGS = { ...gameState }

    // Apply item effect immutably — never mutate original state objects
    if (item.modifier?.healing) {
      const healAmount = typeof item.modifier.healing === 'number' ? item.modifier.healing : rollDice(2, 8) + 4
      newGS.pcs = newGS.pcs.map(p => {
        if (p.id !== targetPC.id) return p
        return { ...p, hp: Math.min(p.maxHp, p.hp + healAmount) }
      })
      toast({ title: `${item.name} Used`, description: `${targetPC.name} healed for ${healAmount} HP` })
      triggerCombatFlash('heal')
    }

    if (item.modifier?.full_heal) {
      newGS.pcs = newGS.pcs.map(p => {
        if (p.id !== targetPC.id) return p
        return { ...p, hp: p.maxHp }
      })
      const cleanInjuries = { ...newGS.injuries }
      delete cleanInjuries[targetPC.id]
      newGS.injuries = cleanInjuries
      toast({ title: `${item.name} Used`, description: `${targetPC.name} fully restored!` })
      triggerCombatFlash('heal')
    }

    // Cure poison injuries
    if (item.modifier?.cure_poison) {
      const pcInjuries = newGS.injuries[targetPC.id]
      if (pcInjuries && pcInjuries.length > 0) {
        const poisoned = pcInjuries.filter(inj => inj.type === 'poison')
        const remaining = pcInjuries.filter(inj => inj.type !== 'poison')
        if (poisoned.length > 0) {
          const cleanedInjuries = { ...newGS.injuries }
          if (remaining.length === 0) {
            delete cleanedInjuries[targetPC.id]
          } else {
            cleanedInjuries[targetPC.id] = remaining
          }
          newGS.injuries = cleanedInjuries
          toast({ title: `${item.name} Used`, description: `Cured ${poisoned.length} poison injur${poisoned.length > 1 ? 'ies' : 'y'} on ${targetPC.name}` })
        } else {
          toast({ title: `${item.name} Used`, description: `${targetPC.name} has no poison injuries` })
        }
      } else {
        toast({ title: `${item.name} Used`, description: `${targetPC.name} has no injuries` })
      }
    }

    // Cure all poison and psionic injuries
    if (item.modifier?.cure_all_poison) {
      const pcInjuries = newGS.injuries[targetPC.id]
      if (pcInjuries && pcInjuries.length > 0) {
        const curable = pcInjuries.filter(inj => inj.type === 'poison' || inj.type === 'psionic')
        const remaining = pcInjuries.filter(inj => inj.type !== 'poison' && inj.type !== 'psionic')
        const cleanedInjuries = { ...newGS.injuries }
        if (curable.length > 0) {
          if (remaining.length === 0) {
            delete cleanedInjuries[targetPC.id]
          } else {
            cleanedInjuries[targetPC.id] = remaining
          }
          newGS.injuries = cleanedInjuries
          toast({ title: `${item.name} Used`, description: `Cured ${curable.length} poison/psionic injur${curable.length > 1 ? 'ies' : 'y'} on ${targetPC.name}` })
        } else {
          toast({ title: `${item.name} Used`, description: `${targetPC.name} has no curable injuries` })
        }
      } else {
        toast({ title: `${item.name} Used`, description: `${targetPC.name} has no injuries` })
      }
    }

    // Death ward — grants a one-time death protection condition
    if (item.modifier?.death_ward) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Death Ward')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Death Ward'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} is warded against death!` })
      } else {
        toast({ title: `${item.name} Used`, description: `${targetPC.name} already has Death Ward` })
      }
    }

    // Invisibility — grants invisible condition
    if (item.modifier?.invisible) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Invisible')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Invisible'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} vanishes from sight!` })
      }
    }

    // Potion of Giant Strength — set STR
    if (item.modifier?.str_set) {
      newGS.pcs = newGS.pcs.map(p => {
        if (p.id !== targetPC.id) return p
        return { ...p, str: `${item.modifier!.str_set}/00` }
      })
      toast({ title: `${item.name} Used`, description: `${targetPC.name}'s STR surges to 18/00!` })
    }

    // Elixir of Heroism — +2 to all saves
    if (item.modifier?.all_saves) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Heroism')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Heroism'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} radiates heroic confidence!` })
      }
    }

    // Protection scroll — +AC condition
    if (item.modifier?.protection) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Protection')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Protection'] }
        })
        toast({ title: `${item.name} Used`, description: `A holy barrier surrounds ${targetPC.name}!` })
      }
    }

    // Undead ward — grants condition
    if (item.modifier?.undead_ward) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Undead Ward')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Undead Ward'] }
        })
        toast({ title: `${item.name} Used`, description: `Undead recoil from ${targetPC.name}!` })
      }
    }

    // True sight — grants condition
    if (item.modifier?.true_sight) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('True Sight')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'True Sight'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} sees through all illusions!` })
      }
    }

    // Regen — heal per turn (grant condition, DOT engine checks for it)
    if (item.modifier?.regen) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Regeneration')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Regeneration'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} begins to regenerate!` })
      }
    }

    // Fear immune — grants condition
    if (item.modifier?.fear_immune) {
      const currentConditions = targetPC.conditions || []
      if (!currentConditions.includes('Fearless')) {
        newGS.pcs = newGS.pcs.map(p => {
          if (p.id !== targetPC.id) return p
          return { ...p, conditions: [...currentConditions, 'Fearless'] }
        })
        toast({ title: `${item.name} Used`, description: `${targetPC.name} stands fearless!` })
      }
    }

    // If no modifier was handled, show info for passive equipment
    if (!item.modifier?.healing && !item.modifier?.full_heal &&
        !item.modifier?.cure_poison && !item.modifier?.cure_all_poison &&
        !item.modifier?.death_ward && !item.modifier?.invisible &&
        !item.modifier?.str_set && !item.modifier?.all_saves &&
        !item.modifier?.protection && !item.modifier?.undead_ward &&
        !item.modifier?.true_sight && !item.modifier?.regen &&
        !item.modifier?.fear_immune) {
      toast({ title: `${item.name}`, description: 'This item provides passive bonuses and cannot be actively used.' })
    }

    // Remove or reduce item immutably
    if (item.charges && item.charges > 1) {
      newGS.inventory = newGS.inventory.map(i => {
        if (i.id !== item.id) return i
        return { ...i, charges: (i.charges || 1) - 1 }
      })
    } else {
      newGS.inventory = newGS.inventory.filter(i => i.id !== item.id)
    }

    setGameState(newGS)
    setShowInventoryDialog(false)
  }

  // ── EXPORT CHRONICLE ──────────────────────────────────────────────────
  // Clean, formatted story export — no AI, no dice, no mechanics.
  // Groups narration by act, strips HTML, adds chapter headings from player choices.
  const exportStory = () => {
    const gs = gameState
    if (!gs) return
    const heroName = gs.pcs[0]?.name || 'The Wanderer'
    const antName = getAntagonist(gs.antagonistId)?.name || 'The Forgotten One'
    const victory = gs.ended === true
    const defeat = gs.ended === false

    // Strip HTML, clean whitespace
    const clean = (html: string) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

    // Group narrative by acts
    const actNames: Record<string, string> = { act1: 'The Gathering', act2: 'Rising Tension', act3: 'The Final Test' }
    const sections: string[] = []

    // Build chronicle
    sections.push(`${'═'.repeat(60)}`)
    sections.push(`  THE CHRONICLE OF ${heroName.toUpperCase()}`)
    sections.push(`  ${victory ? '— Victory —' : defeat ? '— Defeat —' : '— An Ongoing Tale —'}`)
    sections.push(`${'═'.repeat(60)}`)
    sections.push('')

    // Build player choice timeline from consequenceState
    const choices = consequenceState.choices || []
    const choiceByTurn: Record<number, string> = {}
    choices.forEach((c: any) => {
      choiceByTurn[c.turn] = c.chosen
    })

    // Narrative entries
    const entries = narrativeContent.map(n => clean(n.html)).filter(t => t.length > 20)

    let currentAct = ''
    let turnCounter = 0
    entries.forEach((text, idx) => {
      // Approximate turn number (entries are sequential)
      turnCounter++
      const act = idx < entries.length * 0.4 ? 'act1' : idx < entries.length * 0.75 ? 'act2' : 'act3'
      const actLabel = actNames[act] || act

      if (actLabel !== currentAct) {
        sections.push('')
        sections.push(`${'─'.repeat(40)}`)
        sections.push(`  ACT ${act === 'act1' ? 'I' : act === 'act2' ? 'II' : 'III'}: ${actLabel.toUpperCase()}`)
        sections.push(`${'─'.repeat(40)}`)
        sections.push('')
        currentAct = actLabel
      }

      // Show player's choice as a chapter heading if available
      const choice = choiceByTurn[turnCounter]
      if (choice) {
        sections.push(`  ❖ "${choice}"`)
        sections.push('')
      }

      // Wrap narration in readable paragraphs
      const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 10)
      paragraphs.forEach(p => {
        sections.push(`  ${p}`)
      })
      sections.push('')
    })

    // Epilogue
    if (victory) {
      sections.push(`${'─'.repeat(40)}`)
      sections.push(`  EPILOGUE`)
      sections.push(`${'─'.repeat(40)}`)
      sections.push('')
      sections.push(`  And so it was that ${heroName} stood where gods had fallen,`)
      sections.push(`  and the world remembered. The shard grew quiet — not silent,`)
      sections.push(`  but patient. Waiting, as it always had, for the next hand`)
      sections.push(`  brave enough, or foolish enough, to reach into the dark.`)
      sections.push('')
    } else if (defeat) {
      sections.push(`${'─'.repeat(40)}`)
      sections.push(`  EPILOGUE`)
      sections.push(`${'─'.repeat(40)}`)
      sections.push('')
      sections.push(`  ${heroName} fell, as all mortals must. The shard dimmed,`)
      sections.push(`  then waited. Somewhere, in the space between breaths,`)
      sections.push(`  it began to hum again — for there is always another seeker.`)
      sections.push('')
    }

    // Campaign stats
    const totalTurns = gs.turn || turnCounter
    const godsMet = gs.encounteredIds?.length || 0
    sections.push(`${'═'.repeat(60)}`)
    sections.push(`  Campaign: ${totalTurns} turns | Beings encountered: ${godsMet}`)
    sections.push(`  ${heroName} ${victory ? 'triumphed over' : defeat ? `fell to` : 'faces'} ${antName}`)
    sections.push(`${'═'.repeat(60)}`)

    const chronicle = sections.join('\n')
    const blob = new Blob([chronicle], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const status = victory ? 'victory' : defeat ? 'defeat' : `turn${totalTurns}`
    a.download = `chronicle_of_${heroName.toLowerCase().replace(/\s+/g, '_')}_${status}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Chronicle Exported', description: `The tale of ${heroName} has been preserved.` })
  }

  return {
    // ── STATE ──────────────────────────────────────────────────────────────
    gameState, setGameState,
    openrouterKey, setOpenrouterKey,
    aiProvider, setAiProvider,
    engineMode, setEngineMode,
    lmStudioUrl, setLmStudioUrl,
    lmStudioModel, setLmStudioModel,
    comicMode, setComicMode,
    comicPanels, setComicPanels,
    comicArtStyle, setComicArtStyle,
    gamePhase, setGamePhase,
    availableHeroes, setAvailableHeroes,
    selectedParty, setSelectedParty,
    previewHero, setPreviewHero,
    saveSlots, setSaveSlots,
    showSaveDialog, setShowSaveDialog,
    showLoadDialog, setShowLoadDialog,
    showInventoryDialog, setShowInventoryDialog,
    showQuestDialog, setShowQuestDialog,
    activeTab, setActiveTab,
    expandedPC, setExpandedPC,
    expandedNPC, setExpandedNPC,
    narrativeContent, setNarrativeContent,
    diceAnimation, setDiceAnimation,
    shardDialogOpen, setShardDialogOpen,
    shardSummonName, setShardSummonName,
    sidebarOpen, setSidebarOpen,
    statusMessage, setStatusMessage,
    lastDMNarrative, setLastDMNarrative,
    diceRollsForDisplay,
    lastTurnReadyTime, setLastTurnReadyTime,
    portraitModalOpen, setPortraitModalOpen,
    selectedPortrait, setSelectedPortrait,
    conversationHistory, setConversationHistory,
    ttsEnabled, setTtsEnabled,
    ttsVoice, setTtsVoice,
    ttsEngine, setTtsEngine,
    browserVoices, browserVoiceName, setBrowserVoiceName,
    ttsSpeed, setTtsSpeed,
    currentSpeechSentenceIndex,
    isSpeaking, setIsSpeaking,
    audioCache, setAudioCache,
    displayedNarrative, setDisplayedNarrative,
    tokenUsage, setTokenUsage,
    combatState, setCombatState,
    combatOverlayMinimized, setCombatOverlayMinimized,
    questJournal, setQuestJournal,
    consequenceState, setConsequenceState,
    rippleEcho,
    quickeningState, setQuickeningState,
    // ── REFS ───────────────────────────────────────────────────────────────
    narrRef,
    abortSpeakRef,
    // ── FUNCTIONS ──────────────────────────────────────────────────────────
    loadSaveSlots,
    saveGame,
    loadGame,
    deleteSave,
    splitTextIntoChunks,
    speakText,
    stopSpeaking,
    speakNarrative,
    unlockTTS,
    triggerPendingTTSFromUserGesture,
    fetchAvailableHeroes,
    startNewCampaign,
    confirmPartySelection,
    buildDMSystem,
    callOpenRouterDM,
    // callGeminiDM removed — Gemini is no longer used as DM provider
    parseDMResponse,
    parseCombatData,
    parseQuestData,
    parseConsequenceData,
    parseQuickeningData,
    handlePowerChosen,
    dismissQuickening,
    shouldTriggerQuickening,
    getPowerOptions,
    computeLegendTitle,
    // getTemplateFallback removed (deprecated)
    buildDefaultOptions,
    applyMechanics,
    runTurn,
    renderResult,
    appendNarrative,
    selectOption,
    selectCompanionOption,
    confirmChoice,
    advanceTurn,
    endCampaign,
    invokeShard,
    handleUseItem,
    exportStory,
    resolveTestOfFaith,
    updateTokenUsage,
    // Combat Flash
    combatFlashType,
    // Achievement System
    achievementTracker: achievementTrackerRef.current,
    achievementUnlocks,
    showAchievementsDialog,
    setShowAchievementsDialog,
  }
}