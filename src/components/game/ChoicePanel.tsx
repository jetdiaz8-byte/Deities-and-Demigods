'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sword, Users, Sparkles, SkipForward, Shield, Wand2, Footprints, MessageSquare, Heart, Target } from 'lucide-react'
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

export interface ChoicePanelProps {
  gameState: GameState
  selectOption: (index: number) => void
  selectCompanionOption: (index: number) => void
  confirmChoice: () => void
  setShardDialogOpen: (open: boolean) => void
}

export function ChoicePanel({
  gameState,
  selectOption,
  selectCompanionOption,
  confirmChoice,
  setShardDialogOpen,
}: ChoicePanelProps) {
  const [confirmClicked, setConfirmClicked] = useState(false)
  const [diceRollResult, setDiceRollResult] = useState<number | null>(null)

  // All hooks must be called before any conditional return
  const handleDiceRoll = useCallback((result: number) => {
    setDiceRollResult(result)
  }, [])

  // Reset dice roll when selection changes (use setTimeout to avoid sync setState in effect)
  useEffect(() => {
    const id = setTimeout(() => setDiceRollResult(null), 0)
    return () => clearTimeout(id)
  }, [gameState.pendingHumanChoice])

  if (!gameState.waitingForHuman || gameState.humanOptions.length === 0) return null

  const pcOptions = gameState.humanOptions.slice(0, 3)
  const compOptions = gameState.companionOptions
  const extraOptions = gameState.humanOptions.slice(3) // skip, potion, archrival

  const pc = gameState.pcs.find(p => p.id === gameState.humanPCId)
  const companion = gameState.companionId ? gameState.pcs.find(p => p.id === gameState.companionId) : null
  const pcSelected = gameState.pendingHumanChoice !== null
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
          <span style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '1.1rem', color: '#f0c860', letterSpacing: '.12em' }}>
            YOUR TURN
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#c9a84c' }}>
            {pc?.name}
          </span>
          {companion && (
            <>
              <span className="text-[#7a5f20] mx-1">&</span>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#90a0c0' }}>
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
              {gameState.shardEntry?.name?.split(' ').pop()} ({gameState.shardCharges})
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="ornate-corners">
          <span className="corner-tl" />
          <span className="corner-tr" />
          <span className="corner-bl" />
          <span className="corner-br" />
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

          {pcOptions.map((opt, idx) => (
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
                onClick={() => selectOption(idx)}
                className={`flex gap-3 p-3 rounded cursor-pointer transition-all mb-2 ${gameState.pendingHumanChoice === idx
                    ? 'border-2 border-[#d4af37] bg-gradient-to-r from-[rgba(90,60,10,.5)] to-[rgba(60,40,10,.4)] shadow-[inset_0_0_12px_rgba(212,175,55,.2)] choice-pulse-gold'
                    : 'border border-[#4a4030] bg-gradient-to-b from-[#1a1610] to-[#12100c] hover:border-[#d4af37] hover:shadow-[0_0_10px_rgba(212,175,55,0.15)]'
                  }`}
              >
                <div className="text-[#d4af37] font-bold font-title text-xl w-8 text-center">{opt.num}</div>
                <div className="flex-1">
                  <div className="text-[#f0e0c0] font-narrative text-base">{opt.action}</div>
                  <div className="text-sm text-[#b08050] mt-1 font-narrative flex items-center gap-1.5">
                    {getAbilityIcon(opt.ability)}
                    <span>[{opt.ability}]</span>
                    {opt.align_note && (
                      <Badge className="ml-2 text-xs bg-[rgba(212,175,55,.15)] text-[#c0a060] border border-[#5a4030]">
                        {opt.align_note}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                    className={`flex gap-3 p-3 rounded cursor-pointer transition-all mb-2 ${gameState.pendingCompanionChoice === idx
                        ? 'border-2 border-[#7090c0] bg-gradient-to-r from-[rgba(40,60,100,.5)] to-[rgba(30,40,70,.4)] shadow-[inset_0_0_12px_rgba(100,140,200,.2)] choice-pulse-blue'
                        : 'border border-[#3a4050] bg-gradient-to-b from-[#15181e] to-[#0e1015] hover:border-[#7090c0] hover:shadow-[0_0_10px_rgba(100,140,200,0.15)]'
                      }`}
                  >
                    <div className={`font-bold font-title text-xl w-8 text-center ${gameState.pendingCompanionChoice === idx ? 'text-[#7090c0]' : 'text-[#5a6a80]'}`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <div className="text-[#f0e0c0] font-narrative text-base">{opt.action}</div>
                      <div className="text-sm text-[#8090b0] mt-1 font-narrative flex items-center gap-1.5">
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
            EXTRA OPTIONS: Skip Turn, Potion, Archrival Summon
            ═══════════════════════════════════════════════════════════════════════ */}
        {extraOptions.length > 0 && (
          <div>
            <div className="text-[#5a4d30] text-xs uppercase tracking-wider mt-2 mb-2 font-title flex items-center gap-2">
              <SkipForward className="w-4 h-4" />
              <span>Other Actions</span>
              <span className="flex-1 h-px bg-[#2a2518]" />
            </div>

            {extraOptions.map((opt, idx) => {
              const actualIdx = idx + 3
              const isRival = opt.source === 'archrival_summon'
              const isSkip = opt.ability === 'skip'
              return (
                <div
                  key={actualIdx}
                  onClick={() => {
                    selectOption(actualIdx)
                    // For skip: also auto-set companion to skip if needed
                    if (isSkip && compOptions.length > 0 && gameState.pendingCompanionChoice === null) {
                      // Skip auto-confirms by setting a sentinel
                    }
                  }}
                  className={`flex gap-3 p-3 rounded cursor-pointer transition-all mb-2 ${gameState.pendingHumanChoice === actualIdx
                      ? isRival
                        ? 'border-2 border-[#c05050] bg-gradient-to-r from-[rgba(80,20,20,.3)] to-[rgba(50,15,15,.2)]'
                        : 'border-2 border-[#5a4d30] bg-gradient-to-r from-[rgba(50,40,20,.3)] to-[rgba(30,25,15,.2)]'
                      : isRival
                        ? 'border border-[#3a2020] bg-[#0d0808] hover:border-[#c05050]'
                        : 'border border-dashed border-[#3a3020] bg-[#0d0a08] hover:border-[#5a4d30]'
                    }`}
                >
                  <div className={`font-bold font-title text-lg w-8 text-center ${isRival ? 'text-[#c05050]' : 'text-[#5a4d30]'}`}>
                    {isRival ? '⚡' : isSkip ? '⏭' : opt.num}
                  </div>
                  <div className="flex-1">
                    <div className={`font-narrative ${isRival ? 'text-[#d09090]' : isSkip ? 'text-[#7a6a50]' : 'text-[#b08050]'}`}>{opt.action}</div>
                  </div>
                  {isRival && <Sparkles className="w-5 h-5 text-[#c05050]" />}
                  {isSkip && <SkipForward className="w-5 h-5 text-[#5a4d30]" />}
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            DICE ROLLER — Shows when a combat ability is selected
            ═══════════════════════════════════════════════════════════════════════ */}
        {isCombat && (
          <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-lg bg-[rgba(40,10,10,.3)] border border-[#5a2020]">
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
                <div className={`text-xl font-bold ${diceRollResult >= parseInt(damageDie.replace('d', '')) * 0.8 ? 'text-[#d4af37]' : 'text-[#f0ebe3]'}`} style={{ fontFamily: 'Cinzel, serif' }}>
                  {diceRollResult}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CONFIRM BUTTON — Both PC and Companion must be selected
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 pt-3 border-t border-[#3a3020]">
          <Button
            onClick={() => {
              if (canConfirm) {
                setConfirmClicked(true)
                setTimeout(() => setConfirmClicked(false), 300)
                confirmChoice()
              }
            }}
            disabled={!canConfirm}
            className={`font-title tracking-wider px-6 text-lg py-5 transition-all ${
              canConfirm
                ? `confirm-ready ${confirmClicked ? 'confirm-click' : ''} bg-gradient-to-b from-[#5a3a10] to-[#3a2510] hover:from-[#7a5020] hover:to-[#5a3a15] text-[#f0d878] border-2 border-[#8a6020] shadow-[0_0_10px_rgba(200,160,60,.2)]`
                : 'bg-gradient-to-b from-[#2a2015] to-[#1a1510] text-[#5a4d30] border-2 border-[#3a3020] cursor-not-allowed'
            }`}
          >
            ⚔ Confirm Choice ⚔
          </Button>
          <span className="text-sm text-[#a08050] italic font-narrative">
            {!pcSelected
              ? 'Select your action above'
              : !compSelected
                ? `Also choose ${companion?.name?.split(' ')[0] || 'companion'}'s action`
                : `Option ${gameState.pendingHumanChoice! + 1}${compOptions.length > 0 ? ` + ${String.fromCharCode(65 + gameState.pendingCompanionChoice!)}` : ''} — Ready!`
            }
          </span>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
