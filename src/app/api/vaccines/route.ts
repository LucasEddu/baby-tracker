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
      return NextResponse.json({ error: 'Nenhum bebê encontrado' }, { status: 404 });
    }

    const allVaccines = await prisma.vaccine.findMany({
      orderBy: { targetAgeMonths: 'asc' },
    });

    const applications = await prisma.vaccineApplication.findMany({
      where: { babyId: baby.id },
      include: { vaccine: true },
    });

    const appliedVaccineIds = new Set(applications.map((app) => app.vaccineId));

    const result = allVaccines.map((v) => {
      const app = applications.find((a) => a.vaccineId === v.id);
      return {
        ...v,
        applied: !!app,
        applicationDetails: app || null,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, vaccineId, appliedAt, lotNumber, location, sideEffects } = body;

    const record = await prisma.vaccineApplication.create({
      data: {
        babyId,
        vaccineId,
        appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
        lotNumber,
        location,
        sideEffects,
      },
    });

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
