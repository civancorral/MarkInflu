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

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        socialAccounts: true,
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

    return NextResponse.json(profile);
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

    const body = await req.json();

    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...body,
        socialAccounts: undefined, // Handle separately
      },
      include: {
        socialAccounts: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error updating creator profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
