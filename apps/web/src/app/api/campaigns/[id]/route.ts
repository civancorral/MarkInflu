import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const campaignId = params.id;

    // Get campaign with brand profile
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brandProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            industry: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    // Format response
    const formattedCampaign = {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      description: campaign.description,
      brief: campaign.brief,
      requirements: campaign.requirements,
      deliverableSpecs: campaign.deliverableSpecs,
      coverImageUrl: campaign.coverImageUrl,
      budgetMin: campaign.budgetMin?.toString(),
      budgetMax: campaign.budgetMax?.toString(),
      budgetType: campaign.budgetType,
      currency: campaign.currency,
      applicationDeadline: campaign.applicationDeadline,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      visibility: campaign.visibility,
      maxCreators: campaign.maxCreators,
      currentCreators: campaign.currentCreators,
      applicationsCount: campaign._count.applications,
      brand: {
        name: campaign.brandProfile.companyName,
        logo: campaign.brandProfile.logoUrl,
        industry: campaign.brandProfile.industry,
      },
    };

    return NextResponse.json(formattedCampaign);
  } catch (error: any) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener campaña' },
      { status: 500 }
    );
  }
}
