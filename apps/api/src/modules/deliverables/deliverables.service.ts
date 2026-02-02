import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeliverableStatus, VersionStatus, ContentType, Prisma } from '@markinflu/database';

interface CreateDeliverableDto {
  contractId: string;
  title: string;
  description?: string;
  type: ContentType;
  specifications?: any;
  dueDate?: string;
  orderIndex?: number;
}

interface CreateVersionDto {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  videoProvider?: string;
  videoAssetId?: string;
  videoPlaybackId?: string;
  videoDuration?: number;
  videoThumbnailUrl?: string;
  metadata?: any;
  creatorNotes?: string;
}

interface ReviewDto {
  action: 'approve' | 'request_changes' | 'reject';
  feedback?: string;
}

interface ListDeliverablesParams {
  status?: DeliverableStatus;
  contractId?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class DeliverablesService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Brand creates deliverable for contract
  // ============================================

  async create(brandUserId: string, dto: CreateDeliverableDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
      include: {
        application: {
          include: {
            creatorProfile: { select: { id: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para crear entregables en este contrato');
    }

    if (contract.status !== 'ACTIVE' && contract.status !== 'DRAFT') {
      throw new BadRequestException('Solo puedes agregar entregables a contratos activos o en borrador');
    }

    return this.prisma.deliverable.create({
      data: {
        contractId: dto.contractId,
        creatorProfileId: contract.application.creatorProfile.id,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        specifications: dto.specifications as any,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        orderIndex: dto.orderIndex || 0,
        status: DeliverableStatus.PENDING,
      },
    });
  }

  // ============================================
  // READ — Creator's deliverables
  // ============================================

  async findByCreator(creatorUserId: string, params: ListDeliverablesParams) {
    const { status, contractId, page = 1, limit = 20 } = params;

    const where: Prisma.DeliverableWhereInput = {
      contract: { creatorUserId },
    };
    if (status) where.status = status;
    if (contractId) where.contractId = contractId;

    const skip = (page - 1) * limit;

    const [deliverables, total] = await Promise.all([
      this.prisma.deliverable.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          contract: {
            include: {
              campaign: {
                include: {
                  brandProfile: {
                    select: { companyName: true, logoUrl: true },
                  },
                },
              },
            },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.deliverable.count({ where }),
    ]);

    return {
      data: deliverables,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // READ — Brand's deliverables for a contract
  // ============================================

  async findByContract(contractId: string, brandUserId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    return this.prisma.deliverable.findMany({
      where: { contractId },
      orderBy: { orderIndex: 'asc' },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        creatorProfile: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  // ============================================
  // READ — Single deliverable detail
  // ============================================

  async findById(id: string, userId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            campaign: {
              include: {
                brandProfile: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                    industry: true,
                    userId: true,
                  },
                },
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            visualComments: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        creatorProfile: {
          select: { id: true, displayName: true, avatarUrl: true, userId: true },
        },
      },
    });

    if (!deliverable) {
      throw new NotFoundException('Entregable no encontrado');
    }

    const isBrand = deliverable.contract.campaign.brandProfile.userId === userId;
    const isCreator = deliverable.creatorProfile.userId === userId;

    if (!isBrand && !isCreator) {
      throw new ForbiddenException('No tienes acceso a este entregable');
    }

    return deliverable;
  }

  // ============================================
  // CREATE VERSION — Creator uploads new version
  // ============================================

  async createVersion(deliverableId: string, creatorUserId: string, dto: CreateVersionDto) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!deliverable) {
      throw new NotFoundException('Entregable no encontrado');
    }

    if (deliverable.contract.creatorUserId !== creatorUserId) {
      throw new ForbiddenException('No tienes permiso para subir archivos a este entregable');
    }

    const blockedStatuses: DeliverableStatus[] = [
      DeliverableStatus.APPROVED,
      DeliverableStatus.PUBLISHED,
      DeliverableStatus.IN_REVIEW,
    ];
    if (blockedStatuses.includes(deliverable.status)) {
      throw new BadRequestException(
        `No puedes subir archivos cuando el entregable está en estado ${deliverable.status}`,
      );
    }

    const lastVersion = deliverable.versions[0];
    const nextVersion = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return this.prisma.$transaction(async (tx) => {
      // Mark previous versions as SUPERSEDED
      if (deliverable.versions.length > 0) {
        await tx.deliverableVersion.updateMany({
          where: {
            deliverableId,
            status: VersionStatus.SUBMITTED,
          },
          data: { status: VersionStatus.SUPERSEDED },
        });
      }

      const version = await tx.deliverableVersion.create({
        data: {
          deliverableId,
          versionNumber: nextVersion,
          fileUrl: dto.fileUrl,
          fileName: dto.fileName,
          fileSize: dto.fileSize,
          mimeType: dto.mimeType,
          videoProvider: dto.videoProvider as any,
          videoAssetId: dto.videoAssetId,
          videoPlaybackId: dto.videoPlaybackId,
          videoDuration: dto.videoDuration,
          videoThumbnailUrl: dto.videoThumbnailUrl,
          metadata: dto.metadata as any,
          creatorNotes: dto.creatorNotes,
          status: VersionStatus.SUBMITTED,
        },
      });

      // Update deliverable status to DRAFT and set current version
      await tx.deliverable.update({
        where: { id: deliverableId },
        data: {
          status: DeliverableStatus.DRAFT,
          currentVersionId: version.id,
        },
      });

      return version;
    });
  }

  // ============================================
  // SUBMIT — Creator submits for review
  // ============================================

  async submitForReview(deliverableId: string, creatorUserId: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: true,
        versions: true,
      },
    });

    if (!deliverable) {
      throw new NotFoundException('Entregable no encontrado');
    }

    if (deliverable.contract.creatorUserId !== creatorUserId) {
      throw new ForbiddenException('No tienes permiso');
    }

    if (deliverable.versions.length === 0) {
      throw new BadRequestException('Debes subir al menos un archivo antes de enviar para revisión');
    }

    const submittableStatuses: DeliverableStatus[] = [
      DeliverableStatus.DRAFT,
      DeliverableStatus.CHANGES_REQUESTED,
    ];
    if (!submittableStatuses.includes(deliverable.status)) {
      throw new BadRequestException(
        `No puedes enviar para revisión desde el estado ${deliverable.status}`,
      );
    }

    return this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: {
        status: DeliverableStatus.IN_REVIEW,
        submittedAt: new Date(),
      },
    });
  }

