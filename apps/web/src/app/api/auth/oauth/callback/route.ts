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
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    // Manejar errores de autorización
    if (error) {
      console.error('OAuth Error:', { error, errorReason, errorDescription });
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'oauth_denied');
      redirectUrl.searchParams.set('message', errorDescription || 'Autorización denegada');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validar parámetros requeridos
    if (!code || !stateParam) {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'invalid_request');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Parsear state
    let state: { userId: string; platform: string; timestamp: number };
    try {
      state = JSON.parse(stateParam);
    } catch {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'invalid_state');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validar timestamp (prevenir replay attacks - máximo 10 minutos)
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - state.timestamp > tenMinutes) {
      const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'expired_request');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Procesar según la plataforma
    if (state.platform === 'INSTAGRAM') {
      return await handleInstagramCallback(code, state.userId, req.nextUrl.origin);
    }

    // Plataforma no soportada
    const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'unsupported_platform');
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    const redirectUrl = new URL('/dashboard/profile', req.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'callback_error');
    redirectUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(redirectUrl.toString());
  }
}

/**
 * Maneja el callback específico de Instagram
 */
async function handleInstagramCallback(
  code: string,
  userId: string,
  origin: string
): Promise<NextResponse> {
  try {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing Instagram OAuth credentials');
    }

    // Paso 1: Intercambiar código por access token (short-lived)
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Instagram token exchange error:', errorData);
      throw new Error(errorData.error_message || 'Failed to exchange token');
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    const instagramUserId = tokenData.user_id;

    // Paso 2: Intercambiar short-lived token por long-lived token (60 días)
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
      new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: clientSecret,
        access_token: shortLivedToken,
      })
    );

    if (!longLivedTokenResponse.ok) {
      console.error('Failed to get long-lived token, using short-lived');
    }

    const longLivedData = await longLivedTokenResponse.json();
    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in; // seconds (usually 5184000 = 60 days)

    // Paso 3: Obtener información del perfil
    const profileResponse = await fetch(
      `https://graph.instagram.com/${instagramUserId}?` +
      new URLSearchParams({
        fields: 'id,username,account_type,media_count',
        access_token: accessToken,
      })
    );

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('Instagram profile fetch error:', errorData);
      throw new Error('Failed to fetch Instagram profile');
    }

    const profile = await profileResponse.json();

    // Paso 4: Obtener el perfil del creador
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      throw new Error('Creator profile not found');
    }

    // Paso 5: Guardar o actualizar la cuenta social
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 días por defecto

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
        username: profile.username,
        profileUrl: `https://instagram.com/${profile.username}`,
        accessToken: accessToken,
        tokenExpiresAt,
        isConnected: true,
        postsCount: profile.media_count || 0,
        // Nota: Instagram Basic Display no proporciona followers/following
        // Estos campos quedarán en 0 a menos que uses Instagram Graph API
        followers: 0,
        following: 0,
        lastSyncAt: new Date(),
      },
      update: {
        username: profile.username,
        profileUrl: `https://instagram.com/${profile.username}`,
        accessToken: accessToken,
        tokenExpiresAt,
        isConnected: true,
        postsCount: profile.media_count || 0,
        lastSyncAt: new Date(),
      },
    });

    // Paso 6: Redirigir al perfil con mensaje de éxito
    const redirectUrl = new URL('/dashboard/profile', origin);
    redirectUrl.searchParams.set('connected', 'instagram');
    redirectUrl.searchParams.set('username', profile.username);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('Error handling Instagram callback:', error);
    const redirectUrl = new URL('/dashboard/profile', origin);
    redirectUrl.searchParams.set('error', 'instagram_error');
    redirectUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(redirectUrl.toString());
  }
}
