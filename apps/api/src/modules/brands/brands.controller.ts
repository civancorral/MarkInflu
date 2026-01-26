import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@markinflu/database';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('me/profile')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Obtener mi perfil de marca' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.brandsService.getProfile(userId);
  }

  @Post('me/profile')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Crear perfil de marca' })
  async createProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.brandsService.createProfile(userId, dto);
  }

  @Patch('me/profile')
  @Roles(UserRole.BRAND)
  @ApiOperation({ summary: 'Actualizar perfil de marca' })
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: any) {
    return this.brandsService.updateProfile(userId, dto);
  }
}
