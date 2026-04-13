import { NextRequest, NextResponse } from 'next/server';

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
 * Free image generation via Pollinations AI.
 * No API key, no auth, no config file needed.
 * Works everywhere: local dev, Vercel, any serverless platform.
 *
 * Supported sizes: 1344x768 (landscape), 1024x1024 (square), 768x1344 (portrait)
 */
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

    // Map our size format to Pollinations dimensions
    const sizeMap: Record<string, { width: number; height: number }> = {
      '1344x768': { width: 1344, height: 768 },
      '1024x1024': { width: 1024, height: 1024 },
      '768x1344': { width: 768, height: 1344 },
    };
    const dims = sizeMap[size || '1344x768'] || sizeMap['1344x768'];

    // Build enhanced prompt with art style
    let enhancedPrompt = prompt;
    if (artStyle && artStyle.length > 0) {
      enhancedPrompt = `${prompt}, ${artStyle} style, fantasy RPG illustration, detailed, cinematic`;
    } else {
      enhancedPrompt = `${prompt}, fantasy RPG illustration, detailed, cinematic, dramatic lighting`;
    }

    // Pollinations AI: free, no API key, generates image from prompt via URL
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&model=flux`;

    // Fetch the actual image bytes through our server (avoids CORS/client issues)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    try {
      const imgRes = await fetch(pollinationsUrl, {
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!imgRes.ok) {
        throw new Error(`Pollinations returned ${imgRes.status}`);
      }

      const contentType = imgRes.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Unexpected content type: ${contentType}`);
      }

      // Convert image to base64 data URL for the client
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = contentType.split(';')[0].trim();
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log(`🖼️ [generate-image] SUCCESS — Pollinations image proxied, type: ${mimeType}, size: ${(buffer.length / 1024).toFixed(0)}KB`);
      return NextResponse.json({ imageUrl: dataUrl });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Image generation failed:', error);

    // Graceful fallback: return a styled SVG placeholder on failure
    const imageUrl = buildFallbackSvg(prompt);
    return NextResponse.json({ imageUrl, placeholder: true, error: 'AI generation failed, showing fallback' });
  }
}
