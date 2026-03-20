import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { checklistId: string } }) {
  const { title } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const count = await prisma.checklistItem.count({ where: { checklistId: params.checklistId } })
  const item = await prisma.checklistItem.create({
    data: { title, position: (count + 1) * 1000, checklistId: params.checklistId },
  })
  return NextResponse.json(item, { status: 201 })
}
