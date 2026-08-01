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
      return NextResponse.json({ baby: null, bowel: [], growth: [], vaccines: [], appointments: [] });
    }

    const bowel = await prisma.bowelMovement.findMany({
      where: { babyId: baby.id },
      orderBy: { loggedAt: 'desc' },
    });

    const growth = await prisma.growthRecord.findMany({
      where: { babyId: baby.id },
      orderBy: { measuredAt: 'desc' },
    });

    const vaccines = await prisma.vaccineApplication.findMany({
      where: { babyId: baby.id },
      include: { vaccine: true },
      orderBy: { appliedAt: 'desc' },
    });

    const appointments = await prisma.medicalAppointment.findMany({
      where: { babyId: baby.id },
      orderBy: { appointmentDate: 'desc' },
    });

    return NextResponse.json({
      baby,
      bowel,
      growth,
      vaccines,
      appointments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        color,
        consistency,
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
