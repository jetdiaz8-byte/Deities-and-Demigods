import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const VALID_SIZES = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'] as const;

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!VALID_SIZES.includes(size)) {
      return NextResponse.json({ error: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}` }, { status: 400 });
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
