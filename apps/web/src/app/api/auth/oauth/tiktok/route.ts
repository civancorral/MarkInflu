import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Inicia el flujo OAuth de TikTok Login Kit v2
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { message: 'Solo creadores pueden conectar redes sociales' },
        { status: 403 }
      );
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

    if (!clientKey) {
      console.error('Missing TikTok Client Key');
      return NextResponse.json(
        { message: 'Configuración OAuth incompleta. Contacta al administrador.' },
        { status: 500 }
      );
    }

    const csrfState = JSON.stringify({
      userId: session.user.id,
      platform: 'TIKTOK',
      timestamp: Date.now(),
    });

    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.set('client_key', clientKey);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'user.info.basic,user.info.stats,video.list');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', csrfState);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating TikTok OAuth:', error);
    return NextResponse.json(
      { message: error.message || 'Error al iniciar autenticación con TikTok' },
      { status: 500 }
    );
  }
}
