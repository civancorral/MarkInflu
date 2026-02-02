import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function POST(
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
    const { fileUrl, fileName, fileSize, mimeType, thumbnailUrl, duration } = body;

    // Get deliverable to verify ownership
    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: true,
        versions: {
          orderBy: {
            versionNumber: 'desc',
          },
          take: 1,
        },
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
        { message: 'No tienes permiso para subir versiones a este entregable' },
        { status: 403 }
      );
    }

    // Get next version number
    const nextVersionNumber = deliverable.versions.length > 0
      ? (deliverable.versions[0]?.versionNumber || 0) + 1
      : 1;

    // Block uploads for certain statuses
    const blocked = ['APPROVED', 'PUBLISHED', 'IN_REVIEW'];
    if (blocked.includes(deliverable.status)) {
      return NextResponse.json(
        { message: `No puedes subir archivos en estado ${deliverable.status}` },
        { status: 400 }
      );
    }

    // Create new version and update deliverable in transaction
    const [version] = await prisma.$transaction([
      prisma.deliverableVersion.create({
        data: {
          deliverableId,
          versionNumber: nextVersionNumber,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          videoProvider: body.videoProvider || null,
          videoAssetId: body.videoAssetId || null,
          videoPlaybackId: body.videoPlaybackId || null,
          videoDuration: duration || null,
          videoThumbnailUrl: thumbnailUrl || null,
          metadata: body.metadata || null,
          creatorNotes: body.creatorNotes || null,
          status: 'SUBMITTED',
        },
      }),
      prisma.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: 'DRAFT',
          currentVersionId: null, // Will be set after version is created
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error: any) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear versión' },
      { status: 500 }
    );
  }
}

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

    // Get all versions
    const versions = await prisma.deliverableVersion.findMany({
      where: { deliverableId },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    const formattedVersions = versions.map((version) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: formattedVersions,
    });
  } catch (error: any) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener versiones' },
      { status: 500 }
    );
  }
}
