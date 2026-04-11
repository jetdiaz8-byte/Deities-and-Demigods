'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft, ChevronRight, X, Crown, Sword, Shield, Skull, Sparkles, Heart,
  Star, Zap, BookOpen, Dumbbell, Target, Flame
} from 'lucide-react'
import { getPortraitPath, type Character } from '@/lib/characterData'

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS (self-contained — no external deps beyond characterData)
// ═══════════════════════════════════════════════════════════════════════════

const divineRankBadge = (rank?: string): { color: string; icon: React.ReactNode } => {
  switch (rank) {
    case 'Greater God': return { color: 'bg-amber-600 text-amber-100', icon: <Crown className="w-3 h-3" /> }
    case 'Lesser God': return { color: 'bg-purple-600 text-purple-100', icon: <Sparkles className="w-3 h-3" /> }
    case 'Demigod': return { color: 'bg-cyan-600 text-cyan-100', icon: <Zap className="w-3 h-3" /> }
    case 'Hero': return { color: 'bg-green-600 text-green-100', icon: <Sword className="w-3 h-3" /> }
    case 'Monster': return { color: 'bg-red-600 text-red-100', icon: <Skull className="w-3 h-3" /> }
    default: return { color: 'bg-gray-600 text-gray-100', icon: <Star className="w-3 h-3" /> }
  }
}

const categoryIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'greater-gods': return <Crown className="w-4 h-4 text-amber-400" />
    case 'lesser-gods': return <Sparkles className="w-4 h-4 text-purple-400" />
    case 'demigods': return <Zap className="w-4 h-4 text-cyan-400" />
    case 'heroes': return <Sword className="w-4 h-4 text-green-400" />
    case 'monsters': return <Skull className="w-4 h-4 text-red-400" />
    case 'krynn': return <Flame className="w-4 h-4 text-amber-400" />
    default: return <Star className="w-4 h-4 text-gray-400" />
  }
}

const alignColor = (align: string): string => {
  const colors: Record<string, string> = {
    'Lawful good': 'bg-blue-600', 'Neutral good': 'bg-green-600', 'Chaotic good': 'bg-emerald-600',
    'Lawful neutral': 'bg-slate-600', 'Neutral': 'bg-gray-600', 'Chaotic neutral': 'bg-amber-600',
    'Lawful evil': 'bg-red-700', 'Neutral evil': 'bg-purple-600', 'Chaotic evil': 'bg-red-600',
  }
  return colors[align] || 'bg-gray-600'
}

