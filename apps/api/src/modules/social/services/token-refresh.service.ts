import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { InstagramService } from './instagram.service';
import { YouTubeService } from './youtube.service';
import { TikTokService } from './tiktok.service';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger(TokenRefreshService.name);

  constructor(
    private prisma: PrismaService,
    private instagramService: InstagramService,
    private youtubeService: YouTubeService,
    private tiktokService: TikTokService,
  ) {}

  /**
   * Refresh tokens that expire within the next 7 days.
   * Runs every 12 hours.
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async refreshExpiringTokens() {
    this.logger.log('Starting token refresh job');

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const accounts = await this.prisma.socialAccount.findMany({
      where: {
        isConnected: true,
        tokenExpiresAt: { lte: sevenDaysFromNow },
        accessToken: { not: null },
      },
    });

    this.logger.log(`Found ${accounts.length} accounts with expiring tokens`);

    for (const account of accounts) {
      try {
        await this.refreshToken(account);
      } catch (error) {
        this.logger.error(`Failed to refresh token for ${account.platform} account ${account.id}`, error);
      }
    }
  }

  private async refreshToken(account: any) {
    switch (account.platform) {
      case 'INSTAGRAM': {
        if (!account.accessToken) return;
        const result = await this.instagramService.refreshLongLivedToken(account.accessToken);
        if (result) {
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: result.token,
              tokenExpiresAt: new Date(Date.now() + result.expiresIn * 1000),
            },
          });
          this.logger.log(`Refreshed Instagram token for account ${account.id}`);
        }
        break;
      }
      case 'YOUTUBE': {
        if (!account.refreshToken) return;
        const result = await this.youtubeService.refreshAccessToken(account.refreshToken);
        if (result) {
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: result.accessToken,
              tokenExpiresAt: new Date(Date.now() + result.expiresIn * 1000),
            },
          });
          this.logger.log(`Refreshed YouTube token for account ${account.id}`);
        }
        break;
      }
      case 'TIKTOK': {
        if (!account.refreshToken) return;
        const result = await this.tiktokService.refreshAccessToken(account.refreshToken);
        if (result) {
          await this.prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: new Date(Date.now() + result.expiresIn * 1000),
            },
          });
          this.logger.log(`Refreshed TikTok token for account ${account.id}`);
        }
        break;
      }
    }
  }
}
