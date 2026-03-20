import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function PATCH(req: Request, { params }: { params: { attachmentId: string } }) {
  const data = await req.json()
  const attachment = await prisma.attachment.update({
    where: { id: params.attachmentId },
    data,
  })
  return NextResponse.json(attachment)
}

export async function DELETE(_req: Request, { params }: { params: { attachmentId: string } }) {
  const attachment = await prisma.attachment.findUnique({ where: { id: params.attachmentId } })
  if (attachment) {
    await prisma.attachment.delete({ where: { id: params.attachmentId } })
    if (attachment.url.startsWith('/uploads/')) {
      try {
        await unlink(join(process.cwd(), 'public', attachment.url))
      } catch { /* file may not exist */ }
    }
  }
  return NextResponse.json({ ok: true })
}
