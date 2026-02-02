import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InstagramMetrics {
  followers: number;
  following: number;
  mediaCount: number;
  username: string;
  biography?: string;
  profilePictureUrl?: string;
}

export interface InstagramInsights {
  impressions?: number;
  reach?: number;
  followerDemographics?: {
    gender?: Record<string, number>;
    age?: Record<string, number>;
    topCountries?: Array<{ code: string; percentage: number }>;
    topCities?: Array<{ name: string; percentage: number }>;
  };
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  mediaType: string;
  mediaUrl?: string;
  permalink: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
  impressions?: number;
  reach?: number;
  engagement?: number;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly graphUrl = 'https://graph.facebook.com/v19.0';

  constructor(private configService: ConfigService) {}

  async getMetrics(accessToken: string, igUserId: string): Promise<InstagramMetrics> {
    const url = `${this.graphUrl}/${igUserId}?fields=followers_count,follows_count,media_count,biography,username,profile_picture_url&access_token=${accessToken}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      this.logger.error('Instagram getMetrics error', err);
      throw new Error(err.error?.message || 'Failed to fetch Instagram metrics');
    }
    const data = await res.json();
    return {
      followers: data.followers_count || 0,
      following: data.follows_count || 0,
      mediaCount: data.media_count || 0,
      username: data.username,
      biography: data.biography,
      profilePictureUrl: data.profile_picture_url,
    };
  }

  async getInsights(accessToken: string, igUserId: string): Promise<InstagramInsights> {
    try {
      // Get impressions and reach (last 28 days)
      const metricsUrl = `${this.graphUrl}/${igUserId}/insights?metric=impressions,reach&period=day&access_token=${accessToken}`;
      const metricsRes = await fetch(metricsUrl);
      let impressions = 0;
      let reach = 0;
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        for (const metric of metricsData.data || []) {
          const values = metric.values || [];
          const total = values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
          if (metric.name === 'impressions') impressions = total;
          if (metric.name === 'reach') reach = total;
        }
      }

      // Get follower demographics
      const demoUrl = `${this.graphUrl}/${igUserId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=age,gender,country,city&access_token=${accessToken}`;
      const demoRes = await fetch(demoUrl);
      let followerDemographics: InstagramInsights['followerDemographics'];
      if (demoRes.ok) {
        const demoData = await demoRes.json();
        followerDemographics = this.parseDemographics(demoData.data || []);
      }

      return { impressions, reach, followerDemographics };
    } catch (error) {
      this.logger.error('Instagram getInsights error', error);
      return {};
    }
  }

  async getTopMedia(accessToken: string, igUserId: string, limit = 25): Promise<InstagramMedia[]> {
    try {
      const url = `${this.graphUrl}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      const media: InstagramMedia[] = (data.data || []).map((m: any) => ({
        id: m.id,
        caption: m.caption,
        mediaType: m.media_type,
        mediaUrl: m.media_url,
        permalink: m.permalink,
        timestamp: m.timestamp,
        likeCount: m.like_count || 0,
        commentsCount: m.comments_count || 0,
        engagement: (m.like_count || 0) + (m.comments_count || 0),
      }));

      // Sort by engagement desc
      media.sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
      return media.slice(0, 10);
    } catch (error) {
      this.logger.error('Instagram getTopMedia error', error);
      return [];
    }
  }

  async refreshLongLivedToken(accessToken: string): Promise<{ token: string; expiresIn: number } | null> {
    try {
      const url = `${this.graphUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.configService.get('FACEBOOK_APP_ID')}&client_secret=${this.configService.get('FACEBOOK_APP_SECRET')}&fb_exchange_token=${accessToken}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return { token: data.access_token, expiresIn: data.expires_in };
    } catch {
      return null;
    }
  }

  private parseDemographics(data: any[]): InstagramInsights['followerDemographics'] {
    const result: InstagramInsights['followerDemographics'] = {};
    for (const metric of data) {
      if (metric.name !== 'follower_demographics') continue;
      const totalValue = metric.total_value;
      if (!totalValue?.breakdowns) continue;
      for (const breakdown of totalValue.breakdowns) {
        const dimension = breakdown.dimension_keys?.[0];
        if (!dimension) continue;
        const results = breakdown.results || [];
        if (dimension === 'age' || dimension === 'gender') {
          const map: Record<string, number> = {};
          for (const r of results) {
            map[r.dimension_values?.[0] || 'unknown'] = r.value || 0;
          }
          if (dimension === 'age') result.age = map;
          if (dimension === 'gender') result.gender = map;
        }
        if (dimension === 'country') {
          result.topCountries = results
            .map((r: any) => ({ code: r.dimension_values?.[0], percentage: r.value }))
            .sort((a: any, b: any) => b.percentage - a.percentage)
            .slice(0, 10);
        }
        if (dimension === 'city') {
          result.topCities = results
            .map((r: any) => ({ name: r.dimension_values?.[0], percentage: r.value }))
            .sort((a: any, b: any) => b.percentage - a.percentage)
            .slice(0, 10);
        }
      }
    }
    return result;
  }
}
