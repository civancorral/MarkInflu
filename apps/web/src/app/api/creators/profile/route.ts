import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function POST(req: NextRequest) {
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
        { message: 'Solo creadores pueden crear este perfil' },
        { status: 403 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { message: 'Ya tienes un perfil de creador' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      displayName,
      bio,
      tagline,
      country,
      city,
      languages,
      primaryNiche,
      secondaryNiches,
      contentTypes,
      minimumBudget,
      currency,
      socialAccounts,
    } = body;

    // Create profile with social accounts
    const profile = await prisma.creatorProfile.create({
      data: {
        userId: session.user.id,
        displayName,
        bio,
        tagline,
        country,
        city,
        languages: languages || [],
        primaryNiche,
        secondaryNiches: secondaryNiches || [],
        contentTypes: contentTypes || [],
        minimumBudget: minimumBudget || 0,
        currency: currency || 'USD',
        socialAccounts: {
          create: socialAccounts?.map((account: any) => ({
            platform: account.platform,
            username: account.username,
            profileUrl: account.profileUrl,
            followers: account.followers || 0,
          })) || [],
        },
      },
      include: {
        socialAccounts: true,
      },
    });

    // Update user status to active
    await prisma.user.update({
      where: { id: session.user.id },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error('Error creating creator profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear perfil' },
      { status: 500 }
    );
  }
}

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
        { message: 'Solo creadores pueden ver este perfil' },
        { status: 403 }
      );
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        socialAccounts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            applications: true,
            reviews: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Perfil no encontrado' },
        { status: 404 }
      );
    }

    // Calculate total followers across all platforms
    const totalFollowers = profile.socialAccounts.reduce(
      (sum, account) => sum + account.followers,
      0
    );

    // Calculate average engagement rate
    const accountsWithEngagement = profile.socialAccounts.filter(
      (account) => account.engagementRate !== null
    );
    const averageEngagement =
      accountsWithEngagement.length > 0
        ? accountsWithEngagement.reduce(
            (sum, account) => sum + (Number(account.engagementRate) || 0),
            0
          ) / accountsWithEngagement.length
        : null;

    // Format response
    const formattedProfile = {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      tagline: profile.tagline,
      avatarUrl: profile.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      location: profile.location,
      city: profile.city,
      country: profile.country,
      timezone: profile.timezone,
      languages: profile.languages,
      primaryNiche: profile.primaryNiche,
      secondaryNiches: profile.secondaryNiches,
      contentTypes: profile.contentTypes,
      keywords: profile.keywords,
      portfolioUrls: profile.portfolioUrls,
      rates: profile.rates,
      minimumBudget: profile.minimumBudget?.toString(),
      currency: profile.currency,
      isAvailable: profile.isAvailable,
      availabilityNotes: profile.availabilityNotes,
      isVerified: profile.isVerified,
      verifiedAt: profile.verifiedAt,
      preferredBrands: profile.preferredBrands,
      excludedBrands: profile.excludedBrands,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,

      // Computed stats
      totalFollowers,
      averageEngagement: averageEngagement?.toFixed(2),
      totalApplications: profile._count.applications,
      totalReviews: profile._count.reviews,

      // Social accounts
      socialAccounts: profile.socialAccounts.map((account) => ({
        id: account.id,
        platform: account.platform,
        username: account.username,
        profileUrl: account.profileUrl,
        followers: account.followers,
        following: account.following,
        postsCount: account.postsCount,
        engagementRate: account.engagementRate?.toString(),
        avgLikes: account.avgLikes,
        avgComments: account.avgComments,
        avgViews: account.avgViews,
        isConnected: account.isConnected,
        isVerified: account.isVerified,
        lastSyncAt: account.lastSyncAt,
        createdAt: account.createdAt,
      })),
    };

    return NextResponse.json({ data: formattedProfile });
  } catch (error: any) {
    console.error('Error getting creator profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
        { message: 'Solo creadores pueden editar este perfil' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Update creator profile
    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        displayName: body.displayName,
        firstName: body.firstName,
        lastName: body.lastName,
        bio: body.bio,
        tagline: body.tagline,
        avatarUrl: body.avatarUrl,
        coverImageUrl: body.coverImageUrl,
        location: body.location,
        city: body.city,
        country: body.country,
        timezone: body.timezone,
        languages: body.languages,
        primaryNiche: body.primaryNiche,
        secondaryNiches: body.secondaryNiches,
        contentTypes: body.contentTypes,
        keywords: body.keywords,
        portfolioUrls: body.portfolioUrls,
        minimumBudget: body.minimumBudget ? parseFloat(body.minimumBudget) : null,
        currency: body.currency,
        isAvailable: body.isAvailable,
        availabilityNotes: body.availabilityNotes,
        preferredBrands: body.preferredBrands,
        excludedBrands: body.excludedBrands,
      },
      include: {
        socialAccounts: true,
      },
    });

    return NextResponse.json({
      data: profile,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (error: any) {
    console.error('Error updating creator profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
