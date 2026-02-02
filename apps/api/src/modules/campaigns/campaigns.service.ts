import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CampaignStatus, CampaignVisibility, Prisma } from '@markinflu/database';

interface CreateCampaignDto {
  title: string;
  description: string;
  brief?: any;
  requirements?: any;
  deliverableSpecs?: any;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: string;
  currency?: string;
  applicationDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  visibility?: CampaignVisibility;
  maxCreators?: number;
  coverImageUrl?: string;
}

interface CampaignSearchParams {
  query?: string;
  industries?: string[];
  budgetMin?: number;
  budgetMax?: number;
  status?: CampaignStatus;
  hasSpots?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  // ============================================
  // CREATE
  // ============================================

  async create(brandUserId: string, dto: CreateCampaignDto) {
    const brandProfile = await this.prisma.brandProfile.findUnique({
      where: { userId: brandUserId },
    });

    if (!brandProfile) {
      throw new ForbiddenException('Debes tener un perfil de marca');
    }

    // Generate slug
    const slug = this.generateSlug(dto.title);

    return this.prisma.campaign.create({
      data: {
        brandProfileId: brandProfile.id,
        title: dto.title,
        slug,
        description: dto.description,
        brief: dto.brief as any,
        requirements: dto.requirements as any,
        deliverableSpecs: dto.deliverableSpecs as any,
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        budgetType: (dto.budgetType as any) || 'PER_CREATOR',
        currency: dto.currency || 'USD',
        applicationDeadline: dto.applicationDeadline,
        startDate: dto.startDate,
        endDate: dto.endDate,
        visibility: dto.visibility || CampaignVisibility.PRIVATE,
        maxCreators: dto.maxCreators || 10,
        coverImageUrl: dto.coverImageUrl,
        status: CampaignStatus.DRAFT,
      },
      include: {
        brandProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            industry: true,
          },
        },
      },
    });
  }

  // ============================================
  // READ
  // ============================================

  async findById(id: string, userId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
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
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    // Check access for private campaigns
    if (campaign.visibility === CampaignVisibility.PRIVATE) {
      if (!userId || campaign.brandProfile.userId !== userId) {
        throw new ForbiddenException('No tienes acceso a esta campaña');
      }
    }

    return campaign;
  }

  async findBySlug(slug: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
      include: {
        brandProfile: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            industry: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.visibility === CampaignVisibility.PRIVATE) {
      throw new ForbiddenException('Esta campaña es privada');
    }

    return campaign;
  }

  async search(params: CampaignSearchParams) {
    const {
      query,
      industries,
      budgetMin,
      budgetMax,
      status = CampaignStatus.PUBLISHED,
      hasSpots,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.CampaignWhereInput = {
      status,
      visibility: CampaignVisibility.PUBLIC,
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (industries && industries.length > 0) {
      where.brandProfile = {
        industry: { hasSome: industries },
      };
    }

    if (budgetMin !== undefined) {
      where.budgetMax = { gte: budgetMin };
    }

    if (budgetMax !== undefined) {
      where.budgetMin = { lte: budgetMax };
    }

    if (hasSpots) {
      where.currentCreators = { lt: { $col: 'maxCreators' } as any };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          brandProfile: {
            select: {
              companyName: true,
              logoUrl: true,
              industry: true,
            },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns.map((c) => ({
        ...c,
        spotsRemaining: c.maxCreators - c.currentCreators,
        isExpired: c.applicationDeadline
          ? new Date(c.applicationDeadline) < new Date()
          : false,
      })),
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

  async findByBrand(brandUserId: string, status?: CampaignStatus) {
    const brandProfile = await this.prisma.brandProfile.findUnique({
      where: { userId: brandUserId },
    });

    if (!brandProfile) {
      return { data: [], meta: { total: 0 } };
    }

    const where: Prisma.CampaignWhereInput = {
      brandProfileId: brandProfile.id,
    };

    if (status) {
      where.status = status;
    }

    const campaigns = await this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return {
      data: campaigns,
      meta: { total: campaigns.length },
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  async update(id: string, brandUserId: string, dto: Partial<CreateCampaignDto>) {
    const campaign = await this.verifyOwnership(id, brandUserId);

    // Can't update certain fields if published
    if (campaign.status === CampaignStatus.PUBLISHED) {
      const restrictedFields = ['budgetMin', 'budgetMax', 'maxCreators'] as const;
      for (const field of restrictedFields) {
        if (dto[field] !== undefined && dto[field] !== (campaign as any)[field]) {
          throw new BadRequestException(
            `No puedes modificar ${field} en una campaña publicada`,
          );
        }
      }
    }

    const { brief, requirements, deliverableSpecs, budgetType, ...rest } = dto;

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...rest,
        ...(budgetType && { budgetType: budgetType as any }),
        brief: brief as any,
        requirements: requirements as any,
        deliverableSpecs: deliverableSpecs as any,
      },
      include: {
        brandProfile: {
          select: { companyName: true, logoUrl: true },
        },
      },
    });

    // Invalidate cache
    await this.redisService.invalidatePattern(`campaign:${id}*`);

    return updated;
  }

  async publish(id: string, brandUserId: string) {
    const campaign = await this.verifyOwnership(id, brandUserId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Solo puedes publicar campañas en borrador');
    }

    // Validate required fields
    if (!campaign.description || !campaign.budgetMax) {
      throw new BadRequestException('Completa todos los campos requeridos antes de publicar');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async pause(id: string, brandUserId: string) {
    await this.verifyOwnership(id, brandUserId);

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async close(id: string, brandUserId: string) {
    await this.verifyOwnership(id, brandUserId);

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED },
    });
  }

  // ============================================
  // DELETE
  // ============================================

  async delete(id: string, brandUserId: string) {
    const campaign = await this.verifyOwnership(id, brandUserId);

    if (campaign.status === CampaignStatus.PUBLISHED) {
      throw new BadRequestException('No puedes eliminar una campaña publicada');
    }

    // Check for applications
    const applicationCount = await this.prisma.application.count({
      where: { campaignId: id },
    });

    if (applicationCount > 0) {
      throw new BadRequestException('No puedes eliminar una campaña con aplicaciones');
    }

    await this.prisma.campaign.delete({ where: { id } });

    return { message: 'Campaña eliminada exitosamente' };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async verifyOwnership(campaignId: string, brandUserId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        brandProfile: {
          select: { userId: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaña no encontrada');
    }

    if (campaign.brandProfile.userId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para modificar esta campaña');
    }

    return campaign;
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }
}
