import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'BRAND') {
      return NextResponse.json(
        { message: 'Solo marcas pueden crear campañas' },
        { status: 403 }
      );
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!brandProfile) {
      return NextResponse.json(
        { message: 'Debes completar tu perfil de marca primero' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      title,
      description,
      budgetMin,
      budgetMax,
      budgetType,
      currency,
      maxCreators,
      applicationDeadline,
      startDate,
      endDate,
      visibility,
      requirements,
      brief,
      publish,
    } = body;

    // Generate slug
    const slug = generateSlug(title);

    const campaign = await prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title,
        slug,
        description,
        budgetMin: budgetMin || 0,
        budgetMax: budgetMax || 0,
        budgetType: budgetType || 'PER_CREATOR',
        currency: currency || 'USD',
        maxCreators: maxCreators || 10,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        visibility: visibility || 'PUBLIC',
        requirements: requirements || null,
        brief: brief || null,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publish ? new Date() : null,
      },
      include: {
        brandProfile: {
          select: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear campaña' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const query = searchParams.get('query');
    const niches = searchParams.getAll('niches');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');

    const skip = (page - 1) * limit;

    const where: any = {
      status: status || 'PUBLISHED',
      visibility: 'PUBLIC',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (niches && niches.length > 0) {
      where.brief = {
        path: ['targetNiches'],
        array_contains: niches,
      };
    }

    if (minBudget) {
      where.budgetMax = { gte: parseInt(minBudget) };
    }

    if (maxBudget) {
      where.budgetMin = { lte: parseInt(maxBudget) };
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brandProfile: {
            select: {
              companyName: true,
              logoUrl: true,
              industry: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns.map((c) => ({
        ...c,
        spotsRemaining: c.maxCreators - c.currentCreators,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener campañas' },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
