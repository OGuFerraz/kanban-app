import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { canvasId: string } }) {
  const data = await req.json()
  const element = await prisma.canvasElement.create({
    data: { ...data, canvasId: params.canvasId },
  })
  return NextResponse.json(element)
}
