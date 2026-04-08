'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Package, ScrollText, Save, Upload, Flame, Award, Heart, Sparkles, Skull, Volume2, Monitor, Cloud, RefreshCw, Cpu, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { version } from '../../../package.json'

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
  const particles = useMemo(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${2 + Math.random() * 4}px`,
      duration: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 8}s`,
      opacity: 0.2 + Math.random() * 0.5,
      drift: `${(Math.random() - 0.5) * 40}px`,
    })),
  [])

  // LM Studio connection check
  const [lmConnected, setLmConnected] = useState<boolean | null>(null)
  const [lmModels, setLmModels] = useState<{ id: string }[]>([])
  const [lmChecking, setLmChecking] = useState(false)

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
  useEffect(() => {
    if (engineMode === 'lmstudio' || engineMode === 'dual') {
      checkLmConnection()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineMode, lmStudioUrl])

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

  const marqueePortraits = useMemo(() => {
    const idsByCategory: Record<string, string[]> = {
      'greater-gods': ['aegir','ahto','amaterasu','anubis','aphrodite','apollo','ares','arioch','athena','balder','bast','bragi','branchala','brigit','chemosh','corellon','coyote','cthulhu','dagda','death_nehwon','diancecht','dionysus','elric','fenris','fistandantilus','fizban','freya','gilean','goibhnie','gruumsh','habbakuk','hades','hel','hephaestus','hera','hermes','huan_ti','huitzilopochtli','indra','isis','izanagi','jormungandr','khellendros','kos','lakshmi','loki','lord_soth','lu_yueh','lugh','lunitari','ma_yuan','malystryx','marduk','mielikki','mishakal','moradin','morrigan','nergal','nike','nin_hursag','nnuuurrrrc','nuitari','nyarlathotep','odin','osiris','paladine','pan','poseidon','ptah','quetzalcoatl','ra','ramman','reorx','rudra','sargonnas','sekolah','set','shiva','shoggoth','shub_niggurath','silvanus','sirrion','solinari','surtur','susanowo','takhisis','tezcatlipoca','thor','thoth','thrym','tlaloc','tobadzistsini','tou_mu','tyr','ukko','untamo','vishnu','votishal','zeboim','zeus'],
      'heroes': ['arthur','bellerophon','caramon_majere','cthulhu','cuchulainn','derek_crownguard','elric','fafhrd','flint_fireforge','galahad','gareth','gawaine','gilgamesh','gilthanas','goldmoon','gray_mouser','heracles','heracles_hero','hiawatha','hunapu','hunapu_xbalanque','ilmarinen','jason','kitiara_uth_matar','kullervo','lamorak','lancelot','laurana','lemminkainen','merlin','moonglum','morgan_le_fay','movarl','odysseus','palomides','pellinore','perseus','qagwaaz','raiko','raistlin_majere_hero','riverwind','stoneribs','sturm_brightblade','tanis_half_elven','tasslehoff_burrfoot','theseus','tika_waylan','tristram','vainamoinen','yamamoto_date','yoshmye'],
      'demigods': ['aarth','anubis','apshai','bast','beryllinthranox','chao_kung_ming','chih_chiang','chih_chiang_fyu_ya','cyan_bloodbane','derek_crownguard','fei_lien','fileet','fistandantilus','fizban','gods_of_lankhmar','haaashastaak','hachiman','huma_dragonbane','issek','issek_of_jug','ithaqua','kali','karttikeya','kiputytto','lakshmi','laogzed','lord_soth','loviatar','meerclar','nnuuurrrrc','no_cha','oh_kuni_nushi','raistlin_majere_demigod','ratri','spider_god','surma','susanowo','tvashtri','vaprak','votishal','wen_chung','yama'],
      'krynn': ['beryllinthranox','branchala','caramon_majere','chemosh','cyan_bloodbane','derek_crownguard','draconians','fistandantilus','fizban','flint_fireforge','gilean','gilthanas','goldmoon','habbakuk','hiddukel','huma_dragonbane','khellendros','kitiara_uth_matar','laurana','lord_soth','lunitari','malystryx','mishakal','nuitari','paladine','raistlin_majere_demigod','raistlin_majere_hero','reorx','riverwind','sargonnas','shadow_wights','sirrion','solinari','sturm_brightblade','takhisis','tanis_half_elven','tasslehoff_burrfoot','tika_waylan','zeboim'],
      'lesser-gods': ['aegir','artemis','bragi','brigit','coyote','demeter','diancecht','dionysus','druaga','girru','goibhnie','hephaestus','hiddukel','huan_ti','huitzilopochtli','ilmatar','ishtar','kali','lolth','lu_yueh','marduk_lesser','mielikki','morrigan','nergal','nike','nyarlathotep','pan','rat_god','raven','sekolah','shub_niggurath','surtur','thrym','tobadzistsini','tou_mu','untamo'],
      'monsters': ['apep','blodug_hofi','byakhee','cerberus','dark_young','deep_ones','draconians','fenris','ghast','gug','jormungandr','mi_go','nightgaunt','primordial_one','shadow_wights','shoggoth','spawn_cthulhu','thunder_bird'],
    }
    const allPaths: string[] = []
    for (const [cat, ids] of Object.entries(idsByCategory)) {
      for (const id of ids) {
        allPaths.push(`/portraits/${cat}/${id}.png`)
      }
    }
    const shuffled = [...allPaths]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * 7 + 13) % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  // Split into 4 strips for all 4 edges
  const topStrip = useMemo(() => marqueePortraits.filter((_, i) => i % 4 === 0), [marqueePortraits])
  const bottomStrip = useMemo(() => marqueePortraits.filter((_, i) => i % 4 === 1), [marqueePortraits])
  const leftStrip = useMemo(() => marqueePortraits.filter((_, i) => i % 4 === 2), [marqueePortraits])
  const rightStrip = useMemo(() => marqueePortraits.filter((_, i) => i % 4 === 3), [marqueePortraits])

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

        @keyframes intro-bg-fade {
          0%, 20% { opacity: 1; } 25%, 95% { opacity: 0; } 100% { opacity: 1; }
        }
        .intro-bg-slide {
          position: fixed; inset: 0; z-index: 0;
          background-size: cover; background-position: center;
          opacity: 0; animation: intro-bg-fade 28s infinite;
        }
        .intro-bg-slide:nth-child(1) { animation-delay: 0s; }
        .intro-bg-slide:nth-child(2) { animation-delay: 7s; }
        .intro-bg-slide:nth-child(3) { animation-delay: 14s; }
        .intro-bg-slide:nth-child(4) { animation-delay: 21s; }
        .intro-bg-overlay {
          position: fixed; inset: 0; z-index: 1;
          background:
            radial-gradient(ellipse at center, rgba(6,4,3,0.4) 0%, rgba(6,4,3,0.75) 60%, rgba(6,4,3,0.92) 100%),
            linear-gradient(to bottom, rgba(6,4,3,0.5) 0%, rgba(6,4,3,0.3) 40%, rgba(6,4,3,0.6) 100%);
        }

        /* === HORIZONTAL MARQUEE (top/bottom) === */
        @keyframes marquee-h {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .mq-h {
          position: fixed; left: 0; right: 0; z-index: 2;
          display: flex; align-items: center; overflow: hidden; pointer-events: none;
        }
        .mq-h--top {
          top: 0; height: 146px;
          background: linear-gradient(to bottom, rgba(6,4,3,0.95) 0%, rgba(6,4,3,0.7) 50%, transparent 100%);
        }
        .mq-h--bot {
          bottom: 0; height: 146px;
          background: linear-gradient(to top, rgba(6,4,3,0.95) 0%, rgba(6,4,3,0.7) 50%, transparent 100%);
        }
        .mq-h--bot .mq-h__track { animation-direction: reverse; }
        .mq-h__track {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 0; animation: marquee-h 200s linear infinite; width: max-content;
        }
        .mq-h__item {
          width: 72px; height: 126px; border-radius: 6px; object-fit: contain;
          border: 1.5px solid rgba(212,175,55,0.35); opacity: 0.65; flex-shrink: 0;
          background: #0d0906; box-shadow: 0 3px 12px rgba(0,0,0,0.5);
        }

        /* === VERTICAL MARQUEE (left/right) === */
        @keyframes marquee-v-down {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marquee-v-up {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .mq-v {
          position: fixed; top: 0; bottom: 0; z-index: 2;
          display: flex; flex-direction: column; align-items: center;
          overflow: hidden; pointer-events: none;
        }
        .mq-v--left {
          left: 0; width: 84px;
          background: linear-gradient(to right, rgba(6,4,3,0.95) 0%, rgba(6,4,3,0.7) 40%, transparent 100%);
        }
        .mq-v--right {
          right: 0; width: 84px;
          background: linear-gradient(to left, rgba(6,4,3,0.95) 0%, rgba(6,4,3,0.7) 40%, transparent 100%);
        }
        .mq-v--left .mq-v__track { animation: marquee-v-down 250s linear infinite; }
        .mq-v--right .mq-v__track { animation: marquee-v-up 250s linear infinite; }
        .mq-v__track {
          display: flex; flex-direction: column; gap: 10px;
          padding: 14px 0; width: max-content;
        }
        .mq-v__item {
          width: 72px; height: 126px; border-radius: 6px; object-fit: contain;
          border: 1.5px solid rgba(212,175,55,0.35); opacity: 0.6; flex-shrink: 0;
          background: #0d0906; box-shadow: 0 3px 12px rgba(0,0,0,0.5);
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-ember, .parallax-layer-fog, .parallax-layer-runes,
          .btn-begin-legend, .intro-bg-slide,
          .mq-h__track, .mq-v__track { animation: none !important; }
          .intro-ember { display: none; }
          .intro-bg-slide { opacity: 0; }
          .intro-bg-slide:nth-child(1) { opacity: 1; }
        }
      `}</style>

      {/* Background crossfade */}
      <div className="intro-bg-slide" style={{ backgroundImage: 'url(/images/intro/dragon.png)' }} />
      <div className="intro-bg-slide" style={{ backgroundImage: 'url(/images/intro/hero.png)' }} />
      <div className="intro-bg-slide" style={{ backgroundImage: 'url(/images/intro/god.png)' }} />
      <div className="intro-bg-slide" style={{ backgroundImage: 'url(/images/intro/monster.png)' }} />
      <div className="intro-bg-overlay" />

      {/* TOP horizontal marquee (scrolls left) */}
      <div className="mq-h mq-h--top" aria-hidden="true">
        <div className="mq-h__track">
          {[...topStrip, ...topStrip].map((src, i) => (
            <img key={`t-${i}`} src={src} alt="" className="mq-h__item" loading="lazy" />
          ))}
        </div>
      </div>

      {/* BOTTOM horizontal marquee (scrolls right) */}
      <div className="mq-h mq-h--bot" aria-hidden="true">
        <div className="mq-h__track">
          {[...bottomStrip, ...bottomStrip].map((src, i) => (
            <img key={`b-${i}`} src={src} alt="" className="mq-h__item" loading="lazy" />
          ))}
        </div>
      </div>

      {/* LEFT vertical marquee (scrolls down) */}
      <div className="mq-v mq-v--left" aria-hidden="true">
        <div className="mq-v__track">
          {[...leftStrip, ...leftStrip].map((src, i) => (
            <img key={`l-${i}`} src={src} alt="" className="mq-v__item" loading="lazy" />
          ))}
        </div>
      </div>

      {/* RIGHT vertical marquee (scrolls up) */}
      <div className="mq-v mq-v--right" aria-hidden="true">
        <div className="mq-v__track">
          {[...rightStrip, ...rightStrip].map((src, i) => (
            <img key={`r-${i}`} src={src} alt="" className="mq-v__item" loading="lazy" />
          ))}
        </div>
      </div>

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
      <div className="relative z-10 w-full max-w-2xl mx-auto" style={{ padding: '0 50px' }}>
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
                    <Cloud className="w-3 h-3" /> Gemini
                  </button>
                  <button
                    onClick={() => { setEngineMode('dual'); setAiProvider('lmstudio'); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all ${
                      engineMode === 'dual'
                        ? 'bg-[rgba(100,180,255,.12)] text-[#60a0f0] border border-[#60a0f0]'
                        : 'text-[#5a4d30] border border-[#2e2008] hover:text-[#8a7a50]'
                    }`}
                    style={{ fontFamily: 'Cinzel, serif' }}>
                    <Zap className="w-3 h-3" /> Dual
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
                    <span className="text-[#9a8860] text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>Gemini Key</span>
                    <Input type="password" placeholder="AIza..." value={geminiKey}
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
                  ? 'Key auto-saves to browser \u00b7 Direct calls to Gemini'
                  : engineMode === 'dual'
                    ? 'Dual Engine \u00b7 Mechanics locally + narration via cloud'
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
                <Button onClick={startNewCampaign} disabled={engineMode === 'gemini' ? !geminiKey : !lmConnected}
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
  )
}
