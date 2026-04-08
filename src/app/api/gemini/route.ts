import { NextRequest, NextResponse } from 'next/server'

// Server-side Gemini proxy — hides API key from the client bundle
// The key is stored as GEMINI_API_KEY environment variable on Vercel

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Validate API key is configured on the server
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured on server. Add it to Vercel environment variables.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { model, systemPrompt, userMessage, temperature, maxOutputTokens } = body

    if (!model || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: model, userMessage' },
        { status: 400 }
      )
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    const requestBody: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: temperature ?? 0.9,
        maxOutputTokens: maxOutputTokens ?? 6144,
      },
    }

    // Only include system_instruction if provided
    if (systemPrompt) {
      requestBody.system_instruction = { parts: [{ text: systemPrompt }] }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    // Forward the Gemini response status as-is (429, 503, etc.)
    // The client handles retries and backoff
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { error: `Gemini ${response.status}: ${errorText.slice(0, 200)}`, status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || 'Gemini API error', geminiError: data.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Gemini proxy error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
