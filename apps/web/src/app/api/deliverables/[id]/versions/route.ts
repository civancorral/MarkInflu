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
      ? deliverable.versions[0].versionNumber + 1
      : 1;

    // Create new version
    const version = await prisma.deliverableVersion.create({
      data: {
        deliverableId,
        versionNumber: nextVersionNumber,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        thumbnailUrl,
        duration,
      },
    });

    // Update deliverable status to DRAFT if it's PENDING
    if (deliverable.status === 'PENDING') {
      await prisma.deliverable.update({
        where: { id: deliverableId },
        data: { status: 'DRAFT' },
      });
    }

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
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    const formattedVersions = versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      fileUrl: version.fileUrl,
      fileName: version.fileName,
      fileSize: version.fileSize,
      mimeType: version.mimeType,
      thumbnailUrl: version.thumbnailUrl,
      duration: version.duration,
      uploadedAt: version.uploadedAt,
      comments: version.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        timestamp: comment.timestamp,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          email: comment.author.email,
          role: comment.author.role,
        },
      })),
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
