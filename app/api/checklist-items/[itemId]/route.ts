import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { itemId: string } }) {
  const data = await req.json()
  const item = await prisma.checklistItem.update({ where: { id: params.itemId }, data })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: { itemId: string } }) {
  await prisma.checklistItem.delete({ where: { id: params.itemId } })
  return NextResponse.json({ ok: true })
}
