export interface ComicPanelData {
  id: string;
  imageUrl?: string;
  caption: string;
  speechBubble?: string;
  isGenerating?: boolean;
  error?: string;
}

export interface ComicGeneratorOptions {
  artStyle?: 'larry-elmore' | 'classic-comic' | 'manga' | 'watercolor';
  maxPanels?: number;
}

const STYLE_PROMPTS: Record<string, string> = {
  'larry-elmore': 'in the style of Larry Elmore, fantasy oil painting, Dragonlance aesthetic, dramatic lighting, rich colors, detailed armor and landscapes',
  'classic-comic': 'in the style of classic comic book art, bold ink lines, cel shading, dynamic poses, vivid colors',
  'manga': 'in the style of manga, clean lines, expressive eyes, dynamic angles, black and white with gray tones',
  'watercolor': 'in the style of watercolor painting, soft edges, muted fantasy palette, ethereal atmosphere',
};

export function determinePanelCount(narration: string, isCombat: boolean): number {
  if (isCombat) return Math.min(4, 2 + Math.floor(Math.random() * 2));
  if (narration.length > 800) return 3 + Math.floor(Math.random() * 2);
  if (narration.length > 400) return 2 + Math.floor(Math.random() * 2);
  return 2;
}

export function extractSpeechBubble(narration: string): string {
  const match = narration.match(/["\u201C]([^"\u201D]{10,80})["\u201D]/);
  return match ? match[1] : '';
}

export function buildPanelCaption(narration: string, index: number, total: number): string {
  const sentences = narration.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const segmentSize = Math.ceil(sentences.length / total);
  const start = index * segmentSize;
  const segment = sentences.slice(start, start + segmentSize).join('. ').trim();
  return segment.length > 100 ? segment.slice(0, 97) + '...' : segment;
}

export function buildImagePrompt(narration: string, caption: string, artStyle: string): string {
  const stylePrompt = STYLE_PROMPTS[artStyle] || STYLE_PROMPTS['larry-elmore'];
  const combined = (caption || narration).slice(0, 200);
  return stylePrompt + ', ' + combined + ', no text, no speech bubbles in image, no UI elements';
}

export async function generateComicPanels(
  narration: string,
  isCombat: boolean,
  options: ComicGeneratorOptions = {}
): Promise<ComicPanelData[]> {
  const { artStyle = 'larry-elmore', maxPanels = 4 } = options;
  const panelCount = Math.min(determinePanelCount(narration, isCombat), maxPanels);
  const speechBubble = extractSpeechBubble(narration);
  const panels: ComicPanelData[] = [];

  for (let i = 0; i < panelCount; i++) {
    const caption = buildPanelCaption(narration, i, panelCount);
    panels.push({
      id: 'panel-' + Date.now() + '-' + i,
      caption,
      speechBubble: i === 0 ? speechBubble : '',
      isGenerating: true,
    });
  }

  return panels;
}

export async function generatePanelImage(
  panel: ComicPanelData,
  narration: string,
  artStyle: string
): Promise<ComicPanelData> {
  const prompt = buildImagePrompt(narration, panel.caption, artStyle);
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, artStyle }),
    });
    if (!res.ok) return { ...panel, isGenerating: false, error: 'generate-failed' };
    const data = await res.json();
    return { ...panel, imageUrl: data.imageUrl, isGenerating: false };
  } catch {
    return { ...panel, isGenerating: false, error: 'network-error' };
  }
}
