import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { boardId: string } }) {
  const { name, color } = await req.json()
  const label = await prisma.label.create({
    data: { name: name ?? '', color: color ?? '#61bd4f', boardId: params.boardId },
  })
  return NextResponse.json(label, { status: 201 })
}
