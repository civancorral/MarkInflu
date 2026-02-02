import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ContractStatus, ApplicationStatus, MilestoneStatus, MilestoneTrigger, Prisma } from '@markinflu/database';

interface CreateContractDto {
  applicationId: string;
  terms: {
    deliverables?: string[];
    paymentTerms?: string;
    revisionPolicy?: string;
    usageRights?: string;
    exclusivity?: any;
    cancellationPolicy?: string;
  };
  totalAmount: number;
  currency?: string;
  startDate: string;
  endDate?: string;
  milestones?: {
    title: string;
    description?: string;
    amount: number;
    percentage?: number;
    triggerType: MilestoneTrigger;
    triggerCondition?: any;
    dueDate?: string;
    orderIndex: number;
  }[];
}

interface ListContractsParams {
  status?: ContractStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE — Brand creates contract after hiring
  // ============================================

  async create(brandUserId: string, dto: CreateContractDto) {
    // Verify the application exists and is HIRED
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: {
        campaign: {
          include: {
            brandProfile: { select: { userId: true } },
          },
        },
        creatorProfile: { select: { userId: true } },
        contract: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Aplicación no encontrada');
    }

    if (application.campaign.brandProfile.userId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para crear este contrato');
    }

    if (application.status !== ApplicationStatus.HIRED) {
      throw new BadRequestException(
        'Solo puedes crear contratos para aplicaciones con estado HIRED',
      );
    }

    if (application.contract) {
      throw new ConflictException('Ya existe un contrato para esta aplicación');
    }

    const contractNumber = this.generateContractNumber();

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          campaignId: application.campaignId,
          applicationId: application.id,
          brandUserId,
          creatorUserId: application.creatorProfile.userId,
          contractNumber,
          terms: dto.terms as any,
          totalAmount: dto.totalAmount,
          currency: dto.currency || 'USD',
          status: ContractStatus.DRAFT,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        },
      });

      // Create milestones if provided
      if (dto.milestones && dto.milestones.length > 0) {
        await tx.milestone.createMany({
          data: dto.milestones.map((m) => ({
            contractId: contract.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            percentage: m.percentage,
            triggerType: m.triggerType,
            triggerCondition: m.triggerCondition as any,
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
            orderIndex: m.orderIndex,
            status: MilestoneStatus.PENDING,
          })),
        });
      }

      return tx.contract.findUnique({
        where: { id: contract.id },
        include: {
          milestones: { orderBy: { orderIndex: 'asc' } },
          campaign: {
            select: { id: true, title: true, slug: true },
          },
        },
      });
    });
  }

  // ============================================
  // READ — Brand's contracts for a campaign
  // ============================================

  async findByCampaign(campaignId: string, brandUserId: string) {
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

    return this.prisma.contract.findMany({
      where: { campaignId },
      include: {
        milestones: { orderBy: { orderIndex: 'asc' } },
        application: {
          include: {
            creatorProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // READ — Creator's contracts
  // ============================================

  async findByCreator(creatorUserId: string, params: ListContractsParams) {
    const { status, page = 1, limit = 20 } = params;

    const where: Prisma.ContractWhereInput = { creatorUserId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          milestones: { orderBy: { orderIndex: 'asc' } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // READ — Single contract detail
  // ============================================

  async findById(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
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
                website: true,
                userId: true,
              },
            },
          },
        },
        milestones: { orderBy: { orderIndex: 'asc' } },
        deliverables: { orderBy: { createdAt: 'desc' } },
        application: {
          include: {
            creatorProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (
      contract.brandUserId !== userId &&
      contract.creatorUserId !== userId
    ) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    return contract;
  }

  // ============================================
  // UPDATE — Send contract for signature (brand)
  // ============================================

  async sendForSignature(id: string, brandUserId: string) {
    const contract = await this.verifyBrandOwnership(id, brandUserId);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Solo contratos en borrador pueden enviarse para firma');
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.PENDING_CREATOR_SIGNATURE,
        brandSignedAt: new Date(),
      },
    });
  }

  // ============================================
  // UPDATE — Creator signs contract
  // ============================================

  async creatorSign(id: string, creatorUserId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.creatorUserId !== creatorUserId) {
      throw new ForbiddenException('No tienes permiso para firmar este contrato');
    }

    if (contract.status !== ContractStatus.PENDING_CREATOR_SIGNATURE) {
      throw new BadRequestException('Este contrato no está pendiente de tu firma');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: {
          status: ContractStatus.ACTIVE,
          creatorSignedAt: new Date(),
        },
      });

      // Activate CONTRACT_SIGNED milestones
      await tx.milestone.updateMany({
        where: {
          contractId: id,
          triggerType: MilestoneTrigger.CONTRACT_SIGNED,
          status: MilestoneStatus.PENDING,
        },
        data: {
          status: MilestoneStatus.READY,
          completedAt: new Date(),
        },
      });

      return updated;
    });
  }

  // ============================================
  // UPDATE — Cancel contract
  // ============================================

  async cancel(id: string, userId: string, reason: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== userId && contract.creatorUserId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar este contrato');
    }

    const cancellableStatuses: ContractStatus[] = [
      ContractStatus.DRAFT,
      ContractStatus.PENDING_CREATOR_SIGNATURE,
      ContractStatus.PENDING_BRAND_SIGNATURE,
      ContractStatus.ACTIVE,
    ];

    if (!cancellableStatuses.includes(contract.status)) {
      throw new BadRequestException(
        `No se puede cancelar un contrato con estado ${contract.status}`,
      );
    }

    if (!reason) {
      throw new BadRequestException('Debes proporcionar un motivo de cancelación');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id },
        data: { status: ContractStatus.CANCELLED },
      });

      // Cancel pending milestones
      await tx.milestone.updateMany({
        where: {
          contractId: id,
          status: { in: [MilestoneStatus.PENDING, MilestoneStatus.READY] },
        },
        data: { status: MilestoneStatus.CANCELLED },
      });

      return updated;
    });
  }

  // ============================================
  // UPDATE — Complete contract
  // ============================================

  async complete(id: string, brandUserId: string) {
    const contract = await this.verifyBrandOwnership(id, brandUserId);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Solo contratos activos pueden completarse');
    }

    return this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.COMPLETED },
    });
  }

  // ============================================
  // MILESTONES — Update milestone status
  // ============================================

  async updateMilestoneStatus(
    milestoneId: string,
    brandUserId: string,
    status: MilestoneStatus,
  ) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Hito no encontrado');
    }

    if (milestone.contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para modificar este hito');
    }

    const updateData: Prisma.MilestoneUpdateInput = { status };

    if (status === MilestoneStatus.READY) {
      updateData.completedAt = new Date();
    } else if (status === MilestoneStatus.PAID) {
      updateData.paidAt = new Date();
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private async verifyBrandOwnership(contractId: string, brandUserId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para modificar este contrato');
    }

    return contract;
  }

  private generateContractNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MKI-${timestamp}${random}`;
  }
}
