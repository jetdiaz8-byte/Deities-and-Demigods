'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Package, Save, Trash2, Sparkles, Shield, Swords, Heart } from 'lucide-react'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
import { useEquipmentTooltip } from '@/components/game/EquipmentTooltip'
import type { GameState, SaveSlot, Item } from '@/lib/gameTypes'

export interface GameDialogsProps {
  // Save dialog
  showSaveDialog: boolean
  setShowSaveDialog: (open: boolean) => void
  saveSlots: SaveSlot[]
  saveGame: (slotId: string, name: string) => void
  // Load dialog
  showLoadDialog: boolean
  setShowLoadDialog: (open: boolean) => void
  loadGame: (slotId: string) => void
  deleteSave: (slotId: string) => void
  // Inventory dialog
  showInventoryDialog: boolean
  setShowInventoryDialog: (open: boolean) => void
  handleUseItem: (item: Item) => void
  // Shard dialog
  shardDialogOpen: boolean
  setShardDialogOpen: (open: boolean) => void
  shardSummonName: string
  setShardSummonName: (name: string) => void
  invokeShard: () => void
  // Portrait modal
  portraitModalOpen: boolean
  setPortraitModalOpen: (open: boolean) => void
  selectedPortrait: CharacterPortrait | null
  setSelectedPortrait: (portrait: CharacterPortrait | null) => void
  // Game state needed by dialogs
  gameState: GameState
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE SLOT THUMBNAIL — Rich preview card for save slots
// ═══════════════════════════════════════════════════════════════════════════

function SaveSlotThumbnail({ slot, children, interactive = false }: {
  slot: SaveSlot
  children: React.ReactNode
  interactive?: boolean
}) {
  const actConfig: Record<string, { label: string; color: string; bg: string }> = {
    act1: { label: 'I', color: '#4a9060', bg: 'rgba(74,144,96,0.12)' },
    act2: { label: 'II', color: '#d4af37', bg: 'rgba(212,175,55,0.12)' },
    act3: { label: 'III', color: '#e05050', bg: 'rgba(224,80,80,0.12)' },
  }
  const act = actConfig[slot.act] || actConfig.act1

  return (
    <div
      className={`relative p-3 sm:p-4 bg-[#181208] border border-[#2e2008] rounded-lg transition-all duration-200
        ${interactive ? 'hover:border-[#d4af37]/60 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer' : ''}
      `}
    >
      {/* Turn number badge + Act indicator */}
      <div className="flex items-center gap-2 mb-2">
        <Badge
          className="text-[11px] font-bold px-2 py-0.5"
          style={{ background: '#2a2015', color: '#d4af37', border: '1px solid #5a4018' }}
        >
          T{slot.turn}
        </Badge>
        <div
          className="text-[11px] font-bold px-2 py-0.5 rounded"
          style={{ background: act.bg, color: act.color, border: `1px solid ${act.color}33` }}
        >
          Act {act.label}
        </div>
        {slot.totalGold !== undefined && (
          <div className="ml-auto text-[11px] text-[#d4af37] font-title flex items-center gap-1">
            <span className="text-xs">🪙</span> {slot.totalGold}
          </div>
        )}
      </div>

      {/* Party members with alive/dead status */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {slot.partyNames.map((name, idx) => {
          const isAlive = slot.partyAlive?.[idx] !== false
          return (
            <div
              key={idx}
              className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded"
              style={{
                background: isAlive ? 'rgba(74,144,96,0.1)' : 'rgba(200,60,60,0.1)',
                border: `1px solid ${isAlive ? 'rgba(74,144,96,0.2)' : 'rgba(200,60,60,0.2)'}`,
                color: isAlive ? '#6ab07a' : '#c07070',
              }}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAlive ? 'bg-green-500' : 'bg-red-500'}`} />
              {name.length > 14 ? name.slice(0, 14) + '...' : name}
              {!isAlive && <span className="text-red-400 ml-0.5">✗</span>}
            </div>
          )
        })}
      </div>

      {/* Last narration snippet */}
      {slot.lastNarration && (
        <div className="text-[11px] text-[#9a8860] italic leading-relaxed mb-3 line-clamp-2" style={{ fontFamily: 'var(--font-dialogue)' }}>
          &ldquo;{slot.lastNarration}&rdquo;
        </div>
      )}

      {/* Date + actions */}
      <div className="flex items-center justify-between mt-1">
        <div className="text-[11px] text-[#5a4d30]">
          {new Date(slot.timestamp).toLocaleDateString()} · {new Date(slot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY SLOT — Placeholder for unused save slots
// ═══════════════════════════════════════════════════════════════════════════

function EmptySaveSlot({ index, onSave }: { index: number; onSave: () => void }) {
  return (
    <div className="relative p-4 bg-[#181208] border border-dashed border-[#2e2008] rounded-lg transition-all duration-200 hover:border-[#d4af37]/40">
      <div className="text-center">
        <div className="text-2xl text-[#2e2008] mb-1">📜</div>
        <div className="text-xs text-[#5a4d30]">Slot {index + 1} — Empty</div>
      </div>
      <div className="flex justify-center mt-2">
        <Button
          onClick={onSave}
          size="sm"
          className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860] text-xs"
        >
          <Save className="w-3 h-3 mr-1" /> Save
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY ITEM ROW — with tooltip support
// ═══════════════════════════════════════════════════════════════════════════

function InventoryItemRow({ item, onUse, disabled }: { item: Item; onUse: () => void; disabled: boolean }) {
  const { showTooltip, hideTooltip } = useEquipmentTooltip()

  const rarityColors: Record<string, string> = {
    common: '#9a8860',
    uncommon: '#4a9060',
    rare: '#5a9fd4',
    legendary: '#e8b040',
  }

  const typeIcons: Record<string, string> = {
    equipment: '⚔️',
    potion: '🧪',
    scroll: '📜',
    artifact: '✨',
  }

  const rarityBorder: Record<string, string> = {
    common: '#3a3020',
    uncommon: '#2a5030',
    rare: '#2a3050',
    legendary: '#504020',
  }

  return (
    <div
      className="flex items-start justify-between p-2 bg-[#181208] rounded transition-all duration-200"
      style={{ borderLeft: `3px solid ${rarityBorder[item.rarity] || '#3a3020'}` }}
    >
      <div className="flex gap-2 flex-1 min-w-0">
        <span className="text-xl flex-shrink-0">{item.icon}</span>
        <div className="min-w-0">
          <button
            className="text-sm text-left hover:underline decoration-dotted underline-offset-2 cursor-help transition-all"
            style={{ color: rarityColors[item.rarity] || '#9a8860' }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              showTooltip(item, rect)
            }}
            onMouseLeave={hideTooltip}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              showTooltip(item, rect)
              setTimeout(hideTooltip, 3000)
            }}
          >
            {item.name}
          </button>
          <div className="text-[11px] text-[#5a4d30] flex items-center gap-1">
            <span>{typeIcons[item.type] || '📦'}</span>
            <span>{item.type}</span>
            <span className="mx-0.5">·</span>
            <span style={{ color: rarityColors[item.rarity] || '#9a8860' }}>{item.rarity}</span>
          </div>
          <div className="text-xs text-[#9a8860] italic mt-0.5" style={{ fontFamily: 'var(--font-dialogue)' }}>
            {item.description}
          </div>
          {item.charges && item.charges < 99 && (
            <div className="text-xs text-[#c9a84c] mt-0.5">
              ⚡ Charges: {item.charges}/{item.maxCharges}
            </div>
          )}
        </div>
      </div>
      <Button
        onClick={onUse}
        size="sm"
        disabled={disabled}
        className="bg-gradient-to-b from-[#362200] to-[#1e1100] text-[#f0c860] flex-shrink-0 ml-2"
      >
        Use
      </Button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME DIALOGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GameDialogs({
  showSaveDialog,
  setShowSaveDialog,
  saveSlots,
  saveGame,
  showLoadDialog,
  setShowLoadDialog,
  loadGame,
  deleteSave,
  showInventoryDialog,
  setShowInventoryDialog,
  handleUseItem,
  shardDialogOpen,
  setShardDialogOpen,
  shardSummonName,
  setShardSummonName,
  invokeShard,
  portraitModalOpen,
  setPortraitModalOpen,
  selectedPortrait,
  setSelectedPortrait,
  gameState,
}: GameDialogsProps) {
  // Helper to build save data with thumbnails
  const buildSaveData = useCallback((existing: SaveSlot | undefined, slotId: string) => {
    const partyNames = gameState.pcs.map(p => p.name.replace(/\s*\([^)]*\)/g, ''))
    const partyAlive = gameState.pcs.map(p => !p.dead)
    // Get last narration from log
    const narrativeEntries = gameState.log.filter(l => !l.msg.startsWith('__'))
    const lastNarration = narrativeEntries.length > 0
      ? narrativeEntries[narrativeEntries.length - 1].msg.slice(0, 100)
      : undefined

    return {
      ...existing,
      id: slotId,
      name: existing?.name || `Save ${parseInt(slotId.split('_')[1]) + 1}`,
      timestamp: Date.now(),
      turn: gameState.turn,
      act: gameState.act,
      partyNames,
      partyAlive,
      lastNarration,
      totalGold: gameState.partyGold,
    }
  }, [gameState])

  return (
    <>
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'var(--font-heading)' }}>Save Campaign</DialogTitle>
            <DialogDescription className="text-[#9a8860]">Choose a slot to preserve your legend</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto scroll-parchment">
            {[0, 1, 2, 3, 4].map(i => {
              const existing = saveSlots.find(s => s.id === `slot_${i}`)
              return existing ? (
                <SaveSlotThumbnail key={i} slot={existing} interactive>
                  <Button
                    onClick={() => saveGame(`slot_${i}`, buildSaveData(existing, `slot_${i}`).name)}
                    size="sm"
                    className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860] text-[11px] px-2"
                  >
                    Overwrite
                  </Button>
                </SaveSlotThumbnail>
              ) : (
                <EmptySaveSlot
                  key={i}
                  index={i}
                  onSave={() => saveGame(`slot_${i}`, `Save ${i + 1}`)}
                />
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'var(--font-heading)' }}>Load Campaign</DialogTitle>
            <DialogDescription className="text-[#9a8860]">Select a saved chronicle to continue</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto scroll-parchment">
            {saveSlots.length === 0 ? (
              <p className="text-[#5a4d30] italic p-6 text-center col-span-full">No saved games found</p>
            ) : (
              saveSlots.map(slot => (
                <SaveSlotThumbnail key={slot.id} slot={slot} interactive>
                  <div className="flex gap-1">
                    <Button onClick={() => loadGame(slot.id)} size="sm" className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860] text-[11px] px-2">Load</Button>
                    <Button onClick={() => deleteSave(slot.id)} size="sm" variant="destructive" className="text-[11px] px-2"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </SaveSlotThumbnail>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'var(--font-heading)' }}>
              <Package className="w-5 h-5 inline mr-2" />
              Party Inventory
            </DialogTitle>
            <DialogDescription className="text-[#9a8860]">
              🪙 {gameState.partyGold} Gold · {gameState.inventory.length} Items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto scroll-parchment">
            {gameState.inventory.length === 0 ? (
              <p className="text-[#5a4d30] italic p-4 text-center">No items in inventory</p>
            ) : (
              gameState.inventory.map(item => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onUse={() => handleUseItem(item)}
                  disabled={gameState.waitingForHuman || gameState.isProcessing}
                />
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* v2.19.0: Shard Insight Dialog — Ask the Tear */}
      <Dialog open={shardDialogOpen} onOpenChange={setShardDialogOpen}>
        <DialogContent className="bg-[#0d0810] border-[#5a3898]" style={{ borderColor: gameState.shardEntry?.color || '#8060c0' }}>
          <DialogHeader>
            <DialogTitle className="text-[#c0a0f0]" style={{ fontFamily: 'var(--font-title)', color: gameState.shardEntry?.color || '#c080ff' }}>
              🔮 Ask the Tear
            </DialogTitle>
            <DialogDescription className="text-[#7a6090]">
              {gameState.shardInsightUsed
                ? 'The Tear has spoken. It will not speak again.'
                : gameState.shardCharges > 0
                  ? `1 Insight charge available — ${gameState.shardCharges} total charge${gameState.shardCharges !== 1 ? 's' : ''} remain`
                  : 'No charges remaining.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#9080a0] italic">{gameState.shardEntry?.origin}</p>
            <div className="text-xs text-[#6a5080] space-y-1">
              <div className="flex items-center gap-2">
                <span>{gameState.shardInsightUsed ? '⚫' : '🔮'}</span>
                <span>Insight — Ask the shard a question about the world</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{gameState.shardShieldUsed ? '⚫' : '🔮'}</span>
                <span>Shield — Auto death-prevention (the shard protects its bearer)</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{gameState.shardFinalWordUsed ? '⚫' : '🔮'}</span>
                <span>Final Word — The shard&apos;s last prophecy (Act III)</span>
              </div>
            </div>
            {!gameState.shardInsightUsed && gameState.shardCharges > 0 && (
              <>
                <Input
                  placeholder="What do you ask the shard? (Leave empty for a general vision...)"
                  value={shardSummonName}
                  onChange={e => setShardSummonName(e.target.value)}
                  className="bg-[#0a0612] border-[#4a2878] text-[#d0c0e8] placeholder:text-[#5a4070]"
                  onKeyDown={e => e.key === 'Enter' && invokeShard()}
                />
                <p className="text-[11px] text-[#5a4070] italic">
                  The shard remembers everything. It has seen worlds end. But it doesn&apos;t always tell you what you wanted to hear.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShardDialogOpen(false)} variant="outline" className="border-[#4a2878] text-[#7a6090]">Close</Button>
            {!gameState.shardInsightUsed && gameState.shardCharges > 0 && (
              <Button onClick={invokeShard} className="bg-gradient-to-b from-[#3a1870] to-[#200a40] text-[#c0a0f0]" style={{ borderColor: gameState.shardEntry?.color || '#8060c0' }}>
                🔮 Ask
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portrait Modal — navigate through party PCs */}
      {(() => {
        const browsePCs = gameState.pcs
        const currentIdx = browsePCs.findIndex(p => p.id === selectedPortrait?.id)
        return (
          <PortraitModal
            character={selectedPortrait}
            isOpen={portraitModalOpen}
            onClose={() => {
              setPortraitModalOpen(false)
              setSelectedPortrait(null)
            }}
            showFullCard={true}
            onNext={browsePCs.length > 1 ? () => {
              const next = (currentIdx + 1) % browsePCs.length
              setSelectedPortrait(browsePCs[next] as CharacterPortrait)
            } : undefined}
            onPrev={browsePCs.length > 1 ? () => {
              const prev = (currentIdx - 1 + browsePCs.length) % browsePCs.length
              setSelectedPortrait(browsePCs[prev] as CharacterPortrait)
            } : undefined}
            hasNext={browsePCs.length > 1}
            hasPrev={browsePCs.length > 1}
          />
        )
      })()}
    </>
  )
}
