import { prisma } from '@/lib/prisma';
import {
  getNapSessionsFS,
  createNapSessionFS,
  updateNapSessionFS,
  deleteNapSessionFS,
} from '@/lib/firebaseStore';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId') || undefined;

    let sessions = await getNapSessionsFS(babyId);
    if (!sessions || sessions.length === 0) {
      try {
        const baby = babyId
          ? await prisma.baby.findUnique({ where: { id: babyId } })
          : await prisma.baby.findFirst();

        if (baby) {
          sessions = await (prisma as any).napSession.findMany({
            where: { babyId: baby.id },
            orderBy: { startedAt: 'desc' },
          });
        }
      } catch (e) {}
    }

    return NextResponse.json(sessions || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, babyId, userId, startedAt, endedAt, durationMinutes, endReason, whiteNoiseUsed, status } = body;

    let targetBabyId = babyId;
    let targetUserId = userId;

    if (!targetBabyId) {
      const firstBaby = await prisma.baby.findFirst().catch(() => null);
      if (firstBaby) targetBabyId = firstBaby.id;
    }

    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst().catch(() => null);
      if (firstUser) {
        targetUserId = firstUser.id;
      }
    }

    // Se um ID for fornecido, trata-se da ATUALIZAÇÃO de uma soneca em andamento (finalização)
    if (id) {
      const updateData: any = {
        endedAt: endedAt ? new Date(endedAt).toISOString() : new Date().toISOString(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
        endReason: endReason || 'manual',
        status: status || 'FINISHED',
        ...(whiteNoiseUsed && { whiteNoiseUsed }),
      };

      const fsUpdated = await updateNapSessionFS(id, updateData);

      try {
        await (prisma as any).napSession.update({
          where: { id },
          data: {
            endedAt: endedAt ? new Date(endedAt) : new Date(),
            durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
            endReason: endReason || 'manual',
            whiteNoiseUsed: whiteNoiseUsed || null,
          },
        });
      } catch (e) {}

      return NextResponse.json(fsUpdated || { id, ...updateData });
    }

    // Caso contrário, trata-se de um NOVO REGISTRO de soneca (seja em andamento RUNNING ou já encerrada FINISHED)
    const isRunning = !endedAt || status === 'RUNNING';
    const recordData = {
      babyId: targetBabyId,
      userId: targetUserId || 'demo-user',
      startedAt: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      endedAt: isRunning ? null : (endedAt ? new Date(endedAt).toISOString() : new Date().toISOString()),
      durationMinutes: isRunning ? null : (durationMinutes ? parseInt(durationMinutes, 10) : 0),
      endReason: isRunning ? null : (endReason || 'manual'),
      whiteNoiseUsed: whiteNoiseUsed || null,
      status: isRunning ? 'RUNNING' : 'FINISHED',
    };

    const fsCreated = await createNapSessionFS(recordData);

    try {
      if (targetBabyId && targetUserId) {
        await (prisma as any).napSession.create({
          data: {
            id: fsCreated?.id,
            babyId: targetBabyId,
            userId: targetUserId,
            startedAt: new Date(recordData.startedAt),
            endedAt: isRunning ? null : new Date(recordData.endedAt!),
            durationMinutes: recordData.durationMinutes,
            endReason: recordData.endReason,
            whiteNoiseUsed: recordData.whiteNoiseUsed,
          },
        });
      }
    } catch (e) {}

    return NextResponse.json(fsCreated || { id: `nap-${Date.now()}`, ...recordData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID da soneca é obrigatório.' }, { status: 400 });

    await deleteNapSessionFS(id);
    try {
      await (prisma as any).napSession.delete({ where: { id } });
    } catch (e) {}

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
