import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { userId } = await req.json()
  await prisma.cardMember.upsert({
    where: { cardId_userId: { cardId: params.cardId, userId } },
    create: { cardId: params.cardId, userId },
    update: {},
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: { cardId: string } }) {
  const { userId } = await req.json()
  await prisma.cardMember.delete({
    where: { cardId_userId: { cardId: params.cardId, userId } },
  })
  return NextResponse.json({ ok: true })
}
