import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { teamId: string } }) {
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const team = await prisma.team.update({
    where: { id: params.teamId },
    data: { name: name.trim() },
  })
  return NextResponse.json(team)
}

export async function DELETE(_req: Request, { params }: { params: { teamId: string } }) {
  await prisma.team.delete({ where: { id: params.teamId } })
  return NextResponse.json({ ok: true })
}
