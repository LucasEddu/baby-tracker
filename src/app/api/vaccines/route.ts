import { prisma } from '@/lib/prisma';
import { getVaccinesFS, createVaccineFS, getBabiesFS } from '@/lib/firebaseStore';
import { NextResponse } from 'next/server';

const DEFAULT_VACCINES = [
  { id: 'v1', name: 'BCG', description: 'Proteção contra tuberculose', targetAgeMonths: 0 },
  { id: 'v2', name: 'Hepatite B (1ª Dose)', description: 'Proteção contra hepatite B', targetAgeMonths: 0 },
  { id: 'v3', name: 'Penta (1ª Dose)', description: 'Difteria, Tétano, Coqueluche, Hep B, Hib', targetAgeMonths: 2 },
  { id: 'v4', name: 'Pólio VIP (1ª Dose)', description: 'Vacina inativada contra poliomielite', targetAgeMonths: 2 },
  { id: 'v5', name: 'Rotavírus (1ª Dose)', description: 'Proteção contra diarreia por rotavírus', targetAgeMonths: 2 },
  { id: 'v6', name: 'Pneumocócica 10V (1ª Dose)', description: 'Infecções causadas por pneumococo', targetAgeMonths: 2 },
  { id: 'v7', name: 'Meningocócica C (1ª Dose)', description: 'Meningite meningocócica C', targetAgeMonths: 3 },
  { id: 'v8', name: 'Penta (2ª Dose)', description: 'Segunda dose do esquema quinqüivalente', targetAgeMonths: 4 },
  { id: 'v9', name: 'Pólio VIP (2ª Dose)', description: 'Segunda dose de poliomielite', targetAgeMonths: 4 },
  { id: 'v10', name: 'Meningocócica C (2ª Dose)', description: 'Segunda dose de meningite C', targetAgeMonths: 5 },
  { id: 'v11', name: 'Penta (3ª Dose)', description: 'Terceira dose do esquema quinqüivalente', targetAgeMonths: 6 },
  { id: 'v12', name: 'Febre Amarela (1ª Dose)', description: 'Imunização contra febre amarela', targetAgeMonths: 9 },
  { id: 'v13', name: 'Tríplice Viral (1ª Dose)', description: 'Sarampo, Caxumba e Rubéola', targetAgeMonths: 12 },
  { id: 'v14', name: 'Pneumocócica 10V (Reforço)', description: 'Dose de reforço anual', targetAgeMonths: 12 },
  { id: 'v15', name: 'Meningocócica C (Reforço)', description: 'Dose de reforço anual', targetAgeMonths: 12 },
  { id: 'v16', name: 'Hepatite A', description: 'Imunização contra hepatite A', targetAgeMonths: 15 },
  { id: 'v17', name: 'DTP (1º Reforço)', description: 'Difteria, Tétano e Coqueluche', targetAgeMonths: 15 },
];

const DEFAULT_VACCINE_MAP: Record<string, string> = {
  v1: 'BCG',
  v2: 'Hepatite B (1ª Dose)',
  v3: 'Penta (1ª Dose)',
  v4: 'Pólio VIP (1ª Dose)',
  v5: 'Rotavírus (1ª Dose)',
  v6: 'Pneumocócica 10V (1ª Dose)',
  v7: 'Meningocócica C (1ª Dose)',
  v8: 'Penta (2ª Dose)',
  v9: 'Pólio VIP (2ª Dose)',
  v10: 'Meningocócica C (2ª Dose)',
  v11: 'Penta (3ª Dose)',
  v12: 'Febre Amarela (1ª Dose)',
  v13: 'Tríplice Viral (1ª Dose)',
  v14: 'Pneumocócica 10V (Reforço)',
  v15: 'Meningocócica C (Reforço)',
  v16: 'Hepatite A',
  v17: 'DTP (1º Reforço)',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const babyId = searchParams.get('babyId');
    const validBabyId = (babyId && babyId !== 'undefined' && babyId !== 'null' && babyId !== '') ? babyId : null;

    let targetBabyId = validBabyId;

    if (!targetBabyId) {
      const fsBabies = await getBabiesFS();
      if (fsBabies && fsBabies.length > 0) {
        targetBabyId = fsBabies[0].id;
      } else {
        try {
          const dbBaby = await prisma.baby.findFirst();
          if (dbBaby) targetBabyId = dbBaby.id;
        } catch (e) {}
      }
    }

    if (!targetBabyId) {
      targetBabyId = 'demo-baby-id';
    }

    // 1. Obter lista de vacinas de referência (Prisma ou catálogo padrão)
    let allVaccines: any[] = [];
    try {
      allVaccines = await prisma.vaccine.findMany({
        orderBy: { targetAgeMonths: 'asc' },
      });
    } catch (e) {}

    if (!allVaccines || allVaccines.length === 0) {
      allVaccines = DEFAULT_VACCINES;
    }

    // 2. Obter aplicações do Firestore
    let fsApplications: any[] = [];
    try {
      fsApplications = await getVaccinesFS(targetBabyId);
    } catch (e) {}

    // 3. Obter aplicações do Prisma como backup
    let dbApplications: any[] = [];
    try {
      dbApplications = await prisma.vaccineApplication.findMany({
        where: { babyId: targetBabyId },
        include: { vaccine: true },
      });
    } catch (e) {}

    const applications = [...fsApplications, ...dbApplications];

    const result = allVaccines.map((v) => {
      const app = applications.find((a) => {
        if (a.vaccineId === v.id) return true;
        if (a.vaccineId === v.name || a.vaccineName === v.name || a.vaccine?.name === v.name) return true;
        if (DEFAULT_VACCINE_MAP[a.vaccineId] === v.name) return true;
        return false;
      });
      return {
        ...v,
        applied: !!app,
        applicationDetails: app || null,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(DEFAULT_VACCINES.map((v) => ({ ...v, applied: false, applicationDetails: null })));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, vaccineId, appliedAt, lotNumber, location, sideEffects } = body;

    let fsRecord: any = null;
    try {
      fsRecord = await createVaccineFS({
        babyId,
        vaccineId,
        appliedAt: appliedAt ? new Date(appliedAt).toISOString() : new Date().toISOString(),
        lotNumber: lotNumber || null,
        location: location || null,
        sideEffects: sideEffects || null,
      });
    } catch (e) {}

    try {
      await prisma.vaccineApplication.create({
        data: {
          id: fsRecord?.id,
          babyId,
          vaccineId,
          appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
          lotNumber: lotNumber || null,
          location: location || null,
          sideEffects: sideEffects || null,
        },
      });
    } catch (e) {}

    return NextResponse.json(fsRecord || {
      id: `vapp-${Date.now()}`,
      babyId,
      vaccineId,
      appliedAt: appliedAt ? new Date(appliedAt).toISOString() : new Date().toISOString(),
      lotNumber: lotNumber || null,
      location: location || null,
      sideEffects: sideEffects || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar vacina' }, { status: 500 });
  }
}

