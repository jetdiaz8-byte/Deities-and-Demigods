import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

const VALID_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'] as const;

// Load z-ai config (mirrors z-ai-web-dev-sdk's loadConfig logic)
async function loadZaiConfig(): Promise<{ baseUrl: string; apiKey: string; token?: string; chatId?: string; userId?: string } | null> {
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

// Download image URL to base64 (mirrors SDK's downloadImageAsBase64)
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
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

    // Pre-flight: check config before calling API
    const config = await loadZaiConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Image generation not configured — no .z-ai-config found', disabled: true },
        { status: 503 }
      );
    }
    if (!config.token) {
      return NextResponse.json(
        { error: 'Image generation unavailable — X-Token not configured', disabled: true },
        { status: 503 }
      );
    }

    // Call image generation API directly (mirrors z-ai-web-dev-sdk's createImageGeneration)
    const url = `${config.baseUrl}/images/generations`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z',
    };
    if (config.chatId) headers['X-Chat-Id'] = config.chatId;
    if (config.userId) headers['X-User-Id'] = config.userId;
    if (config.token) headers['X-Token'] = config.token;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, size }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Image API ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const result = await response.json();

    // Convert image URLs to base64 (same as SDK does)
    const processedData = await Promise.all(result.data.map(async (item: any) => {
      if (item.url) {
        const base64 = await downloadImageAsBase64(item.url);
        return { base64, format: 'png' };
      }
      return item;
    }));

    const imageBase64 = processedData[0]?.base64;
    if (!imageBase64) {
      throw new Error('No image data in API response');
    }

    return NextResponse.json({ base64: imageBase64 });
  } catch (error: any) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Image generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
