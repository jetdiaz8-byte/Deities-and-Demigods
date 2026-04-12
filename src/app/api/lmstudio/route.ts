import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy to LM Studio (OpenAI-compatible local LLM server)
// LM Studio exposes: POST http://localhost:1234/v1/chat/completions
// This route translates our Gemini-format requests into OpenAI format

export const runtime = 'edge'

// Security: Only allow requests to localhost/private network (SSRF prevention)
function isAllowedLocalhost(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowed = ['localhost', '127.0.0.1', '::1', '0.0.0.0']
    return allowed.includes(parsed.hostname)
  } catch {
    return false
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { systemPrompt, userMessage, messages, temperature, maxOutputTokens, max_tokens, lmStudioUrl, model } = body

    if (!userMessage && (!Array.isArray(messages) || messages.length === 0)) {
      return NextResponse.json({ error: 'Missing required field: userMessage or messages' }, { status: 400, headers: CORS_HEADERS })
    }

    // Default to localhost:1234 (LM Studio default) — SSRF-protected
    const baseUrl = (lmStudioUrl || 'http://localhost:1234').replace(/\/+$/, '')
    if (!isAllowedLocalhost(baseUrl)) {
      return NextResponse.json({ error: 'URL must be a localhost address (SSRF protection)' }, { status: 403, headers: CORS_HEADERS })
    }
    const endpoint = `${baseUrl}/v1/chat/completions`

    // Build OpenAI-compatible messages array
    const lmMessages: Array<{ role: string; content: string }> = []
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        if (!m || typeof m.content !== 'string') continue
        const role = m.role === 'system' || m.role === 'assistant' ? m.role : 'user'
        lmMessages.push({ role, content: m.content })
      }
    } else {
      if (systemPrompt) {
        lmMessages.push({ role: 'system', content: systemPrompt })
      }
      lmMessages.push({ role: 'user', content: userMessage })
    }

    const requestBody: Record<string, unknown> = {
      messages: lmMessages,
      temperature: temperature ?? 0.9,
      max_tokens: max_tokens ?? maxOutputTokens ?? 6144,
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
          { status: 502, headers: CORS_HEADERS },
        )
      }

      return NextResponse.json(
        { error: `LM Studio error ${response.status}: ${errorText.slice(0, 200)}` },
        { status: response.status, headers: CORS_HEADERS },
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
      text: content,
      modelUsed,
      fallbackUsed: false,
    }, { headers: CORS_HEADERS })

  } catch (error) {
    console.error('[LM Studio Proxy] Unexpected error:', error)

    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed') || message.includes('connect')) {
      return NextResponse.json(
        { error: 'Cannot connect to LM Studio. Make sure it is running and the Local Server is started.' },
        { status: 502, headers: CORS_HEADERS },
      )
    }

    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

// GET endpoint — check LM Studio connectivity and list available models
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const baseUrl = (url.searchParams.get('url') || 'http://localhost:1234').replace(/\/+$/, '')
    if (!isAllowedLocalhost(baseUrl)) {
      return NextResponse.json({ connected: false, error: 'URL must be a localhost address (SSRF protection)' }, { status: 403, headers: CORS_HEADERS })
    }

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({
        connected: false,
        error: `LM Studio returned ${response.status}`,
        url: baseUrl,
      }, { status: 200, headers: CORS_HEADERS })
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
    }, { headers: CORS_HEADERS })

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      connected: false,
      error: message.includes('ECONNREFUSED') || message.includes('fetch failed')
        ? 'Cannot connect to LM Studio. Make sure it is running and the Local Server is started.'
        : message,
      url: request.nextUrl.searchParams.get('url') || 'http://localhost:1234',
    }, { status: 200, headers: CORS_HEADERS })
  }
}
