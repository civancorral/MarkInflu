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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@markinflu/database';
import {
  CreateCreatorProfileDto,
  UpdateCreatorProfileDto,
  CreatorSearchParams,
  AddSocialAccountDto,
} from './dto/creator.dto';

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  @ApiOperation({ summary: 'Buscar creadores (Discovery)' })
  @ApiResponse({ status: 200, description: 'Lista de creadores' })
  async search(@Query() params: CreatorSearchParams) {
    return this.creatorsService.search(params);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener perfil público de creador' })
  @ApiResponse({ status: 200, description: 'Perfil del creador' })
  @ApiResponse({ status: 404, description: 'Creador no encontrado' })
  async getPublicProfile(@Param('id') id: string) {
    return this.creatorsService.getProfileById(id);
  }

  // ============================================
  // AUTHENTICATED CREATOR ENDPOINTS
  // ============================================

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mi perfil de creador' })
  @ApiResponse({ status: 200, description: 'Perfil del creador' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.creatorsService.getProfile(userId);
  }

  @Post('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear perfil de creador' })
  @ApiResponse({ status: 201, description: 'Perfil creado' })
  async createProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCreatorProfileDto,
  ) {
    return this.creatorsService.createProfile(userId, dto);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar mi perfil de creador' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCreatorProfileDto,
  ) {
    return this.creatorsService.updateProfile(userId, dto);
  }

  @Patch('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle disponibilidad' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  async toggleAvailability(@CurrentUser('id') userId: string) {
    return this.creatorsService.toggleAvailability(userId);
  }

  // ============================================
  // SOCIAL ACCOUNTS
  // ============================================

  @Post('me/social-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agregar cuenta social' })
  @ApiResponse({ status: 201, description: 'Cuenta agregada' })
  async addSocialAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: AddSocialAccountDto,
  ) {
    return this.creatorsService.addSocialAccount(userId, dto);
  }

  @Delete('me/social-accounts/:accountId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar cuenta social' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada' })
  async removeSocialAccount(
    @CurrentUser('id') userId: string,
    @Param('accountId') accountId: string,
  ) {
    await this.creatorsService.removeSocialAccount(userId, accountId);
    return { message: 'Cuenta social eliminada' };
  }
}
