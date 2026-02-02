import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        displayName: true,
        socialAccounts: {
          select: {
            id: true,
            platform: true,
            username: true,
            followers: true,
            following: true,
            postsCount: true,
            engagementRate: true,
            avgLikes: true,
            avgComments: true,
            avgViews: true,
            lastSyncAt: true,
          },
        },
      },
    });

    if (!creatorProfile) {
      return NextResponse.json({ message: 'Perfil no encontrado' }, { status: 404 });
    }

    // Get recent snapshots (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshots = await prisma.metricsSnapshot.findMany({
      where: {
        creatorProfileId: creatorProfile.id,
        snapshotDate: { gte: thirtyDaysAgo },
      },
      orderBy: { snapshotDate: 'asc' },
      select: {
        snapshotDate: true,
        followers: true,
        engagementRate: true,
        avgLikes: true,
        avgViews: true,
        followerGrowth: true,
        growthPercentage: true,
        socialAccountId: true,
      },
    });

    // Get contract/earnings stats
    const [contractCount, completedPayments] = await Promise.all([
      prisma.contract.count({
        where: { creatorUserId: session.user.id },
      }),
      prisma.payment.aggregate({
        where: { recipientUserId: session.user.id, status: 'COMPLETED' },
        _sum: { netAmount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      profile: creatorProfile,
      snapshots,
      stats: {
        totalContracts: contractCount,
        totalEarned: completedPayments._sum.netAmount || 0,
        completedPayments: completedPayments._count,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
