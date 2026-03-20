import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 })
  }

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashed, color },
  })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    color: user.color,
  }, { status: 201 })
}
