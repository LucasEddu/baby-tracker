import { prisma } from '@/lib/prisma';
import {
  getBabiesFS,
  getBowelMovementsFS,
  createBowelMovementFS,
  updateBowelMovementFS,
  deleteBowelMovementFS,
  getFeedingsFS,
  getGrowthFS,
  getVaccinesFS,
  getAppointmentsFS,
} from '@/lib/firebaseStore';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    const validBabyId = (babyId && babyId !== 'undefined' && babyId !== 'null' && babyId !== '') ? babyId : null;

    let babies = await getBabiesFS();
    if (!babies || babies.length === 0) {
      try { babies = await prisma.baby.findMany({ orderBy: { createdAt: 'desc' } }); } catch (e) {}
    }

    const defaultBaby = {
      id: 'demo-baby-id',
      name: 'Bebê Noah',
      birthDate: '2026-02-15T00:00:00.000Z',
      gender: 'male',
    };

    const targetBaby = (validBabyId ? babies.find((b: any) => b.id === validBabyId) : babies[0]) || defaultBaby;

    let bowel = await getBowelMovementsFS(targetBaby.id);
    let feedings = await getFeedingsFS(targetBaby.id);
    let growth = await getGrowthFS(targetBaby.id);
    let vaccines = await getVaccinesFS(targetBaby.id);
    let appointments = await getAppointmentsFS(targetBaby.id);
    let napSessions: any[] = [];

    // Fallback para Prisma se Firestore estiver sem dados
    if (bowel.length === 0) {
      try { bowel = await prisma.bowelMovement.findMany({ where: { babyId: targetBaby.id }, orderBy: { loggedAt: 'desc' } }); } catch (e) {}
    }
    if (feedings.length === 0) {
      try { feedings = await prisma.feedingLog.findMany({ where: { babyId: targetBaby.id }, orderBy: { startedAt: 'desc' } }); } catch (e) {}
    }
    if (growth.length === 0) {
      try { growth = await prisma.growthRecord.findMany({ where: { babyId: targetBaby.id }, orderBy: { measuredAt: 'desc' } }); } catch (e) {}
    }
    if (vaccines.length === 0) {
      try { vaccines = await prisma.vaccineApplication.findMany({ where: { babyId: targetBaby.id }, include: { vaccine: true }, orderBy: { appliedAt: 'desc' } }); } catch (e) {}
    }
    if (appointments.length === 0) {
      try { appointments = await prisma.medicalAppointment.findMany({ where: { babyId: targetBaby.id }, orderBy: { appointmentDate: 'desc' } }); } catch (e) {}
    }
    try { napSessions = await (prisma as any).napSession.findMany({ where: { babyId: targetBaby.id }, orderBy: { startedAt: 'desc' } }); } catch (e) {}

    // Início de hoje (meia-noite)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayDiaperCount = bowel.filter((b: any) => new Date(b.loggedAt || b.createdAt || 0) >= startOfToday).length;

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
      baby: { id: 'demo-baby-id', name: 'Bebê Noah', birthDate: '2026-02-15T00:00:00.000Z', gender: 'male' },
      bowel: [], growth: [], vaccines: [], appointments: [], feedings: [], napSessions: [], todayDiaperCount: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, userId, type, color, consistency, notes } = body;

    const fsData = {
      babyId,
      userId: userId || 'demo-user',
      type,
      color: color || (type === 'POOP' || type === 'BOTH' ? 'YELLOW' : null),
      consistency: consistency || (type === 'POOP' || type === 'BOTH' ? 'PASTY' : null),
      notes,
      loggedAt: new Date().toISOString(),
    };

    const fsRecord = await createBowelMovementFS(fsData);

    try {
      await prisma.bowelMovement.create({
        data: {
          id: fsRecord?.id,
          babyId,
          userId: userId || (await prisma.user.findFirst())?.id || 'demo-user',
          type,
          color: fsData.color,
          consistency: fsData.consistency,
          notes,
          loggedAt: new Date(),
        },
      });
    } catch (e) {}

    return NextResponse.json(fsRecord || fsData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, type, color, consistency, notes } = body;

    await updateBowelMovementFS(id, { type, color, consistency, notes });
    try {
      await prisma.bowelMovement.update({ where: { id }, data: { type, color, consistency, notes } });
    } catch (e) {}

    return NextResponse.json({ success: true, id, type, color, consistency, notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteBowelMovementFS(id);
    try { await prisma.bowelMovement.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
