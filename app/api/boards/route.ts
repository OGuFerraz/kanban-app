import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const boards = await prisma.board.findMany({
    where: { isArchived: false },
    include: {
      team: { select: { name: true, id: true } },
      _count: { select: { lists: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(boards)
}

export async function POST(req: Request) {
  const { title, teamId, coverColor, description } = await req.json()
  if (!title || !teamId) {
    return NextResponse.json({ error: 'title and teamId are required' }, { status: 400 })
  }

  const board = await prisma.board.create({
    data: {
      title,
      teamId,
      coverColor: coverColor ?? '#1e3a5f',
      description,
    },
    include: { team: { select: { name: true } } },
  })

  // Create default labels for the board
  await prisma.label.createMany({
    data: [
      { name: '', color: '#61bd4f', boardId: board.id },
      { name: '', color: '#f2d600', boardId: board.id },
      { name: '', color: '#ff9f1a', boardId: board.id },
      { name: '', color: '#eb5a46', boardId: board.id },
      { name: '', color: '#c377e0', boardId: board.id },
      { name: '', color: '#0079bf', boardId: board.id },
    ],
  })

  return NextResponse.json(board, { status: 201 })
}
