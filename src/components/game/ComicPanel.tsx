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
  if (!panels || panels.length === 0) return null;

  const gridClass = panels.length <= 2
    ? 'comic-grid comic-grid-2'
    : panels.length === 3
      ? 'comic-grid comic-grid-3'
      : 'comic-grid comic-grid-4';

  return (
    <div className={gridClass}>
      {panels.map((panel) => (
        <div key={panel.id} className="comic-panel">
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
          ) : panel.imageUrl ? (
            <img src={panel.imageUrl} alt={panel.caption} loading="lazy" />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-3"
              style={{
                background:
                  'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.2), transparent 45%), linear-gradient(160deg, #1a1510, #0d0a08)',
              }}
            >
              <span className="text-[0.7rem] text-[var(--text-secondary)]">Scene illustration loading...</span>
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
  );
}
