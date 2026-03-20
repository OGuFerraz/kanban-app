import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { cardId: string } }) {
  const comments = await prisma.comment.findMany({
    where: { cardId: params.cardId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(comments)
}

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { content, authorId } = await req.json()
  if (!content || !authorId) {
    return NextResponse.json({ error: 'content and authorId required' }, { status: 400 })
  }
  const comment = await prisma.comment.create({
    data: { content, cardId: params.cardId, authorId },
    include: { author: true },
  })
  return NextResponse.json(comment, { status: 201 })
}
