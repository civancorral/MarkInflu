import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Inicia el flujo OAuth de YouTube via Google OAuth 2.0
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback`;

    if (!clientId) {
      console.error('Missing Google Client ID');
      return NextResponse.json(
        { message: 'Configuración OAuth incompleta. Contacta al administrador.' },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', JSON.stringify({
      userId: session.user.id,
      platform: 'YOUTUBE',
      timestamp: Date.now(),
    }));

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating YouTube OAuth:', error);
    return NextResponse.json(
      { message: error.message || 'Error al iniciar autenticación con YouTube' },
      { status: 500 }
    );
  }
}
