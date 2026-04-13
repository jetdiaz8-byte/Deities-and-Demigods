import { NextResponse } from 'next/server'
import {
  OPENROUTER_FALLBACK_MODELS,
  OPENROUTER_MODEL,
  OPENROUTER_MODEL_TOKEN_LIMITS,
} from '@/lib/gameConstants'

type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  // H-13: Server-side only — never use NEXT_PUBLIC_ prefix for secrets
  const apiKey = process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenRouter API key not configured. Add OPENROUTER_API_KEY to your Vercel environment variables.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const {
      messages = [],
      model = OPENROUTER_MODEL,
      max_tokens,
      temperature,
      stream = false,
    }: {
      messages?: OpenRouterMessage[]
      model?: string
      max_tokens?: number
      temperature?: number
      stream?: boolean
    } = body ?? {}

    const requestedModel = OPENROUTER_FALLBACK_MODELS.includes(model) ? model : OPENROUTER_MODEL
    const tokenLimit = OPENROUTER_MODEL_TOKEN_LIMITS[requestedModel] ?? 8192
    const maxTokens = Math.min(max_tokens ?? tokenLimit, tokenLimit)

    // H-10: 60-second timeout on external AI API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deities-and-demigods.vercel.app',
        'X-Title': 'Deities & Demigods - Mythworld Engine',
      },
      body: JSON.stringify({
        model: requestedModel,
        messages,
        max_tokens: maxTokens,
        temperature: temperature ?? 0.9,
        stream,
      }),
    })

    if (stream) {
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        return new Response(text || JSON.stringify({ error: 'Stream request failed' }), {
          status: res.status,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      return new Response(res.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        return NextResponse.json(data, { status: res.status })
      }
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
