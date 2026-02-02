import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'BRAND') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: params.id },
      include: {
        contract: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ message: 'Entregable no encontrado' }, { status: 404 });
    }

    if (deliverable.contract.brandUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    if (deliverable.status !== 'IN_REVIEW') {
      return NextResponse.json(
        { message: 'Este entregable no está en revisión' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { action, feedback } = body;
    const latestVersion = deliverable.versions[0];

    if (action === 'approve') {
      const transactions: any[] = [
        prisma.deliverable.update({
          where: { id: params.id },
          data: { status: 'APPROVED', approvedAt: new Date() },
        }),
      ];
      if (latestVersion) {
        transactions.push(
          prisma.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: { status: 'APPROVED', reviewedAt: new Date() },
          }),
        );
      }
      const [updated] = await prisma.$transaction(transactions);
      return NextResponse.json(updated);
    }

    if (action === 'request_changes') {
      if (!feedback) {
        return NextResponse.json(
          { message: 'Debes proporcionar feedback' },
          { status: 400 },
        );
      }
      const transactions: any[] = [
        prisma.deliverable.update({
          where: { id: params.id },
          data: { status: 'CHANGES_REQUESTED' },
        }),
      ];
      if (latestVersion) {
        transactions.push(
          prisma.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: { status: 'REJECTED', reviewedAt: new Date() },
          }),
        );
      }
      const [updated] = await prisma.$transaction(transactions);
      return NextResponse.json(updated);
    }

    if (action === 'reject') {
      if (!feedback) {
        return NextResponse.json(
          { message: 'Debes proporcionar un motivo de rechazo' },
          { status: 400 },
        );
      }
      const transactions: any[] = [
        prisma.deliverable.update({
          where: { id: params.id },
          data: { status: 'REJECTED' },
        }),
      ];
      if (latestVersion) {
        transactions.push(
          prisma.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: { status: 'REJECTED', reviewedAt: new Date() },
          }),
        );
      }
      const [updated] = await prisma.$transaction(transactions);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error reviewing deliverable:', error);
    return NextResponse.json(
      { message: error.message || 'Error al revisar entregable' },
      { status: 500 },
    );
  }
}
