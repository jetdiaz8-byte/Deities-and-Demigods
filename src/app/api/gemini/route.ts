import { NextRequest, NextResponse } from 'next/server'

// Server-side Gemini proxy — hides API key from the client bundle
// The key is stored as GEMINI_API_KEY environment variable on Vercel
//
// 3-tier fallback chain for reliability:
//   1. gemini-2.5-flash     (best prose quality, 65k output)
//   2. gemma-4-31b-it       (1,500 RPD, 32k output, rarely 503s)
//   3. gemini-2.5-flash-lite (1,000 RPD, 16k output, ultra-light)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// Max output tokens per model — fallbacks have lower limits
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  'gemini-2.5-flash':       65536,
  'gemma-4-31b-it':         32768,
  'gemini-2.5-flash-lite':  16384,
}

// Fallback models tried server-side when primary returns 503
const FALLBACK_MODELS = ['gemma-4-31b-it', 'gemini-2.5-flash-lite']

export const runtime = 'edge'
export const maxDuration = 30
const TOTAL_ROUTE_BUDGET_MS = 25000
const PER_MODEL_TIMEOUT_MS = 9000

// Build the request body for Gemini API
function buildRequestBody(
  systemPrompt: string | undefined,
  userMessage: string,
  temperature: number | undefined,
  maxOutputTokens: number,
) {
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: temperature ?? 0.9,
      maxOutputTokens,
    },
  }

  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] }
  }

  return body
}

// Try a single model — returns { ok, data?, error?, status?, modelUsed? }
async function tryModel(
  model: string,
  systemPrompt: string | undefined,
  userMessage: string,
  temperature: number | undefined,
  maxOutputTokens: number,
  timeoutMs: number,
): Promise<{
  ok: boolean
  data?: unknown
  error?: string
  status?: number
  modelUsed: string
}> {
  const tokenLimit = MODEL_TOKEN_LIMITS[model] ?? 6144
  // Cap output tokens to the model's max
  const cappedTokens = Math.min(maxOutputTokens, tokenLimit)

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        buildRequestBody(systemPrompt, userMessage, temperature, cappedTokens),
      ),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        ok: false,
        error: `Gemini ${response.status}: ${errorText.slice(0, 300)}`,
        status: response.status,
        modelUsed: model,
      }
    }

    const data = await response.json()

    if (data.error) {
      return {
        ok: false,
        error: data.error.message || 'Gemini API error',
        status: 500,
        modelUsed: model,
      }
    }

    return { ok: true, data, modelUsed: model }

  } catch (err) {
    clearTimeout(timeout)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      error: isAbort
        ? `Upstream timeout after ${timeoutMs}ms`
        : `Network error: ${err instanceof Error ? err.message : String(err)}`,
      status: isAbort ? 504 : 502,
      modelUsed: model,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key is configured on the server
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured on server. Add it to Vercel environment variables.' },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { model, systemPrompt, userMessage, temperature, maxOutputTokens } = body

    if (!model || !userMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: model, userMessage' },
        { status: 400 },
      )
    }

    const requestedTokens = maxOutputTokens ?? 6144
    const startedAt = Date.now()
    const remainingBudget = () => TOTAL_ROUTE_BUDGET_MS - (Date.now() - startedAt)
    const perCallTimeout = () => Math.max(1500, Math.min(PER_MODEL_TIMEOUT_MS, remainingBudget() - 500))

    // ── Try primary model ──
    if (remainingBudget() <= 1000) {
      return NextResponse.json(
        { error: 'upstream_timeout: route budget exhausted before primary request' },
        { status: 503 },
      )
    }
    const primary = await tryModel(model, systemPrompt, userMessage, temperature, requestedTokens, perCallTimeout())

    if (primary.ok) {
      console.log(`[Gemini Proxy] ✅ ${model} — success`)
      return NextResponse.json({
        data: primary.data,
        modelUsed: primary.modelUsed,
        fallbackUsed: false,
      })
    }

    // ── Primary failed — check if it's a retriable error (503 or 429) ──
    const isRetriable = primary.status === 503 || primary.status === 429

    if (!isRetriable) {
      // Non-retriable error (400, 401, 403, etc.) — return immediately
      console.error(`[Gemini Proxy] ❌ ${model} — ${primary.status} (non-retriable): ${primary.error}`)
      return NextResponse.json(
        { error: primary.error },
        { status: primary.status || 500 },
      )
    }

    // ── Retriable error — try fallback models ──
    console.warn(`[Gemini Proxy] ⚠️ ${model} returned ${primary.status}, trying fallback models...`)

    for (const fallbackModel of FALLBACK_MODELS) {
      if (remainingBudget() <= 1000) {
        console.error('[Gemini Proxy] ⏱️ Route budget exhausted before fallback completed')
        return NextResponse.json(
          { error: 'upstream_timeout: route budget exhausted during fallback chain' },
          { status: 503 },
        )
      }
      // Don't retry the same model that just failed
      if (fallbackModel === model) continue

      const fallback = await tryModel(
        fallbackModel,
        systemPrompt,
        userMessage,
        temperature,
        requestedTokens,
        perCallTimeout(),
      )

      if (fallback.ok) {
        console.log(`[Gemini Proxy] ✅ ${fallbackModel} — fallback success (primary ${model} returned ${primary.status})`)
        return NextResponse.json({
          data: fallback.data,
          modelUsed: fallback.modelUsed,
          fallbackUsed: true,
          originalModel: model,
          originalError: primary.error,
        })
      }

      // Only continue fallback chain on 503/429 — other errors are terminal
      if (fallback.status !== 503 && fallback.status !== 429) {
        console.error(`[Gemini Proxy] ❌ ${fallbackModel} — ${fallback.status} (terminal): ${fallback.error}`)
        return NextResponse.json(
          { error: fallback.error },
          { status: fallback.status || 500 },
        )
      }

      console.warn(`[Gemini Proxy] ⚠️ ${fallbackModel} also returned ${fallback.status}, trying next...`)
    }

    // ── All models failed ──
    console.error(`[Gemini Proxy] ❌ All models exhausted. Last error from ${FALLBACK_MODELS[FALLBACK_MODELS.length - 1]}`)
    return NextResponse.json(
      { error: `All models unavailable (503/429). Tried: ${model}, ${FALLBACK_MODELS.join(', ')}` },
      { status: 503 },
    )

  } catch (error) {
    console.error('[Gemini Proxy] Unexpected error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}
