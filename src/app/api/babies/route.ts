import { prisma } from '@/lib/prisma';
import { getBabiesFS, createBabyFS, deleteBabyFS } from '@/lib/firebaseStore';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let babies = await getBabiesFS();

    if (!babies || babies.length === 0) {
      try {
        babies = await prisma.baby.findMany({ orderBy: { createdAt: 'desc' } });
      } catch (dbErr) {}
    }

    if (!babies || babies.length === 0) {
      babies = [
        {
          id: 'demo-baby-id',
          name: 'Bebê Noah',
          birthDate: '2026-02-15T00:00:00.000Z',
          gender: 'male',
        },
      ];
    }

    return NextResponse.json(babies);
  } catch (error: any) {
    return NextResponse.json([
      {
        id: 'demo-baby-id',
        name: 'Bebê Noah',
        birthDate: '2026-02-15T00:00:00.000Z',
        gender: 'male',
      },
    ]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, birthDate, gender } = body;

    if (!name || !birthDate) {
      return NextResponse.json({ error: 'Nome e Data de Nascimento são obrigatórios.' }, { status: 400 });
    }

    const parsedDate = new Date(birthDate);
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    // Salvar no Firebase Firestore para sincronização global
    const fsBaby = await createBabyFS({
      name,
      birthDate: validDate.toISOString(),
      gender: gender || 'male',
    });

    // Salvar também no Prisma como backup local se possível
    try {
      const user = await prisma.user.findFirst().catch(() => null);
      await prisma.baby.create({
        data: {
          id: fsBaby?.id,
          name,
          birthDate: validDate,
          gender: gender || 'male',
          ...(user && {
            caretakers: { create: { userId: user.id, role: 'ADMIN' } },
          }),
        },
      });
    } catch (e) {}

    const result = fsBaby || {
      id: `baby-${Date.now()}`,
      name,
      birthDate: validDate.toISOString(),
      gender: gender || 'male',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao cadastrar bebê' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteBabyFS(id);
    try { await prisma.baby.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
