import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Verify participant
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: params.chatId, userId: session.user.id },
      },
    });

    if (!participant || !participant.isActive) {
      return NextResponse.json({ message: 'No tienes acceso a este chat' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await prisma.message.findMany({
      where: { chatId: params.chatId, isDeleted: false },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            brandProfile: { select: { companyName: true, logoUrl: true } },
            creatorProfile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        replyToMessage: {
          select: { id: true, content: true, senderUserId: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return NextResponse.json({
      data,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener mensajes' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: { chatId: params.chatId, userId: session.user.id },
      },
    });

    if (!participant || !participant.isActive) {
      return NextResponse.json({ message: 'No tienes acceso' }, { status: 403 });
    }

    const body = await req.json();
    const { content, contentType, attachments, replyToMessageId } = body;

    if (!content && !attachments) {
      return NextResponse.json({ message: 'Mensaje vacío' }, { status: 400 });
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          chatId: params.chatId,
          senderUserId: session.user.id,
          content: content || '',
          contentType: contentType || 'TEXT',
          attachments: attachments || null,
          replyToMessageId: replyToMessageId || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              brandProfile: { select: { companyName: true, logoUrl: true } },
              creatorProfile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      prisma.chat.update({
        where: { id: params.chatId },
        data: { lastMessageAt: new Date() },
      }),
      prisma.chatParticipant.updateMany({
        where: {
          chatId: params.chatId,
          userId: { not: session.user.id },
          isActive: true,
        },
        data: { unreadCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: error.message || 'Error al enviar mensaje' },
      { status: 500 },
    );
  }
}
