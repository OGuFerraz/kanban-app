import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create teams
  const marketing = await prisma.team.upsert({
    where: { slug: 'marketing' },
    update: {},
    create: { name: 'Marketing', slug: 'marketing' },
  })

  const producao = await prisma.team.upsert({
    where: { slug: 'producao' },
    update: {},
    create: { name: 'Produção', slug: 'producao' },
  })

  // Create users
  const luiz = await prisma.user.upsert({
    where: { email: 'luiz@kanban.app' },
    update: {},
    create: { name: 'Luiz Ferraz', email: 'luiz@kanban.app', color: '#6366f1' },
  })

  const ana = await prisma.user.upsert({
    where: { email: 'ana@kanban.app' },
    update: {},
    create: { name: 'Ana Silva', email: 'ana@kanban.app', color: '#ec4899' },
  })

  // Add users to team
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: luiz.id, teamId: marketing.id } },
    update: {},
    create: { userId: luiz.id, teamId: marketing.id, role: 'admin' },
  })
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: ana.id, teamId: marketing.id } },
    update: {},
    create: { userId: ana.id, teamId: marketing.id, role: 'member' },
  })
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: luiz.id, teamId: producao.id } },
    update: {},
    create: { userId: luiz.id, teamId: producao.id, role: 'admin' },
  })

  // Create "Live - Mounjaro" board
  const board = await prisma.board.create({
    data: {
      title: 'Live - Mounjaro',
      coverColor: '#1e3a5f',
      teamId: marketing.id,
    },
  })

  // Create labels
  const labels = await Promise.all([
    prisma.label.create({ data: { name: 'Urgente', color: '#eb5a46', boardId: board.id } }),
    prisma.label.create({ data: { name: 'Conteúdo', color: '#0079bf', boardId: board.id } }),
    prisma.label.create({ data: { name: 'Design', color: '#c377e0', boardId: board.id } }),
    prisma.label.create({ data: { name: 'Concluído', color: '#61bd4f', boardId: board.id } }),
    prisma.label.create({ data: { name: '', color: '#f2d600', boardId: board.id } }),
  ])

  // Create Lists
  const listNames = [
    'CAPTAÇÃO',
    'Youtube',
    'WPP - REGRAS',
    'GRUPO WPP - DIA 1',
    'GRUPO WPP - DIA 2',
    'GRUPO WPP - DIA 3',
    'DIA DE LIVE',
  ]

  const lists = []
  for (let i = 0; i < listNames.length; i++) {
    const list = await prisma.list.create({
      data: { title: listNames[i], position: (i + 1) * 1000, boardId: board.id },
    })
    lists.push(list)
  }

  // Add cards to CAPTAÇÃO
  const card1 = await prisma.card.create({
    data: { title: 'FIM DO MOUNJARO', position: 1000, listId: lists[0].id, description: 'Arte principal da live. Verificar dimensões e cores.' },
  })
  await prisma.card.create({ data: { title: '🎨 Todas as ARTES', position: 2000, listId: lists[0].id } })
  await prisma.card.create({ data: { title: 'GRAVAR', position: 3000, listId: lists[0].id, coverColor: '#eb5a46' } })

  // Add labels to card1
  await prisma.cardLabel.create({ data: { cardId: card1.id, labelId: labels[1].id } })

  // Card with checklist
  const card2 = await prisma.card.create({
    data: { title: 'LIVE - YOUTUBE', position: 1000, listId: lists[1].id, description: 'Preparar tudo para a live de segunda.' },
  })
  const checklist = await prisma.checklist.create({
    data: { title: 'Preparação', position: 1000, cardId: card2.id },
  })
  await prisma.checklistItem.createMany({
    data: [
      { title: 'Configurar OBS', position: 1000, checklistId: checklist.id, isChecked: true },
      { title: 'Testar áudio', position: 2000, checklistId: checklist.id, isChecked: true },
      { title: 'Preparar slides', position: 3000, checklistId: checklist.id, isChecked: false },
      { title: 'Divulgar nas redes', position: 4000, checklistId: checklist.id, isChecked: false },
    ],
  })

  // WPP REGRAS
  await prisma.card.create({ data: { title: '1 - Descrição', position: 1000, listId: lists[2].id, description: '🔥 BEM-VINDO AO GRUPO VIP — MÉTODO VSLIM\n\nVocê chegou aqui porque quer entender por que algumas pessoas usam Mounjaro e não têm resultado.\n\nVocê está no lugar certo. 💉' } })
  await prisma.card.create({ data: { title: 'Boas Vindas', position: 2000, listId: lists[2].id } })

  // GRUPO WPP DIA 1
  await prisma.card.create({ data: { title: '🎙 Bom dia', position: 1000, listId: lists[3].id } })
  await prisma.card.create({ data: { title: 'Interação', position: 2000, listId: lists[3].id } })
  await prisma.card.create({ data: { title: 'Enquete 01', position: 3000, listId: lists[3].id } })
  await prisma.card.create({ data: { title: 'Mini Insight', position: 4000, listId: lists[3].id } })

  // GRUPO WPP DIA 2 - with member
  const card3 = await prisma.card.create({ data: { title: 'Bom dia', position: 1000, listId: lists[4].id } })
  await prisma.card.create({ data: { title: 'Enquete 01', position: 2000, listId: lists[4].id } })
  await prisma.card.create({ data: { title: 'Enquete 02', position: 3000, listId: lists[4].id } })
  const card4 = await prisma.card.create({ data: { title: '#2 - PROVA SOCIAL', position: 4000, listId: lists[4].id, coverColor: '#eb5a46' } })
  await prisma.cardLabel.create({ data: { cardId: card4.id, labelId: labels[0].id } })
  await prisma.cardMember.create({ data: { cardId: card4.id, userId: luiz.id } })
  await prisma.card.create({ data: { title: 'Mini Insight', position: 5000, listId: lists[4].id } })
  await prisma.card.create({ data: { title: '#2 - CONTEÚDO BASTIDORES', position: 6000, listId: lists[4].id } })
  await prisma.card.create({ data: { title: 'Encerramento', position: 7000, listId: lists[4].id } })

  // Add comment
  await prisma.comment.create({
    data: { content: 'Conteúdo aprovado! Pode seguir com a publicação.', cardId: card1.id, authorId: luiz.id },
  })

  // Create second board
  const board2 = await prisma.board.create({
    data: { title: 'Produção de Conteúdo', coverColor: '#1e4d5f', teamId: producao.id },
  })
  const l1 = await prisma.list.create({ data: { title: 'Backlog', position: 1000, boardId: board2.id } })
  const l2 = await prisma.list.create({ data: { title: 'Em Andamento', position: 2000, boardId: board2.id } })
  const l3 = await prisma.list.create({ data: { title: 'Revisão', position: 3000, boardId: board2.id } })
  await prisma.list.create({ data: { title: 'Publicado', position: 4000, boardId: board2.id } })
  await prisma.card.create({ data: { title: 'Roteiro episódio 01', position: 1000, listId: l1.id } })
  await prisma.card.create({ data: { title: 'Thumbnail da semana', position: 2000, listId: l1.id } })
  await prisma.card.create({ data: { title: 'Edição do vídeo', position: 1000, listId: l2.id, dueDate: new Date('2026-03-25').toISOString() } })
  await prisma.card.create({ data: { title: 'Post Instagram', position: 1000, listId: l3.id } })

  console.log('✅ Seed completed!')
  console.log(`   Team "Marketing" created with board "Live - Mounjaro"`)
  console.log(`   Team "Produção" created with board "Produção de Conteúdo"`)
  console.log(`   Users: Luiz Ferraz, Ana Silva`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
