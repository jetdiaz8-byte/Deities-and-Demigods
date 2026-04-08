import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy to LM Studio (OpenAI-compatible local LLM server)
// LM Studio exposes: POST http://localhost:1234/v1/chat/completions
// This route translates our Gemini-format requests into OpenAI format

export const maxDuration = 120 // LM Studio local inference can be slow

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { systemPrompt, userMessage, temperature, maxOutputTokens, lmStudioUrl, model } = body

    if (!userMessage) {
      return NextResponse.json({ error: 'Missing required field: userMessage' }, { status: 400 })
    }

    // Default to localhost:1234 (LM Studio default)
    const baseUrl = (lmStudioUrl || 'http://localhost:1234').replace(/\/+$/, '')
    const endpoint = `${baseUrl}/v1/chat/completions`

    // Build OpenAI-compatible messages array
    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: userMessage })

    const requestBody: Record<string, unknown> = {
      messages,
      temperature: temperature ?? 0.9,
      max_tokens: maxOutputTokens ?? 6144,
      stream: false,
    }

    // If a specific model name is provided, use it (LM Studio can serve multiple models)
    if (model && model !== 'default') {
      requestBody.model = model
    }

    console.log(`[LM Studio Proxy] → ${endpoint} (model: ${model || 'default'})`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`[LM Studio Proxy] ❌ ${response.status}: ${errorText.slice(0, 300)}`)

      // Connection refused = LM Studio not running
      if (response.status === 0 || errorText.includes('ECONNREFUSED') || errorText.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Cannot connect to LM Studio. Make sure it is running and the Local Server is started (default: http://localhost:1234)' },
          { status: 502 },
        )
      }

      return NextResponse.json(
        { error: `LM Studio error ${response.status}: ${errorText.slice(0, 200)}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Translate OpenAI response → Gemini-compatible format so the game engine can parse it unchanged
    const content = data.choices?.[0]?.message?.content || ''
    const finishReason = data.choices?.[0]?.finish_reason || 'stop'
    const modelUsed = data.model || model || 'local-model'

    const geminiCompatibleResponse = {
      candidates: [{
        content: {
          parts: [{ text: content }],
          role: 'model',
        },
        finishReason: finishReason === 'length' ? 'MAX_TOKENS' : 'STOP',
      }],
      usageMetadata: data.usage || {},
      modelUsed,
    }

    console.log(`[LM Studio Proxy] ✅ ${modelUsed} — ${content.length} chars`)

    return NextResponse.json({
      data: geminiCompatibleResponse,
      modelUsed,
      fallbackUsed: false,
    })

  } catch (error) {
    console.error('[LM Studio Proxy] Unexpected error:', error)

    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed') || message.includes('connect')) {
      return NextResponse.json(
        { error: 'Cannot connect to LM Studio. Make sure it is running and the Local Server is started.' },
        { status: 502 },
      )
    }

    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 },
    )
  }
}

// GET endpoint — check LM Studio connectivity and list available models
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const baseUrl = (url.searchParams.get('url') || 'http://localhost:1234').replace(/\/+$/, '')

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: `LM Studio returned ${response.status}`,
        url: baseUrl,
      }, { status: 200 })
    }

    const data = await response.json()
    const models = (data.data || []).map((m: { id: string; [k: string]: unknown }) => ({
      id: m.id,
    }))

    return NextResponse.json({
      connected: true,
      url: baseUrl,
      models,
      modelCount: models.length,
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      connected: false,
      error: message.includes('ECONNREFUSED') || message.includes('fetch failed')
        ? 'Cannot connect to LM Studio. Make sure it is running and the Local Server is started.'
        : message,
      url: request.nextUrl.searchParams.get('url') || 'http://localhost:1234',
    }, { status: 200 })
  }
}
