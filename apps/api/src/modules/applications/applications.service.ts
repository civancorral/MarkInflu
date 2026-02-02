import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApplicationStatus, CampaignStatus, Prisma } from '@markinflu/database';

interface CreateApplicationDto {
  campaignId: string;
  proposedRate?: number;
  currency?: string;
  pitch?: string;
  proposal?: any;
  portfolioLinks?: string[];
}

interface UpdateStatusDto {
  status: ApplicationStatus;
  rejectionReason?: string;
}

interface ListApplicationsParams {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Creator applies to campaign
  // ============================================

  async create(creatorUserId: string, dto: CreateApplicationDto) {
    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creatorProfile) {
      throw new ForbiddenException('Debes tener un perfil de creador');
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.status !== CampaignStatus.PUBLISHED) {
      throw new BadRequestException('Esta campaña no está aceptando aplicaciones');
    }

    if (
      campaign.applicationDeadline &&
      new Date(campaign.applicationDeadline) < new Date()
    ) {
      throw new BadRequestException('El plazo de aplicación ha expirado');
    }

    if (campaign.currentCreators >= campaign.maxCreators) {
      throw new BadRequestException('Esta campaña ya no tiene cupos disponibles');
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        campaignId_creatorProfileId: {
          campaignId: dto.campaignId,
          creatorProfileId: creatorProfile.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ya has aplicado a esta campaña');
    }

    return this.prisma.application.create({
      data: {
        campaignId: dto.campaignId,
        creatorProfileId: creatorProfile.id,
        proposedRate: dto.proposedRate,
        currency: dto.currency || 'USD',
        pitch: dto.pitch,
        proposal: dto.proposal as any,
        portfolioLinks: dto.portfolioLinks || [],
        status: ApplicationStatus.APPLIED,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // ============================================
  // READ — List applications for a campaign (brand)
  // ============================================

  async findByCampaign(
    campaignId: string,
    brandUserId: string,
    params: ListApplicationsParams,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { brandProfile: { select: { userId: true } } },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.brandProfile.userId !== brandUserId) {
      throw new ForbiddenException('No tienes acceso a esta campaña');
    }

    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'appliedAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ApplicationWhereInput = { campaignId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          creatorProfile: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              primaryNiche: true,
              secondaryNiches: true,
              location: true,
              userId: true,
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ============================================
  // READ — My applications (creator)
  // ============================================

  async findMine(creatorUserId: string, params: ListApplicationsParams) {
    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creatorProfile) {
      throw new ForbiddenException('Debes tener un perfil de creador');
    }

    const { status, page = 1, limit = 20 } = params;

    const where: Prisma.ApplicationWhereInput = {
      creatorProfileId: creatorProfile.id,
    };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        include: {
          campaign: {
            include: {
              brandProfile: {
                select: {
                  companyName: true,
                  logoUrl: true,
                  industry: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // READ — Single application detail
  // ============================================

  async findById(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            brandProfile: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                industry: true,
                userId: true,
              },
            },
          },
        },
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            primaryNiche: true,
            secondaryNiches: true,
            location: true,
            portfolioUrls: true,
            userId: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    const isBrandOwner = application.campaign.brandProfile.userId === userId;
    const isCreatorOwner = application.creatorProfile.userId === userId;

    if (!isBrandOwner && !isCreatorOwner) {
      throw new ForbiddenException('No tienes acceso a esta aplicación');
    }

    // Hide internal notes from creator
    if (isCreatorOwner && !isBrandOwner) {
      return { ...application, internalNotes: undefined };
    }

    return application;
  }

  // ============================================
  // UPDATE — Change application status (brand)
  // ============================================

  async updateStatus(id: string, brandUserId: string, dto: UpdateStatusDto) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            brandProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (application.campaign.brandProfile.userId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para modificar esta aplicación');
    }

    this.validateStatusTransition(application.status, dto.status);

    if (dto.status === ApplicationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Debes proporcionar un motivo de rechazo');
    }

    const updateData: Prisma.ApplicationUpdateInput = {
      status: dto.status,
    };

    if (dto.status === ApplicationStatus.SHORTLISTED) {
      updateData.shortlistedAt = new Date();
    } else if (dto.status === ApplicationStatus.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.rejectionReason;
    } else if (dto.status === ApplicationStatus.HIRED) {
      updateData.hiredAt = new Date();
    }

    // If HIRED, increment campaign.currentCreators in transaction
    if (dto.status === ApplicationStatus.HIRED) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.application.update({
          where: { id },
          data: updateData,
          include: {
            creatorProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });

        await tx.campaign.update({
          where: { id: application.campaignId },
          data: { currentCreators: { increment: 1 } },
        });

        return updated;
      });
    }

    return this.prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        creatorProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  // ============================================
  // UPDATE — Withdraw application (creator)
  // ============================================

  async withdraw(id: string, creatorUserId: string) {
    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creatorProfile) {
      throw new ForbiddenException('Debes tener un perfil de creador');
    }

    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (application.creatorProfileId !== creatorProfile.id) {
      throw new ForbiddenException('No tienes permiso para retirar esta aplicación');
    }

    const finalStatuses: ApplicationStatus[] = [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ];
    if (finalStatuses.includes(application.status)) {
      throw new BadRequestException(
        `No puedes retirar una aplicación con estado ${application.status}`,
      );
    }

    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    });
  }

  // ============================================
  // UPDATE — Add internal notes (brand)
  // ============================================

  async updateNotes(id: string, brandUserId: string, notes: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            brandProfile: { select: { userId: true } },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (application.campaign.brandProfile.userId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para modificar esta aplicación');
    }

    return this.prisma.application.update({
      where: { id },
      data: { internalNotes: notes },
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private validateStatusTransition(
    current: ApplicationStatus,
    next: ApplicationStatus,
  ) {
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.APPLIED]: [
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
      ],
      [ApplicationStatus.UNDER_REVIEW]: [
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
      ],
      [ApplicationStatus.SHORTLISTED]: [
        ApplicationStatus.HIRED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
      ],
      [ApplicationStatus.REJECTED]: [],
      [ApplicationStatus.HIRED]: [],
      [ApplicationStatus.WITHDRAWN]: [],
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `No se puede cambiar de ${current} a ${next}`,
      );
    }
  }
}
