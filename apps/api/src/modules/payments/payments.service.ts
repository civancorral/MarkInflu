import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  EscrowStatus,
  MilestoneStatus,
  PaymentStatus,
  PaymentType,
  Prisma,
} from '@markinflu/database';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private platformFeePercent: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-04-10' as any,
    });
    this.platformFeePercent = parseFloat(
      this.config.get<string>('PLATFORM_FEE_PERCENT') || '0.10',
    );
  }

  // ============================================
  // ESCROW — Brand funds contract
  // ============================================

  async createEscrow(contractId: string, brandUserId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { escrowTransaction: true },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para fondear este contrato');
    }

    if (contract.status !== 'ACTIVE') {
      throw new BadRequestException('Solo contratos activos pueden fondearse');
    }

    if (contract.escrowTransaction) {
      throw new BadRequestException('Este contrato ya tiene un escrow activo');
    }

    const totalAmount = Number(contract.totalAmount);
    const platformFee = Math.round(totalAmount * this.platformFeePercent * 100) / 100;

    // Get or create Stripe customer
    const brandUser = await this.prisma.user.findUnique({
      where: { id: brandUserId },
    });

    let stripeCustomerId = brandUser?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: brandUser!.email,
        metadata: { userId: brandUserId },
      });
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: brandUserId },
        data: { stripeCustomerId },
      });
    }

    // Create PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: contract.currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: {
        contractId,
        type: 'escrow',
      },
    });

    // Create escrow record
    const escrow = await this.prisma.escrowTransaction.create({
      data: {
        contractId,
        brandUserId,
        creatorUserId: contract.creatorUserId,
        totalAmount,
        platformFee,
        currency: contract.currency,
        status: EscrowStatus.PENDING_DEPOSIT,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      escrow,
      clientSecret: paymentIntent.client_secret,
    };
  }

  // ============================================
  // ESCROW — Confirm funding (called by webhook)
  // ============================================

  async confirmEscrowFunding(stripePaymentIntentId: string) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow no encontrado');
    }

    if (escrow.status !== EscrowStatus.PENDING_DEPOSIT) {
      return escrow;
    }

    return this.prisma.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        status: EscrowStatus.FUNDED,
        fundedAt: new Date(),
      },
    });
  }

  // ============================================
  // RELEASE — Release milestone payment
  // ============================================

  async releaseMilestone(milestoneId: string, brandUserId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: { escrowTransaction: true },
        },
        payment: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Hito no encontrado');
    }

    if (milestone.contract.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso para liberar este pago');
    }

    if (milestone.status !== MilestoneStatus.READY) {
      throw new BadRequestException(
        `Solo hitos con estado READY pueden liberarse. Estado actual: ${milestone.status}`,
      );
    }

    if (milestone.payment) {
      throw new BadRequestException('Este hito ya tiene un pago asociado');
    }

    const escrow = milestone.contract.escrowTransaction;
    if (!escrow) {
      throw new BadRequestException('El contrato no tiene fondos en escrow');
    }

    const validEscrowStatuses: EscrowStatus[] = [
      EscrowStatus.FUNDED,
      EscrowStatus.PARTIALLY_RELEASED,
    ];
    if (!validEscrowStatuses.includes(escrow.status)) {
      throw new BadRequestException(
        `No se puede liberar pago. Estado del escrow: ${escrow.status}`,
      );
    }

    const milestoneAmount = Number(milestone.amount);
    const platformFee = Math.round(milestoneAmount * this.platformFeePercent * 100) / 100;
    const netAmount = milestoneAmount - platformFee;

    // Check creator has Stripe Connect
    const creatorUser = await this.prisma.user.findUnique({
      where: { id: milestone.contract.creatorUserId },
    });

    if (!creatorUser?.stripeConnectId) {
      throw new BadRequestException(
        'El creador no tiene cuenta Stripe Connect configurada',
      );
    }

    // Transfer to creator via Stripe Connect
    let stripeTransferId: string | null = null;
    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(netAmount * 100),
        currency: escrow.currency.toLowerCase(),
        destination: creatorUser.stripeConnectId,
        metadata: {
          milestoneId,
          contractId: milestone.contractId,
          paymentType: 'milestone_release',
        },
      });
      stripeTransferId = transfer.id;
    } catch (error: any) {
      throw new BadRequestException(
        `Error al procesar la transferencia: ${error.message}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          escrowTransactionId: escrow.id,
          milestoneId,
          recipientUserId: milestone.contract.creatorUserId,
          amount: milestoneAmount,
          platformFee,
          netAmount,
          currency: escrow.currency,
          status: PaymentStatus.COMPLETED,
          type: PaymentType.MILESTONE_RELEASE,
          stripeTransferId,
          completedAt: new Date(),
        },
      });

      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.PAID,
          paidAt: new Date(),
        },
      });

      const newReleasedAmount = Number(escrow.releasedAmount) + milestoneAmount;
      const isFullyReleased = newReleasedAmount >= Number(escrow.totalAmount);

      await tx.escrowTransaction.update({
        where: { id: escrow.id },
        data: {
          releasedAmount: newReleasedAmount,
          releasedAt: new Date(),
          status: isFullyReleased
            ? EscrowStatus.FULLY_RELEASED
            : EscrowStatus.PARTIALLY_RELEASED,
        },
      });

      return payment;
    });
  }

  // ============================================
  // READ — Escrow details for contract
  // ============================================

  async getEscrowByContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }

    if (contract.brandUserId !== userId && contract.creatorUserId !== userId) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }

    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { contractId },
      include: {
        payments: {
          orderBy: { initiatedAt: 'desc' },
          include: {
            milestone: { select: { id: true, title: true, orderIndex: true } },
          },
        },
      },
    });

    if (!escrow) {
      throw new NotFoundException('No hay escrow para este contrato');
    }

    return escrow;
  }

  // ============================================
  // READ — Creator's payment history
  // ============================================

  async getCreatorPayments(
    creatorUserId: string,
    params: { page?: number; limit?: number; status?: PaymentStatus },
  ) {
    const { page = 1, limit = 20, status } = params;

    const where: Prisma.PaymentWhereInput = {
      recipientUserId: creatorUserId,
    };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { initiatedAt: 'desc' },
        include: {
          milestone: { select: { id: true, title: true } },
          escrowTransaction: {
            select: {
              contractId: true,
              contract: {
                select: {
                  contractNumber: true,
                  campaign: {
                    select: {
                      title: true,
                      brandProfile: {
                        select: { companyName: true, logoUrl: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // READ — Brand's escrow history
  // ============================================

  async getBrandEscrows(
    brandUserId: string,
    params: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [escrows, total] = await Promise.all([
      this.prisma.escrowTransaction.findMany({
        where: { brandUserId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              campaign: { select: { title: true } },
              application: {
                select: {
                  creatorProfile: {
                    select: { displayName: true, avatarUrl: true },
                  },
                },
              },
            },
          },
          payments: { orderBy: { initiatedAt: 'desc' } },
        },
      }),
      this.prisma.escrowTransaction.count({ where: { brandUserId } }),
    ]);

    return {
      data: escrows,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================
  // STRIPE CONNECT — Onboarding link for creator
  // ============================================

  async createConnectOnboardingLink(creatorUserId: string, returnUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorUserId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let connectId = user.stripeConnectId;

    if (!connectId) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { userId: creatorUserId },
        capabilities: {
          transfers: { requested: true },
        },
      });
      connectId = account.id;
      await this.prisma.user.update({
        where: { id: creatorUserId },
        data: {
          stripeConnectId: connectId,
          stripeConnectStatus: 'PENDING',
        },
      });
    }

    const accountLink = await this.stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }

  // ============================================
  // STRIPE CONNECT — Check account status
  // ============================================

  async getConnectStatus(creatorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: creatorUserId },
    });

    if (!user?.stripeConnectId) {
      return { status: 'NOT_CONNECTED', detailsSubmitted: false, payoutsEnabled: false };
    }

    const account = await this.stripe.accounts.retrieve(user.stripeConnectId);

    const newStatus = account.details_submitted
      ? account.payouts_enabled
        ? 'ACTIVE'
        : 'RESTRICTED'
      : 'PENDING';

    if (newStatus !== user.stripeConnectStatus) {
      await this.prisma.user.update({
        where: { id: creatorUserId },
        data: { stripeConnectStatus: newStatus as any },
      });
    }

    return {
      status: newStatus,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
    };
  }

  // ============================================
  // REFUND — Refund escrow to brand
  // ============================================

  async refundEscrow(contractId: string, brandUserId: string) {
    const escrow = await this.prisma.escrowTransaction.findUnique({
      where: { contractId },
      include: { contract: true },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow no encontrado');
    }

    if (escrow.brandUserId !== brandUserId) {
      throw new ForbiddenException('No tienes permiso');
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException(
        `No se puede reembolsar un escrow con estado ${escrow.status}`,
      );
    }

    const refundableAmount = Number(escrow.totalAmount) - Number(escrow.releasedAmount);
    if (refundableAmount <= 0) {
      throw new BadRequestException('No hay fondos por reembolsar');
    }

    if (escrow.stripePaymentIntentId) {
      await this.stripe.refunds.create({
        payment_intent: escrow.stripePaymentIntentId,
        amount: Math.round(refundableAmount * 100),
      });
    }

    return this.prisma.escrowTransaction.update({
      where: { id: escrow.id },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAmount: refundableAmount,
        refundedAt: new Date(),
      },
    });
  }
}
