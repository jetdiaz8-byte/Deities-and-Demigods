'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ALL_CHARACTERS, GREATER_GODS, LESSER_GODS, DEMIGODS, HEROES, MONSTERS,
  getPortraitPath, getAllPantheons, Character, getCharacterCounts
} from '@/lib/characterData'
import { SHARD_NAMES, INJURY_TABLE, ITEM_TEMPLATES } from '@/lib/gameConstants'
import { 
  Search, X, Crown, Sword, Shield, Skull, Sparkles, Heart, 
  ChevronLeft, ChevronRight, Star, Zap, BookOpen, Users, Flame,
  Brain, Dumbbell, Footprints, ShieldCheck, Smile, Gem,
  ScrollText, Droplet, Ghost, Swords, Package
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const alignColor = (align: string): string => {
  const colors: { [key: string]: string } = {
    'Lawful good': 'bg-blue-600', 'Neutral good': 'bg-green-600', 'Chaotic good': 'bg-emerald-600',
    'Lawful neutral': 'bg-slate-600', 'Neutral': 'bg-gray-600', 'Chaotic neutral': 'bg-amber-600',
    'Lawful evil': 'bg-red-700', 'Neutral evil': 'bg-purple-600', 'Chaotic evil': 'bg-red-600'
  }
  return colors[align] || 'bg-gray-600'
}

const alignShort = (align: string): string => {
  const shorts: { [key: string]: string } = {
    'Lawful good': 'LG', 'Neutral good': 'NG', 'Chaotic good': 'CG',
    'Lawful neutral': 'LN', 'Neutral': 'N', 'Chaotic neutral': 'CN',
    'Lawful evil': 'LE', 'Neutral evil': 'NE', 'Chaotic evil': 'CE'
  }
  return shorts[align] || '??'
}

const categoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'greater-gods': 'from-amber-500/20 to-orange-500/20 border-amber-500/50',
    'lesser-gods': 'from-purple-500/20 to-violet-500/20 border-purple-500/50',
    'demigods': 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50',
    'heroes': 'from-green-500/20 to-emerald-500/20 border-green-500/50',
    'monsters': 'from-red-500/20 to-rose-500/20 border-red-500/50',
    'krynn': 'from-amber-600/20 to-yellow-600/20 border-amber-400/50'
  }
  return colors[category] || 'from-gray-500/20 to-slate-500/20 border-gray-500/50'
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

