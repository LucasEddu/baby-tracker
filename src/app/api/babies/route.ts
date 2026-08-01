import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all babies or create one
export async function GET() {
  try {
    let babies: any[] = [];
    try {
      babies = await prisma.baby.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {}

    if (babies.length === 0) {
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
