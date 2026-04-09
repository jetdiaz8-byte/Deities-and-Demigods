import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.OPENROUTER_API_KEY || ''

    if (!key) {
      console.warn('/api/get-key: OPENROUTER_API_KEY is empty or not set')
      return NextResponse.json({ key: '' })
    }

    return NextResponse.json({ key })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('/api/get-key CRASH:', msg, e)
    return NextResponse.json({ key: '', error: msg })
  }
}