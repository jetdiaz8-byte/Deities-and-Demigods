'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Package, Save, Trash2, Sparkles } from 'lucide-react'
import { PortraitModal, CharacterPortrait } from '@/components/game/PortraitModal'
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
  return (
    <>
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018]">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'Cinzel, serif' }}>Save Campaign</DialogTitle>
            <DialogDescription className="text-[#9a8860]">Choose a slot to save your progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map(i => {
              const existing = saveSlots.find(s => s.id === `slot_${i}`)
              return (
                <div key={i} className="flex items-center justify-between p-2 bg-[#181208] border border-[#2e2008] rounded">
                  <div>
                    <div className="text-sm text-[#c9a84c]">Slot {i + 1}</div>
                    {existing && (
                      <div className="text-xs text-[#5a4d30]">
                        {existing.name} · Turn {existing.turn} · {new Date(existing.timestamp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => saveGame(`slot_${i}`, existing?.name || `Save ${i + 1}`)}
                    size="sm"
                    className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860]"
                  >
                    {existing ? 'Overwrite' : 'Save'}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018]">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'Cinzel, serif' }}>Load Campaign</DialogTitle>
            <DialogDescription className="text-[#9a8860]">Select a saved game to continue</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {saveSlots.length === 0 ? (
              <p className="text-[#5a4d30] italic p-4 text-center">No saved games found</p>
            ) : (
              saveSlots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-2 bg-[#181208] border border-[#2e2008] rounded">
                  <div>
                    <div className="text-sm text-[#c9a84c]">{slot.name}</div>
                    <div className="text-xs text-[#5a4d30]">
                      Turn {slot.turn} · {slot.act === 'act1' ? 'Act I' : slot.act === 'act2' ? 'Act II' : 'Final Boss'} · {new Date(slot.timestamp).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-[#5a4d30]">{slot.partyNames.join(', ')}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => loadGame(slot.id)} size="sm" className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860]">Load</Button>
                    <Button onClick={() => deleteSave(slot.id)} size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent className="bg-[#110d07] border-[#5a4018] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: 'Cinzel, serif' }}>
              <Package className="w-5 h-5 inline mr-2" />
              Party Inventory
            </DialogTitle>
            <DialogDescription className="text-[#9a8860]">
              {gameState.partyGold} Gold · {gameState.inventory.length} Items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gameState.inventory.length === 0 ? (
              <p className="text-[#5a4d30] italic p-4 text-center">No items in inventory</p>
            ) : (
              gameState.inventory.map(item => {
                const rarityColors: { [key: string]: string } = {
                  common: '#9a8860',
                  uncommon: '#4a9060',
                  rare: '#5a9fd4',
                  legendary: '#e8b040'
                }
                return (
                  <div key={item.id} className="flex items-start justify-between p-2 bg-[#181208] border border-[#2e2008] rounded">
                    <div className="flex gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-sm" style={{ color: rarityColors[item.rarity] || '#9a8860' }}>{item.name}</div>
                        <div className="text-xs text-[#5a4d30]">{item.type} · {item.rarity}</div>
                        <div className="text-xs text-[#9a8860] italic">{item.description}</div>
                        {item.charges && item.charges < 99 && (
                          <div className="text-xs text-[#c9a84c]">Charges: {item.charges}/{item.maxCharges}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUseItem(item)}
                      size="sm"
                      disabled={gameState.waitingForHuman || gameState.isProcessing}
                      className="bg-gradient-to-b from-[#362200] to-[#1e1100] text-[#f0c860]"
                    >
                      Use
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shard Summon Dialog */}
      <Dialog open={shardDialogOpen} onOpenChange={setShardDialogOpen}>
        <DialogContent className="bg-[#110d07] border-[#5a4018]" style={{ borderColor: gameState.shardEntry?.color }}>
          <DialogHeader>
            <DialogTitle className="text-[#f0c860]" style={{ fontFamily: '"Cinzel Decorative", serif', color: gameState.shardEntry?.color }}>
              <Sparkles className="w-5 h-5 inline mr-2" />
              {gameState.shardEntry?.name}
            </DialogTitle>
            <DialogDescription className="text-[#9a8860]">
              {gameState.shardCharges} charge{gameState.shardCharges !== 1 ? 's' : ''} remaining
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#9a8860] italic">{gameState.shardEntry?.origin}</p>
            <div className="text-xs text-[#5a4d30]">
              {gameState.shardCharges === 2
                ? 'Spend 1 charge: summon a Lesser God. Spend 2 charges: summon a Greater God.'
                : 'Last charge — summon one final entity.'}
            </div>
            {gameState.shardSummoned.length > 0 && (
              <div className="text-xs text-[#5a4d30]">
                Already summoned: {gameState.shardSummoned.join(', ')}
              </div>
            )}
            <Input
              placeholder="Enter the name of a god to summon..."
              value={shardSummonName}
              onChange={e => setShardSummonName(e.target.value)}
              className="bg-[#181208] border-[#5a4018] text-[#e8d9b0]"
              onKeyDown={e => e.key === 'Enter' && invokeShard()}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setShardDialogOpen(false)} variant="outline" className="border-[#5a4018] text-[#9a8860]">Cancel</Button>
            <Button onClick={invokeShard} className="bg-gradient-to-b from-[#4e3300] to-[#2b1800] text-[#f0c860]" style={{ borderColor: gameState.shardEntry?.color }}>
              Invoke Shard
            </Button>
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
