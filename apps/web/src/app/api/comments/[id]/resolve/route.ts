import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const comment = await prisma.visualComment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ message: 'Comentario no encontrado' }, { status: 404 });
    }

    const updated = await prisma.visualComment.update({
      where: { id: params.id },
      data: {
        isResolved: !comment.isResolved,
        resolvedAt: comment.isResolved ? null : new Date(),
        resolvedByUserId: comment.isResolved ? null : session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error toggling comment resolve:', error);
    return NextResponse.json(
      { message: error.message || 'Error al actualizar comentario' },
      { status: 500 },
    );
  }
}
