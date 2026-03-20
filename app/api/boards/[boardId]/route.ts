import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { boardId: string } }) {
  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    include: {
      team: { select: { id: true, name: true, members: { include: { user: true } } } },
      labels: true,
      lists: {
        where: { isArchived: false },
        orderBy: { position: 'asc' },
        include: {
          cards: {
            where: { isArchived: false },
            orderBy: { position: 'asc' },
            include: {
              labels: { include: { label: true } },
              members: { include: { user: true } },
              attachments: { where: { isCover: true }, take: 1 },
              _count: { select: { checklists: true, attachments: true, comments: true } },
            },
          },
        },
      },
    },
  })

  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(board)
}

export async function PATCH(req: Request, { params }: { params: { boardId: string } }) {
  const data = await req.json()
  const board = await prisma.board.update({
    where: { id: params.boardId },
    data,
  })
  return NextResponse.json(board)
}

export async function DELETE(_req: Request, { params }: { params: { boardId: string } }) {
  await prisma.board.delete({ where: { id: params.boardId } })
  return NextResponse.json({ ok: true })
}
