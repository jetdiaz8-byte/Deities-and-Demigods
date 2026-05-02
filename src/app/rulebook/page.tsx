'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, Key, Gem, Zap, ChevronLeft, ExternalLink, 
  Crown, Sparkles, Sword, Skull, Flame, Shield, AlertTriangle,
  ScrollText, Package, Heart, Brain, Droplet, Star, Users,
  Dice5, Ghost, Link2, Timer, Target, Swords, Dumbbell,
  ShieldCheck, Eye, Info, ArrowRight, Trophy, Volume2, Scale
} from 'lucide-react'
import { SHARD_NAMES, INJURY_TABLE, ITEM_TEMPLATES } from '@/lib/gameConstants'
import { ACHIEVEMENT_DEFS, TIER_CONFIG, CATEGORY_CONFIG } from '@/lib/achievements'
import type { AchievementTier, AchievementCategory } from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE GAME DATA (accurate to source code)
// ═══════════════════════════════════════════════════════════════════════════

const PROPHECIES = [
  { name: 'The Last Sunrise', bonus: '+3 success rate when fulfilled', desc: 'The sun shall set for the final time\u2014but your party may light a new dawn or let the darkness claim the world.' },
  { name: 'The Blood Covenant', bonus: '+5 success rate vs Greater Gods', desc: 'A bond forged in blood between mortal and divine. One of you must die for the other to live.' },
  { name: 'The Shattered Mirror', bonus: '+4 on deception actions', desc: 'Every truth has a reflection. In the broken mirror, the reflection tells a different story.' },
  { name: "The Titan's Dream", bonus: '+6 success rate in Act III', desc: 'The Titans dreamed the world into being. They are dreaming still. If they wake, the dream ends.' },
  { name: "The Wanderer's Path", bonus: '+2 per act completed', desc: 'Not all who wander are lost. Some are searching for something that does not wish to be found.' },
  { name: 'The Unwritten', bonus: 'Rolls fresh prophecy on transfer', desc: 'No oracle has seen this fate. No scribe has recorded it. It is the blank page at the end of every book.' },
  { name: 'The Forgotten Name', bonus: '+5 on banishment actions', desc: 'There was once a god whose name was erased from every tablet, every tongue, every memory. This prophecy remembers.' },
  { name: 'The Final Harvest', bonus: '+4 success rate, +10% loot', desc: 'What is sown must be reaped. What was taken must be returned. The harvest comes for all, even gods.' },
]

const INJURY_CATEGORIES = [
  { type: 'Physical', icon: Swords, color: 'text-red-400', border: 'border-red-700/50', count: 8, injuries: INJURY_TABLE.filter(i => i.type === 'physical') },
  { type: 'Magical', icon: Zap, color: 'text-blue-400', border: 'border-blue-700/50', count: 6, injuries: INJURY_TABLE.filter(i => i.type === 'magic') },
  { type: 'Poison', icon: Droplet, color: 'text-green-400', border: 'border-green-700/50', count: 6, injuries: INJURY_TABLE.filter(i => i.type === 'poison') },
  { type: 'Psionic', icon: Brain, color: 'text-purple-400', border: 'border-purple-700/50', count: 6, injuries: INJURY_TABLE.filter(i => i.type === 'psionic') },
  { type: 'Cursed', icon: Ghost, color: 'text-amber-400', border: 'border-amber-700/50', count: 2, injuries: INJURY_TABLE.filter(i => i.type === 'magic' && (i.id === 'cursed_wound' || i.id === 'divine_mark')) },
]

