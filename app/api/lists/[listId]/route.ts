import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { listId: string } }) {
  const list = await prisma.list.findUnique({ where: { id: params.listId } })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(list)
}

export async function PATCH(req: Request, { params }: { params: { listId: string } }) {
  const data = await req.json()
  const list = await prisma.list.update({ where: { id: params.listId }, data })
  return NextResponse.json(list)
}

export async function DELETE(_req: Request, { params }: { params: { listId: string } }) {
  await prisma.list.delete({ where: { id: params.listId } })
  return NextResponse.json({ ok: true })
}
