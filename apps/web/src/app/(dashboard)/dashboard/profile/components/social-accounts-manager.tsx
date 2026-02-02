'use client';

import { useState } from 'react';
import { Instagram, Youtube, CheckCircle, Link as LinkIcon, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  followers: number;
  following?: number;
  postsCount?: number;
  engagementRate?: string;
  avgLikes?: number | null;
  avgComments?: number | null;
  avgViews?: number | null;
  isConnected: boolean;
  isVerified: boolean;
  lastSyncAt?: Date | string | null;
}

interface SocialAccountsManagerProps {
  socialAccounts: SocialAccount[];
  editable?: boolean;
  onConnect?: (platform: string) => void;
  onDisconnect?: (platform: string) => void;
}

const PLATFORM_CONFIG = {
  INSTAGRAM: {
    name: 'Instagram',
    icon: Instagram,
    color: 'from-pink-500 to-purple-500',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/20',
  },
  YOUTUBE: {
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
  },
  TIKTOK: {
    name: 'TikTok',
    icon: (props: any) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: 'from-cyan-400 to-pink-500',
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/20',
  },
  TWITTER: {
    name: 'Twitter / X',
    icon: (props: any) => (
      <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: 'from-gray-700 to-gray-900',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500/20',
  },
};

export function SocialAccountsManager({
  socialAccounts,
  editable = false,
  onConnect,
  onDisconnect,
}: SocialAccountsManagerProps) {
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleConnect = (platform: string) => {
    if (onConnect) {
      onConnect(platform);
    } else {
      if (platform === 'INSTAGRAM') {
        window.location.href = '/api/auth/oauth/instagram';
      } else if (platform === 'YOUTUBE') {
        window.location.href = '/api/auth/oauth/youtube';
      } else if (platform === 'TIKTOK') {
        window.location.href = '/api/auth/oauth/tiktok';
      } else {
        toast.info(`OAuth para ${platform} en desarrollo`);
      }
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (onDisconnect) {
      onDisconnect(platform);
    } else {
      toast.info('Funcionalidad en desarrollo');
    }
  };

  const handleSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      const res = await fetch(`/api/social/sync/${platform}`, { method: 'POST' });
      if (res.ok) {
        toast.success(`${platform} sincronizado correctamente`);
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Error al sincronizar');
      }
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingPlatform('ALL');
    try {
      const res = await fetch('/api/social/sync-all', { method: 'POST' });
      if (res.ok) {
        toast.success('Todas las cuentas sincronizadas');
        window.location.reload();
      } else {
        toast.error('Error al sincronizar');
      }
    } catch {
      toast.error('Error al sincronizar');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const allPlatforms = Object.keys(PLATFORM_CONFIG) as Array<keyof typeof PLATFORM_CONFIG>;
  const connectedPlatforms = new Set(socialAccounts.map(account => account.platform));
  const availablePlatforms = allPlatforms.filter(platform => !connectedPlatforms.has(platform));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Redes Sociales</h3>
        {editable && socialAccounts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncingPlatform !== null}
          >
            {syncingPlatform === 'ALL' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar todo
          </Button>
        )}
      </div>

      {/* Connected Accounts */}
      <div className="space-y-3">
        {socialAccounts.map((account) => {
          const config = PLATFORM_CONFIG[account.platform as keyof typeof PLATFORM_CONFIG];
          if (!config) return null;

          const PlatformIcon = config.icon;

          return (
            <div
              key={account.id}
              className={`bento-card p-4 border ${config.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-3 rounded-xl ${config.bgColor}`}>
                    <PlatformIcon className={`w-6 h-6 ${config.textColor}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {config.name}
                      </h4>
                      {account.isVerified && (
                        <CheckCircle className={`w-4 h-4 ${config.textColor}`} />
                      )}
                      {account.isConnected && (
                        <Badge variant="success" className="text-xs">
                          Conectada
                        </Badge>
                      )}
                    </div>

                    <a
                      href={account.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-brand-400 transition-colors inline-flex items-center gap-1"
                    >
                      @{account.username}
                      <LinkIcon className="w-3 h-3" />
                    </a>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatFollowers(account.followers)}
                        </p>
                        <p className="text-xs text-muted-foreground">seguidores</p>
                      </div>

                      {account.postsCount !== undefined && (
                        <div>
                          <p className="text-2xl font-bold text-foreground">
                            {account.postsCount}
                          </p>
                          <p className="text-xs text-muted-foreground">publicaciones</p>
                        </div>
                      )}

                      {account.engagementRate && (
                        <div>
                          <p className="text-2xl font-bold text-brand-400">
                            {account.engagementRate}%
                          </p>
                          <p className="text-xs text-muted-foreground">engagement</p>
                        </div>
                      )}

                      {account.avgViews != null && account.avgViews > 0 && (
                        <div>
                          <p className="text-2xl font-bold text-foreground">
                            {formatFollowers(account.avgViews)}
                          </p>
                          <p className="text-xs text-muted-foreground">avg. views</p>
                        </div>
                      )}
                    </div>

                    {/* Last Sync */}
                    {account.lastSyncAt && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Última sincronización: {formatDate(account.lastSyncAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {editable && (
                  <div className="flex flex-col gap-2">
                    {account.isConnected && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(account.platform)}
                          disabled={syncingPlatform !== null}
                        >
                          {syncingPlatform === account.platform ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(account.platform)}
                        >
                          Desconectar
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available Platforms to Connect */}
      {editable && availablePlatforms.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground mt-6">
            Conectar más redes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availablePlatforms.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              const PlatformIcon = config.icon;

              return (
                <button
                  key={platform}
                  onClick={() => handleConnect(platform)}
                  className={`bento-card p-4 border ${config.borderColor} hover:border-brand-500/50 transition-all cursor-pointer group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor} group-hover:scale-110 transition-transform`}>
                      <PlatformIcon className={`w-5 h-5 ${config.textColor}`} />
                    </div>
                    <span className="font-medium text-foreground">
                      Conectar {config.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {socialAccounts.length === 0 && (
        <div className="text-center py-12 bento-card">
          <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            No has conectado ninguna red social aún
          </p>
          {editable && (
            <p className="text-sm text-muted-foreground">
              Conecta tus redes sociales para mostrar tus métricas y atraer marcas
            </p>
          )}
        </div>
      )}
    </div>
  );
}
