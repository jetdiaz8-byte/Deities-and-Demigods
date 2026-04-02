'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, Users, Sparkles, Crown } from 'lucide-react'
import { getEntityPortrait, aCol, aShort } from '@/lib/gameHelpers'
import type { Entity } from '@/lib/gameTypes'

export interface PartySelectionScreenProps {
  availableHeroes: Entity[]
  selectedParty: string[]
  setSelectedParty: React.Dispatch<React.SetStateAction<string[]>>
  previewHero: Entity | null
  setPreviewHero: (hero: Entity | null) => void
  confirmPartySelection: () => void
  setGamePhase: (phase: 'intro' | 'party_select' | 'playing') => void
  statusMessage: string | null
}

export function PartySelectionScreen({
  availableHeroes,
  selectedParty,
  setSelectedParty,
  previewHero,
  setPreviewHero,
  confirmPartySelection,
  setGamePhase,
  statusMessage,
}: PartySelectionScreenProps) {
  const [pantheonFilter, setPantheonFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const pantheons = useMemo(() => {
    const set = new Set(availableHeroes.map(h => h.pantheon).filter(Boolean))
    return Array.from(set).sort()
  }, [availableHeroes])

  const filteredHeroes = useMemo(() => {
    return availableHeroes.filter(hero => {
      if (pantheonFilter !== 'all' && hero.pantheon !== pantheonFilter) return false
      if (typeFilter !== 'all' && hero.type !== typeFilter) return false
      return true
    })
  }, [availableHeroes, pantheonFilter, typeFilter])

  const selectedHero = selectedParty.length > 0
    ? availableHeroes.find(h => h.id === selectedParty[0]) || null
    : null

  const heroCount = availableHeroes.filter(h => h.type === 'hero').length
  const demigodCount = availableHeroes.filter(h => h.type === 'demigod').length

  return (
    <div className="min-h-screen bg-[#060403] p-4">
      <div className="max-w-7xl mx-auto">
        {/* ── Gaiman-style Header ─────────────────────────────────────────── */}
        <div className="text-center mb-6 max-w-3xl mx-auto">
          <h1 style={{ fontFamily: '"Cinzel Decorative", serif', fontSize: '1.5rem', color: '#f0c860', letterSpacing: '.16em' }}>
            CHOOSE YOUR FATE
          </h1>
          <div className="mt-4 text-[#9a8860] leading-relaxed space-y-3" style={{ fontFamily: '"IM Fell English", serif', fontSize: '.95rem' }}>
            <p className="italic">
              Every story begins with a single person who does not yet know they are in a story. You are that person.
              The gods have already chosen the ending — they always do — but the path from here to there is
              yours to walk, or crawl, or be dragged along.
            </p>
            <p className="italic">
              Choose one hero. Just one. That is who you will be — completely, irrevocably, for better or worse
              or stranger than either. The shard has been waiting for someone exactly like you, which is to say,
              it has been waiting for anyone at all, and that is the most terrifying thing about it.
            </p>
            <p className="italic text-[#7a5f20]" style={{ fontSize: '.85rem' }}>
              The Dungeon Master will choose your companion and assemble the world around you.
              You will not agree with all of their choices. That is also part of the story.
            </p>
          </div>
        </div>

        {/* ── Status Message ─────────────────────────────────────────────── */}
        {statusMessage && (
          <div className="text-center mb-4">
            <p className="text-[#8a7040] text-sm italic">{statusMessage}</p>
          </div>
        )}

        {availableHeroes.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#c9a84c]" />
            <p className="text-[#5a4d30] mt-4">Summoning legendary heroes from across the mythos...</p>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* ── Hero Grid - Left Side ──────────────────────────────────── */}
            <div className="flex-1">
              {/* Filters */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-9 text-xs bg-[#110d07] border-[#3a3020] text-[#c9a84c]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1510] border-[#3a3020]">
                    <SelectItem value="all" className="text-xs text-[#c9a84c]">
                      All ({heroCount + demigodCount})
                    </SelectItem>
                    <SelectItem value="hero" className="text-xs text-[#c9a84c]">
                      ◆ Heroes ({heroCount})
                    </SelectItem>
                    <SelectItem value="demigod" className="text-xs text-[#c9a84c]">
                      ◈ Demigods ({demigodCount})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={pantheonFilter} onValueChange={setPantheonFilter}>
                  <SelectTrigger className="w-[160px] h-9 text-xs bg-[#110d07] border-[#3a3020] text-[#c9a84c]">
                    <SelectValue placeholder="All Pantheons" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1510] border-[#3a3020]">
                    <SelectItem value="all" className="text-xs text-[#c9a84c]">All Pantheons</SelectItem>
                    {pantheons.map(p => (
                      <SelectItem key={p} value={p} className="text-xs text-[#c9a84c]">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="text-[10px] text-[#5a4d30] self-center ml-auto">
                  Showing {filteredHeroes.length} of {availableHeroes.length}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {filteredHeroes.map(hero => {
                  const isSelected = selectedParty.includes(hero.id)
                  const isPreviewed = previewHero?.id === hero.id
                  return (
                    <Card
                      key={hero.id}
                      className={`cursor-pointer transition-all ${isSelected
                          ? 'bg-gradient-to-b from-[#2a2015] to-[#1a1510] border-2 border-[#d4af37] shadow-lg shadow-[rgba(212,175,55,0.3)]'
                          : isPreviewed
                            ? 'bg-gradient-to-b from-[#252015] to-[#1a1510] border-2 border-[#8a7a40]'
                            : 'bg-gradient-to-b from-[#1e1a14] to-[#151210] border border-[#4a4030] hover:border-[#d4af37]'
                        }`}
                      onMouseEnter={() => setPreviewHero(hero)}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedParty([])
                        } else {
                          setSelectedParty([hero.id])
                          setPreviewHero(hero)
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="w-full mx-auto mb-2 rounded border border-[#5a4018] bg-[#1a1510] overflow-hidden">
                          <Image
                            src={getEntityPortrait(hero)}
                            alt={hero.name}
                            width={192}
                            height={336}
                            className="w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                        
                        <div className="text-center mb-2">
                          <div className="font-bold text-[#d4af37] font-title text-base truncate">
                            {hero.name}
                          </div>
                          <div className="text-xs text-[#a08060] font-narrative">{hero.pantheon}</div>
                        </div>

                        <div className="flex justify-center gap-1 mb-2">
                          <Badge
                            style={{ backgroundColor: hero.type === 'hero' ? 'rgba(40,80,120,0.5)' : 'rgba(120,40,100,0.5)', color: hero.type === 'hero' ? '#70b0e0' : '#d080c0' }}
                            className="text-[10px]"
                          >
                            {hero.type === 'hero' ? '◆ Hero' : '◈ Demigod'}
                          </Badge>
                        </div>

                        <div className="text-xs space-y-1 font-narrative">
                          <div className="flex justify-between">
                            <span className="text-[#b08050]">HP</span>
                            <span className="text-[#f0e0c0] font-bold">{hero.hp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#b08050]">AC</span>
                            <span className="text-[#f0e0c0] font-bold">{hero.AC}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-2 text-center">
                            <Crown className="w-5 h-5 mx-auto text-[#d4af37]" />
                            <div className="text-[10px] text-[#d4af37] mt-1 font-title">YOUR FATE</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* ── Preview Panel - Right Side ──────────────────────────────── */}
            <div className="w-80 flex-shrink-0">
              <Card className="bg-[#110d07] border-[#3a3020] sticky top-4">
                {previewHero ? (
                  <>
                    <CardHeader className="p-4 bg-gradient-to-r from-[rgba(60,45,15,.5)] to-[rgba(30,25,15,.3)]">
                      <div className="text-center">
                        <div className="w-full mx-auto mb-3 rounded-lg border-2 border-[#5a4018] bg-gradient-to-b from-[#2a2015] to-[#1a1510] overflow-hidden shadow-lg">
                          <Image
                            src={getEntityPortrait(previewHero)}
                            alt={previewHero.name}
                            width={384}
                            height={672}
                            className="w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                        <CardTitle className="text-xl text-[#d4af37] font-title">
                          {previewHero.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-[#a08060]">
                          {previewHero.title || previewHero.epithet || previewHero.pantheon}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 text-sm space-y-3">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between p-1 bg-[#1a1510] rounded">
                          <span className="text-[#8a7040]">HP</span>
                          <span className="text-[#f0e0c0] font-bold">{previewHero.hp}</span>
                        </div>
                        <div className="flex justify-between p-1 bg-[#1a1510] rounded">
                          <span className="text-[#8a7040]">AC</span>
                          <span className="text-[#f0e0c0] font-bold">{previewHero.AC}</span>
                        </div>
                        <div className="flex justify-between p-1 bg-[#1a1510] rounded">
                          <span className="text-[#8a7040]">MR</span>
                          <span className="text-[#f0e0c0]">{previewHero.MR}{typeof previewHero.MR === 'number' ? '%' : ''}</span>
                        </div>
                        <div className="flex justify-between p-1 bg-[#1a1510] rounded">
                          <span className="text-[#8a7040]">Align</span>
                          <span style={{ color: aCol(previewHero.align) }} className="text-xs">{aShort(previewHero.align)}</span>
                        </div>
                      </div>

                      {/* Ability Scores */}
                      <div>
                        <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-1 font-title">Ability Scores</div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          {[
                            { abbr: 'STR', val: previewHero.str },
                            { abbr: 'DEX', val: previewHero.dex },
                            { abbr: 'CON', val: previewHero.con },
                            { abbr: 'INT', val: previewHero.int },
                            { abbr: 'WIS', val: previewHero.wis },
                            { abbr: 'CHA', val: previewHero.cha }
                          ].map(ability => (
                            <div key={ability.abbr} className="text-center p-1 bg-[#0d0a08] rounded">
                              <div className="text-[#c9a84c] font-bold text-[10px]">{ability.abbr}</div>
                              <div className="text-[#f0e0c0] font-bold">{ability.val || '-'}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {previewHero.level && (
                        <div className="text-xs">
                          <span className="text-[#8a7040]">Level: </span>
                          <span className="text-[#c9a84c]">{previewHero.level}</span>
                        </div>
                      )}

                      {previewHero.personality && (
                        <div>
                          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-1 font-title">Destiny</div>
                          <div className="text-xs text-[#a08060] italic line-clamp-4">
                            {previewHero.personality}
                          </div>
                        </div>
                      )}

                      {previewHero.abilities && previewHero.abilities.length > 0 && (
                        <div>
                          <div className="text-xs text-[#7a5f20] uppercase tracking-wider mb-1 font-title">Powers</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {previewHero.abilities.slice(0, 4).map((ability, idx) => (
                              <div key={idx} className="text-[10px] text-[#c9a84c] bg-[#1a1510] p-1 rounded border-l-2 border-[#5a4018]">
                                {ability.length > 50 ? ability.slice(0, 50) + '...' : ability}
                              </div>
                            ))}
                            {previewHero.abilities.length > 4 && (
                              <div className="text-[10px] text-[#5a4d30] italic">+{previewHero.abilities.length - 4} more...</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Select/Deselect Button */}
                      <Button
                        onClick={() => {
                          if (selectedParty.includes(previewHero.id)) {
                            setSelectedParty([])
                          } else {
                            setSelectedParty([previewHero.id])
                          }
                        }}
                        className={`w-full mt-2 ${selectedParty.includes(previewHero.id)
                            ? 'bg-[#5a3020] hover:bg-[#7a4030] text-[#e0a080]'
                            : 'bg-gradient-to-b from-[#4e3300] to-[#2b1800] hover:from-[#6e4800] hover:to-[#422600] text-[#f0c860]'
                          } border border-[#7a5f20]`}
                        style={{ fontFamily: 'Cinzel, serif' }}
                      >
                        {selectedParty.includes(previewHero.id) ? '✦ Release This Fate' : '✦ This Is My Fate'}
                      </Button>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-[#3a3020] flex items-center justify-center">
                      <Users className="w-10 h-10 text-[#3a3020]" />
                    </div>
                    <p className="text-[#5a4d30] italic mb-4" style={{ fontFamily: '"IM Fell English", serif' }}>
                      Hover over a hero to see their fate...
                    </p>
                    
                    {/* Party composition info */}
                    <div className="text-left space-y-2">
                      <div className="p-3 bg-[#1a1510] rounded border border-[#2e2008]">
                        <p className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                          ✦ Your Story
                        </p>
                        <div className="space-y-1.5 text-[10px]">
                          <div className="flex items-center gap-2">
                            <Crown className="w-3 h-3 text-[#d4af37]" />
                            <span className="text-[#c9a84c]">Main PC — You choose (always in story)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-[#7090c0]" />
                            <span className="text-[#7090c0]">Companion — DM chooses (70-100% in story)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-[#808080]" />
                            <span className="text-[#a08060]">3 Hero NPCs — DM RNG (random encounters)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3 text-[#a08060]" />
                            <span className="text-[#a08060]">3 Demigod NPCs — DM RNG (random encounters)</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-[#1a1510] rounded border border-[#2e2008]">
                        <p className="text-xs text-[#7a5f20] uppercase tracking-wider mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                          ✦ Prophecy System
                        </p>
                        <p className="text-[10px] text-[#8a7040] italic leading-relaxed">
                          Each hero carries a hidden destiny. The shard knows their fate — but they do not. When you choose, the prophecy chooses you.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── Bottom Bar ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center bg-[#110d07] border border-[#2e2008] rounded p-4 mt-4">
          <div>
            {selectedHero ? (
              <div>
                <span className="text-[#9a8860]">Your Fate: </span>
                <span className="text-[#f0c860] font-bold">{selectedHero.name}</span>
                <span className="text-[#5a4d30] ml-2 text-sm">
                  ({selectedHero.pantheon} · {selectedHero.type === 'hero' ? '◆ Hero' : '◈ Demigod'})
                </span>
              </div>
            ) : (
              <span className="text-[#5a4d30] italic">Choose one hero to begin...</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => { setGamePhase('intro'); setPreviewHero(null); setSelectedParty([]) }}
              variant="outline"
              className="border-[#5a4018] text-[#9a8860]"
            >
              Back
            </Button>
            <Button
              onClick={confirmPartySelection}
              disabled={selectedParty.length !== 1}
              className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] hover:from-[#6e4800] hover:to-[#422600] text-[#f0c860] border border-[#7a5f20]"
              style={{ fontFamily: 'Cinzel, serif', letterSpacing: '.1em' }}
            >
              ⚔ The Shard Awakens ⚔
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
