import { IsEnum, IsOptional } from 'class-validator';
import { SocialPlatform } from '@markinflu/database';
import { ApiProperty } from '@nestjs/swagger';

export class SyncMetricsDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;
}

export class MetricsQueryDto {
  @ApiProperty({ enum: SocialPlatform, required: false })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;
}