const pantheonColor = (pantheon: string): string => {
  const colors: Record<string, string> = {
    'Greek': 'bg-blue-900/50 text-blue-200', 'Norse': 'bg-slate-700/50 text-slate-200',
    'Egyptian': 'bg-amber-900/50 text-amber-200', 'Indian': 'bg-orange-900/50 text-orange-200',
    'Celtic': 'bg-green-900/50 text-green-200', 'Central American': 'bg-red-900/50 text-red-200',
    'Finnish': 'bg-cyan-900/50 text-cyan-200', 'Japanese': 'bg-pink-900/50 text-pink-200',
    'Babylonian': 'bg-indigo-900/50 text-indigo-200', 'Arthurian': 'bg-violet-900/50 text-violet-200',
    'Chinese': 'bg-yellow-900/50 text-yellow-200', 'American Indian': 'bg-stone-700/50 text-stone-200',
    'Nehwon': 'bg-gray-700/50 text-gray-200', 'Melnibonean': 'bg-purple-900/50 text-purple-200',
    'Cthulhu': 'bg-teal-900/50 text-teal-200', 'Nonhuman': 'bg-emerald-900/50 text-emerald-200',
    'Krynn': 'bg-amber-800/50 text-amber-200', 'Melnibonéan': 'bg-purple-900/50 text-purple-200',
  }
  return colors[pantheon] || 'bg-gray-800/50 text-gray-200'
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
// D&D 5e SKILL INFERENCE
// ═══════════════════════════════════════════════════════════════════════════

const CLASS_SKILLS: Record<string, string[]> = {
  fighter: ['Athletics', 'Intimidation'],
  cleric: ['Religion', 'Medicine', 'Insight'],
  'magic-user': ['Arcana', 'History', 'Investigation'],
  'magic user': ['Arcana', 'History', 'Investigation'],
  thief: ['Stealth', 'Sleight of Hand', 'Acrobatics'],
  ranger: ['Perception', 'Survival', 'Stealth'],
  paladin: ['Athletics', 'Religion', 'Intimidation'],
  druid: ['Nature', 'Medicine', 'Animal Handling'],
  illusionist: ['Arcana', 'Investigation', 'Deception'],
}

const parseAbilityScore = (val: string | undefined): number => {
  if (!val) return 0
  const m = val.match(/^(\d+)/)
  return m ? parseInt(m[1]) : 0
}

const inferSkills = (character: Character): string[] => {
  if (!['hero', 'demigod'].includes(character.type || '')) return []
  const profs = new Set<string>()
  const add = (s: string) => profs.add(s)

  if (character.level) {
    const classEntries: { cls: string; lv: number }[] = []
    const parts = character.level.split('/')
    for (const part of parts) {
      const m = part.match(/(\d+)\w*\s+(.+)/i)
      if (m) classEntries.push({ cls: m[2].trim().toLowerCase(), lv: parseInt(m[1]) })
    }
    classEntries.sort((a, b) => b.lv - a.lv).slice(0, 3).forEach(entry => {
      const skills = CLASS_SKILLS[entry.cls]
      if (skills) skills.forEach(add)
    })
  }

  const abilityText = character.abilities.join(' ').toLowerCase()
  const classKeywords: [string, number][] = [
    ['fighter', parseAbilityScore(character.str)],
    ['cleric', parseAbilityScore(character.wis)],
    ['magic-user', parseAbilityScore(character.int)],
    ['magic user', parseAbilityScore(character.int)],
    ['thief', parseAbilityScore(character.dex)],
    ['ranger', parseAbilityScore(character.dex) + parseAbilityScore(character.wis)],
    ['paladin', parseAbilityScore(character.str) + parseAbilityScore(character.cha)],
    ['druid', parseAbilityScore(character.wis)],
    ['illusionist', parseAbilityScore(character.int)],
  ]
  for (const [keyword, score] of classKeywords) {
    if (abilityText.includes(keyword) && profs.size < 9) {
      const skills = CLASS_SKILLS[keyword]
      if (skills) skills.forEach(add)
    }
  }

  if (profs.size === 0) {
    if (parseAbilityScore(character.str) >= 16) CLASS_SKILLS['fighter']?.forEach(add)
    if (parseAbilityScore(character.wis) >= 16) CLASS_SKILLS['cleric']?.forEach(add)
    if (parseAbilityScore(character.int) >= 16) CLASS_SKILLS['magic-user']?.forEach(add)
    if (parseAbilityScore(character.dex) >= 16) CLASS_SKILLS['thief']?.forEach(add)
  }

  if (parseAbilityScore(character.cha) >= 15) ['Deception', 'Persuasion', 'Performance'].forEach(add)
  if (parseAbilityScore(character.wis) >= 15) ['Perception', 'Survival', 'Animal Handling'].forEach(add)
  if (parseAbilityScore(character.dex) >= 15) ['Acrobatics', 'Stealth'].forEach(add)

  return Array.from(profs)
}

// ═══════════════════════════════════════════════════════════════════════════
// ALIGNMENT BORDER COLOR (from CharacterCard)
// ═══════════════════════════════════════════════════════════════════════════

const ALIGNMENT_BORDER: Record<string, string> = {
  'chaotic evil': '#8B0000',
  'lawful good': '#4169E1',
  'neutral evil': '#6B008B',
  'chaotic good': '#228B22',
  neutral: '#808080',
  'lawful evil': '#4B0082',
  'chaotic neutral': '#DAA520',
  'lawful neutral': '#4682B4',
  'neutral good': '#2E8B57',
}

const getBorderColor = (alignment?: string) => {
  if (!alignment) return '#808080'
  return ALIGNMENT_BORDER[alignment.toLowerCase()] || '#808080'
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER DETAIL MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface CharacterDetailModalProps {
  character: Character | null
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

export function CharacterDetailModal({
  character,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: CharacterDetailModalProps) {
  const [imageError, setImageError] = useState(false)
  if (!character) return null
  const rankBadge = divineRankBadge(character.divineRank)
  const borderColor = getBorderColor(character.align)

  return (
    <Dialog open={!!character} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] bg-slate-900/95 border-slate-700 text-white overflow-hidden"
        style={{ borderColor }}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">{character.name}</DialogTitle>
          <DialogDescription className="sr-only">Character details for {character.name}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={onPrev} disabled={!hasPrev} className="text-gray-400 hover:text-white disabled:opacity-30">
              <ChevronLeft className="w-5 h-5 mr-1" />Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={onNext} disabled={!hasNext} className="text-gray-400 hover:text-white disabled:opacity-30">
              Next<ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-6 p-2">
            <div className="md:w-1/3 flex-shrink-0">
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-800" style={{ aspectRatio: '768/1344' }}>
                {!imageError ? (
                  <Image src={getPortraitPath(character)} alt={character.name} fill className="object-contain" onError={() => setImageError(true)} unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="text-center">{categoryIcon(character.category)}<span className="text-6xl opacity-50 block mt-4">{character.name.charAt(0)}</span></div>
                  </div>
                )}
              </div>
              {character.divineRank && (
                <div className={`mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${rankBadge.color}`}>{rankBadge.icon}<span className="font-bold">{character.divineRank}</span></div>
              )}
            </div>
            <div className="md:w-2/3 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{character.name}</h2>
                <p className="text-lg text-gray-400">{character.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={`${pantheonColor(character.pantheon)} text-sm px-3 py-1`}>{character.pantheon}</Badge>
                <Badge className={`${alignColor(character.align)} text-sm px-3 py-1`}>{character.align}</Badge>
              </div>
              <Separator className="bg-slate-700" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 uppercase tracking-wider">HP</div><div className="text-xl font-bold text-red-400">{character.hp}</div></div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 uppercase tracking-wider">AC</div><div className="text-xl font-bold text-blue-400">{character.AC}</div></div>
                {character.MR !== undefined && character.MR > 0 && <div className="bg-slate-800/50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 uppercase tracking-wider">MR</div><div className="text-xl font-bold text-purple-400">{character.MR}%</div></div>}
                {character.move && <div className="bg-slate-800/50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 uppercase tracking-wider">Move</div><div className="text-xl font-bold text-green-400">{character.move}</div></div>}
                {character.attacks && <div className="bg-slate-800/50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400 uppercase tracking-wider">Attacks</div><div className="text-xl font-bold text-orange-400">{character.attacks}</div></div>}
              </div>
              {(character.str || character.dex || character.con || character.int || character.wis || character.cha) && (
                <>
                  <Separator className="bg-slate-700" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Dumbbell className="w-4 h-4 text-amber-400" />Ability Scores</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: 'STR', val: character.str }, { label: 'DEX', val: character.dex }, { label: 'CON', val: character.con },
                        { label: 'INT', val: character.int }, { label: 'WIS', val: character.wis }, { label: 'CHA', val: character.cha },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-400 uppercase">{s.label}</div>
                          <div className={`text-lg font-bold ${abilityScoreColor(s.val)}`}>{s.val || '-'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {(() => {
                const skills = inferSkills(character)
                if (skills.length === 0) return null
                return (
                  <>
                    <Separator className="bg-slate-700" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" />D&amp;D 5e Skill Proficiencies</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(skill => (
                          <Badge key={skill} className="bg-cyan-900/50 text-cyan-300 text-[11px] px-2 py-0.5">{skill} +2</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}
              {(character.domain || character.symbol) && (
                <>
                  <Separator className="bg-slate-700" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {character.domain && <div><h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" />Domains</h4><p className="text-sm text-gray-400">{character.domain}</p></div>}
                    {character.symbol && <div><h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />Holy Symbol</h4><p className="text-sm text-gray-400">{character.symbol}</p></div>}
                  </div>
                </>
              )}
              <Separator className="bg-slate-700" />
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" />Abilities &amp; Powers</h4>
                <ul className="space-y-1">{character.abilities.map((ability, i) => <li key={i} className="text-sm text-gray-400 flex items-start gap-2"><span className="text-amber-400 mt-1">&#8226;</span><span>{ability}</span></li>)}</ul>
              </div>
              {character.phase1 && (
                <>
                  <Separator className="bg-slate-700" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" />Combat Phases</h4>
                    <div className="space-y-3">
                      {character.phase1 && <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-green-500"><div className="text-xs font-semibold text-green-400 mb-1">PHASE 1</div><p className="text-sm text-gray-300">{character.phase1}</p></div>}
                      {character.phase2 && <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-yellow-500"><div className="text-xs font-semibold text-yellow-400 mb-1">PHASE 2</div><p className="text-sm text-gray-300">{character.phase2}</p></div>}
                      {character.phase3 && <div className="bg-slate-800/30 rounded-lg p-3 border-l-2 border-red-500"><div className="text-xs font-semibold text-red-400 mb-1">PHASE 3</div><p className="text-sm text-gray-300">{character.phase3}</p></div>}
                    </div>
                  </div>
                </>
              )}
              {character.personality && (
                <>
                  <Separator className="bg-slate-700" />
                  <div><h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-400" />Lore &amp; Personality</h4><p className="text-sm text-gray-400 italic">{character.personality}</p></div>
                </>
              )}
              {/* View in Codex link */}
              <Separator className="bg-slate-700" />
              <div className="text-center">
                <Link href="/codex" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors">
                  <BookOpen className="w-3.5 h-3.5" /> View in Codex
                </Link>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
