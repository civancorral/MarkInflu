import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'BRAND') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ message: 'Perfil no encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const original = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!original || original.brandProfileId !== brandProfile.id) {
      return NextResponse.json({ message: 'Campaña no encontrada' }, { status: 404 });
    }

    const newSlug = `${original.slug}-copia-${randomUUID().slice(0, 6)}`;

    const duplicate = await prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title: `${original.title} (Copia)`,
        slug: newSlug,
        description: original.description,
        brief: original.brief ?? undefined,
        requirements: original.requirements ?? undefined,
        deliverableSpecs: original.deliverableSpecs ?? undefined,
        budgetMin: original.budgetMin,
        budgetMax: original.budgetMax,
        budgetType: original.budgetType,
        currency: original.currency,
        maxCreators: original.maxCreators,
        status: 'DRAFT',
        visibility: original.visibility,
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating campaign:', error);
    return NextResponse.json(
      { message: error.message || 'Error al duplicar campaña' },
      { status: 500 },
    );
  }
}
