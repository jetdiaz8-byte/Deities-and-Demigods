'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  ProphecyState, Ability, Item, Quest, Injury, Entity, ShardEvent, DiceRoll, DamageDealt,
  StateUpdate, DMResponse, GameOption, SaveSlot, GameState, AntagonistClue, SuccessRateFactors,
  GreaterGodData, ShardType, InjuryTemplate
} from '@/lib/gameTypes'
import { ACTS } from '@/lib/gameTypes'
import { SHARD_NAMES, INJURY_TABLE, ITEM_TEMPLATES, ANTAGONIST_CLUES } from '@/lib/gameConstants'
import { createInitialState } from '@/lib/gameState'
import { toAscii, hpCls, rollDice, sleep, getNPCCategory, getAntagonist, generateId, calculateSuccessRate, calculateAlignmentHarmony, lookupEntity } from '@/lib/gameHelpers'
import { getRandomHeroes } from '@/lib/fallbackEntities'
import { KRYNN_HEROES, KRYNN_DEMIGODS } from '@/lib/krynnCharacters'
import { PROPHECIES, rollProphecies, getProphecyById, Prophecy } from '@/lib/prophecyData'
import { rollAntagonist, getAntagonistById, getAntagonistRival, generateBanishmentNarration, generateRivalSummonNarration, AntagonistCandidate, AntagonistRival } from '@/lib/antagonistPool'
import { toast } from '@/hooks/use-toast'
import type { CharacterPortrait } from '@/components/game/PortraitModal'
import { soundEvents } from '@/lib/soundEvents'
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

