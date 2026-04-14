'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sword, Users, Sparkles, SkipForward, Shield, Wand2, Footprints, MessageSquare, Heart, Target, Lock, Zap, PenLine } from 'lucide-react'
import type { GameState, GameOption } from '@/lib/gameTypes'
import { InteractiveDiceRoller } from './InteractiveDiceRoller'
import { motion } from 'framer-motion'

function getAbilityIcon(ability: string) {
  const a = ability.toLowerCase()
  if (a.includes('attack') || a.includes('strike') || a.includes('slash') || a.includes('melee')) return <Sword className="w-4 h-4 ability-icon-melee" />
  if (a.includes('spell') || a.includes('magic') || a.includes('fireball') || a.includes('lightning') || a.includes('arcane')) return <Wand2 className="w-4 h-4 ability-icon-spell" />
  if (a.includes('defend') || a.includes('shield') || a.includes('block') || a.includes('guard') || a.includes('dodge')) return <Shield className="w-4 h-4 ability-icon-defense" />
  if (a.includes('move') || a.includes('sneak') || a.includes('hide') || a.includes('retreat') || a.includes('approach') || a.includes('flee')) return <Footprints className="w-4 h-4 ability-icon-movement" />
  if (a.includes('talk') || a.includes('persuade') || a.includes('intimidate') || a.includes('negotiate') || a.includes('deceive') || a.includes('charm')) return <MessageSquare className="w-4 h-4 ability-icon-social" />
  if (a.includes('heal') || a.includes('cure') || a.includes('restore') || a.includes('potion')) return <Heart className="w-4 h-4 ability-icon-heal" />
  return <Target className="w-4 h-4 text-[#8b6914]" />
}

function getDamageDie(ability: string): string {
  const a = ability.toLowerCase()
  if (a.includes('greatsword') || a.includes('greataxe')) return 'd12'
  if (a.includes('longsword') || a.includes('battleaxe') || a.includes('warhammer') || a.includes('maul')) return 'd10'
  if (a.includes('shortsword') || a.includes('scimitar') || a.includes('firebolt') || a.includes('sacred flame')) return 'd8'
  if (a.includes('dagger') || a.includes('ray of frost') || a.includes('acid splash')) return 'd6'
  return 'd8'
}

function isCombatAbility(ability: string): boolean {
  const a = ability.toLowerCase()
  return a.includes('attack') || a.includes('strike') || a.includes('slash') || a.includes('melee')
    || a.includes('fireball') || a.includes('spell') || a.includes('magic') || a.includes('lightning')
    || a.includes('arcane') || a.includes('smite') || a.includes('firebolt')
}

// Check if a specific ability is on cooldown for a given PC
function getAbilityCooldown(
  pcId: string | null,
  ability: string,
  cooldowns: GameState['abilityCooldowns']
): { turnsLeft: number; totalTurns: number } | null {
  if (!pcId || !ability) return null
  const key = `${pcId}_${ability}`
  return cooldowns[key] || null
}

