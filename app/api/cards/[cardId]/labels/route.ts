import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { labelId } = await req.json()
  await prisma.cardLabel.upsert({
    where: { cardId_labelId: { cardId: params.cardId, labelId } },
    create: { cardId: params.cardId, labelId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: { cardId: string } }) {
  const { labelId } = await req.json()
  await prisma.cardLabel.delete({
    where: { cardId_labelId: { cardId: params.cardId, labelId } },
  })
  return NextResponse.json({ ok: true })
}
