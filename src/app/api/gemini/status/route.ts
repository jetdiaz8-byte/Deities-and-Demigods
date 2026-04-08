import { NextResponse } from 'next/server'

// Quick diagnostic endpoint — hit /api/gemini/status to check:
// 1. Whether GEMINI_API_KEY is configured
// 2. Whether the key is valid (test call to Gemini)

export const maxDuration = 15

export async function GET() {
  const key = process.env.GEMINI_API_KEY

  if (!key) {
    return NextResponse.json({
      status: 'error',
      message: 'GEMINI_API_KEY is not set on Vercel. Go to Vercel Dashboard → Project Settings → Environment Variables and add GEMINI_API_KEY.',
      keyConfigured: false,
    }, { status: 500 })
  }

  // Mask the key for display (show first 4 + last 4 chars)
  const maskedKey = key.length > 8
    ? `${key.slice(0, 4)}...${key.slice(-4)}`
    : '***'

  // Try a minimal test call to Gemini
  try {
    const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${key}`
    const testResponse = await fetch(testEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (testResponse.ok) {
      return NextResponse.json({
        status: 'ok',
        message: 'GEMINI_API_KEY is configured and valid. Gemini connection working.',
        keyConfigured: true,
        keyPreview: maskedKey,
        model: 'gemini-2.5-flash',
      })
    } else {
      const errorText = await testResponse.text().catch(() => 'Unknown error')
      return NextResponse.json({
        status: 'error',
        message: `GEMINI_API_KEY is set but Gemini returned ${testResponse.status}. Check your API key.`,
        keyConfigured: true,
        keyPreview: maskedKey,
        geminiStatus: testResponse.status,
        geminiError: errorText.slice(0, 300),
      }, { status: 502 })
    }
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: `GEMINI_API_KEY is set but could not reach Gemini API: ${err instanceof Error ? err.message : String(err)}`,
      keyConfigured: true,
      keyPreview: maskedKey,
    }, { status: 502 })
  }
}
