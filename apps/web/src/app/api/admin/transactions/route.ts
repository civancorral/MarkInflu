import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.escrowTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              contractNumber: true,
              campaign: {
                select: {
                  title: true,
                  brandProfile: { select: { companyName: true } },
                },
              },
              application: {
                select: {
                  creatorProfile: { select: { displayName: true } },
                },
              },
            },
          },
        },
      }),
      prisma.escrowTransaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
