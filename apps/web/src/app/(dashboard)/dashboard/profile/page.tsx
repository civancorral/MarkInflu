'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileHeader } from './components/profile-header';
import { SocialAccountsManager } from './components/social-accounts-manager';
import { RatesConfigurator } from './components/rates-configurator';
import { PortfolioSection } from './components/portfolio-section';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== 'CREATOR') {
      router.push('/dashboard');
      return;
    }
    fetchProfile();

    // Manejar mensajes de OAuth callback
    const connected = searchParams.get('connected');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (connected) {
      const platform = connected.charAt(0).toUpperCase() + connected.slice(1);
      toast.success(`¡${platform} conectado exitosamente!${username ? ` (@${username})` : ''}`);
      // Limpiar URL
      window.history.replaceState({}, '', '/dashboard/profile');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Autorización cancelada',
        invalid_request: 'Solicitud inválida',
        invalid_state: 'Estado de sesión inválido',
        expired_request: 'La solicitud ha expirado',
        unsupported_platform: 'Plataforma no soportada',
        callback_error: 'Error en el proceso de autenticación',
        instagram_error: 'Error al conectar con Instagram',
      };
      toast.error(errorMessages[error] || message || 'Error al conectar red social');
      // Limpiar URL
      window.history.replaceState({}, '', '/dashboard/profile');
    }
  }, [session, searchParams]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators/profile');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cargar perfil');
      }

      const result = await response.json();
      setProfile(result.data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error(error.message || 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No se pudo cargar el perfil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
        <p className="page-description">
          Gestiona tu información personal y configuración de tarifas
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader profile={profile} editable={true} />

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Info Personal */}
        <div className="space-y-8">
          {/* Personal Information Card */}
          <div className="bento-card p-6">
            <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
            <div className="space-y-3">
              {profile.firstName && profile.lastName && (
                <div>
                  <p className="text-sm text-muted-foreground">Nombre completo</p>
                  <p className="font-medium">{profile.firstName} {profile.lastName}</p>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Idiomas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.languages.map((lang: string) => (
                      <span key={lang} className="px-2 py-1 rounded-md bg-secondary text-xs">
                        {lang.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.secondaryNiches && profile.secondaryNiches.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Nichos secundarios</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.secondaryNiches.map((niche: string) => (
                      <span key={niche} className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs">
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.contentTypes && profile.contentTypes.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipos de contenido</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.contentTypes.map((type: string) => (
                      <span key={type} className="px-2 py-1 rounded-md bg-brand-500/10 text-brand-400 text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.minimumBudget && (
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto mínimo</p>
                  <p className="font-medium">
                    ${parseFloat(profile.minimumBudget).toLocaleString()} {profile.currency}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bento-card p-6">
            <PortfolioSection portfolioUrls={profile.portfolioUrls} editable={false} />
          </div>
        </div>

        {/* Right Column: Social & Rates */}
        <div className="space-y-8">
          {/* Social Accounts */}
          <div className="bento-card p-6">
            <SocialAccountsManager
              socialAccounts={profile.socialAccounts || []}
              editable={false}
            />
          </div>

          {/* Rates */}
          <div className="bento-card p-6">
            <RatesConfigurator rates={profile.rates} editable={false} />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bento-card p-6 text-center">
          <p className="text-3xl font-bold text-brand-400">
            {profile.totalFollowers?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total seguidores</p>
        </div>

        <div className="bento-card p-6 text-center">
          <p className="text-3xl font-bold text-green-400">
            {profile.averageEngagement || '0.00'}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Engagement promedio</p>
        </div>

        <div className="bento-card p-6 text-center">
          <p className="text-3xl font-bold text-purple-400">
            {profile.totalApplications || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Aplicaciones</p>
        </div>

        <div className="bento-card p-6 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            {profile.totalReviews || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Reseñas</p>
        </div>
      </div>
    </div>
  );
}
