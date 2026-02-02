import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface YouTubeMetrics {
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
}

export interface YouTubeTopVideo {
  videoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagement: number;
}

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private configService: ConfigService) {}

  async getMetrics(accessToken: string): Promise<YouTubeMetrics> {
    const url = `${this.apiUrl}/channels?part=statistics,snippet,brandingSettings&mine=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err: any = await res.json();
      this.logger.error('YouTube getMetrics error', err);
      throw new Error(err.error?.message || 'Failed to fetch YouTube metrics');
    }
    const data: any = await res.json();
    const channel = data.items?.[0];
    if (!channel) throw new Error('No YouTube channel found');

    return {
      channelId: channel.id,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      viewCount: parseInt(channel.statistics?.viewCount || '0'),
      videoCount: parseInt(channel.statistics?.videoCount || '0'),
      hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount || false,
    };
  }

  async getTopVideos(accessToken: string, channelId: string, maxResults = 10): Promise<YouTubeTopVideo[]> {
    try {
      // Get recent uploads
      const searchUrl = `${this.apiUrl}/search?part=snippet&channelId=${channelId}&order=date&maxResults=50&type=video`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!searchRes.ok) return [];
      const searchData: any = await searchRes.json();

      const videoIds = (searchData.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
      if (videoIds.length === 0) return [];

      // Get statistics for those videos
      const statsUrl = `${this.apiUrl}/videos?part=statistics,snippet&id=${videoIds.join(',')}`;
      const statsRes = await fetch(statsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!statsRes.ok) return [];
      const statsData: any = await statsRes.json();

      const videos: YouTubeTopVideo[] = (statsData.items || []).map((v: any) => {
        const views = parseInt(v.statistics?.viewCount || '0');
        const likes = parseInt(v.statistics?.likeCount || '0');
        const comments = parseInt(v.statistics?.commentCount || '0');
        return {
          videoId: v.id,
          title: v.snippet?.title || '',
          description: v.snippet?.description,
          thumbnailUrl: v.snippet?.thumbnails?.medium?.url,
          publishedAt: v.snippet?.publishedAt,
          viewCount: views,
          likeCount: likes,
          commentCount: comments,
          engagement: views > 0 ? ((likes + comments) / views) * 100 : 0,
        };
      });

      videos.sort((a, b) => b.viewCount - a.viewCount);
      return videos.slice(0, maxResults);
    } catch (error) {
      this.logger.error('YouTube getTopVideos error', error);
      return [];
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number } | null> {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.configService.get('GOOGLE_CLIENT_ID') || '',
          client_secret: this.configService.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      if (!res.ok) return null;
      const data: any = await res.json();
      return { accessToken: data.access_token, expiresIn: data.expires_in };
    } catch {
      return null;
    }
  }
}
