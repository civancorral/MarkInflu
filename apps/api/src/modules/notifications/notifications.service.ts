import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationType, Prisma } from '@markinflu/database';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
}

interface ListNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Internal use by other services
  // ============================================

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        actionUrl: dto.actionUrl,
      },
    });
  }

  async createMany(dtos: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({
      data: dtos.map((dto) => ({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        actionUrl: dto.actionUrl,
      })),
    });
  }

  // ============================================
  // Convenience method for triggering notifications
  // ============================================

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    options?: {
      referenceType?: string;
      referenceId?: string;
      actionUrl?: string;
    },
  ) {
    return this.create({
      userId,
      type,
      title,
      body,
      ...options,
    });
  }

  // ============================================
  // READ — User's notifications
  // ============================================

  async findByUser(userId: string, params: ListNotificationsParams) {
    const { page = 1, limit = 20, unreadOnly = false } = params;

    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // READ — Unread count
  // ============================================

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // ============================================
  // UPDATE — Mark as read
  // ============================================

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ============================================
  // UPDATE — Mark all as read
  // ============================================

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
