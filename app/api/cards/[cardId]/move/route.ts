import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
  const { toListId, position } = await req.json()
  const card = await prisma.card.update({
    where: { id: params.cardId },
    data: { listId: toListId, position },
  })
  return NextResponse.json(card)
}
