'use client'
import React from 'react'
import { MapPin, Mountain, Trees, Building, Waves, Skull } from 'lucide-react'
import type { GameState } from '@/lib/gameTypes'

interface RegionIndicatorProps {
  gameState: GameState
}

export function RegionIndicator({ gameState }: RegionIndicatorProps) {
  // Try to infer region from location or scene data
  const location = (gameState as Record<string, unknown>).location as string || ''
  const scene = (gameState as Record<string, unknown>).currentScene as string || ''
  const locText = location || scene || 'Unknown Realm'
  
  const lowerLoc = locText.toLowerCase()
  let Icon = MapPin
  let regionColor = '#d4af37'
  
  if (lowerLoc.includes('dungeon') || lowerLoc.includes('crypt') || lowerLoc.includes('tomb')) { Icon = Skull; regionColor = '#c04040' }
  else if (lowerLoc.includes('temple') || lowerLoc.includes('palace') || lowerLoc.includes('sanctum')) { Icon = Building; regionColor = '#a080d0' }
  else if (lowerLoc.includes('forest') || lowerLoc.includes('wood') || lowerLoc.includes('grove')) { Icon = Trees; regionColor = '#4a9060' }
  else if (lowerLoc.includes('mountain') || lowerLoc.includes('peak') || lowerLoc.includes('summit')) { Icon = Mountain; regionColor = '#8b6914' }
  else if (lowerLoc.includes('ocean') || lowerLoc.includes('sea') || lowerLoc.includes('river')) { Icon = Waves; regionColor = '#4090c0' }
  else if (lowerLoc.includes('tavern') || lowerLoc.includes('inn') || lowerLoc.includes('city')) { Icon = Building; regionColor = '#c9a84c' }

  return (
    <div className="p-2 rounded-lg border border-[#2a2010] flex items-center gap-2" style={{
      background: 'linear-gradient(135deg, rgba(26,21,16,0.6), rgba(16,12,8,0.4))',
    }}>
      <MapPin className="w-4 h-4 text-[#d4af37]" />
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" style={{ color: regionColor }} />
        <span className="text-xs font-name" style={{ color: regionColor }}>{locText}</span>
      </div>
    </div>
  )
}
