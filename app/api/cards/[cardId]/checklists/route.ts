import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { title } = await req.json()
  const count = await prisma.checklist.count({ where: { cardId: params.cardId } })
  const checklist = await prisma.checklist.create({
    data: { title: title ?? 'Checklist', position: (count + 1) * 1000, cardId: params.cardId },
    include: { items: true },
  })
  return NextResponse.json(checklist, { status: 201 })
}
