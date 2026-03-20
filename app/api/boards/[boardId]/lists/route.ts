import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { boardId: string } }) {
  const { title, position } = await req.json()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const list = await prisma.list.create({
    data: { title, position: position ?? 1000, boardId: params.boardId },
    include: { cards: true },
  })
  return NextResponse.json(list, { status: 201 })
}
