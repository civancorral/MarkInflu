import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const query = searchParams.get('query');
    const niches = searchParams.getAll('niches');
    const platforms = searchParams.getAll('platforms');
    const countries = searchParams.getAll('countries');
    const languages = searchParams.getAll('languages');
    const minFollowers = searchParams.get('minFollowers');
    const maxFollowers = searchParams.get('maxFollowers');
    const minEngagement = searchParams.get('minEngagement');
    const maxBudget = searchParams.get('maxBudget');
    const contentTypes = searchParams.getAll('contentTypes');
    const isVerified = searchParams.get('isVerified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isAvailable: true,
    };

    // Full-text search
    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { primaryNiche: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Niche filter
    if (niches.length > 0) {
      where.OR = [
        ...(where.OR || []),
        { primaryNiche: { in: niches } },
        { secondaryNiches: { hasSome: niches } },
      ];
    }

    // Country filter
    if (countries.length > 0) {
      where.country = { in: countries };
    }

    // Language filter
    if (languages.length > 0) {
      where.languages = { hasSome: languages };
    }

    // Budget filter
    if (maxBudget) {
      where.minimumBudget = { lte: parseInt(maxBudget) };
    }

    // Content types filter
    if (contentTypes.length > 0) {
      where.contentTypes = { hasSome: contentTypes };
    }

    // Verified filter
    if (isVerified === 'true') {
      where.isVerified = true;
    }

    // Platform filter (via social accounts)
    if (platforms.length > 0) {
      where.socialAccounts = {
        some: {
          platform: { in: platforms },
        },
      };
    }

    // Followers filter
    if (minFollowers || maxFollowers) {
      where.socialAccounts = {
        ...where.socialAccounts,
        some: {
          ...(where.socialAccounts as any)?.some,
          followers: {
            ...(minFollowers && { gte: parseInt(minFollowers) }),
            ...(maxFollowers && { lte: parseInt(maxFollowers) }),
          },
        },
      };
    }

    // Engagement filter
    if (minEngagement) {
      where.socialAccounts = {
        ...where.socialAccounts,
        some: {
          ...(where.socialAccounts as any)?.some,
          engagementRate: { gte: parseFloat(minEngagement) },
        },
      };
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'followers' || sortBy === 'engagement') {
      orderBy.createdAt = sortOrder; // Fallback, proper sorting needs aggregation
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [profiles, total] = await Promise.all([
      prisma.creatorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isVerified: 'desc' }, // Prioritize verified
          orderBy,
        ],
        include: {
          socialAccounts: {
            select: {
              id: true,
              platform: true,
              username: true,
              followers: true,
              engagementRate: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.creatorProfile.count({ where }),
    ]);

    // Enrich profiles with computed values
    const enrichedProfiles = profiles.map((profile) => {
      const totalFollowers = profile.socialAccounts.reduce(
        (sum, acc) => sum + (acc.followers || 0),
        0
      );
      const avgEngagement =
        profile.socialAccounts.length > 0
          ? profile.socialAccounts.reduce(
              (sum, acc) => sum + (Number(acc.engagementRate) || 0),
              0
            ) / profile.socialAccounts.length
          : 0;

      return {
        id: profile.id,
        displayName: profile.displayName,
        tagline: profile.tagline,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        country: profile.country,
        city: profile.city,
        primaryNiche: profile.primaryNiche,
        secondaryNiches: profile.secondaryNiches,
        contentTypes: profile.contentTypes,
        languages: profile.languages,
        minimumBudget: profile.minimumBudget,
        currency: profile.currency,
        isVerified: profile.isVerified,
        isAvailable: profile.isAvailable,
        socialAccounts: profile.socialAccounts,
        totalFollowers,
        avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      };
    });

    return NextResponse.json({
      data: enrichedProfiles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener creadores' },
      { status: 500 }
    );
  }
}
