import {
  Controller,
  Post,
  Req,
  Headers,
  RawBodyRequest,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  private stripe: Stripe;
  private stripeWebhookSecret: string;

  constructor(
    private configService: ConfigService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      { apiVersion: '2024-04-10' as any },
    );
    this.stripeWebhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        this.stripeWebhookSecret,
      );
    } catch (err: any) {
      this.logger.error(`Stripe webhook signature verification failed: ${err.message}`);
      return { error: 'Invalid signature' };
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          if (paymentIntent.metadata?.type === 'escrow') {
            await this.paymentsService.confirmEscrowFunding(paymentIntent.id);

            // Notify creator that escrow is funded
            const escrow = await this.prisma.escrowTransaction.findUnique({
              where: { stripePaymentIntentId: paymentIntent.id },
              include: {
                contract: {
                  select: { contractNumber: true, campaign: { select: { title: true } } },
                },
              },
            });

            if (escrow) {
              await this.notificationsService.notify(
                escrow.creatorUserId,
                'ESCROW_FUNDED',
                'Fondos depositados',
                `Los fondos para el contrato ${escrow.contract.contractNumber} han sido depositados en escrow.`,
                {
                  referenceType: 'Contract',
                  referenceId: escrow.contractId,
                  actionUrl: `/dashboard/contracts/${escrow.contractId}`,
                },
              );
            }
          }
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          this.logger.warn(
            `Payment failed for intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message}`,
          );
          break;
        }

        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          // Update creator's Stripe Connect status
          const user = await this.prisma.user.findFirst({
            where: { stripeConnectId: account.id },
          });

          if (user) {
            const newStatus = account.details_submitted
              ? account.payouts_enabled
                ? 'ACTIVE'
                : 'RESTRICTED'
              : 'PENDING';

            await this.prisma.user.update({
              where: { id: user.id },
              data: { stripeConnectStatus: newStatus as any },
            });

            if (newStatus === 'ACTIVE' && user.stripeConnectStatus !== 'ACTIVE') {
              await this.notificationsService.notify(
                user.id,
                'STRIPE_CONNECTED',
                'Cuenta de pagos activada',
                'Tu cuenta Stripe Connect ha sido verificada. Ya puedes recibir pagos.',
                { actionUrl: '/dashboard/settings' },
              );
            }
          }
          break;
        }

        case 'transfer.created': {
          const transfer = event.data.object as Stripe.Transfer;
          this.logger.log(`Transfer created: ${transfer.id} — $${transfer.amount / 100}`);
          break;
        }

        default:
          this.logger.log(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing Stripe webhook ${event.type}: ${error.message}`);
    }

    return { received: true };
  }

  @Post('mux')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mux webhook handler' })
  async handleMuxWebhook(@Req() req: Request) {
    const body = req.body;

    this.logger.log(`Mux webhook received: ${body?.type}`);

    try {
      switch (body?.type) {
        case 'video.asset.ready': {
          const assetId = body.data?.id;
          const playbackId = body.data?.playback_ids?.[0]?.id;
          const duration = body.data?.duration;

          if (assetId) {
            // Update deliverable version with video info
            await this.prisma.deliverableVersion.updateMany({
              where: { videoAssetId: assetId },
              data: {
                videoPlaybackId: playbackId || null,
                videoDuration: duration || null,
                videoThumbnailUrl: playbackId
                  ? `https://image.mux.com/${playbackId}/thumbnail.webp`
                  : null,
              },
            });
          }
          break;
        }

        case 'video.asset.errored': {
          const assetId = body.data?.id;
          this.logger.error(`Mux video processing failed for asset ${assetId}`);
          break;
        }

        default:
          this.logger.log(`Unhandled Mux event: ${body?.type}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing Mux webhook: ${error.message}`);
    }

    return { received: true };
  }
}
