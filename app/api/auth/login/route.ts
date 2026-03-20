import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  // Users created before auth (no password) — allow login by email only if no password set
  if (!user.password) {
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      color: user.color,
    })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    color: user.color,
  })
}
