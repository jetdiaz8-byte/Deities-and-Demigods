'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GameState } from '@/lib/gameTypes'

interface DeathScreenProps {
  gameState: GameState
  visible: boolean
  onDismiss: () => void
}

export function DeathScreen({ gameState, visible, onDismiss }: DeathScreenProps) {
  if (!visible) return null

  const deadPC = gameState.pcs.find(p => p.dead && p.id === gameState.humanPCId)
  if (!deadPC) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={onDismiss}
      >
        {/* Dark overlay with red tint */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, rgba(40,0,0,0.9) 0%, rgba(0,0,0,0.95) 100%)',
        }} />

        {/* Shattered portrait effect */}
        <motion.div
          initial={{ scale: 1, rotateY: 0 }}
          animate={{ scale: 0.8, rotateY: 15 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="relative z-10 text-center"
        >
          {/* Grim reaper / skull */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-6xl mb-4"
          >
            💀
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-3xl font-title text-red-500 tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-title)', textShadow: '0 0 20px rgba(200,0,0,0.5)' }}
          >
            FALLEN
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <p className="text-xl font-name text-[#8b2635] mb-4">
              {deadPC.name}
            </p>
            <p className="text-sm text-[#5a4040] italic font-narrative max-w-md mx-auto">
              The prophecy remains unfulfilled... but the shard will find another bearer.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="mt-8"
          >
            <span className="text-xs text-[#5a4040] font-title uppercase tracking-widest">
              Click to continue
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
