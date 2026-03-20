import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { checklistId: string } }) {
  const data = await req.json()
  const checklist = await prisma.checklist.update({ where: { id: params.checklistId }, data })
  return NextResponse.json(checklist)
}

export async function DELETE(_req: Request, { params }: { params: { checklistId: string } }) {
  await prisma.checklist.delete({ where: { id: params.checklistId } })
  return NextResponse.json({ ok: true })
}
