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

    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
    });

    if (!contract) {
      return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.brandUserId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    if (contract.status !== 'DRAFT') {
      return NextResponse.json(
        { message: 'Solo contratos en borrador pueden enviarse para firma' },
        { status: 400 },
      );
    }

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: {
        status: 'PENDING_CREATOR_SIGNATURE',
        brandSignedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error sending contract:', error);
    return NextResponse.json(
      { message: error.message || 'Error al enviar contrato' },
      { status: 500 },
    );
  }
}
