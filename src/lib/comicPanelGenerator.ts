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
  const stylePrompt = STYLE_PROMPTS[artStyle] || STYLE_PROMPTS['larry-elmore']
  const source = `${caption || ''} ${narration || ''}`.toLowerCase()
  let sceneSeed = 'fantasy landscape, dramatic sky, mysterious atmosphere'
  if (/\bocean|water|sea|ship|harbor|wave|cliff|coast\b/.test(source)) sceneSeed = 'ship, waves, sea cliff, stormy horizon'
  else if (/\bforest|trees|woods|grove|ruin|runes\b/.test(source)) sceneSeed = 'enchanted forest, ancient ruins, glowing runes'
  else if (/\bdungeon|cave|underground|catacomb|crypt|torch|corridor\b/.test(source)) sceneSeed = 'stone corridors, torches, shadows'
  else if (/\bcity|town|village|market|street|tavern\b/.test(source)) sceneSeed = 'medieval town, marketplace, tavern'
  else if (/\bcombat|fight|battle|attack|duel|war\b/.test(source)) sceneSeed = 'battlefield, dramatic action, weapons'
  else if (/\btower|castle|fortress|keep|citadel\b/.test(source)) sceneSeed = 'medieval fortress, spires, banners'
  const candidates = (caption || narration)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => w.length > 4)
    .filter(w => !['there', 'their', 'about', 'after', 'before', 'which', 'while', 'where'].includes(w))
  const unique = Array.from(new Set(candidates)).slice(0, 5)
  const keywords = unique.length ? unique.join(', ') : sceneSeed
  return `dark fantasy ${keywords}, ${sceneSeed}, dramatic lighting, oil painting style, D&D illustration, atmospheric, ${stylePrompt}, no text`
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
  artStyle: string,
  turnNumber: number
): Promise<ComicPanelData> {
  const placeholderImage = (() => {
    const safeCaption = (panel.caption || 'Scene illustration loading...').replace(/[<>&]/g, '').slice(0, 80)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1510"/>
          <stop offset="100%" stop-color="#0d0a08"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="150" cy="120" r="120" fill="rgba(212,175,55,0.16)"/>
      <text x="400" y="292" text-anchor="middle" fill="#c9a84c" font-size="28" font-family="Georgia">Scene illustration loading...</text>
      <text x="400" y="330" text-anchor="middle" fill="#8a7a60" font-size="18" font-family="Georgia">${safeCaption}</text>
    </svg>`
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  })()

  const prompt = buildImagePrompt(narration, panel.caption, artStyle);
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${turnNumber}`
    return { ...panel, imageUrl: url || placeholderImage, isGenerating: false };
  } catch {
    return { ...panel, imageUrl: placeholderImage, isGenerating: false, error: 'network-error' };
  }
}
