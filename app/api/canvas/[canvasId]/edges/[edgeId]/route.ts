import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: { edgeId: string } }) {
  await prisma.canvasEdge.delete({ where: { id: params.edgeId } })
  return NextResponse.json({ ok: true })
}
