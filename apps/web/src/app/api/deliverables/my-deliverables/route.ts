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
    const contractId = searchParams.get('contract');

    // Build where clause
    const whereClause: any = {
      contract: {
        creatorUserId: session.user.id,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (contractId) {
      whereClause.contractId = contractId;
    }

    // Get deliverables with contract and campaign info
    const deliverables = await prisma.deliverable.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            campaign: {
              include: {
                brandProfile: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
        versions: {
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1, // Get latest version
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Format response
    const formattedDeliverables = deliverables.map((deliverable) => ({
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description,
      type: deliverable.type,
      status: deliverable.status,
      dueDate: deliverable.dueDate,
      submittedAt: deliverable.submittedAt,
      approvedAt: deliverable.approvedAt,
      publishedAt: deliverable.publishedAt,
      publishedUrl: deliverable.publishedUrl,
      contract: {
        id: deliverable.contract.id,
        campaign: {
          id: deliverable.contract.campaign.id,
          title: deliverable.contract.campaign.title,
          brand: {
            name: deliverable.contract.campaign.brandProfile.companyName,
            logo: deliverable.contract.campaign.brandProfile.logoUrl,
          },
        },
      },
      latestVersion: deliverable.versions[0]
        ? {
            id: deliverable.versions[0].id,
            versionNumber: deliverable.versions[0].versionNumber,
            fileUrl: deliverable.versions[0].fileUrl,
            videoThumbnailUrl: deliverable.versions[0].videoThumbnailUrl,
            submittedAt: deliverable.versions[0].submittedAt,
            status: deliverable.versions[0].status,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedDeliverables,
    });
  } catch (error: any) {
    console.error('Error fetching deliverables:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener entregables' },
      { status: 500 }
    );
  }
}
