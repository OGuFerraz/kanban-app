import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const { name, email } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 })

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
  const color = colors[Math.floor(Math.random() * colors.length)]

  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email, color },
    update: { name },
  })
  return NextResponse.json(user)
}
