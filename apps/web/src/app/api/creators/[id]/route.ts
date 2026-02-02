import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@markinflu/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const profile = await prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            profileUrl: true,
            followers: true,
            engagementRate: true,
            isVerified: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { message: 'Creador no encontrado' },
        { status: 404 }
      );
    }

    // Calculate stats
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

    return NextResponse.json({
      ...profile,
      totalFollowers,
      avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      avgRating: 0,
      completedProjects: 0,
      reviews: [],
    });
  } catch (error: any) {
    console.error('Error fetching creator:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener creador' },
      { status: 500 }
    );
  }
}
