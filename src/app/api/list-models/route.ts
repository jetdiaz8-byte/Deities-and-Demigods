import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!key) {
    return NextResponse.json({ 
      error: 'NO_KEY_FOUND', 
      envKeys: Object.keys(process.env).filter(k => k.toLowerCase().includes('gemini') || k.toLowerCase().includes('google'))
    });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const text = await res.text();
    return NextResponse.json({ 
      status: res.status,
      raw: JSON.parse(text),
      geminiModels: (JSON.parse(text).models || [])
        .map((m: { name: string }) => m.name.replace('models/', ''))
        .filter((n: string) => n.toLowerCase().includes('gemini'))
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg });
  }
}