export function useGameEngine() {

  const [gameState, setGameState] = useState<GameState>(createInitialState())
  const [geminiKey, setGeminiKey] = useState('')
  const [groqKey, setGroqKey] = useState('')
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
  const [diceAnimation, setDiceAnimation] = useState<{ value: number; spinning: boolean } | null>(null)
  const [shardDialogOpen, setShardDialogOpen] = useState(false)
  const [shardSummonName, setShardSummonName] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Awaiting the gods...')
  const [lastDMNarrative, setLastDMNarrative] = useState('')
  const [actionQueue, setActionQueue] = useState(Promise.resolve())
  // Portrait Modal State
  const [portraitModalOpen, setPortraitModalOpen] = useState(false)
  const [selectedPortrait, setSelectedPortrait] = useState<CharacterPortrait | null>(null)
  // Conversation History for persistent DM memory
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  // TTS State - Mellow DM Storyteller Voice
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [ttsVoice, setTtsVoice] = useState('guy') // Edge TTS - GuyNeural for DM narration
  const [ttsSpeed, setTtsSpeed] = useState(0.9) // Slightly slower for dramatic storytelling
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map())
  // Store the exact displayed narrative text for TTS
  const [displayedNarrative, setDisplayedNarrative] = useState('')
  
  // Achievement System State
  const achievementTrackerRef = useRef<AchievementTracker>(createAchievementTracker())
  const [achievementUnlocks, setAchievementUnlocks] = useState<Array<{ id: string; turn: number }>>([])
  const [showAchievementsDialog, setShowAchievementsDialog] = useState(false)
  const prevGameStateRef = useRef<GameState | null>(null)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN OPTIMIZATION FEATURES
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Token Tracking State
  const [tokenUsage, setTokenUsage] = useState({
    gemini: { input: 0, output: 0, total: 0 },
    groq: { input: 0, output: 0, total: 0 },
    lastCall: { api: '', input: 0, output: 0 }
  })
  
  // Request Throttling State
  const [throttleState, setThrottleState] = useState({
    lastRequestTime: 0,
    minInterval: 3000, // 3 seconds minimum between API calls
    isThrottled: false,
    cooldownRemaining: 0
  })
  
  // Smart Caching for Groq Options
  const optionsCacheRef = useRef<Map<string, { options: GameOption[], timestamp: number, pcId: string }>>(new Map())
  const CACHE_TTL = 60000 // 1 minute cache TTL
  
  // Throttling helper
  const waitForThrottle = async (): Promise<void> => {
    const now = Date.now()
    const timeSinceLastRequest = now - throttleState.lastRequestTime
    const waitTime = Math.max(0, throttleState.minInterval - timeSinceLastRequest)
    
    if (waitTime > 0) {
      setThrottleState(prev => ({ ...prev, isThrottled: true, cooldownRemaining: Math.ceil(waitTime / 1000) }))
      setStatusMessage(`Cooling down... ${Math.ceil(waitTime / 1000)}s`)
      await sleep(waitTime)
    }
    
    setThrottleState(prev => ({ ...prev, lastRequestTime: Date.now(), isThrottled: false, cooldownRemaining: 0 }))
  }
  
  // Token estimation helper (rough approximation: 1 token ≈ 4 characters)
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }
  
  // Update token usage tracking
  const updateTokenUsage = (api: 'gemini' | 'groq', inputText: string, outputText: string) => {
    const inputTokens = estimateTokens(inputText)
    const outputTokens = estimateTokens(outputText)
    
    setTokenUsage(prev => ({
      ...prev,
      [api]: {
        input: prev[api].input + inputTokens,
        output: prev[api].output + outputTokens,
        total: prev[api].total + inputTokens + outputTokens
      },
      lastCall: { api, input: inputTokens, output: outputTokens }
    }))
    
    // Also update game state for persistence
    if (api === 'gemini') {
      setGameState(prev => ({
        ...prev,
        geminiTokensUsed: prev.geminiTokensUsed + inputTokens + outputTokens
      }))
    } else {
      setGameState(prev => ({
        ...prev,
        groqTokensUsed: prev.groqTokensUsed + inputTokens + outputTokens
      }))
    }
  }

  const narrRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // ── LOAD KEYS FROM STORAGE ─────────────────────────────────────────────
  useEffect(() => {
    const savedGemini = localStorage.getItem('mythworld_gemini') || ''
    const savedGroq = localStorage.getItem('mythworld_groq') || ''
    setGeminiKey(savedGemini)
    setGroqKey(savedGroq)
    loadSaveSlots()
  }, [])

  // ── SAVE KEYS TO STORAGE ───────────────────────────────────────────────
  useEffect(() => {
    if (geminiKey) localStorage.setItem('mythworld_gemini', geminiKey)
  }, [geminiKey])

  useEffect(() => {
    if (groqKey) localStorage.setItem('mythworld_groq', groqKey)
  }, [groqKey])

  // ── AUTO SCROLL ────────────────────────────────────────────────────────
  useEffect(() => {
    if (narrRef.current) {
      narrRef.current.scrollTop = narrRef.current.scrollHeight
    }
  }, [narrativeContent])

  // ── SAVE/LOAD FUNCTIONS ────────────────────────────────────────────────
  const loadSaveSlots = () => {
    const slots: SaveSlot[] = []
    for (let i = 0; i < 5; i++) {
      const data = localStorage.getItem(`mythworld_save_${i}`)
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

  const saveGame = (slotId: string, name: string) => {
    const slotNum = parseInt(slotId.split('_')[1] || '0')
    const saveData = {
      name,
      timestamp: Date.now(),
      gameState,
      conversationHistory: conversationHistory.slice(-20),
      ttsSettings: { enabled: ttsEnabled, voice: ttsVoice, speed: ttsSpeed },
      achievementTracker: serializeTracker(achievementTrackerRef.current),
    }
    localStorage.setItem(`mythworld_save_${slotNum}`, JSON.stringify(saveData))
    loadSaveSlots()
    toast({ title: 'Game Saved', description: `Saved to ${name}` })
    setShowSaveDialog(false)
  }

  const loadGame = (slotId: string) => {
    const slotNum = parseInt(slotId.split('_')[1] || '0')
    const data = localStorage.getItem(`mythworld_save_${slotNum}`)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setGameState({ ...createInitialState(), ...parsed.gameState })
        setGamePhase('playing')
        setNarrativeContent([])
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
            setAchievementUnlocks(prev => [...prev, ...unlockedIds.map(id => ({ id, turn: restored.records[id]?.unlockedAt || 0 }))])
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
    localStorage.removeItem(`mythworld_save_${slotNum}`)
    loadSaveSlots()
    toast({ title: 'Save Deleted' })
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

  // Edge TTS - Microsoft Neural Voices (FREE, unlimited)
  // Reads the EXACT displayed narrative text for perfect sync
  const speakText = async (text: string, voice?: string) => {
    if (!text || isSpeaking) return
    
    setIsSpeaking(true)
    setStatusMessage('Generating voice...')
    
    try {
      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Split long text into chunks (Edge TTS handles ~5K chars well)
      const chunks = splitTextIntoChunks(text, 2000)
      const selectedVoice = voice || ttsVoice
      
      // Process each chunk sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (!chunk.trim()) continue
        
        setStatusMessage(`Speaking... (${i + 1}/${chunks.length})`)
        
        // Call Edge TTS API
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chunk,
            voice: selectedVoice,
            rate: '-15%' // Slower for dramatic storytelling
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'TTS generation failed')
        }
        
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Play audio
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl)
          audioRef.current = audio
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl)
            reject(new Error('Audio playback failed'))
          }
          
          audio.play().catch(reject)
        })
      }
      
      setStatusMessage('Ready')
    } catch (error) {
      console.error('TTS Error:', error)
      toast({ title: 'Voice Error', description: error instanceof Error ? error.message : 'Failed to generate speech', variant: 'destructive' })
      setStatusMessage('Voice error')
    } finally {
      setIsSpeaking(false)
      audioRef.current = null
    }
  }

  const stopSpeaking = () => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
    setStatusMessage('Ready')
  }

  const speakNarrative = () => {
    // Use the EXACT displayed narrative text for TTS sync
    // This ensures TTS reads exactly what's shown on screen
    const textToSpeak = displayedNarrative || lastDMNarrative
    if (textToSpeak) {
      speakText(textToSpeak)
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
          const existingIds = new Set(validHeroes.map(e => e.id))
          const krynnOnly = krynnEntities.filter(k => !existingIds.has(k.id))
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
    
    setAvailableHeroes(validHeroes)
    setStatusMessage('Heroes assembled. Choose your party.')
  }

  // ── START NEW CAMPAIGN ─────────────────────────────────────────────────
  const startNewCampaign = async () => {
    if (!geminiKey) {
      toast({ title: 'API Key Required', description: 'Enter your Gemini API key to begin', variant: 'destructive' })
      return
    }
    await fetchAvailableHeroes()
    setGamePhase('party_select')
  }

  // ── CONFIRM PARTY SELECTION ────────────────────────────────────────────
  const confirmPartySelection = async () => {
    if (selectedParty.length !== 1) {
      toast({ title: 'Choose Your Fate', description: 'Select exactly one hero to be your character in this story.', variant: 'destructive' })
      return
    }

    const mainPC = availableHeroes.find(h => h.id === selectedParty[0])
    if (!mainPC) return

    const shard = SHARD_NAMES[Math.floor(Math.random() * SHARD_NAMES.length)]

    // Roll antagonist from antagonist pool (Greater Gods + Super Monsters)
    const antagonist = rollAntagonist()

    // Roll prophecy for main PC only
    const rolledProphecies = rollProphecies(1)
    const prophecyStates: ProphecyState[] = [{
      prophecyId: rolledProphecies[0].id,
      riddle: rolledProphecies[0].riddle,
      pc_id: mainPC.id,
      previous_holders: [],
      state: 'dormant' as const
    }]

    // ═══════════════════════════════════════════════════════════════════════════
    // DM AUTO-SELECT: Companion + NPC Pools
    // ═══════════════════════════════════════════════════════════════════════════
    const remaining = availableHeroes.filter(e => e.id !== mainPC.id)

    // Shuffle all remaining for true RNG
    const shuffled = remaining.sort(() => Math.random() - 0.5)

    // DM selects 1 companion (hero or demigod, 70-100% story presence)
    const companionPool = shuffled.filter(e => e.type === 'hero' || e.type === 'demigod')
    const companion = companionPool.length > 0 ? companionPool[Math.floor(Math.random() * companionPool.length)] : null

    // DM selects 3 hero NPCs for random encounters
    const heroNPCs = shuffled
      .filter(e => e.type === 'hero' && (!companion || e.id !== companion.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // DM selects 3 demigod NPCs for random encounters
    const demigodNPCs = shuffled
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
      shardCharges: 2,       // Start with 2 shard charges
      shardSummoned: 0,      // No gods summoned yet
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
      act2StartTurn: 0,
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
      companionMood: 'loyal'
    }

    setGameState(newGameState)
    setGamePhase('playing')
    setNarrativeContent([])

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
    soundEvents.emit({ type: 'ambient_start', act: 'act1' })
    // Reset achievement tracker for new campaign
    achievementTrackerRef.current = createAchievementTracker()
    setAchievementUnlocks([])
    prevGameStateRef.current = null

    // Run first turn
    setStatusMessage('Opening scene loading...')
    await runTurn(true, newGameState)
  }

  // ── BUILD DM SYSTEM PROMPT ─────────────────────────────────────────────
  const buildDMSystem = (gs: GameState, includeHistory: boolean = true): string => {
    const ant = getAntagonist(gs.antagonistId)
    const living = gs.pcs.filter(p => !p.dead)
    const shard = gs.shardEntry
    const phase = gs.antagonistPhase

    const partyState = living.map(pc => {
      const injs = (gs.injuries[pc.id] || []).map(i => `${i.icon}${i.name}(${i.turnsLeft}t)`).join(' ')
      return `ID:"${pc.id}" | ${pc.name}[${pc.align.slice(0, 2)}|HP:${pc.hp}/${pc.maxHp}|AC:${pc.AC}${injs ? ' |' + injs : ''}] ${toAscii(pc.personality || '').slice(0, 40)}`
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

CRITICAL RULES:
1. DDG rulebook ONLY. Never invent stats.
2. NPC actions governed strictly by alignment+personality.
3. NARRATION STYLE — NEIL GAIMAN (CRITICAL - WRITE FULLY):
   - OPENING SCENE (Turn 0): Write 4-6 paragraphs of RICH, ATMOSPHERIC prose (600-1000 words)
   - REGULAR TURNS: Write 3-5 RICH, EVOCATIVE paragraphs (400-600 words MINIMUM)
   - NEVER truncate or abbreviate your narration - write complete, full prose
   - Write like Neil Gaiman in "American Gods" or "Norse Mythology" — lush, layered, deliberate
   - Be mythic, poetic, dark — like a fairy tale for adults
   - Use specific sensory language: the taste of copper, the weight of shadows, the whisper of old gods
   - Paint scenes with words: describe the quality of light, the texture of stone, the smell of ancient air
   - Every scene should feel ancient and dangerous
   - Foreshadow doom, hint at larger mythic forces
   - End each narration with tension or a pivotal moment
   - MINIMUM 300 WORDS per narration - this is MANDATORY
   - Include dialogue, internal thoughts, environmental details
   - Reference past events and build on previous narrative threads
4. Permadeath. No stat/alignment changes mid-game.
5. PCs=Heroes/Demigods (including Krynn). NPCs=Lesser/Greater Gods (including Krynn gods).
6. Gods avoid direct combat. WIS>15=cannot be deceived. Ancient enmities override all.
7. In Act I and II, DO NOT include the Antagonist in the "npc_encounters" array.
8. Occasionally drop items into "item_drops" array for the party inventory.
9. **ALL PCs ARE HUMAN-CONTROLLED** - You are the DM only. Provide 3-4 action OPTIONS for the current PC, then WAIT for the human player to choose. NEVER auto-resolve PC actions.
10. **PERSISTENT MEMORY** - Remember ALL previous events, decisions, and their consequences. Reference past events when narrating.
11. **THE SHARD IS CENTRAL** - The shard is the heart of this story:
    - The shard CHOSE the main PC. This is not coincidence—it is destiny.
    - Reference the shard's origin and nature constantly—it shapes everything
    - The shard whispers to its bearer, shows visions, demands attention
    - The shard's pantheon affinity affects which gods are drawn to the party
    - When the main PC speaks, the shard may pulse, warm, or cool in response
    - The shard knows the prophecy—it contained the prophecy before the PC was born
    - The shard is NOT a tool. It is a character with its own agenda
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
14. **RNG PARTY SYSTEM** - During Act II, you may introduce additional allies:
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
${journeySection}${historySection}
═══════════════════════════════════════════════════════════════════════════
THE SHARD — ${shard?.name} [${shard?.pantheon || 'Unknown'} Pantheon]
═══════════════════════════════════════════════════════════════════════════
${toAscii(shard?.origin || '')}
Power: ${shard?.power || 'Unknown'}
Charges: ${gs.shardCharges}/2 | Summoned: ${gs.shardSummoned.join(',') || 'none'}
${gs.pendingShardSummon ? `PENDING: summon "${gs.pendingShardSummon}" with d20 roll DC10.\n` : ''}${actCtx}
Turn: ${gs.turn} | Act I Limit: ${gs.act1TurnLimit} | Act II Duration: ${gs.act2TurnLimit}

═══════════════════════════════════════════════════════════════════════════
THE MAIN PC — CHOSEN BY THE SHARD
═══════════════════════════════════════════════════════════════════════════
${mainPC ? `${mainPC.name} [${mainPC.pantheon}] [${mainPC.align}] carries the prophecy directly through the shard.
The shard chose them. They cannot escape this destiny.
Personality: ${toAscii(mainPC.personality || '').slice(0, 60)}` : 'No main PC yet'}

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

OUTPUT: First, write the narrative prose. Then, append the JSON block:
{"story_summary":"string (1-3 paragraphs)","journey_so_far":"string (COMPLETE updated TLDR of entire journey so far - append new events to previous summary, keep under 150 words total)","dm_narration":"string (the prose you wrote - 300+ words)","human_pc_id":"id|null","human_pc_reason":"string (why this PC should act next)","npc_encounters":[{"npc_id":"string","npc_name":"string","encounter_type":"ENEMY/ALLY/BOSS","behavior":"string","pantheon":"string"}],"dice_rolls":[{"roller":"string","die":"d20","roll":0,"dc":0,"success":true,"notes":"string"}],"damage_dealt":[{"from":"string","to":"string","amount":0,"type":"string"}],"injury_events":[{"pc_id":"string","injury_id":"string|null","description":"string"}],"state_updates":[{"pc_id":"string|ANTAGONIST","hp_delta":0,"new_condition":null,"remove_condition":null,"dead":false}],"new_active_npcs":["id"],"shard_event":{"invoked":false,"invoker_pc_id":null,"intended_god":"string|null","roll":0,"success":false,"summoned_id":"string|null","summoned_name":"string|null","is_greater":false},"next_pc_id":"string|null","pc_agreement":{"pc_id":"agreed/refused/undecided"},"boss_phase_trigger":false,"consequences":"string","tension_note":"string","item_drops":[{"id":"string","name":"string","type":"artifact|potion|equipment|scroll","rarity":"common|uncommon|rare|legendary","effect":"string","icon":"string","description":"string"}],"quest_updates":[{"id":"string","status":"active|completed|failed","objectives":[{"text":"string","completed":false}]}]}`
  }

  // ── API CALLS ──────────────────────────────────────────────────────────
  const callGeminiDM = async (userMsg: string, gs: GameState, isFirstTurn: boolean = false): Promise<DMResponse> => {
    // Apply throttling before API call
    await waitForThrottle()
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`
    const MAX_RETRIES = 3
    const BASE_DELAY = 6000
    
    // OPTIMIZATION: Balanced maxOutputTokens for rich Gaiman prose
    // Opening scene needs more tokens for atmospheric worldbuilding + companion origin
    // Regular turns need enough for 2-4 rich paragraphs (300+ words)
    const maxTokens = isFirstTurn ? 8000 : 6000
    
    // Track input tokens
    const systemPrompt = buildDMSystem(gs)
    const totalInput = systemPrompt + userMsg

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const waitSec = Math.round((BASE_DELAY * Math.pow(2, attempt - 1)) / 1000)
        setStatusMessage(`Retrying in ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})...`)
        await sleep(BASE_DELAY * Math.pow(2, attempt - 1))
      }

      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: toAscii(userMsg) }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: maxTokens }
          })
        })

        if (r.status === 429) {
          console.warn('⚠️ Gemini quota exceeded (429)')
          if (attempt === MAX_RETRIES - 1) {
            console.warn('📝 Using template fallback')
            return getTemplateFallback(gs, 'quota_exceeded')
          }
          continue
        }

        if (!r.ok) {
          const e = await r.text()
          console.error(`❌ Gemini error ${r.status}:`, e.slice(0, 200))
          throw new Error(`Gemini ${r.status}: ${e.slice(0, 150)}`)
        }

        const data = await r.json()
        if (data.error) {
          console.error('❌ Gemini API error:', data.error)
          throw new Error(data.error.message)
        }

        const parts = (data.candidates || [])[0]?.content?.parts || []
        let raw = ''
        for (const part of parts) {
          if (part.text && part.text.trim().length > 10) raw += part.text
        }
        
        // Log success
        console.log(`✅ Gemini response: ${raw.length} chars, ${isFirstTurn ? 'OPENING' : 'TURN ' + gs.turn}`)
        
        // Track token usage
        updateTokenUsage('gemini', totalInput, raw)

        return parseDMResponse(raw, gs)

      } catch (e) {
        console.error(`❌ Gemini fetch error (attempt ${attempt + 1}):`, e)
        if (attempt < MAX_RETRIES - 1 && String(e).includes('fetch')) continue
        if (attempt === MAX_RETRIES - 1) {
          console.warn('📝 Using template fallback due to error')
          return getTemplateFallback(gs, String(e))
        }
      }
    }
    return getTemplateFallback(gs, 'unrecoverable_failure')
  }

  const parseDMResponse = (raw: string, gs: GameState): DMResponse => {
    let splitPos = raw.indexOf('```json')
    if (splitPos === -1) {
      let keyIdx = raw.indexOf('"story_summary"')
      if (keyIdx === -1) keyIdx = raw.indexOf('"dm_narration"')
      if (keyIdx > -1) splitPos = raw.lastIndexOf('{', keyIdx)
    }

    let narrative = ''
    let jsonStr = ''

    if (splitPos > -1) {
      narrative = raw.slice(0, splitPos).trim()
      jsonStr = raw.slice(splitPos).trim()
    } else {
      narrative = raw.trim()
    }

    narrative = narrative.replace(/```(json)?\s*$/i, '').trim()
    if (narrative.length > 30) setLastDMNarrative(narrative)

    if (!jsonStr) {
      console.warn('⚠️ No JSON in Gemini response, using template fallback')
      return getTemplateFallback(gs, 'JSON payload missing')
    }

    // Repair JSON
    let s = jsonStr.replace(/```json\s*/ig, '').replace(/```\s*/g, '').trim()
    try {
      const parsed = JSON.parse(s)
      // Validate parsed result is a non-null object with dm_narration
      if (!parsed || typeof parsed !== 'object' || !parsed.dm_narration) {
        console.warn('⚠️ Parsed JSON missing dm_narration, using template fallback')
        return getTemplateFallback(gs, 'Missing dm_narration field')
      }
      return parsed
    } catch { }

    const firstBrace = s.indexOf('{')
    const lastBrace = s.lastIndexOf('}')
    if (firstBrace >= 0 && lastBrace >= firstBrace) {
      try {
        const parsed = JSON.parse(s.substring(firstBrace, lastBrace + 1))
        if (parsed && typeof parsed === 'object' && parsed.dm_narration) return parsed
      } catch { }
    }

    console.warn('⚠️ JSON parse failed, using template fallback')
    return getTemplateFallback(gs, 'Payload structure unrecoverable')
  }

  const generateSmartFallback = (reason: string, gs: GameState): DMResponse => {
    const pc = gs.pcs.find(p => !p.dead)
    const ant = getAntagonist(gs.antagonistId)
    const shard = gs.shardEntry

    // Gaiman-style fallback narration - rich and atmospheric
    let narr = `The moment stretches like taffy, thin and sweet and precarious. `
    
    if (shard) {
      narr += `The ${shard.name} ${shard.name.includes('Shard') ? 'whispers' : 'pulses'} in that way ancient things do when they have seen empires rise and crumble, when they have watched gods grow old and forget their own names. It is patient, the way only truly old things can be patient. `
    }
    
    if (gs.act === ACTS.THREE && ant) {
      narr += `\n\n${ant.name} waits. Not with patience—something older than patience, something that has forgotten the need for patience. Their shadow falls long across the world, and in that shadow, small things stop moving. The air tastes of copper and ending.`
    } else {
      narr += `\n\nThere is something out there in the darkness, something that does not have a name yet, or perhaps has too many names. It watches. It hungers. It does not know the meaning of mercy, having long ago eaten the last person who tried to teach it.`
    }
    
    if (pc) {
      narr += `\n\n${pc.name} feels the weight of the moment, the peculiar heaviness that comes when the world holds its breath. Something must be done. The story demands it.`
    }
    
    narr += `\n\n*(The threads of fate tangle. ${reason}. The narrative awaits your hand to unravel it.)*`

    return {
      story_summary: gs.storySummary || 'The heroes stand at the precipice of something vast and terrible, something that was old when the world was young.',
      dm_narration: narr,
      human_pc_id: pc?.id || undefined,
      human_pc_reason: 'The story stalls. Your action will force the narrative forward, for better or worse.',
      npc_encounters: [],
      dice_rolls: [],
      damage_dealt: [],
      injury_events: [],
      state_updates: [],
      new_active_npcs: [],
      shard_event: { invoked: false },
      next_pc_id: undefined,
      pc_agreement: {},
      boss_phase_trigger: false,
      consequences: 'The threads of fate tremble, awaiting the weaver\'s hand.',
      tension_note: 'The pause stretches. Something must break.'
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE FALLBACKS - High-quality pre-written narratives (SAVES 100% API CALLS)
  // ═══════════════════════════════════════════════════════════════════════════
  const getTemplateFallback = (gs: GameState, reason: string): DMResponse => {
    const pc = gs.pcs.find(p => !p.dead)
    const ant = getAntagonist(gs.antagonistId)
    const shard = gs.shardEntry
    
    // Pre-written HIGH-QUALITY Gaiman-style templates - 1-2 RICH PARAGRAPHS
    const templates = {
      combat: [
        `The air fills with the percussion of violence—steel meeting steel, the wet sound of blade parting flesh. ${pc?.name || 'The hero'} moves through chaos like a dancer through storm, each strike a word in a sentence written long before they were born.

${shard ? `The ${shard.name} pulses with something that might be excitement or fear. Even ancient things are not immune to the electric terror of battle.` : `And in the spaces between attacks, something older than the combatants watches with patient, hungry eyes.`}`,

        `There is a poetry to violence that the peaceful never understand. ${pc?.name || 'The warrior'} finds a strange clarity in the heart of chaos—that peculiar stillness where training becomes instinct and thought becomes action.

${shard ? `The ${shard.name} thrums against its bearer's chest, a second heartbeat of ancient power, remembering every battle it has witnessed across the centuries.` : `The fight is a conversation written in blood, and every hesitation is a word left unsaid.`}`
      ],
      
      exploration: [
        `The path winds deeper into darkness, each step a small act of faith against the void. ${pc?.name || 'The traveler'} feels the weight of forgotten histories pressing against their shoulders—this place remembers things the world above chose to forget.

${shard ? `The ${shard.name} grows warmer—or perhaps colder, it is difficult to tell which. The ancient thing is responding to something, calling out to something that may or may not wish to be found.` : `Something ahead breathes with an ancient, patient rhythm. It has been waiting since before the stones were laid.`}`,

        `Every step into the unknown is a negotiation with the darkness. ${pc?.name || 'The explorer'} has learned that shadows are never empty—they are full of things that simply have not yet chosen to reveal themselves.

${shard ? `The ${shard.name} pulses in response to whispers in languages that predate speech, a conversation at frequencies below hearing.` : `The walls lean inward, conspiratorial. In places this old, the distinction between stone and spirit grows thin as paper.`}`
      ],
      
      dialogue: [
        `Words hang in the air like smoke from a snuffed candle. ${pc?.name || 'The speaker'} chooses each one with the care of a jeweler setting diamonds—knowing that what is said here will echo in ways that cannot be predicted, cannot be taken back.

${shard ? `The ${shard.name} watches—or whatever passes for watching when you are a thing of power spanning centuries. It has seen empires rise and fall on smaller words than these.` : `The moment stretches, elastic and dangerous. Something is about to change, and everyone present can feel it.`}`,

        `The conversation is a dance where neither party is certain who leads. ${pc?.name || 'The negotiator'} speaks carefully, aware that in this crystalline moment, words carry more weight than any blade.

${shard ? `Power radiates from the ${shard.name} like heat from a sun that burned before words were invented. It is listening. It is judging. It remembers everything.` : `The air itself leans in, hungry to know what will be promised, what will be broken.`}`
      ],
      
      tension: [
        `The moment before action stretches thin as spider silk. ${pc?.name || 'The hero'} stands at the crossroads of a thousand possible futures, each one demanding a price that may or may not be worth paying.

${shard ? `The ${shard.name} thrums with an energy that might be anticipation or warning. It has seen this moment before, with other heroes at other crossroads. It knows what comes next. It does not say.` : `Time slows, heartbeats becoming thunder. Something is about to happen—something that will divide all history into before and after.`}`,

        `Silence falls like a blade. ${pc?.name || 'The watcher'} feels destiny pressing down with physical force—the weight of the moment between heartbeats where heroes are made or unmade.

${shard ? `The ${shard.name} pulses once, twice, three times—a countdown, or a heartbeat, or the footsteps of something approaching from very far away.` : `In the distance, something howls—triumph or grief or something older than both. It might be welcoming. It might be warning. It might be both.`}`,

        `The air grows heavy with the weight of unmade choices. ${pc?.name || 'The hero'} understands, in that bone-deep way that needs no words, that this moment will echo through all the days that follow.

${shard ? `The ${shard.name} grows warm—or perhaps cold, temperature having become a suggestion rather than a fact. It is paying attention now. Whatever comes next, it will remember.` : `Somewhere beyond the veil of the mundane world, something ancient leans forward, curious to see which thread in the tapestry will be pulled.`}`
      ],
      
      quota_exceeded: [
        `The threads of fate tangle around themselves, and for a moment, the story itself seems to hesitate. Even destiny must catch its breath sometimes.

${pc?.name || 'The hero'} feels the weight of possibility pressing against them, patient as the tide. The moment will come. It always comes.

*(The mists of fate grow thick. The next action will clarify the path ahead.)*`,

        `Time itself stutters, caught between heartbeats. ${pc?.name || 'The protagonist'} stands at the center of potential futures, each one waiting for the push that will make it real.

${ant && gs.act === ACTS.THREE ? `${ant.name} waits with the patience of something that was ancient before the stars learned to burn.` : `In the shadows, something patient observes. It has outlasted empires. It can outlast this pause.`}

*(The tapestry of fate catches on a snag. A moment's patience, and the threads will realign.)*`,

        `The story pauses at the edge of a breath. ${pc?.name || 'The hero'} waits, not with impatience but with the understanding that even heroes must sometimes stand still.

${shard ? `The ${shard.name} dims slightly, conserving its power. It has waited centuries. It can wait a moment more.` : `Beyond the veil, something gathers itself, preparing for what comes next. The pause will not last forever.`}

*(The narrative gathers itself. Your next action will write what comes next.)*`
      ]
    }
    
    // Select appropriate template based on game state
    let category: keyof typeof templates = 'tension'
    if (gs.act === ACTS.THREE && ant) category = 'combat'
    else if (reason.toLowerCase().includes('quota') || reason.toLowerCase().includes('exceeded')) category = 'quota_exceeded'
    else if (gs.activeNPCs.length > 0) category = 'dialogue'
    else if (gs.turn > 0) category = 'exploration'
    
    const templateOptions = templates[category]
    const selectedTemplate = templateOptions[Math.floor(Math.random() * templateOptions.length)]
    
    return {
      story_summary: gs.storySummary || 'The heroes navigate a world where ancient powers stir and every choice echoes through eternity.',
      dm_narration: selectedTemplate,
      human_pc_id: pc?.id || undefined,
      human_pc_reason: 'The narrative pauses at a crucial moment. Your action will determine what comes next.',
      npc_encounters: [],
      dice_rolls: [],
      damage_dealt: [],
      injury_events: [],
      state_updates: [],
      new_active_npcs: [],
      shard_event: { invoked: false },
      next_pc_id: undefined,
      pc_agreement: {},
      boss_phase_trigger: false,
      consequences: 'The moment stretches. Consequences await the next action.',
      tension_note: 'The story pauses at a turning point.'
    }
  }

  const callGroqForOptions = async (pc: Entity, sceneCtx: string, fallback: GameOption[]): Promise<GameOption[]> => {
    let validFallback = fallback.length > 0 && fallback[0].action ? fallback : buildDefaultOptions(pc)
    if (!groqKey) return validFallback

    // ═══════════════════════════════════════════════════════════════════════
    // SMART CACHING - Reuse options for similar situations (SAVES API CALLS)
    // ═══════════════════════════════════════════════════════════════════════
    const cacheKey = `${pc.id}_${pc.hp}_${gameState.act}_${gameState.antagonistPhase}_${gameState.activeNPCs.length > 0 ? 'npcs' : 'no_npcs'}`
    const cached = optionsCacheRef.current.get(cacheKey)
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL && cached.pcId === pc.id) {
      setStatusMessage(`Using cached options for ${pc.name}`)
      return cached.options
    }
    
    // Check if last choice was "Skip Turn" - can reuse skip options
    if (gameState.humanOptions.length > 0) {
      const lastChoice = gameState.humanOptions[gameState.pendingHumanChoice || 0]
      if (lastChoice?.action.toLowerCase().includes('skip') || lastChoice?.action.toLowerCase().includes('wait')) {
        // Return skip-specific options without API call
        setStatusMessage(`Quick options for ${pc.name}`)
        return buildDefaultOptions(pc)
      }
    }

    const alignRule = pc.align.includes('good')
      ? 'Protect innocents, honor alliances, show mercy to the deserving.'
      : pc.align.includes('evil')
        ? 'Power and survival first. Exploit weaknesses. Show no mercy to enemies.'
        : 'Balance all factors. Weigh costs vs benefits. Adapt to the situation.'

    const personalityHint = pc.personality ? `PERSONALITY: ${pc.personality.slice(0, 100)}\n` : ''

    // Get companion info if available
    const companion = gameState.companionId ? gameState.pcs.find(p => p.id === gameState.companionId) : null
    const companionAlignRule = companion?.align.includes('good')
      ? 'Protect innocents, honor alliances, show mercy.'
      : companion?.align.includes('evil')
        ? 'Power and survival first. Exploit weaknesses.'
        : 'Balance all factors. Adapt to the situation.'
    
    const affinityDesc = gameState.companionAffinity >= 75 ? 'devoted ally'
      : gameState.companionAffinity >= 50 ? 'loyal companion'
      : gameState.companionAffinity >= 25 ? 'concerned friend'
      : gameState.companionAffinity >= 0 ? 'distant ally'
      : gameState.companionAffinity >= -25 ? 'conflicted companion'
      : gameState.companionAffinity >= -50 ? 'hostile partner'
      : 'rival in name only'

    const sys = gameState.turn === 0
      ? `Generate 6 options for this scene with a STRUCTURED FORMAT:

MAIN PC: ${pc.name} (${pc.align})
${personalityHint}ALIGNMENT: ${alignRule}
KEY ABILITIES: ${pc.abilities.slice(0, 4).join(' | ')}

${companion ? `COMPANION: ${companion.name} (${companion.align})
COMPANION AFFINITY WITH PC: ${affinityDesc} (${gameState.companionAffinity}/100)
COMPANION ALIGNMENT: ${companionAlignRule}
COMPANION ABILITIES: ${companion.abilities.slice(0, 3).join(' | ')}` : 'No companion present.'}

═══════════════════════════════════════════════════════
REQUIRED OUTPUT STRUCTURE (EXACTLY 6 OPTIONS):
═══════════════════════════════════════════════════════

OPTIONS 1-3: MAIN PC ACTIONS (according to ${pc.align} alignment)
- Option 1: Direct action using abilities (attack, defend, investigate)
- Option 2: Social/diplomatic action (persuade, negotiate, question)
- Option 3: Strategic or signature ability use

${companion ? `OPTIONS 4-5: COMPANION SUGGESTED ACTIONS (according to ${companion.align} alignment and ${affinityDesc} relationship)
- Option 4: ${companion.name} suggests an action that supports ${pc.name}'s goal
- Option 5: ${companion.name} suggests an alternative approach (based on their alignment and affinity)

