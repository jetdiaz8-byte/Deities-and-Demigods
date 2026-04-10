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
  const source = `${caption || ''} ${narration || ''}`.toLowerCase();
  let sceneSeed = 'fantasy landscape with dramatic sky';
  if (/\bocean|sea|ship|harbor|wave|cliff|coast\b/.test(source)) sceneSeed = 'stormy ocean, ship, sea cliff';
  else if (/\bforest|grove|woods|tree|ruin|runes\b/.test(source)) sceneSeed = 'enchanted forest, ancient ruins';
  else if (/\bdungeon|catacomb|crypt|torch|corridor|cavern\b/.test(source)) sceneSeed = 'dungeon stone corridors, torchlight';
  else if (/\bcity|town|market|street|castle gate|village\b/.test(source)) sceneSeed = 'medieval town marketplace';
  else if (/\bcombat|battle|attack|blood|duel|war\b/.test(source)) sceneSeed = 'battlefield with dramatic action';
  const combined = (caption || narration).slice(0, 140);
  return `dark fantasy ${sceneSeed}, ${combined}, dramatic lighting, oil painting style, D&D illustration, atmospheric, no text`;
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
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`
    return { ...panel, imageUrl: url || placeholderImage, isGenerating: false };
  } catch {
    return { ...panel, imageUrl: placeholderImage, isGenerating: false, error: 'network-error' };
  }
}
