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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = { recipientUserId: session.user.id };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { initiatedAt: 'desc' },
        include: {
          milestone: { select: { id: true, title: true } },
          escrowTransaction: {
            select: {
              contractId: true,
              contract: {
                select: {
                  contractNumber: true,
                  campaign: {
                    select: {
                      title: true,
                      brandProfile: {
                        select: { companyName: true, logoUrl: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Error fetching creator payments:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener pagos' },
      { status: 500 },
    );
  }
}
