import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');

    const baby = babyId
      ? await prisma.baby.findUnique({ where: { id: babyId } })
      : await prisma.baby.findFirst();

    if (!baby) return NextResponse.json([]);

    const sessions = await (prisma as any).napSession.findMany({
      where: { babyId: baby.id },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, userId, startedAt, endedAt, durationMinutes, endReason, whiteNoiseUsed } = body;

    let targetBabyId = babyId;
    let targetUserId = userId;

    if (!targetBabyId) {
      const firstBaby = await prisma.baby.findFirst();
      if (!firstBaby) return NextResponse.json({ error: 'Nenhum bebê cadastrado' }, { status: 400 });
      targetBabyId = firstBaby.id;
    }

    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        targetUserId = firstUser.id;
      } else {
        // Criar usuário padrão se não existir nenhum
        const newUser = await prisma.user.create({
          data: {
            name: 'Responsável',
            email: 'parent@babytracker.app',
            passwordHash: 'demo',
          },
        });
        targetUserId = newUser.id;
      }
    }

    const napSession = await (prisma as any).napSession.create({
      data: {
        babyId: targetBabyId,
        userId: targetUserId,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: endedAt ? new Date(endedAt) : new Date(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
        endReason: endReason || 'manual',
        whiteNoiseUsed: whiteNoiseUsed || null,
      },
    });

    return NextResponse.json(napSession);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
