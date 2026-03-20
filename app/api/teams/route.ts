import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const teams = await prisma.team.findMany({
    include: {
      members: { include: { user: true } },
      _count: { select: { boards: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  const { name, slug } = await req.json()
  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }
  const team = await prisma.team.create({ data: { name, slug } })
  return NextResponse.json(team, { status: 201 })
}
