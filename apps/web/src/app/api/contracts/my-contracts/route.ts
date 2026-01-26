import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { message: 'Perfil de creador no encontrado' },
        { status: 404 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      creatorUserId: session.user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    // Get contracts with campaign and brand info
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        campaign: {
          include: {
            brandProfile: {
              select: {
                companyName: true,
                logoUrl: true,
                industry: true,
              },
            },
          },
        },
        milestones: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedContracts = contracts.map((contract) => ({
      id: contract.id,
      status: contract.status,
      totalAmount: contract.totalAmount?.toString(),
      currency: contract.currency,
      startDate: contract.startDate,
      endDate: contract.endDate,
      terms: contract.terms,
      createdAt: contract.createdAt,
      signedAt: contract.signedAt,
      completedAt: contract.completedAt,
      cancelledAt: contract.cancelledAt,
      cancellationReason: contract.cancellationReason,
      campaign: {
        id: contract.campaign.id,
        title: contract.campaign.title,
        slug: contract.campaign.slug,
        brand: {
          name: contract.campaign.brandProfile.companyName,
          logo: contract.campaign.brandProfile.logoUrl,
          industry: contract.campaign.brandProfile.industry,
        },
      },
      milestones: contract.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount?.toString(),
        dueDate: milestone.dueDate,
        status: milestone.status,
        completedAt: milestone.completedAt,
        paidAt: milestone.paidAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formattedContracts,
    });
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener contratos' },
      { status: 500 }
    );
  }
}
