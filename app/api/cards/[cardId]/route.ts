import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { cardId: string } }) {
  const card = await prisma.card.findUnique({
    where: { id: params.cardId },
    include: {
      labels: { include: { label: true } },
      members: { include: { user: true } },
      checklists: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } },
      attachments: { orderBy: { createdAt: 'desc' } },
      comments: { orderBy: { createdAt: 'asc' }, include: { author: true } },
    },
  })
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(card)
}

export async function PATCH(req: Request, { params }: { params: { cardId: string } }) {
  const data = await req.json()
  const card = await prisma.card.update({
    where: { id: params.cardId },
    data,
    include: {
      labels: { include: { label: true } },
      members: { include: { user: true } },
      checklists: { orderBy: { position: 'asc' }, include: { items: { orderBy: { position: 'asc' } } } },
      attachments: { orderBy: { createdAt: 'desc' } },
      comments: { orderBy: { createdAt: 'asc' }, include: { author: true } },
    },
  })
  return NextResponse.json(card)
}

export async function DELETE(_req: Request, { params }: { params: { cardId: string } }) {
  await prisma.card.delete({ where: { id: params.cardId } })
  return NextResponse.json({ ok: true })
}
