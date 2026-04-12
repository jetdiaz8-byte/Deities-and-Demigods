import { NextRequest, NextResponse } from 'next/server';
// v2.24.0: Real AI image generation via z-ai-web-dev-sdk
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

    // v2.24.0: Real AI image generation via z-ai-web-dev-sdk
    // H-10: 90-second timeout for image generation
    const zai = await ZAI.create();
    const response = await zai.images.generations.create({
      prompt,
      size: (size || '1344x768') as '1344x768' | '1024x1024' | '768x1344',
      timeout: 90_000,
    });

    const imageBase64 = response.data[0]?.base64;
    if (!imageBase64) {
      throw new Error('No image data returned from generation API');
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    console.log(`🖼️ [generate-image] SUCCESS — image size: ${imageBase64.length} chars`);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation failed:', error);

    // Graceful fallback: return a styled SVG placeholder on failure
    const imageUrl = buildFallbackSvg(prompt);
    return NextResponse.json({ imageUrl, placeholder: true, error: 'AI generation failed, showing fallback' });
  }
}
