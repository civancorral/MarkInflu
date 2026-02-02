import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, PaymentStatus } from '@markinflu/database';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ============================================
  // BRAND ENDPOINTS
  // ============================================

  @Post('escrow/:contractId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Crear escrow para contrato' })
  async createEscrow(
    @Param('contractId') contractId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createEscrow(contractId, userId);
  }

  @Post('milestones/:milestoneId/release')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Liberar pago de hito' })
  async releaseMilestone(
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.releaseMilestone(milestoneId, userId);
  }

  @Post('escrow/:contractId/refund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Reembolsar escrow' })
  async refundEscrow(
    @Param('contractId') contractId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.refundEscrow(contractId, userId);
  }

  @Get('brand/escrows')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Historial de escrows (marca)' })
  async getBrandEscrows(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getBrandEscrows(userId, { page, limit });
  }

  // ============================================
  // CREATOR ENDPOINTS
  // ============================================

  @Get('creator/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Historial de pagos (creador)' })
  async getCreatorPayments(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentsService.getCreatorPayments(userId, { page, limit, status });
  }

  @Post('connect/onboarding')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Obtener enlace de onboarding Stripe Connect' })
  async createConnectOnboarding(
    @CurrentUser('id') userId: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.paymentsService.createConnectOnboardingLink(userId, returnUrl);
  }

  @Get('connect/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Estado de cuenta Stripe Connect' })
  async getConnectStatus(@CurrentUser('id') userId: string) {
    return this.paymentsService.getConnectStatus(userId);
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get('escrow/contract/:contractId')
  @ApiOperation({ summary: 'Detalle de escrow por contrato' })
  async getEscrowByContract(
    @Param('contractId') contractId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.getEscrowByContract(contractId, userId);
  }
}
