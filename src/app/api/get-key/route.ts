import { NextResponse } from 'next/server'
export const runtime = 'edge'
export async function GET() {
  const key = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ''
  if (!key) return NextResponse.json({ error: 'No key' }, { status: 500 })
  return NextResponse.json({ key })
}