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

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!contract) {
      return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.brandUserId !== session.user.id && contract.creatorUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    const cancellable = ['DRAFT', 'PENDING_CREATOR_SIGNATURE', 'PENDING_BRAND_SIGNATURE', 'ACTIVE'];
    if (!cancellable.includes(contract.status)) {
      return NextResponse.json(
        { message: `No se puede cancelar un contrato con estado ${contract.status}` },
        { status: 400 },
      );
    }

    const body = await req.json();
    if (!body.reason) {
      return NextResponse.json(
        { message: 'Debes proporcionar un motivo de cancelación' },
        { status: 400 },
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.contract.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      }),
      prisma.milestone.updateMany({
        where: {
          contractId: params.id,
          status: { in: ['PENDING', 'READY'] },
        },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error cancelling contract:', error);
    return NextResponse.json(
      { message: error.message || 'Error al cancelar contrato' },
      { status: 500 },
    );
  }
}