  // ============================================
  // REVIEW — Brand reviews deliverable
  // ============================================

  async review(deliverableId: string, brandUserId: string, dto: ReviewDto) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: {
        contract: true,
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!deliverable) {
      throw new NotFoundException('Entregable no encontrado');
    }

    if (deliverable.contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para revisar este entregable');
    }

    if (deliverable.status !== DeliverableStatus.IN_REVIEW) {
      throw new BadRequestException('Este entregable no está en revisión');
    }

    const latestVersion = deliverable.versions[0];

    if (dto.action === 'approve') {
      return this.prisma.$transaction(async (tx) => {
        await tx.deliverable.update({
          where: { id: deliverableId },
          data: {
            status: DeliverableStatus.APPROVED,
            approvedAt: new Date(),
          },
        });

        if (latestVersion) {
          await tx.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: {
              status: VersionStatus.APPROVED,
              reviewedAt: new Date(),
            },
          });
        }

        return tx.deliverable.findUnique({
          where: { id: deliverableId },
          include: { versions: { orderBy: { versionNumber: 'desc' } } },
        });
      });
    }

    if (dto.action === 'request_changes') {
      if (!dto.feedback) {
        throw new BadRequestException('Debes proporcionar feedback sobre los cambios requeridos');
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.deliverable.update({
          where: { id: deliverableId },
          data: { status: DeliverableStatus.CHANGES_REQUESTED },
        });

        if (latestVersion) {
          await tx.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: {
              status: VersionStatus.REJECTED,
              reviewedAt: new Date(),
            },
          });
        }

        return tx.deliverable.findUnique({
          where: { id: deliverableId },
          include: { versions: { orderBy: { versionNumber: 'desc' } } },
        });
      });
    }

    if (dto.action === 'reject') {
      if (!dto.feedback) {
        throw new BadRequestException('Debes proporcionar un motivo de rechazo');
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.deliverable.update({
          where: { id: deliverableId },
          data: { status: DeliverableStatus.REJECTED },
        });

        if (latestVersion) {
          await tx.deliverableVersion.update({
            where: { id: latestVersion.id },
            data: {
              status: VersionStatus.REJECTED,
              reviewedAt: new Date(),
            },
          });
        }

        return tx.deliverable.findUnique({
          where: { id: deliverableId },
          include: { versions: { orderBy: { versionNumber: 'desc' } } },
        });
      });
    }

    throw new BadRequestException('Acción no válida');
  }

  // ============================================
  // UPDATE — Mark as published
  // ============================================

  async markPublished(deliverableId: string, creatorUserId: string, publishedUrl: string) {
    const deliverable = await this.prisma.deliverable.findUnique({
      where: { id: deliverableId },
      include: { contract: true },
    });

    if (!deliverable) {
      throw new NotFoundException('Entregable no encontrado');
    }

    if (deliverable.contract.creatorUserId !== creatorUserId) {
      throw new ForbiddenException('No tienes permiso');
    }

    if (deliverable.status !== DeliverableStatus.APPROVED) {
      throw new BadRequestException('Solo entregables aprobados pueden marcarse como publicados');
    }

    return this.prisma.deliverable.update({
      where: { id: deliverableId },
      data: {
        status: DeliverableStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedUrl,
      },
    });
  }
}
