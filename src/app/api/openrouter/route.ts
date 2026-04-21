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
    return NextResponse.json({ error: 'The voices have gone silent. The thread between worlds is broken — no key binds the oracle to this realm. Seek the keeper of keys and ask them to restore the connection.', errorType: 'no_api_key' }, { status: 503 })
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

    console.log(`[openrouter] model=${requestedModel}, maxTokens=${maxTokens}, messages=${messages.length}, stream=${stream}`)

    // H-10: 60-second timeout on external AI API call
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)
    let res: Response
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
    } finally {
      clearTimeout(timeoutId)
    }

    if (stream) {
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`[openrouter] Stream error: status=${res.status}, model=${requestedModel}, body=${text.slice(0, 500)}`)
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
      console.error(`[openrouter] Error: status=${res.status}, model=${requestedModel}, body=${JSON.stringify(data).slice(0, 500)}`)
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[openrouter] Exception: ${msg}`)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
