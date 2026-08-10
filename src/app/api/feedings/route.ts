import { prisma } from '@/lib/prisma';
import { getFeedingsFS, createFeedingFS, deleteFeedingFS, getBabiesFS } from '@/lib/firebaseStore';
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
    const { babyId, side, durationSec, amountMl, notes } = body;

    const fsRecord = await createFeedingFS({
      babyId,
      side,
      durationSec: parseInt(durationSec || 0, 10),
      amountMl: amountMl ? parseInt(amountMl, 10) : null,
      notes,
    });

    try {
      await prisma.feedingLog.create({
        data: {
          id: fsRecord?.id,
          babyId,
          side,
          durationSec: parseInt(durationSec || 0, 10),
          amountMl: amountMl ? parseInt(amountMl, 10) : null,
          startedAt: new Date(),
          notes,
        },
      });
    } catch (e) {}

    return NextResponse.json(fsRecord || { babyId, side, durationSec, amountMl, notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteFeedingFS(id);
    try { await prisma.feedingLog.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
