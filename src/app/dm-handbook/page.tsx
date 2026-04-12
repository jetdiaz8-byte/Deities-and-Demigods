'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft, ScrollText,
  Brain, Database, BarChart3, BookOpen, ShieldAlert,
  AlertTriangle, Zap, Clock, RefreshCcw, Shield, Heart,
  Skull, Gem, Swords, Layers, Activity, FileWarning, Save,
  Wifi, WifiOff, Cpu, MessageSquare, Timer, Sparkles, Target,
  Ghost, Flame, ArrowDownUp, Users, Eye, Briefcase, Scroll,
  Volume2, Music
} from 'lucide-react'
import { INJURY_TABLE, ITEM_TEMPLATES } from '@/lib/gameConstants'
import { ACHIEVEMENT_DEFS, TIER_CONFIG, CATEGORY_CONFIG } from '@/lib/achievements'

// ═══════════════════════════════════════════════════════════════════════════
// DM RESPONSE TYPE REFERENCE (mirrors gameTypes.ts DMResponse)
// ═══════════════════════════════════════════════════════════════════════════

const DM_RESPONSE_SCHEMA = [
  { field: 'story_summary', type: 'string', desc: '1-3 paragraph summary of current scene' },
  { field: 'journey_so_far', type: 'string', desc: 'Updated TLDR of entire campaign (under 150 words)' },
  { field: 'dm_narration', type: 'string', desc: 'Full Gaiman-style prose (300+ words mandatory)' },
  { field: 'human_pc_id', type: 'string | null', desc: 'ID of the PC who should act next' },
  { field: 'human_pc_reason', type: 'string', desc: 'Narrative justification for PC selection' },
  { field: 'npc_encounters[]', type: 'array', desc: 'NPCs introduced this turn with behavior/pantheon' },
  { field: 'dice_rolls[]', type: 'array', desc: 'All d20 rolls with roller, DC, success/failure' },
  { field: 'damage_dealt[]', type: 'array', desc: 'Damage from/to entities with amount and type' },
  { field: 'injury_events[]', type: 'array', desc: 'Injury descriptions matched to INJURY_TABLE' },
  { field: 'state_updates[]', type: 'array', desc: 'HP deltas, conditions, death flags per entity' },
  { field: 'new_active_npcs[]', type: 'array', desc: 'IDs of NPCs now active in the scene' },
  { field: 'shard_event', type: 'object', desc: 'Shard invocation details, roll, summoned entity' },
  { field: 'next_pc_id', type: 'string | null', desc: 'Next PC to receive a turn' },
  { field: 'pc_agreement', type: 'object', desc: 'Party consensus: agreed/refused/undecided per PC' },
  { field: 'boss_phase_trigger', type: 'boolean', desc: 'True when antagonist HP crosses threshold' },
  { field: 'consequences', type: 'string', desc: 'Immediate consequences of player choice' },
  { field: 'tension_note', type: 'string', desc: 'Atmosphere/tension description for next turn' },
  { field: 'item_drops[]', type: 'array', desc: 'Items found/earned with full modifier specs' },
  { field: 'quest_updates[]', type: 'array', desc: 'Quest status changes and objective progress' },
]

const STATE_UPDATE_SCHEMA = [
  { field: 'pc_id', type: 'string', desc: 'Target: entity ID or "ANTAGONIST"', required: true },
  { field: 'hp_delta', type: 'number', desc: 'HP change (positive = heal, negative = damage)' },
  { field: 'new_condition', type: 'string | null', desc: 'Add a status condition (e.g. "Bleeding")' },
  { field: 'remove_condition', type: 'string | null', desc: 'Remove an existing condition' },
  { field: 'dead', type: 'boolean', desc: 'Set to true to mark entity as killed' },
]

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS RATE FACTOR TABLE
// ═══════════════════════════════════════════════════════════════════════════

const SUCCESS_FACTORS = [
  { name: 'Base Chance', formula: '50', range: 'Fixed', cap: '-', color: 'text-gray-300', icon: Target, desc: 'Every campaign starts at 50/50 odds' },
  { name: 'Party Living', formula: 'min(livingPCs × 2, 10)', range: '+0 to +10', cap: '5 PCs', color: 'text-blue-400', icon: Users, desc: '+2 per living PC, capped at +10' },
  { name: 'Prophecy State', formula: 'map[state]', range: '-5 to +8', cap: '+8/-5', color: 'text-purple-400', icon: Sparkles, desc: 'dormant:+0 | awakening:+3 | manifesting:+5 | fulfilled:+8 | broken:-5' },
  { name: 'Allied Gods', formula: 'min(alliedGods × 3, 15)', range: '+0 to +15', cap: '5 allies', color: 'text-emerald-400', icon: Gem, desc: 'Good-aligned NPC history count × 3' },
  { name: 'PC Renown', formula: 'min(Σ(level/3), 8)', range: '+0 to +8', cap: '+8', color: 'text-amber-400', icon: Swords, desc: 'Highest class level / 3, summed per PC' },
  { name: 'Power Bonus', formula: 'min(Σ(hp/100), 10)', range: '+0 to +10', cap: '+10', color: 'text-green-400', icon: Shield, desc: 'Total living PC HP / 100' },
  { name: 'Alignment Harmony', formula: 'clamp(harmony, -5, +5)', range: '-5 to +5', cap: '±5', color: 'text-cyan-400', icon: ArrowDownUp, desc: 'Good+Evil:-3 | Law+Chaos:-2 | Unity:+1-2 each' },
  { name: 'Story Achievements', formula: 'min(achieve × 2, 12)', range: '+0 to +12', cap: '6 achievements', color: 'text-yellow-400', icon: Scroll, desc: '(completed quests + clues/2) × 2' },
  { name: 'Antagonist Type', formula: 'greater_god ? -5 : 0', range: '0 or -5', cap: '-5', color: 'text-red-400', icon: Skull, desc: 'Greater Gods impose -5% penalty; Monsters have no penalty' },
  { name: 'Shard Charges', formula: 'min(shardCharges × 2, 6)', range: '+0 to +6', cap: '+6', color: 'text-amber-300', icon: Flame, desc: '+2 per remaining shard charge; resource preservation rewards careful play' },
  { name: 'Shard Summoned', formula: 'min(summoned × 3, 9)', range: '+0 to +9', cap: '+9', color: 'text-amber-200', icon: Sparkles, desc: '+3 per god successfully summoned via shard; divine aid accumulates' },
  { name: 'Companion Affinity', formula: 'affinity tiers', range: '-5 to +5', cap: '±5', color: 'text-teal-400', icon: Heart, desc: 'devoted(≥75):+5 | loyal(≥50):+3 | concerned(≥25):+1 | distant(≥0):0 | hostile:floor(aff/20)' },
  { name: 'Injury Penalty', formula: 'clamp(Σ(mods), -15, 0)', range: '-15 to +0', cap: '-15', color: 'text-rose-400', icon: AlertTriangle, desc: 'Sum of all negative injury modifiers; DOT and debuff injuries stack' },
]

