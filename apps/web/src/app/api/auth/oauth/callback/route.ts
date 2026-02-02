import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@markinflu/database';
import { SocialPlatform } from '@markinflu/database';

/**
 * Callback OAuth unificado para todas las plataformas sociales
 * Maneja el intercambio de código por access token
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle errors from OAuth provider
    if (error) {
      console.error('OAuth Error:', { error, errorDescription });
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'oauth_denied');
      redirectUrl.searchParams.set('message', errorDescription || 'Autorización denegada');
      return NextResponse.redirect(redirectUrl.toString());
    }

    if (!code || !stateParam) {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'invalid_request');
      return NextResponse.redirect(redirectUrl.toString());
    }

    let state: { userId: string; platform: string; timestamp: number };
    try {
      state = JSON.parse(stateParam);
    } catch {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'invalid_state');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate timestamp (10-minute window)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - state.timestamp > tenMinutes) {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'expired_request');
      return NextResponse.redirect(redirectUrl.toString());
    }

    switch (state.platform) {
      case 'INSTAGRAM':
        return await handleInstagramCallback(code, state.userId, req.nextUrl.origin);
      case 'YOUTUBE':
        return await handleYouTubeCallback(code, state.userId, req.nextUrl.origin);
      case 'TIKTOK':
        return await handleTikTokCallback(code, state.userId, req.nextUrl.origin);
      default: {
        const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
        redirectUrl.searchParams.set('error', 'unsupported_platform');
        return NextResponse.redirect(redirectUrl.toString());
      }
    }
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(redirectUrl.toString());
  }
}

// ---- Instagram (Facebook Graph API) ----

async function handleInstagramCallback(
  code: string,
  userId: string,
  origin: string,
): Promise<NextResponse> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

  if (!appId || !appSecret) {
    throw new Error('Missing Facebook OAuth credentials');
  }

  // Step 1: Exchange code for access token via Facebook
  const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  }));

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    console.error('Facebook token exchange error:', err);
    throw new Error(err.error?.message || 'Failed to exchange token');
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in;

  // Step 2: Get Facebook Pages the user manages
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
  if (!pagesRes.ok) throw new Error('Failed to get Facebook pages');
  const pagesData = await pagesRes.json();

  // Step 3: Find Instagram Business Account from any page
  let igBusinessAccountId: string | null = null;
  let igUsername = '';
  let pageAccessToken = accessToken;

  for (const page of pagesData.data || []) {
    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || accessToken}`
    );
    if (igRes.ok) {
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igBusinessAccountId = igData.instagram_business_account.id;
        pageAccessToken = page.access_token || accessToken;
        break;
      }
    }
  }

  if (!igBusinessAccountId) {
    throw new Error('No se encontró una cuenta de Instagram Business vinculada. Asegúrate de que tu cuenta de Instagram sea Business o Creator y esté conectada a una Página de Facebook.');
  }

  // Step 4: Get Instagram profile info
  const profileRes = await fetch(
    `https://graph.facebook.com/v19.0/${igBusinessAccountId}?fields=id,username,followers_count,follows_count,media_count,profile_picture_url,biography&access_token=${pageAccessToken}`
  );
  if (!profileRes.ok) throw new Error('Failed to fetch Instagram profile');
  const profile = await profileRes.json();
  igUsername = profile.username;

  // Step 5: Upsert social account
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!creatorProfile) throw new Error('Creator profile not found');

  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  await prisma.socialAccount.upsert({
    where: {
      creatorProfileId_platform: {
        creatorProfileId: creatorProfile.id,
        platform: SocialPlatform.INSTAGRAM,
      },
    },
    create: {
      creatorProfileId: creatorProfile.id,
      platform: SocialPlatform.INSTAGRAM,
      username: igUsername,
      profileUrl: `https://instagram.com/${igUsername}`,
      accessToken: pageAccessToken,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: igBusinessAccountId,
      platformMetadata: { igBusinessAccountId },
      followers: profile.followers_count || 0,
      following: profile.follows_count || 0,
      postsCount: profile.media_count || 0,
      lastSyncAt: new Date(),
    },
    update: {
      username: igUsername,
      profileUrl: `https://instagram.com/${igUsername}`,
      accessToken: pageAccessToken,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: igBusinessAccountId,
      platformMetadata: { igBusinessAccountId },
      followers: profile.followers_count || 0,
      following: profile.follows_count || 0,
      postsCount: profile.media_count || 0,
      lastSyncAt: new Date(),
    },
  });

  const redirectUrl = new URL('/dashboard/profile', origin);
  redirectUrl.searchParams.set('connected', 'instagram');
  redirectUrl.searchParams.set('username', igUsername);
  return NextResponse.redirect(redirectUrl.toString());
}

// ---- YouTube (Google OAuth 2.0) ----

async function handleYouTubeCallback(
  code: string,
  userId: string,
  origin: string,
): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  // Step 1: Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    console.error('Google token exchange error:', err);
    throw new Error(err.error_description || 'Failed to exchange token');
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  // Step 2: Get YouTube channel info
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!channelRes.ok) throw new Error('Failed to fetch YouTube channel');
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];
  if (!channel) throw new Error('No YouTube channel found');

  // Step 3: Upsert social account
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!creatorProfile) throw new Error('Creator profile not found');

  const tokenExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

  await prisma.socialAccount.upsert({
    where: {
      creatorProfileId_platform: {
        creatorProfileId: creatorProfile.id,
        platform: SocialPlatform.YOUTUBE,
      },
    },
    create: {
      creatorProfileId: creatorProfile.id,
      platform: SocialPlatform.YOUTUBE,
      username: channel.snippet?.title || '',
      profileUrl: `https://youtube.com/channel/${channel.id}`,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: channel.id,
      platformMetadata: { channelId: channel.id, title: channel.snippet?.title },
      followers: parseInt(channel.statistics?.subscriberCount || '0'),
      postsCount: parseInt(channel.statistics?.videoCount || '0'),
      lastSyncAt: new Date(),
    },
    update: {
      username: channel.snippet?.title || '',
      profileUrl: `https://youtube.com/channel/${channel.id}`,
      accessToken: access_token,
      refreshToken: refresh_token || undefined,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: channel.id,
      platformMetadata: { channelId: channel.id, title: channel.snippet?.title },
      followers: parseInt(channel.statistics?.subscriberCount || '0'),
      postsCount: parseInt(channel.statistics?.videoCount || '0'),
      lastSyncAt: new Date(),
    },
  });

  const redirectUrl = new URL('/dashboard/profile', origin);
  redirectUrl.searchParams.set('connected', 'youtube');
  redirectUrl.searchParams.set('username', channel.snippet?.title || '');
  return NextResponse.redirect(redirectUrl.toString());
}

// ---- TikTok (Login Kit v2) ----

async function handleTikTokCallback(
  code: string,
  userId: string,
  origin: string,
): Promise<NextResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

  if (!clientKey || !clientSecret) {
    throw new Error('Missing TikTok OAuth credentials');
  }

  // Step 1: Exchange code for tokens
  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    console.error('TikTok token exchange error:', err);
    throw new Error(err.error_description || 'Failed to exchange token');
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in; // ~24h
  const openId = tokenData.open_id;

  // Step 2: Get TikTok user info
  const userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count,bio_description',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!userRes.ok) throw new Error('Failed to fetch TikTok user info');
  const userData = await userRes.json();
  const user = userData.data?.user;
  if (!user) throw new Error('No TikTok user data found');

  // Step 3: Upsert social account
  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!creatorProfile) throw new Error('Creator profile not found');

  const tokenExpiresAt = new Date(Date.now() + (expiresIn || 86400) * 1000);

  await prisma.socialAccount.upsert({
    where: {
      creatorProfileId_platform: {
        creatorProfileId: creatorProfile.id,
        platform: SocialPlatform.TIKTOK,
      },
    },
    create: {
      creatorProfileId: creatorProfile.id,
      platform: SocialPlatform.TIKTOK,
      username: user.display_name || openId,
      profileUrl: `https://tiktok.com/@${user.display_name || openId}`,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: openId,
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      postsCount: user.video_count || 0,
      lastSyncAt: new Date(),
    },
    update: {
      username: user.display_name || openId,
      profileUrl: `https://tiktok.com/@${user.display_name || openId}`,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      isConnected: true,
      platformUserId: openId,
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      postsCount: user.video_count || 0,
      lastSyncAt: new Date(),
    },
  });

  const redirectUrl = new URL('/dashboard/profile', origin);
  redirectUrl.searchParams.set('connected', 'tiktok');
  redirectUrl.searchParams.set('username', user.display_name || openId);
  return NextResponse.redirect(redirectUrl.toString());
}
