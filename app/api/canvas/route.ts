import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const canvases = await prisma.canvas.findMany({
    include: { team: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(canvases)
}

export async function POST(req: Request) {
  const { title, teamId } = await req.json()
  const canvas = await prisma.canvas.create({
    data: { title, teamId },
    include: { team: { select: { name: true } } },
  })
  return NextResponse.json(canvas)
}
