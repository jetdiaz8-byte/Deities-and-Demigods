"use client";

import { motion } from "framer-motion";
import { Flame, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl content-center gap-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-3 border border-[var(--border-gold)] bg-black/30 px-4 py-2 text-sm uppercase tracking-[0.28em] text-[var(--text-gold)]">
            <Flame size={16} /> Dark Fantasy Grimoire
          </div>
          <h1 className="font-title text-5xl font-bold leading-tight text-[var(--text-ivory)] md:text-7xl">Deities and Demigods</h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-[var(--text-parchment)]">
            A mythic AI Dungeon Master waits behind the page. Choose a hero, wake a shard, gather legends, and stand before gods that remember when the world was young.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button onClick={onBegin} className="px-6 py-3 text-base">
              <ScrollText size={18} /> Begin Your Legend
            </Button>
          </div>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-3">
          {["The shard wakes first.", "The companion is chosen by fate.", "The final question cannot be fought."].map((line) => (
            <div key={line} className="grimoire-panel p-5 text-lg text-[var(--text-parchment)]">{line}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
