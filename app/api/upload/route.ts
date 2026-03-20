import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const blob = await put(file.name, file, { access: 'public' })

  return NextResponse.json({
    url: blob.url,
    name: file.name,
    mimeType: file.type,
    size: file.size,
  })
}
