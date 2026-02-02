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
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ApplicationStatus } from '@markinflu/database';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // ============================================
  // CREATOR ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplicar a una campaña' })
  @ApiResponse({ status: 201, description: 'Aplicación creada' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.applicationsService.create(userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis aplicaciones (creador)' })
  async getMyApplications(
    @CurrentUser('id') userId: string,
    @Query('status') status?: ApplicationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.applicationsService.findMine(userId, { status, page, limit });
  }

  @Patch(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retirar aplicación' })
  async withdraw(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.applicationsService.withdraw(id, userId);
  }

  // ============================================
  // BRAND ENDPOINTS
  // ============================================

  @Get('campaign/:campaignId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar aplicantes de campaña' })
  async getByCampaign(
    @Param('campaignId') campaignId: string,
    @CurrentUser('id') userId: string,
    @Query('status') status?: ApplicationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.applicationsService.findByCampaign(campaignId, userId, {
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar estado de aplicación' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { status: ApplicationStatus; rejectionReason?: string },
  ) {
    return this.applicationsService.updateStatus(id, userId, dto);
  }

  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar nota interna' })
  async updateNotes(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('notes') notes: string,
  ) {
    return this.applicationsService.updateNotes(id, userId, notes);
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de aplicación' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.applicationsService.findById(id, userId);
  }
}