const SKILL_GROUPS = [
  { ability: 'Strength', skills: ['Athletics'] },
  { ability: 'Dexterity', skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'] },
  { ability: 'Intelligence', skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'] },
  { ability: 'Wisdom', skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'] },
  { ability: 'Charisma', skills: ['Deception', 'Performance', 'Persuasion', 'Intimidation'] },
]

const CLASS_SKILL_MAP = [
  { cls: 'Fighter', skills: ['Athletics', 'Intimidation'], color: 'text-red-400' },
  { cls: 'Cleric', skills: ['Religion', 'Medicine', 'Insight'], color: 'text-amber-400' },
  { cls: 'Magic User', skills: ['Arcana', 'History', 'Investigation'], color: 'text-blue-400' },
  { cls: 'Thief', skills: ['Stealth', 'Sleight of Hand', 'Acrobatics'], color: 'text-green-400' },
]

const ABILITY_BONUS_TABLE = [
  { range: '3', bonus: '-3', desc: 'Non-functional' },
  { range: '4-5', bonus: '-2', desc: 'Severely impaired' },
  { range: '6-8', bonus: '-1', desc: 'Below average' },
  { range: '9-12', bonus: '0', desc: 'Average' },
  { range: '13-15', bonus: '+1', desc: 'Above average' },
  { range: '16-17', bonus: '+2', desc: 'Exceptional' },
  { range: '18', bonus: '+3', desc: 'Peak mortal' },
  { range: '18/01-50', bonus: '+3', desc: 'Exceptional Strength (low)' },
  { range: '18/51-75', bonus: '+4', desc: 'Exceptional Strength (mid)' },
  { range: '18/76-90', bonus: '+4', desc: 'Exceptional Strength (high)' },
  { range: '18/91-00', bonus: '+5', desc: 'Exceptional Strength (max)' },
  { range: '19', bonus: '+4', desc: 'Supernatural' },
  { range: '20+', bonus: '+5', desc: 'Divine' },
]

export default function RulebookPage() {
  const [activeTab, setActiveTab] = useState('getting-started')
  const [expandedShard, setExpandedShard] = useState<string | null>(null)

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-600'
      case 'Uncommon': return 'bg-emerald-700'
      case 'Rare': return 'bg-blue-700'
      case 'Legendary': return 'bg-amber-700'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors" style={{ fontFamily: 'var(--font-ui)' }}><ChevronLeft className="w-5 h-5" /><span>Back to Game</span></Link>
              <Separator orientation="vertical" className="h-8 bg-slate-700" />
              <div className="flex items-center gap-2"><BookOpen className="w-6 h-6" style={{ color: '#D4AF37' }} /><h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-title)', color: '#D4AF37' }}>Player&apos;s Handbook</h1></div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/codex"><Button variant="outline" className="border-slate-600 text-gray-300" style={{ fontFamily: 'var(--font-button)' }}><ScrollText className="w-4 h-4 mr-2" />Codex</Button></Link>
              <Link href="/dm-handbook"><Button variant="outline" className="border-slate-600 text-gray-300" style={{ fontFamily: 'var(--font-button)' }}><Info className="w-4 h-4 mr-2" />DM Handbook</Button></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap gap-1 bg-slate-800/50 p-2 h-auto">
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>1. Getting Started</TabsTrigger>
            <TabsTrigger value="game-structure" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>2. Game Structure</TabsTrigger>
            <TabsTrigger value="turns" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>3. Turns</TabsTrigger>
            <TabsTrigger value="character" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>4. Characters</TabsTrigger>
            <TabsTrigger value="combat" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>5. Success Rate</TabsTrigger>
            <TabsTrigger value="shards" className="data-[state=active]:bg-amber-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>6. Shards</TabsTrigger>
            <TabsTrigger value="test-of-faith" className="data-[state=active]:bg-amber-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>7. Test of Faith</TabsTrigger>
            <TabsTrigger value="injuries" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>8. Injuries</TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>9. Items</TabsTrigger>
            <TabsTrigger value="prophecy" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>10. Prophecies</TabsTrigger>
            <TabsTrigger value="companions" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>11. Companions</TabsTrigger>
            <TabsTrigger value="antagonists" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>12. Antagonists</TabsTrigger>
            <TabsTrigger value="saving" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>13. Saving</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-amber-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>14. Achievements</TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>15. Audio & Voice</TabsTrigger>
            <TabsTrigger value="difficulty" className="data-[state=active]:bg-emerald-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>16. Difficulty</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 1. GETTING STARTED */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Key className="w-5 h-5 text-emerald-400" />What You Need to Play</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Before you can play, you need an OpenRouter API key that powers the AI Dungeon Master. It is FREE with generous usage limits.</p>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-subheading)' }}><Gem className="w-4 h-4" />OpenRouter API Key (REQUIRED)</h4>
                    <p className="text-sm text-gray-400 mb-3" style={{ fontFamily: 'var(--font-body)' }}>Powers the AI Dungeon Master that narrates the story and generates all game content</p>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Visit <span className="text-emerald-400">openrouter.ai/keys</span></li>
                      <li>Sign in or create an OpenRouter account</li>
                      <li>Click &quot;Create Key&quot;</li>
                      <li>Name the key for Mythworld (optional)</li>
                      <li>Copy the key (starts with sk-or-v1-...)</li>
                    </ol>
                    <div className="mt-3 text-xs text-gray-500" style={{ fontFamily: 'var(--font-caption)' }}>Uses OpenRouter free-tier models configured in the app</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Star className="w-5 h-5 text-amber-400" />Creating a Campaign</CardTitle></CardHeader>
              <CardContent>
                <ol className="text-gray-300 space-y-2 list-decimal list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                  <li>Open the Mythworld Engine app in your browser</li>
                  <li>Enter your OpenRouter API key in the &quot;OpenRouter Key&quot; field</li>
                  <li>Click <strong className="text-emerald-400">⚔ &quot;Begin Your Legend&quot; ⚔</strong></li>
                  <li>A pool of heroes and demigods is randomly selected for you</li>
                  <li>Select <strong>1 main PC</strong> as your hero — the DM auto-selects <strong>1 companion</strong> for you</li>
                  <li>A mysterious Shard is assigned, and the game begins!</li>
                </ol>
                <div className="mt-4 p-3 rounded bg-slate-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-white">Note:</strong> Your API key is stored locally in your browser and is only sent to OpenRouter via the app&apos;s API proxy.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 2. GAME STRUCTURE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="game-structure" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><ArrowRight className="w-5 h-5 text-emerald-400" />Three-Act Structure</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 italic" style={{ fontFamily: 'var(--font-narrative)' }}>Every campaign is a story. Stories have three parts: a beginning that gathers, a middle that investigates, and an end that confronts. The engine enforces this structure through RNG-driven turn limits.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-700">
                    <h4 className="font-bold text-green-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Act I: Gathering</h4>
                    <ul className="text-sm text-gray-300 space-y-1" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>&#8226; Party members introduced one at a time</li>
                      <li>&#8226; Shard artifact discovered and prophecy assigned</li>
                      <li>&#8226; Antagonist is only shadows and clues</li>
                      <li>&#8226; Ends when all PCs agree OR turn limit reached</li>
                      <li>&#8226; Turn limit: <strong className="text-green-300">RNG 10-100</strong> turns</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700">
                    <h4 className="font-bold text-yellow-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Act II: Investigation</h4>
                    <ul className="text-sm text-gray-300 space-y-1" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>&#8226; Full party assembled, companions active</li>
                      <li>&#8226; NPCs encountered, quests undertaken</li>
                      <li>&#8226; Antagonist clues revealed progressively</li>
                      <li>&#8226; RNG Hero/Demigod pool introduced as allies</li>
                      <li>&#8226; Duration: <strong className="text-yellow-300">RNG 20-60</strong> turns</li>
                      <li>&#8226; Requires 3+ clues, minimum 20 turns</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Act III: Confrontation</h4>
                    <ul className="text-sm text-gray-300 space-y-1" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>&#8226; Antagonist identity fully revealed</li>
                      <li>&#8226; 3-phase boss battle (HP thresholds)</li>
                      <li>&#8226; Banished antagonists return at full power</li>
                      <li>&#8226; Archrival summon available if banished</li>
                      <li>&#8226; Victory or death awaits</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 3. HOW TURNS WORK */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="turns" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Timer className="w-5 h-5 text-emerald-400" />How Turns Work</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Each turn follows a strict cycle. The AI Dungeon Master receives the full game state, generates a narrative response with structured JSON, and the engine applies all state changes.</p>
                <div className="space-y-3">
                  {[
                    { step: 1, label: 'Choose Your Action', desc: 'Select from 3 AI-generated quick actions, OR write your own custom action in the text field. Quick actions have their stamina costs enforced by the engine; custom actions are interpreted by the DM.', color: 'border-blue-500/50' },
                    { step: 2, label: 'AI Narrates the Outcome', desc: 'The DM processes your choice, rolls dice (d20), resolves combat, and writes 2-3 paragraphs of Gaiman-style prose with dialogue, atmosphere, and character reactions.', color: 'border-purple-500/50' },
                    { step: 3, label: 'State Updates Applied', desc: 'HP changes, conditions, injuries, NPC encounters, item drops, and quest progress are all parsed from the JSON response.', color: 'border-emerald-500/50' },
                    { step: 4, label: 'Next Turn Begins', desc: 'The engine recalculates the success rate, processes DOT damage, decrements injury timers, and presents new options.', color: 'border-amber-500/50' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg border ${s.color} bg-slate-700/30`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-800 text-white shrink-0">{s.step}</div>
                      <div><div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-subheading)' }}>{s.label}</div><div className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>{s.desc}</div></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 3b. ACTIONS & CHOICES — Hybrid Input System */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Sword className="w-5 h-5 text-blue-400" />Actions &amp; Choices</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The game uses a <strong className="text-blue-300">hybrid action system</strong>. Each turn, you can either pick from AI-generated quick actions or write your own custom action in a free-text field. Both approaches are mechanically resolved by the DM.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-700/50 border border-blue-500/30">
                  <div className="text-sm font-bold text-blue-300 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>⚔️ Quick Actions</div>
                  <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>3 context-sensitive options generated by the AI based on your PC&apos;s abilities, skills, and the current situation. Stamina costs are enforced by the game engine before the DM responds. These are reliable and mechanically precise — the engine handles stamina, Fate Points, and cooldowns automatically.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-700/50 border border-amber-500/30">
                  <div className="text-sm font-bold text-amber-300 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>✍️ Custom Actions</div>
                  <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Write anything you want to do in the text field — persuade an NPC, investigate a clue, attempt a creative maneuver, or roleplay a character moment. The DM interprets your intent, determines the appropriate skill check, and resolves it mechanically. Stamina costs are suggested to the DM (1 for observation, 2 for combat, 3 for magical actions).</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600">
                <div className="text-sm font-bold text-emerald-300 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>💡 How It Works</div>
                <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                  <li>Quick actions appear as numbered buttons (1, 2, 3) at the top of the choice panel</li>
                  <li>The custom action text field appears below — click it to expand and start typing</li>
                  <li>Selecting a quick action deactivates the text field, and vice versa</li>
                  <li>If your companion is present, you also choose their action from their own set of options</li>
                  <li>Both characters act simultaneously — the DM narrates their coordinated effort</li>
                  <li>Additional options like potions, Fate Point invocations, and parley appear below</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 4. YOUR CHARACTER */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="character" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Shield className="w-5 h-5 text-emerald-400" />Character Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Each PC has the following core stats drawn from AD&amp;D 1st Edition:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { stat: 'HP', full: 'Hit Points', desc: 'Health. Reaches 0 = death (unless Test of Faith). Clamped to [0, maxHp].' },
                    { stat: 'AC', full: 'Armor Class', desc: 'Lower is better. Gods range from AC -12 to AC +4. Negative AC means harder to hit.' },
                    { stat: 'MR', full: 'Magic Resistance', desc: 'Percentage chance to resist spells. 0-100%. Gods commonly have 25-100%.' },
                    { stat: 'Move', full: 'Movement Rate', desc: 'Inches per round (AD&D 1e). Higher = faster. Average is 12".' },
                  ].map(s => (
                    <div key={s.stat} className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-lg font-bold text-amber-400" style={{ fontFamily: 'var(--font-subheading)' }}>{s.stat}</div>
                      <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'var(--font-caption)' }}>{s.full}</div>
                      <div className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Dumbbell className="w-5 h-5 text-cyan-400" />Ability Scores (AD&amp;D 1e)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Six ability scores define your character. Each provides a modifier to relevant actions. AD&amp;D 1st Edition uses exceptional strength (18/01-18/00) for fighters, representing percentiles of superhuman power.</p>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>Score</th>
                        <th className="text-left py-2 text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>Bonus</th>
                        <th className="text-left py-2 text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {ABILITY_BONUS_TABLE.map(a => (
                        <tr key={a.range} className="border-b border-slate-700/50">
                          <td className="py-1.5 font-mono text-white">{a.range}</td>
                          <td className="py-1.5 font-mono text-amber-400">{a.bonus}</td>
                          <td className="py-1.5 text-xs text-gray-400">{a.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Target className="w-5 h-5 text-amber-400" />Alignment Effects</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'var(--font-body)' }}>Alignment affects your success rate through the Alignment Harmony factor. A unified party performs better; a fractured one suffers.</p>
                <div className="space-y-2">
                  {[
                    { scenario: 'Good + Evil in same party', penalty: '-3', note: 'Moral conflict creates tension' },
                    { scenario: 'Lawful + Chaotic in same party', penalty: '-2', note: 'Philosophical disagreement' },
                    { scenario: '2+ Good-aligned PCs', bonus: '+1', note: 'Shared purpose strengthens resolve' },
                    { scenario: '2+ Lawful-aligned PCs', bonus: '+1', note: 'Order breeds discipline' },
                    { scenario: 'Range: disharmony to harmony', range: '-5 to +5', note: 'Total alignment harmony is clamped' },
                  ].map(a => (
                    <div key={a.scenario} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>{a.scenario}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-caption)' }}>{a.note}</span>
                        <Badge className={a.penalty ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'} style={{ fontFamily: 'var(--font-caption)' }}>{a.penalty || a.bonus}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Dumbbell className="w-5 h-5 text-cyan-400" />D&amp;D 5e Skill Proficiencies</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>On top of the AD&amp;D 1e core stats, heroes and demigods also carry <strong className="text-cyan-300">D&amp;D 5e skill proficiencies</strong>. These do not replace the core stats &mdash; they are a narrative layer that helps the AI DM generate relevant, character-appropriate action choices. A fighter sees &quot;Intimidate the guard&quot;; a thief sees &quot;Sneak past the patrol.&quot; Gods and monsters do not use this system; they rely on their named divine abilities instead.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-3" style={{ fontFamily: 'var(--font-subheading)' }}>All 18 Skills (by Ability)</h4>
                    <div className="space-y-2">
                      {SKILL_GROUPS.map(g => (
                        <div key={g.ability} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-amber-400 w-24 shrink-0" style={{ fontFamily: 'var(--font-caption)' }}>{g.ability}</span>
                          <div className="flex flex-wrap gap-1">
                            {g.skills.map(s => (
                              <Badge key={s} className="bg-cyan-900/50 text-cyan-300 text-[10px]" style={{ fontFamily: 'var(--font-caption)' }}>{s}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-3" style={{ fontFamily: 'var(--font-subheading)' }}>How Proficiencies Are Assigned</h4>
                    <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: 'var(--font-body)' }}>Each PC&apos;s top 3 inferred classes grant 3 skills each. Additionally, any ability score of 15+ grants its associated skills. Maximum 9 proficiencies from class + extras from high stats.</p>
                    <div className="space-y-2">
                      {CLASS_SKILL_MAP.map(c => (
                        <div key={c.cls} className="flex items-start gap-2">
                          <span className={`text-xs font-bold w-24 shrink-0 ${c.color}`} style={{ fontFamily: 'var(--font-caption)' }}>{c.cls}</span>
                          <div className="flex flex-wrap gap-1">
                            {c.skills.map(s => (
                              <Badge key={s} className="bg-slate-600 text-gray-200 text-[10px]" style={{ fontFamily: 'var(--font-caption)' }}>{s} +2</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 rounded bg-slate-600/30 text-[11px] text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>
                      <strong className="text-gray-300">High Stat Bonus (15+):</strong> CHA 15+ &rarr; Deception, Persuasion, Performance &bull; WIS 15+ &rarr; Perception, Survival, Animal Handling &bull; DEX 15+ &rarr; Acrobatics, Stealth
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-cyan-900/20 border border-cyan-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-cyan-300">Where to see it:</strong> Your character card in-game shows your skill proficiencies as small badges. The Codex also displays skills on hero and demigod entries. Proficiencies are inferred automatically from your class levels and ability scores &mdash; no manual selection needed.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 5. SUCCESS RATE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="combat" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Dice5 className="w-5 h-5 text-emerald-400" />Success Rate &amp; d20 Rolls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Every action in Mythworld is governed by a success rate &mdash; a percentage that determines whether your chosen action succeeds, fails, or triggers an unexpected outcome. The rate is calculated from 13 factors that shift as your story unfolds, covering party composition, divine aid, injuries, and your bond with your companion.</p>
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <h4 className="font-bold text-emerald-400 mb-3" style={{ fontFamily: 'var(--font-subheading)' }}>The Full Formula (13 Factors)</h4>
                  <div className="p-3 rounded bg-slate-900/50 font-mono text-sm text-gray-300 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                    <span className="text-white">successRate</span> = <span className="text-amber-400">50</span> (base)<br />
                    &nbsp;&nbsp;+ <span className="text-green-400">min(livingPCs &times; 2, 10)</span> &nbsp;&nbsp;# party bonus<br />
                    &nbsp;&nbsp;+ <span className="text-purple-400">prophecyStateBonus</span> &nbsp;&nbsp;# dormant:0, awakening:+3, manifesting:+5, fulfilled:+8, broken:-5<br />
                    &nbsp;&nbsp;+ <span className="text-cyan-400">min(alliedGods &times; 3, 15)</span> &nbsp;&nbsp;# ally bonus<br />
                    &nbsp;&nbsp;+ <span className="text-yellow-400">min(pcRenown, 8)</span> &nbsp;&nbsp;# level/3 per PC<br />
                    &nbsp;&nbsp;+ <span className="text-blue-400">min(pcPower, 10)</span> &nbsp;&nbsp;# total HP / 100<br />
                    &nbsp;&nbsp;+ <span className="text-pink-400">clamp(alignmentHarmony, -5, +5)</span><br />
                    &nbsp;&nbsp;+ <span className="text-orange-400">min(storyAchievements &times; 2, 12)</span> &nbsp;&nbsp;# quests + clues<br />
                    &nbsp;&nbsp;+ <span className="text-red-400">antagonistTypePenalty</span> &nbsp;&nbsp;# -5 if greater_god, 0 if monster<br />
                    &nbsp;&nbsp;+ <span className="text-amber-300">min(shardCharges &times; 2, 6)</span> &nbsp;&nbsp;# shard charges remaining<br />
                    &nbsp;&nbsp;+ <span className="text-amber-200">min(shardSummoned &times; 3, 9)</span> &nbsp;&nbsp;# gods summoned via shard<br />
                    &nbsp;&nbsp;+ <span className="text-teal-400">companionAffinityBonus</span> &nbsp;&nbsp;# devoted:+5, loyal:+3, concerned:+1, hostile:-5<br />
                    &nbsp;&nbsp;+ <span className="text-teal-300">companionMoodBonus</span> &nbsp;&nbsp;# v2.44 devoted:+3, loyal:+1, concerned:0, conflicted:-1, distant:-2, hostile:-4<br />
                    &nbsp;&nbsp;+ <span className="text-indigo-400">moralityBonus</span> &nbsp;&nbsp;# v2.44 |quotient|≥50:+3, ≥30:+2, ≥15:+1 — conviction grants power<br />
                    &nbsp;&nbsp;+ <span className="text-rose-400">clamp(injuryPenalty, -15, 0)</span> &nbsp;&nbsp;# sum of all active injury modifiers (max 5/PC)<br />
                    &nbsp;&nbsp;= <span className="text-white">clamp(total, 5, 95)</span> &nbsp;&nbsp;# always some chance
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Base', value: '50%', desc: 'Every campaign starts at 50/50' },
                    { label: 'Max Positive', value: '+97%', desc: 'All bonuses maxed' },
                    { label: 'Max Negative', value: '-25%', desc: 'Broken prophecy + disharmony + boss + injuries' },
                    { label: 'Absolute Range', value: '5%-95%', desc: 'Always some chance of either outcome' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded bg-slate-700/50 text-center">
                      <div className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-subheading)' }}>{s.value}</div>
                      <div className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'var(--font-caption)' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 6. THE SHARD SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="shards" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Flame className="w-5 h-5 text-amber-400" />The Shard System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Central to every campaign is the Shard &mdash; an ancient artifact from before the gods themselves. The Shard is not a tool. It is a character with its own agenda.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>How Invocation Works</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Starts with <strong className="text-amber-400">2 charges</strong></li>
                      <li>Declare which god or being to summon by name</li>
                      <li>A d20 roll is made against <strong>DC 10</strong></li>
                      <li>Success: Being appears and aids your party</li>
                      <li>Failure: Something else may appear</li>
                      <li>Names of summoned beings are tracked in <code className="text-amber-300 bg-amber-900/20 px-1 rounded">shardSummoned</code></li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
                    <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-2" style={{ fontFamily: 'var(--font-subheading)' }}><AlertTriangle className="w-4 h-4" />Charges &amp; Darkening</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li><strong className="text-amber-300">Lesser summon</strong>: Costs 1 charge</li>
                      <li><strong className="text-red-300">Greater summon</strong>: Costs ALL charges, sets <code className="text-red-300">shardDark = true</code></li>
                      <li>When charges reach 0, the shard darkens</li>
                      <li>A darkened shard cannot be invoked</li>
                      <li>Miracles from Test of Faith can restore 1 charge</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}>All {SHARD_NAMES.length} Shards</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                  {SHARD_NAMES.map((shard) => (
                    <div key={shard.name} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors" onClick={() => setExpandedShard(expandedShard === shard.name ? null : shard.name)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>{shard.name}</span><Badge className="bg-slate-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>{shard.pantheon}</Badge></div>
                        <Badge className="bg-amber-600 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>{shard.power}</Badge>
                      </div>
                      {expandedShard === shard.name && <p className="mt-2 text-sm text-gray-400 italic border-t border-slate-600 pt-2" style={{ fontFamily: 'var(--font-narrative)' }}>{shard.origin}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 7. TEST OF FAITH */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="test-of-faith" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Dice5 className="w-5 h-5 text-amber-400" />Test of Faith</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 italic" style={{ fontFamily: 'var(--font-narrative)' }}>There are moments when the dice are not enough. When the story demands something larger than probability. In those moments, the universe holds its breath and offers you a choice: trust fate, or accept what is written.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
                    <h4 className="font-bold text-amber-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>When It Triggers</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>A PC dies (death_save trigger)</li>
                      <li>Boss enters a new phase (boss_phase trigger)</li>
                      <li>Success rate drops below 40% (desperate_odds)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Safeguards</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li><strong>1 miracle per PC</strong> &mdash; each PC can only be saved once</li>
                      <li><strong>2 miracles max</strong> &mdash; total across the entire party</li>
                      <li><strong>10-turn cooldown</strong> between tests</li>
                      <li><strong>Act II+ only</strong> &mdash; never in Act I</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <h4 className="font-bold text-white mb-3" style={{ fontFamily: 'var(--font-subheading)' }}>The d20 Roll Ranges</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-amber-400" style={{ fontFamily: 'var(--font-subheading)' }}>&#10022; Miracle (18-20)</span></div>
                      <p className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The universe intervenes. On death saves: PC revives at 1 HP, prophecy restored, successor removed. On boss phases: antagonist takes 15% max HP damage. Always grants +8 success rate, restores 1 shard charge, rekindles the shard.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-600/20 border border-slate-500/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-gray-300" style={{ fontFamily: 'var(--font-subheading)' }}>&#9881; Fate Holds (4-17)</span></div>
                      <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Neither miracle nor catastrophe. The world exhales. No mechanical changes.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-red-400" style={{ fontFamily: 'var(--font-subheading)' }}>&#9760; Murphy&apos;s Law (1-3)</span></div>
                      <p className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Everything that can go wrong does. -5 success rate. A random item in your inventory loses a charge. The shard darkens.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-white">&quot;Trust Fate&quot; Option:</strong> You may decline the test. If you do, fate is neutral &mdash; the death stands, the phase proceeds, the odds remain. Sometimes wisdom is knowing when not to roll.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 8. INJURIES */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="injuries" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Heart className="w-5 h-5 text-red-400" />Injury System &mdash; {INJURY_TABLE.length} Injury Types</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Injuries are generated by the AI during combat and exploration. Each has a <code className="text-red-300 bg-red-900/20 px-1 rounded">turnsLeft</code> counter that decrements each turn. DOT (damage over time) injuries drain HP at the start of each turn. Injury duration is parsed from the cure field: &quot;Rest N turns&quot; sets duration to N; DOT injuries default to 5 turns; others default to 4.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {INJURY_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <div key={cat.type} className={`p-3 rounded-lg border ${cat.border} bg-slate-700/20 text-center`}>
                        <Icon className={`w-5 h-5 ${cat.color} mx-auto mb-1`} />
                        <div className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-subheading)' }}>{cat.count}</div>
                        <div className={`text-xs ${cat.color}`} style={{ fontFamily: 'var(--font-caption)' }}>{cat.type}</div>
                      </div>
                    )
                  })}
                </div>

                {INJURY_CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  return (
                    <div key={cat.type} className="space-y-2">
                      <h3 className={`font-bold text-sm flex items-center gap-2 ${cat.color}`} style={{ fontFamily: 'var(--font-subheading)' }}><Icon className="w-4 h-4" />{cat.type} Injuries ({cat.count})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                          <thead><tr className="border-b border-slate-600"><th className="text-left py-1.5 text-gray-400 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>Name</th><th className="text-left py-1.5 text-gray-400 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>Effect</th><th className="text-left py-1.5 text-gray-400 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>Cure</th></tr></thead>
                          <tbody className="text-gray-300">
                            {cat.injuries.map(inj => (
                              <tr key={inj.id} className="border-b border-slate-700/50">
                                <td className="py-1.5 text-white text-xs">{inj.icon} {inj.name}</td>
                                <td className="py-1.5 text-xs text-gray-400">{inj.effect}</td>
                                <td className="py-1.5 text-xs text-gray-500">{inj.cure}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 9. ITEMS & EQUIPMENT */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="items" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Package className="w-5 h-5 text-amber-400" />Items &amp; Equipment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Items are acquired through six methods: <code className="text-amber-300 bg-amber-900/20 px-1 rounded">npc_encounter</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">monster_drop</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">exploration</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">pickpocket</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">conversation</code>, and <code className="text-amber-300 bg-amber-900/20 px-1 rounded">quest_reward</code>.</p>
                
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>Active Item Modifiers</h4>
                <p className="text-gray-400 text-xs mb-3" style={{ fontFamily: 'var(--font-caption)' }}>These modifiers trigger an immediate effect when the item is used:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
                  {[
                    { mod: 'healing', desc: 'Restores HP (flat or 2d8+4)', example: 'Healing Potion' },
                    { mod: 'full_heal', desc: 'Full HP + cures ALL injuries', example: 'Ambrosia' },
                    { mod: 'cure_poison', desc: 'Removes poison injuries', example: 'Antitoxin' },
                    { mod: 'cure_all_poison', desc: 'Removes poison + psionic', example: 'Universal Antidote' },
                    { mod: 'death_ward', desc: 'Survive lethal blow once', example: 'Aegis Fragment' },
                    { mod: 'invisible', desc: 'Invisible condition', example: 'Potion of Invisibility' },
                    { mod: 'str_set', desc: 'STR becomes 18/00', example: 'Potion of Giant Strength' },
                    { mod: 'all_saves', desc: 'Heroism: +2 saves', example: 'Elixir of Heroism' },
                    { mod: 'protection', desc: 'Protection condition', example: 'Scroll of Protection' },
                    { mod: 'undead_ward', desc: 'Undead Ward condition', example: 'Scroll vs Undead' },
                    { mod: 'true_sight', desc: 'True Sight condition', example: 'Eye of Horus' },
                    { mod: 'regen', desc: 'Regeneration condition', example: 'Golden Fleece' },
                    { mod: 'fear_immune', desc: 'Fearless condition', example: 'Golden Fleece' },
                  ].map(i => (
                    <div key={i.mod} className="flex items-center gap-2 p-2 rounded bg-slate-700/30">
                      <code className="text-amber-300 text-xs bg-amber-900/20 px-1.5 py-0.5 rounded">{i.mod}</code>
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>{i.desc}</span>
                      <span className="text-xs text-gray-600 ml-auto" style={{ fontFamily: 'var(--font-caption)' }}>{i.example}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>Equipment &amp; Passive Bonuses</h4>
                <p className="text-gray-400 text-xs mb-3" style={{ fontFamily: 'var(--font-caption)' }}>Equipment provides persistent combat bonuses. When used, the game shows &quot;This item provides passive bonuses and cannot be actively used.&quot; Charges on equipment are high (99) and never consumed.</p>
                
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>Charge System</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-slate-700/50">
                    <h5 className="text-sm text-amber-300 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Consumable Items</h5>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Potions and scrolls have 1 charge. When used, they are removed from inventory. Multi-charge items decrement by 1 per use.</p>
                  </div>
                  <div className="p-3 rounded bg-slate-700/50">
                    <h5 className="text-sm text-blue-300 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Permanent Equipment</h5>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Equipment and most artifacts have 99 charges (effectively infinite). They persist in your inventory and provide passive bonuses.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}>Rarity Tiers</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { rarity: 'Common', color: 'bg-gray-600', count: ITEM_TEMPLATES.filter(i => i.rarity === 'common').length },
                    { rarity: 'Uncommon', color: 'bg-emerald-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'uncommon').length },
                    { rarity: 'Rare', color: 'bg-blue-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'rare').length },
                    { rarity: 'Legendary', color: 'bg-amber-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'legendary').length },
                  ].map(r => (
                    <div key={r.rarity} className={`p-4 rounded-lg ${r.color}/20 border ${r.color}/30 text-center`}>
                      <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-subheading)' }}>{r.count}</div>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${r.color} mt-1`} style={{ fontFamily: 'var(--font-caption)' }}>{r.rarity}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 10. PROPHECIES */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="prophecy" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><ScrollText className="w-5 h-5 text-purple-400" />The Eight Prophecies</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm italic" style={{ fontFamily: 'var(--font-narrative)' }}>The prophecy is bound to the Shard, not just the PC. The main PC carries it directly. When the main PC dies, the shard summons a replacement and passes the prophecy.</p>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { state: 'Dormant', color: 'bg-gray-600', bonus: '+0%' },
                    { state: 'Awakening', color: 'bg-amber-700', bonus: '+3%' },
                    { state: 'Manifesting', color: 'bg-yellow-600', bonus: '+5%' },
                    { state: 'Fulfilled', color: 'bg-green-600', bonus: '+8%' },
                    { state: 'Broken', color: 'bg-red-700', bonus: '-5%' },
                  ].map(s => (
                    <div key={s.state} className="text-center p-2 rounded bg-slate-700/50">
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${s.color} mb-1`} style={{ fontFamily: 'var(--font-caption)' }}>{s.state}</div>
                      <div className="text-sm font-bold text-gray-300" style={{ fontFamily: 'var(--font-caption)' }}>{s.bonus}</div>
                    </div>
                  ))}
                </div>

                <h4 className="font-bold text-white text-sm mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Mantle-Passing Chain on Death</h4>
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600 mb-4">
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                    <li>Main PC dies &rarr; Companion becomes the Chosen One</li>
                    <li>If companion also falls &rarr; RNG pool NPC steps up</li>
                    <li>Successor feels the accumulated grief of all previous holders</li>
                    <li>The Unwritten (prophecy #8) rolls a fresh prophecy for the new bearer</li>
                    <li>Other prophecies reset to &quot;awakening&quot; state</li>
                    <li>Miracles from Test of Faith can reverse this: revived PC reclaims the prophecy, successor is removed</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  {PROPHECIES.map((p, i) => (
                    <div key={p.name} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>{i + 1}. {p.name}</span>
                        <Badge className="bg-purple-900/50 text-purple-300 text-xs" style={{ fontFamily: 'var(--font-caption)' }}>{p.bonus}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 italic" style={{ fontFamily: 'var(--font-narrative)' }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 11. COMPANIONS & NPCs */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="companions" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Users className="w-5 h-5 text-emerald-400" />Companions &amp; NPCs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The second PC in your party is the <strong className="text-amber-300">Companion</strong>, bound by fate to the main PC. They have a shared mini-origin and cannot abandon the main PC.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Companion Affinity</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Range: <strong>-100 to +100</strong></li>
                      <li>Moods: loyal, concerned, conflicted, distant, hostile, devoted</li>
                      <li>Affinity affects dialogue and cooperation</li>
                      <li>New companions start at +30 affinity</li>
                      <li>The companion speaks and acts according to their alignment</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>NPC Alliance System</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>NPCs encountered can be ALLY, ENEMY, or BOSS</li>
                      <li>Allied NPCs contribute to the Allied Gods bonus (+3 each)</li>
                      <li>NPCs have full entity data: HP, AC, MR, abilities, personality</li>
                      <li>Encounter types: npc_encounter, monster_drop, conversation</li>
                      <li>NPCs can join the party permanently during Act II</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 12. ANTAGONISTS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="antagonists" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Skull className="w-5 h-5 text-red-400" />Antagonists</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The antagonist&apos;s identity is hidden until Act III. During Acts I-II, only clues about pantheon, domain, alignment, and symbols are revealed. The antagonist may be a Greater God OR a Super Monster (Jormungandr, Fenris, Malystryx, etc.).</p>
                
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>3-Phase Boss Battle</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                    <h5 className="font-bold text-red-400 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>Phase 1 (100%-65% HP)</h5>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>The antagonist&apos;s base abilities. Each Greater God has a unique phase1 description.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                    <h5 className="font-bold text-yellow-400 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>Phase 2 (65%-30% HP)</h5>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Deeper power unleashed. Each Greater God has a unique phase2 description. Triggers Test of Faith.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-800/30 border border-red-500/50">
                    <h5 className="font-bold text-red-300 mb-1" style={{ fontFamily: 'var(--font-subheading)' }}>Phase 3 (30%-0% HP)</h5>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>All restraint shatters. Full terrible might. Each Greater God has a unique phase3 description.</p>
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>Banishment Mechanic</h4>
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <ul className="text-sm text-gray-300 space-y-2" style={{ fontFamily: 'var(--font-body)' }}>
                    <li>&#8226; <strong className="text-amber-300">Act I-II:</strong> If the antagonist reaches 0 HP, they are <strong>banished</strong> to another plane rather than killed</li>
                    <li>&#8226; HP is restored to <strong>40% of max HP</strong></li>
                    <li>&#8226; An <strong>archrival</strong> is identified &mdash; the antagonist&apos;s mythological enemy</li>
                    <li>&#8226; <strong className="text-amber-300">Act III:</strong> The banished antagonist returns at <strong>full HP</strong>, enraged</li>
                    <li>&#8226; The archrival can be summoned as a 7th action option during Act III</li>
                    <li>&#8226; The archrival&apos;s name and ability are revealed to the player</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 13. SAVING & LOADING */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="saving" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><ShieldCheck className="w-5 h-5 text-cyan-400" />Saving &amp; Loading</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Save Slots</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li><strong>5 save slots</strong> available</li>
                      <li>Each slot stores: turn number, act, party names</li>
                      <li>Full GameState serialized as JSON to localStorage</li>
                      <li>Auto-save occurs at the end of each turn</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Backward Compatibility</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Loading merges saved data with default GameState</li>
                      <li>Missing fields from older saves are filled with defaults</li>
                      <li>This allows campaigns to survive game updates</li>
                      <li>Corrupted saves trigger auto-merge recovery</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 14. ACHIEVEMENTS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Trophy className="w-5 h-5 text-amber-400" />Achievement System &mdash; {ACHIEVEMENT_DEFS.length} Achievements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Achievements are unlocked automatically as you play. Some are visible from the start; others are <strong className="text-purple-400">hidden</strong> until you discover them. The tracker checks your game state after every turn and fires a notification when a new achievement unlocks.</p>

                {/* Tiers */}
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>4 Tiers</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.entries(TIER_CONFIG) as [AchievementTier, typeof TIER_CONFIG[AchievementTier]][]).map(([tier, cfg]) => {
                    const count = ACHIEVEMENT_DEFS.filter(a => a.tier === tier).length
                    return (
                      <div key={tier} className="p-3 rounded-lg border text-center" style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>
                        <div className="text-lg font-bold" style={{ color: cfg.color, fontFamily: 'var(--font-subheading)' }}>{count}</div>
                        <div className="text-xs" style={{ color: cfg.color, fontFamily: 'var(--font-caption)' }}>{cfg.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Categories */}
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>7 Categories</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.entries(CATEGORY_CONFIG) as [AchievementCategory, typeof CATEGORY_CONFIG[AchievementCategory]][]).map(([cat, cfg]) => {
                    const count = ACHIEVEMENT_DEFS.filter(a => a.category === cat).length
                    const visibleCount = ACHIEVEMENT_DEFS.filter(a => a.category === cat && !a.hidden).length
                    return (
                      <div key={cat} className="p-3 rounded-lg bg-slate-700/50 text-center">
                        <div className="text-lg">{cfg.icon}</div>
                        <div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-subheading)' }}>{cfg.label}</div>
                        <div className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>{count} total &middot; {visibleCount} visible</div>
                      </div>
                    )
                  })}
                </div>

                {/* How they're earned */}
                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>How Achievements Are Earned</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h5 className="font-bold text-amber-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Campaign Milestones</h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Completing each act (Act I, II, III)</li>
                      <li>Victory or defeat endings</li>
                      <li>Speedrunning (under 40 turns) or marathons (150+ turns)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h5 className="font-bold text-red-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Combat</h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>First blood, critical strikes</li>
                      <li>Boss phase transitions (Phase 2, Phase 3)</li>
                      <li>Banishment and archrival summons</li>
                      <li>Damage milestones (500 / 1500)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h5 className="font-bold text-cyan-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Exploration &amp; Social</h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Encountering gods across pantheons (5 / 15 / 30)</li>
                      <li>Multi-pantheon encounters (5+ pantheons)</li>
                      <li>Quest acceptance and completion</li>
                      <li>Clue gathering and gold accumulation</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h5 className="font-bold text-purple-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Survival &amp; Shard</h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Surviving 50 / 100 / 150 turns</li>
                      <li>Zero-death runs, full HP entering Act III</li>
                      <li>First shard invocation, greater god summons</li>
                      <li>Test of Faith outcomes (miracle, Murphy, trust fate)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-white">Hidden Achievements:</strong> {ACHIEVEMENT_DEFS.filter(a => a.hidden).length} of {ACHIEVEMENT_DEFS.length} achievements are hidden until unlocked. They reward unexpected feats &mdash; try everything!</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 15. AUDIO & VOICE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="audio" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Volume2 className="w-5 h-5 text-emerald-400" />Audio &amp; Voice Systems</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Mythworld features a layered audio system that combines procedural ambient soundscapes, contextual sound effects, and AI-powered text-to-speech narration to create an immersive experience.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-emerald-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Procedural Ambient Audio</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li><strong>8 audio themes</strong> that match scene types</li>
                      <li>Themes include: forest, dungeon, combat, temple, tavern, coastal, mountain, and void</li>
                      <li>Soundscapes are generated procedurally using Web Audio API</li>
                      <li>Fades smoothly between themes as the scene changes</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-amber-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Sound Effects (SFX)</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>Dice rolls &mdash; tactile rumble on every action</li>
                      <li>Combat hits &mdash; impacts, clashes, and spell sounds</li>
                      <li>Injury events &mdash; wince-inducing feedback</li>
                      <li>Achievement unlocks &mdash; triumphant chime</li>
                      <li>Shard invocation &mdash; ethereal resonance</li>
                      <li>Test of Faith &mdash; dramatic tension build</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-cyan-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>TTS Narration (Edge TTS)</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>AI narration spoken aloud via Microsoft Edge TTS</li>
                      <li>Narrator voice selected to match the game&apos;s tone</li>
                      <li>Toggle on/off from the game settings</li>
                      <li>Reads the DM&apos;s narrative prose each turn</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-purple-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Auto Scene Detection</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside" style={{ fontFamily: 'var(--font-body)' }}>
                      <li>The engine detects scene type from the AI&apos;s response</li>
                      <li>Keywords in the narrative trigger theme changes</li>
                      <li>Combat scenes auto-switch to battle audio</li>
                      <li>Exploration scenes adapt to terrain descriptions</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-white">Tip:</strong> All audio is browser-native (Web Audio API). No external services or downloads required beyond the TTS endpoint. Audio can be fully muted from the in-game settings panel.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 16. DIFFICULTY & BALANCE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="difficulty" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Scale className="w-5 h-5 text-emerald-400" />Difficulty &amp; Balance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>There is no difficulty selector in Mythworld. Instead, <strong className="text-white">difficulty emerges dynamically</strong> from the success rate formula. As your story progresses and circumstances shift, the odds rise and fall naturally.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-700">
                    <h4 className="font-bold text-green-400 mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#2ECC71' }}>Act I: ~50-65%</h4>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Full party alive, few injuries, early story bonuses. The world is forgiving &mdash; but the clock is ticking.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700">
                    <h4 className="font-bold text-yellow-400 mb-2" style={{ fontFamily: 'var(--font-subheading)' }}>Act II: ~40-60%</h4>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Injuries accumulate. The Greater God penalty (-5%) kicks in. Prophecy state and ally count become critical swings.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#DC143C' }}>Act III: ~30-55%</h4>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>Injuries stack up to -15%. Boss phases impose additional pressure. Every factor matters. Victory is earned, not given.</p>
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-subheading)' }}>Key Pressure Points</h4>
                <div className="space-y-2">
                  {[
                    { factor: '13 dynamic factors', desc: 'The success rate recalculates every turn based on 13 shifting variables', color: 'text-emerald-400' },
                    { factor: 'Greater God penalty: -5%', desc: 'Facing a Greater God antagonist imposes a flat -5% to your success rate', color: 'text-red-400' },
                    { factor: 'Injury stacking: up to -15%', desc: 'Each injury applies a modifier. Multiple injuries compound, capping at -15%', color: 'text-amber-400' },
                    { factor: 'Broken prophecy: -5%', desc: 'If your prophecy shatters, you lose the bonus and suffer a penalty instead', color: 'text-purple-400' },
                    { factor: 'Hostile companion: -5%', desc: 'If companion affinity drops to hostile, it further erodes your odds', color: 'text-rose-400' },
                    { factor: 'Floor: 5% / Ceiling: 95%', desc: 'No matter how dire or how blessed, there is always a chance', color: 'text-cyan-400' },
                  ].map(f => (
                    <div key={f.factor} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className={`text-sm font-bold ${f.color}`} style={{ fontFamily: 'var(--font-subheading)' }}>{f.factor}</span>
                      <span className="text-xs text-gray-400 text-right max-w-xs" style={{ fontFamily: 'var(--font-body)' }}>{f.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded bg-slate-700/50 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong className="text-white">Design Philosophy:</strong> Difficulty is not a knob you set &mdash; it is a story you live. Manage your injuries, nurture your companion bond, fulfill your prophecy, and summon allies wisely. The formula rewards preparation and punishes neglect.</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
