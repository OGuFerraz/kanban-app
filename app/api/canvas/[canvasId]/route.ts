import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { canvasId: string } }) {
  const canvas = await prisma.canvas.findUnique({
    where: { id: params.canvasId },
    include: {
      team: { select: { name: true } },
      elements: { orderBy: { id: 'asc' } },
      edges: true,
    },
  })
  if (!canvas) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(canvas)
}

export async function PATCH(req: Request, { params }: { params: { canvasId: string } }) {
  const data = await req.json()
  const canvas = await prisma.canvas.update({ where: { id: params.canvasId }, data })
  return NextResponse.json(canvas)
}

export async function DELETE(_req: Request, { params }: { params: { canvasId: string } }) {
  await prisma.canvas.delete({ where: { id: params.canvasId } })
  return NextResponse.json({ ok: true })
}
