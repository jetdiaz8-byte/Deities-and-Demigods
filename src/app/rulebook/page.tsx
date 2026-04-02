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
  ShieldCheck, Eye, Info, ArrowRight
} from 'lucide-react'
import { SHARD_NAMES, INJURY_TABLE, ITEM_TEMPLATES } from '@/lib/gameConstants'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /><span>Back to Game</span></Link>
              <Separator orientation="vertical" className="h-8 bg-slate-700" />
              <div className="flex items-center gap-2"><BookOpen className="w-6 h-6 text-emerald-400" /><h1 className="text-xl font-bold text-white">Player&apos;s Handbook</h1></div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/codex"><Button variant="outline" className="border-slate-600 text-gray-300"><ScrollText className="w-4 h-4 mr-2" />Codex</Button></Link>
              <Link href="/dm-handbook"><Button variant="outline" className="border-slate-600 text-gray-300"><Info className="w-4 h-4 mr-2" />DM Handbook</Button></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap gap-1 bg-slate-800/50 p-2 h-auto">
            <TabsTrigger value="getting-started" className="data-[state=active]:bg-emerald-600 text-xs">1. Getting Started</TabsTrigger>
            <TabsTrigger value="game-structure" className="data-[state=active]:bg-emerald-600 text-xs">2. Game Structure</TabsTrigger>
            <TabsTrigger value="turns" className="data-[state=active]:bg-emerald-600 text-xs">3. Turns</TabsTrigger>
            <TabsTrigger value="character" className="data-[state=active]:bg-emerald-600 text-xs">4. Characters</TabsTrigger>
            <TabsTrigger value="combat" className="data-[state=active]:bg-emerald-600 text-xs">5. Success Rate</TabsTrigger>
            <TabsTrigger value="shards" className="data-[state=active]:bg-amber-600 text-xs">6. Shards</TabsTrigger>
            <TabsTrigger value="test-of-faith" className="data-[state=active]:bg-amber-600 text-xs">7. Test of Faith</TabsTrigger>
            <TabsTrigger value="injuries" className="data-[state=active]:bg-emerald-600 text-xs">8. Injuries</TabsTrigger>
            <TabsTrigger value="items" className="data-[state=active]:bg-emerald-600 text-xs">9. Items</TabsTrigger>
            <TabsTrigger value="prophecy" className="data-[state=active]:bg-emerald-600 text-xs">10. Prophecies</TabsTrigger>
            <TabsTrigger value="companions" className="data-[state=active]:bg-emerald-600 text-xs">11. Companions</TabsTrigger>
            <TabsTrigger value="antagonists" className="data-[state=active]:bg-emerald-600 text-xs">12. Antagonists</TabsTrigger>
            <TabsTrigger value="saving" className="data-[state=active]:bg-emerald-600 text-xs">13. Saving</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 1. GETTING STARTED */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Key className="w-5 h-5 text-emerald-400" />What You Need to Play</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">Before you can play, you need to obtain API keys that power the AI Dungeon Master. Both are FREE with generous usage limits.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2"><Gem className="w-4 h-4" />Gemini API Key (REQUIRED)</h4>
                    <p className="text-sm text-gray-400 mb-3">Powers the AI Dungeon Master that narrates the story</p>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                      <li>Visit <span className="text-emerald-400">aistudio.google.com</span></li>
                      <li>Sign in with your Google account</li>
                      <li>Click &quot;Get API Key&quot; in sidebar</li>
                      <li>Click &quot;Create API Key&quot;</li>
                      <li>Copy the key (starts with AIzaSy...)</li>
                    </ol>
                    <div className="mt-3 text-xs text-gray-500">Free: 15 req/min, 1,500 req/day</div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700">
                    <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" />Groq API Key (RECOMMENDED)</h4>
                    <p className="text-sm text-gray-400 mb-3">Provides faster action option generation</p>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                      <li>Visit <span className="text-purple-400">console.groq.com</span></li>
                      <li>Sign up or sign in</li>
                      <li>Navigate to &quot;API Keys&quot;</li>
                      <li>Click &quot;Create API Key&quot;</li>
                      <li>Copy immediately (can&apos;t view again!)</li>
                    </ol>
                    <div className="mt-3 text-xs text-gray-500">Free: 30 req/min, 14,400 req/day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Star className="w-5 h-5 text-amber-400" />Creating a Campaign</CardTitle></CardHeader>
              <CardContent>
                <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Open the Mythworld Engine app in your browser</li>
                  <li>Enter your Gemini API key in the &quot;Gemini Key&quot; field</li>
                  <li>(Optional) Enter your Groq API key for faster responses</li>
                  <li>Click <strong>&quot;Start New Campaign&quot;</strong></li>
                  <li>A pool of heroes and demigods is randomly selected for you</li>
                  <li>Click on characters to add them to your party (2-4 recommended)</li>
                  <li>Click <strong>&quot;Confirm Party&quot;</strong> when ready</li>
                  <li>A mysterious Shard is assigned, and the game begins!</li>
                </ol>
                <div className="mt-4 p-3 rounded bg-slate-700/50 text-sm text-gray-400"><strong className="text-white">Note:</strong> Your API keys are stored locally in your browser and are never sent anywhere except directly to Google and Groq.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 2. GAME STRUCTURE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="game-structure" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><ArrowRight className="w-5 h-5 text-emerald-400" />Three-Act Structure</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4 italic">Every campaign is a story. Stories have three parts: a beginning that gathers, a middle that investigates, and an end that confronts. The engine enforces this structure through RNG-driven turn limits.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-700">
                    <h4 className="font-bold text-green-400 mb-2">Act I: Gathering</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>&#8226; Party members introduced one at a time</li>
                      <li>&#8226; Shard artifact discovered and prophecy assigned</li>
                      <li>&#8226; Antagonist is only shadows and clues</li>
                      <li>&#8226; Ends when all PCs agree OR turn limit reached</li>
                      <li>&#8226; Turn limit: <strong className="text-green-300">RNG 10-100</strong> turns</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700">
                    <h4 className="font-bold text-yellow-400 mb-2">Act II: Investigation</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>&#8226; Full party assembled, companions active</li>
                      <li>&#8226; NPCs encountered, quests undertaken</li>
                      <li>&#8226; Antagonist clues revealed progressively</li>
                      <li>&#8226; RNG Hero/Demigod pool introduced as allies</li>
                      <li>&#8226; Duration: <strong className="text-yellow-300">RNG 20-60</strong> turns</li>
                      <li>&#8226; Requires 3+ clues, minimum 20 turns</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2">Act III: Confrontation</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Timer className="w-5 h-5 text-emerald-400" />How Turns Work</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">Each turn follows a strict cycle. The AI Dungeon Master receives the full game state, generates a narrative response with structured JSON, and the engine applies all state changes.</p>
                <div className="space-y-3">
                  {[
                    { step: 1, label: 'Choose Your Action', desc: 'Select from 3-5 options generated by the AI (or Groq). Options reflect your PC\'s abilities and the current situation.', color: 'border-blue-500/50' },
                    { step: 2, label: 'AI Narrates the Outcome', desc: 'The DM processes your choice, rolls dice (d20), resolves combat, and writes 300+ words of Gaiman-style prose.', color: 'border-purple-500/50' },
                    { step: 3, label: 'State Updates Applied', desc: 'HP changes, conditions, injuries, NPC encounters, item drops, and quest progress are all parsed from the JSON response.', color: 'border-emerald-500/50' },
                    { step: 4, label: 'Next Turn Begins', desc: 'The engine recalculates the success rate, processes DOT damage, decrements injury timers, and presents new options.', color: 'border-amber-500/50' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg border ${s.color} bg-slate-700/30`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-800 text-white shrink-0">{s.step}</div>
                      <div><div className="text-sm font-bold text-white">{s.label}</div><div className="text-xs text-gray-400">{s.desc}</div></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 4. YOUR CHARACTER */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="character" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" />Character Statistics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">Each PC has the following core stats drawn from AD&amp;D 1st Edition:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { stat: 'HP', full: 'Hit Points', desc: 'Health. Reaches 0 = death (unless Test of Faith). Clamped to [0, maxHp].' },
                    { stat: 'AC', full: 'Armor Class', desc: 'Lower is better. Gods range from AC -12 to AC +4. Negative AC means harder to hit.' },
                    { stat: 'MR', full: 'Magic Resistance', desc: 'Percentage chance to resist spells. 0-100%. Gods commonly have 25-100%.' },
                    { stat: 'Move', full: 'Movement Rate', desc: 'Inches per round (AD&D 1e). Higher = faster. Average is 12".' },
                  ].map(s => (
                    <div key={s.stat} className="p-3 rounded-lg bg-slate-700/50">
                      <div className="text-lg font-bold text-amber-400">{s.stat}</div>
                      <div className="text-xs text-gray-500 mb-1">{s.full}</div>
                      <div className="text-xs text-gray-400">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Dumbbell className="w-5 h-5 text-cyan-400" />Ability Scores (AD&amp;D 1e)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Six ability scores define your character. Each provides a modifier to relevant actions. AD&amp;D 1st Edition uses exceptional strength (18/01-18/00) for fighters, representing percentiles of superhuman power.</p>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2 text-gray-400">Score</th>
                        <th className="text-left py-2 text-gray-400">Bonus</th>
                        <th className="text-left py-2 text-gray-400">Description</th>
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Target className="w-5 h-5 text-amber-400" />Alignment Effects</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">Alignment affects your success rate through the Alignment Harmony factor. A unified party performs better; a fractured one suffers.</p>
                <div className="space-y-2">
                  {[
                    { scenario: 'Good + Evil in same party', penalty: '-3', note: 'Moral conflict creates tension' },
                    { scenario: 'Lawful + Chaotic in same party', penalty: '-2', note: 'Philosophical disagreement' },
                    { scenario: '2+ Good-aligned PCs', bonus: '+1', note: 'Shared purpose strengthens resolve' },
                    { scenario: '2+ Lawful-aligned PCs', bonus: '+1', note: 'Order breeds discipline' },
                    { scenario: 'Range: disharmony to harmony', range: '-5 to +5', note: 'Total alignment harmony is clamped' },
                  ].map(a => (
                    <div key={a.scenario} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                      <span className="text-sm text-gray-300">{a.scenario}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{a.note}</span>
                        <Badge className={a.penalty ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}>{a.penalty || a.bonus}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 5. SUCCESS RATE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="combat" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Dice5 className="w-5 h-5 text-emerald-400" />Success Rate &amp; d20 Rolls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">Every action in Mythworld is governed by a success rate &mdash; a percentage that determines whether your chosen action succeeds, fails, or triggers an unexpected outcome. The rate is calculated from 8 factors that shift as your story unfolds.</p>
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <h4 className="font-bold text-emerald-400 mb-3">The Full Formula</h4>
                  <div className="p-3 rounded bg-slate-900/50 font-mono text-sm text-gray-300 mb-4">
                    <span className="text-white">successRate</span> = <span className="text-amber-400">50</span> (base)<br />
                    &nbsp;&nbsp;+ <span className="text-green-400">min(livingPCs &times; 2, 10)</span> &nbsp;&nbsp;# party bonus<br />
                    &nbsp;&nbsp;+ <span className="text-purple-400">prophecyStateBonus</span> &nbsp;&nbsp;# dormant:0, awakening:+3, manifesting:+5, fulfilled:+8, broken:-5<br />
                    &nbsp;&nbsp;+ <span className="text-cyan-400">min(alliedGods &times; 3, 15)</span> &nbsp;&nbsp;# ally bonus<br />
                    &nbsp;&nbsp;+ <span className="text-yellow-400">min(pcRenown, 8)</span> &nbsp;&nbsp;# level/3 per PC<br />
                    &nbsp;&nbsp;+ <span className="text-blue-400">min(pcPower, 10)</span> &nbsp;&nbsp;# total HP / 100<br />
                    &nbsp;&nbsp;+ <span className="text-pink-400">clamp(alignmentHarmony, -5, +5)</span><br />
                    &nbsp;&nbsp;+ <span className="text-orange-400">min(storyAchievements &times; 2, 12)</span> &nbsp;&nbsp;# quests + clues<br />
                    &nbsp;&nbsp;+ <span className="text-red-400">antagonistTypePenalty</span> &nbsp;&nbsp;# -5 if greater_god, 0 if monster<br />
                    &nbsp;&nbsp;= <span className="text-white">clamp(total, 5, 95)</span> &nbsp;&nbsp;# always some chance
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Base', value: '50%', desc: 'Every campaign starts at 50/50' },
                    { label: 'Max Positive', value: '+72%', desc: 'All bonuses maxed' },
                    { label: 'Max Negative', value: '-10%', desc: 'Broken prophecy + disharmony + boss' },
                    { label: 'Absolute Range', value: '5%-95%', desc: 'Always some chance of either outcome' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded bg-slate-700/50 text-center">
                      <div className="text-lg font-bold text-white">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Flame className="w-5 h-5 text-amber-400" />The Shard System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">Central to every campaign is the Shard &mdash; an ancient artifact from before the gods themselves. The Shard is not a tool. It is a character with its own agenda.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2">How Invocation Works</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Starts with <strong className="text-amber-400">2 charges</strong></li>
                      <li>Declare which god or being to summon by name</li>
                      <li>A d20 roll is made against <strong>DC 10</strong></li>
                      <li>Success: Being appears and aids your party</li>
                      <li>Failure: Something else may appear</li>
                      <li>Names of summoned beings are tracked in <code className="text-amber-300 bg-amber-900/20 px-1 rounded">shardSummoned</code></li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
                    <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Charges &amp; Darkening</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
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
              <CardHeader><CardTitle className="text-white">All {SHARD_NAMES.length} Shards</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
                  {SHARD_NAMES.map((shard) => (
                    <div key={shard.name} className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 cursor-pointer transition-colors" onClick={() => setExpandedShard(expandedShard === shard.name ? null : shard.name)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap"><span className="font-bold text-white text-sm">{shard.name}</span><Badge className="bg-slate-600 text-xs">{shard.pantheon}</Badge></div>
                        <Badge className="bg-amber-600 text-xs">{shard.power}</Badge>
                      </div>
                      {expandedShard === shard.name && <p className="mt-2 text-sm text-gray-400 italic border-t border-slate-600 pt-2">{shard.origin}</p>}
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Dice5 className="w-5 h-5 text-amber-400" />Test of Faith</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 italic">There are moments when the dice are not enough. When the story demands something larger than probability. In those moments, the universe holds its breath and offers you a choice: trust fate, or accept what is written.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
                    <h4 className="font-bold text-amber-400 mb-2">When It Triggers</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>A PC dies (death_save trigger)</li>
                      <li>Boss enters a new phase (boss_phase trigger)</li>
                      <li>Success rate drops below 40% (desperate_odds)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="font-bold text-red-400 mb-2">Safeguards</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li><strong>1 miracle per PC</strong> &mdash; each PC can only be saved once</li>
                      <li><strong>2 miracles max</strong> &mdash; total across the entire party</li>
                      <li><strong>10-turn cooldown</strong> between tests</li>
                      <li><strong>Act II+ only</strong> &mdash; never in Act I</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <h4 className="font-bold text-white mb-3">The d20 Roll Ranges</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-amber-400">&#10022; Miracle (18-20)</span></div>
                      <p className="text-sm text-gray-300">The universe intervenes. On death saves: PC revives at 1 HP, prophecy restored, successor removed. On boss phases: antagonist takes 15% max HP damage. Always grants +8 success rate, restores 1 shard charge, rekindles the shard.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-600/20 border border-slate-500/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-gray-300">&#9881; Fate Holds (4-17)</span></div>
                      <p className="text-sm text-gray-400">Neither miracle nor catastrophe. The world exhales. No mechanical changes.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/50">
                      <div className="flex items-center gap-2 mb-1"><span className="font-bold text-red-400">&#9760; Murphy&apos;s Law (1-3)</span></div>
                      <p className="text-sm text-gray-300">Everything that can go wrong does. -5 success rate. A random item in your inventory loses a charge. The shard darkens.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-700/50 text-sm text-gray-400"><strong className="text-white">&quot;Trust Fate&quot; Option:</strong> You may decline the test. If you do, fate is neutral &mdash; the death stands, the phase proceeds, the odds remain. Sometimes wisdom is knowing when not to roll.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 8. INJURIES */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="injuries" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" />Injury System &mdash; {INJURY_TABLE.length} Injury Types</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Injuries are generated by the AI during combat and exploration. Each has a <code className="text-red-300 bg-red-900/20 px-1 rounded">turnsLeft</code> counter that decrements each turn. DOT (damage over time) injuries drain HP at the start of each turn. Injury duration is parsed from the cure field: &quot;Rest N turns&quot; sets duration to N; DOT injuries default to 5 turns; others default to 4.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {INJURY_CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <div key={cat.type} className={`p-3 rounded-lg border ${cat.border} bg-slate-700/20 text-center`}>
                        <Icon className={`w-5 h-5 ${cat.color} mx-auto mb-1`} />
                        <div className="text-lg font-bold text-white">{cat.count}</div>
                        <div className={`text-xs ${cat.color}`}>{cat.type}</div>
                      </div>
                    )
                  })}
                </div>

                {INJURY_CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  return (
                    <div key={cat.type} className="space-y-2">
                      <h3 className={`font-bold text-sm flex items-center gap-2 ${cat.color}`}><Icon className="w-4 h-4" />{cat.type} Injuries ({cat.count})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-slate-600"><th className="text-left py-1.5 text-gray-400 text-xs">Name</th><th className="text-left py-1.5 text-gray-400 text-xs">Effect</th><th className="text-left py-1.5 text-gray-400 text-xs">Cure</th></tr></thead>
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Package className="w-5 h-5 text-amber-400" />Items &amp; Equipment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">Items are acquired through six methods: <code className="text-amber-300 bg-amber-900/20 px-1 rounded">npc_encounter</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">monster_drop</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">exploration</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">pickpocket</code>, <code className="text-amber-300 bg-amber-900/20 px-1 rounded">conversation</code>, and <code className="text-amber-300 bg-amber-900/20 px-1 rounded">quest_reward</code>.</p>
                
                <h4 className="font-bold text-white text-sm">Active Item Modifiers</h4>
                <p className="text-gray-400 text-xs mb-3">These modifiers trigger an immediate effect when the item is used:</p>
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
                      <span className="text-xs text-gray-400">{i.desc}</span>
                      <span className="text-xs text-gray-600 ml-auto">{i.example}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-bold text-white text-sm">Equipment &amp; Passive Bonuses</h4>
                <p className="text-gray-400 text-xs mb-3">Equipment provides persistent combat bonuses. When used, the game shows &quot;This item provides passive bonuses and cannot be actively used.&quot; Charges on equipment are high (99) and never consumed.</p>
                
                <h4 className="font-bold text-white text-sm">Charge System</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-slate-700/50">
                    <h5 className="text-sm text-amber-300 mb-2">Consumable Items</h5>
                    <p className="text-xs text-gray-400">Potions and scrolls have 1 charge. When used, they are removed from inventory. Multi-charge items decrement by 1 per use.</p>
                  </div>
                  <div className="p-3 rounded bg-slate-700/50">
                    <h5 className="text-sm text-blue-300 mb-2">Permanent Equipment</h5>
                    <p className="text-xs text-gray-400">Equipment and most artifacts have 99 charges (effectively infinite). They persist in your inventory and provide passive bonuses.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white">Rarity Tiers</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { rarity: 'Common', color: 'bg-gray-600', count: ITEM_TEMPLATES.filter(i => i.rarity === 'common').length },
                    { rarity: 'Uncommon', color: 'bg-emerald-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'uncommon').length },
                    { rarity: 'Rare', color: 'bg-blue-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'rare').length },
                    { rarity: 'Legendary', color: 'bg-amber-700', count: ITEM_TEMPLATES.filter(i => i.rarity === 'legendary').length },
                  ].map(r => (
                    <div key={r.rarity} className={`p-4 rounded-lg ${r.color}/20 border ${r.color}/30 text-center`}>
                      <div className="text-2xl font-bold text-white">{r.count}</div>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${r.color} mt-1`}>{r.rarity}</div>
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><ScrollText className="w-5 h-5 text-purple-400" />The Eight Prophecies</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm italic">The prophecy is bound to the Shard, not just the PC. The main PC carries it directly. When the main PC dies, the shard summons a replacement and passes the prophecy.</p>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[
                    { state: 'Dormant', color: 'bg-gray-600', bonus: '+0%' },
                    { state: 'Awakening', color: 'bg-amber-700', bonus: '+3%' },
                    { state: 'Manifesting', color: 'bg-yellow-600', bonus: '+5%' },
                    { state: 'Fulfilled', color: 'bg-green-600', bonus: '+8%' },
                    { state: 'Broken', color: 'bg-red-700', bonus: '-5%' },
                  ].map(s => (
                    <div key={s.state} className="text-center p-2 rounded bg-slate-700/50">
                      <div className={`inline-block px-2 py-0.5 rounded text-xs text-white font-semibold ${s.color} mb-1`}>{s.state}</div>
                      <div className="text-sm font-bold text-gray-300">{s.bonus}</div>
                    </div>
                  ))}
                </div>

                <h4 className="font-bold text-white text-sm mb-2">Mantle-Passing Chain on Death</h4>
                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600 mb-4">
                  <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
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
                        <span className="font-bold text-white text-sm">{i + 1}. {p.name}</span>
                        <Badge className="bg-purple-900/50 text-purple-300 text-xs">{p.bonus}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 italic">{p.desc}</p>
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400" />Companions &amp; NPCs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">The second PC in your party is the <strong className="text-amber-300">Companion</strong>, bound by fate to the main PC. They have a shared mini-origin and cannot abandon the main PC.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2">Companion Affinity</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Range: <strong>-100 to +100</strong></li>
                      <li>Moods: loyal, concerned, conflicted, distant, hostile, devoted</li>
                      <li>Affinity affects dialogue and cooperation</li>
                      <li>New companions start at +30 affinity</li>
                      <li>The companion speaks and acts according to their alignment</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2">NPC Alliance System</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Skull className="w-5 h-5 text-red-400" />Antagonists</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">The antagonist&apos;s identity is hidden until Act III. During Acts I-II, only clues about pantheon, domain, alignment, and symbols are revealed. The antagonist may be a Greater God OR a Super Monster (Jormungandr, Fenris, Malystryx, etc.).</p>
                
                <h4 className="font-bold text-white text-sm">3-Phase Boss Battle</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                    <h5 className="font-bold text-red-400 mb-1">Phase 1 (100%-65% HP)</h5>
                    <p className="text-xs text-gray-400">The antagonist&apos;s base abilities. Each Greater God has a unique phase1 description.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
                    <h5 className="font-bold text-yellow-400 mb-1">Phase 2 (65%-30% HP)</h5>
                    <p className="text-xs text-gray-400">Deeper power unleashed. Each Greater God has a unique phase2 description. Triggers Test of Faith.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-800/30 border border-red-500/50">
                    <h5 className="font-bold text-red-300 mb-1">Phase 3 (30%-0% HP)</h5>
                    <p className="text-xs text-gray-400">All restraint shatters. Full terrible might. Each Greater God has a unique phase3 description.</p>
                  </div>
                </div>

                <h4 className="font-bold text-white text-sm">Banishment Mechanic</h4>
                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600">
                  <ul className="text-sm text-gray-300 space-y-2">
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
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-cyan-400" />Saving &amp; Loading</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2">Save Slots</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li><strong>5 save slots</strong> available</li>
                      <li>Each slot stores: turn number, act, party names</li>
                      <li>Full GameState serialized as JSON to localStorage</li>
                      <li>Auto-save occurs at the end of each turn</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="font-bold text-white mb-2">Backward Compatibility</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
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
        </Tabs>
      </main>
    </div>
  )
}
