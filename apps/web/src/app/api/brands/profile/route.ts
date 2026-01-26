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

    if (session.user.role !== 'BRAND') {
      return NextResponse.json(
        { message: 'Solo marcas pueden crear este perfil' },
        { status: 403 }
      );
    }

    // Check if profile already exists
    const existingProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { message: 'Ya tienes un perfil de marca' },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      companyName,
      website,
      industry,
      companySize,
      country,
      contactName,
      contactEmail,
      contactPhone,
    } = body;

    // Create profile
    const profile = await prisma.brandProfile.create({
      data: {
        userId: session.user.id,
        companyName,
        website,
        industry: industry || [],
        companySize,
        contactName,
        contactEmail,
        contactPhone,
        ...(country && {
          address: {
            country,
          },
        }),
      },
    });

    // Update user status to active
    await prisma.user.update({
      where: { id: session.user.id },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error('Error creating brand profile:', error);
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

    const profile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        campaigns: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        },
        _count: {
          select: { campaigns: true },
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
    console.error('Error getting brand profile:', error);
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

    const profile = await prisma.brandProfile.update({
      where: { userId: session.user.id },
      data: body,
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
