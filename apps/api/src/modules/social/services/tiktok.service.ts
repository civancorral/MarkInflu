import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TikTokMetrics {
  openId: string;
  displayName: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  bioDescription?: string;
}

export interface TikTokVideo {
  id: string;
  title?: string;
  coverImageUrl?: string;
  createTime: number;
  shareUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagement: number;
}

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);
  private readonly apiUrl = 'https://open.tiktokapis.com/v2';

  constructor(private configService: ConfigService) {}

  async getMetrics(accessToken: string): Promise<TikTokMetrics> {
    const url = `${this.apiUrl}/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count,bio_description`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const err = await res.json();
      this.logger.error('TikTok getMetrics error', err);
      throw new Error(err.error?.message || 'Failed to fetch TikTok metrics');
    }
    const data = await res.json();
    const user = data.data?.user;
    if (!user) throw new Error('No TikTok user data found');

    return {
      openId: user.open_id,
      displayName: user.display_name || '',
      avatarUrl: user.avatar_url,
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      likesCount: user.likes_count || 0,
      videoCount: user.video_count || 0,
      bioDescription: user.bio_description,
    };
  }

  async getTopVideos(accessToken: string, maxCount = 20): Promise<TikTokVideo[]> {
    try {
      const url = `${this.apiUrl}/video/list/?fields=id,title,cover_image_url,create_time,share_url,view_count,like_count,comment_count,share_count`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: maxCount }),
      });
      if (!res.ok) return [];
      const data = await res.json();

      const videos: TikTokVideo[] = (data.data?.videos || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        coverImageUrl: v.cover_image_url,
        createTime: v.create_time,
        shareUrl: v.share_url,
        viewCount: v.view_count || 0,
        likeCount: v.like_count || 0,
        commentCount: v.comment_count || 0,
        shareCount: v.share_count || 0,
        engagement: v.view_count > 0
          ? ((v.like_count + v.comment_count + v.share_count) / v.view_count) * 100
          : 0,
      }));

      videos.sort((a, b) => b.viewCount - a.viewCount);
      return videos.slice(0, 10);
    } catch (error) {
      this.logger.error('TikTok getTopVideos error', error);
      return [];
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
  } | null> {
    try {
      const res = await fetch(`${this.apiUrl}/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: this.configService.get('TIKTOK_CLIENT_KEY') || '',
          client_secret: this.configService.get('TIKTOK_CLIENT_SECRET') || '',
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        refreshExpiresIn: data.refresh_expires_in,
      };
    } catch {
      return null;
    }
  }
}
