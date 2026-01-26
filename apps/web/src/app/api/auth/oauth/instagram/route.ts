import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Inicia el flujo OAuth de Instagram
 * Redirige al usuario a la página de autorización de Instagram
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'CREATOR') {
      return NextResponse.json(
        { message: 'Solo creadores pueden conectar redes sociales' },
        { status: 403 }
      );
    }

    // Validar que existan las variables de entorno
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error('Missing Instagram OAuth credentials');
      return NextResponse.json(
        { message: 'Configuración OAuth incompleta. Contacta al administrador.' },
        { status: 500 }
      );
    }

    // Construir URL de autorización de Instagram
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'user_profile,user_media');
    authUrl.searchParams.set('response_type', 'code');

    // Usar el userId como state para prevenir CSRF y recuperar el usuario después
    authUrl.searchParams.set('state', JSON.stringify({
      userId: session.user.id,
      platform: 'INSTAGRAM',
      timestamp: Date.now(),
    }));

    // Redirigir a Instagram
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating Instagram OAuth:', error);
    return NextResponse.json(
      { message: error.message || 'Error al iniciar autenticación con Instagram' },
      { status: 500 }
    );
  }
}
