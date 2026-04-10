'use client';

import React from 'react';

interface ComicPanelData {
  id: string;
  imageUrl?: string;
  caption: string;
  speechBubble?: string;
  isGenerating?: boolean;
  error?: string;
}

interface ComicPanelProps {
  panels: ComicPanelData[];
  artStyle?: string;
}

export default function ComicPanel({ panels, artStyle = 'larry-elmore' }: ComicPanelProps) {
  const [expanded, setExpanded] = React.useState<ComicPanelData | null>(null)
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({})
  if (!panels || panels.length === 0) return null;

  const gridClass = panels.length <= 2
    ? 'comic-grid comic-grid-2'
    : panels.length === 3
      ? 'comic-grid comic-grid-3'
      : 'comic-grid comic-grid-4';

  return (
    <>
    <div className={gridClass}>
      {panels.map((panel) => (
        <div key={panel.id} className="comic-panel border border-[#7a5f20] shadow-[0_0_0_1px_rgba(212,175,55,0.2)_inset]">
          <div className="absolute top-0 left-0 right-0 z-10 px-2 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-[#e4c873] bg-[linear-gradient(180deg,rgba(12,9,6,0.9),rgba(12,9,6,0.1))]">
            Fantasy Scene
          </div>
          {panel.isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)]">
              <div className="spinner" />
              <span className="text-[0.625rem] text-[var(--text-muted)]">
                {artStyle === 'larry-elmore' ? 'Painting...' :
                 artStyle === 'manga' ? 'Drawing...' :
                 artStyle === 'watercolor' ? 'Washing...' : 'Rendering...'}
              </span>
            </div>
          ) : panel.error ? (
            <div className="absolute inset-0 flex items-center justify-center p-2 bg-[var(--bg-secondary)]">
              <span className="text-[0.625rem] text-[var(--text-muted)] text-center">✦</span>
            </div>
          ) : panel.imageUrl && !imageErrors[panel.id] ? (
            <img
              src={panel.imageUrl}
              alt={panel.caption}
              loading="lazy"
              className="cursor-zoom-in"
              onClick={() => setExpanded(panel)}
              onError={() => setImageErrors(prev => ({ ...prev, [panel.id]: true }))}
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-3"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.2), transparent 45%), linear-gradient(160deg, #1a1510, #0d0a08)',
              }}
            >
              <span className="text-[0.7rem] text-[var(--text-secondary)]">Scene illustration</span>
              <span className="text-[0.58rem] text-[var(--text-muted)] mt-1">Fallback art is shown if generation is unavailable</span>
            </div>
          )}
          {panel.speechBubble && !panel.isGenerating && (
            <div className="speech-bubble">{panel.speechBubble}</div>
          )}
          {panel.caption && !panel.isGenerating && (
            <div className="caption">{panel.caption}</div>
          )}
        </div>
      ))}
    </div>
    {expanded && (
      <div className="fixed inset-0 z-[220] bg-black/90 p-4 flex items-center justify-center" onClick={() => setExpanded(null)}>
        <button
          onClick={() => setExpanded(null)}
          className="absolute top-4 right-4 px-3 py-1 rounded bg-black/60 border border-[#7a5f20] text-[#e4c873]"
        >
          Close
        </button>
        <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-lg border border-[#7a5f20] bg-[#0e0a06]" onClick={(e) => e.stopPropagation()}>
          <img src={expanded.imageUrl} alt={expanded.caption} className="w-full h-full object-contain" />
        </div>
      </div>
    )}
    </>
  );
}
