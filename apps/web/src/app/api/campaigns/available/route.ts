import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { CampaignStatus, CampaignVisibility } from '@prisma/client';

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
        { message: 'Solo creadores pueden ver oportunidades' },
        { status: 403 }
      );
    }

    // Get creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        socialAccounts: true,
      },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { message: 'Perfil de creador no encontrado' },
        { status: 404 }
      );
    }

    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const niche = searchParams.get('niche');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const platform = searchParams.get('platform');
    const search = searchParams.get('search');

    // Calculate total followers
    const totalFollowers = creatorProfile.socialAccounts.reduce(
      (sum, account) => sum + (account.followers || 0),
      0
    );

    // Build where clause
    const whereClause: any = {
      status: CampaignStatus.PUBLISHED,
      visibility: CampaignVisibility.PUBLIC,
      applicationDeadline: {
        gte: new Date(),
      },
    };

    // Filter by search
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by budget
    if (minBudget) {
      whereClause.budgetMax = { gte: parseInt(minBudget) };
    }
    if (maxBudget) {
      whereClause.budgetMin = { lte: parseInt(maxBudget) };
    }

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
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
      orderBy: {
        publishedAt: 'desc',
      },
    });

    // Filter campaigns based on creator's profile
    const filteredCampaigns = campaigns.filter((campaign) => {
      const requirements = campaign.requirements as any;

      if (!requirements) return true;

      // Check followers requirement
      if (requirements.minFollowers && totalFollowers < requirements.minFollowers) {
        return false;
      }

      // Check platform requirement
      if (platform && requirements.platforms) {
        if (!requirements.platforms.includes(platform)) {
          return false;
        }
      }

      // Check niche requirement
      if (niche && requirements.niches) {
        const creatorNiches = [
          creatorProfile.primaryNiche,
          ...(creatorProfile.secondaryNiches || []),
        ].filter(Boolean);

        const hasMatchingNiche = requirements.niches.some((reqNiche: string) =>
          creatorNiches.some((creatorNiche) =>
            creatorNiche.toLowerCase().includes(reqNiche.toLowerCase()) ||
            reqNiche.toLowerCase().includes(creatorNiche.toLowerCase())
          )
        );

        if (!hasMatchingNiche) {
          return false;
        }
      }

      // Check country requirement
      if (requirements.countries && creatorProfile.country) {
        if (!requirements.countries.includes(creatorProfile.country)) {
          return false;
        }
      }

      // Check language requirement
      if (requirements.languages && creatorProfile.languages) {
        const hasMatchingLanguage = requirements.languages.some((lang: string) =>
          creatorProfile.languages.includes(lang)
        );
        if (!hasMatchingLanguage) {
          return false;
        }
      }

      // Check if creator already applied
      // This will be added later when we implement applications

      return true;
    });

    // Format response
    const formattedCampaigns = filteredCampaigns.map((campaign) => {
      const requirements = campaign.requirements as any;

      return {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        coverImageUrl: campaign.coverImageUrl,
        budgetMin: campaign.budgetMin?.toString(),
        budgetMax: campaign.budgetMax?.toString(),
        budgetType: campaign.budgetType,
        currency: campaign.currency,
        applicationDeadline: campaign.applicationDeadline,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        maxCreators: campaign.maxCreators,
        currentCreators: campaign.currentCreators,
        applicationsCount: campaign._count.applications,
        brand: {
          name: campaign.brandProfile.companyName,
          logo: campaign.brandProfile.logoUrl,
          industry: campaign.brandProfile.industry,
        },
        requirements: {
          minFollowers: requirements?.minFollowers,
          platforms: requirements?.platforms || [],
          niches: requirements?.niches || [],
          countries: requirements?.countries || [],
        },
      };
    });

    return NextResponse.json({
      data: formattedCampaigns,
      total: formattedCampaigns.length,
    });
  } catch (error: any) {
    console.error('Error fetching available campaigns:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener campañas' },
      { status: 500 }
    );
  }
}