const pantheonColor = (pantheon: string): string => {
  const colors: { [key: string]: string } = {
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

// ═══════════════════════════════════════════════════════════════════════════
// CHARACTER CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface CharacterCardProps { character: Character; onClick: () => void }

function CharacterCard({ character, onClick }: CharacterCardProps) {
  const [imageError, setImageError] = useState(false)
  const rankBadge = divineRankBadge(character.divineRank)
  
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${categoryColor(character.category)} backdrop-blur-sm border hover:shadow-lg hover:shadow-black/30`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg" style={{ aspectRatio: '768/1344' }}>
          {!imageError ? (
            <Image src={getPortraitPath(character)} alt={character.name} fill className="object-contain transition-transform duration-300 group-hover:scale-110" onError={() => setImageError(true)} unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              {categoryIcon(character.category)}
              <span className="text-4xl opacity-50 ml-2">{character.name.charAt(0)}</span>
            </div>
          )}
          {character.divineRank && (
            <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${rankBadge.color}`}>
              {rankBadge.icon}<span>{character.divineRank}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-xs font-mono">
            <Heart className="w-3 h-3 inline mr-1 text-red-400" />{character.hp} HP
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-white truncate text-sm">{character.name}</h3>
          <p className="text-xs text-gray-400 truncate">{character.title}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="secondary" className={`text-xs ${pantheonColor(character.pantheon)}`}>{character.pantheon}</Badge>
            <Badge variant="secondary" className={`text-xs ${alignColor(character.align)}`}>{alignShort(character.align)}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />AC {character.AC}</span>
            {character.MR !== undefined && character.MR > 0 && (
              <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />MR {character.MR}%</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ABILITY SCORE DISPLAY HELPER
// ═══════════════════════════════════════════════════════════════════════════

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
// CHARACTER DETAIL MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface CharacterDetailProps {
  character: Character | null; onClose: () => void
  onNext?: () => void; onPrev?: () => void; hasNext?: boolean; hasPrev?: boolean
}

function CharacterDetail({ character, onClose, onNext, onPrev, hasNext, hasPrev }: CharacterDetailProps) {
  const [imageError, setImageError] = useState(false)
  if (!character) return null
  const rankBadge = divineRankBadge(character.divineRank)
  
  return (
    <Dialog open={!!character} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-900/95 border-slate-700 text-white overflow-hidden">
        <DialogHeader><DialogTitle className="sr-only">{character.name}</DialogTitle></DialogHeader>
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
                        { label: 'INT', val: character.int }, { label: 'WIS', val: character.wis }, { label: 'CHA', val: character.cha }
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
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME MECHANICS TAB DATA
// ═══════════════════════════════════════════════════════════════════════════

const SHARD_PANTHEON_COUNTS = SHARD_NAMES.reduce((acc, s) => { acc[s.pantheon] = (acc[s.pantheon] || 0) + 1; return acc }, {} as Record<string, number>)

const PROPHECY_DATA = [
  { name: 'The Last Sunrise', bonus: '+3 success rate when fulfilled', desc: 'The sun shall set for the final time\u2014but your party may light a new dawn or let the darkness claim the world.' },
  { name: 'The Blood Covenant', bonus: '+5 success rate vs Greater Gods', desc: 'A bond forged in blood between mortal and divine. One of you must die for the other to live.' },
  { name: 'The Shattered Mirror', bonus: '+4 on deception actions', desc: 'Every truth has a reflection. In the broken mirror, the reflection tells a different story.' },
  { name: "The Titan's Dream", bonus: '+6 success rate in Act III', desc: 'The Titans dreamed the world into being. They are dreaming still. If they wake, the dream ends.' },
  { name: "The Wanderer's Path", bonus: '+2 per act completed', desc: 'Not all who wander are lost. Some are searching for something that does not wish to be found.' },
  { name: 'The Unwritten', bonus: 'Rolls a fresh prophecy on transfer', desc: 'No oracle has seen this fate. No scribe has recorded it. It is the blank page at the end of every book.' },
  { name: 'The Forgotten Name', bonus: '+5 on banishment actions', desc: 'There was once a god whose name was erased from every tablet, every tongue, every memory. This prophecy remembers.' },
  { name: 'The Final Harvest', bonus: '+4 success rate, +10% loot', desc: 'What is sown must be reaped. What was taken must be returned. The harvest comes for all, even gods.' },
]

const INJURY_CATEGORIES = [
  { type: 'Physical', icon: Swords, color: 'text-red-400', border: 'border-red-700/50', count: 8, dot: 1, examples: 'Deep Cut, Bruised Ribs, Internal Bleeding, Severed Tendon' },
  { type: 'Magical', icon: Zap, color: 'text-blue-400', border: 'border-blue-700/50', count: 6, dot: 0, examples: 'Arcane Burn, Soul Fracture, Planar Taint, Spellscar' },
  { type: 'Poison', icon: Droplet, color: 'text-green-400', border: 'border-green-700/50', count: 6, dot: 3, examples: 'Weak Poison, Necrotic Venom, Paralytic Toxin, Blood Toxin' },
  { type: 'Psionic', icon: Brain, color: 'text-purple-400', border: 'border-purple-700/50', count: 6, dot: 0, examples: 'Mental Fatigue, Psychic Trauma, Mind Bleed, Ego Fracture' },
  { type: 'Cursed', icon: Ghost, color: 'text-amber-400', border: 'border-amber-700/50', count: 2, dot: 0, examples: 'Cursed Wound, Divine Mark' },
]

const ITEM_RARITY_DATA = [
  { rarity: 'Common', color: 'bg-gray-600', count: 7, examples: 'Healing Potion, Antitoxin, Scroll of Identification, Stone of Good Luck' },
  { rarity: 'Uncommon', color: 'bg-emerald-700', count: 8, examples: 'Greater Healing, Diplomat\'s Ring, Cloak of Displacement, Blessed Cloak' },
  { rarity: 'Rare', color: 'bg-blue-700', count: 11, examples: 'Mithral Chain, Frost Brand, Boots of Speed, Bag of Holding, Mysterious Key' },
  { rarity: 'Legendary', color: 'bg-amber-700', count: 9, examples: 'Aegis Fragment, Vorpal Blade, Stormbringer Shard, Golden Fleece, Eye of Horus' },
]

const ITEM_TYPE_COUNTS = ITEM_TEMPLATES.reduce((acc, item) => { acc[item.type] = (acc[item.type] || 0) + 1; return acc }, {} as Record<string, number>)

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CODEX PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function CodexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPantheon, setSelectedPantheon] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [topTab, setTopTab] = useState<string>('characters')
  const [expandedShard, setExpandedShard] = useState<string | null>(null)
  
  const pantheons = useMemo(() => getAllPantheons(), [])
  const counts = useMemo(() => getCharacterCounts(), [])
  
  const filteredCharacters = useMemo(() => {
    let result = ALL_CHARACTERS
    if (selectedCategory !== 'all') result = result.filter(c => c.category === selectedCategory)
    if (selectedPantheon !== 'all') result = result.filter(c => c.pantheon === selectedPantheon)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || (c.domain && c.domain.toLowerCase().includes(q)) || (c.personality && c.personality.toLowerCase().includes(q)))
    }
    return result
  }, [selectedCategory, selectedPantheon, searchQuery])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /><span>Back to Game</span></Link>
              <Separator orientation="vertical" className="h-8 bg-slate-700" />
              <div className="flex items-center gap-2"><BookOpen className="w-6 h-6 text-amber-400" /><h1 className="text-xl font-bold text-white">Codex</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={topTab} onValueChange={setTopTab}>
                <TabsList className="bg-slate-800/50 border border-slate-700">
                  <TabsTrigger value="characters" className="data-[state=active]:bg-amber-600 text-xs">Characters</TabsTrigger>
                  <TabsTrigger value="mechanics" className="data-[state=active]:bg-amber-600 text-xs">Game Mechanics</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CHARACTER BROWSER TAB */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {topTab === 'characters' && (
          <>
            {/* Intro Text */}
            <div className="max-w-3xl mb-6">
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                This Codex holds the living pantheon of Mythworld: <span className="text-amber-400 font-semibold">{counts.all} beings</span> who have crossed the threshold from myth into memory. They are the ones who were worshipped before history learned to write itself down.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" /> {counts['greater-gods']} Greater Gods (HP 300&ndash;450)</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-purple-400" /> {counts['lesser-gods']} Lesser Gods (HP 200&ndash;350)</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-400" /> {counts.demigods} Demigods (HP 150&ndash;300)</span>
                <span className="flex items-center gap-1"><Sword className="w-3 h-3 text-green-400" /> {counts.heroes} Heroes (HP 50&ndash;150)</span>
                <span className="flex items-center gap-1"><Skull className="w-3 h-3 text-red-400" /> {counts.monsters} Monsters (HP 40&ndash;300)</span>
              </div>
              {counts.krynn > 0 && (
                <p className="text-gray-500 text-xs italic">Plus {counts.krynn} beings from the world of Krynn, where dragons wage eternal war and the gods themselves walk among mortals.</p>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
                <TabsList className="bg-slate-800/50 border border-slate-700 flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">All ({counts.all})</TabsTrigger>
                  <TabsTrigger value="greater-gods" className="data-[state=active]:bg-amber-900/50"><Crown className="w-3 h-3 mr-1" />Greater ({counts['greater-gods']})</TabsTrigger>
                  <TabsTrigger value="lesser-gods" className="data-[state=active]:bg-purple-900/50"><Sparkles className="w-3 h-3 mr-1" />Lesser ({counts['lesser-gods']})</TabsTrigger>
                  <TabsTrigger value="demigods" className="data-[state=active]:bg-cyan-900/50"><Zap className="w-3 h-3 mr-1" />Demigods ({counts.demigods})</TabsTrigger>
                  <TabsTrigger value="heroes" className="data-[state=active]:bg-green-900/50"><Sword className="w-3 h-3 mr-1" />Heroes ({counts.heroes})</TabsTrigger>
                  <TabsTrigger value="monsters" className="data-[state=active]:bg-red-900/50"><Skull className="w-3 h-3 mr-1" />Monsters ({counts.monsters})</TabsTrigger>
                  {counts.krynn > 0 && <TabsTrigger value="krynn" className="data-[state=active]:bg-amber-800/50"><Flame className="w-3 h-3 mr-1" />Krynn ({counts.krynn})</TabsTrigger>}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <Select value={selectedPantheon} onValueChange={setSelectedPantheon}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Filter by Pantheon" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-80">
                    <SelectItem value="all">All Pantheons</SelectItem>
                    {pantheons.map(pantheon => <SelectItem key={pantheon} value={pantheon}>{pantheon}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mb-4 text-sm text-gray-400">
              Showing {filteredCharacters.length} character{filteredCharacters.length !== 1 ? 's' : ''}{selectedPantheon !== 'all' && ` from ${selectedPantheon}`}{searchQuery && ` matching "${searchQuery}"`}
            </div>
            
            {filteredCharacters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredCharacters.map(character => <CharacterCard key={character.id} character={character} onClick={() => setSelectedCharacter(character)} />)}
              </div>
            ) : (
              <div className="text-center py-20"><div className="text-6xl mb-4">&#128218;</div><h3 className="text-xl font-semibold text-gray-300 mb-2">No Characters Found</h3><p className="text-gray-500">Try adjusting your filters or search query</p></div>
            )}
          </>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* GAME MECHANICS TAB */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {topTab === 'mechanics' && (
          <div className="space-y-8">
            {/* Intro */}
            <div className="max-w-3xl">
              <p className="text-gray-300 text-lg leading-relaxed italic">
                Beneath the pantheon lies the machinery of fate. The Shards, the injuries, the prophecies, the relics of forgotten ages &mdash; these are the forces that shape every campaign, every battle, every breathless turn of the dice.
              </p>
            </div>

            {/* ═══ SHARD TYPES TABLE ═══ */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <h2 className="text-white text-xl flex items-center gap-2"><Gem className="w-5 h-5 text-amber-400" />The {SHARD_NAMES.length} Shards of Power</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Each campaign begins with one Shard &mdash; an artifact drawn from {Object.keys(SHARD_PANTHEON_COUNTS).length} pantheons. Shards hold 2 charges and allow your party to summon divine beings. A d20 roll against DC 10 determines success. Greater summons exhaust all charges and may <span className="text-red-400 font-semibold">darken the shard</span>.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {Object.entries(SHARD_PANTHEON_COUNTS).map(([pantheon, count]) => (
                    <div key={pantheon} className="text-center p-2 rounded bg-slate-700/50">
                      <div className="text-lg font-bold text-amber-400">{count}</div>
                      <div className="text-xs text-gray-400">{pantheon}</div>
                    </div>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                  {SHARD_NAMES.map((shard) => (
                    <div key={shard.name} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors" onClick={() => setExpandedShard(expandedShard === shard.name ? null : shard.name)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{shard.name}</span>
                          <Badge variant="secondary" className={`${pantheonColor(shard.pantheon)} text-xs`}>{shard.pantheon}</Badge>
                        </div>
                        <Badge className="bg-amber-900/50 text-amber-300 text-xs whitespace-nowrap">{shard.power}</Badge>
                      </div>
                      {expandedShard === shard.name && (
                        <p className="mt-2 text-sm text-gray-400 italic border-t border-slate-600 pt-2">{shard.origin}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ═══ PROPHECIES ═══ */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <h2 className="text-white text-xl flex items-center gap-2"><ScrollText className="w-5 h-5 text-purple-400" />The Eight Prophecies</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Each PC carries a prophecy bound to the Shard. Prophecies progress through five states: <span className="text-gray-100">dormant</span> &rarr; <span className="text-amber-300">awakening</span> &rarr; <span className="text-yellow-300">manifesting</span> &rarr; <span className="text-green-300">fulfilled</span> or <span className="text-red-300">broken</span>. When a PC dies, the prophecy passes to a successor, accumulating the grief of all previous holders.</p>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { state: 'Dormant', color: 'bg-gray-600', bonus: '+0' },
                    { state: 'Awakening', color: 'bg-amber-700', bonus: '+3' },
                    { state: 'Manifesting', color: 'bg-yellow-600', bonus: '+5' },
                    { state: 'Fulfilled', color: 'bg-green-600', bonus: '+8' },
                    { state: 'Broken', color: 'bg-red-700', bonus: '-5' },
                  ].map(s => (
                    <div key={s.state} className="text-center p-2 rounded bg-slate-700/50">
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${s.color} mb-1`}>{s.state}</div>
                      <div className="text-sm font-bold text-gray-300">{s.bonus}%</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {PROPHECY_DATA.map(p => (
                    <div key={p.name} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{p.name}</span>
                        <Badge className="bg-purple-900/50 text-purple-300 text-xs">{p.bonus}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 italic">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ═══ INJURIES ═══ */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <h2 className="text-white text-xl flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" />Injury System &mdash; {INJURY_TABLE.length} Types</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Wounds come in five forms. Each injury persists for a number of turns determined by its cure description. DOT (damage over time) injuries drain HP at the start of each turn. Some injuries carry permanent penalties until cured by magic.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {INJURY_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <div key={cat.type} className={`p-4 rounded-lg bg-slate-700/30 border ${cat.border}`}>
                        <div className="flex items-center gap-2 mb-2"><Icon className={`w-4 h-4 ${cat.color}`} /><span className={`font-bold text-sm ${cat.color}`}>{cat.type}</span></div>
                        <div className="text-2xl font-bold text-white mb-1">{cat.count}</div>
                        <div className="text-xs text-gray-400 mb-2">injuries{cat.dot > 0 && ` (${cat.dot} with DOT)`}</div>
                        <div className="text-xs text-gray-500">{cat.examples}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-gray-400">Injury</th>
                        <th className="text-left py-2 text-gray-400">Type</th>
                        <th className="text-left py-2 text-gray-400">Effect</th>
                        <th className="text-left py-2 text-gray-400">Cure</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {INJURY_TABLE.map(inj => (
                        <tr key={inj.id} className="border-b border-slate-700/50">
                          <td className="py-1.5 text-white">{inj.icon} {inj.name}</td>
                          <td className="py-1.5"><Badge className={`${inj.type === 'physical' ? 'bg-red-900/50 text-red-300' : inj.type === 'magic' ? 'bg-blue-900/50 text-blue-300' : inj.type === 'poison' ? 'bg-green-900/50 text-green-300' : inj.type === 'psionic' ? 'bg-purple-900/50 text-purple-300' : 'bg-amber-900/50 text-amber-300'} text-xs`}>{inj.type}</Badge></td>
                          <td className="py-1.5 text-xs text-gray-400">{inj.effect}</td>
                          <td className="py-1.5 text-xs text-gray-500">{inj.cure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ═══ ITEMS & RARITY ═══ */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <h2 className="text-white text-xl flex items-center gap-2"><Package className="w-5 h-5 text-amber-400" />Items &amp; Equipment &mdash; {ITEM_TEMPLATES.length} Items</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Items are acquired through NPC encounters, monster drops, exploration, pickpocketing, conversation, and quest rewards. They fall into four categories and four rarity tiers. Active items consume charges on use; equipment provides passive bonuses indefinitely.</p>
                
                {/* Item Type Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {Object.entries(ITEM_TYPE_COUNTS).map(([type, count]) => (
                    <div key={type} className="text-center p-3 rounded bg-slate-700/50">
                      <div className="text-lg font-bold text-white">{count}</div>
                      <div className="text-xs text-gray-400 capitalize">{type}s</div>
                    </div>
                  ))}
                </div>

                {/* Rarity Tiers */}
                <h3 className="text-white font-bold text-sm mb-3">Rarity System</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {ITEM_RARITY_DATA.map(r => (
                    <div key={r.rarity} className={`p-3 rounded-lg ${r.color}/20 border border-current/20`}>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${r.color} mb-2`}>{r.rarity}</div>
                      <div className="text-2xl font-bold text-white mb-1">{r.count}</div>
                      <div className="text-xs text-gray-400">{r.examples}</div>
                    </div>
                  ))}
                </div>

                {/* Active Modifier Types */}
                <h3 className="text-white font-bold text-sm mb-3">Active Item Modifiers</h3>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-gray-400">Modifier</th>
                        <th className="text-left py-2 text-gray-400">Effect</th>
                        <th className="text-left py-2 text-gray-400">Example Item</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {[
                        { mod: 'healing', desc: 'Restores HP (dice roll or flat amount)', item: 'Healing Potion (2d8+4)' },
                        { mod: 'full_heal', desc: 'Restores to full HP, cures ALL injuries', item: 'Ambrosia' },
                        { mod: 'cure_poison', desc: 'Removes all poison-type injuries', item: 'Antitoxin' },
                        { mod: 'cure_all_poison', desc: 'Removes poison AND psionic injuries', item: 'Universal Antidote' },
                        { mod: 'death_ward', desc: 'Grants Death Ward condition (survive lethal blow)', item: 'Aegis Fragment' },
                        { mod: 'invisible', desc: 'Grants Invisible condition', item: 'Potion of Invisibility' },
                        { mod: 'str_set', desc: 'Sets STR to 18/00', item: 'Potion of Giant Strength' },
                        { mod: 'all_saves', desc: 'Grants Heroism condition (+2 saves)', item: 'Elixir of Heroism' },
                        { mod: 'protection', desc: 'Grants Protection condition', item: 'Scroll of Protection from Evil' },
                        { mod: 'undead_ward', desc: 'Grants Undead Ward condition', item: 'Scroll of Protection from Undead' },
                        { mod: 'true_sight', desc: 'Grants True Sight condition', item: 'Eye of Horus' },
                        { mod: 'regen', desc: 'Grants Regeneration condition', item: 'Golden Fleece' },
                        { mod: 'fear_immune', desc: 'Grants Fearless condition', item: 'Golden Fleece' },
                      ].map(r => (
                        <tr key={r.mod} className="border-b border-slate-700/50">
                          <td className="py-1.5 font-mono text-amber-300 text-xs">{r.mod}</td>
                          <td className="py-1.5 text-xs text-gray-400">{r.desc}</td>
                          <td className="py-1.5 text-xs text-gray-300">{r.item}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      {/* Character Detail Modal with Navigation */}
      <CharacterDetail
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
        onNext={() => { if (selectedCharacter) { const idx = filteredCharacters.findIndex(c => c.id === selectedCharacter.id); if (idx < filteredCharacters.length - 1) setSelectedCharacter(filteredCharacters[idx + 1]) } }}
        onPrev={() => { if (selectedCharacter) { const idx = filteredCharacters.findIndex(c => c.id === selectedCharacter.id); if (idx > 0) setSelectedCharacter(filteredCharacters[idx - 1]) } }}
        hasNext={selectedCharacter ? filteredCharacters.findIndex(c => c.id === selectedCharacter.id) < filteredCharacters.length - 1 : false}
        hasPrev={selectedCharacter ? filteredCharacters.findIndex(c => c.id === selectedCharacter.id) > 0 : false}
      />
    </div>
  )
}
