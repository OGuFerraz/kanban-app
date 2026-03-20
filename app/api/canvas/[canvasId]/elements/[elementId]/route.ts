import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { elementId: string } }) {
  const data = await req.json()
  const element = await prisma.canvasElement.update({ where: { id: params.elementId }, data })
  return NextResponse.json(element)
}

export async function DELETE(_req: Request, { params }: { params: { elementId: string } }) {
  await prisma.canvasElement.delete({ where: { id: params.elementId } })
  return NextResponse.json({ ok: true })
}
