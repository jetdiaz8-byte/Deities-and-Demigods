"use client";

import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";

export function NarrativePanel({ narration, loading }: { narration: string; loading: boolean }) {
  return (
    <Card className="parchment-scroll min-h-[30rem] p-6 md:p-9">
      <div className="rune-divider mb-5 text-xs">
        <h2 className="font-title text-xl text-[var(--text-ivory)] md:text-2xl">The Living Page</h2>
      </div>
      {loading && <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[var(--text-gold)]">The DM is turning a page...</p>}
      <div className="scroll-text prose prose-invert max-w-none text-xl [text-shadow:0_1px_2px_rgba(0,0,0,.75)] first-letter:font-title first-letter:text-6xl first-letter:text-[var(--text-gold)]">
        <ReactMarkdown>{narration}</ReactMarkdown>
      </div>
    </Card>
  );
}
