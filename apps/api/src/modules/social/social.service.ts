import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SocialPlatform, SnapshotPeriod } from '@markinflu/database';
import { InstagramService } from './services/instagram.service';
import { YouTubeService } from './services/youtube.service';
import { TikTokService } from './services/tiktok.service';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private youtubeService: YouTubeService,
    private tiktokService: TikTokService,
  ) {}

  async syncPlatform(userId: string, platform: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const account = await this.prisma.socialAccount.findUnique({
      where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
    });
    if (!account || !account.isConnected || !account.accessToken) {
      throw new NotFoundException(`No connected ${platform} account found`);
    }

    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        return this.syncInstagram(account, profile.id);
      case SocialPlatform.YOUTUBE:
        return this.syncYouTube(account, profile.id);
      case SocialPlatform.TIKTOK:
        return this.syncTikTok(account, profile.id);
      default:
        throw new NotFoundException(`Platform ${platform} sync not supported`);
    }
  }

  async syncAll(userId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { socialAccounts: { where: { isConnected: true } } },
    });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const results: Record<string, any> = {};
    for (const account of profile.socialAccounts) {
      try {
        results[account.platform] = await this.syncPlatform(userId, account.platform);
      } catch (error: any) {
        results[account.platform] = { error: error.message };
      }
    }
    return results;
  }

  async getMetrics(userId: string, platform: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    return this.prisma.socialAccount.findUnique({
      where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
    });
  }

  async getMetricsHistory(userId: string, platform?: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const where: any = { creatorProfileId: profile.id };
    if (platform) {
      const account = await this.prisma.socialAccount.findUnique({
        where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
      });
      if (account) where.socialAccountId = account.id;
    }

    return this.prisma.metricsSnapshot.findMany({
      where,
      orderBy: { snapshotDate: 'desc' },
      take: 90,
    });
  }

  async getTopContent(userId: string, platform: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const account = await this.prisma.socialAccount.findUnique({
      where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
    });
    if (!account) throw new NotFoundException(`No ${platform} account found`);

    return account.topContent;
  }

  async getAudience(userId: string, platform: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const account = await this.prisma.socialAccount.findUnique({
      where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
    });
    if (!account) throw new NotFoundException(`No ${platform} account found`);

    return account.audienceData;
  }

  async getOptimalTimes(userId: string, platform: SocialPlatform) {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const account = await this.prisma.socialAccount.findUnique({
      where: { creatorProfileId_platform: { creatorProfileId: profile.id, platform } },
    });
    if (!account) throw new NotFoundException(`No ${platform} account found`);

    return account.optimalPostingTimes;
  }

  // ---- Auto-sync every 24h ----
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async autoSyncAll() {
    this.logger.log('Starting daily auto-sync of all connected accounts');

    const accounts = await this.prisma.socialAccount.findMany({
      where: { isConnected: true, accessToken: { not: null } },
      include: { creatorProfile: true },
    });

    for (const account of accounts) {
      try {
        switch (account.platform) {
          case SocialPlatform.INSTAGRAM:
            await this.syncInstagram(account, account.creatorProfileId);
            break;
          case SocialPlatform.YOUTUBE:
            await this.syncYouTube(account, account.creatorProfileId);
            break;
          case SocialPlatform.TIKTOK:
            await this.syncTikTok(account, account.creatorProfileId);
            break;
        }
      } catch (error) {
        this.logger.error(`Auto-sync failed for ${account.platform} account ${account.id}`, error);
      }
    }
  }

  // ---- Platform-specific sync methods ----

  private async syncInstagram(account: any, creatorProfileId: string) {
    const igUserId = (account.platformMetadata as any)?.igBusinessAccountId || account.platformUserId;
    if (!igUserId) throw new Error('Missing Instagram Business Account ID');

    const [metrics, insights, topMedia] = await Promise.all([
      this.instagramService.getMetrics(account.accessToken, igUserId),
      this.instagramService.getInsights(account.accessToken, igUserId),
      this.instagramService.getTopMedia(account.accessToken, igUserId),
    ]);

    const totalEngagement = topMedia.reduce((sum, m) => sum + (m.engagement || 0), 0);
    const engagementRate = metrics.followers > 0 && topMedia.length > 0
      ? (totalEngagement / topMedia.length / metrics.followers) * 100
      : 0;

    const updated = await this.prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        followers: metrics.followers,
        following: metrics.following,
        postsCount: metrics.mediaCount,
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgLikes: topMedia.length > 0 ? Math.round(topMedia.reduce((s, m) => s + (m.likeCount || 0), 0) / topMedia.length) : null,
        avgComments: topMedia.length > 0 ? Math.round(topMedia.reduce((s, m) => s + (m.commentsCount || 0), 0) / topMedia.length) : null,
        topContent: topMedia as any,
        audienceData: insights.followerDemographics as any,
        lastSyncAt: new Date(),
      },
    });

    await this.createSnapshot(account.id, creatorProfileId, updated);
    return updated;
  }

  private async syncYouTube(account: any, creatorProfileId: string) {
    const metrics = await this.youtubeService.getMetrics(account.accessToken);
    const topVideos = await this.youtubeService.getTopVideos(account.accessToken, metrics.channelId);

    const totalEngagement = topVideos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0);
    const totalViews = topVideos.reduce((sum, v) => sum + v.viewCount, 0);
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    const updated = await this.prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        followers: metrics.subscriberCount,
        postsCount: metrics.videoCount,
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgViews: topVideos.length > 0 ? Math.round(totalViews / topVideos.length) : null,
        avgLikes: topVideos.length > 0 ? Math.round(topVideos.reduce((s, v) => s + v.likeCount, 0) / topVideos.length) : null,
        avgComments: topVideos.length > 0 ? Math.round(topVideos.reduce((s, v) => s + v.commentCount, 0) / topVideos.length) : null,
        topContent: topVideos as any,
        platformUserId: metrics.channelId,
        platformMetadata: { channelId: metrics.channelId, title: metrics.title, thumbnailUrl: metrics.thumbnailUrl },
        lastSyncAt: new Date(),
      },
    });

    await this.createSnapshot(account.id, creatorProfileId, updated);
    return updated;
  }

  private async syncTikTok(account: any, creatorProfileId: string) {
    const metrics = await this.tiktokService.getMetrics(account.accessToken);
    const topVideos = await this.tiktokService.getTopVideos(account.accessToken);

    const totalEngagement = topVideos.reduce((sum, v) => sum + v.likeCount + v.commentCount + v.shareCount, 0);
    const totalViews = topVideos.reduce((sum, v) => sum + v.viewCount, 0);
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    const updated = await this.prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        followers: metrics.followerCount,
        following: metrics.followingCount,
        postsCount: metrics.videoCount,
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgViews: topVideos.length > 0 ? Math.round(totalViews / topVideos.length) : null,
        avgLikes: topVideos.length > 0 ? Math.round(topVideos.reduce((s, v) => s + v.likeCount, 0) / topVideos.length) : null,
        avgComments: topVideos.length > 0 ? Math.round(topVideos.reduce((s, v) => s + v.commentCount, 0) / topVideos.length) : null,
        topContent: topVideos as any,
        platformUserId: metrics.openId,
        lastSyncAt: new Date(),
      },
    });

    await this.createSnapshot(account.id, creatorProfileId, updated);
    return updated;
  }

  private async createSnapshot(socialAccountId: string, creatorProfileId: string, account: any) {
    // Get previous snapshot for growth calculation
    const previous = await this.prisma.metricsSnapshot.findFirst({
      where: { socialAccountId },
      orderBy: { snapshotDate: 'desc' },
    });

    const followerGrowth = previous ? account.followers - previous.followers : null;
    const growthPercentage = previous && previous.followers > 0
      ? ((account.followers - previous.followers) / previous.followers) * 100
      : null;

    await this.prisma.metricsSnapshot.create({
      data: {
        creatorProfileId,
        socialAccountId,
        periodType: SnapshotPeriod.DAILY,
        followers: account.followers,
        following: account.following,
        postsCount: account.postsCount,
        engagementRate: account.engagementRate,
        avgLikes: account.avgLikes,
        avgComments: account.avgComments,
        avgViews: account.avgViews,
        followerGrowth,
        growthPercentage: growthPercentage ? Math.round(growthPercentage * 100) / 100 : null,
        audienceData: account.audienceData,
      },
    });
  }
}
