"use client";

import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";

export function NarrativePanel({ narration, loading }: { narration: string; loading: boolean }) {
  return (
    <Card className="min-h-[28rem] p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border-leather)] pb-3">
        <h2 className="font-title text-2xl text-[var(--text-ivory)]">The Living Page</h2>
        {loading && <span className="text-sm text-[var(--text-gold)]">The DM is turning a page...</span>}
      </div>
      <div className="scroll-text prose prose-invert max-w-none text-xl">
        <ReactMarkdown>{narration}</ReactMarkdown>
      </div>
    </Card>
  );
}
