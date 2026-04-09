import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { prompt, artStyle } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    // Placeholder — returns a generated SVG as data URI
    // Replace with actual image generation (DALL-E, Flux, etc.) when API key is configured
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">'
      + '<rect width="400" height="300" fill="#1a1a2e"/>'
      + '<text x="200" y="140" text-anchor="middle" fill="#c9a84c" font-size="14" font-family="Georgia">'
      + 'Fantasy Scene</text>'
      + '<text x="200" y="165" text-anchor="middle" fill="#5a5856" font-size="10" font-family="Georgia">'
      + encodeURIComponent(prompt.slice(0, 60)).replace(/%20/g, ' ').slice(0, 60) + '</text>'
      + '</svg>';
    const imageUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    return NextResponse.json({ imageUrl, placeholder: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Image generation failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
