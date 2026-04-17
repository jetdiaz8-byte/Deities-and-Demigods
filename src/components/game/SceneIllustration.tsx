'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'

interface SceneIllustrationProps {
  narration: string
  act: string
  turn: number
  gameState: {
    activeNPCs: { id: string; conditions: string[]; encounter_type?: string }[]
    antagonistHp: number
    antagonistMaxHp: number
  }
}

// ── Scene type definitions with CSS atmospheric backgrounds ──────────────
interface SceneTheme {
  name: string
  bg: string                     // Main gradient background
  overlay: string                // Secondary atmospheric overlay
  glowColor: string              // Accent glow color
  particles?: 'mist' | 'embers' | 'snow' | 'dust' | 'bubbles' | 'none'
  icon?: string                  // Optional scene icon
}

const SCENE_THEMES: Record<string, SceneTheme> = {
  'The Tavern': {
    name: 'The Tavern',
    bg: 'linear-gradient(180deg, #1a0e05 0%, #2a1a0a 30%, #3d2510 60%, #1a0e05 100%)',
    overlay: 'radial-gradient(ellipse at 50% 70%, rgba(255,150,50,0.15) 0%, transparent 70%), radial-gradient(ellipse at 20% 50%, rgba(200,100,20,0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(200,100,20,0.1) 0%, transparent 50%)',
    glowColor: 'rgba(255,160,60,0.4)',
    particles: 'dust',
    icon: '🍻',
  },
  'The Ancient Forest': {
    name: 'The Ancient Forest',
    bg: 'linear-gradient(180deg, #050f05 0%, #0a1f0a 25%, #0d2a0d 50%, #071207 80%, #030803 100%)',
    overlay: 'radial-gradient(ellipse at 30% 40%, rgba(80,200,80,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(60,180,60,0.06) 0%, transparent 40%), radial-gradient(ellipse at 50% 80%, rgba(40,120,40,0.1) 0%, transparent 60%)',
    glowColor: 'rgba(100,220,100,0.3)',
    particles: 'mist',
    icon: '🌲',
  },
  'The Sacred Temple': {
    name: 'The Sacred Temple',
    bg: 'linear-gradient(180deg, #0d0a15 0%, #1a1530 25%, #251d40 50%, #15102a 80%, #0a0810 100%)',
    overlay: 'radial-gradient(ellipse at 50% 20%, rgba(200,180,100,0.15) 0%, transparent 40%), radial-gradient(ellipse at 30% 60%, rgba(180,150,220,0.08) 0%, transparent 40%), radial-gradient(ellipse at 70% 70%, rgba(200,180,100,0.06) 0%, transparent 35%)',
    glowColor: 'rgba(220,200,130,0.4)',
    particles: 'dust',
    icon: '⛪',
  },
  'The Endless Sea': {
    name: 'The Endless Sea',
    bg: 'linear-gradient(180deg, #050a12 0%, #0a1525 20%, #0d1d35 45%, #0a1525 70%, #050a12 100%)',
    overlay: 'radial-gradient(ellipse at 50% 30%, rgba(100,150,200,0.1) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(80,130,180,0.08) 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(60,100,160,0.06) 0%, transparent 35%)',
    glowColor: 'rgba(120,170,220,0.3)',
    particles: 'mist',
    icon: '🌊',
  },
  'The Battlefield': {
    name: 'The Battlefield',
    bg: 'linear-gradient(180deg, #1a0505 0%, #2d0a0a 25%, #3d1010 50%, #250808 75%, #0f0303 100%)',
    overlay: 'radial-gradient(ellipse at 40% 50%, rgba(255,80,20,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(255,120,40,0.08) 0%, transparent 40%), radial-gradient(ellipse at 20% 70%, rgba(200,50,20,0.1) 0%, transparent 45%)',
    glowColor: 'rgba(255,100,30,0.4)',
    particles: 'embers',
    icon: '⚔️',
  },
  'The Depths Below': {
    name: 'The Depths Below',
    bg: 'linear-gradient(180deg, #0a0510 0%, #120a20 25%, #1a0d2d 50%, #100818 75%, #050308 100%)',
    overlay: 'radial-gradient(ellipse at 50% 60%, rgba(100,60,180,0.1) 0%, transparent 50%), radial-gradient(ellipse at 30% 30%, rgba(80,200,160,0.06) 0%, transparent 35%), radial-gradient(ellipse at 70% 80%, rgba(120,80,200,0.08) 0%, transparent 40%)',
    glowColor: 'rgba(140,100,220,0.3)',
    particles: 'bubbles',
    icon: '🕳️',
  },
  'The Mountain Pass': {
    name: 'The Mountain Pass',
    bg: 'linear-gradient(180deg, #0a0e15 0%, #151d2a 25%, #1d2535 50%, #121820 75%, #080c12 100%)',
    overlay: 'radial-gradient(ellipse at 50% 20%, rgba(180,200,220,0.1) 0%, transparent 40%), radial-gradient(ellipse at 30% 70%, rgba(150,170,200,0.06) 0%, transparent 40%), radial-gradient(ellipse at 80% 40%, rgba(200,220,240,0.05) 0%, transparent 35%)',
    glowColor: 'rgba(180,200,230,0.3)',
    particles: 'snow',
    icon: '⛰️',
  },
  'The Village': {
    name: 'The Village',
    bg: 'linear-gradient(180deg, #0f0a05 0%, #1a1208 25%, #251a0d 50%, #1a1208 75%, #0f0a05 100%)',
    overlay: 'radial-gradient(ellipse at 40% 60%, rgba(255,180,80,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 40%, rgba(255,150,50,0.08) 0%, transparent 40%), radial-gradient(ellipse at 20% 80%, rgba(200,120,40,0.06) 0%, transparent 35%)',
    glowColor: 'rgba(255,180,100,0.3)',
    particles: 'dust',
    icon: '🏘️',
  },
  'The Fortress': {
    name: 'The Fortress',
    bg: 'linear-gradient(180deg, #08080a 0%, #12121a 25%, #1a1a25 50%, #12121a 75%, #08080a 100%)',
    overlay: 'radial-gradient(ellipse at 50% 30%, rgba(200,180,120,0.1) 0%, transparent 45%), radial-gradient(ellipse at 20% 60%, rgba(180,160,100,0.06) 0%, transparent 35%), radial-gradient(ellipse at 80% 70%, rgba(160,140,80,0.08) 0%, transparent 40%)',
    glowColor: 'rgba(220,200,140,0.3)',
    particles: 'embers',
    icon: '🏰',
  },
  'The Bridge': {
    name: 'The Bridge',
    bg: 'linear-gradient(180deg, #080510 0%, #100a1d 25%, #180f2d 50%, #100a1d 75%, #080510 100%)',
    overlay: 'radial-gradient(ellipse at 50% 50%, rgba(150,120,200,0.1) 0%, transparent 50%), radial-gradient(ellipse at 30% 20%, rgba(120,100,180,0.06) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(180,150,220,0.05) 0%, transparent 35%)',
    glowColor: 'rgba(160,140,210,0.3)',
    particles: 'mist',
    icon: '🌉',
  },
  'The Final Stand': {
    name: 'The Final Stand',
    bg: 'linear-gradient(180deg, #150205 0%, #2a0810 20%, #3d0d15 40%, #2a0810 60%, #150205 80%, #0a0103 100%)',
    overlay: 'radial-gradient(ellipse at 50% 40%, rgba(255,60,20,0.15) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(255,100,40,0.08) 0%, transparent 40%), radial-gradient(ellipse at 80% 30%, rgba(255,40,60,0.1) 0%, transparent 35%)',
    glowColor: 'rgba(255,80,40,0.5)',
    particles: 'embers',
    icon: '💀',
  },
  'The Journey Continues': {
    name: 'The Journey Continues',
    bg: 'linear-gradient(180deg, #0d0815 0%, #1a1025 25%, #251835 50%, #1a1025 75%, #0d0815 100%)',
    overlay: 'radial-gradient(ellipse at 50% 40%, rgba(255,180,100,0.12) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(200,140,80,0.08) 0%, transparent 40%), radial-gradient(ellipse at 80% 20%, rgba(180,160,220,0.06) 0%, transparent 35%)',
    glowColor: 'rgba(255,200,120,0.3)',
    particles: 'dust',
    icon: '🌅',
  },
  'The Road Ahead': {
    name: 'The Road Ahead',
    bg: 'linear-gradient(180deg, #08050d 0%, #12101d 25%, #1a1528 50%, #12101d 75%, #08050d 100%)',
    overlay: 'radial-gradient(ellipse at 50% 50%, rgba(200,100,80,0.1) 0%, transparent 50%), radial-gradient(ellipse at 30% 30%, rgba(180,120,100,0.06) 0%, transparent 40%), radial-gradient(ellipse at 70% 70%, rgba(150,80,60,0.08) 0%, transparent 35%)',
    glowColor: 'rgba(200,120,80,0.3)',
    particles: 'mist',
    icon: '🛤️',
  },
}

