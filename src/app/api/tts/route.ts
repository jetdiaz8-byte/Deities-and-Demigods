import { NextRequest, NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';

// Increase Vercel serverless function timeout to 30s (Pro plan)
// Hobby plan max is 10s — TTS may fail on free tier
export const maxDuration = 30;

// Edge TTS API - Using node-edge-tts package
// High-quality Microsoft Neural Voices - FREE and unlimited!
// Works on Vercel serverless without Python!

// Best voices for DM narration — curated for fantasy atmosphere
const DM_VOICES = {
  'guy': { name: 'en-US-GuyNeural', description: 'Deep male voice - passionate, perfect for DM' },
  'christopher': { name: 'en-US-ChristopherNeural', description: 'Male voice - reliable, authoritative' },
  'brian': { name: 'en-US-BrianNeural', description: 'Male voice - approachable, sincere' },
  'ryan': { name: 'en-GB-RyanNeural', description: 'British male - friendly, noble' },
  'aria': { name: 'en-US-AriaNeural', description: 'Female voice - positive, confident' },
  'jenny': { name: 'en-US-JennyNeural', description: 'Female voice - friendly, warm' },
  'connor': { name: 'en-IE-ConnorNeural', description: 'Irish male - melodic, warm, bardic' },
  'thomas': { name: 'en-GB-ThomasNeural', description: 'British male - elder storyteller, wise' },
  'davis': { name: 'en-US-DavisNeural', description: 'Older male - distinguished, professorial' },
  'jason': { name: 'en-US-JasonNeural', description: 'Male voice - calm, measured, mysterious' },
};

export async function POST(req: NextRequest) {
  let debugInfo = { textLen: 0, voiceKey: 'unknown', env: 'unknown', isVercel: false };
  try {
    const body = await req.json();
    
    const text = body.text;
    const voiceKey = body.voice || 'guy';
    const rate = body.rate || '-15%';

    console.log('[Edge TTS] Request:', { 
      textLength: text?.length, 
      voice: voiceKey,
      textPreview: text?.substring(0, 100) 
    });

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Truncate to reasonable length
    const truncatedText = text.trim().slice(0, 5000);
    
    if (truncatedText.length === 0) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Get the voice name
    const voiceConfig = DM_VOICES[voiceKey as keyof typeof DM_VOICES] || DM_VOICES.guy;
    const voiceName = voiceConfig.name;
    debugInfo = { textLen: truncatedText.length, voiceKey, env: process.env.NODE_ENV || 'unknown', isVercel: !!process.env.VERCEL };

    console.log('[Edge TTS] Using voice:', voiceName, 'rate:', rate);

    // Create temp file path (unique via random suffix to avoid collisions)
    const tempDir = process.env.VERCEL ? '/tmp' : '/tmp';
    const audioFile = path.join(tempDir, `tts_${Date.now()}_${Math.random().toString(36).slice(2,8)}.mp3`);

    // Create EdgeTTS instance with configuration
    const tts = new EdgeTTS({
      voice: voiceName,
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: 'default',
      rate: rate,
      volume: 'default',
      timeout: 25000  // Must be less than maxDuration (30s) with margin
    });
    
    // Generate speech and save to file
    try {
      await tts.ttsPromise(truncatedText, audioFile);
    } catch (ttsErr) {
      console.error('[Edge TTS] ttsPromise failed:', ttsErr);
      throw new Error(`Edge TTS WebSocket failed: ${ttsErr instanceof Error ? ttsErr.message : String(ttsErr)}`);
    }
    
    // Check if file was created
    if (!fs.existsSync(audioFile)) {
      throw new Error('Audio file was not created');
    }

    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFile);
    
    console.log('[Edge TTS] Audio generated, size:', audioBuffer.length);

    // Clean up temp file
    try {
      fs.unlinkSync(audioFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Return audio as response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Edge TTS] Error:', error);
    // Log extra context for Vercel debugging
    console.error('[Edge TTS] Debug info:', { ...debugInfo, errorStack: error instanceof Error ? error.stack : undefined });
    
    const errorMessage = error instanceof Error ? error.message : 'TTS generation failed';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to list available voices
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'Edge TTS (Microsoft Neural Voices) - node-edge-tts',
    voices: Object.entries(DM_VOICES).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description
    })),
    settings: {
      rate: {
        description: 'Speech rate adjustment',
        default: '-15%',
        options: ['-30%', '-20%', '-15%', '-10%', '0%', '+10%', '+20%']
      }
    }
  });
}
