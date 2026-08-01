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

    const feedings = await prisma.feedingLog.findMany({
      where: { babyId: baby.id },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json(feedings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, side, durationSec, amountMl, notes } = body;

    const feeding = await prisma.feedingLog.create({
      data: {
        babyId,
        side, // 'LEFT_BREAST' | 'RIGHT_BREAST' | 'BOTTLE'
        durationSec: parseInt(durationSec || 0, 10),
        amountMl: amountMl ? parseInt(amountMl, 10) : null,
        startedAt: new Date(),
        notes,
      },
    });

    return NextResponse.json(feeding);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await prisma.feedingLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
