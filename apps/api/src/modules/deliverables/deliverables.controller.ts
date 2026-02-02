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
import { DeliverablesService } from './deliverables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, DeliverableStatus } from '@markinflu/database';

@ApiTags('deliverables')
@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  // ============================================
  // BRAND ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear entregable para contrato' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.deliverablesService.create(userId, dto);
  }

  @Get('contract/:contractId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Entregables de un contrato (marca)' })
  async getByContract(
    @Param('contractId') contractId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.deliverablesService.findByContract(contractId, userId);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BRAND)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revisar entregable (aprobar/solicitar cambios/rechazar)' })
  async review(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { action: 'approve' | 'request_changes' | 'reject'; feedback?: string },
  ) {
    return this.deliverablesService.review(id, userId, dto);
  }

  // ============================================
  // CREATOR ENDPOINTS
  // ============================================

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mis entregables (creador)' })
  async getMyDeliverables(
    @CurrentUser('id') userId: string,
    @Query('status') status?: DeliverableStatus,
    @Query('contractId') contractId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deliverablesService.findByCreator(userId, {
      status,
      contractId,
      page,
      limit,
    });
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir nueva versión de entregable' })
  async createVersion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.deliverablesService.createVersion(id, userId, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar entregable para revisión' })
  async submitForReview(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.deliverablesService.submitForReview(id, userId);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar entregable como publicado' })
  async markPublished(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('publishedUrl') publishedUrl: string,
  ) {
    return this.deliverablesService.markPublished(id, userId, publishedUrl);
  }

  // ============================================
  // SHARED ENDPOINTS
  // ============================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de entregable' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.deliverablesService.findById(id, userId);
  }
}
