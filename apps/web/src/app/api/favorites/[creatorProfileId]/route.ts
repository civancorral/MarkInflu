import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ creatorProfileId: string }> },
) {
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

    const { creatorProfileId } = await params;

    await prisma.favoriteCreator.delete({
      where: {
        brandProfileId_creatorProfileId: {
          brandProfileId: brandProfile.id,
          creatorProfileId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
    }
    console.error('Error removing favorite:', error);
    return NextResponse.json({ message: error.message || 'Error' }, { status: 500 });
  }
}
