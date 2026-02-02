import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'BRAND') {
      return NextResponse.json(
        { message: 'Solo marcas pueden agregar notas' },
        { status: 403 },
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        campaign: {
          include: { brandProfile: { select: { userId: true } } },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Aplicación no encontrada' },
        { status: 404 },
      );
    }

    if (application.campaign.brandProfile.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso' },
        { status: 403 },
      );
    }

    const body = await req.json();

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { internalNotes: body.notes },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating notes:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar notas' },
      { status: 500 },
    );
  }
}
