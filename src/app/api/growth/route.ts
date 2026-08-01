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

    const records = await prisma.growthRecord.findMany({
      where: { babyId: baby.id },
      orderBy: { measuredAt: 'asc' },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, userId, weightGrams, heightCm, headCircCm, source, measuredAt } = body;

    const record = await prisma.growthRecord.create({
      data: {
        babyId,
        userId: userId || (await prisma.user.findFirst())?.id || 'demo-user',
        weightGrams: parseInt(weightGrams, 10),
        heightCm: parseFloat(heightCm),
        headCircCm: headCircCm ? parseFloat(headCircCm) : null,
        source: source || 'HOME',
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
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
    const { id, weightGrams, heightCm, headCircCm, source } = body;

    const record = await prisma.growthRecord.update({
      where: { id },
      data: {
        weightGrams: parseInt(weightGrams, 10),
        heightCm: parseFloat(heightCm),
        headCircCm: headCircCm ? parseFloat(headCircCm) : null,
        source,
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

    await prisma.growthRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
