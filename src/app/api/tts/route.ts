import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════════
// Edge TTS — Premium Microsoft Neural Voices (FREE, no API key needed)
// Uses node-edge-tts which connects to Microsoft Edge's online TTS service.
// ═══════════════════════════════════════════════════════════════════════════

// Voice map: UI key → Microsoft Neural Voice ID
// Curated for dark fantasy / D&D DM narration quality
const VOICE_MAP: Record<string, { id: string; lang: string; desc: string; gender: string }> = {
  'guy':       { id: 'en-GB-GuyNeural',    lang: 'en-GB', desc: '🧙 Dark Fantasy DM',   gender: 'male' },
  'alan':      { id: 'en-GB-AlanNeural',   lang: 'en-GB', desc: '📜 Elder Narrator',    gender: 'male' },
  'andrew':    { id: 'en-GB-AndrewNeural', lang: 'en-GB', desc: '⚔️ Battle Herald',     gender: 'male' },
  'brian':     { id: 'en-US-BrianNeural',  lang: 'en-US', desc: '🗡️ Adventure Guide',   gender: 'male' },
  'davis':     { id: 'en-US-DavisNeural',  lang: 'en-US', desc: '🏛️ Court Sage',        gender: 'male' },
  'thomas':    { id: 'en-GB-ThomasNeural', lang: 'en-GB', desc: '📖 Dungeon Scholar',   gender: 'male' },
  'aria':      { id: 'en-US-AriaNeural',   lang: 'en-US', desc: '✨ Mystic Enchantress', gender: 'female' },
  'jenny':     { id: 'en-US-JennyNeural',  lang: 'en-US', desc: '🌟 Tavern Bard',       gender: 'female' },
  'sonia':     { id: 'en-GB-SoniaNeural',  lang: 'en-GB', desc: '🔮 Oracle',            gender: 'female' },
  'michelle':  { id: 'en-US-MichelleNeural', lang: 'en-US', desc: '👑 High Priestess', gender: 'female' },
};

// Default voice: Guy — deep, gravely British male perfect for dark fantasy narration
const DEFAULT_VOICE = 'guy';

function speedToRate(speed: number): string {
  if (speed <= 0.5) return '-50%';
  if (speed <= 0.7) return '-30%';
  if (speed <= 0.85) return '-15%';
  if (speed <= 1.0) return '+0%';
  if (speed <= 1.15) return '+15%';
  if (speed <= 1.3) return '+30%';
  return '+50%';
}

export async function POST(req: NextRequest) {
  let tmpFile = '';

  try {
    const body = await req.json();
    const text = body.text;
    const voiceKey = (body.voice || DEFAULT_VOICE) as string;
    const speed = typeof body.speed === 'number' ? body.speed : 0.9;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const truncatedText = text.trim().slice(0, 5000);
    if (truncatedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    const voiceConfig = VOICE_MAP[voiceKey] || VOICE_MAP[DEFAULT_VOICE];
    const rate = speedToRate(Math.max(0.5, Math.min(2.0, speed)));

    tmpFile = join('/tmp', `tts-${randomUUID()}.mp3`);

    // Dynamic import — node-edge-tts uses WebSocket to Microsoft's free TTS service
    const { EdgeTTS } = await import('node-edge-tts');

    const tts = new EdgeTTS({
      voice: voiceConfig.id,
      lang: voiceConfig.lang,
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate,
      pitch: '-2Hz',      // Slightly lower pitch for gravitas
      volume: '+0%',
      timeout: 45000,     // 45s timeout — WebSocket handshake can be slow in sandboxed environments
    });

    await tts.ttsPromise(truncatedText, tmpFile);

    const audioBuffer = await readFile(tmpFile);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
        'X-Voice': voiceConfig.id,
      },
    });
  } catch (error) {
    console.error('[Edge TTS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'TTS generation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    // Clean up temp file
    if (tmpFile) {
      try { await unlink(tmpFile) } catch { /* ignore */ }
    }
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'Edge TTS (Microsoft Neural Voices) — Free, Premium Quality',
    defaultVoice: DEFAULT_VOICE,
    voices: Object.entries(VOICE_MAP).map(([key, val]) => ({
      id: key,
      name: val.id,
      description: val.desc,
      gender: val.gender,
    })),
  });
}
