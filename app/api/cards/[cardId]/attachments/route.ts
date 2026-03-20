import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { url, name, mimeType, size } = await req.json()
  const attachment = await prisma.attachment.create({
    data: { url, name, mimeType, size, cardId: params.cardId },
  })
  return NextResponse.json(attachment, { status: 201 })
}