// ═══════════════════════════════════════════════════════════════════════════
// INJURY CATEGORIES & ITEM RARITY
// ═══════════════════════════════════════════════════════════════════════════

const INJURY_CATS = [
  { type: 'Physical', count: INJURY_TABLE.filter(i => i.type === 'physical').length },
  { type: 'Magical', count: INJURY_TABLE.filter(i => i.type === 'magic').length },
  { type: 'Poison', count: INJURY_TABLE.filter(i => i.type === 'poison').length },
  { type: 'Psionic', count: INJURY_TABLE.filter(i => i.type === 'psionic').length },
  { type: 'Cursed/Special', count: 2 },
]

const AI_FLOW_STEPS = [
  { step: 1, label: 'Player selects action from generated options', icon: Activity, color: 'border-blue-500/50 bg-blue-900/20', textColor: 'text-blue-400' },
  { step: 2, label: 'Engine builds full game state snapshot', icon: Database, color: 'border-slate-500/50 bg-slate-700/30', textColor: 'text-slate-300' },
  { step: 3, label: 'System prompt constructed (9 data blocks)', icon: MessageSquare, color: 'border-purple-500/50 bg-purple-900/20', textColor: 'text-purple-400' },
  { step: 4, label: 'Cloud AI generates response', icon: Brain, color: 'border-amber-500/50 bg-amber-900/20', textColor: 'text-amber-400' },
  { step: 5, label: 'JSON extracted from response via regex', icon: FileWarning, color: 'border-cyan-500/50 bg-cyan-900/20', textColor: 'text-cyan-400' },
  { step: 6, label: 'applyMechanics: state updates parsed and applied', icon: RefreshCcw, color: 'border-emerald-500/50 bg-emerald-900/20', textColor: 'text-emerald-400' },
  { step: 7, label: 'Narration displayed, success rate recalculated, new options presented', icon: Eye, color: 'border-red-500/50 bg-red-900/20', textColor: 'text-red-400' },
]

