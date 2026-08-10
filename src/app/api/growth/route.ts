import { prisma } from '@/lib/prisma';
import { getGrowthFS, createGrowthFS, deleteGrowthFS, getBabiesFS } from '@/lib/firebaseStore';
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

    let records = await getGrowthFS(targetBabyId || undefined);
    if (!records || records.length === 0) {
      try {
        const baby = targetBabyId
          ? await prisma.baby.findUnique({ where: { id: targetBabyId } })
          : await prisma.baby.findFirst();
        if (baby) {
          records = await prisma.growthRecord.findMany({
            where: { babyId: baby.id },
            orderBy: { measuredAt: 'asc' },
          });
        }
      } catch (e) {}
    }

    // Sort ascending for growth chart
    records.sort((a: any, b: any) => new Date(a.measuredAt || 0).getTime() - new Date(b.measuredAt || 0).getTime());

    return NextResponse.json(records || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, userId, weightGrams, heightCm, headCircCm, source, measuredAt } = body;

    const fsRecord = await createGrowthFS({
      babyId,
      userId: userId || 'demo-user',
      weightGrams: parseInt(weightGrams, 10),
      heightCm: parseFloat(heightCm),
      headCircCm: headCircCm ? parseFloat(headCircCm) : null,
      source: source || 'HOME',
      measuredAt: measuredAt || new Date().toISOString(),
    });

    try {
      await prisma.growthRecord.create({
        data: {
          id: fsRecord?.id,
          babyId,
          userId: userId || (await prisma.user.findFirst())?.id || 'demo-user',
          weightGrams: parseInt(weightGrams, 10),
          heightCm: parseFloat(heightCm),
          headCircCm: headCircCm ? parseFloat(headCircCm) : null,
          source: source || 'HOME',
          measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        },
      });
    } catch (e) {}

    return NextResponse.json(fsRecord || body);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteGrowthFS(id);
    try { await prisma.growthRecord.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
