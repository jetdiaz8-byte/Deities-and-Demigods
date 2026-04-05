'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { assignSkillProficiencies } from '@/lib/gameHelpers'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, Sword, Shield, Skull, Sparkles, Heart, 
  Star, Zap, BookOpen, ChevronDown, ChevronUp,
  Dumbbell, X, Target
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ActiveCharacter {
  id: string
  name: string
  title?: string
  pantheon?: string
  align?: string
  hp: number
  maxHp: number
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
  portrait?: string
  skills?: string[]
}

interface ActiveCharacterCardProps {
  character: ActiveCharacter
  portraitPath?: string
  compact?: boolean
  onClose?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

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

const typeIcon = (type: string | undefined): React.ReactNode => {
  switch (type) {
    case 'greater_god': return <Crown className="w-3 h-3 text-amber-400" />
    case 'lesser_god': return <Sparkles className="w-3 h-3 text-purple-400" />
    case 'demigod': return <Zap className="w-3 h-3 text-cyan-400" />
    case 'hero': return <Sword className="w-3 h-3 text-green-400" />
    case 'monster': return <Skull className="w-3 h-3 text-red-400" />
    default: return <Star className="w-3 h-3 text-gray-400" />
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

const typeColor = (type: string | undefined): string => {
  switch (type) {
    case 'greater_god': return 'bg-amber-600 text-amber-100'
    case 'lesser_god': return 'bg-purple-600 text-purple-100'
    case 'demigod': return 'bg-cyan-600 text-cyan-100'
    case 'hero': return 'bg-green-600 text-green-100'
    case 'monster': return 'bg-red-600 text-red-100'
    default: return 'bg-gray-600 text-gray-100'
  }
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

export function ActiveCharacterCard({ character, portraitPath, compact = false, onClose }: ActiveCharacterCardProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [imageError, setImageError] = useState(false)

  const proficiencies = useMemo(() => {
    if (!['hero', 'demigod'].includes(character.type || '')) return []
    const result = assignSkillProficiencies(character as any)
    return result.proficiencies
  }, [character])

  const hpPercent = Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100))
  const isWounded = hpPercent < 100
  const isCritical = hpPercent < 25

  return (
    <Card className={`bg-slate-800/90 border-slate-700 text-white overflow-hidden ${character.dead ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <div 
          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/30"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Mini Portrait */}
          <div className="relative w-12 h-12 rounded overflow-hidden bg-slate-700 flex-shrink-0">
            {portraitPath && !imageError ? (
              <Image
                src={portraitPath}
                alt={character.name}
                fill
                className="object-contain"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {typeIcon(character.type)}
              </div>
            )}
          </div>

          {/* Name and HP */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm truncate">{character.name}</span>
              <Badge className={`text-xs ${typeColor(character.type)}`}>
                {typeLabel(character.type)}
              </Badge>
            </div>
            
            {/* HP Bar */}
            <div className="mt-1">
              <div className="flex items-center gap-2 text-xs">
                <Heart className={`w-3 h-3 ${isCritical ? 'text-red-400 animate-pulse' : 'text-red-400'}`} />
                <span className={isCritical ? 'text-red-400 font-bold' : 'text-gray-400'}>
                  {character.hp}/{character.maxHp}
                </span>
                {isWounded && (
                  <span className="text-xs text-amber-400">
                    ({Math.floor(hpPercent)}%)
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCritical ? 'bg-red-500' : isWounded ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                onClick={(e) => { e.stopPropagation(); onClose() }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {compact && (
              expanded 
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-slate-700 p-3 space-y-3">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <div className="text-gray-400 uppercase">AC</div>
                <div className="font-bold text-blue-400">{character.AC ?? '-'}</div>
              </div>
              <div className="bg-slate-700/50 rounded p-2 text-center">
                <div className="text-gray-400 uppercase">HP</div>
                <div className={`font-bold ${isCritical ? 'text-red-400' : 'text-red-400'}`}>
                  {character.hp}/{character.maxHp}
                </div>
              </div>
              {(character.MR !== undefined && character.MR > 0) && (
                <div className="bg-slate-700/50 rounded p-2 text-center">
                  <div className="text-gray-400 uppercase">MR</div>
                  <div className="font-bold text-purple-400">{character.MR}%</div>
                </div>
              )}
            </div>

            {/* Ability Scores */}
            {(character.str || character.dex || character.con || character.int || character.wis || character.cha) && (
              <div className="grid grid-cols-6 gap-1 text-xs">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((abil) => (
                  <div key={abil} className="bg-slate-700/50 rounded p-1 text-center">
                    <div className="text-gray-500 uppercase text-[10px]">{abil}</div>
                    <div className={`font-bold ${abilityScoreColor((character as any)[abil])}`}>
                      {(character as any)[abil] || '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills — heroes & demigods only */}
            {['hero', 'demigod'].includes(character.type || '') && proficiencies.length > 0 && (
              <div className="text-xs">
                <div className="flex items-center gap-1 text-gray-400 mb-1">
                  <Target className="w-3 h-3" />
                  <span>Skills</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {proficiencies.map(skill => (
                    <Badge key={skill} className="bg-cyan-900/50 text-cyan-300 text-[10px] px-1.5 py-0">
                      {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} +2
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {character.conditions && character.conditions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {character.conditions.map((cond, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">
                    {cond}
                  </Badge>
                ))}
              </div>
            )}

            {/* Domain/Symbol for gods */}
            {character.domain && (
              <div className="text-xs">
                <span className="text-gray-400">Domains: </span>
                <span className="text-amber-400">{character.domain}</span>
              </div>
            )}

            {/* Abilities Preview */}
            {character.abilities && character.abilities.length > 0 && (
              <div className="text-xs">
                <div className="flex items-center gap-1 text-gray-400 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Abilities</span>
                </div>
                <ScrollArea className="max-h-24">
                  <ul className="space-y-0.5">
                    {character.abilities.slice(0, 3).map((ability, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        <span className="line-clamp-1">{ability}</span>
                      </li>
                    ))}
                    {character.abilities.length > 3 && (
                      <li className="text-gray-500 text-[10px]">
                        +{character.abilities.length - 3} more...
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Phase indicator for bosses */}
            {(character.phase1 || character.phase2 || character.phase3) && (
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-gray-400">Boss Phases</span>
                </div>
                <div className="flex gap-1 mt-1">
                  {character.phase1 && (
                    <Badge className="bg-green-900/50 text-green-300 text-[10px]">P1</Badge>
                  )}
                  {character.phase2 && (
                    <Badge className="bg-yellow-900/50 text-yellow-300 text-[10px]">P2</Badge>
                  )}
                  {character.phase3 && (
                    <Badge className="bg-red-900/50 text-red-300 text-[10px]">P3</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActiveCharacterCard
