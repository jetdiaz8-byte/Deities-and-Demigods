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
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''
  if (!apiKey) {
    return NextResponse.json({ error: 'No OpenRouter API key configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      messages = [],
      model = OPENROUTER_MODEL,
      max_tokens,
      temperature,
    }: {
      messages?: OpenRouterMessage[]
      model?: string
      max_tokens?: number
      temperature?: number
    } = body ?? {}

    const requestedModel = OPENROUTER_FALLBACK_MODELS.includes(model) ? model : OPENROUTER_MODEL
    const tokenLimit = OPENROUTER_MODEL_TOKEN_LIMITS[requestedModel] ?? 8192
    const maxTokens = Math.min(max_tokens ?? tokenLimit, tokenLimit)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
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
      }),
    })

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
