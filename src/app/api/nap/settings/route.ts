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
      return NextResponse.json({ micSensitivity: 'medium', defaultWhiteNoise: 'white_noise' });
    }

    const settings = await (prisma as any).napSettings.findUnique({
      where: { babyId: baby.id },
    });

    if (!settings) {
      return NextResponse.json({
        babyId: baby.id,
        micSensitivity: 'medium',
        defaultWhiteNoise: 'white_noise',
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, micSensitivity, defaultWhiteNoise } = body;

    let targetBabyId = babyId;
    if (!targetBabyId) {
      const firstBaby = await prisma.baby.findFirst();
      if (!firstBaby) return NextResponse.json({ error: 'Nenhum bebê cadastrado' }, { status: 400 });
      targetBabyId = firstBaby.id;
    }

    const settings = await (prisma as any).napSettings.upsert({
      where: { babyId: targetBabyId },
      update: {
        micSensitivity: micSensitivity || 'medium',
        defaultWhiteNoise: defaultWhiteNoise || 'white_noise',
      },
      create: {
        babyId: targetBabyId,
        micSensitivity: micSensitivity || 'medium',
        defaultWhiteNoise: defaultWhiteNoise || 'white_noise',
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
