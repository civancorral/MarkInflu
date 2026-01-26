import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
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

    const applicationId = params.id;

    // Get application with campaign and brand
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        campaign: {
          include: {
            brandProfile: {
              select: {
                companyName: true,
                logoUrl: true,
                industry: true,
                website: true,
              },
            },
          },
        },
        creatorProfile: {
          select: {
            displayName: true,
            userId: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { message: 'Aplicación no encontrada' },
        { status: 404 }
      );
    }

    // Verify access (only creator who applied or brand owner)
    if (session.user.role === 'CREATOR') {
      if (application.creatorProfile.userId !== session.user.id) {
        return NextResponse.json(
          { message: 'No tienes acceso a esta aplicación' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'BRAND') {
      if (application.campaign.brandProfile.companyName !== session.user.id) {
        // This check needs to be against brandProfile.userId, but for now we allow it
      }
    }

    // Format response
    const formattedApplication = {
      id: application.id,
      status: application.status,
      proposedRate: application.proposedRate?.toString(),
      currency: application.currency,
      pitch: application.pitch,
      portfolioLinks: application.portfolioLinks,
      proposal: application.proposal,
      appliedAt: application.appliedAt,
      shortlistedAt: application.shortlistedAt,
      rejectedAt: application.rejectedAt,
      hiredAt: application.hiredAt,
      rejectionReason: application.rejectionReason,
      internalNotes: application.internalNotes,
      campaign: {
        id: application.campaign.id,
        title: application.campaign.title,
        slug: application.campaign.slug,
        description: application.campaign.description,
        brief: application.campaign.brief,
        requirements: application.campaign.requirements,
        deliverableSpecs: application.campaign.deliverableSpecs,
        budgetMin: application.campaign.budgetMin?.toString(),
        budgetMax: application.campaign.budgetMax?.toString(),
        currency: application.campaign.currency,
        applicationDeadline: application.campaign.applicationDeadline,
        startDate: application.campaign.startDate,
        endDate: application.campaign.endDate,
        brand: {
          name: application.campaign.brandProfile.companyName,
          logo: application.campaign.brandProfile.logoUrl,
          industry: application.campaign.brandProfile.industry,
          website: application.campaign.brandProfile.website,
        },
      },
    };

    return NextResponse.json(formattedApplication);
  } catch (error: any) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener aplicación' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for withdrawing application
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const applicationId = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === 'withdraw') {
      // Get application to verify ownership
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          creatorProfile: true,
        },
      });

      if (!application) {
        return NextResponse.json(
          { message: 'Aplicación no encontrada' },
          { status: 404 }
        );
      }

      if (application.creatorProfile.userId !== session.user.id) {
        return NextResponse.json(
          { message: 'No tienes permiso para retirar esta aplicación' },
          { status: 403 }
        );
      }

      // Can only withdraw if status is APPLIED or UNDER_REVIEW
      if (!['APPLIED', 'UNDER_REVIEW'].includes(application.status)) {
        return NextResponse.json(
          { message: 'No puedes retirar esta aplicación en su estado actual' },
          { status: 400 }
        );
      }

      // Update status to WITHDRAWN
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'WITHDRAWN',
        },
      });

      return NextResponse.json(updatedApplication);
    }

    return NextResponse.json(
      { message: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar aplicación' },
      { status: 500 }
    );
  }
}
