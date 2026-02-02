import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { InstagramService } from './services/instagram.service';
import { YouTubeService } from './services/youtube.service';
import { TikTokService } from './services/tiktok.service';
import { TokenRefreshService } from './services/token-refresh.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SocialController],
  providers: [
    SocialService,
    InstagramService,
    YouTubeService,
    TikTokService,
    TokenRefreshService,
  ],
  exports: [SocialService],
})
export class SocialModule {}
