'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Package, ScrollText, Save, Upload, Flame, Award, Heart, Sparkles, Skull, Volume2, Monitor, Cloud, RefreshCw, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { version } from '../../../package.json'
import { ALL_CHARACTERS } from '@/lib/characterData'
import type { Character } from '@/lib/characterTypes'
import CharacterCard from '@/components/game/CharacterCard'

export interface IntroScreenProps {
  geminiKey: string
  setGeminiKey: (key: string) => void
  aiProvider: 'gemini' | 'lmstudio'
  setAiProvider: (provider: 'gemini' | 'lmstudio') => void
  engineMode: 'gemini' | 'lmstudio' | 'dual'
  setEngineMode: (mode: 'gemini' | 'lmstudio' | 'dual') => void
  lmStudioUrl: string
  setLmStudioUrl: (url: string) => void
  lmStudioModel: string
  setLmStudioModel: (model: string) => void
  startNewCampaign: () => void
  saveSlots: { id: string; name: string; timestamp: number; turn: number; act: string; partyNames: string[] }[]
  setShowLoadDialog: (open: boolean) => void
}

export function IntroScreen({
  geminiKey, setGeminiKey,
  aiProvider, setAiProvider,
  engineMode, setEngineMode,
  lmStudioUrl, setLmStudioUrl,
  lmStudioModel, setLmStudioModel,
  startNewCampaign,
  saveSlots,
  setShowLoadDialog,
}: IntroScreenProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    left: string
    size: string
    duration: string
    delay: string
    opacity: number
    drift: string
  }>>([])

  // LM Studio connection check
  const [lmConnected, setLmConnected] = useState<boolean | null>(null)
  const [lmModels, setLmModels] = useState<{ id: string }[]>([])
  const [lmChecking, setLmChecking] = useState(false)
  const [cardQueue, setCardQueue] = useState<Character[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [cardFading, setCardFading] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const touchStartYRef = React.useRef<number | null>(null)

  const checkLmConnection = async () => {
    setLmChecking(true)
    try {
      const r = await fetch(`/api/lmstudio?url=${encodeURIComponent(lmStudioUrl)}`)
      const data = await r.json()
      setLmConnected(data.connected)
      if (data.models?.length > 0) {
        setLmModels(data.models)
        // Auto-select first model if still on default
        if (lmStudioModel === 'default') {
          setLmStudioModel(data.models[0].id)
        }
      } else {
        setLmModels([])
      }
    } catch {
      setLmConnected(false)
      setLmModels([])
    }
    setLmChecking(false)
  }

  // Auto-check LM Studio connection when engine mode uses LM Studio
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (engineMode === 'lmstudio' || engineMode === 'dual') {
      checkLmConnection()
    }
  }, [engineMode, lmStudioUrl])

  // Build ember particles client-side only to avoid SSR hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setParticles(
      Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 4}px`,
        duration: `${6 + Math.random() * 10}s`,
        delay: `${Math.random() * 8}s`,
        opacity: 0.2 + Math.random() * 0.5,
        drift: `${(Math.random() - 0.5) * 40}px`,
      })),
    )
  }, [])

  const titleText = 'DEITIES & DEMIGODS'
  const titleLetters = titleText.split('')

  const features = [
    { icon: <Users className="w-4 h-4" />, label: 'Choose Your Hero', desc: '286+ characters' },
    { icon: <Package className="w-4 h-4" />, label: 'Inventory', desc: '35+ artifacts' },
    { icon: <ScrollText className="w-4 h-4" />, label: 'Quests', desc: 'Main & side' },
    { icon: <Save className="w-4 h-4" />, label: 'Save/Load', desc: '5 slots' },
    { icon: <Flame className="w-4 h-4" />, label: 'Shards', desc: '30 shards' },
    { icon: <Award className="w-4 h-4" />, label: 'Achievements', desc: '57 total' },
    { icon: <Heart className="w-4 h-4" />, label: 'Injuries', desc: '25 wounds' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'Prophecies', desc: '9 fates' },
    { icon: <Skull className="w-4 h-4" />, label: 'Boss Fights', desc: '3-phase' },
    { icon: <Volume2 className="w-4 h-4" />, label: 'Voice', desc: 'AI TTS' },
  ]

  const allCharacters = useMemo(() => {
    const validCategories = new Set(['greater-gods', 'demigods', 'heroes', 'krynn', 'lesser-gods', 'monsters'])
    const items = ALL_CHARACTERS.filter(c => validCategories.has(c.category))
    const seen = new Set<string>()
    return items.filter(item => {
      const key = `${item.category}:${item.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [])

  const shuffleCharacters = (items: Character[]): Character[] => {
    const shuffled = [...items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!allCharacters.length) return
    const shuffled = shuffleCharacters(allCharacters)
    setCardQueue(shuffled)
    setActiveIndex(0)
  }, [allCharacters.length])

  useEffect(() => {
    if (!cardQueue.length) return
    const timer = setInterval(() => {
      setCardFading(true)
      window.setTimeout(() => {
        setActiveIndex(prev => {
          const next = prev + 1
          if (next < cardQueue.length) return next
          setCardQueue(shuffleCharacters(allCharacters))
          return 0
        })
        setCardFading(false)
      }, 500)
    }, 5000)
    return () => clearInterval(timer)
  }, [cardQueue, allCharacters])

  const activeCharacter = cardQueue[activeIndex] || allCharacters[0] || null
  const nextCharacter = cardQueue[(activeIndex + 1) % Math.max(1, cardQueue.length)] || null
  const portraitCount = allCharacters.length

  useEffect(() => {
    if (!nextCharacter || typeof window === 'undefined') return
    const preload = new Image()
    preload.src = `/portraits/${nextCharacter.category}/${nextCharacter.id}.png`
  }, [nextCharacter?.id, nextCharacter?.category])

  return (
    <div className="min-h-screen bg-[#060403] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap');

        @keyframes intro-ember-rise {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: var(--ember-opacity, 0.4); }
          90% { opacity: var(--ember-opacity, 0.4); }
          100% { transform: translateY(-20vh) translateX(var(--ember-drift, 0px)); opacity: 0; }
        }
        .intro-ember {
          position: fixed; border-radius: 50%;
          background: radial-gradient(circle, #f0c860, #d4af37);
          pointer-events: none; z-index: 1;
          animation: intro-ember-rise var(--ember-duration, 8s) var(--ember-delay, 0s) infinite ease-out;
        }

        @keyframes parallax-fog-drift {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(12px); }
        }
        .parallax-layer-deep {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(160,80,40,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(60,40,20,0.05) 0%, transparent 60%);
        }
        .parallax-layer-fog {
          position: fixed; inset: -20px; z-index: 0; opacity: 0.3;
          background: radial-gradient(ellipse at 30% 60%, rgba(42,32,16,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 40%, rgba(26,21,16,0.5) 0%, transparent 60%);
          animation: parallax-fog-drift 20s ease-in-out infinite;
        }
        .parallax-layer-runes {
          position: fixed; inset: 0; z-index: 0; opacity: 0.04;
          background-image: radial-gradient(circle at 15% 25%, rgba(212,175,55,0.5) 1px, transparent 1px),
            radial-gradient(circle at 85% 15%, rgba(212,175,55,0.5) 1px, transparent 1px),
            radial-gradient(circle at 50% 80%, rgba(212,175,55,0.5) 1px, transparent 1px);
          background-size: 120px 120px, 100px 100px, 150px 150px;
          animation: parallax-fog-drift 30s ease-in-out infinite reverse;
        }

        @keyframes btn-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes btn-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.05); }
          50% { box-shadow: 0 0 35px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.08); }
        }
        .btn-begin-legend {
          animation: btn-glow-pulse 2.5s ease-in-out infinite;
          background-size: 200% auto;
          background-image: linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 25%, rgba(240,200,96,0.15) 50%, rgba(212,175,55,0.08) 75%, transparent 100%);
          animation: btn-shimmer 4s linear infinite, btn-glow-pulse 2.5s ease-in-out infinite;
        }

        .intro-bg-overlay {
          position: fixed; inset: 0; z-index: 1;
          background:
            radial-gradient(ellipse at center, rgba(6,4,3,0.4) 0%, rgba(6,4,3,0.75) 60%, rgba(6,4,3,0.92) 100%),
            linear-gradient(to bottom, rgba(6,4,3,0.5) 0%, rgba(6,4,3,0.3) 40%, rgba(6,4,3,0.6) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-ember, .parallax-layer-fog, .parallax-layer-runes,
          .btn-begin-legend { animation: none !important; }
          .intro-ember { display: none; }
        }
      `}</style>

      <div className="intro-bg-overlay" />


      {/* Parallax layers */}
      <div className="parallax-layer-deep" />
      <div className="parallax-layer-fog" />
      <div className="parallax-layer-runes" />

      {/* Ember particles */}
      {particles.map(p => (
        <div key={p.id} className="intro-ember" style={{
          left: p.left, width: p.size, height: p.size,
          '--ember-duration': p.duration, '--ember-delay': p.delay,
          '--ember-opacity': p.opacity, '--ember-drift': p.drift,
        } as React.CSSProperties} />
      ))}

      {/* MAIN CONTENT - centered, z-10, with side padding for vertical marquees */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-4">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }} className="mb-3">
            <span className="inline-block text-4xl sm:text-5xl"
              style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))', animation: 'pulse-glow 3s infinite' }}>
              {'\u2726'}
            </span>
          </motion.div>

          <motion.h1 className="flex justify-center flex-wrap"
            style={{ fontFamily: '"Cinzel Decorative", serif' }}
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}>
            {titleLetters.map((char, i) => (
              <motion.span key={i} className="inline-block" style={{
                fontSize: 'clamp(1.2rem, 2.2vw, 1.8rem)', color: '#f0c860',
                letterSpacing: '0.16em', textShadow: '0 0 10px rgba(200,160,60,0.2)',
              }} variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.4, ease: 'easeOut' } },
              }}>
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle - positioned safely below title, above card */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }} className="mt-2"
            style={{ fontFamily: 'Cinzel, serif', fontSize: '.65rem', color: '#9a8860',
              letterSpacing: '.25em', textTransform: 'uppercase' }}>
            Mythworld Engine &middot; AI-Powered D&D
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start mt-3">
          <div className="md:col-span-3">
            <div className="text-center mb-2 text-[10px] text-[#9a8860]" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.08em' }}>
              CHARACTER CARD SHOWCASE · {portraitCount} portraits
            </div>
            {activeCharacter && (
              <>
                <div className="hidden md:block">
                  <div className={cardFading ? 'card-fade-exit' : 'card-fade-enter'}>
                    <CharacterCard character={activeCharacter} />
                  </div>
                </div>
                <div className="md:hidden">
                  <button
                    className="w-full"
                    onClick={() => setCardModalOpen(true)}
                    onTouchStart={() => setCardModalOpen(true)}
                  >
                    <CharacterCard character={activeCharacter} compact />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="md:col-span-2">
        {/* Compact Main Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}>
          <Card className="w-full bg-[#110d07]/90 backdrop-blur-sm border-[#2e2008]">
            <CardContent className="p-4">
              {/* Lore quote - compact */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="text-[#9a8860] text-center mb-4 italic leading-relaxed text-sm"
                style={{ fontFamily: '"IM Fell English", serif' }}>
                There is an object. It has had several names. The people who found it gave it names the way people give names to things they cannot explain: carefully, with a kind of reverence that is indistinguishable from fear. Each time a new campaign begins, the object has a different name. The gods do not play fair. And sometimes, the prophecy chooses the wrong hero on purpose.
              </motion.p>

              <div className="text-center mb-3">
                <span className="text-[#7a5f20] text-xs" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.15em' }}>
                  {'\u2726'} Created by JeTZone2k26 {'\u2726'}
                </span>
                <span className="text-[#5a4d30] text-[10px] ml-2">v{version}</span>
              </div>

              {/* AI Engine Mode Selector */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.4 }} className="space-y-3">

                {/* Engine mode toggle — 3 options */}
                <div className="flex gap-1.5 justify-center">
                  <button
                    onClick={() => { setEngineMode('gemini'); setAiProvider('gemini'); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                      engineMode === 'gemini'
                        ? 'bg-[rgba(212,175,55,.15)] text-[#d4af37] border border-[#d4af37]'
                        : 'text-[#5a4d30] border border-[#2e2008] hover:text-[#8a7a50]'
                    }`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    <Cloud className="w-3 h-3" /> Cloud AI
                  </button>
                  <button
                    onClick={() => { setEngineMode('dual'); setAiProvider('lmstudio'); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                      engineMode === 'dual'
                        ? 'bg-[rgba(100,180,255,.12)] text-[#60a0f0] border border-[#60a0f0]'
                        : 'text-[#5a4d30] border border-[#2e2008] hover:text-[#8a7a50]'
                    }`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    <Zap className="w-3 h-3" /> Hybrid
                  </button>
                  <button
                    onClick={() => { setEngineMode('lmstudio'); setAiProvider('lmstudio'); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                      engineMode === 'lmstudio'
                        ? 'bg-[rgba(212,175,55,.15)] text-[#d4af37] border border-[#d4af37]'
                        : 'text-[#5a4d30] border border-[#2e2008] hover:text-[#8a7a50]'
                    }`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    <Monitor className="w-3 h-3" /> Local
                  </button>
                </div>



                {engineMode === 'gemini' ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-[#9a8860] text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>OpenRouter Key</span>
                    <Input type="password" placeholder="sk-or-v1-..." value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      className="flex-1 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30] h-8 text-xs" />
                    <Badge className="bg-[#0a2820] text-[#40c0a0] border-[#208060] text-[10px]">AI</Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* LM Studio URL */}
                    <div className="flex gap-2 items-center">
                      <span className="text-[#9a8860] text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>URL</span>
                      <Input type="text" placeholder="http://localhost:1234" value={lmStudioUrl}
                        onChange={e => setLmStudioUrl(e.target.value)}
                        className="flex-1 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30] h-8 text-xs" />
                      <button
                        onClick={checkLmConnection}
                        disabled={lmChecking}
                        className="p-1.5 rounded bg-[#110d07] border border-[#2e2008] text-[#9a8860] hover:text-[#d4af37] transition-colors disabled:opacity-40"
                        title="Test connection">
                        <RefreshCw className={`w-3 h-3 ${lmChecking ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Connection status */}
                    <div className="flex items-center gap-1.5 px-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        lmConnected === null ? 'bg-[#5a4d30]' :
                        lmConnected ? 'bg-[#40c080]' : 'bg-[#c04040]'
                      }`} />
                      <span className="text-[9px] text-[#5a4d30]">
                        {lmChecking ? 'Checking...' :
                         lmConnected === null ? 'Not tested' :
                         lmConnected ? `Connected — ${lmModels.length} model${lmModels.length !== 1 ? 's' : ''} loaded` :
                         'LM Studio not running or wrong URL'}
                      </span>
                    </div>

                    {/* Model selector (only when connected) */}
                    {lmConnected && lmModels.length > 0 && (
                      <div className="flex gap-2 items-center">
                        <span className="text-[#9a8860] text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>Model</span>
                        <select
                          value={lmStudioModel}
                          onChange={e => setLmStudioModel(e.target.value)}
                          className="flex-1 bg-[#110d07] border border-[#2e2008] text-[#e8d9b0] text-xs rounded px-2 py-1.5 h-8"
                        >
                          {lmModels.map(m => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              <p className="text-[#5a4d30] text-[10px] text-center mt-1 italic">
                {engineMode === 'gemini'
                  ? 'Server proxy mode \u00b7 OpenRouter key optional'
                  : engineMode === 'dual'
                    ? 'Hybrid Engine \u00b7 Mechanics locally + narration via cloud AI'
                    : 'Local LLM \u00b7 No API key needed \u00b7 Runs on your machine'}
              </p>

              {/* Links */}
              <div className="flex items-center justify-center gap-3 text-[#5a4d30] mt-3">
                <a href="/rulebook" className="text-[#40a070] text-[10px] hover:text-[#60e0a0] inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                  <BookOpen className="w-3 h-3" /> Guide
                </a>
                <span className="text-[#3a3020]">&middot;</span>
                <a href="/dm-handbook" className="text-[#40a070] text-[10px] hover:text-[#60e0a0] inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                  <ScrollText className="w-3 h-3" /> DM Handbook
                </a>
                <span className="text-[#3a3020]">&middot;</span>
                <a href="/codex" className="text-[#40a070] text-[10px] hover:text-[#60e0a0] inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                  <BookOpen className="w-3 h-3" /> Codex
                </a>
              </div>

              {/* Begin button */}
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                <Button onClick={startNewCampaign} disabled={engineMode !== 'gemini' && !lmConnected}
                  className="btn-begin-legend bg-gradient-to-b from-[#4e3300] to-[#2b1800] hover:from-[#6e4800] hover:to-[#422600] text-[#f0c860] border border-[#7a5f20] px-6 sm:px-10 py-2.5 sm:py-3 text-sm transition-all disabled:opacity-40 disabled:animate-none"
                  style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.17em' }}>
                  {'\u2694'} Begin Your Legend {'\u2694'}
                </Button>
                {saveSlots.length > 0 && (
                  <Button onClick={() => setShowLoadDialog(true)} variant="outline"
                    className="border-[#5a4018] text-[#9a8860] hover:bg-[#1a1205] px-5 py-2.5 text-sm"
                    style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.1em' }}>
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Load Save
                  </Button>
                )}
              </div>

              {/* Compact feature grid */}
              <div className="mt-5 grid grid-cols-5 gap-1.5">
                {features.map((feature, i) => (
                  <div key={i} className="text-center p-2 bg-[#181208] border border-[#2e2008] rounded">
                    <div className="text-[#c9a84c] mb-0.5 flex justify-center">{feature.icon}</div>
                    <div className="text-[9px] text-[#9a8860] leading-tight" style={{ fontFamily: 'Cinzel, serif' }}>{feature.label}</div>
                    <div className="text-[8px] text-[#5a4d30]">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
          </div>
        </div>
      </div>

      {cardModalOpen && activeCharacter && (
        <div
          className="card-modal"
          onClick={() => setCardModalOpen(false)}
          onTouchStart={(e) => { touchStartYRef.current = e.touches[0]?.clientY ?? null }}
          onTouchEnd={(e) => {
            const startY = touchStartYRef.current
            const endY = e.changedTouches[0]?.clientY ?? startY ?? 0
            if (startY !== null && endY - startY > 50) setCardModalOpen(false)
          }}
        >
          <div className="card-modal__panel" onClick={(e) => e.stopPropagation()}>
            <button className="card-modal__close" onClick={() => setCardModalOpen(false)}>X</button>
            <CharacterCard character={activeCharacter} />
          </div>
        </div>
      )}
    </div>
  )
}
