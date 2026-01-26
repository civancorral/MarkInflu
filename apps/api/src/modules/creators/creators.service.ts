import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { SocialPlatform, ContentType, Prisma } from '@markinflu/database';
import { CreateCreatorProfileDto, UpdateCreatorProfileDto, CreatorSearchParams } from './dto/creator.dto';

@Injectable()
export class CreatorsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  async createProfile(userId: string, dto: CreateCreatorProfileDto) {
    // Check if profile already exists
    const existing = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ForbiddenException('Ya tienes un perfil de creador');
    }

    const profile = await this.prisma.creatorProfile.create({
      data: {
        userId,
        displayName: dto.displayName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        bio: dto.bio,
        tagline: dto.tagline,
        location: dto.location,
        city: dto.city,
        country: dto.country,
        timezone: dto.timezone,
        languages: dto.languages || [],
        primaryNiche: dto.primaryNiche,
        secondaryNiches: dto.secondaryNiches || [],
        contentTypes: dto.contentTypes || [],
        rates: dto.rates as any,
        minimumBudget: dto.minimumBudget,
        currency: dto.currency || 'USD',
        portfolioUrls: dto.portfolioUrls || [],
        preferredBrands: dto.preferredBrands || [],
        excludedBrands: dto.excludedBrands || [],
        keywords: dto.keywords || [],
      },
      include: {
        socialAccounts: true,
      },
    });

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateCreatorProfileDto) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    const updated = await this.prisma.creatorProfile.update({
      where: { userId },
      data: {
        ...dto,
        rates: dto.rates as any,
      },
      include: {
        socialAccounts: true,
      },
    });

    // Invalidate cache
    await this.redisService.del(`creator:${profile.id}`);
    await this.redisService.invalidatePattern('creators:search:*');

    return updated;
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        socialAccounts: true,
        _count: {
          select: {
            applications: true,
            reviews: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }

  async getProfileById(id: string) {
    // Try cache first
    const cached = await this.redisService.getJson(`creator:${id}`);
    if (cached) return cached;

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { id },
      include: {
        socialAccounts: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                brandProfile: {
                  select: { companyName: true, logoUrl: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            reviews: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Creador no encontrado');
    }

    // Cache for 5 minutes
    await this.redisService.setJson(`creator:${id}`, profile, 300);

    return profile;
  }

  // ============================================
  // DISCOVERY / SEARCH
  // ============================================

  async search(params: CreatorSearchParams) {
    const {
      query,
      niches,
      platforms,
      countries,
      languages,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      maxBudget,
      contentTypes,
      isVerified,
      isAvailable = true,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = params;

    // Build cache key
    const cacheKey = `creators:search:${JSON.stringify(params)}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    // Build where clause
    const where: Prisma.CreatorProfileWhereInput = {
      isAvailable: isAvailable ? true : undefined,
    };

    // Full-text search on bio and displayName
    if (query) {
      where.OR = [
        { displayName: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
        { primaryNiche: { contains: query, mode: 'insensitive' } },
        { keywords: { hasSome: [query.toLowerCase()] } },
      ];
    }

    // Niche filter
    if (niches && niches.length > 0) {
      where.OR = [
        ...(where.OR || []),
        { primaryNiche: { in: niches } },
        { secondaryNiches: { hasSome: niches } },
      ];
    }

    // Platform filter (via social accounts)
    if (platforms && platforms.length > 0) {
      where.socialAccounts = {
        some: {
          platform: { in: platforms as SocialPlatform[] },
        },
      };
    }

    // Country filter
    if (countries && countries.length > 0) {
      where.country = { in: countries };
    }

    // Language filter
    if (languages && languages.length > 0) {
      where.languages = { hasSome: languages };
    }

    // Followers filter
    if (minFollowers || maxFollowers) {
      where.socialAccounts = {
        ...where.socialAccounts,
        some: {
          ...(where.socialAccounts as any)?.some,
          followers: {
            gte: minFollowers,
            lte: maxFollowers,
          },
        },
      };
    }

    // Engagement rate filter
    if (minEngagementRate) {
      where.socialAccounts = {
        ...where.socialAccounts,
        some: {
          ...(where.socialAccounts as any)?.some,
          engagementRate: { gte: minEngagementRate },
        },
      };
    }

    // Budget filter
    if (maxBudget) {
      where.minimumBudget = { lte: maxBudget };
    }

    // Content types filter
    if (contentTypes && contentTypes.length > 0) {
      where.contentTypes = { hasSome: contentTypes as ContentType[] };
    }

    // Verified filter
    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    // Build orderBy
    let orderBy: Prisma.CreatorProfileOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'followers':
        // Note: This is a simplification. For proper sorting by followers,
        // you'd need a computed field or raw query
        orderBy = { createdAt: sortOrder };
        break;
      case 'engagementRate':
        orderBy = { createdAt: sortOrder };
        break;
      case 'createdAt':
        orderBy = { createdAt: sortOrder };
        break;
      default:
        orderBy = { isVerified: 'desc' }; // Prioritize verified
    }

    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          socialAccounts: {
            select: {
              platform: true,
              username: true,
              followers: true,
              engagementRate: true,
              isVerified: true,
            },
          },
        },
      }),
      this.prisma.creatorProfile.count({ where }),
    ]);

    // Calculate total followers and avg engagement for each profile
    const enrichedProfiles = profiles.map((profile) => {
      const totalFollowers = profile.socialAccounts.reduce(
        (sum, acc) => sum + (acc.followers || 0),
        0,
      );
      const avgEngagement =
        profile.socialAccounts.reduce(
          (sum, acc) => sum + (acc.engagementRate || 0),
          0,
        ) / (profile.socialAccounts.length || 1);

      return {
        ...profile,
        totalFollowers,
        avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      };
    });

    const result = {
      data: enrichedProfiles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };

    // Cache for 1 minute
    await this.redisService.setJson(cacheKey, result, 60);

    return result;
  }

  // ============================================
  // SOCIAL ACCOUNTS
  // ============================================

  async addSocialAccount(
    userId: string,
    data: {
      platform: SocialPlatform;
      username: string;
      profileUrl: string;
      followers?: number;
      engagementRate?: number;
    },
  ) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // Check if account already exists
    const existing = await this.prisma.socialAccount.findFirst({
      where: {
        creatorProfileId: profile.id,
        platform: data.platform,
      },
    });

    if (existing) {
      // Update existing
      return this.prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          username: data.username,
          profileUrl: data.profileUrl,
          followers: data.followers,
          engagementRate: data.engagementRate,
        },
      });
    }

    return this.prisma.socialAccount.create({
      data: {
        creatorProfileId: profile.id,
        platform: data.platform,
        username: data.username,
        profileUrl: data.profileUrl,
        followers: data.followers,
        engagementRate: data.engagementRate,
      },
    });
  }

  async removeSocialAccount(userId: string, accountId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    const account = await this.prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.creatorProfileId !== profile.id) {
      throw new NotFoundException('Cuenta social no encontrada');
    }

    await this.prisma.socialAccount.delete({
      where: { id: accountId },
    });

    // Invalidate cache
    await this.redisService.del(`creator:${profile.id}`);
  }

  // ============================================
  // AVAILABILITY
  // ============================================

  async toggleAvailability(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    const updated = await this.prisma.creatorProfile.update({
      where: { userId },
      data: { isAvailable: !profile.isAvailable },
    });

    // Invalidate cache
    await this.redisService.del(`creator:${profile.id}`);
    await this.redisService.invalidatePattern('creators:search:*');

    return updated;
  }
}
