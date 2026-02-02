import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['HIRED', 'REJECTED'],
  REJECTED: [],
  HIRED: [],
  WITHDRAWN: [],
};

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
        { message: 'Solo marcas pueden cambiar estado' },
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
    const { status, rejectionReason } = body;

    const allowed = ALLOWED_TRANSITIONS[application.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { message: `No se puede cambiar de ${application.status} a ${status}` },
        { status: 400 },
      );
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { message: 'Debes proporcionar un motivo de rechazo' },
        { status: 400 },
      );
    }

    const updateData: any = { status };

    if (status === 'SHORTLISTED') {
      updateData.shortlistedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    } else if (status === 'HIRED') {
      updateData.hiredAt = new Date();
    }

    if (status === 'HIRED') {
      const [updated] = await prisma.$transaction([
        prisma.application.update({
          where: { id: params.id },
          data: updateData,
        }),
        prisma.campaign.update({
          where: { id: application.campaignId },
          data: { currentCreators: { increment: 1 } },
        }),
      ]);
      return NextResponse.json(updated);
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating application status:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar estado' },
      { status: 500 },
    );
  }
}
