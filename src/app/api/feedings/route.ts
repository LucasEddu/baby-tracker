import { prisma } from '@/lib/prisma';
import {
  getFeedingsFS,
  createFeedingFS,
  updateFeedingFS,
  deleteFeedingFS,
  getBabiesFS,
} from '@/lib/firebaseStore';
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

    let feedings = await getFeedingsFS(targetBabyId || undefined);
    if (!feedings || feedings.length === 0) {
      try {
        const baby = targetBabyId
          ? await prisma.baby.findUnique({ where: { id: targetBabyId } })
          : await prisma.baby.findFirst();
        if (baby) {
          feedings = await prisma.feedingLog.findMany({
            where: { babyId: baby.id },
            orderBy: { startedAt: 'desc' },
          });
        }
      } catch (e) {}
    }

    return NextResponse.json(feedings || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, babyId, side, durationSec, amountMl, notes, startedAt, isPaused, pauseReason, status } = body;

    // Se fornecido ID, trata-se da atualização/finalização de uma mamada existente
    if (id) {
      const updateData: any = {
        side,
        durationSec: durationSec !== undefined ? parseInt(durationSec, 10) : 0,
        amountMl: amountMl ? parseInt(amountMl, 10) : null,
        notes: notes || null,
        isPaused: Boolean(isPaused),
        pauseReason: pauseReason || null,
        status: status || 'FINISHED',
        ...(status === 'FINISHED' && { endedAt: new Date().toISOString() }),
      };

      const fsUpdated = await updateFeedingFS(id, updateData);

      try {
        await prisma.feedingLog.update({
          where: { id },
          data: {
            side,
            durationSec: updateData.durationSec,
            amountMl: updateData.amountMl,
            notes: updateData.notes,
          },
        });
      } catch (e) {}

      return NextResponse.json(fsUpdated || { id, ...updateData });
    }

    // Caso contrário, trata-se de um novo registro (em andamento RUNNING ou finalizado)
    const isRunning = status === 'RUNNING' || (!durationSec && status !== 'FINISHED');
    const recordData = {
      babyId,
      side,
      durationSec: durationSec ? parseInt(durationSec, 10) : 0,
      amountMl: amountMl ? parseInt(amountMl, 10) : null,
      notes: notes || (isRunning ? `Mamada em andamento (${side})` : `Registro de mamada`),
      startedAt: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      isPaused: Boolean(isPaused),
      pauseReason: pauseReason || null,
      status: isRunning ? 'RUNNING' : 'FINISHED',
    };

    const fsRecord = await createFeedingFS(recordData);

    try {
      await prisma.feedingLog.create({
        data: {
          id: fsRecord?.id,
          babyId,
          side,
          durationSec: recordData.durationSec,
          amountMl: recordData.amountMl,
          startedAt: new Date(recordData.startedAt),
          notes: recordData.notes,
        },
      });
    } catch (e) {}

    return NextResponse.json(fsRecord || { id: `feed-${Date.now()}`, ...recordData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteFeedingFS(id);
    try { await prisma.feedingLog.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