function detectSceneName(narration: string, act: string): string {
  const lower = narration.toLowerCase()
  if (lower.includes('tavern') || lower.includes('inn')) return 'The Tavern'
  if (lower.includes('forest') || lower.includes('woods')) return 'The Ancient Forest'
  if (lower.includes('temple') || lower.includes('shrine') || lower.includes('sanctum')) return 'The Sacred Temple'
  if (lower.includes('ocean') || lower.includes('sea') || lower.includes('ship')) return 'The Endless Sea'
  if (lower.includes('battle') || lower.includes('fight') || lower.includes('combat')) return 'The Battlefield'
  if (lower.includes('cave') || lower.includes('dungeon') || lower.includes('depths')) return 'The Depths Below'
  if (lower.includes('mountain') || lower.includes('peak')) return 'The Mountain Pass'
  if (lower.includes('city') || lower.includes('town') || lower.includes('village')) return 'The Village'
  if (lower.includes('castle') || lower.includes('fortress') || lower.includes('keep')) return 'The Fortress'
  if (lower.includes('bridge') || lower.includes('crossing')) return 'The Bridge'
  if (act === 'act3') return 'The Final Stand'
  if (act === 'act2') return 'The Journey Continues'
  return 'The Road Ahead'
}

// ── Particle system — lightweight CSS animations ─────────────────────────
function SceneParticles({ type, glowColor }: { type: string; glowColor: string }) {
  const particleCount = type === 'embers' ? 12 : type === 'snow' ? 15 : 8

  // Pre-compute deterministic drift offsets (avoids Math.random() jitter on re-render)
  const driftOffsets = React.useMemo(() =>
    Array.from({ length: Math.max(particleCount, 15) }).map((_, i) => {
      const n = ((i * 37 + 11) % 100) / 100 // deterministic 0-1
      return n
    }), [particleCount]
  )

  if (type === 'none' || !type) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none scene-particles-container">
      {Array.from({ length: particleCount }).map((_, i) => {
        const isEmber = type === 'embers'
        const isSnow = type === 'snow'
        const isBubble = type === 'bubbles'
        const drift = driftOffsets[i] || 0

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: isBubble ? `${6 + (i % 4) * 3}px` : isSnow ? `${2 + (i % 3)}px` : `${2 + (i % 3)}px`,
              height: isBubble ? `${6 + (i % 4) * 3}px` : isSnow ? `${2 + (i % 3)}px` : `${2 + (i % 3)}px`,
              left: `${(i * 37 + 13) % 100}%`,
              bottom: isBubble ? `${(i * 23) % 30}%` : '-5%',
              backgroundColor: isEmber
                ? `rgba(255, ${100 + (i % 80)}, ${20 + (i % 40)}, ${0.4 + (i % 6) * 0.1})`
                : isSnow
                  ? `rgba(220, 230, 255, ${0.3 + (i % 5) * 0.1})`
                  : isBubble
                    ? `rgba(140, 100, 220, ${0.2 + (i % 4) * 0.1})`
                    : `rgba(200, 190, 170, ${0.15 + (i % 5) * 0.05})`,
              boxShadow: isEmber
                ? `0 0 ${4 + i % 4}px ${glowColor}`
                : isBubble
                  ? `0 0 ${3 + i % 3}px rgba(140, 100, 220, 0.3)`
                  : 'none',
              animation: `${isBubble ? 'floatBubble' : isEmber ? 'riseEmber' : isSnow ? 'fallSnow' : 'driftMist'} ${4 + (i % 5) * 1.5}s ease-in-out ${i * 0.7}s infinite`,
              opacity: 0,
              animationFillMode: 'forwards',
              // Use CSS custom properties for stable drift per-particle
              '--drift-x': `${20 - drift * 40}px`,
              '--drift-x-ember': `${30 - drift * 60}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

export function SceneIllustration({ narration, act, turn, gameState }: SceneIllustrationProps) {
  const [visible, setVisible] = useState(false)
  const [prevTurn, setPrevTurn] = useState(-1)
  const prevActRef = useRef<string | null>(null)

  const isKey = useMemo(() => {
    if (!narration) return false
    if (turn === 0 || turn === 1) return true
    if (turn > 1 && turn % 3 === 0) return true
    if (prevActRef.current && prevActRef.current !== act) return true
    const hasBoss = gameState.activeNPCs.some(
      npc => npc.conditions.some(c => c.toLowerCase().includes('boss'))
    )
    if (hasBoss && turn > 0) return true
    return false
  }, [turn, act, narration, gameState])

  const sceneName = useMemo(() => {
    return detectSceneName(narration, act)
  }, [narration, act])

  const theme = SCENE_THEMES[sceneName] || SCENE_THEMES['The Road Ahead']

  // Track act changes and scene transitions for fade effect
  useEffect(() => {
    prevActRef.current = act
  }, [act])

  useEffect(() => {
    if (!isKey) return
    // Reset visibility for fade-in when scene changes
    setVisible(false)
    const timer = setTimeout(() => setVisible(true), 150)
    setPrevTurn(turn)
    return () => clearTimeout(timer)
  }, [isKey, turn, sceneName])

  // Don't render anything if not a key moment
  if (!isKey) return null

  return (
    <div className="my-4 rounded-lg overflow-hidden" style={{
      border: '2px solid #3a3020',
      boxShadow: `0 0 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3), 0 0 40px ${theme.glowColor}`,
      background: 'linear-gradient(135deg, #1a1510, #0d0a08)',
    }}>
      <style>{`
        @keyframes driftMist {
          0% { opacity: 0; transform: translateY(0) translateX(0); }
          30% { opacity: 0.6; }
          70% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-120px) translateX(var(--drift-x, 0px)); }
        }
        @keyframes riseEmber {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(1); }
          20% { opacity: 0.9; }
          60% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-200px) translateX(var(--drift-x-ember, 0px)) scale(0.3); }
        }
        @keyframes fallSnow {
          0% { opacity: 0; transform: translateY(0) translateX(0); }
          20% { opacity: 0.7; }
          80% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(200px) translateX(var(--drift-x, 0px)); }
        }
        @keyframes floatBubble {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 0.5; }
          70% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-150px) scale(1.2); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        /* S2-F4: Disable particle and glow animations in reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .scene-particles-container { display: none !important; }
          .scene-glow-pulse { animation: none !important; opacity: 0.4 !important; }
        }
      `}</style>

      {/* Fantasy frame corners */}
      <div className="relative">
        <span className="absolute top-0 left-0 text-[#5a4018] text-lg leading-none z-10" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute top-0 right-0 text-[#5a4018] text-lg leading-none rotate-90 z-10" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute bottom-0 left-0 text-[#5a4018] text-lg leading-none -rotate-90 z-10" style={{ fontFamily: 'serif' }}>❧</span>
        <span className="absolute bottom-0 right-0 text-[#5a4018] text-lg leading-none rotate-180 z-10" style={{ fontFamily: 'serif' }}>❧</span>

        {/* Scene illustration — pure CSS atmospheric background */}
        <div
          className="relative overflow-hidden transition-opacity duration-1000"
          style={{
            aspectRatio: '16/9',
            background: theme.bg,
            opacity: visible ? 1 : 0,
          }}
        >
          {/* Atmospheric overlay layers */}
          <div className="absolute inset-0" style={{ background: theme.overlay }} />

          {/* Central scene glow */}
          <div
            className="absolute inset-0 scene-glow-pulse"
            style={{
              background: `radial-gradient(ellipse at 50% 45%, ${theme.glowColor} 0%, transparent 60%)`,
              animation: 'pulseGlow 6s ease-in-out infinite',
            }}
          />

          {/* Vignette effect */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
          }} />

          {/* Decorative horizontal lines (mood enhancer) */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)',
          }} />

          {/* Particles */}
          <SceneParticles type={theme.particles || 'none'} glowColor={theme.glowColor} />

          {/* Scene icon watermark */}
          {theme.icon && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-7xl opacity-[0.06] select-none" style={{ filter: 'blur(1px)' }}>
                {theme.icon}
              </span>
            </div>
          )}

          {/* Scene name overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div
                className="text-2xl tracking-[0.3em] uppercase font-light"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: theme.glowColor.replace(/[\d.]+\)$/, '0.7)'),
                  textShadow: `0 0 30px ${theme.glowColor}, 0 0 60px ${theme.glowColor.replace(/[\d.]+\)$/, '0.2)')}`,
                  letterSpacing: '0.3em',
                }}
              >
                {sceneName}
              </div>
            </div>
          </div>

          {/* Bottom gradient overlay for caption transition */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{
            background: 'linear-gradient(to top, #0d0a08, transparent)',
          }} />
        </div>

        {/* Caption bar */}
        <div className="px-3 py-2 border-t border-[#2a2010]" style={{ background: 'linear-gradient(90deg, #1a1510, #0d0a08)' }}>
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-heading)', color: '#d4af37' }}
            >
              {sceneName}
            </span>
            <span className="text-[10px] text-[#5a4030] font-title">
              Turn {turn}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
