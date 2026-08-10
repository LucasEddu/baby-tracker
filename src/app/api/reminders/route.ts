import { prisma } from '@/lib/prisma';
import { getRemindersFS, createReminderFS, deleteReminderFS, getBabiesFS } from '@/lib/firebaseStore';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    let targetBabyId = (babyId && babyId !== 'undefined' && babyId !== 'null' && babyId !== '') ? babyId : '';

    if (!targetBabyId) {
      const babies = await getBabiesFS();
      targetBabyId = babies[0]?.id || '';
    }

    let reminders = await getRemindersFS(targetBabyId || undefined);

    if (!reminders || reminders.length === 0) {
      try {
        const baby = targetBabyId
          ? await prisma.baby.findUnique({ where: { id: targetBabyId } })
          : await prisma.baby.findFirst();
        reminders = await prisma.reminder.findMany({
          where: baby ? { babyId: baby.id } : undefined,
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbErr) {}
    }

    return NextResponse.json(reminders || []);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, title, content, color } = body;

    let targetBabyId = babyId;
    if (!targetBabyId) {
      const babies = await getBabiesFS();
      targetBabyId = babies[0]?.id || 'demo-baby-id';
    }

    const fsRecord = await createReminderFS({
      babyId: targetBabyId,
      title,
      content,
      color: color || 'yellow',
    });

    try {
      await prisma.reminder.create({
        data: {
          id: fsRecord?.id,
          babyId: targetBabyId,
          title,
          content,
          color: color || 'yellow',
        },
      });
    } catch (dbErr) {}

    return NextResponse.json(fsRecord || {
      id: `rem-${Date.now()}`,
      babyId: targetBabyId,
      title,
      content,
      color: color || 'yellow',
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteReminderFS(id);
    try { await prisma.reminder.delete({ where: { id } }); } catch (dbErr) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: true });
  }
}
