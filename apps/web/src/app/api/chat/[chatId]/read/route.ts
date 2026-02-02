import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    await prisma.chatParticipant.update({
      where: {
        chatId_userId: { chatId: params.chatId, userId: session.user.id },
      },
      data: { lastReadAt: new Date(), unreadCount: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking chat as read:', error);
    return NextResponse.json(
      { message: error.message || 'Error al marcar como leído' },
      { status: 500 },
    );
  }
}
