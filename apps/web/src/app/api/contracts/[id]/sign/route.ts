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

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!contract) {
      return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.creatorUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    if (contract.status !== 'PENDING_CREATOR_SIGNATURE') {
      return NextResponse.json(
        { message: 'Este contrato no está pendiente de tu firma' },
        { status: 400 },
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.contract.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE',
          creatorSignedAt: new Date(),
        },
      }),
      prisma.milestone.updateMany({
        where: {
          contractId: params.id,
          triggerType: 'CONTRACT_SIGNED',
          status: 'PENDING',
        },
        data: {
          status: 'READY',
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error signing contract:', error);
    return NextResponse.json(
      { message: error.message || 'Error al firmar contrato' },
      { status: 500 },
    );
  }
}
