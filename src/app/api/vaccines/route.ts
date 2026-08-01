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

    let allVaccines = await prisma.vaccine.findMany({
      orderBy: { targetAgeMonths: 'asc' },
    });

    // Se as vacinas padrão ainda não foram populadas, inicializa o calendário nacional
    if (allVaccines.length === 0) {
      await prisma.vaccine.createMany({
        data: [
          { name: 'BCG', description: 'Proteção contra tuberculose', targetAgeMonths: 0 },
          { name: 'Hepatite B (1ª Dose)', description: 'Proteção contra hepatite B', targetAgeMonths: 0 },
          { name: 'Penta (1ª Dose)', description: 'Difteria, Tétano, Coqueluche, Hep B, Hib', targetAgeMonths: 2 },
          { name: 'Pólio VIP (1ª Dose)', description: 'Vacina inativada contra poliomielite', targetAgeMonths: 2 },
          { name: 'Rotavírus (1ª Dose)', description: 'Proteção contra diarreia por rotavírus', targetAgeMonths: 2 },
          { name: 'Pneumocócica 10V (1ª Dose)', description: 'Infecções causadas por pneumococo', targetAgeMonths: 2 },
          { name: 'Meningocócica C (1ª Dose)', description: 'Meningite meningocócica C', targetAgeMonths: 3 },
          { name: 'Penta (2ª Dose)', description: 'Segunda dose do esquema quinqüivalente', targetAgeMonths: 4 },
          { name: 'Pólio VIP (2ª Dose)', description: 'Segunda dose de poliomielite', targetAgeMonths: 4 },
          { name: 'Meningocócica C (2ª Dose)', description: 'Segunda dose de meningite C', targetAgeMonths: 5 },
          { name: 'Penta (3ª Dose)', description: 'Terceira dose do esquema quinqüivalente', targetAgeMonths: 6 },
          { name: 'Febre Amarela (1ª Dose)', description: 'Imunização contra febre amarela', targetAgeMonths: 9 },
          { name: 'Tríplice Viral (1ª Dose)', description: 'Sarampo, Caxumba e Rubéola', targetAgeMonths: 12 },
          { name: 'Pneumocócica 10V (Reforço)', description: 'Dose de reforço anual', targetAgeMonths: 12 },
          { name: 'Meningocócica C (Reforço)', description: 'Dose de reforço anual', targetAgeMonths: 12 },
          { name: 'Hepatite A', description: 'Imunização contra hepatite A', targetAgeMonths: 15 },
          { name: 'DTP (1º Reforço)', description: 'Difteria, Tétano e Coqueluche', targetAgeMonths: 15 },
        ],
      });
      allVaccines = await prisma.vaccine.findMany({
        orderBy: { targetAgeMonths: 'asc' },
      });
    }

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
