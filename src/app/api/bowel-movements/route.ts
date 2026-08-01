import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');

    const validBabyId = (babyId && babyId !== 'undefined' && babyId !== 'null') ? babyId : null;

    let baby: any = null;
    try {
      baby = validBabyId
        ? await prisma.baby.findUnique({ where: { id: validBabyId } })
        : await prisma.baby.findFirst();
    } catch (err) {}

    const defaultBaby = {
      id: 'demo-baby-id',
      name: 'Bebê Noah',
      birthDate: '2026-02-15T00:00:00.000Z',
      gender: 'male',
    };

    const targetBaby = baby || defaultBaby;

    let bowel: any[] = [];
    let todayDiaperCount = 0;
    let growth: any[] = [];
    let vaccines: any[] = [];
    let appointments: any[] = [];
    let feedings: any[] = [];
    let napSessions: any[] = [];

    try {
      bowel = await prisma.bowelMovement.findMany({
        where: { babyId: targetBaby.id },
        orderBy: { loggedAt: 'desc' },
      });

      todayDiaperCount = await prisma.bowelMovement.count({
        where: {
          babyId: targetBaby.id,
          loggedAt: { gte: startOfToday },
        },
      });

      growth = await prisma.growthRecord.findMany({
        where: { babyId: targetBaby.id },
        orderBy: { measuredAt: 'desc' },
      });

      vaccines = await prisma.vaccineApplication.findMany({
        where: { babyId: targetBaby.id },
        include: { vaccine: true },
        orderBy: { appliedAt: 'desc' },
      });

      appointments = await prisma.medicalAppointment.findMany({
        where: { babyId: targetBaby.id },
        orderBy: { appointmentDate: 'desc' },
      });

      feedings = await prisma.feedingLog.findMany({
        where: { babyId: targetBaby.id },
        orderBy: { startedAt: 'desc' },
      });

      napSessions = await (prisma as any).napSession.findMany({
        where: { babyId: targetBaby.id },
        orderBy: { startedAt: 'desc' },
      });
    } catch (err) {}

    return NextResponse.json({
      baby: targetBaby,
      bowel,
      growth,
      vaccines,
      appointments,
      feedings,
      napSessions,
      todayDiaperCount,
    });
  } catch (error: any) {
    return NextResponse.json({
      baby: {
        id: 'demo-baby-id',
        name: 'Bebê Noah',
        birthDate: '2026-02-15T00:00:00.000Z',
        gender: 'male',
      },
      bowel: [],
      growth: [],
      vaccines: [],
      appointments: [],
      feedings: [],
      napSessions: [],
      todayDiaperCount: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, userId, type, color, consistency, notes } = body;

    const record = await prisma.bowelMovement.create({
      data: {
        babyId,
        userId: userId || (await prisma.user.findFirst())?.id || 'demo-user',
        type,
        color: color || (type === 'POOP' || type === 'BOTH' ? 'YELLOW' : null),
        consistency: consistency || (type === 'POOP' || type === 'BOTH' ? 'PASTY' : null),
        notes,
        loggedAt: new Date(),
      },
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, type, color, consistency, notes } = body;

    const record = await prisma.bowelMovement.update({
      where: { id },
      data: {
        type,
        color,
        consistency,
        notes,
      },
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await prisma.bowelMovement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
