export interface ComicPanelData {
  id: string;
  imageUrl?: string;
  retryImageUrl?: string;
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

export function determinePanelCount(_narration: string, _isCombat: boolean): number {
  // One scene illustration per turn; previous turns are cached by turn id.
  return 1;
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

export function extractSceneKeywords(narration: string): string[] {
  const source = narration || ''
  const lower = source.toLowerCase()
  const locationWords = ['forest', 'mountain', 'ocean', 'tower', 'cave', 'city', 'village', 'dungeon', 'temple', 'castle', 'river', 'bridge', 'battlefield', 'tavern', 'market']
  const moodWords = ['dark', 'stormy', 'moonlit', 'foggy', 'fiery', 'shadow', 'dawn', 'dusk', 'bloody', 'eerie', 'peaceful']
  const objectWords = ['sword', 'staff', 'crystal', 'shard', 'dragon', 'throne', 'altar', 'gate', 'portal']

  const keywords: string[] = []
  const addIfFound = (word: string) => {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) keywords.push(word)
  }
  locationWords.forEach(addIfFound)
  moodWords.forEach(addIfFound)
  objectWords.forEach(addIfFound)

  // Named entities: capitalized words not likely sentence starters.
  const entities = Array.from(source.matchAll(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g))
    .map(m => m[1])
    .filter(v => !['The', 'And', 'But', 'Then', 'When', 'After', 'Before', 'With'].includes(v.split(' ')[0]))
  for (const e of entities) {
    keywords.push(e.toLowerCase())
  }

  const unique = Array.from(new Set(keywords)).slice(0, 8)
  return unique.length ? unique : ['fantasy landscape', 'dramatic sky', 'mysterious atmosphere']
}

export function buildImagePrompt(narration: string, caption: string, artStyle: string): string {
  const stylePrompt = STYLE_PROMPTS[artStyle] || STYLE_PROMPTS['larry-elmore']

  // Use the actual DM narration as the primary prompt — it's rich, evocative
  // descriptive prose that paints a vivid picture for the image generator.
  // Truncate to ~500 chars to stay within model limits while keeping key details.
  const sceneText = (narration || caption || '').trim()
  const truncated = sceneText.length > 500 ? sceneText.slice(0, 500) : sceneText

  // Strip any dice notation, turn markers, or meta-text that wouldn't make sense visually
   const cleaned = truncated
    .replace(/\[.*?\]/g, '')           // Remove [dice notation]
    .replace(/\d+d\d+[^\s]*/g, '')    // Remove dice rolls
    .replace(/Turn \d+/gi, '')        // Remove turn markers
    .replace(/HP:?\s*\d+/gi, '')     // Remove HP mentions
    .replace(/AC:?\s*\d+/gi, '')     // Remove AC mentions
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return `dark fantasy landscape, dramatic lighting, oil painting style, atmospheric, detailed, ${stylePrompt}`
  }

  // The narration itself is the scene description — let the image model interpret it
  return `Illustrate this fantasy scene: ${cleaned}. ${stylePrompt}`
}

export async function generateComicPanels(
  narration: string,
  isCombat: boolean,
  options: ComicGeneratorOptions = {}
): Promise<ComicPanelData[]> {
  const { artStyle = 'larry-elmore', maxPanels = 1 } = options;
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
  // Build the prompt using the existing helper
  const builtPrompt = buildImagePrompt(narration, panel.caption || '', artStyle);

  // v2.24.0: Try real AI image first, fallback to SVG placeholder
  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: builtPrompt, artStyle, size: '1344x768' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) {
        return { ...panel, imageUrl: data.imageUrl, isGenerating: false, error: undefined };
      }
    }
  } catch (err) {
    console.warn('AI image generation failed, using SVG fallback:', err);
  }

  // SVG fallback placeholder
  const keywords = extractSceneKeywords(panel.caption || narration).slice(0, 4).join(', ')
  const sceneLabel = (panel.caption || 'Scene').replace(/[<>&"']/g, '').slice(0, 60)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stop-color="#1a1520"/>
        <stop offset="50%" stop-color="#12101a"/>
        <stop offset="100%" stop-color="#0a0810"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="rgba(212,175,55,0.12)"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <rect width="800" height="600" fill="url(#glow)"/>
    <rect x="40" y="40" width="720" height="520" rx="4" fill="none" stroke="rgba(212,175,55,0.15)" stroke-width="1"/>
    <text x="400" y="260" text-anchor="middle" fill="rgba(212,175,55,0.5)" font-size="14" font-family="Georgia" letter-spacing="4">${keywords || 'fantasy scene'}</text>
    <text x="400" y="300" text-anchor="middle" fill="rgba(200,190,170,0.4)" font-size="11" font-family="Georgia">${sceneLabel}</text>
    <text x="400" y="540" text-anchor="middle" fill="rgba(140,120,90,0.3)" font-size="9" font-family="Georgia" letter-spacing="2">TURN ${turnNumber}</text>
  </svg>`
  const imageUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
  return { ...panel, imageUrl, isGenerating: false };
}
