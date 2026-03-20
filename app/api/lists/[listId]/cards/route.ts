import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { listId: string } }) {
  const { title, position } = await req.json()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const card = await prisma.card.create({
    data: { title, position: position ?? 1000, listId: params.listId },
    include: {
      labels: { include: { label: true } },
      members: { include: { user: true } },
      checklists: { include: { items: true } },
      attachments: true,
      comments: { include: { author: true } },
    },
  })
  return NextResponse.json(card, { status: 201 })
}
