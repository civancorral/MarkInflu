import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { message: 'Solo creadores pueden ver aplicaciones' },
        { status: 403 }
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
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Build where clause
    const whereClause: any = {
      creatorProfileId: creatorProfile.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get applications
    const applications = await prisma.application.findMany({
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
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    // Format response
    const formattedApplications = applications.map((app) => ({
      id: app.id,
      status: app.status,
      proposedRate: app.proposedRate?.toString(),
      currency: app.currency,
      pitch: app.pitch,
      portfolioLinks: app.portfolioLinks,
      appliedAt: app.appliedAt,
      shortlistedAt: app.shortlistedAt,
      rejectedAt: app.rejectedAt,
      hiredAt: app.hiredAt,
      rejectionReason: app.rejectionReason,
      campaign: {
        id: app.campaign.id,
        title: app.campaign.title,
        slug: app.campaign.slug,
        budgetMin: app.campaign.budgetMin?.toString(),
        budgetMax: app.campaign.budgetMax?.toString(),
        currency: app.campaign.currency,
        applicationDeadline: app.campaign.applicationDeadline,
        brand: {
          name: app.campaign.brandProfile.companyName,
          logo: app.campaign.brandProfile.logoUrl,
          industry: app.campaign.brandProfile.industry,
        },
      },
    }));

    return NextResponse.json({
      data: formattedApplications,
      total: formattedApplications.length,
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener aplicaciones' },
      { status: 500 }
    );
  }
}
