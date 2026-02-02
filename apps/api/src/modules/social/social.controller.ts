import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SocialPlatform } from '@markinflu/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SocialService } from './social.service';

@ApiTags('Social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CREATOR' as any)
@Controller('social')
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post('sync/:platform')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync metrics for a specific platform' })
  async syncPlatform(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.syncPlatform(userId, platform);
  }

  @Post('sync-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync metrics for all connected platforms' })
  async syncAll(@CurrentUser('id') userId: string) {
    return this.socialService.syncAll(userId);
  }

  @Get('metrics/:platform')
  @ApiOperation({ summary: 'Get current metrics for a platform' })
  async getMetrics(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.getMetrics(userId, platform);
  }

  @Get('metrics/history')
  @ApiOperation({ summary: 'Get metrics history' })
  async getMetricsHistory(@CurrentUser('id') userId: string) {
    return this.socialService.getMetricsHistory(userId);
  }

  @Get('metrics/history/:platform')
  @ApiOperation({ summary: 'Get metrics history for a platform' })
  async getMetricsHistoryByPlatform(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.getMetricsHistory(userId, platform);
  }

  @Get('top-content/:platform')
  @ApiOperation({ summary: 'Get top content for a platform' })
  async getTopContent(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.getTopContent(userId, platform);
  }

  @Get('audience/:platform')
  @ApiOperation({ summary: 'Get audience demographics for a platform' })
  async getAudience(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.getAudience(userId, platform);
  }

  @Get('optimal-times/:platform')
  @ApiOperation({ summary: 'Get optimal posting times for a platform' })
  async getOptimalTimes(
    @CurrentUser('id') userId: string,
    @Param('platform') platform: SocialPlatform,
  ) {
    return this.socialService.getOptimalTimes(userId, platform);
  }
}
