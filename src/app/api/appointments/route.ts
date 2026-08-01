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

    const appointments = await prisma.medicalAppointment.findMany({
      where: { babyId: baby.id },
      orderBy: { appointmentDate: 'desc' },
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, doctorName, specialty, type, description, appointmentDate, preNotes, postNotes, status } = body;

    const appointment = await prisma.medicalAppointment.create({
      data: {
        babyId,
        doctorName,
        specialty,
        type: type || 'ROUTINE',
        description,
        appointmentDate: new Date(appointmentDate),
        preNotes,
        postNotes,
        status: status || 'SCHEDULED',
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, doctorName, specialty, type, description, appointmentDate, preNotes, postNotes, status } = body;

    const updated = await prisma.medicalAppointment.update({
      where: { id },
      data: {
        ...(doctorName && { doctorName }),
        ...(specialty !== undefined && { specialty }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
        ...(preNotes !== undefined && { preNotes }),
        ...(postNotes !== undefined && { postNotes }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await prisma.medicalAppointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