const FALLBACK_SCENARIOS = [
  { trigger: 'API Rate Limit (429)', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700/50', response: 'Exponential backoff with 3 retries (6s, 12s, 24s)', fallback: 'Template fallback preserves game flow after all retries exhausted', severity: 'recoverable' },
  { trigger: 'Malformed JSON Response', icon: FileWarning, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-700/50', response: 'Regex-based JSON extraction attempts to find valid block', fallback: 'Partial parse: salvage dm_narration, use defaults for state updates', severity: 'recoverable' },
  { trigger: 'Empty / Truncated Response', icon: WifiOff, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-700/50', response: 'Template generates generic progression based on game state', fallback: 'Pre-written scene templates maintain narrative momentum', severity: 'recoverable' },
  { trigger: 'API Key Invalid / Network Error', icon: Wifi, color: 'text-red-500', bg: 'bg-red-900/30', border: 'border-red-600/50', response: 'Immediate template fallback with user-facing error message', fallback: 'Game pauses with clear "configure your API key" instruction', severity: 'blocking' },
  { trigger: 'Save Data Corruption', icon: Save, color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-700/50', response: 'loadGame merges saved state with default GameState values', fallback: 'Missing fields filled with defaults; game continues from last valid state', severity: 'recoverable' },
  { trigger: 'Injury ID Not Found', icon: Heart, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-700/50', response: 'Engine fuzzy-matches injury_events against INJURY_TABLE', fallback: 'Creates generic injury from AI description if no match found', severity: 'recoverable' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DMHandbookPage() {
  const [activeTab, setActiveTab] = useState('ai-dm')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur" style={{ borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors" style={{ fontFamily: 'var(--font-button)', color: '#8A7A50' }}><ChevronLeft className="w-5 h-5" /><span>Back to Game</span></Link>
              <Separator orientation="vertical" className="h-8 bg-slate-700" />
              <div className="flex items-center gap-2"><ScrollText className="w-6 h-6" style={{ color: '#D4AF37' }} /><h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}>DM Handbook</h1></div>
            </div>
            <Link href="/rulebook"><Button variant="outline" className="border-slate-600" style={{ fontFamily: 'var(--font-button)', color: '#D4AF37', borderColor: '#D4AF37' }}><BookOpen className="w-4 h-4 mr-2" />Player&apos;s Guide</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-wider" style={{ fontFamily: 'var(--font-title)', color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.5), 0 2px 4px rgba(0,0,0,0.8)' }}>DUNGEON MASTER&apos;S HANDBOOK</h2>
          <p className="text-lg max-w-2xl mx-auto mb-2" style={{ fontFamily: 'var(--font-body)', color: '#F5E6C8' }}>The arcane machinery behind the AI Dungeon Master</p>
          <p className="text-sm" style={{ fontFamily: 'var(--font-caption)', color: '#8A7A50' }}>Deities &amp; Demigods Edition &mdash; How the engine thinks, decides, and narrates</p>
          <div className="flex justify-center mt-6 gap-3">
            <Badge className="bg-purple-900/50 border border-purple-700/50 text-xs" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Cloud AI</Badge>
            <Badge className="bg-slate-800 border text-xs" style={{ fontFamily: 'var(--font-caption)', color: '#8A7A50', borderColor: '#5A4A28' }}>TypeScript Engine</Badge>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap gap-1 p-2 h-auto" style={{ background: 'rgba(123,45,142,0.15)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <TabsTrigger value="ai-dm" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>1. AI DM</TabsTrigger>
            <TabsTrigger value="prompt" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>2. Prompt</TabsTrigger>
            <TabsTrigger value="schema" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>3. Schema</TabsTrigger>
            <TabsTrigger value="state-updates" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>4. State Protocol</TabsTrigger>
            <TabsTrigger value="success-rate" className="data-[state=active]:bg-emerald-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>5. Success Rate</TabsTrigger>
            <TabsTrigger value="narrative" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>6. Narrative</TabsTrigger>
            <TabsTrigger value="skill-system" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>7. Skill System</TabsTrigger>
            <TabsTrigger value="fallbacks" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>8. Fallbacks</TabsTrigger>
            <TabsTrigger value="faith-engine" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>9. Test of Faith</TabsTrigger>
            <TabsTrigger value="difficulty" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>10. Difficulty</TabsTrigger>
            <TabsTrigger value="hp-validation" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>11. HP Validation</TabsTrigger>
            <TabsTrigger value="items-dm" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>12. Items</TabsTrigger>
            <TabsTrigger value="quests-dm" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>13. Quests</TabsTrigger>
            <TabsTrigger value="saves-dm" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>14. Saves</TabsTrigger>
            <TabsTrigger value="achievements-dm" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>15. Achievements</TabsTrigger>
            <TabsTrigger value="audio-engine" className="data-[state=active]:bg-purple-800 text-xs" style={{ fontFamily: 'var(--font-button)' }}>16. Audio Engine</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 1. AI DM ARCHITECTURE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="ai-dm" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Brain className="w-5 h-5 text-red-400" />AI Dungeon Master Architecture</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The AI Dungeon Master is not a chatbot with a personality prompt. It is a <strong className="text-red-300">narrative state machine</strong> &mdash; a system that receives the full game state, generates both prose and structured data, and returns a response that the engine parses and applies.</p>
                <div className="space-y-3 mt-6">
                  <h4 className="text-sm uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Turn Processing Pipeline (7 Steps)</h4>
                  {AI_FLOW_STEPS.map((s, i) => {
                    const IconComp = s.icon
                    return (
                      <div key={s.step}>
                        <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.color}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-slate-800 ${s.textColor}`}>{s.step}</div>
                          <IconComp className={`w-4 h-4 ${s.textColor}`} />
                          <span className="text-gray-200 text-sm">{s.label}</span>
                        </div>
                        {i < AI_FLOW_STEPS.length - 1 && <div className="flex justify-center py-1"><div className="w-px h-3 bg-slate-600" /></div>}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Gem className="w-5 h-5 text-amber-400" />Cloud AI (Primary)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>Powers the core narrative generation and full game state management. Every turn&apos;s prose, dice rolls, and state updates flow through Cloud AI.</p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Opening Scene Tokens', value: '8,000 max' },
                      { label: 'Regular Turn Tokens', value: '6,000 max' },
                      { label: 'Temperature', value: '0.9 (creative)' },
                      { label: 'Retry Strategy', value: '3 attempts, exponential backoff' },
                      { label: 'Base Delay', value: '6,000ms' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-gray-400"><span>{r.label}</span><Badge className="bg-slate-700 text-xs">{r.value}</Badge></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Timer className="w-5 h-5 text-amber-400" />Throttling &amp; Rate Limits</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50 text-center"><div className="text-3xl font-bold text-amber-400">15</div><div className="text-sm text-gray-400">requests / minute max</div></div>
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50 text-center"><div className="text-3xl font-bold text-amber-400">1.5s</div><div className="text-sm text-gray-400">minimum between requests</div></div>
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700/50 text-center"><div className="text-3xl font-bold text-amber-400">15s</div><div className="text-sm text-gray-400">cooldown on rate limit hit</div></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 2. SYSTEM PROMPT CONSTRUCTION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="prompt" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><MessageSquare className="w-5 h-5 text-red-400" />What the DM Sees Every Turn</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Each turn, the engine constructs a comprehensive system prompt containing <em>everything</em> the DM needs to make informed decisions. The prompt is built by the <code className="text-red-300 bg-red-900/20 px-1 rounded">buildDMSystem(gs)</code> function.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Party State', desc: 'All living PCs: HP, AC, alignment, injuries, personality, ability scores, class levels', icon: Users },
                    { label: 'Shard Info', desc: 'Name, pantheon, origin lore, charges remaining, summoned list, darkened status', icon: Gem },
                    { label: 'Antagonist', desc: 'HP/maxHp, phase, banishment status, rival info (Act III), clues revealed', icon: Skull },
                    { label: 'Prophecy', desc: 'Current riddle (first 150 chars), state (dormant to fulfilled), carrier PC', icon: Sparkles },
                    { label: 'Active Quests', desc: 'All active quests with uncompleted objectives, formatted as strings', icon: Scroll },
                    { label: 'Act Context', desc: 'Current act, turn limits (act1TurnLimit, act2TurnLimit), act2StartTurn', icon: Layers },
                    { label: 'Conversation History', desc: 'Last 10 exchanges for persistent NPC memory and narrative continuity', icon: MessageSquare },
                    { label: 'Journey Summary', desc: 'Full campaign TLDR, updated each turn by the AI (under 150 words)', icon: BookOpen },
                    { label: 'Success Rate', desc: 'Current win %, all bonus breakdowns visible to DM', icon: Target },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                        <div className="flex items-center gap-2 mb-1"><Icon className="w-3.5 h-3.5 text-red-400" /><span className="text-sm font-bold text-white">{item.label}</span></div>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong style={{ color: '#D4AF37' }}>Key design principle:</strong> The prompt is ASCII-only (toAscii conversion strips smart quotes, em dashes, etc.) to prevent JSON parsing issues. The prompt ends with the complete JSON schema the AI must follow.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 3. DM RESPONSE SCHEMA */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="schema" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><FileWarning className="w-5 h-5 text-amber-400" />Complete DMResponse Schema (20 fields)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600"><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Field</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Type</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Description</th></tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {DM_RESPONSE_SCHEMA.map((s) => (
                        <tr key={s.field} className="border-b border-slate-700/50">
                          <td className="py-1.5 font-mono text-red-300 text-xs">{s.field}</td>
                          <td className="py-1.5 text-gray-500 font-mono text-xs">{s.type}</td>
                          <td className="py-1.5 text-xs text-gray-400">{s.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><RefreshCcw className="w-5 h-5 text-cyan-400" />State Update Sub-Schema</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-600"><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Field</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Type</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Description</th></tr></thead>
                    <tbody className="text-gray-300">
                      {STATE_UPDATE_SCHEMA.map((s) => (
                        <tr key={s.field} className="border-b border-slate-700/50">
                          <td className="py-1.5 font-mono text-red-300">{s.field}</td>
                          <td className="py-1.5 text-gray-400 font-mono text-xs">{s.type}</td>
                          <td className="py-1.5">{s.desc} {s.required && <Badge className="bg-red-900/50 text-red-300 text-xs ml-2">Required</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 rounded bg-slate-900/80 border border-slate-600 text-sm text-gray-300 overflow-x-auto mt-4" style={{ fontFamily: 'var(--font-caption)' }}>
                  <pre style={{ fontFamily: 'var(--font-caption)' }}>{`// Example state_updates from AI response
[
  { "pc_id": "heracles", "hp_delta": -15, "new_condition": "Bleeding" },
  { "pc_id": "ANTAGONIST", "hp_delta": -25 },
  { "pc_id": "arthur", "hp_delta": 8, "remove_condition": "Stunned" },
  { "pc_id": "lancelot", "dead": true }
]`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 4. STATE UPDATE PROTOCOL */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="state-updates" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Database className="w-5 h-5 text-red-400" />State Updates: The Only Way the Game Changes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}><strong style={{ color: '#D4AF37' }}>Every game state change flows through the AI&apos;s JSON state_updates array.</strong> The engine never modifies HP, conditions, or death flags on its own (except for DOT damage processing and success rate recalculation). All mutations originate from the DM&apos;s response.</p>
                <p className="text-gray-300 text-sm mt-2" style={{ fontFamily: 'var(--font-body)' }}><strong style={{ color: '#D4AF37' }}>Hybrid Input System:</strong> Players can either select preset quick actions (stamina costs enforced by engine) or write free-text custom actions. Custom actions are tagged as <code className="text-amber-300 bg-amber-900/20 px-1 rounded">custom_action</code> in the prompt — the DM must interpret intent, determine the appropriate skill check, apply stamina (1 observation, 2 combat, 3 magical), and mechanically resolve them like any other choice.</p>
                <div className="space-y-3">
                  {[
                    { step: 'HP Delta', desc: 'hp_delta is coerced with Number() and clamped to [0, maxHp]. Antagonist uses "ANTAGONIST" as pc_id and routes to antagonistHp.', icon: Heart },
                    { step: 'Conditions', desc: 'new_condition is added to the PC\'s conditions array (if not already present). remove_condition filters it out.', icon: Shield },
                    { step: 'Death Detection', desc: 'If dead=true OR hp<=0 after applying hp_delta, the PC is marked dead and hp set to 0. This triggers prophecy transfer and Test of Faith.', icon: Skull },
                    { step: 'Antagonist Routing', desc: 'pc_id="ANTAGONIST" routes to the dedicated antagonistHp field. HP is clamped to [0, antagonistMaxHp].', icon: Flame },
                    { step: 'NPC Updates', desc: 'If pc_id is not found in the party, the engine searches activeNPCs. Dead NPCs are removed from the active list.', icon: Users },
                  ].map(s => {
                    const Icon = s.icon
                    return (
                      <div key={s.step} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50">
                        <Icon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        <div><div className="text-sm font-bold text-white">{s.step}</div><div className="text-xs text-gray-400">{s.desc}</div></div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 5. SUCCESS RATE ENGINE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="success-rate" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Target className="w-5 h-5 text-emerald-400" />Success Rate Engine</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The success rate is recalculated <strong>every turn</strong> after state updates are applied. It uses <code className="text-red-300 bg-red-900/20 px-1 rounded">calculateSuccessRate(factors)</code> which returns both the total and a breakdown.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600"><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Factor</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Formula</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Range</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Cap</th><th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Details</th></tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {SUCCESS_FACTORS.map(f => {
                        const Icon = f.icon
                        return (
                          <tr key={f.name} className="border-b border-slate-700/50">
                            <td className="py-1.5 text-white text-xs"><Icon className={`w-3 h-3 inline ${f.color} mr-1`} />{f.name}</td>
                            <td className="py-1.5 font-mono text-xs text-amber-300">{f.formula}</td>
                            <td className="py-1.5 text-xs">{f.range}</td>
                            <td className="py-1.5 text-xs">{f.cap}</td>
                            <td className="py-1.5 text-xs text-gray-400">{f.desc}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400 mt-4" style={{ fontFamily: 'var(--font-caption)' }}>
                  <strong style={{ color: '#D4AF37' }}>Recalculation (each turn):</strong> livingPCs = pcs.filter(!dead). alliedGods = npcHistory.filter(align.includes(&apos;good&apos;)).length. pcRenown = Σ(classLevel/3). pcPower = Σ(hp/100). storyAchievements = completedQuests + floor(clues/2).
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 6. NARRATIVE VOICE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="narrative" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><BookOpen className="w-5 h-5 text-red-400" />Narrative Voice Guidelines</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The AI DM writes in the style of Neil Gaiman &mdash; literary, atmospheric, wry, and deeply aware of the weight of myth. The system prompt includes explicit instructions for prose quality.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Prose Requirements</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li><strong className="text-amber-300">2-3 paragraphs (150-300 words)</strong> for regular turns</li>
                      <li>Opening scenes get 4-6 paragraphs (600-1000 words)</li>
                      <li>Opening scenes get 8,000 tokens; regular turns get 6,000</li>
                      <li>Paragraph 1: action/outcome, Paragraph 2: world reaction/atmosphere, Paragraph 3: tension/foreshadowing</li>
                      <li>Sensory details: sound, smell, texture, light</li>
                      <li>Include dialogue between party members</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Dice Roll Narration</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Every d20 roll is narrated, not just reported</li>
                      <li>Success and failure both get dramatic treatment</li>
                      <li>Critical moments deserve expanded prose</li>
                      <li>Injuries are narrated with visceral detail</li>
                      <li>Death is treated with weight and consequence</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400 italic" style={{ fontFamily: 'var(--font-caption)' }}>&quot;Write the narrative prose. Then, append the JSON block.&quot; &mdash; The prompt instructs the AI to write prose FIRST, then append the structured data. This produces natural-feeling narrative that contains the required game mechanics.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 7. D&D 5E SKILL SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="skill-system" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Target className="w-5 h-5 text-cyan-400" />D&amp;D 5e Skill System &mdash; DM Reference</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300" style={{ fontFamily: 'var(--font-body)' }}>The skill system is a <strong className="text-cyan-300">narrative enrichment layer</strong>, not a mechanical resolver. It does not alter the success rate formula or replace d20 rolls. Instead, it tells the AI DM what kinds of actions each character is good at, so the generated choices reflect each PC&apos;s identity. Without it, every hero gets the same generic options. With it, a fighter-strong PC gets &quot;Intimidate the sentry&quot; while a thief-dextrous PC gets &quot;Pick the lock.&quot;</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Class Inference Pipeline</h4>
                    <p className="text-xs text-gray-400 mb-3">When a hero or demigod is loaded as a PC, the engine infers their AD&amp;D 1e classes from three sources, ranked by priority:</p>
                    <div className="space-y-2">
                      {[
                        { step: '1', src: 'Krynn level field', desc: 'Parses strings like "10th ranger/8th fighter" into structured class levels', color: 'text-amber-400' },
                        { step: '2', src: 'Ability keywords', desc: 'Scans abilities[] for class terms: "fighter", "cleric", "magic-user", "thief", "ranger", "paladin", "druid", "illusionist"', color: 'text-blue-400' },
                        { step: '3', src: 'Ability scores', desc: 'STR 16+ → Fighter, WIS 16+ → Cleric, INT 16+ → Magic User, DEX 16+ → Thief (fallback)', color: 'text-green-400' },
                      ].map(s => (
                        <div key={s.step} className="flex items-start gap-2 p-2 rounded bg-slate-800/50">
                          <span className={`font-bold ${s.color} w-4 shrink-0`}>{s.step}</span>
                          <div><div className="text-xs font-bold text-white">{s.src}</div><div className="text-[11px] text-gray-400">{s.desc}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Proficiency Assignment Rules</h4>
                    <p className="text-xs text-gray-400 mb-3">The engine takes the PC&apos;s top 3 classes by level and grants 3 skills per class. Additionally:</p>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li><strong className="text-white">Fighter:</strong> Athletics, Intimidation</li>
                      <li><strong className="text-white">Cleric:</strong> Religion, Medicine, Insight</li>
                      <li><strong className="text-white">Magic User:</strong> Arcana, History, Investigation</li>
                      <li><strong className="text-white">Thief:</strong> Stealth, Sleight of Hand, Acrobatics</li>
                      <li><strong className="text-white">CHA 15+:</strong> Deception, Persuasion, Performance</li>
                      <li><strong className="text-white">WIS 15+:</strong> Perception, Survival, Animal Handling</li>
                      <li><strong className="text-white">DEX 15+:</strong> Acrobatics, Stealth</li>
                    </ul>
                    <div className="mt-2 p-2 rounded bg-amber-900/20 text-[11px] text-amber-300">Max from classes: 9 proficiencies. High-stat bonuses are additive (no cap). Duplicate skills are not double-counted.</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#2ECC71', fontWeight: 700 }}>How Skills Reach the AI Prompt</h4>
                    <p className="text-xs text-gray-300">Skill proficiencies are included in the <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">pc.skills</code> and <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">pc.skillProficiencies</code> fields of the game state sent to the Cloud API every turn. The system prompt instructs the AI to use these when generating the 3 quick action choices. Skills are also displayed on the player&apos;s character card as badges for quick reference. For custom (free-text) actions, the DM infers the appropriate skill based on the player&apos;s description.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Scope &amp; Exclusions</h4>
                    <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                      <li><strong className="text-cyan-300">Heroes &amp; Demigods:</strong> Full skill system applies</li>
                      <li><strong className="text-gray-400">Greater/Lesser Gods:</strong> No skills &mdash; use named divine abilities</li>
                      <li><strong className="text-gray-400">Monsters:</strong> No skills &mdash; use attack forms and special abilities</li>
                      <li><strong className="text-gray-400">Companions:</strong> Skills inferred same as PCs but not displayed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 8. FALLBACK SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="fallbacks" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><AlertTriangle className="w-5 h-5 text-amber-400" />Fallback System</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4" style={{ fontFamily: 'var(--font-body)' }}>The engine has 6 fallback scenarios. All are recoverable <strong>except</strong> invalid API key, which blocks gameplay until the user provides a valid key.</p>
                <div className="space-y-3">
                  {FALLBACK_SCENARIOS.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <div key={i} className={`p-4 rounded-lg border ${s.border} ${s.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${s.color}`} />
                          <span className={`font-bold text-sm ${s.color}`}>{s.trigger}</span>
                          <Badge className={`${s.severity === 'recoverable' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'} ml-auto text-xs`}>{s.severity}</Badge>
                        </div>
                        <div className="text-xs text-gray-300"><strong>Response:</strong> {s.response}</div>
                        <div className="text-xs text-gray-400"><strong>Fallback:</strong> {s.fallback}</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 8. TEST OF FAITH ENGINE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="faith-engine" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Zap className="w-5 h-5 text-amber-400" />Test of Faith Engine</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The <code className="text-amber-300 bg-amber-900/20 px-1 rounded">checkTestOfFaith()</code> function runs after <code className="text-amber-300 bg-amber-900/20 px-1 rounded">applyMechanics()</code> to determine if the player should be offered a Test of Faith.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-700">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Trigger Conditions (checked in order)</h4>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                      <li><strong>Guard:</strong> Must be Act II or later (not Act I)</li>
                      <li><strong>Guard:</strong> 10-turn cooldown since last test</li>
                      <li><strong>Guard:</strong> Less than 2 miracles used total</li>
                      <li><strong>Death save:</strong> A PC died (not previously miracle&apos;d)</li>
                      <li><strong>Boss phase:</strong> boss_phase_trigger = true</li>
                      <li><strong>Desperate odds:</strong> success rate &lt; 40%</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#DC143C', fontWeight: 700 }}>Roll Processing (resolveTestOfFaith)</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li><strong className="text-amber-300">18-20 (Miracle):</strong> +8 success rate, restore 1 shard charge, rekindle shard. Death save: revive at 1 HP, restore prophecy, remove successor. Boss phase: 15% max HP damage.</li>
                      <li><strong className="text-gray-300">4-17 (Fate Holds):</strong> No mechanical changes.</li>
                      <li><strong className="text-red-300">1-3 (Murphy&apos;s Law):</strong> -5 success rate, random item loses charge, shard darkens.</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>
                  <strong style={{ color: '#D4AF37' }}>Prophecy restoration on miracle:</strong> If a successor PC received the prophecy after the original PC died, a miracle reverses the transfer. The successor is removed from the party (if they were added solely as a replacement), and the original PC reclaims their prophecy.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 9. DIFFICULTY SCALING */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="difficulty" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><BarChart3 className="w-5 h-5 text-red-400" />Difficulty Scaling</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Difficulty is not a single slider but an emergent property of multiple interacting systems. The success rate formula naturally produces harder campaigns as the story progresses.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-700">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#2ECC71', fontWeight: 700 }}>Act I (50-65%)</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>&#8226; Base 50 + party bonus</li>
                      <li>&#8226; Prophecy dormant (+0)</li>
                      <li>&#8226; Few allies, few achievements</li>
                      <li>&#8226; RNG turn limit: 10-100</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Act II (65-80%)</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>&#8226; Allies accumulated (+3 each)</li>
                      <li>&#8226; Prophecy awakening (+3)</li>
                      <li>&#8226; Quests completed (×2 each)</li>
                      <li>&#8226; Clues found (÷2 bonus)</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-red-900/20 border border-red-700">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#DC143C', fontWeight: 700 }}>Act III (70-90%)</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>&#8226; Prophecy manifesting (+5) or fulfilled (+8)</li>
                      <li>&#8226; Maximum story achievements</li>
                      <li>&#8226; Antagonist type penalty (-5 if god)</li>
                      <li>&#8226; Banishment return at full power</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}><strong style={{ color: '#D4AF37' }}>Key insight:</strong> A Greater God antagonist imposes a flat -5% penalty. Combined with party deaths reducing livingPCs, and a broken prophecy (-5%), campaigns can become genuinely desperate &mdash; which triggers the Test of Faith.</div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 10. HP VALIDATION */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="hp-validation" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Shield className="w-5 h-5 text-emerald-400" />HP Validation &amp; Clamping</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The engine applies strict HP validation to prevent AI errors from corrupting game state. Every hp_delta value runs through the same validation pipeline.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {[
                      { rule: 'Type Coercion', desc: 'All HP values run through Number() to prevent string corruption from AI', icon: Activity },
                      { rule: 'Clamp to Range', desc: 'HP is clamped to [0, maxHp]. Cannot exceed max, cannot go below 0.', icon: ArrowDownUp },
                      { rule: 'NaN Guard', desc: 'If HP becomes NaN after calculation, it reverts to previous value', icon: ShieldAlert },
                      { rule: 'Antagonist Routing', desc: 'pc_id "ANTAGONIST" routes to dedicated antagonistHp tracking', icon: Skull },
                      { rule: 'DOT Death Detection', desc: 'DOT damage is processed each turn; if it kills a PC, death mechanics trigger', icon: Heart },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.rule} className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50">
                          <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <div><div className="text-sm font-bold text-white">{item.rule}</div><div className="text-xs text-gray-400">{item.desc}</div></div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-600 text-xs text-gray-300 overflow-x-auto" style={{ fontFamily: 'var(--font-caption)' }}>
                    <pre style={{ fontFamily: 'var(--font-caption)' }}>{`// HP validation in applyMechanics
if (u.hp_delta) {
  pc.hp = Math.max(0, Math.min(pc.maxHp, pc.hp + Number(u.hp_delta)))
}
if (u.dead || pc.hp <= 0) {
  pc.dead = true
  pc.hp = 0
  // → triggers prophecy transfer + Test of Faith check
}

// Antagonist special routing
if (u.pc_id === 'ANTAGONIST') {
  gs.antagonistHp = Math.max(0,
    Math.min(gs.antagonistMaxHp,
      gs.antagonistHp + Number(u.hp_delta || 0)))
}`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 11. ITEM SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="items-dm" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Briefcase className="w-5 h-5 text-amber-400" />Item System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Modifier Handling</h4>
                    <p className="text-sm text-gray-300 mb-3" style={{ fontFamily: 'var(--font-body)' }}>The AI generates items with modifier objects. The <code className="text-amber-300 bg-amber-900/20 px-1 rounded">handleUseItem()</code> function checks for 13 modifier keys:</p>
                    <div className="space-y-1">
                      {['healing', 'full_heal', 'cure_poison', 'cure_all_poison', 'death_ward', 'invisible', 'str_set', 'all_saves', 'protection', 'undead_ward', 'true_sight', 'regen', 'fear_immune'].map(m => (
                        <div key={m} className="text-xs"><code className="text-amber-300 bg-amber-900/20 px-1 rounded">{m}</code></div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">If no modifier matches, the item is treated as passive (equipment).</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Charge System</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Items with charges &gt; 1: decrement by 1 on use</li>
                      <li>Items with charges = 1: removed from inventory</li>
                      <li>Equipment has charges = 99 (effectively permanent)</li>
                      <li>Conditions are checked before granting (no duplicates)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 12. QUEST SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="quests-dm" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Scroll className="w-5 h-5 text-purple-400" />Quest System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>Quests are tracked in the prompt as formatted strings for AI awareness, and managed via the <code className="text-purple-300 bg-purple-900/20 px-1 rounded">quest_updates</code> array in the DMResponse.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#7B2D8E', fontWeight: 700 }}>Quest Types &amp; Status</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li><strong className="text-white">main</strong> &mdash; Core campaign quest</li>
                      <li><strong className="text-white">side</strong> &mdash; Optional exploration quests</li>
                      <li><strong className="text-white">hidden</strong> &mdash; Secret objectives</li>
                      <li><strong className="text-emerald-400">active</strong> &rarr; <strong className="text-green-400">completed</strong> &rarr; <strong className="text-red-400">failed</strong></li>
                      <li>Individual objectives track completion independently</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#2ECC71', fontWeight: 700 }}>Success Rate Integration</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Completed quests contribute to storyAchievements</li>
                      <li>storyAchievements × 2 (max +12%)</li>
                      <li>Clue discoveries also count (÷2)</li>
                      <li>Quest updates are merged: existing quests updated, new quests appended</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-900/80 border border-slate-600 text-sm text-gray-300 overflow-x-auto mt-4" style={{ fontFamily: 'var(--font-caption)' }}>
                  <pre style={{ fontFamily: 'var(--font-caption)' }}>{`// quest_updates in DMResponse
{
  "quest_updates": [{
    "id": "find_the_shard",
    "status": "completed",
    "objectives": [
      { "text": "Locate the Shard", "completed": true },
      { "text": "Defeat guardian", "completed": true }
    ]
  }]
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 13. SAVE/LOAD INTEGRITY */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="saves-dm" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Save className="w-5 h-5 text-cyan-400" />Save/Load Integrity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The complete game state is serialized to <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">localStorage</code>. The load function uses a default merge strategy for backward compatibility.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Default Merge Strategy</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Load reads saved JSON from localStorage</li>
                      <li>Merges with a fresh default GameState</li>
                      <li>Missing fields from older saves are filled with defaults</li>
                      <li>Guarantees all fields exist even after game updates</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Save Slot Metadata</h4>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>5 slots with id, name, timestamp</li>
                      <li>Stores: turn number, act, party names</li>
                      <li>Auto-save at end of each turn</li>
                      <li>Slot selection shows metadata for easy identification</li>
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-900/80 border border-slate-600 text-sm text-gray-300 overflow-x-auto mt-4" style={{ fontFamily: 'var(--font-caption)' }}>
                  <pre style={{ fontFamily: 'var(--font-caption)' }}>{`// Simplified loadGame logic
const saved = JSON.parse(localStorage.getItem(key))
const merged = { ...getDefaultGameState(), ...saved }
// All new fields from updates are preserved via defaults
// Old fields from saves are preserved via spread`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 14. ACHIEVEMENT SYSTEM */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="achievements-dm" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Sparkles className="w-5 h-5 text-yellow-400" />Achievement System</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The achievement system runs <code className="text-yellow-300 bg-yellow-900/20 px-1 rounded">checkAchievements()</code> after every turn, comparing the current game state against the previous turn to detect milestones. Unlocks are persisted in save data via <code className="text-yellow-300 bg-yellow-900/20 px-1 rounded">serializeTracker()</code>.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>4 Tiers</h4>
                    <div className="space-y-2">
                      {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                        <div key={tier} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 6px ${cfg.glow}` }} />
                          <span className="font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                          <span className="text-gray-400">&mdash; {ACHIEVEMENT_DEFS.filter(a => a.tier === tier).length} achievements ({ACHIEVEMENT_DEFS.filter(a => a.tier === tier && a.hidden).length} hidden)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>7 Categories</h4>
                    <div className="space-y-1">
                      {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
                        <div key={cat} className="flex items-center gap-2 text-sm text-gray-300">
                          <span>{cfg.icon}</span>
                          <span className="font-bold text-white">{cfg.label}</span>
                          <span className="text-gray-500 ml-auto">{ACHIEVEMENT_DEFS.filter(a => a.category === cat).length}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400" style={{ fontFamily: 'var(--font-caption)' }}>
                  <strong style={{ color: '#2ECC71' }}>Success Rate Integration:</strong> Achievements feed into the <code className="text-red-300 bg-red-900/20 px-1 rounded">storyAchievements</code> factor: <code className="text-amber-300">min((completedQuests + floor(clues/2)) × 2, 12)</code>. Completed quests and uncovered antagonist clues both contribute +2 each (capped at +12%). This means thorough exploration and quest completion directly improve the party&apos;s odds of victory.
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Scroll className="w-5 h-5 text-red-400" />Full Achievement Registry ({ACHIEVEMENT_DEFS.length} total)</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-600">
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>ID</th>
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Name</th>
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Category</th>
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Tier</th>
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Description</th>
                        <th className="text-left py-2" style={{ fontFamily: 'var(--font-caption)', color: '#D4AF37' }}>Hidden</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      {ACHIEVEMENT_DEFS.map(a => {
                        const tierCfg = TIER_CONFIG[a.tier]
                        const catCfg = CATEGORY_CONFIG[a.category]
                        return (
                          <tr key={a.id} className="border-b border-slate-700/50">
                            <td className="py-1.5 font-mono text-xs text-gray-500">{a.id}</td>
                            <td className="py-1.5 text-white text-xs">{a.icon} {a.name}</td>
                            <td className="py-1.5 text-xs">{catCfg.icon} {catCfg.label}</td>
                            <td className="py-1.5 text-xs" style={{ color: tierCfg.color }}>{tierCfg.label}</td>
                            <td className="py-1.5 text-xs text-gray-400 max-w-xs">{a.description}</td>
                            <td className="py-1.5 text-xs">{a.hidden ? <Badge className="bg-slate-700 text-gray-500 text-xs">Hidden</Badge> : <Badge className="bg-green-900/30 text-green-400 text-xs">Visible</Badge>}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* 15. AUDIO ENGINE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="audio-engine" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Music className="w-5 h-5 text-purple-400" />Procedural Audio Engine</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The audio engine (<code className="text-purple-300 bg-purple-900/20 px-1 rounded">useGameAudio()</code>) generates all sound procedurally using the Web Audio API &mdash; no audio files are loaded. Every sound is synthesized in real-time from oscillators, noise generators, and filters.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#7B2D8E', fontWeight: 700 }}>8 Ambient Themes</h4>
                    <p className="text-xs text-gray-400 mb-2">Each theme is a layered drone built from base frequency, harmonics, LFO modulation, and filtered noise:</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Intro', freq: '36.71 Hz (D1)', desc: 'Ancient temple stillness — deep Om drone + breath', color: 'text-purple-400' },
                        { name: 'Act I', freq: '32.70 Hz (C1)', desc: 'Forgotten wilderness — tense low rumble + wind howl', color: 'text-green-400' },
                        { name: 'Act II', freq: '41.20 Hz (E1)', desc: 'Ancient war-temple — dark choir + metallic resonance', color: 'text-amber-400' },
                        { name: 'Act III', freq: '27.50 Hz (A0)', desc: 'Abyssal boss domain — crushing dissonance + thunder', color: 'text-red-400' },
                        { name: 'Tavern', freq: '73.42 Hz (D2)', desc: 'Warm hearth tones — gentle warmth pulse + distant chatter', color: 'text-orange-400' },
                        { name: 'Forest', freq: '55 Hz (A1)', desc: 'Deep earth rumble — wind through canopy + bird songs', color: 'text-emerald-400' },
                        { name: 'Battle', freq: '41.20 Hz (E1)', desc: 'Aggressive root — grinding bass, war drums, clashing steel', color: 'text-rose-400' },
                        { name: 'Temple', freq: '65.41 Hz (C2)', desc: 'Sacred tone — pure drone, perfect fifth, cathedral reverb', color: 'text-cyan-400' },
                        { name: 'Ocean', freq: '36.71 Hz (D1)', desc: 'Deep wave — tidal drone, wave crest, sea foam shimmer', color: 'text-blue-400' },
                      ].map(t => (
                        <div key={t.name} className="flex items-start gap-2 text-xs">
                          <Volume2 className={`w-3 h-3 mt-0.5 ${t.color} shrink-0`} />
                          <div><span className={`font-bold ${t.color}`}>{t.name}</span> <span className="text-gray-500 font-mono">({t.freq})</span><br /><span className="text-gray-400">{t.desc}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#7B2D8E', fontWeight: 700 }}>SFX Event System</h4>
                    <p className="text-xs text-gray-400 mb-2">The <code className="text-purple-300 bg-purple-900/20 px-1 rounded">soundEvents</code> publish/subscribe bus dispatches procedural sound effects:</p>
                    <div className="space-y-2">
                      {[
                        { event: 'dice_roll', desc: '6-10 rapid noise bursts + success/fail resolution tone', detail: 'Success: rising A5-E6 arpeggio. Fail: descending sine sweep 300→60 Hz' },
                        { event: 'combat_hit', desc: 'Noise burst + sub-bass impact + resonant metal', detail: 'Critical: louder impact (0.35 gain) + higher-pitched ring (2400 Hz)' },
                        { event: 'combat_miss', desc: 'Whoosh — filtered white noise burst (4 kHz, 200ms)', detail: 'Uses lowpass filter to simulate air displacement' },
                        { event: 'injury', desc: 'Harsh noise burst (2 kHz) + descending bass drone', detail: 'Slow 300ms decay with low-frequency rumble' },
                        { event: 'shard_pulse', desc: 'Descending sine sweep 1200→800 Hz through reverb', detail: '2-second convolver reverb for supernatural echo' },
                        { event: 'act_transition', desc: 'Arpeggiated chord unique to each act', detail: 'Intro: 3 notes, Act I: 4, Act II: 5, Act III: 6 (sawtooth)' },
                        { event: 'boss_phase', desc: 'Two distinct chords for Phase 2 vs Phase 3', detail: 'Rapid 80ms intervals with sawtooth oscillators' },
                        { event: 'victory', desc: '6 ascending major triads spanning C4-G#5', detail: 'Each chord: 250ms duration with 500ms total spacing' },
                        { event: 'death', desc: 'Descending sine 300→80 Hz over 1 second', detail: 'Slow exponential decay to silence' },
                      ].map(s => (
                        <div key={s.event} className="p-2 rounded bg-slate-800/50 text-xs">
                          <div className="flex items-center gap-2"><code className="text-purple-300 font-mono">{s.event}</code></div>
                          <div className="text-gray-300 mt-0.5">{s.desc}</div>
                          <div className="text-gray-500 mt-0.5">{s.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37' }}><Eye className="w-5 h-5 text-cyan-400" />Scene Theme Auto-Detection</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm" style={{ fontFamily: 'var(--font-body)' }}>The <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">useSceneMusic()</code> hook automatically selects ambient themes based on the current game state. It checks the <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">storySummary</code> for location keywords and active NPC conditions for battle detection.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#2ECC71', fontWeight: 700 }}>Detection Priority</h4>
                    <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                      <li><strong className="text-red-300">Hostile NPCs:</strong> Any NPC with &quot;hostile&quot; or &quot;enemy&quot; condition &rarr; battle theme</li>
                      <li><strong className="text-orange-300">Tavern:</strong> Keywords: tavern, inn, bar, pub, alehouse</li>
                      <li><strong className="text-emerald-300">Forest:</strong> Keywords: forest, woods, grove, jungle, wilderness</li>
                      <li><strong className="text-cyan-300">Temple:</strong> Keywords: temple, shrine, sanctum, altar, cathedral, chapel</li>
                      <li><strong className="text-blue-300">Ocean:</strong> Keywords: ocean, sea, ship, harbor, coast, shore, port</li>
                      <li><strong className="text-gray-400">Act Fallback:</strong> Act I &rarr; forest, Act II &rarr; battle, Act III &rarr; battle</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50">
                    <h4 className="mb-2" style={{ fontFamily: 'var(--font-subheading)', color: '#D4AF37', fontWeight: 700 }}>Act Progression</h4>
                    <p className="text-xs text-gray-400 mb-2">Ambient themes evolve with the story:</p>
                    <div className="space-y-2">
                      {[
                        { act: 'Intro', mood: 'Meditative, sacred', detail: 'Very slow breathing LFO (0.08 Hz), warm soft filter (350 Hz)', color: 'text-purple-400' },
                        { act: 'Act I', mood: 'Ominous, uncertain', detail: 'Slow undulation (0.12 Hz), dark muted filter (280 Hz, Q 1.8)', color: 'text-green-400' },
                        { act: 'Act II', mood: 'Dark choir, tension', detail: 'Choir vibrato (0.25 Hz), mid-range filter (520 Hz) + 6s reverb', color: 'text-amber-400' },
                        { act: 'Act III', mood: 'Abyssal, crushing', detail: 'Heavy pulsing (0.4 Hz), metallic filter (450 Hz, Q 3.5) + LFO→filter', color: 'text-red-400' },
                      ].map(a => (
                        <div key={a.act} className="text-xs">
                          <span className={`font-bold ${a.color}`}>{a.act}</span> <span className="text-gray-500">({a.mood})</span>
                          <div className="text-gray-400 font-mono mt-0.5">{a.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-700/30 text-sm text-gray-400 mt-4" style={{ fontFamily: 'var(--font-caption)' }}>
                  <strong style={{ color: '#7B2D8E' }}>Seamless Transitions:</strong> When the theme changes (e.g., entering a tavern or act transition), the current ambient fades out over 1.5 seconds via <code className="text-cyan-300 bg-cyan-900/20 px-1 rounded">transitionAmbient()</code>, then the new theme fades in over 3 seconds. Act III gets special treatment: the LFO also modulates the filter cutoff frequency for an ominous pulsing sweep effect.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}
