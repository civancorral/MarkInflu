import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ContentType, SocialPlatform } from '@markinflu/database';

export class CreateCreatorProfileDto {
  @ApiProperty({ example: 'Sofía Lifestyle' })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'MX' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'America/Mexico_City' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: ['es', 'en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ example: 'Lifestyle' })
  @IsOptional()
  @IsString()
  primaryNiche?: string;

  @ApiPropertyOptional({ example: ['Travel', 'Fashion'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryNiches?: string[];

  @ApiPropertyOptional({ enum: ContentType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ContentType, { each: true })
  contentTypes?: ContentType[];

  @ApiPropertyOptional({
    example: {
      instagram: {
        story: { price: 500, currency: 'USD' },
        reel: { price: 1500, currency: 'USD' },
      },
    },
  })
  @IsOptional()
  @IsObject()
  rates?: Record<string, Record<string, { price: number; currency: string; notes?: string }>>;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBudget?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrands?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedBrands?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class UpdateCreatorProfileDto extends CreateCreatorProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;
}

export class CreatorSearchParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: ['Lifestyle', 'Tech'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  niches?: string[];

  @ApiPropertyOptional({ enum: SocialPlatform, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  platforms?: SocialPlatform[];

  @ApiPropertyOptional({ example: ['MX', 'ES'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  countries?: string[];

  @ApiPropertyOptional({ example: ['es', 'en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  languages?: string[];

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minFollowers?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxFollowers?: number;

  @ApiPropertyOptional({ example: 3.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minEngagementRate?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxBudget?: number;

  @ApiPropertyOptional({ enum: ContentType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ContentType, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  contentTypes?: ContentType[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['followers', 'engagementRate', 'createdAt', 'relevance'],
    default: 'relevance',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'followers' | 'engagementRate' | 'createdAt' | 'relevance';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class AddSocialAccountDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ example: 'sofia_lifestyle' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'https://instagram.com/sofia_lifestyle' })
  @IsString()
  profileUrl: string;

  @ApiPropertyOptional({ example: 250000 })
  @IsOptional()
  @IsNumber()
  followers?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  engagementRate?: number;
}
