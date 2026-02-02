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

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ message: 'Perfil no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const listName = searchParams.get('list') || undefined;

    const favorites = await prisma.favoriteCreator.findMany({
      where: {
        brandProfileId: brandProfile.id,
        ...(listName ? { listName } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            primaryNiche: true,
            location: true,
            user: { select: { id: true } },
            socialAccounts: {
              select: { platform: true, followers: true },
              take: 3,
            },
          },
        },
      },
    });

    // Get distinct list names for filter
    const lists = await prisma.favoriteCreator.groupBy({
      by: ['listName'],
      where: { brandProfileId: brandProfile.id, listName: { not: null } },
      _count: true,
    });

    return NextResponse.json({
      data: favorites,
      lists: lists.map((l) => ({ name: l.listName, count: l._count })),
    });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'BRAND') {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!brandProfile) {
      return NextResponse.json({ message: 'Perfil no encontrado' }, { status: 404 });
    }

    const { creatorProfileId, listName, notes } = await req.json();
    if (!creatorProfileId) {
      return NextResponse.json({ message: 'creatorProfileId requerido' }, { status: 400 });
    }

    const favorite = await prisma.favoriteCreator.upsert({
      where: {
        brandProfileId_creatorProfileId: {
          brandProfileId: brandProfile.id,
          creatorProfileId,
        },
      },
      update: { listName, notes },
      create: {
        brandProfileId: brandProfile.id,
        creatorProfileId,
        listName,
        notes,
      },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
