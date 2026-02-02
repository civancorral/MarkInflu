import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'BRAND') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!brandProfile) {
      return NextResponse.json({ message: 'Perfil de marca no encontrado' }, { status: 404 });
    }

    const where = {
      contract: {
        campaign: { brandProfileId: brandProfile.id },
      },
    };

    const [escrows, total] = await Promise.all([
      prisma.escrowTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              status: true,
              campaign: { select: { title: true } },
              application: {
                select: {
                  creatorProfile: {
                    select: { displayName: true, avatarUrl: true },
                  },
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              netAmount: true,
              status: true,
              completedAt: true,
              milestone: { select: { id: true, title: true } },
            },
            orderBy: { initiatedAt: 'desc' },
          },
        },
      }),
      prisma.escrowTransaction.count({ where }),
    ]);

    return NextResponse.json({
      data: escrows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching brand escrows:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener escrows' },
      { status: 500 },
    );
  }
}
