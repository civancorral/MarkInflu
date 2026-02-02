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

    const deliverableId = params.id;

    // Get deliverable with full details
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: {
          include: {
            campaign: {
              include: {
                brandProfile: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                    industry: true,
                  },
                },
              },
            },
          },
        },
        versions: {
          orderBy: {
            versionNumber: 'desc',
          },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { message: 'Entregable no encontrado' },
        { status: 404 }
      );
    }

    // Verify access (only creator who owns the deliverable or brand owner)
    if (session.user.role === 'CREATOR') {
      if (deliverable.contract.creatorUserId !== session.user.id) {
        return NextResponse.json(
          { message: 'No tienes acceso a este entregable' },
          { status: 403 }
        );
      }
    }

    // Format response
    const formattedDeliverable = {
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description,
      type: deliverable.type,
      status: deliverable.status,
      dueDate: deliverable.dueDate,
      submittedAt: deliverable.submittedAt,
      approvedAt: deliverable.approvedAt,
      publishedAt: deliverable.publishedAt,
      publishedUrl: deliverable.publishedUrl,
      contract: {
        id: deliverable.contract.id,
        campaign: {
          id: deliverable.contract.campaign.id,
          title: deliverable.contract.campaign.title,
          brand: {
            name: deliverable.contract.campaign.brandProfile.companyName,
            logo: deliverable.contract.campaign.brandProfile.logoUrl,
            industry: deliverable.contract.campaign.brandProfile.industry,
          },
        },
      },
      versions: deliverable.versions.map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        fileUrl: version.fileUrl,
        fileName: version.fileName,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        videoThumbnailUrl: version.videoThumbnailUrl,
        videoDuration: version.videoDuration,
        videoPlaybackId: version.videoPlaybackId,
        status: version.status,
        submittedAt: version.submittedAt,
        reviewedAt: version.reviewedAt,
        creatorNotes: version.creatorNotes,
      })),
    };

    return NextResponse.json(formattedDeliverable);
  } catch (error: any) {
    console.error('Error fetching deliverable:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener entregable' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating deliverable status
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

    const deliverableId = params.id;
    const body = await req.json();
    const { action, status } = body;

    // Get deliverable to verify ownership
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: true,
      },
    });

    if (!deliverable) {
      return NextResponse.json(
        { message: 'Entregable no encontrado' },
        { status: 404 }
      );
    }

    if (deliverable.contract.creatorUserId !== session.user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para actualizar este entregable' },
        { status: 403 }
      );
    }

    if (action === 'submit') {
      // Submit deliverable for review
      const updatedDeliverable = await prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: 'IN_REVIEW',
          submittedAt: new Date(),
        },
      });

      return NextResponse.json(updatedDeliverable);
    }

    if (status) {
      // Update status
      const updatedDeliverable = await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status },
      });

      return NextResponse.json(updatedDeliverable);
    }

    return NextResponse.json(
      { message: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating deliverable:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar entregable' },
      { status: 500 }
    );
  }
}
