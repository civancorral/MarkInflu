import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, CampaignStatus } from '@markinflu/database';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  @ApiOperation({ summary: 'Buscar campañas públicas' })
  @ApiResponse({ status: 200, description: 'Lista de campañas' })
  async search(
    @Query('query') query?: string,
    @Query('industries') industries?: string[],
    @Query('budgetMin') budgetMin?: number,
    @Query('budgetMax') budgetMax?: number,
    @Query('hasSpots') hasSpots?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.campaignsService.search({
      query,
      industries,
      budgetMin,
      budgetMax,
      hasSpots,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener campaña por slug' })
  @ApiResponse({ status: 200, description: 'Campaña encontrada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  async findBySlug(@Param('slug') slug: string) {
    return this.campaignsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener campaña por ID' })
  @ApiResponse({ status: 200, description: 'Campaña encontrada' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada' })
  async findById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  // ============================================
  // BRAND ENDPOINTS
  // ============================================

  @Get('brand/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis campañas (marca)' })
  @ApiResponse({ status: 200, description: 'Lista de campañas' })
  async getMyBrandCampaigns(
    @CurrentUser('id') userId: string,
    @Query('status') status?: CampaignStatus,
  ) {
    return this.campaignsService.findByBrand(userId, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear campaña' })
  @ApiResponse({ status: 201, description: 'Campaña creada' })
  async create(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.campaignsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar campaña' })
  @ApiResponse({ status: 200, description: 'Campaña actualizada' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.campaignsService.update(id, userId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar campaña' })
  @ApiResponse({ status: 200, description: 'Campaña publicada' })
  async publish(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignsService.publish(id, userId);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pausar campaña' })
  @ApiResponse({ status: 200, description: 'Campaña pausada' })
  async pause(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignsService.pause(id, userId);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar campaña' })
  @ApiResponse({ status: 200, description: 'Campaña cerrada' })
  async close(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignsService.close(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar campaña' })
  @ApiResponse({ status: 200, description: 'Campaña eliminada' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.campaignsService.delete(id, userId);
  }
}
