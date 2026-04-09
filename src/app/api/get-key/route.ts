import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const key = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || ''

    if (!key) {
      console.warn('/api/get-key: no key found. Checked OPENROUTER_API_KEY and NEXT_PUBLIC_OPENROUTER_API_KEY')
      return NextResponse.json({ key: '' })
    }

    return NextResponse.json({ key })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('/api/get-key CRASH:', msg, e)
    return NextResponse.json({ key: '', error: msg })
  }
}