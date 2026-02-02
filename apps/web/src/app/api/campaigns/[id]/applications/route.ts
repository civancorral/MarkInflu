import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
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
        { message: 'Solo marcas pueden ver aplicantes' },
        { status: 403 },
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { brandProfile: { select: { userId: true } } },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaña no encontrada' },
        { status: 404 },
      );
    }

    if (campaign.brandProfile.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta campaña' },
        { status: 403 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = { campaignId: params.id };
    if (status && status !== 'all') {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          creatorProfile: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              primaryNiche: true,
              secondaryNiches: true,
              location: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      data: applications,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        maxCreators: campaign.maxCreators,
        currentCreators: campaign.currentCreators,
      },
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener aplicaciones' },
      { status: 500 },
    );
  }
}
