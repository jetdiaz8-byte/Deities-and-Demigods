import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// v2.24.0: TTS via z-ai-web-dev-sdk — no more WebSocket timeouts
// The SDK handles text-to-speech server-side with reliable HTTP

const DM_VOICES: Record<string, string> = {
  'guy': 'tongtong',
  'christopher': 'tongtong',
  'brian': 'tongtong',
  'ryan': 'tongtong',
  'aria': 'tongtong',
  'jenny': 'tongtong',
  'connor': 'tongtong',
  'thomas': 'tongtong',
  'davis': 'tongtong',
  'jason': 'tongtong',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text;
    const voiceKey = body.voice || 'guy';
    const speed = body.speed || 0.9;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to safe length for TTS
    const truncatedText = text.trim().slice(0, 5000);
    if (truncatedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Dynamic import to avoid bundling issues
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const voice = DM_VOICES[voiceKey] || DM_VOICES['guy'];
    
    const response = await zai.audio.tts.create({
      input: truncatedText,
      voice: voice,
      speed: speed,
      response_format: 'wav',
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(new Uint8Array(arrayBuffer));

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[TTS SDK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'TTS generation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'z-ai-web-dev-sdk TTS (v2.24.0)',
    voices: Object.entries(DM_VOICES).map(([key]) => ({
      id: key,
      name: key,
      description: `DM voice: ${key}`,
    })),
  });
}
