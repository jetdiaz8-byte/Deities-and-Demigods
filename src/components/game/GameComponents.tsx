'use client'

import React, { useState } from 'react'
import { 
  ChevronDown, ChevronUp, Sword, Shield, Zap, BookOpen, 
  Heart, Skull, Volume2, VolumeX, SkipForward, Sparkles
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL DICE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface DiceRollProps {
  die: string
  roll: number
  dc: number
  success: boolean
  roller: string
  notes?: string
  isAnimating?: boolean
}

const DiceFace = ({ sides, value, isRolling }: { sides: number; value: number; isRolling: boolean }) => {
  const getDiceColor = () => {
    switch (sides) {
      case 4: return 'from-red-800 to-red-600 border-red-400'
      case 6: return 'from-blue-800 to-blue-600 border-blue-400'
      case 8: return 'from-green-800 to-green-600 border-green-400'
      case 10: return 'from-purple-800 to-purple-600 border-purple-400'
      case 12: return 'from-amber-800 to-amber-600 border-amber-400'
      case 20: return 'from-yellow-600 to-yellow-400 border-yellow-300'
      default: return 'from-gray-700 to-gray-500 border-gray-400'
    }
  }

  const getShape = () => {
    switch (sides) {
      case 4: return 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%)'
      case 8: return 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
      case 10: return 'clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
      case 12: return 'clip-path: polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%)'
      case 20: return 'clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
      default: return 'border-radius: 8px'
    }
  }

  return (
    <div 
      className={`
        w-12 h-12 md:w-14 md:h-14 flex items-center justify-center
        bg-gradient-to-br ${getDiceColor()}
        text-white font-bold text-lg md:text-xl
        shadow-lg border-2
        ${isRolling ? 'animate-spin' : 'animate-pulse'}
        transition-all duration-300
      `}
      style={{ 
        clipPath: sides !== 6 ? getShape().replace('clip-path: ', '') : 'none',
        borderRadius: sides === 6 ? '8px' : '0'
      }}
    >
      {isRolling ? '?' : value}
    </div>
  )
}

