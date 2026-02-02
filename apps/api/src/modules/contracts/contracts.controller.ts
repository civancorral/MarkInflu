import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ContractStatus, MilestoneStatus } from '@markinflu/database';

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  // ============================================
  // BRAND ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear contrato para aplicación HIRED' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.contractsService.create(userId, dto);
  }

  @Get('campaign/:campaignId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contratos de una campaña (marca)' })
  async getByCampaign(
    @Param('campaignId') campaignId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.findByCampaign(campaignId, userId);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar contrato para firma del creador' })
  async sendForSignature(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.sendForSignature(id, userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Completar contrato' })
  async complete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.complete(id, userId);
  }

  @Patch('milestones/:milestoneId/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de hito' })
  async updateMilestoneStatus(
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('id') userId: string,
    @Body('status') status: MilestoneStatus,
  ) {
    return this.contractsService.updateMilestoneStatus(milestoneId, userId, status);
  }

  // ============================================
  // CREATOR ENDPOINTS
  // ============================================

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis contratos (creador)' })
  async getMyContracts(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ContractStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contractsService.findByCreator(userId, { status, page, limit });
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firmar contrato (creador)' })
  async creatorSign(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.creatorSign(id, userId);
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de contrato' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contractsService.findById(id, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar contrato' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
  ) {
    return this.contractsService.cancel(id, userId, reason);
  }
}
