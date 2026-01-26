import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { ApplicationStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { message: 'Solo creadores pueden aplicar a campañas' },
        { status: 403 }
      );
    }

    const campaignId = params.id;

    // Get creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { message: 'Perfil de creador no encontrado' },
        { status: 404 }
      );
    }

    // Check if campaign exists and is published
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: 'Campaña no encontrada' },
        { status: 404 }
      );
    }

    if (campaign.status !== 'PUBLISHED') {
      return NextResponse.json(
        { message: 'Esta campaña no está disponible' },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId,
          creatorProfileId: creatorProfile.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { message: 'Ya aplicaste a esta campaña' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      proposedRate,
      pitch,
      portfolioLinks,
      proposal,
    } = body;

    // Create application
    const application = await prisma.application.create({
      data: {
        campaignId,
        creatorProfileId: creatorProfile.id,
        status: ApplicationStatus.APPLIED,
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        currency: campaign.currency,
        pitch,
        portfolioLinks: portfolioLinks || [],
        proposal: proposal || null,
        appliedAt: new Date(),
      },
    });

    // TODO: Send notification to brand
    // TODO: Send confirmation email to creator

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { message: error.message || 'Error al enviar aplicación' },
      { status: 500 }
    );
  }
}
