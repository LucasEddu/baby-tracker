import { prisma } from '@/lib/prisma';
import { getAppointmentsFS, createAppointmentFS, updateAppointmentFS, deleteAppointmentFS, getBabiesFS } from '@/lib/firebaseStore';
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

    let appointments = await getAppointmentsFS(targetBabyId || undefined);
    if (!appointments || appointments.length === 0) {
      try {
        const baby = targetBabyId
          ? await prisma.baby.findUnique({ where: { id: targetBabyId } })
          : await prisma.baby.findFirst();
        if (baby) {
          appointments = await prisma.medicalAppointment.findMany({
            where: { babyId: baby.id },
            orderBy: { appointmentDate: 'desc' },
          });
        }
      } catch (e) {}
    }

    return NextResponse.json(appointments || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { babyId, doctorName, specialty, type, category, description, appointmentDate, preNotes, postNotes, status } = body;

    const fsRecord = await createAppointmentFS({
      babyId,
      doctorName,
      specialty: specialty || null,
      type: type || 'ROUTINE',
      category: category || 'CONSULTA',
      description: description || null,
      appointmentDate: appointmentDate ? new Date(appointmentDate).toISOString() : new Date().toISOString(),
      preNotes: preNotes || null,
      postNotes: postNotes || null,
      status: status || 'SCHEDULED',
    });

    try {
      await prisma.medicalAppointment.create({
        data: {
          id: fsRecord?.id,
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
    } catch (e) {}

    return NextResponse.json(fsRecord || body);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, doctorName, specialty, type, category, description, appointmentDate, preNotes, postNotes, status } = body;

    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    const updateData: any = {
      doctorName,
      specialty: specialty || null,
      type: type || 'ROUTINE',
      category: category || 'CONSULTA',
      description: description || null,
      appointmentDate: appointmentDate ? new Date(appointmentDate).toISOString() : new Date().toISOString(),
      preNotes: preNotes || null,
      postNotes: postNotes || null,
      status: status || 'SCHEDULED',
    };

    const updated = await updateAppointmentFS(id, updateData);

    try {
      await prisma.medicalAppointment.update({
        where: { id },
        data: {
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
    } catch (e) {}

    return NextResponse.json(updated || { id, ...updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 });

    await deleteAppointmentFS(id);
    try { await prisma.medicalAppointment.delete({ where: { id } }); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

