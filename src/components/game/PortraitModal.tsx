'use client'

import React, { useState, useRef, useMemo } from 'react'
import Image from 'next/image'
import { getAbilityBonus, assignSkillProficiencies } from '@/lib/gameHelpers'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, Sword, Shield, Skull, Sparkles, Heart, 
  Star, Zap, BookOpen, ChevronLeft, ChevronRight, X,
  Dumbbell, Target
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CharacterPortrait {
  id: string
  name: string
  title?: string
  pantheon?: string
  align?: string
  hp?: number
  maxHp?: number
  AC?: number
  MR?: number
  move?: string
  attacks?: string
  abilities?: string[]
  domain?: string
  symbol?: string
  personality?: string
  type?: 'hero' | 'demigod' | 'greater_god' | 'lesser_god' | 'monster'
  category?: string
  str?: string
  dex?: string
  con?: string
  int?: string
  wis?: string
  cha?: string
  phase1?: string
  phase2?: string
  phase3?: string
  conditions?: string[]
  dead?: boolean
}

interface PortraitModalProps {
  character: CharacterPortrait | null
  portraitPath?: string
  isOpen: boolean
  onClose: () => void
  showFullCard?: boolean
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const typeColor = (type: string | undefined): string => {
  switch (type) {
    case 'greater_god': return 'text-amber-400'
    case 'lesser_god': return 'text-purple-400'
    case 'demigod': return 'text-cyan-400'
    case 'hero': return 'text-green-400'
    case 'monster': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

const typeIcon = (type: string | undefined): React.ReactNode => {
  switch (type) {
    case 'greater_god': return <Crown className="w-4 h-4 text-amber-400" />
    case 'lesser_god': return <Sparkles className="w-4 h-4 text-purple-400" />
    case 'demigod': return <Zap className="w-4 h-4 text-cyan-400" />
    case 'hero': return <Sword className="w-4 h-4 text-green-400" />
    case 'monster': return <Skull className="w-4 h-4 text-red-400" />
    default: return <Star className="w-4 h-4 text-gray-400" />
  }
}

const typeLabel = (type: string | undefined): string => {
  switch (type) {
    case 'greater_god': return 'Greater God'
    case 'lesser_god': return 'Lesser God'
    case 'demigod': return 'Demigod'
    case 'hero': return 'Hero'
    case 'monster': return 'Monster'
    default: return 'Entity'
  }
}

const alignColor = (align: string | undefined): string => {
  if (!align) return 'bg-gray-600'
  const colors: { [key: string]: string } = {
    'Lawful good': 'bg-blue-600',
    'Neutral good': 'bg-green-600',
    'Chaotic good': 'bg-emerald-600',
    'Lawful neutral': 'bg-slate-600',
    'Neutral': 'bg-gray-600',
    'Chaotic neutral': 'bg-amber-600',
    'Lawful evil': 'bg-red-700',
    'Neutral evil': 'bg-purple-600',
    'Chaotic evil': 'bg-red-600'
  }
  return colors[align] || 'bg-gray-600'
}

const abilityScoreColor = (score: string | undefined): string => {
  if (!score) return 'text-gray-500'
  const num = parseInt(score.replace(/\D/g, '')) || 0
  if (num >= 18) return 'text-amber-400'
  if (num >= 16) return 'text-green-400'
  if (num >= 14) return 'text-blue-400'
  if (num >= 12) return 'text-cyan-400'
  return 'text-gray-400'
}



// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PortraitModal({ 
  character, 
  portraitPath, 
  isOpen, 
  onClose, 
  showFullCard = true,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: PortraitModalProps) {
  const [imageError, setImageError] = useState(false)
  const [viewMode, setViewMode] = useState<'portrait' | 'card'>('card')
  const prevCharIdRef = useRef<string | undefined>(undefined)

  const proficiencies = useMemo(() => {
    if (!character || !['hero', 'demigod'].includes(character.type || '')) return []
    const result = assignSkillProficiencies(character as any)
    return result.proficiencies
  }, [character])

  // Reset imageError when character changes - using ref to avoid effect setState issue
  if (character?.id !== prevCharIdRef.current) {
    prevCharIdRef.current = character?.id
    if (imageError) {
      setImageError(false)
    }
  }

  if (!character || !isOpen) return null

  const path = portraitPath || `/portraits/${character.category || 'heroes'}/${character.id}.png`
  const hpPercent = character.maxHp ? Math.max(0, Math.min(100, ((character.hp || 0) / character.maxHp) * 100)) : 100

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] bg-slate-900/98 border-slate-700 text-white overflow-hidden p-0">
        <DialogTitle className="sr-only">{character.name}</DialogTitle>
        <DialogDescription className="sr-only">Character details for {character.name}</DialogDescription>
        {/* Navigation Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'portrait' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('portrait')}
              className="text-xs"
            >
              Portrait Only
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="text-xs"
            >
              Full Card
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={!hasNext}
              className="text-gray-400 hover:text-white disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'portrait' ? (
          /* Portrait Only View */
          <div className="relative w-full h-[80vh] bg-slate-950 flex items-center justify-center">
            {!imageError ? (
              <Image
                src={path}
                alt={character.name}
                fill
                className="object-contain p-4"
                onError={() => setImageError(true)}
                unoptimized
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                {typeIcon(character.type)}
                <span className="text-8xl opacity-30 mt-4">{character.name.charAt(0)}</span>
              </div>
            )}
            
            {/* Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <h2 className="text-3xl font-bold text-white">{character.name}</h2>
              <p className="text-lg text-gray-300">{character.title}</p>
            </div>
          </div>
        ) : (
          /* Full Card View */
          <ScrollArea className="max-h-[85vh]">
            <div className="flex flex-col lg:flex-row gap-6 p-6">
              {/* Portrait Column - 768x1344 aspect ratio */}
              <div className="lg:w-2/5 flex-shrink-0">
                <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800" style={{ aspectRatio: '768/1344' }}>
                  {!imageError ? (
                    <Image
                      src={path}
                      alt={character.name}
                      fill
                      className="object-contain"
                      onError={() => setImageError(true)}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <div className="text-center">
                        {typeIcon(character.type)}
                        <span className="text-6xl opacity-50 block mt-4">{character.name.charAt(0)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* HP Bar */}
                {character.maxHp && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Hit Points</span>
                      <span className={`font-bold ${hpPercent < 25 ? 'text-red-400' : hpPercent < 50 ? 'text-amber-400' : 'text-green-400'}`}>
                        {character.hp || character.maxHp} / {character.maxHp}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          hpPercent < 25 ? 'bg-red-500' : hpPercent < 50 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Type Badge */}
                <div className="mt-3 flex items-center justify-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                  {typeIcon(character.type)}
                  <span className={`font-bold ${typeColor(character.type)}`}>{typeLabel(character.type)}</span>
                </div>
              </div>
              
              {/* Stats Column */}
              <div className="lg:w-3/5 space-y-4">
                {/* Name and Title */}
                <div>
                  <h2 className="text-3xl font-bold text-white">{character.name}</h2>
                  <p className="text-xl text-gray-400">{character.title}</p>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {character.pantheon && (
                    <Badge className="bg-blue-900/50 text-blue-200 text-sm px-3 py-1">
                      {character.pantheon}
                    </Badge>
                  )}
                  {character.align && (
                    <Badge className={`${alignColor(character.align)} text-sm px-3 py-1`}>
                      {character.align}
                    </Badge>
                  )}
                </div>
                
                <Separator className="bg-slate-700" />
                
                {/* Core Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {character.maxHp && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">HP</div>
                      <div className="text-xl font-bold text-red-400">{character.hp || character.maxHp}</div>
                    </div>
                  )}
                  {character.AC !== undefined && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">AC</div>
                      <div className="text-xl font-bold text-blue-400">{character.AC}</div>
                    </div>
                  )}
                  {character.MR !== undefined && character.MR > 0 && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">MR</div>
                      <div className="text-xl font-bold text-purple-400">{character.MR}%</div>
                    </div>
                  )}
                  {character.move && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Move</div>
                      <div className="text-xl font-bold text-green-400">{character.move}</div>
                    </div>
                  )}
                  {character.attacks && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Attacks</div>
                      <div className="text-xl font-bold text-orange-400">{character.attacks}</div>
                    </div>
                  )}
                </div>
                
                {/* Ability Scores */}
                {(character.str || character.dex || character.con || character.int || character.wis || character.cha) && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-amber-400" />
                        Ability Scores
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { abbr: 'STR', val: character.str },
                          { abbr: 'DEX', val: character.dex },
                          { abbr: 'CON', val: character.con },
                          { abbr: 'INT', val: character.int },
                          { abbr: 'WIS', val: character.wis },
                          { abbr: 'CHA', val: character.cha }
                        ].map(abil => (
                          <div key={abil.abbr} className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-400 uppercase">{abil.abbr}</div>
                            <div className={`text-lg font-bold ${abilityScoreColor(abil.val)}`}>
                              {abil.val || '-'}
                            </div>
                            <div className="text-xs text-gray-500">{getAbilityBonus(abil.val).display}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Skill Proficiencies — heroes & demigods only */}
                {['hero', 'demigod'].includes(character.type || '') && proficiencies.length > 0 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        Skill Proficiencies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {proficiencies.map(skill => (
                          <Badge key={skill} className="bg-cyan-900/50 text-cyan-300 text-xs px-2 py-1">
                            {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} <span className="text-cyan-200 font-bold">+2</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Domain and Symbol */}
                {(character.domain || character.symbol) && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {character.domain && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Domains
                          </h4>
                          <p className="text-sm text-gray-400">{character.domain}</p>
                        </div>
                      )}
                      {character.symbol && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400" />
                            Holy Symbol
                          </h4>
                          <p className="text-sm text-gray-400">{character.symbol}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Abilities */}
                {character.abilities && character.abilities.length > 0 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-400" />
                        Abilities & Powers
                      </h4>
                      <ul className="space-y-1">
                        {character.abilities.map((ability, i) => (
                          <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-amber-400 mt-1">•</span>
                            <span>{ability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                
                {/* Combat Phases */}
                {character.phase1 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        Combat Phases
                      </h4>
                      <div className="space-y-3">
                        {character.phase1 && (
                          <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-green-500">
                            <div className="text-xs font-semibold text-green-400 mb-1">PHASE 1</div>
                            <p className="text-sm text-gray-300">{character.phase1}</p>
                          </div>
                        )}
                        {character.phase2 && (
                          <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-yellow-500">
                            <div className="text-xs font-semibold text-yellow-400 mb-1">PHASE 2</div>
                            <p className="text-sm text-gray-300">{character.phase2}</p>
                          </div>
                        )}
                        {character.phase3 && (
                          <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-red-500">
                            <div className="text-xs font-semibold text-red-400 mb-1">PHASE 3</div>
                            <p className="text-sm text-gray-300">{character.phase3}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Personality/Lore */}
                {character.personality && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        Lore & Personality
                      </h4>
                      <p className="text-sm text-gray-400 italic">{character.personality}</p>
                    </div>
                  </>
                )}
                
                {/* Conditions */}
                {character.conditions && character.conditions.length > 0 && (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Conditions</h4>
                      <div className="flex flex-wrap gap-2">
                        {character.conditions.map((cond, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PortraitModal
