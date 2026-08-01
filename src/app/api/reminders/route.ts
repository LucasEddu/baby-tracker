import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');

    const baby = babyId
      ? await prisma.baby.findUnique({ where: { id: babyId } })
      : await prisma.baby.findFirst();

    if (!baby) {
      return NextResponse.json([]);
    }

    const reminders = await prisma.reminder.findMany({
      where: { babyId: baby.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reminders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, title, content, color } = body;

    let targetBabyId = babyId;
    if (!targetBabyId) {
      const firstBaby = await prisma.baby.findFirst();
      if (!firstBaby) {
        return NextResponse.json({ error: 'Nenhum bebê cadastrado' }, { status: 400 });
      }
      targetBabyId = firstBaby.id;
    }

    const reminder = await prisma.reminder.create({
      data: {
        babyId: targetBabyId,
        title,
        content,
        color: color || 'yellow',
      },
    });

    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, content, color } = body;

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(color && { color }),
      },
    });

    return NextResponse.json(reminder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
