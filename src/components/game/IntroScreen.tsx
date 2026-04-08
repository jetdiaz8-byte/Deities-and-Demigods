'use client'

import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Package, ScrollText, Save, Upload, Flame, Award, Heart, Sparkles, Skull, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { version } from '../../../package.json'

export interface IntroScreenProps {
  geminiKey: string
  setGeminiKey: (key: string) => void
  startNewCampaign: () => void
  saveSlots: { id: string; name: string; timestamp: number; turn: number; act: string; partyNames: string[] }[]
  setShowLoadDialog: (open: boolean) => void
}

export function IntroScreen({
  geminiKey, setGeminiKey,
  startNewCampaign,
  saveSlots,
  setShowLoadDialog,
}: IntroScreenProps) {
  // Generate golden ember particles
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

  // Title letters for stagger animation
  const titleText = 'DEITIES & DEMIGODS'
  const titleLetters = titleText.split('')

  const subtitleText = 'Mythworld Engine · AI-Powered D&D'

  const features = [
    { icon: <Users className="w-5 h-5" />, label: 'Choose Your Hero', desc: 'Select from 155+ characters' },
    { icon: <Package className="w-5 h-5" />, label: 'Inventory', desc: '35+ artifacts & potions' },
    { icon: <ScrollText className="w-5 h-5" />, label: 'Quests', desc: 'Main, side & hidden quests' },
    { icon: <Save className="w-5 h-5" />, label: 'Save/Load', desc: '5 save slots' },
    { icon: <Flame className="w-5 h-5" />, label: 'Shards', desc: '30 shards, 11+ pantheons' },
    { icon: <Award className="w-5 h-5" />, label: 'Achievements', desc: '57 across 7 tiers' },
    { icon: <Heart className="w-5 h-5" />, label: 'Injuries', desc: '25 wound types' },
    { icon: <Sparkles className="w-5 h-5" />, label: 'Prophecies', desc: '9 Gaiman-style fates' },
    { icon: <Skull className="w-5 h-5" />, label: 'Boss Fights', desc: '3-phase god battles' },
    { icon: <Volume2 className="w-5 h-5" />, label: 'Voice Narration', desc: 'AI-powered TTS' },
  ]

  return (
    <div className="min-h-screen bg-[#060403] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=IM+Fell+English:ital@0;1&display=swap');

        /* ── Ember Particle Animation ── */
        @keyframes intro-ember-rise {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--ember-opacity, 0.4);
          }
          90% {
            opacity: var(--ember-opacity, 0.4);
          }
          100% {
            transform: translateY(-20vh) translateX(var(--ember-drift, 0px));
            opacity: 0;
          }
        }

        .intro-ember {
          position: fixed;
          border-radius: 50%;
          background: radial-gradient(circle, #f0c860, #d4af37);
          pointer-events: none;
          z-index: 1;
          animation: intro-ember-rise var(--ember-duration, 8s) var(--ember-delay, 0s) infinite ease-out;
        }

        /* ── Parallax Background Layers ── */
        @keyframes parallax-fog-drift {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(12px); }
        }

        @keyframes parallax-rune-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .parallax-layer-deep {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(160,80,40,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(60,40,20,0.05) 0%, transparent 60%);
        }

        .parallax-layer-fog {
          position: fixed;
          inset: -20px;
          z-index: 0;
          opacity: 0.3;
          background:
            radial-gradient(ellipse at 30% 60%, rgba(42,32,16,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 40%, rgba(26,21,16,0.5) 0%, transparent 60%);
          animation: parallax-fog-drift 20s ease-in-out infinite;
        }

        .parallax-layer-runes {
          position: fixed;
          inset: 0;
          z-index: 0;
          opacity: 0.04;
          background-image: 
            radial-gradient(circle at 15% 25%, rgba(212,175,55,0.5) 1px, transparent 1px),
            radial-gradient(circle at 85% 15%, rgba(212,175,55,0.5) 1px, transparent 1px),
            radial-gradient(circle at 50% 80%, rgba(212,175,55,0.5) 1px, transparent 1px),
            radial-gradient(circle at 25% 70%, rgba(212,175,55,0.3) 1px, transparent 1px),
            radial-gradient(circle at 75% 60%, rgba(212,175,55,0.3) 1px, transparent 1px);
          background-size: 120px 120px, 100px 100px, 150px 150px, 80px 80px, 110px 110px;
          animation: parallax-fog-drift 30s ease-in-out infinite reverse;
        }

        /* ── Button Shimmer ── */
        @keyframes btn-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes btn-glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.05); }
          50% { box-shadow: 0 0 35px rgba(212,175,55,0.45), inset 0 1px 0 rgba(255,255,255,0.08); }
        }

        .btn-begin-legend {
          animation: btn-glow-pulse 2.5s ease-in-out infinite;
          background-size: 200% auto;
          background-image: linear-gradient(
            90deg,
            transparent 0%,
            rgba(212,175,55,0.08) 25%,
            rgba(240,200,96,0.15) 50%,
            rgba(212,175,55,0.08) 75%,
            transparent 100%
          );
          animation: btn-shimmer 4s linear infinite, btn-glow-pulse 2.5s ease-in-out infinite;
        }

        /* ── Cinematic Background Crossfade ── */
        @keyframes intro-bg-fade {
          0%, 20% { opacity: 1; }
          25%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }

        .intro-bg-slide {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          animation: intro-bg-fade 28s infinite;
        }

        .intro-bg-slide:nth-child(1) { animation-delay: 0s; }
        .intro-bg-slide:nth-child(2) { animation-delay: 7s; }
        .intro-bg-slide:nth-child(3) { animation-delay: 14s; }
        .intro-bg-slide:nth-child(4) { animation-delay: 21s; }

        .intro-bg-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(ellipse at center, rgba(6,4,3,0.4) 0%, rgba(6,4,3,0.75) 60%, rgba(6,4,3,0.92) 100%),
            linear-gradient(to bottom, rgba(6,4,3,0.5) 0%, rgba(6,4,3,0.3) 40%, rgba(6,4,3,0.6) 100%);
        }

        /* ── Reduced Motion ── */
        @media (prefers-reduced-motion: reduce) {
          .intro-ember,
          .parallax-layer-fog,
          .parallax-layer-runes,
          .btn-begin-legend,
          .intro-bg-slide {
            animation: none !important;
          }
          .intro-ember { display: none; }
          .intro-bg-slide { opacity: 0; }
          .intro-bg-slide:nth-child(1) { opacity: 1; }
        }
      `}</style>

      {/* ═══ CINEMATIC FULL-BLEED BACKGROUNDS ═══ */}
      <div
        className="intro-bg-slide"
        style={{ backgroundImage: 'url(/images/intro/dragon.png)' }}
      />
      <div
        className="intro-bg-slide"
        style={{ backgroundImage: 'url(/images/intro/hero.png)' }}
      />
      <div
        className="intro-bg-slide"
        style={{ backgroundImage: 'url(/images/intro/god.png)' }}
      />
      <div
        className="intro-bg-slide"
        style={{ backgroundImage: 'url(/images/intro/monster.png)' }}
      />
      {/* Dark vignette overlay for text readability */}
      <div className="intro-bg-overlay" />

      {/* ═══ PARALLAX BACKGROUND LAYERS ═══ */}
      <div className="parallax-layer-deep" />
      <div className="parallax-layer-fog" />
      <div className="parallax-layer-runes" />

      {/* ═══ FLOATING EMBER PARTICLES ═══ */}
      {particles.map(p => (
        <div
          key={p.id}
          className="intro-ember"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            '--ember-duration': p.duration,
            '--ember-delay': p.delay,
            '--ember-opacity': p.opacity,
            '--ember-drift': p.drift,
          } as React.CSSProperties}
        />
      ))}

      {/* ═══ MAIN CONTENT (z-10, above particles) ═══ */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Title Section */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-4"
          >
            <span
              className="inline-block text-5xl sm:text-6xl"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))',
                animation: 'pulse-glow 3s infinite',
              }}
            >
              ✦
            </span>
          </motion.div>

          <motion.h1
            className="flex justify-center flex-wrap"
            style={{ fontFamily: '"Cinzel Decorative", serif' }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
          >
            {titleLetters.map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                style={{
                  fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)',
                  color: '#f0c860',
                  letterSpacing: '0.16em',
                  textShadow: '0 0 10px rgba(200,160,60,0.2)',
                }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: i * 0.04,
                      duration: 0.4,
                      ease: 'easeOut',
                    },
                  },
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '.75rem',
              color: '#9a8860',
              letterSpacing: '.25em',
              textTransform: 'uppercase',
            }}
            className="mt-3"
          >
            {subtitleText}
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Card className="w-full bg-[#110d07]/90 backdrop-blur-sm border-[#2e2008]">
            <CardContent className="p-6">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="text-[#9a8860] text-center mb-6 italic leading-relaxed"
                style={{ fontFamily: '"IM Fell English", serif' }}
              >
                There is an object. It has had several names. The people who found it gave it names the way people give names to things they cannot explain: carefully, with a kind of reverence that is indistinguishable from fear.
                <br /><br />
                Each time a new campaign begins, the object has a different name. Each time, the gods react differently. Each time, the heroes are different, and what they lose along the way is different.
                <br /><br />
                The gods do not play fair. The stories do not end cleanly. And sometimes, the prophecy chooses the wrong hero on purpose.
                <br /><br />
                <span className="text-[#7a5f20] not-italic text-sm" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.15em' }}>
                  ✦ Created by the imagination of JeTZone2k26 ✦
                </span>
                <br />
                <span className="text-[#5a4d30] not-italic text-xs" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.1em' }}>
                  v{version}
                </span>
                <br />
                <span className="text-[#c9a84c] not-italic" style={{ fontFamily: 'Cinzel, serif', fontSize: '.8rem', letterSpacing: '.1em' }}>
                  Enter your key. Let the story begin.
                </span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.4 }}
                className="space-y-4"
              >
                <div className="flex gap-3 items-center">
                  <span className="text-[#9a8860] text-xs uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'Cinzel, serif' }}>Gemini 2.5 Key</span>
                  <Input
                    type="password"
                    placeholder="AIza... — aistudio.google.com"
                    value={geminiKey}
                    onChange={e => setGeminiKey(e.target.value)}
                    className="flex-1 bg-[#110d07] border-[#2e2008] text-[#e8d9b0] placeholder:text-[#5a4d30]"
                  />
                  <Badge className="bg-[#0a2820] text-[#40c0a0] border-[#208060]">AI</Badge>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.4 }}
                className="text-[#5a4d30] text-xs text-center mt-4 italic"
              >
                Key auto-saves to browser memory · Direct browser calls to Gemini
              </motion.p>

              {/* Help Links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.4 }}
                className="text-center mt-4"
              >
                <div className="flex items-center justify-center gap-4 text-[#5a4d30]">
                  <a href="/rulebook" className="text-[#40a070] text-xs hover:text-[#60e0a0] transition-colors inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                    <BookOpen className="w-3.5 h-3.5" />
                    Player&apos;s Guide
                  </a>
                  <span className="text-[#3a3020]">·</span>
                  <a href="/dm-handbook" className="text-[#40a070] text-xs hover:text-[#60e0a0] transition-colors inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                    <ScrollText className="w-3.5 h-3.5" />
                    DM Handbook
                  </a>
                  <span className="text-[#3a3020]">·</span>
                  <a href="/codex" className="text-[#40a070] text-xs hover:text-[#60e0a0] transition-colors inline-flex items-center gap-1" style={{ fontFamily: 'Cinzel, serif' }}>
                    <BookOpen className="w-3.5 h-3.5" />
                    Codex
                  </a>
                </div>
              </motion.div>

              {/* ═══ DRAMATIC BEGIN BUTTON ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
                className="flex gap-3 mt-6 justify-center flex-wrap"
              >
                <Button
                  onClick={startNewCampaign}
                  disabled={!geminiKey}
                  className="btn-begin-legend bg-gradient-to-b from-[#4e3300] to-[#2b1800] hover:from-[#6e4800] hover:to-[#422600] text-[#f0c860] border border-[#7a5f20] px-8 sm:px-12 py-3 sm:py-4 text-sm sm:text-base transition-all disabled:opacity-40 disabled:animate-none"
                  style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.17em' }}
                >
                  ⚔ Begin Your Legend ⚔
                </Button>

                {saveSlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.1, duration: 0.4 }}
                  >
                    <Button
                      onClick={() => setShowLoadDialog(true)}
                      variant="outline"
                      className="border-[#5a4018] text-[#9a8860] hover:bg-[#1a1205] px-6 py-3"
                      style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.1em' }}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Load Save
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {/* ═══ FEATURE GRID — Stagger entrance ═══ */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
                className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3"
              >
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          delay: 2.0 + i * 0.1,
                          duration: 0.4,
                          ease: 'easeOut',
                        },
                      },
                    }}
                    className="text-center p-3 bg-[#181208] border border-[#2e2008] rounded"
                  >
                    <div className="text-[#c9a84c] mb-1">{feature.icon}</div>
                    <div className="text-xs text-[#9a8860]" style={{ fontFamily: 'Cinzel, serif' }}>{feature.label}</div>
                    <div className="text-[10px] text-[#5a4d30]">{feature.desc}</div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