AFFINITY GUIDE: ${gameState.companionAffinity >= 50 
  ? 'Positive affinity = supportive, protective, selfless suggestions' 
  : gameState.companionAffinity >= 0 
    ? 'Neutral affinity = practical, cautious, pragmatic suggestions' 
    : 'Negative affinity = challenging, questioning, possibly selfish suggestions'}` : 'OPTIONS 4-5: Alternative PC actions (no companion present)'}

OPTION 6: Skip Turn — Observe and Wait (always include this)

CRITICAL: 
- Options 1-3 MUST align with ${pc.name}'s ${pc.align} alignment
- ${companion ? `Options 4-5 MUST reflect ${companion.name}'s ${companion.align} alignment AND their ${affinityDesc} relationship with ${pc.name}` : 'Options 4-5 should be alternative PC actions'}

Output ONLY a JSON array: [{"num":1,"action":"Full action description","ability":"Relevant ability","align_note":"Why this fits","source":"pc"},{"num":2,...,"source":"pc"},{"num":3,...,"source":"pc"},{"num":4,...,"source":"companion","companion_name":"${companion?.name || ''}"},{"num":5,...,"source":"companion","companion_name":"${companion?.name || ''}"},{"num":6,"action":"Skip Turn — Observe and Wait","ability":"Observation","align_note":"Passive","source":"pc"}]`
      : `Generate 6 options with STRUCTURED FORMAT:

