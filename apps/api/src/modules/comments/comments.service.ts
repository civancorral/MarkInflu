import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AnnotationType, CommentType, CommentPriority } from '@markinflu/database';

interface CreateCommentDto {
  text: string;
  timestamp?: number;
  coordinateX?: number;
  coordinateY?: number;
  annotationType?: AnnotationType;
  annotationData?: any;
  commentType?: CommentType;
  priority?: CommentPriority;
  parentCommentId?: string;
}

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Add visual comment to version
  // ============================================

  async create(versionId: string, userId: string, dto: CreateCommentDto) {
    // Verify version exists and user has access
    const version = await this.prisma.deliverableVersion.findUnique({
      where: { id: versionId },
      include: {
        deliverable: {
          include: {
            contract: {
              include: {
                campaign: {
                  include: {
                    brandProfile: { select: { userId: true } },
                  },
                },
              },
            },
            creatorProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    const isBrand = version.deliverable.contract.campaign.brandProfile.userId === userId;
    const isCreator = version.deliverable.creatorProfile.userId === userId;

    if (!isBrand && !isCreator) {
      throw new ForbiddenException('No tienes acceso a esta versión');
    }

    if (dto.parentCommentId) {
      const parent = await this.prisma.visualComment.findFirst({
        where: { id: dto.parentCommentId, deliverableVersionId: versionId },
      });
      if (!parent) {
        throw new BadRequestException('Comentario padre no encontrado en esta versión');
      }
    }

    return this.prisma.visualComment.create({
      data: {
        deliverableVersionId: versionId,
        authorUserId: userId,
        text: dto.text,
        timestamp: dto.timestamp,
        coordinateX: dto.coordinateX,
        coordinateY: dto.coordinateY,
        annotationType: dto.annotationType || AnnotationType.POINT,
        annotationData: dto.annotationData as any,
        commentType: dto.commentType || CommentType.FEEDBACK,
        priority: dto.priority || CommentPriority.NORMAL,
        parentCommentId: dto.parentCommentId,
      },
    });
  }

  // ============================================
  // READ — Comments for a version
  // ============================================

  async findByVersion(versionId: string, userId: string) {
    const version = await this.prisma.deliverableVersion.findUnique({
      where: { id: versionId },
      include: {
        deliverable: {
          include: {
            contract: {
              include: {
                campaign: {
                  include: {
                    brandProfile: { select: { userId: true } },
                  },
                },
              },
            },
            creatorProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Versión no encontrada');
    }

    const isBrand = version.deliverable.contract.campaign.brandProfile.userId === userId;
    const isCreator = version.deliverable.creatorProfile.userId === userId;

    if (!isBrand && !isCreator) {
      throw new ForbiddenException('No tienes acceso a esta versión');
    }

    const comments = await this.prisma.visualComment.findMany({
      where: {
        deliverableVersionId: versionId,
        parentCommentId: null, // Top-level only
      },
      orderBy: [{ timestamp: 'asc' }, { createdAt: 'asc' }],
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const stats = await this.prisma.visualComment.groupBy({
      by: ['isResolved'],
      where: { deliverableVersionId: versionId, parentCommentId: null },
      _count: true,
    });

    const totalComments = stats.reduce((sum, s) => sum + s._count, 0);
    const resolvedComments = stats.find((s) => s.isResolved)?._count || 0;

    return {
      data: comments,
      stats: {
        total: totalComments,
        resolved: resolvedComments,
        pending: totalComments - resolvedComments,
      },
    };
  }

  // ============================================
  // UPDATE — Resolve comment
  // ============================================

  async resolve(commentId: string, userId: string) {
    const comment = await this.getCommentWithAccess(commentId, userId);

    if (comment.isResolved) {
      throw new BadRequestException('Este comentario ya está resuelto');
    }

    return this.prisma.visualComment.update({
      where: { id: commentId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      },
    });
  }

  // ============================================
  // UPDATE — Unresolve comment
  // ============================================

  async unresolve(commentId: string, userId: string) {
    const comment = await this.getCommentWithAccess(commentId, userId);

    if (!comment.isResolved) {
      throw new BadRequestException('Este comentario no está resuelto');
    }

    return this.prisma.visualComment.update({
      where: { id: commentId },
      data: {
        isResolved: false,
        resolvedAt: null,
        resolvedByUserId: null,
      },
    });
  }

  // ============================================
  // DELETE — Delete comment (author only)
  // ============================================

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.visualComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    if (comment.authorUserId !== userId) {
      throw new ForbiddenException('Solo el autor puede eliminar este comentario');
    }

    // Delete comment and its replies
    await this.prisma.visualComment.deleteMany({
      where: {
        OR: [{ id: commentId }, { parentCommentId: commentId }],
      },
    });

    return { deleted: true };
  }

  // ============================================
  // HELPER — Verify access to comment
  // ============================================

  private async getCommentWithAccess(commentId: string, userId: string) {
    const comment = await this.prisma.visualComment.findUnique({
      where: { id: commentId },
      include: {
        deliverableVersion: {
          include: {
            deliverable: {
              include: {
                contract: {
                  include: {
                    campaign: {
                      include: {
                        brandProfile: { select: { userId: true } },
                      },
                    },
                  },
                },
                creatorProfile: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const del = comment.deliverableVersion.deliverable;
    const isBrand = del.contract.campaign.brandProfile.userId === userId;
    const isCreator = del.creatorProfile.userId === userId;

    if (!isBrand && !isCreator) {
      throw new ForbiddenException('No tienes acceso a este comentario');
    }

    return comment;
  }
}
