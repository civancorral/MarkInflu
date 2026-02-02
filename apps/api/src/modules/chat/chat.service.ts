import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatType, MessageContentType, Prisma } from '@markinflu/database';

interface CreateDirectChatDto {
  recipientUserId: string;
}

interface CreateContractChatDto {
  contractId: string;
}

interface SendMessageDto {
  content: string;
  contentType?: MessageContentType;
  attachments?: any;
  replyToMessageId?: string;
}

interface ListMessagesParams {
  cursor?: string;
  limit?: number;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Start direct chat (1:1)
  // ============================================

  async createDirectChat(userId: string, dto: CreateDirectChatDto) {
    if (userId === dto.recipientUserId) {
      throw new BadRequestException('No puedes crear un chat contigo mismo');
    }

    // Check if direct chat already exists between these users
    const existing = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DIRECT,
        participants: {
          every: {
            userId: { in: [userId, dto.recipientUserId] },
          },
        },
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Verify recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientUserId },
    });

    if (!recipient) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        participants: {
          createMany: {
            data: [
              { userId, unreadCount: 0 },
              { userId: dto.recipientUserId, unreadCount: 0 },
            ],
          },
        },
      },
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
      },
    });
  }

  // ============================================
  // CREATE — Contract chat (auto-created)
  // ============================================

  async createContractChat(userId: string, dto: CreateContractChatDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== userId && contract.creatorUserId !== userId) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    // Check if contract chat already exists
    const existing = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.CONTRACT,
        contractId: dto.contractId,
      },
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
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.chat.create({
      data: {
        type: ChatType.CONTRACT,
        contractId: dto.contractId,
        participants: {
          createMany: {
            data: [
              { userId: contract.brandUserId, unreadCount: 0 },
              { userId: contract.creatorUserId, unreadCount: 0 },
            ],
          },
        },
      },
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
      },
    });
  }

  // ============================================
  // READ — User's chat list
  // ============================================

  async findUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: { userId, isActive: true },
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

    // Add unread count for current user
    return chats.map((chat) => {
      const myParticipant = chat.participants.find((p) => p.userId === userId);
      return {
        ...chat,
        unreadCount: myParticipant?.unreadCount || 0,
        lastMessage: chat.messages[0] || null,
      };
    });
  }

  // ============================================
  // READ — Chat messages (cursor-based)
  // ============================================

  async getMessages(chatId: string, userId: string, params: ListMessagesParams) {
    const { cursor, limit = 50 } = params;

    // Verify user is participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant || !participant.isActive) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    const where: Prisma.MessageWhereInput = {
      chatId,
      isDeleted: false,
    };

    const messages = await this.prisma.message.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
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
          select: {
            id: true,
            content: true,
            senderUserId: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]!.id : null,
    };
  }

  // ============================================
  // CREATE — Send message
  // ============================================

  async sendMessage(chatId: string, senderUserId: string, dto: SendMessageDto) {
    // Verify sender is participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderUserId } },
    });

    if (!participant || !participant.isActive) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    if (!dto.content && !dto.attachments) {
      throw new BadRequestException('El mensaje debe tener contenido o adjuntos');
    }

    if (dto.replyToMessageId) {
      const replyTo = await this.prisma.message.findFirst({
        where: { id: dto.replyToMessageId, chatId },
      });
      if (!replyTo) {
        throw new BadRequestException('Mensaje de respuesta no encontrado en este chat');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId,
          senderUserId,
          content: dto.content || '',
          contentType: dto.contentType || MessageContentType.TEXT,
          attachments: dto.attachments as any,
          replyToMessageId: dto.replyToMessageId,
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
          replyToMessage: {
            select: {
              id: true,
              content: true,
              senderUserId: true,
            },
          },
        },
      });

      // Update chat lastMessageAt
      await tx.chat.update({
        where: { id: chatId },
        data: { lastMessageAt: new Date() },
      });

      // Increment unread count for other participants
      await tx.chatParticipant.updateMany({
        where: {
          chatId,
          userId: { not: senderUserId },
          isActive: true,
        },
        data: { unreadCount: { increment: 1 } },
      });

      return message;
    });
  }

  // ============================================
  // UPDATE — Mark messages as read
  // ============================================

  async markAsRead(chatId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    return this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });
  }

  // ============================================
  // READ — Total unread count across all chats
  // ============================================

  async getTotalUnreadCount(userId: string) {
    const result = await this.prisma.chatParticipant.aggregate({
      where: { userId, isActive: true },
      _sum: { unreadCount: true },
    });
    return { count: result._sum.unreadCount || 0 };
  }

  // ============================================
  // READ — Single chat detail
  // ============================================

  async findById(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
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
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    const isParticipant = chat.participants.some(
      (p) => p.userId === userId && p.isActive,
    );
    if (!isParticipant) {
      throw new ForbiddenException('No tienes acceso a este chat');
    }

    return chat;
  }
}
