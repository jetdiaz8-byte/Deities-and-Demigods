import { NextResponse } from 'next/server'
export const runtime = 'edge'
export async function GET() {
  const key = process.env.GEMINI_API_KEY || ''
  if (!key) return NextResponse.json({ error: 'No key' }, { status: 500 })
  return NextResponse.json({ key })
}