MAIN PC: ${pc.name} (${pc.align})
${personalityHint}ALIGNMENT: ${alignRule}
KEY ABILITIES: ${pc.abilities.slice(0, 4).join(' | ')}

${companion ? `COMPANION: ${companion.name} (${companion.align})
COMPANION AFFINITY WITH PC: ${affinityDesc} (${gameState.companionAffinity}/100)
COMPANION ALIGNMENT: ${companionAlignRule}
COMPANION ABILITIES: ${companion.abilities.slice(0, 3).join(' | ')}` : 'No companion present.'}

═══════════════════════════════════════════════════════
REQUIRED OUTPUT STRUCTURE (EXACTLY 6 OPTIONS):
═══════════════════════════════════════════════════════

OPTIONS 1-3: MAIN PC ACTIONS (according to ${pc.align} alignment)
- Option 1: Direct action (offensive/defensive based on situation)
- Option 2: Social/diplomatic action or ability use
- Option 3: Strategic move or signature ability

${companion ? `OPTIONS 4-5: COMPANION SUGGESTED ACTIONS (according to ${companion.align} alignment and ${affinityDesc} relationship)
- Option 4: ${companion.name} suggests supportive action based on affinity
- Option 5: ${companion.name} suggests alternative approach (reflects alignment + affinity)

AFFINITY EFFECT: ${gameState.companionAffinity >= 50 
  ? 'High affinity = supportive, protective suggestions' 
  : gameState.companionAffinity >= 0 
    ? 'Neutral affinity = practical, balanced suggestions' 
    : 'Low affinity = challenging, questioning suggestions'}` : 'OPTIONS 4-5: Alternative PC actions'}

