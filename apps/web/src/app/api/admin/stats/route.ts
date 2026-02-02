import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const [
      totalUsers,
      totalBrands,
      totalCreators,
      activeCampaigns,
      totalContracts,
      totalTransactions,
      revenueAgg,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BRAND' } }),
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.campaign.count({ where: { status: 'PUBLISHED' } }),
      prisma.contract.count(),
      prisma.escrowTransaction.count(),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { platformFee: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, status: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalBrands,
      totalCreators,
      activeCampaigns,
      totalContracts,
      totalTransactions,
      platformRevenue: revenueAgg._sum.platformFee || 0,
      recentUsers,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
