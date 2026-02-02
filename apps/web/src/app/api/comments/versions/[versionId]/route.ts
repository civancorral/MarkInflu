import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { versionId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const comments = await prisma.visualComment.findMany({
      where: {
        deliverableVersionId: params.versionId,
        parentCommentId: null,
      },
      orderBy: [{ timestamp: 'asc' }, { createdAt: 'asc' }],
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });

    const stats = await prisma.visualComment.groupBy({
      by: ['isResolved'],
      where: { deliverableVersionId: params.versionId, parentCommentId: null },
      _count: true,
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const resolved = stats.find((s) => s.isResolved)?._count || 0;

    return NextResponse.json({
      data: comments,
      stats: { total, resolved, pending: total - resolved },
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener comentarios' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { versionId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    const comment = await prisma.visualComment.create({
      data: {
        deliverableVersionId: params.versionId,
        authorUserId: session.user.id,
        text: body.text,
        timestamp: body.timestamp ?? null,
        coordinateX: body.coordinateX ?? null,
        coordinateY: body.coordinateY ?? null,
        annotationType: body.annotationType || 'POINT',
        annotationData: body.annotationData || null,
        commentType: body.commentType || 'FEEDBACK',
        priority: body.priority || 'NORMAL',
        parentCommentId: body.parentCommentId || null,
      },
    });

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear comentario' },
      { status: 500 },
    );
  }
}
