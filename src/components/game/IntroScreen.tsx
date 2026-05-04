"use client";

import { motion } from "framer-motion";
import { Flame, ScrollText, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntroScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="mythic-backdrop relative min-h-screen overflow-hidden px-5 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl content-end gap-8 pb-6 pt-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-5xl">
          <div className="rune-divider mb-5 max-w-3xl text-xs">
            <Flame size={16} /> The old gods are awake
          </div>
          <h1 className="font-title max-w-4xl text-5xl font-bold leading-none text-[var(--text-ivory)] [text-shadow:0_5px_22px_#000] md:text-8xl">
            Deities and Demigods
          </h1>
          <p className="mt-6 max-w-2xl text-2xl leading-9 text-[var(--text-parchment)] [text-shadow:0_2px_8px_#000]">
            The world has cracked like an altar stone. Choose a legend, wake the shard, and walk into a story large enough to frighten gods.
          </p>
          <Button onClick={onBegin} className="mt-9 px-7 py-4 text-base">
            <Swords size={19} /> Begin Your Legend
          </Button>
        </motion.div>
        <div className="grid gap-3 md:grid-cols-3">
          {["The shard wakes first", "Fate chooses your companion", "The final question cannot be fought"].map((line) => (
            <div key={line} className="fantasy-card border border-[var(--border-gold)] p-5 text-lg text-[var(--text-ivory)] shadow-[0_18px_38px_rgba(0,0,0,.45)]">
              <ScrollText className="mb-3 text-[var(--text-gold)]" size={18} />
              {line}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
