import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all babies or create one
export async function GET() {
  try {
    let babies = await prisma.baby.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (babies.length === 0) {
      const user = await prisma.user.findFirst() || await prisma.user.create({
        data: { name: 'Maria (Mãe)', email: 'maria@exemplo.com', passwordHash: 'demo' }
      });

      const baby = await prisma.baby.create({
        data: {
          name: 'Bebê Noah',
          birthDate: new Date('2026-02-15'),
          gender: 'male',
          caretakers: { create: { userId: user.id, role: 'ADMIN' } },
        },
      });
      babies = [baby];
    }

    return NextResponse.json(babies);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, birthDate, gender } = body;

    const user = await prisma.user.findFirst();

    const baby = await prisma.baby.create({
      data: {
        name,
        birthDate: new Date(birthDate),
        gender: gender || 'male',
        ...(user && {
          caretakers: {
            create: { userId: user.id, role: 'ADMIN' },
          },
        }),
      },
    });

    return NextResponse.json(baby);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await prisma.baby.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
