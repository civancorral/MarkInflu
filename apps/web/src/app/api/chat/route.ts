import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId: session.user.id, isActive: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                brandProfile: { select: { companyName: true, logoUrl: true } },
                creatorProfile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            contentType: true,
            senderUserId: true,
            createdAt: true,
          },
        },
      },
    });

    const data = chats.map((chat) => {
      const myParticipant = chat.participants.find(
        (p) => p.userId === session.user.id,
      );
      return {
        ...chat,
        unreadCount: myParticipant?.unreadCount || 0,
        lastMessage: chat.messages[0] || null,
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { message: error.message || 'Error al obtener chats' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { recipientUserId, contractId } = await req.json();

    if (contractId) {
      // Contract chat
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return NextResponse.json({ message: 'Contrato no encontrado' }, { status: 404 });
      }

      if (contract.brandUserId !== session.user.id && contract.creatorUserId !== session.user.id) {
        return NextResponse.json({ message: 'No tienes acceso' }, { status: 403 });
      }

      const existing = await prisma.chat.findFirst({
        where: { type: 'CONTRACT', contractId },
        include: { participants: true },
      });

      if (existing) {
        return NextResponse.json(existing);
      }

      const chat = await prisma.chat.create({
        data: {
          type: 'CONTRACT',
          contractId,
          participants: {
            createMany: {
              data: [
                { userId: contract.brandUserId, unreadCount: 0 },
                { userId: contract.creatorUserId, unreadCount: 0 },
              ],
            },
          },
        },
        include: { participants: true },
      });

      return NextResponse.json(chat);
    }

    if (recipientUserId) {
      // Direct chat
      if (recipientUserId === session.user.id) {
        return NextResponse.json({ message: 'No puedes chatear contigo mismo' }, { status: 400 });
      }

      const existing = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: recipientUserId } } },
          ],
        },
        include: { participants: true },
      });

      if (existing) {
        return NextResponse.json(existing);
      }

      const chat = await prisma.chat.create({
        data: {
          type: 'DIRECT',
          participants: {
            createMany: {
              data: [
                { userId: session.user.id, unreadCount: 0 },
                { userId: recipientUserId, unreadCount: 0 },
              ],
            },
          },
        },
        include: { participants: true },
      });

      return NextResponse.json(chat);
    }

    return NextResponse.json({ message: 'Falta recipientUserId o contractId' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { message: error.message || 'Error al crear chat' },
      { status: 500 },
    );
  }
}