// Cooldown progress ring component
function CooldownIndicator({ turnsLeft, totalTurns }: { turnsLeft: number; totalTurns: number }) {
  const progress = 1 - turnsLeft / totalTurns
  const circumference = 2 * Math.PI * 10
  const strokeDashoffset = circumference * (1 - progress)
  const radius = 10
  const size = 28

  return (
    <div className="flex items-center gap-1.5">
      {/* Circular progress */}
      <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3a3020"
          strokeWidth={2}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d4af37"
          strokeWidth={2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
          style={{ opacity: 0.6 }}
        />
        {/* Turns number */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#d4af37"
          fontSize={10}
          fontFamily="var(--font-heading)"
          fontWeight="bold"
          className="rotate-90 origin-center"
          style={{ transform: `rotate(90deg) translateX(0) translateY(-${size / 2}px) rotate(-90deg) translateX(-${size / 2}px)` }}
        >
          {turnsLeft}
        </text>
      </svg>
      <span className="text-[10px] text-[#8a7040] font-title">{turnsLeft}t</span>
    </div>
  )
}

export interface ChoicePanelProps {
  gameState: GameState
  selectOption: (index: number) => void
  selectCompanionOption: (index: number) => void
  confirmChoice: (customText?: string) => void
  setShardDialogOpen: (open: boolean) => void
  lastTurnReadyTime: number
}

export function ChoicePanel({
  gameState,
  selectOption,
  selectCompanionOption,
  confirmChoice,
  setShardDialogOpen,
  lastTurnReadyTime,
}: ChoicePanelProps) {
  const [confirmClicked, setConfirmClicked] = useState(false)
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null)
  const [freeText, setFreeText] = useState('')
  const [showFreeText, setShowFreeText] = useState(false)

  // ── CONFIRM COOLDOWN — Prevent 429 rate limit ────────────────────────
  const COOLDOWN_MS = 10000 // 10 seconds between turns — prevents API rate limit
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  useEffect(() => {
    if (!lastTurnReadyTime || !gameState.waitingForHuman) {
      return
    }
    const tick = () => {
      const elapsed = Date.now() - lastTurnReadyTime
      const remaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000))
      setCooldownRemaining(remaining)
      if (remaining <= 0) return
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [lastTurnReadyTime, gameState.waitingForHuman])

  // All hooks must be called before any conditional return
  const handleDiceRoll = useCallback((result: number) => {
    setDiceRollResult(result)
  }, [])

  // Tooltip touch handler for mobile
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      const target = (e.target as HTMLElement).closest('.fantasy-tooltip')
      if (!target) {
        // Close all open tooltips
        document.querySelectorAll('.tooltip-touch-active').forEach(el => el.classList.remove('tooltip-touch-active'))
        return
      }
      const content = target.querySelector('.tooltip-content') as HTMLElement
      if (content) {
        // Close others first
        document.querySelectorAll('.tooltip-touch-active').forEach(el => {
          if (el !== content) el.classList.remove('tooltip-touch-active')
        })
        content.classList.toggle('tooltip-touch-active')
      }
    }
    document.addEventListener('touchstart', handleTouch, { passive: true })
    return () => document.removeEventListener('touchstart', handleTouch)
  }, [])

  // Reset dice roll and free text when selection changes
  useEffect(() => {
    const id = setTimeout(() => { setDiceRollResult(null); setFreeText(''); setShowFreeText(false) }, 0)
    return () => clearTimeout(id)
  }, [gameState.pendingHumanChoice])

  if (!gameState.waitingForHuman || gameState.humanOptions.length === 0) return null

  const pcOptions = gameState.humanOptions.slice(0, 3)
  const compOptions = gameState.companionOptions
  const extraOptions = gameState.humanOptions.slice(3)
  // Filter out the skip/observe option — replaced by free text input
  const nonSkipExtra = extraOptions.filter(opt => opt.ability !== 'skip')
  const hasSkipOption = extraOptions.some(opt => opt.ability === 'skip')

  const pc = gameState.pcs.find(p => p.id === gameState.humanPCId)
  const companion = gameState.companionId ? gameState.pcs.find(p => p.id === gameState.companionId) : null
  const pcSelected = gameState.pendingHumanChoice !== null || showFreeText
  const compSelected = compOptions.length === 0 || gameState.pendingCompanionChoice !== null
  const canConfirm = pcSelected && compSelected

  // Determine if the selected PC option is a combat ability
  const selectedPCOption = pcSelected && gameState.pendingHumanChoice !== null ? pcOptions[gameState.pendingHumanChoice] : null
  const isCombat = selectedPCOption ? isCombatAbility(selectedPCOption.ability) : false
  const damageDie = selectedPCOption ? getDamageDie(selectedPCOption.ability) : 'd8'

  return (
    <Card className="mt-4 border-2 border-[#c9a84c] parchment-bg-choices shadow-[0_0_16px_rgba(200,160,60,.2)]">
      <CardHeader className="bg-gradient-to-r from-[rgba(80,55,0,.6)] to-[rgba(20,10,0,.4)] border-b border-[#7a5f20]">
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-title)', fontSize: '0.9rem', color: '#f0c860', letterSpacing: '.12em' }} className="text-sm sm:text-base">
            YOUR TURN
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: '#c9a84c' }} className="text-sm sm:text-base">
            {pc?.name}
          </span>
          {companion && (
            <>
              <span className="text-[#7a5f20] mx-1">&</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: '#90a0c0' }} className="text-sm sm:text-base">
                {companion.name}
              </span>
            </>
          )}
          {gameState.shardCharges > 0 && !gameState.shardDark && (
            <Badge
              className="ml-auto cursor-pointer hover:bg-[rgba(60,0,100,.6)]"
              style={{ background: 'rgba(60,0,100,.5)', color: gameState.shardEntry?.color || '#c080ff', border: `1px solid ${gameState.shardEntry?.color || '#888'}` }}
              onClick={() => setShardDialogOpen(true)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              🔮 {gameState.shardCharges} {(gameState.shardCharges === 3) ? '🔮🔮🔮' : (gameState.shardCharges === 2) ? '🔮🔮⚫' : '🔮⚫⚫'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4 space-y-4">
        <div className="ornate-corners">
          <span className="corner-tl" />
          <span className="corner-tr" />
          <span className="corner-bl" />
          <span className="corner-br" />
        {/* ═══════════════════════════════════════════════════════════════════════
            OUTCOME TIER DISPLAY
            ═══════════════════════════════════════════════════════════════════════ */}
        {gameState.lastOutcomeTier && (
          <div className={`text-center py-2 px-4 rounded-lg mb-3 ${
            gameState.lastOutcomeTier === 'critical_success' ? 'bg-gradient-to-r from-[rgba(212,175,55,.2)] to-[rgba(160,120,20,.1)] border border-[#d4af37] text-[#ffd700]' :
            gameState.lastOutcomeTier === 'full_success' ? 'bg-gradient-to-r from-[rgba(34,197,94,.15)] to-[rgba(34,197,94,.05)] border border-[#22c55e] text-[#4ade80]' :
            gameState.lastOutcomeTier === 'partial_success' ? 'bg-gradient-to-r from-[rgba(245,158,11,.15)] to-[rgba(245,158,11,.05)] border border-[#f59e0b] text-[#fbbf24]' :
            gameState.lastOutcomeTier === 'miss' ? 'bg-gradient-to-r from-[rgba(239,68,68,.15)] to-[rgba(239,68,68,.05)] border border-[#ef4444] text-[#f87171]' :
            'bg-gradient-to-r from-[rgba(160,80,200,.15)] to-[rgba(160,80,200,.05)] border border-[#a050c8] text-[#c090e0]'
          }`}>
            {gameState.lastOutcomeTier === 'critical_success' ? '✦ CRITICAL SUCCESS ✦' :
             gameState.lastOutcomeTier === 'full_success' ? '✦ SUCCESS ✦' :
             gameState.lastOutcomeTier === 'partial_success' ? '⚡ PARTIAL SUCCESS — Success at a cost' :
             gameState.lastOutcomeTier === 'miss' ? '✗ MISS — The world pushes back' :
             '◉ CONSEQUENCES'}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            FATE POINTS BAR
            ═══════════════════════════════════════════════════════════════════════ */}
        {gameState.fatePoints > 0 && (
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-[rgba(100,50,150,.1)] border border-[rgba(150,100,200,.2)]">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-300 font-title">FATE POINTS: {gameState.fatePoints}/5</span>
            {gameState.aspects.length > 0 && (
              <span className="text-[10px] text-purple-400/60 ml-auto truncate max-w-[200px]">
                {gameState.aspects.map(a => a.name).join(' · ')}
              </span>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            MORALITY METER — Paragon (blue) ↔ Renegade (red)
            ═══════════════════════════════════════════════════════════════════════ */}
        {(gameState.paragonPoints > 0 || gameState.renegadePoints > 0) && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded bg-[rgba(60,60,80,.1)] border border-[rgba(100,100,140,.2)]">
            <span className="text-[10px] text-blue-400 font-title font-bold shrink-0">P:{gameState.paragonPoints}</span>
            <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#2a2a30] relative">
              {/* Center mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-px h-full bg-[#4a4a50]" />
              </div>
              {/* Paragon fill (left side) */}
              {gameState.moralityQuotient > 0 && (
                <div className="absolute left-0 top-0 h-full bg-gradient-to-l from-blue-500/60 to-blue-400/30 rounded-l-full transition-all duration-500"
                  style={{ width: `${(gameState.moralityQuotient / 100) * 50}%` }} />
              )}
              {/* Renegade fill (right side) */}
              {gameState.moralityQuotient < 0 && (
                <div className="absolute right-0 top-0 h-full bg-gradient-to-r from-red-500/60 to-red-400/30 rounded-r-full transition-all duration-500"
                  style={{ width: `${(Math.abs(gameState.moralityQuotient) / 100) * 50}%` }} />
              )}
            </div>
            <span className="text-[10px] text-red-400 font-title font-bold shrink-0">R:{gameState.renegadePoints}</span>
            {gameState.moralityQuotient !== 0 && (
              <span className={`text-[9px] ml-1 shrink-0 ${gameState.moralityQuotient > 0 ? 'text-blue-400/60' : 'text-red-400/60'}`}>
                {gameState.moralityQuotient > 0 ? '↑' : '↓'}{Math.abs(gameState.moralityQuotient)}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2 px-2">
          <Zap className="w-3 h-3 text-[#80a060]" />
          <span className="text-[10px] text-[#80a060] font-title">STAMINA</span>
          <div className="flex-1 h-2 bg-[#1a1a10] rounded-full overflow-hidden border border-[#2a3020]">
            <div className={`h-full rounded-full transition-all duration-300 ${gameState.stamina <= gameState.maxStamina * 0.3 ? 'bg-gradient-to-r from-[#804020] to-[#a05030]' : 'bg-gradient-to-r from-[#406030] to-[#60a040]'}`}
              style={{ width: `${(gameState.stamina / (gameState.maxStamina || 1)) * 100}%` }} />
          </div>
          <span className="text-[10px] text-[#608040]">{gameState.stamina}/{gameState.maxStamina}</span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            PC ACTIONS — 3 context-aware choices
            ═══════════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="text-[#d4af37] text-xs uppercase tracking-wider mb-2 font-title flex items-center gap-2">
            <Sword className="w-4 h-4" />
            <span>{pc?.name?.split(' ')[0]} — Choose Action</span>
            <span className="flex-1 h-px bg-[#3a3020]" />
            {pcSelected && <span className="text-emerald-400 text-[10px]">✓ Selected</span>}
          </div>

          {pcOptions.map((opt, idx) => {
            const cd = getAbilityCooldown(pc?.id || null, opt.ability, gameState.abilityCooldowns)
            const isOnCooldown = cd !== null
            return (
            <div key={idx} className="fantasy-tooltip relative">
              <div className="tooltip-content">
                {(opt.ability || '').toLowerCase().includes('attack') || (opt.ability || '').toLowerCase().includes('strike')
                  ? 'Melee attack — uses STR modifier vs target AC'
                  : (opt.ability || '').toLowerCase().includes('spell') || (opt.ability || '').toLowerCase().includes('magic')
                    ? 'Arcane spell — uses INT/WIS modifier vs target saving throw'
                    : (opt.ability || '').toLowerCase().includes('defend') || (opt.ability || '').toLowerCase().includes('shield')
                      ? 'Defensive stance — grants AC bonus until next turn'
                      : (opt.ability || '').toLowerCase().includes('move') || (opt.ability || '').toLowerCase().includes('sneak')
                        ? 'Movement action — reposition or stealth check'
                        : (opt.ability || '').toLowerCase().includes('talk') || (opt.ability || '').toLowerCase().includes('persuade')
                          ? 'Social interaction — CHA modifier determines outcome'
                          : (opt.ability || '').toLowerCase().includes('heal')
                            ? 'Healing action — restores HP based on ability score'
                            : 'Ability check — d20 + relevant modifier vs DC'}
              </div>
              <div
                onClick={() => !isOnCooldown && selectOption(idx)}
                className={`flex gap-3 p-2 sm:p-3 rounded cursor-pointer transition-all mb-2 min-h-[44px] ${isOnCooldown
                    ? 'border border-[#2a2018] bg-gradient-to-b from-[#12100c] to-[#0d0a08] opacity-50'
                    : gameState.pendingHumanChoice === idx
                    ? 'border-2 border-[#d4af37] bg-gradient-to-r from-[rgba(90,60,10,.5)] to-[rgba(60,40,10,.4)] shadow-[inset_0_0_12px_rgba(212,175,55,.2)] choice-pulse-gold'
                    : 'border border-[#4a4030] bg-gradient-to-b from-[#1a1610] to-[#12100c] hover:border-[#d4af37] hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  }`}
              >
                <div className={`font-bold font-title text-xl w-8 text-center ${isOnCooldown ? 'text-[#3a3020]' : 'text-[#d4af37]'}`}>{opt.num}</div>
                <div className="flex-1">
                  <div className={`font-narrative text-sm sm:text-base ${isOnCooldown ? 'text-[#5a4d30]' : 'text-[#f0e0c0]'}`}>{opt.action}</div>
                  <div className={`text-xs sm:text-sm mt-1 font-narrative flex items-center gap-1.5 break-words ${isOnCooldown ? 'text-[#4a3a20]' : 'text-[#b08050]'}`}>
                    {getAbilityIcon(opt.ability)}
                    <span>[{opt.ability}]</span>
                    {opt.align_note && (
                      <Badge className="ml-2 text-xs bg-[rgba(212,175,55,.15)] text-[#c0a060] border border-[#5a4030]">
                        {opt.align_note}
                      </Badge>
                    )}
                  </div>
                </div>
                {isOnCooldown && cd && (
                  <div className="flex items-center pr-1">
                    <CooldownIndicator turnsLeft={cd.turnsLeft} totalTurns={cd.totalTurns} />
                  </div>
                )}
              </div>
              {isOnCooldown && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Lock className="w-4 h-4 text-[#3a3020] opacity-40" />
                </div>
              )}
            </div>
            )
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            COMPANION ACTIONS — 3 context-aware choices (if companion exists)
            ═══════════════════════════════════════════════════════════════════════ */}
        {compOptions.length > 0 && companion && (
          <>
            <div className="chain-divider">
              <span /><span /><span /><span /><span /><span /><span /><span /><span />
            </div>
            <div className="companion-section">
              <div className="text-[#90a0c0] text-xs uppercase tracking-wider mb-2 font-title flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{companion.name.split(' ')[0]} — Choose Action</span>
                <span className="flex-1 h-px bg-[#2a3040]" />
                {compSelected ? <span className="text-emerald-400 text-[10px]">✓ Selected</span> : <span className="text-[#5a6080] text-[10px]">Required</span>}
              </div>

              {compOptions.map((opt, idx) => (
                <div key={idx} className="fantasy-tooltip">
                  <div className="tooltip-content">
                    {(opt.ability || '').toLowerCase().includes('attack') || (opt.ability || '').toLowerCase().includes('strike')
                      ? 'Melee attack — uses STR modifier vs target AC'
                      : (opt.ability || '').toLowerCase().includes('spell') || (opt.ability || '').toLowerCase().includes('magic')
                        ? 'Arcane spell — uses INT/WIS modifier vs target saving throw'
                        : (opt.ability || '').toLowerCase().includes('defend') || (opt.ability || '').toLowerCase().includes('shield')
                          ? 'Defensive stance — grants AC bonus until next turn'
                          : (opt.ability || '').toLowerCase().includes('move') || (opt.ability || '').toLowerCase().includes('sneak')
                            ? 'Movement action — reposition or stealth check'
                            : (opt.ability || '').toLowerCase().includes('talk') || (opt.ability || '').toLowerCase().includes('persuade')
                              ? 'Social interaction — CHA modifier determines outcome'
                              : (opt.ability || '').toLowerCase().includes('heal')
                                ? 'Healing action — restores HP based on ability score'
                                : 'Ability check — d20 + relevant modifier vs DC'}
                  </div>
                  <div
                    onClick={() => selectCompanionOption(idx)}
                    className={`flex gap-3 p-2 sm:p-3 rounded cursor-pointer transition-all mb-2 min-h-[44px] ${gameState.pendingCompanionChoice === idx
                        ? 'border-2 border-[#7090c0] bg-gradient-to-r from-[rgba(40,60,100,.5)] to-[rgba(30,40,70,.4)] shadow-[inset_0_0_12px_rgba(100,140,200,.2)] choice-pulse-blue'
                        : 'border border-[#3a4050] bg-gradient-to-b from-[#15181e] to-[#0e1015] hover:border-[#7090c0] hover:shadow-[0_0_10px_rgba(100,140,200,0.15)]'
                      }`}
                  >
                    <div className={`font-bold font-title text-xl w-8 text-center ${gameState.pendingCompanionChoice === idx ? 'text-[#7090c0]' : 'text-[#5a6a80]'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[#f0e0c0] font-narrative text-sm sm:text-base">{opt.action}</div>
                      <div className="text-xs sm:text-sm text-[#8090b0] mt-1 font-narrative flex items-center gap-1.5 break-words">
                        {getAbilityIcon(opt.ability)}
                        <span>[{opt.ability}]</span>
                        {opt.align_note && (
                          <Badge className="ml-2 text-xs bg-[rgba(100,140,200,.15)] text-[#90a0c0] border border-[#3a4050]">
                            {opt.align_note}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            FREE-TEXT INPUT — Write your own action (replaces Skip/Observe)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="text-[#5a4d30] text-xs uppercase tracking-wider mt-2 mb-2 font-title flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            <span>Or describe what you want to do</span>
            <span className="flex-1 h-px bg-[#2a2518]" />
            {showFreeText && <span className="text-emerald-400 text-[10px]">✓ Active</span>}
          </div>

          <div
            onClick={() => {
              setShowFreeText(true)
              // Clear any preset selection when switching to free text
              if (gameState.pendingHumanChoice !== null) {
                selectOption(-1)
              }
            }}
            className={`flex flex-col gap-2 p-3 rounded cursor-pointer transition-all border ${
              showFreeText
                ? 'border-2 border-[#d4af37] bg-gradient-to-r from-[rgba(90,60,10,.4)] to-[rgba(60,40,10,.3)] shadow-[inset_0_0_12px_rgba(212,175,55,.15)]'
                : 'border border-[#3a3020] bg-[#0d0a08] hover:border-[#5a4d30]'
            }`}
          >
            <div className="flex items-center gap-2">
              <PenLine className={`w-4 h-4 ${showFreeText ? 'text-[#d4af37]' : 'text-[#5a4d30]'}`} />
              <span className={`font-title text-sm ${showFreeText ? 'text-[#d4af37]' : 'text-[#7a6a50]'}`}>
                {showFreeText ? 'Writing your action...' : '✍️ Write a custom action'}
              </span>
            </div>
            {showFreeText && (
              <div className="mt-1" onClick={e => e.stopPropagation()}>
                <textarea
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder={`E.g., "I kneel beside the fallen statue and examine the inscription while ${companion?.name?.split(' ')[0] || 'my companion'} keeps watch"`}
                  className="w-full bg-[#0a0806] border border-[#3a3020] rounded p-2 text-sm text-[#f0e0c0] font-narrative placeholder:text-[#4a3a20] focus:outline-none focus:border-[#d4af37] resize-none min-h-[60px] max-h-[120px]"
                  rows={2}
                  autoFocus
                />
                <div className="text-[9px] text-[#5a4d30] mt-1 italic">
                  Describe anything — the DM will interpret your intent and resolve it mechanically.
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════
              EXTRA OPTIONS: Potion, Archrival Summon, Fate Point Invoke (skip removed)
              ═══════════════════════════════════════════════════════════════════════ */}
          {nonSkipExtra.length > 0 && (
            <div className="mt-2 space-y-2">
              {nonSkipExtra.map((opt) => {
                // Find the actual index in the full humanOptions array
                const actualIdx = gameState.humanOptions.findIndex(o => o === opt)
                const isRival = opt.source === 'archrival_summon'
                const isFateInvoke = opt.ability === 'invoke_aspect' || opt.ability.startsWith('invoke_aspect:')
                return (
                  <div
                    key={actualIdx}
                    onClick={() => {
                      selectOption(actualIdx)
                      setShowFreeText(false)
                      setFreeText('')
                    }}
                    className={`flex gap-3 p-2 sm:p-3 rounded cursor-pointer transition-all mb-2 min-h-[44px] ${gameState.pendingHumanChoice === actualIdx
                        ? isRival
                          ? 'border-2 border-[#c05050] bg-gradient-to-r from-[rgba(80,20,20,.3)] to-[rgba(50,15,15,.2)]'
                          : 'border-2 border-[#5a4d30] bg-gradient-to-r from-[rgba(50,40,20,.3)] to-[rgba(30,25,15,.2)]'
                        : isRival
                          ? 'border border-[#3a2020] bg-[#0d0808] hover:border-[#c05050]'
                          : 'border border-dashed border-[#3a3020] bg-[#0d0a08] hover:border-[#5a4d30]'
                      }`}
                  >
                    <div className={`font-bold font-title text-lg w-8 text-center ${isRival ? 'text-[#c05050]' : isFateInvoke ? 'text-[#a060d0]' : 'text-[#5a4d30]'}`}>
                      {isRival ? '⚡' : isFateInvoke ? '✦' : opt.num}
                    </div>
                    <div className="flex-1">
                      <div className={`font-narrative ${isRival ? 'text-[#d09090]' : 'text-[#b08050]'}`}>{opt.action}</div>
                    </div>
                    {isRival && <Sparkles className="w-5 h-5 text-[#c05050]" />}
                    {isFateInvoke && <Sparkles className="w-5 h-5 text-[#a060d0]" />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Fate Point info panel */}
          {gameState.fatePoints > 0 && !showFreeText && (
            <div className="mt-2 p-2 rounded border border-dashed border-[#6040a0] bg-[rgba(60,20,100,.08)]">
              <div className="text-[10px] text-purple-400/60 font-title uppercase tracking-wider mb-1">
                ✦ Free Action — Spend 1 Fate Point
              </div>
              <div className="text-[9px] text-purple-400/40 italic mb-1.5">
                Your aspects: {gameState.aspects.map(a => `"${a.name}"`).join(', ') || 'None yet'}
              </div>
              <div className="text-[9px] text-purple-300/50">
                Select an aspect above to spend a Fate Point for +2 to your next roll.
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            DICE ROLLER — Shows when a combat ability is selected
            ═══════════════════════════════════════════════════════════════════════ */}
        {isCombat && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 px-2 sm:px-4 rounded-lg bg-[rgba(40,10,10,.3)] border border-[#5a2020] overflow-x-auto scrollbar-hide">
            <div className="text-center">
              <div className="text-xs font-title text-[#c08050] uppercase tracking-wider mb-1">Selected Attack</div>
              <div className="text-sm text-[#f0e0c0] font-narrative">{selectedPCOption?.ability}</div>
            </div>
            <div className="w-px h-10 bg-[#5a2020]" />
            <InteractiveDiceRoller
              dieType={damageDie}
              label="Roll Damage"
              onRoll={handleDiceRoll}
              disabled={false}
              showResult={true}
            />
            {diceRollResult !== null && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center"
              >
                <div className="text-xs text-[#5a4040] font-title uppercase">Damage Roll</div>
                <div className={`text-xl font-bold ${diceRollResult >= parseInt(damageDie.replace('d', '')) * 0.8 ? 'text-[#d4af37]' : 'text-[#f0ebe3]'}`} style={{ fontFamily: 'var(--font-heading)' }}>
                  {diceRollResult}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CONFIRM BUTTON — Both PC and Companion must be selected
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 border-t border-[#3a3020]">
          <Button
            onClick={() => {
              if (canConfirm && cooldownRemaining <= 0) {
                // Pass free text as parameter instead of mutating gameState prop
                const customText = showFreeText && freeText.trim() ? freeText.trim() : undefined
                setConfirmClicked(true)
                setTimeout(() => setConfirmClicked(false), 300)
                confirmChoice(customText)
              }
            }}
            disabled={!canConfirm || cooldownRemaining > 0}
            className={`font-title tracking-wider px-6 text-lg py-5 transition-all w-full sm:w-auto min-h-[44px] ${
              canConfirm && cooldownRemaining <= 0
                ? `confirm-ready ${confirmClicked ? 'confirm-click' : ''} bg-gradient-to-b from-[#5a3a10] to-[#3a2510] hover:from-[#7a5020] hover:to-[#5a3a15] text-[#f0d878] border-2 border-[#8a6020] shadow-[0_0_10px_rgba(200,160,60,.2)]`
                : 'bg-gradient-to-b from-[#2a2015] to-[#1a1510] text-[#5a4d30] border-2 border-[#3a3020] cursor-not-allowed'
            }`}
          >
            {cooldownRemaining > 0
              ? `⏳ Cooldown ${cooldownRemaining}s`
              : '⚔ Confirm Choice ⚔'}
          </Button>
          <span className="text-sm text-[#a08050] italic font-narrative break-words">
            {cooldownRemaining > 0
              ? 'Waiting for API cooldown...'
              : !pcSelected
                ? 'Select an action above or write your own'
                : !compSelected
                  ? `Also choose ${companion?.name?.split(' ')[0] || 'companion'}'s action`
                  : showFreeText && freeText.trim()
                    ? `Custom action${compOptions.length > 0 ? ` + ${String.fromCharCode(65 + gameState.pendingCompanionChoice!)}` : ''} — Ready!`
                    : `Option ${gameState.pendingHumanChoice! + 1}${compOptions.length > 0 ? ` + ${String.fromCharCode(65 + gameState.pendingCompanionChoice!)}` : ''} — Ready!`
            }
          </span>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
