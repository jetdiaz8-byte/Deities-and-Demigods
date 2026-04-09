import { NextResponse } from 'next/server'

// Quick diagnostic endpoint — hit /api/gemini/status to check:
// 1. Whether OPENROUTER key is configured
// 2. Whether the key is valid (test call to OpenRouter)

export const maxDuration = 15

export async function GET() {
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY

  if (!key) {
    return NextResponse.json({
      status: 'error',
      message: 'OPENROUTER key is not set on Vercel. Add NEXT_PUBLIC_OPENROUTER_API_KEY (or OPENROUTER_API_KEY).',
      keyConfigured: false,
    }, { status: 500 })
  }

  // Mask the key for display (show first 4 + last 4 chars)
  const maskedKey = key.length > 8
    ? `${key.slice(0, 4)}...${key.slice(-4)}`
    : '***'

  // Try a minimal test call to OpenRouter
  try {
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deities-and-demigods.vercel.app',
        'X-Title': 'Deities & Demigods - Mythworld Engine',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-large',
        messages: [{ role: 'user', content: 'Respond with exactly: OK' }],
        max_tokens: 8,
        temperature: 0,
      }),
    })

    if (testResponse.ok) {
      return NextResponse.json({
        status: 'ok',
        message: 'OpenRouter key is configured and valid. OpenRouter connection working.',
        keyConfigured: true,
        keyPreview: maskedKey,
        model: 'mistralai/mistral-large',
      })
    } else {
      const errorText = await testResponse.text().catch(() => 'Unknown error')
      return NextResponse.json({
        status: 'error',
        message: `OpenRouter key is set but OpenRouter returned ${testResponse.status}. Check your API key.`,
        keyConfigured: true,
        keyPreview: maskedKey,
        openrouterStatus: testResponse.status,
        openrouterError: errorText.slice(0, 300),
      }, { status: 502 })
    }
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: `OpenRouter key is set but could not reach OpenRouter API: ${err instanceof Error ? err.message : String(err)}`,
      keyConfigured: true,
      keyPreview: maskedKey,
    }, { status: 502 })
  }
}
