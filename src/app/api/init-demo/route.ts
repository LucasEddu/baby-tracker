import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Maria (Mãe)',
          email: 'maria@exemplo.com',
          passwordHash: 'hash_demo',
        },
      });
    }

    let baby = await prisma.baby.findFirst();
    if (!baby) {
      baby = await prisma.baby.create({
        data: {
          name: 'Bebê Noah',
          birthDate: new Date('2026-02-15'),
          gender: 'male',
          caretakers: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
          bowelLogs: {
            create: [
              {
                userId: user.id,
                loggedAt: new Date(Date.now() - 1000 * 60 * 120),
                type: 'POOP',
                color: 'YELLOW',
                consistency: 'PASTY',
                notes: 'Fralda trocada pós amamentação',
              },
              {
                userId: user.id,
                loggedAt: new Date(Date.now() - 1000 * 60 * 360),
                type: 'PEE',
                notes: 'Xixi abundante',
              },
            ],
          },
          growthLogs: {
            create: [
              {
                userId: user.id,
                measuredAt: new Date('2026-02-15'),
                weightGrams: 3200,
                heightCm: 49.5,
                headCircCm: 34.0,
                source: 'DOCTOR',
              },
              {
                userId: user.id,
                measuredAt: new Date('2026-05-15'),
                weightGrams: 5800,
                heightCm: 60.0,
                headCircCm: 40.2,
                source: 'DOCTOR',
              },
              {
                userId: user.id,
                measuredAt: new Date('2026-07-20'),
                weightGrams: 7100,
                heightCm: 65.5,
                headCircCm: 42.5,
                source: 'HOME',
              },
            ],
          },
        },
      });
    }

    return NextResponse.json({ user, baby });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
