import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import ZAI from 'z-ai-web-dev-sdk';

const VALID_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'] as const;

// Attempt to load z-ai config to detect auth issues early
async function loadZaiConfig(): Promise<{ baseUrl: string; apiKey: string; token?: string } | null> {
  const configPaths = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(os.homedir(), '.z-ai-config'),
    '/etc/.z-ai-config',
  ];
  for (const filePath of configPaths) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const config = JSON.parse(raw);
      if (config.baseUrl && config.apiKey) return config;
    } catch { /* skip */ }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!VALID_SIZES.includes(size)) {
      return NextResponse.json({ error: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}` }, { status: 400 });
    }

    // Pre-flight: check config before calling SDK
    const config = await loadZaiConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Image generation not configured — no .z-ai-config found', disabled: true },
        { status: 503 }
      );
    }
    if (!config.token) {
      // The image API requires X-Token which is missing from config.
      // Return 503 (not 500) so the caller can gracefully degrade.
      return NextResponse.json(
        { error: 'Image generation unavailable — X-Token not configured', disabled: true },
        { status: 503 }
      );
    }

    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt,
      size,
    });

    const imageBase64 = response.data[0].base64;
    return NextResponse.json({ base64: imageBase64 });
  } catch (error: any) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