OPTION 6: Skip Turn — Observe and Wait (always last)

Output ONLY a JSON array with "source" field: "pc" for PC actions, "companion" for companion suggestions.`
    
    // Generate 6 options including skip turn
    const optionsPrompt = `SCENE: ${toAscii(sceneCtx).slice(0, 500)}
MAIN PC: ${pc.name} | HP:${pc.hp}/${pc.maxHp} | ${pc.align}
${companion ? `COMPANION: ${companion.name} | ${companion.align} | Affinity: ${affinityDesc}` : ''}

Generate EXACTLY 6 options:
- Options 1-3: ${pc.name}'s actions (according to ${pc.align} alignment)
- ${companion ? `Options 4-5: ${companion.name}'s suggestions (according to ${companion.align} alignment and ${affinityDesc} affinity)` : 'Options 4-5: Alternative PC actions'}
- Option 6: Skip Turn

Each option needs: num, action, ability, align_note, source ("pc" or "companion")${companion ? ', companion_name' : ''}`

    // Apply throttling before Groq call
    await waitForThrottle()

    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 800, // Reduced from 1000 for optimization
          temperature: 0.95, // Higher temp for variety
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: optionsPrompt }
          ]
        })
      })

      if (!r.ok) throw new Error(`Groq ${r.status}`)
      const data = await r.json()
      const raw = (data.choices || [])[0]?.message?.content || ''
      
      // Track token usage
      updateTokenUsage('groq', sys + optionsPrompt, raw)
      
      let s = raw.replace(/```json\s*/ig, '').replace(/```\s*/g, '').trim()
      const f = s.indexOf('[')
      const l = s.lastIndexOf(']')
      if (f >= 0 && l >= f) s = s.substring(f, l + 1)
      const arr = JSON.parse(s)
      if (Array.isArray(arr) && arr.length >= 4 && arr[0].action && arr[0].ability) {
        // Ensure source field is set for all options
        const processedArr: GameOption[] = arr.map((o: GameOption, idx: number) => ({
          ...o,
          num: idx + 1,
          source: o.source || (idx < 3 ? 'pc' : idx < 5 ? 'companion' : 'pc'),
          companion_name: o.companion_name || (o.source === 'companion' && idx >= 3 && idx < 5 ? companion?.name : undefined)
        }))
        
        // Add skip turn if not present
        const hasSkip = processedArr.some((o: GameOption) => o.action.toLowerCase().includes('skip') || o.action.toLowerCase().includes('wait'))
        if (!hasSkip && processedArr.length < 6) {
          const skipOption: GameOption = { 
            num: 6, 
            action: 'Skip Turn — Observe and Wait', 
            ability: 'Observation', 
            align_note: 'Passive, waiting for opportunity',
            source: 'pc'
          }
          processedArr.push(skipOption)
        }
        
        const options = processedArr.slice(0, 6)
        
        // Cache the options for future use
        optionsCacheRef.current.set(cacheKey, {
          options,
          timestamp: Date.now(),
          pcId: pc.id
        })
        
        return options
      }
    } catch (e) {
      console.warn('Groq options failed:', e)
    }
    // Add skip turn to fallback
    return buildDefaultOptions(pc)
  }

  const buildDefaultOptions = (pc: Entity): GameOption[] => {
    const ab = pc.abilities.map(toAscii)
    const evil = pc.align.toLowerCase().includes('evil')
    
    // Get companion if available
    const companion = gameState.companionId ? gameState.pcs.find(p => p.id === gameState.companionId) : null
    const companionEvil = companion?.align.toLowerCase().includes('evil') || false
    const cab = companion?.abilities.map(toAscii) || []
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTIONS 1-3: PC ACTIONS (according to alignment)
    // ═══════════════════════════════════════════════════════════════════════════
    const pcOptions: GameOption[] = [
      { 
        num: 1, 
        action: evil 
          ? 'Strike with merciless precision — ' + (ab[0] || 'weapon').split('(')[0].trim()
          : 'Attack with righteous fury — ' + (ab[0] || 'weapon').split('(')[0].trim(), 
        ability: ab[0] || 'melee', 
        align_note: evil ? 'ruthless offensive' : 'righteous strike',
        source: 'pc'
      },
      { 
        num: 2, 
        action: evil 
          ? 'Dominate the situation through intimidation'
          : 'Defend and protect allies — ' + (ab[1] || 'shield').split(':')[0].trim(), 
        ability: evil ? 'intimidation' : (ab[1] || 'defend'), 
        align_note: evil ? 'coercive control' : 'protective support',
        source: 'pc'
      },
      { 
        num: 3, 
        action: 'Unleash signature power — ' + (ab[2] || ab[0] || 'ability').split(':')[0].trim(), 
        ability: ab[2] || ab[0] || 'signature', 
        align_note: 'signature ability',
        source: 'pc'
      }
    ]
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTIONS 4-5: COMPANION ACTIONS (80% ability-driven, 20% dialogue)
    // The PC suggests the companion use their specific powers
    // ═══════════════════════════════════════════════════════════════════════════
    let companionOptions: GameOption[]
    
    if (companion) {
      const affinityPositive = gameState.companionAffinity >= 25
      const affinityNegative = gameState.companionAffinity < 0
      const useAbilities = Math.random() < 0.80 // 80% ability-driven

      // Build companion ability descriptions from their actual power list
      const companionAbilities = companion.abilities.map(a => a.split('(')[0].trim()).filter(a => a.length > 2)
      const compAbility1 = companionAbilities[0] || 'their power'
      const compAbility2 = companionAbilities[1] || companionAbilities[0] || 'another ability'
      const compAbility3 = companionAbilities[2] || companionAbilities[1] || compAbility1

      // Alignment-flavored action verbs
      const attackVerb = companionEvil ? 'unleash' : 'channel'
      const supportVerb = companionEvil ? 'exploit' : 'invoke'
      const defendVerb = companionEvil ? 'dominate' : 'shield'

      if (useAbilities) {
        // ═══ ABILITY-DRIVEN OPTIONS — PC suggests companion use their powers ═══
        const abilityPair = (() => {
          // Pick 2 distinct abilities from companion's list
          const pool = companionAbilities.length >= 2
            ? companionAbilities
            : [...companionAbilities, 'their innate power']
          const idx1 = Math.floor(Math.random() * pool.length)
          const remaining = pool.filter((_, i) => i !== idx1)
          const idx2 = Math.floor(Math.random() * remaining.length)
          return [pool[idx1], remaining[idx2]]
        })()

        companionOptions = [
          { 
            num: 4,
            action: affinityNegative
              ? `${companion.name} should ${attackVerb} ${abilityPair[0]} — "I don't trust this situation, use your power"`
              : `Suggest ${companion.name} ${supportVerb} ${abilityPair[0]} — combine our strengths`,
            ability: abilityPair[0],
            align_note: companionEvil
              ? (affinityNegative ? 'ruthless power, self-preserving' : 'calculated force')
              : (affinityNegative ? 'cautious power use' : 'coordinated assault'),
            source: 'companion',
            companion_name: companion.name
          },
          { 
            num: 5,
            action: affinityNegative
              ? `${companion.name} could ${attackVerb} ${abilityPair[1]} instead — "Let them handle this their way"`
              : `Ask ${companion.name} to ${defendVerb} with ${abilityPair[1]} — trust their judgment`,
            ability: abilityPair[1],
            align_note: companionEvil
              ? (affinityPositive ? 'strategic power combo' : 'delegated force')
              : (affinityPositive ? 'trusted synergy' : 'shared burden'),
            source: 'companion',
            companion_name: companion.name
          }
        ]
      } else {
        // ═══ DIALOGUE OPTIONS (20%) — Character-driven conversation ═══
        companionOptions = [
          { 
            num: 4, 
            action: affinityNegative
              ? `${companion.name} questions: "Are you certain about this approach?"`
              : affinityPositive
                ? `${companion.name} offers: "Let me support you with ${compAbility1}"`
                : `${companion.name} suggests: "We should proceed carefully"`,
            ability: compAbility1, 
            align_note: companionEvil 
              ? (affinityNegative ? 'challenging from self-interest' : 'calculated support')
              : (affinityNegative ? 'cautious disagreement' : 'loyal assistance'),
            source: 'companion',
            companion_name: companion.name
          },
          { 
            num: 5, 
            action: affinityNegative
              ? `${companion.name} proposes an alternative: "${companionEvil ? 'Why not take what we want?' : 'There may be another way'}"`
              : `${companion.name} advises: "${companionEvil ? 'Power favors the bold' : 'Consider all options before acting'}"`,
            ability: compAbility2, 
            align_note: companionEvil 
              ? (affinityPositive ? 'strategic counsel' : 'self-serving suggestion')
              : (affinityPositive ? 'wise guidance' : 'cautious alternative'),
            source: 'companion',
            companion_name: companion.name
          }
        ]
      }
    } else {
      // No companion - provide alternative PC actions
      companionOptions = [
        { 
          num: 4, 
          action: evil ? 'Attempt manipulation to gain advantage' : 'Attempt negotiation with authority', 
          ability: 'persuasion/authority', 
          align_note: evil ? 'cunning' : 'diplomatic',
          source: 'pc'
        },
        { 
          num: 5, 
          action: evil ? 'Exploit the chaos for personal gain' : 'Rally allies with an inspiring act of heroism', 
          ability: ab[3] || ab[0] || 'inspire', 
          align_note: evil ? 'self-serving' : 'leadership',
          source: 'pc'
        }
      ]
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTION 6: SKIP TURN (always available)
    // ═══════════════════════════════════════════════════════════════════════════
    const skipOption: GameOption = { 
      num: 6, 
      action: 'Skip Turn — Observe and Wait', 
      ability: 'Observation', 
      align_note: 'Passive, waiting for opportunity',
      source: 'pc'
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // OPTION 7: SUMMON ARCHRIVAL (Act III only, if antagonist was banished)
    // ═══════════════════════════════════════════════════════════════════════════
    let rivalOption: GameOption | null = null
    if (gameState.act === ACTS.THREE && gameState.antagonistBanished && gameState.antagonistRival) {
      const rival = gameState.antagonistRival
      rivalOption = {
        num: 7,
        action: `⚡ Summon ${rival.name}, ${rival.title} — the shard pulses with forbidden power`,
        ability: `archrival_summon:${rival.id}`,
        align_note: `Summon ${rival.name} — ${rival.ability}`,
        source: 'archrival_summon'
      }
    }
    
    return [...pcOptions, ...companionOptions, skipOption, ...(rivalOption ? [rivalOption] : [])]
  }

  // ── APPLY MECHANICS ────────────────────────────────────────────────────
  const applyMechanics = async (res: DMResponse, gs: GameState): Promise<GameState> => {
    const newGS = { ...gs }

    if (res.story_summary) newGS.storySummary = res.story_summary
    if (res.journey_so_far) newGS.journeySoFar = res.journey_so_far

    // ── SOUND EVENTS ──────────────────────────────────────────────────
    if (res.dice_rolls?.length) {
      for (const d of res.dice_rolls) {
        setTimeout(() => soundEvents.emit({ type: 'dice_roll', success: !!d.success }), Math.random() * 200)
      }
    }
    if (res.damage_dealt?.length) {
      for (const d of res.damage_dealt) {
        const isCritical = d.damage && d.damage.includes('critical')
        setTimeout(() => soundEvents.emit({ type: 'combat_hit', critical: isCritical }), 300)
      }
    }

    // Shard event
    if (res.shard_event?.invoked) {
      soundEvents.emit({ type: 'shard_pulse' })
      newGS.pendingShardSummon = null
      if (res.shard_event.success && res.shard_event.summoned_name) {
        if (res.shard_event.is_greater) {
          newGS.shardCharges = 0
          newGS.shardDark = true
        } else {
          newGS.shardCharges = Math.max(0, newGS.shardCharges - 1)
        }
        newGS.shardSummoned = [...newGS.shardSummoned, res.shard_event.summoned_name]
      }
      if (newGS.shardCharges <= 0) newGS.shardDark = true
    }

    // New NPCs
    if (res.new_active_npcs?.length) {
      for (const id of res.new_active_npcs) {
        if (!newGS.activeNPCs.find(n => n.id === id)) {
          const npc = await lookupEntity(id)
          if (npc) {
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
          const pc = { ...newGS.pcs[pcIdx] }
          if (u.hp_delta) pc.hp = Math.max(0, Math.min(pc.maxHp, pc.hp + Number(u.hp_delta)))
          if (u.new_condition && !pc.conditions.includes(u.new_condition)) {
            pc.conditions = [...pc.conditions, u.new_condition]
          }
          if (u.remove_condition) {
            pc.conditions = pc.conditions.filter(c => c !== u.remove_condition)
          }
          if (u.dead || pc.hp <= 0) {
            pc.dead = true
            pc.hp = 0
            soundEvents.emit({ type: 'death' })

            // ═══ PROPHECY TRANSFER ON DEATH — Story-Driven Chain ═══
            // Main PC falls → Companion becomes Chosen One
            // If companion also falls → RNG pool NPC (the "chosen, not yet") steps up
            const deadPcId = pc.id
            const deadPcProphecy = newGS.prophecies.find(p => p.pc_id === deadPcId)

            if (deadPcProphecy) {
              const prophecyIdx = newGS.prophecies.findIndex(p => p.pc_id === deadPcId)
              const oldProphecy = newGS.prophecies[prophecyIdx]

              // Determine successor: companion first, then RNG pool
              const successor = newGS.pcs.find(p => !p.dead && p.id !== deadPcId)
                || [...newGS.rngHeroPool, ...newGS.rngDemigodPool]
                    .filter(e => !newGS.pcs.find(p => p.id === e.id) && !e.dead)[0]

              if (successor) {
                // If successor is not yet in the party, add them
                if (!newGS.pcs.find(p => p.id === successor.id)) {
                  newGS.pcs = [...newGS.pcs, { ...successor, hp: successor.maxHp, conditions: [], dead: false }]
                  newGS.pcAgreements = { ...newGS.pcAgreements, [successor.id]: null }

                  // Track which RNG pool they came from
                  const heroIdx = newGS.rngHeroPool.findIndex(h => h.id === successor.id)
                  const demigodIdx = newGS.rngDemigodPool.findIndex(d => d.id === successor.id)
                  if (heroIdx >= 0) newGS.introducedHeroes = [...newGS.introducedHeroes, successor.id]
                  if (demigodIdx >= 0) newGS.introducedDemigods = [...newGS.introducedDemigods, successor.id]
                }

                // Update companion tracking — successor becomes the new companion
                newGS.companionId = successor.id
                newGS.companionAffinity = 30 // Fresh bond, lower than original
                newGS.companionMood = 'concerned' // They just watched someone die

                // Transfer prophecy
                if (oldProphecy.prophecyId === 8) {
                  // "The Unwritten" — roll a fresh prophecy for the new bearer
                  const newProphecy = rollProphecies(1)[0]
                  newGS.prophecies[prophecyIdx] = {
                    prophecyId: newProphecy.id,
                    riddle: newProphecy.riddle,
                    pc_id: successor.id,
                    previous_holders: [...oldProphecy.previous_holders, deadPcId],
                    state: 'dormant'
                  }
                } else {
                  newGS.prophecies[prophecyIdx] = {
                    ...oldProphecy,
                    pc_id: successor.id,
                    previous_holders: [...oldProphecy.previous_holders, deadPcId],
                    state: 'awakening'
                  }
                }

                // Log the mantle passing — Gaiman-style
                const isFirstTransfer = oldProphecy.previous_holders.length === 0
                const transferMsg = isFirstTransfer
                  ? `${successor.name} takes up the shard. The weight of ${pc.name}'s prophecy settles onto new shoulders — heavier now, stained with loss. The shard burns cold, then warm. It has chosen again.`
                  : `${successor.name} reaches for the shard. It pulses with the accumulated grief of ${oldProphecy.previous_holders.length + 1} fallen bearers. The prophecy reshapes itself for this new voice. The cycle continues.`
                newGS.log = [...newGS.log, { msg: transferMsg, type: 'discovery', turn: gs.turn }]
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
    // ACT PROGRESSION - RNG Turn Limits
    // ═══════════════════════════════════════════════════════════════════════════
    const allPCsIntroduced = newGS.pcQueue.length === 0
    const allPCsAgreed = newGS.pcs.filter(p => !p.dead).every(p => newGS.pcAgreements[p.id] === true)
    
    // ACT I -> ACT II: Either all PCs agreed OR RNG turn limit reached
    if (newGS.act === ACTS.ONE) {
      const turnLimitReached = newGS.turn >= newGS.act1TurnLimit
      if ((allPCsIntroduced && allPCsAgreed) || turnLimitReached) {
        newGS.act = ACTS.TWO
        soundEvents.emit({ type: 'act_transition', act: 'act2' })
        newGS.act2StartTurn = newGS.turn
        // Log the act transition
        newGS.log = [...newGS.log, {
          msg: turnLimitReached 
            ? `Act I ends after ${newGS.turn} turns. The shadow grows impatient.`
            : `Act I complete. The party stands united. Act II begins.`,
          type: 'discovery',
          turn: newGS.turn
        }]
      }
    }
    
    // ACT II -> ACT III: After RNG turn duration for Act II
    if (newGS.act === ACTS.TWO) {
      const act2Duration = newGS.turn - newGS.act2StartTurn
      const act2Complete = act2Duration >= newGS.act2TurnLimit
      const storyReady = newGS.antagonistCluesRevealed.length >= 3 // At least 3 clues found
      
      if (act2Complete || (storyReady && act2Duration >= 20)) { // Minimum 20 turns in Act II
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
        
        // Log the act transition
        newGS.log = [...newGS.log, {
          msg: `Act II ends after ${act2Duration} turns. The final confrontation awaits.`,
          type: 'discovery',
          turn: newGS.turn
        }]
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
      shardSummoned: newGS.shardSummoned.length,
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

    return newGS
  }

  // ── RUN TURN ───────────────────────────────────────────────────────────
  const runTurn = async (isFirst: boolean, currentGS: GameState) => {
    let gs = currentGS
    gs.isProcessing = true
    setGameState({ ...gs })

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
      // Get companion (second PC in pcs array — NOT pcQueue which is empty after setup)
      const companion = gs.pcs.length > 1 ? gs.pcs[1] : undefined
      const mainPC = gs.pcs[0]

      userMsg = `OPENING SCENE — THE SHARD ENCOUNTER.

═══════════════════════════════════════════════════════════════════════════
THE SHARD
═══════════════════════════════════════════════════════════════════════════
SHARD: ${shard?.name}
ORIGIN: ${toAscii(shard?.origin || '')}
PANTHEON AFFINITY: ${shard?.pantheon || 'Primordial'}
POWER: ${shard?.power || 'Unknown'}

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
MANDATORY STRUCTURE (NEIL GAIMAN STYLE - 5-7 RICH PARAGRAPHS)
═══════════════════════════════════════════════════════════════════════════

PART 1 — THE SHARD AWAKENS (1-2 paragraphs):
Describe ${shard?.name} appearing in the world. Be specific and sensory. Use mythic, poetic language. The shard has been waiting for this moment. It remembers all its previous holders. It remembers what it was before it broke from whatever greater whole it once belonged to. Make the world feel ancient and dangerous.

PART 2 — THE MAIN PC DISCOVERS IT (1 paragraph):
Introduce ${mainPC?.name}. What were they doing when the shard called to them? Give us their voice, their internal thoughts. The shard CHOSE them — show the moment of recognition, the weight of destiny settling onto their shoulders. They may not understand it yet, but something in them responds.

${companion ? `PART 3 — THE COMPANION'S ORIGIN (1-2 paragraphs):
${companion?.name} is already with ${mainPC?.name}. They did not meet by chance. Create a MINI-ORIGIN STORY explaining their bond:
- WHY are they together? (Shared history, oath, blood, survival, prophecy, debt, love, hate)
- HOW did they meet? (Battle, exile, quest, disaster, childhood, divine mandate)
- WHAT binds them? (Honor, guilt, necessity, friendship, rivalry, family)

Then write DIALOGUE between them — ${companion?.name} speaks and acts according to their ${companion?.align} alignment:
- Lawful Good: Speaks with conviction, references duty/honor, protective, may quote oaths or laws
- Chaotic Good: Speaks freely, values freedom, challenges authority kindly, compassionate but wild
- Lawful Neutral: Speaks precisely, values order and tradition, emotionally reserved, logical
- True Neutral: Speaks pragmatically, balanced view, observes more than judges, calm
- Chaotic Neutral: Speaks unpredictably, values personal freedom, may change subject, impulsive
- Lawful Evil: Speaks with cold formality, respects power, manipulative but bound by code
- Neutral Evil: Speaks selfishly, calculates advantage, may seem friendly but is not
- Chaotic Evil: Speaks wildly, threatens, enjoys chaos, unpredictable and dangerous

Show their dynamic through conversation. One may question, one may warn, one may joke — let their personalities clash or harmonize naturally. The companion should react to the shard with their own perspective.

PART 4 — THE BOND IS FATE (1 paragraph):
Establish that their meeting was NOT happenstance. Perhaps:
- They were drawn together by the same force that created the shard
- One saved the other's life in a way that echoes this moment
- They share a memory or loss connected to something the shard remembers
- A prophecy spoke of them together before either knew the other's name
- Their souls have met in previous ages, and the shard knows this

The companion may not fully understand why they're here, but they KNOW they cannot leave ${mainPC?.name}'s side right now. This is not coincidence. This is design.` : 'PART 3 — THE COMPANION (Not present in this opening)'}

PART ${companion ? '5' : '3'} — THE ANTAGONIST SHADOW (1 paragraph):
Something else noticed the shard. Do not name it. Describe only its effect — a chill in the air, shadows that move wrong, the silence of birds, the way the companion's hand moves to their weapon without conscious thought. The antagonist (a Greater God or Super Monster from DDG) stirs in the distance. The shard knows its enemy. It grows cold, or hot, or heavy in response.

PART ${companion ? '6' : '4'} — THE CHOICE MOMENT:
End the prose exactly at the moment of decision. ${companion ? `${mainPC?.name} holds the shard. ${companion?.name} watches. ` : ''}What happens next depends on what the hero chooses. Leave the action open for the player.

═══════════════════════════════════════════════════════════════════════════
JSON OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════
${companion ? `The companion ${companion.name} is already in the active party (pcs[1]). Do NOT set "next_pc_id" — no PC needs to be added from a queue.` : 'No companion to add.'}
Write the full narrative prose first (800-1200 words minimum for this opening). Then append the JSON state payload.`
    } else {
      userMsg = `TURN ${gs.turn}.
Recent: ${recentLog}
Act: ${gs.act}
${gs.pendingShardSummon ? `${shard?.name} INVOKED — process summoning of "${gs.pendingShardSummon}" with d20 roll (DC10).\n` : ''}${pcIntroStr}${gs.act === ACTS.TWO ? 'Introduce 1-2 gods from the DDG roster this turn. Mix pantheons.\n' : ''}${gs.act === ACTS.THREE ? `BOSS FIGHT: ${ant?.name} Phase ${gs.antagonistPhase}. HP ${gs.antagonistHp}/${gs.antagonistMaxHp}.\n` : ''}

NARRATIVE STYLE — NEIL GAIMAN (1-2 RICH PARAGRAPHS):
Write 1-2 paragraphs of rich, atmospheric prose. Quality over quantity.
- Layer sensory details: the quality of light, texture of surfaces, sounds on the edge of hearing
- Describe atmosphere and mood with specificity
- Include internal character reactions
- Use metaphor and mythic resonance
Make the world feel ancient and dangerous. End with a moment of tension or decision.

Continue building the narrative, execute mechanics, and output JSON at the end.`
    }

    try {
      const res = await callGeminiDM(userMsg, gs, isFirst)

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

      gs.humanPCId = humanPCId
      gs.isProcessing = false

      if (humanPC && !humanPC.dead) {
        const sceneCtx = `Act ${gs.act}, Turn ${gs.turn}. SUMMARY: ${gs.storySummary}\nRECENT: ` + gs.log.slice(0, 3).map(l => l.msg).join(' | ')
        setStatusMessage(`Generating options for ${humanPC.name}...`)

        const opts = await callGroqForOptions(humanPC, sceneCtx, buildDefaultOptions(humanPC))
        gs.humanOptions = opts
        gs.waitingForHuman = true
        gs.pendingHumanChoice = null

        setGameState({ ...gs })
        setStatusMessage(`YOUR TURN — ${humanPC.name}`)
      } else {
        setGameState({ ...gs })
        setStatusMessage(`T${gs.turn} complete — ${living.length} standing`)
      }
    } catch (e) {
      gs.isProcessing = false
      setGameState({ ...gs })
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

    // Narrative
    // Priority: Use dm_narration from response (includes fallback templates) 
    // Only use lastDMNarrative if dm_narration is empty (for backwards compatibility)
    let narr = res.dm_narration || lastDMNarrative || 'The DM gathers thoughts...'
    narr = toAscii(narr)
    const paragraphs = narr.split(/\n\n+/).map(p => p.replace(/\n/g, ' ').trim()).filter(p => p.length > 5)
    
    // Store the exact displayed narrative for TTS - MUST match what's rendered
    const displayedText = paragraphs.slice(0, 12).join(' ')
    setDisplayedNarrative(displayedText)
    
    // Update conversation history for persistent DM memory
    if (res.dm_narration && res.dm_narration.length > 30) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant' as const, content: res.dm_narration.slice(0, 500) }
      ].slice(-15)) // Keep last 15 exchanges
    }

    html += `<div>
      <div style="font-family:Cinzel,serif;font-size:1.2rem;letter-spacing:.16em;color:#7a5f20;text-transform:uppercase;margin-bottom:.6rem;display:flex;align-items:center;gap:.3rem">
        ✦ DM Narration <span style="flex:1;height:1px;background:#2e2008"></span>
      </div>
      <div style="font-size:1.25rem;line-height:2;color:#e8d9b0">
        ${paragraphs.slice(0, 12).map(p => `<p style="text-indent:1.5em;margin-bottom:.85em">${p}</p>`).join('')}
      </div>
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
          <strong style="font-family:Cinzel,serif;font-size:1rem;color:#c9a84c">${toAscii(n.npc_name || '')}</strong>
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
        <div style="font-family:Cinzel,serif;font-size:1.05rem;color:#c9a84c">${pc.name}${pc.id === gs.humanPCId ? ' [YOU]' : ''}</div>
        <div style="color:${hpClass === 'dead' ? '#444' : hpClass === 'crit' ? '#cc2020' : hpClass === 'hurt' ? '#e08040' : '#9a8860'};font-size:1rem;margin-top:3px">
          ${pc.dead ? '✝ SLAIN' : `${pc.hp}/${pc.maxHp} HP`}
        </div>
        ${injuries.length ? `<div style="font-size:.9rem;color:#e08040;margin-top:3px">${injuries.map(i => i.icon).join('')}</div>` : ''}
        ${pc.conditions.length ? `<div style="font-size:.9rem;color:#5a4d30;font-style:italic;margin-top:3px">${pc.conditions.slice(0, 2).join(', ')}</div>` : ''}
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

    html += '</div>'

    appendNarrative(html)
  }

  const appendNarrative = (html: string) => {
    setNarrativeContent(prev => [...prev, { html }])
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
      const sceneCtx = `Act ${newGS.act}, Turn ${newGS.turn}. SUMMARY: ${newGS.storySummary}\nRECENT: ` + newGS.log.slice(0, 3).map(l => l.msg).join(' | ')
      const opts = await callGroqForOptions(nextPC, sceneCtx, buildDefaultOptions(nextPC))
      newGS.humanOptions = opts
      newGS.waitingForHuman = true
      newGS.pendingHumanChoice = null
      newGS.isProcessing = false
      setGameState({ ...newGS })
      setStatusMessage(`YOUR TURN — ${nextPC.name}`)
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
      pendingHumanChoice: idx
    }))
  }

  const confirmChoice = async () => {
    if (gameState.pendingHumanChoice === null || !gameState.waitingForHuman || gameState.isProcessing) return

    const gs = { ...gameState, waitingForHuman: false, isProcessing: true }
    setGameState(gs)

    const humanPC = gs.pcs.find(p => p.id === gs.humanPCId) || gs.pcs.find(p => !p.dead)
    const choiceIdx = Math.min(gs.pendingHumanChoice ?? 0, gs.humanOptions.length - 1)
    const chosen = gs.humanOptions[choiceIdx]
    if (!chosen) return
    const ant = getAntagonist(gs.antagonistId)

    // ═══════════════════════════════════════════════════════════════════════════
    // ARCHRIVAL SUMMON — Special handling for Option 7 in Act III
    // ═══════════════════════════════════════════════════════════════════════════
    const isRivalSummon = chosen?.source === 'archrival_summon' && gs.antagonistBanished && gs.antagonistRival
    let rivalSummoned = false

    setStatusMessage(`Resolving ${humanPC?.name}'s choice...`)

    const userMsg = `TURN ${gs.turn} RESOLUTION.

Human player chose for ${toAscii(humanPC?.name || 'PC')}: "${toAscii(chosen?.action || 'acts')}"[${toAscii(chosen?.ability || '')}].

RESOLVE THIS ACTION:
1. Execute the human's choice with full mechanical detail (d20 vs AC, damage, saves). ROLL DICE.
2. ${gs.act === ACTS.THREE ? `${ant?.name} retaliates with Phase ${gs.antagonistPhase} ability.` : 'Any active NPCs act per their alignment. The antagonist shadow grows.'}
${isRivalSummon ? `3. ⚡ ARCHRIVAL SUMMON EVENT: ${gs.antagonistRival?.name}, ${gs.antagonistRival?.title} has been SUMMONED by the shard to fight alongside the party!\n   - ${gs.antagonistRival?.name} is the mythological archrival of ${ant?.name}.\n   - They deal devastating damage to ${ant?.name} (narrate the legendary confrontation).\n   - The rival's ${gs.antagonistRival?.ability} turns the tide of battle.\n   - This is a CINEMATIC MOMENT — write it with maximum drama and Gaiman-style prose.\n   - Apply state_updates: ~35% of antagonist max HP as damage from the rival's assault.\n   - The rival does NOT join the party permanently — they deliver their blow and fade back into myth.` : '3. Apply dice rolls/damage. Signal injuries (injury_events).'}
4. Full narrative prose, then JSON payload. REMEMBER: ALL PCs are human-controlled, only resolve the current PC's action.`
    
    // Add user choice to conversation history
    setConversationHistory(prev => [
      ...prev,
      { role: 'user' as const, content: `${humanPC?.name}: ${chosen?.action || 'acts'}` }
    ].slice(-15))

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
      // Apply DOT damage immutably — never mutate React state directly
      if (Object.keys(dotDamage).length > 0) {
        gs.pcs = gs.pcs.map(p => {
          const dmg = dotDamage[p.id]
          if (!dmg) return p
          const newHp = Math.max(0, p.hp + dmg)
          return { ...p, hp: newHp, dead: newHp <= 0 ? true : p.dead }
        })
      }
      gs.injuries = newInjuries

      const res = await callGeminiDM(userMsg, gs, false)

      gs.turn++

      let newGS = await applyMechanics(res, gs)
      newGS.humanPCId = res.human_pc_id || newGS.pcs.find(p => !p.dead)?.id || null

      // ═══════════════════════════════════════════════════════════════════════════
      // ARCHRIVAL SUMMON MECHANICAL EFFECTS
      // Applied AFTER applyMechanics so they stack with whatever Gemini resolved
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
        const opts = await callGroqForOptions(nextPC, sceneCtx, buildDefaultOptions(nextPC))
        newGS.humanOptions = opts
        newGS.waitingForHuman = true
        newGS.pendingHumanChoice = null
        newGS.isProcessing = false

        setGameState({ ...newGS })
        setStatusMessage(`YOUR TURN — ${nextPC.name}`)
      } else {
        newGS.isProcessing = false
        setGameState({ ...newGS })
        setStatusMessage(`T${newGS.turn} done — ${living.length} alive`)
      }
    } catch (e) {
      gs.isProcessing = false
      setGameState({ ...gs })
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
      .sort((a, b) => (TIER_CONFIG[b.tier] ? 0 : 1) - (TIER_CONFIG[a.tier] ? 0 : 1))
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

  // ── SHARD INVOKE ───────────────────────────────────────────────────────
  const invokeShard = () => {
    if (!shardSummonName.trim() || gameState.shardDark) return

    const newGS = {
      ...gameState,
      pendingShardSummon: shardSummonName.trim()
    }
    setGameState(newGS)
    setShardDialogOpen(false)
    setShardSummonName('')

    appendNarrative(`<div style="font-size:.95rem;background:linear-gradient(90deg,rgba(80,0,0,.1),rgba(10,0,20,.1));border:1px solid rgba(80,0,0,.26);border-radius:3px;padding:10px 14px;line-height:1.7;font-style:italic;color:${gameState.shardEntry?.color || '#c9a84c'}">
      ${gameState.shardEntry?.name} stirs. You have named <strong>${toAscii(shardSummonName.trim())}</strong>. It will be resolved next turn.
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

  // ── EXPORT STORY ───────────────────────────────────────────────────────
  const exportStory = () => {
    const storyText = narrativeContent.map(n => n.html.replace(/<[^>]*>/g, '')).join('\n\n')
    const blob = new Blob([storyText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mythworld_campaign_turn${gameState.turn}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Story Exported', description: 'Campaign narrative downloaded' })
  }

  return {
    // ── STATE ──────────────────────────────────────────────────────────────
    gameState, setGameState,
    geminiKey, setGeminiKey,
    groqKey, setGroqKey,
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
    actionQueue, setActionQueue,
    portraitModalOpen, setPortraitModalOpen,
    selectedPortrait, setSelectedPortrait,
    conversationHistory, setConversationHistory,
    ttsEnabled, setTtsEnabled,
    ttsVoice, setTtsVoice,
    ttsSpeed, setTtsSpeed,
    isSpeaking, setIsSpeaking,
    audioCache, setAudioCache,
    displayedNarrative, setDisplayedNarrative,
    tokenUsage, setTokenUsage,
    throttleState, setThrottleState,
    // ── REFS ───────────────────────────────────────────────────────────────
    narrRef,
    audioRef,
    optionsCacheRef,
    // ── FUNCTIONS ──────────────────────────────────────────────────────────
    loadSaveSlots,
    saveGame,
    loadGame,
    deleteSave,
    splitTextIntoChunks,
    speakText,
    stopSpeaking,
    speakNarrative,
    fetchAvailableHeroes,
    startNewCampaign,
    confirmPartySelection,
    buildDMSystem,
    callGeminiDM,
    parseDMResponse,
    generateSmartFallback,
    getTemplateFallback,
    callGroqForOptions,
    buildDefaultOptions,
    applyMechanics,
    runTurn,
    renderResult,
    appendNarrative,
    selectOption,
    confirmChoice,
    advanceTurn,
    endCampaign,
    invokeShard,
    handleUseItem,
    exportStory,
    resolveTestOfFaith,
    waitForThrottle,
    estimateTokens,
    updateTokenUsage,
    // Achievement System
    achievementTracker: achievementTrackerRef.current,
    achievementUnlocks,
    showAchievementsDialog,
    setShowAchievementsDialog,
  }
}