export const VisualDiceRoll = ({ die, roll, dc, success, roller, notes, isAnimating }: DiceRollProps) => {
  // Parse dice notation
  const parseDice = (notation: string): { count: number; sides: number }[] => {
    const dice: { count: number; sides: number }[] = []
    const parts = notation.toLowerCase().replace('d20', '1d20').split('+').map(p => p.trim())
    
    for (const part of parts) {
      const match = part.match(/(\d+)d(\d+)/)
      if (match) {
        dice.push({ count: parseInt(match[1]), sides: parseInt(match[2]) })
      }
    }
    return dice.length > 0 ? dice : [{ count: 1, sides: 20 }]
  }

  const dice = parseDice(die)

  // Generate plausible individual die values that sum to the total roll
  const totalDiceCount = dice.reduce((s, x) => s + x.count, 0)
  const individualValues = React.useMemo(() => {
    const remaining = roll
    const values: number[] = []
    for (let i = 0; i < totalDiceCount; i++) {
      const sides = dice.find((d, di) => {
        const prevCount = dice.slice(0, di).reduce((s, x) => s + x.count, 0)
        return i >= prevCount && i < prevCount + d.count
      })?.sides || 20
      if (i === totalDiceCount - 1) {
        // Last die gets whatever is left, clamped to valid range
        values.push(Math.max(1, Math.min(sides, remaining)))
      } else {
        // Distribute proportionally with some randomness
        const avgPerDie = remaining / (totalDiceCount - i)
        const val = Math.max(1, Math.min(sides, Math.round(avgPerDie)))
        values.push(val)
      }
    }
    return values
  }, [roll, dice, totalDiceCount])

  return (
    <div className={`
      p-3 md:p-4 rounded-xl border-2 transition-all duration-500 mb-3
      ${success 
        ? 'bg-gradient-to-r from-emerald-950/80 to-green-900/60 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
        : 'bg-gradient-to-r from-rose-950/80 to-red-900/60 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
      }
    `}>
      {/* Dice Visual */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {individualValues.map((val, i) => (
            <DiceFace
              key={`${i}`}
              sides={20}
              value={val}
              isRolling={isAnimating || false}
            />
        ))}
      </div>

      {/* Roll Result */}
      <div className="text-center">
        <div className="font-title text-base md:text-lg text-[#d4af37] mb-1">
          {roller} rolls {die.toUpperCase()}
        </div>
        <div className={`font-bold text-2xl md:text-3xl ${success ? 'text-emerald-400' : 'text-rose-400'}`}>
          {roll} {dc > 0 ? <span className="text-gray-400 text-lg">vs DC {dc}</span> : ''}
        </div>
        <div className={`text-sm mt-1 font-narrative ${success ? 'text-emerald-300' : 'text-rose-300'}`}>
          {success ? '✦ SUCCESS ✦' : '✗ FAILURE ✗'}
        </div>
        {notes && (
          <div className="text-xs text-[#b0a080] mt-2 italic font-narrative px-2">
            "{notes}"
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface HealthBarProps {
  current: number
  max: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export const HealthBar = ({ current, max, showLabel = true, size = 'md', label }: HealthBarProps) => {
  const pct = Math.max(0, Math.min(100, Math.round((current / (max || 1)) * 100)))
  
  const getColor = () => {
    if (current <= 0) return 'from-gray-600 to-gray-700'
    if (pct <= 20) return 'from-red-600 to-red-400'
    if (pct <= 40) return 'from-orange-600 to-orange-400'
    if (pct <= 60) return 'from-yellow-600 to-yellow-400'
    return 'from-emerald-600 to-emerald-400'
  }

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      {label && (
        <div className="text-[10px] text-gray-400 mb-0.5 flex justify-between">
          <span>{label}</span>
          <span className={pct <= 20 ? 'text-red-400' : 'text-gray-300'}>
            {Math.max(0, current)}/{max}
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 ${heights[size]}`}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && !label && (
        <div className="text-[10px] text-center mt-0.5">
          <span className={pct <= 20 ? 'text-red-400' : 'text-green-400'}>
            {Math.max(0, current)}
          </span>
          <span className="text-gray-500">/{max}</span>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE NARRATIVE SECTION
// ═══════════════════════════════════════════════════════════════════════════

interface NarrativeSectionProps {
  title: string
  content: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  variant?: 'default' | 'gold' | 'red' | 'blue'
}

export const NarrativeSection = ({ title, content, icon, defaultOpen = true, variant = 'default' }: NarrativeSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const variants = {
    default: 'border-[#3a3020] bg-gradient-to-b from-[#1a1610] to-[#12100c]',
    gold: 'border-[#d4af37]/50 bg-gradient-to-b from-[#2a2015] to-[#1a1510]',
    red: 'border-red-800/50 bg-gradient-to-b from-[#2a1515] to-[#1a1010]',
    blue: 'border-blue-800/50 bg-gradient-to-b from-[#151a2a] to-[#101520]'
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${variants[variant]} mb-2`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-title text-xs md:text-sm text-[#d4af37] uppercase tracking-wider">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#d4af37]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#d4af37]" />
        )}
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 text-xs md:text-sm text-[#e8e0d0] font-narrative leading-relaxed border-t border-gray-800">
          {content}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN COUNTER - Enhanced visibility
// ═══════════════════════════════════════════════════════════════════════════

interface TokenCounterProps {
  geminiTokens: number
  groqTokens: number
}

export const TokenCounter = ({ geminiTokens, groqTokens }: TokenCounterProps) => {
  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const total = geminiTokens + groqTokens

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#1a1510] to-[#201a14] rounded-lg border border-[#4a4030] shadow-md">
      {/* Total */}
      <div className="flex items-center gap-2 px-2 py-0.5 bg-[#0d0a08] rounded">
        <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-[#d4af37] text-xs font-bold">{formatTokens(total)}</span>
      </div>
      <div className="w-px h-5 bg-[#3a3020]" />
      {/* Gemini */}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(96,165,250,0.6)] animate-pulse" />
        <span className="text-gray-500 text-[10px] uppercase tracking-wide">DM</span>
        <span className="text-blue-400 text-sm font-bold">{formatTokens(geminiTokens)}</span>
      </div>
      <div className="w-px h-5 bg-[#3a3020]" />
      {/* Groq */}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-[0_0_8px_rgba(192,132,252,0.6)] animate-pulse" />
        <span className="text-gray-500 text-[10px] uppercase tracking-wide">PC</span>
        <span className="text-purple-400 text-sm font-bold">{formatTokens(groqTokens)}</span>
      </div>
    </div>
  )
}

export type { DiceRollProps, HealthBarProps, NarrativeSectionProps, TokenCounterProps }
