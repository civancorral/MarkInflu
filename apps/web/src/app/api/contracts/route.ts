import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'BRAND') {
      return NextResponse.json(
        { message: 'Solo marcas pueden crear contratos' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { applicationId, terms, totalAmount, currency, startDate, endDate, milestones } = body;

    // Verify the application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        campaign: {
          include: { brandProfile: { select: { userId: true } } },
        },
        creatorProfile: { select: { userId: true } },
        contract: true,
      },
    });

    if (!application) {
      return NextResponse.json({ message: 'Aplicación no encontrada' }, { status: 404 });
    }

    if (application.campaign.brandProfile.userId !== session.user.id) {
      return NextResponse.json({ message: 'No tienes permiso' }, { status: 403 });
    }

    if (application.status !== 'HIRED') {
      return NextResponse.json(
        { message: 'Solo puedes crear contratos para aplicaciones con estado HIRED' },
        { status: 400 },
      );
    }

    if (application.contract) {
      return NextResponse.json(
        { message: 'Ya existe un contrato para esta aplicación' },
        { status: 409 },
      );
    }

    // Generate contract number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const contractNumber = `MKI-${timestamp}${random}`;

    const contract = await prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          campaignId: application.campaignId,
          applicationId: application.id,
          brandUserId: session.user.id,
          creatorUserId: application.creatorProfile.userId,
          contractNumber,
          terms: terms || {},
          totalAmount: totalAmount || 0,
          currency: currency || 'USD',
          status: 'DRAFT',
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      if (milestones && milestones.length > 0) {
        await tx.milestone.createMany({
          data: milestones.map((m: any, i: number) => ({
            contractId: created.id,
            title: m.title,
            description: m.description || null,
            amount: m.amount || 0,
            percentage: m.percentage || null,
            triggerType: m.triggerType || 'MANUAL',
            triggerCondition: m.triggerCondition || null,
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
            orderIndex: m.orderIndex ?? i,
            status: 'PENDING',
          })),
        });
      }

      return tx.contract.findUnique({
        where: { id: created.id },
        include: {
          milestones: { orderBy: { orderIndex: 'asc' } },
        },
      });
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear contrato' },
      { status: 500 },
    );
  }
}
