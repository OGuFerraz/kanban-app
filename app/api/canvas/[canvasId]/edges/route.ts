import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { canvasId: string } }) {
  const data = await req.json()
  const edge = await prisma.canvasEdge.create({
    data: { ...data, canvasId: params.canvasId },
  })
  return NextResponse.json(edge)
}
