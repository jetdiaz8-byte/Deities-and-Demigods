import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_TOKEN_LIMITS: Record<string, number> = {
  'mistralai/mistral-large': 65536,
  'cohere/command-r-plus': 128000,
  'deepseek/deepseek-chat-v3-0324:free': 65536,
  'google/gemma-3-27b-it:free': 8192,
}

const FALLBACK_MODELS = [
  'mistralai/mistral-large',
  'cohere/command-r-plus',
  'deepseek/deepseek-chat-v3-0324:free',
  'google/gemma-3-27b-it:free',
]

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No OpenRouter API key configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { messages, model = FALLBACK_MODELS[0] } = body

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://deities-and-demigods.vercel.app',
        'X-Title': 'Deities & Demigods - Mythworld Engine',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: OPENROUTER_TOKEN_LIMITS[model] || 65536,
        temperature: 0.85,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      // If primary model fails, try fallbacks
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        for (const fallbackModel of FALLBACK_MODELS) {
          if (fallbackModel === model) continue
          const fbRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://deities-and-demigods.vercel.app',
              'X-Title': 'Deities & Demigods - Mythworld Engine',
            },
            body: JSON.stringify({
              model: fallbackModel,
              messages,
              max_tokens: OPENROUTER_TOKEN_LIMITS[fallbackModel] || 65536,
              temperature: 0.85,
            }),
          })
          if (fbRes.ok) {
            const fbData = await fbRes.json()
            return NextResponse.json(fbData)
          }
        }
      }
      return NextResponse.json({ error: data.error?.message || `HTTP ${res.status}` }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
