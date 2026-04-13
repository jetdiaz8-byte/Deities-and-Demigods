import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import ZAI from 'z-ai-web-dev-sdk';

function buildFallbackSvg(prompt?: string): string {
  const safePrompt = (prompt || 'Fantasy Scene').replace(/[<>&"']/g, '').slice(0, 60);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">'
    + '<defs>'
    + '<linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">'
    + '<stop offset="0%" stop-color="#1a1520"/>'
    + '<stop offset="50%" stop-color="#12101a"/>'
    + '<stop offset="100%" stop-color="#0a0810"/>'
    + '</linearGradient>'
    + '<radialGradient id="glow" cx="50%" cy="40%" r="50%">'
    + '<stop offset="0%" stop-color="rgba(212,175,55,0.12)"/>'
    + '<stop offset="100%" stop-color="transparent"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect width="800" height="600" fill="url(#bg)"/>'
    + '<rect width="800" height="600" fill="url(#glow)"/>'
    + '<rect x="40" y="40" width="720" height="520" rx="4" fill="none" stroke="rgba(212,175,55,0.15)" stroke-width="1"/>'
    + '<text x="400" y="280" text-anchor="middle" fill="rgba(212,175,55,0.5)" font-size="16" font-family="Georgia" letter-spacing="3">Image generation unavailable</text>'
    + '<text x="400" y="320" text-anchor="middle" fill="rgba(200,190,170,0.35)" font-size="12" font-family="Georgia">' + safePrompt + '</text>'
    + '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/**
 * Ensure .z-ai-config exists for z-ai-web-dev-sdk.
 * In local dev, the file already exists. On Vercel / serverless,
 * we create it at runtime from environment variables.
 */
function ensureConfig(): boolean {
  try {
    // If config already exists in CWD, we're good
    const { existsSync } = require('fs');
    if (existsSync('.z-ai-config')) return true;
  } catch {}

  // Build config from env vars (for Vercel / serverless)
  const baseUrl = process.env.Z_AI_BASE_URL;
  const apiKey = process.env.Z_AI_API_KEY;
  if (!baseUrl || !apiKey) {
    console.warn('[generate-image] No Z_AI_BASE_URL / Z_AI_API_KEY env vars — image gen unavailable on this host');
    return false;
  }

  try {
    const configDir = '/tmp';
    const configPath = join(configDir, '.z-ai-config');
    const config = {
      baseUrl,
      apiKey,
      chatId: process.env.Z_AI_CHAT_ID || undefined,
      userId: process.env.Z_AI_USER_ID || undefined,
      token: process.env.Z_AI_TOKEN || undefined,
    };
    // Clean undefined values
    Object.keys(config).forEach(k => (config as Record<string, unknown>)[k] === undefined && delete (config as Record<string, unknown>)[k]);

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[generate-image] Wrote .z-ai-config to /tmp from env vars');
    return true;
  } catch (e) {
    console.error('[generate-image] Failed to write config:', e);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let prompt = '';
  let artStyle: string | undefined;
  let size: string | undefined;

  try {
    const body = await request.json();
    prompt = body.prompt || '';
    artStyle = body.artStyle;
    size = body.size;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    console.log(`🖼️ [generate-image] prompt length: ${prompt.length}, style: ${artStyle}, size: ${size}`);

    // Ensure config exists — returns false on Vercel if env vars not set
    const hasConfig = ensureConfig();
    if (!hasConfig) {
      console.warn('[generate-image] No config available — returning placeholder');
      const imageUrl = buildFallbackSvg(prompt);
      return NextResponse.json({ imageUrl, placeholder: true, error: 'AI image generation not configured' });
    }

    // If we wrote config to /tmp, we need CWD there for SDK to find it
    const originalCwd = process.cwd();
    if (require('fs').existsSync('/tmp/.z-ai-config') && !require('fs').existsSync('.z-ai-config')) {
      process.chdir('/tmp');
    }

    try {
      const zai = await ZAI.create();
      const response = await zai.images.generations.create({
        prompt,
        size: (size || '1344x768') as '1344x768' | '1024x1024' | '768x1344',
      });

      const imageBase64 = response.data[0]?.base64;
      if (!imageBase64) {
        throw new Error('No image data returned from generation API');
      }

      const imageUrl = `data:image/png;base64,${imageBase64}`;
      console.log(`🖼️ [generate-image] SUCCESS — image size: ${imageBase64.length} chars`);
      return NextResponse.json({ imageUrl });
    } finally {
      // Restore original CWD
      if (process.cwd() !== originalCwd) {
        process.chdir(originalCwd);
      }
    }
  } catch (error) {
    console.error('Image generation failed:', error);

    // Graceful fallback: return a styled SVG placeholder on failure
    const imageUrl = buildFallbackSvg(prompt);
    return NextResponse.json({ imageUrl, placeholder: true, error: 'AI generation failed, showing fallback' });
  }
}
