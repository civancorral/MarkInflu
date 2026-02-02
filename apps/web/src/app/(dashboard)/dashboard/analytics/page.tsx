'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Eye,
  MessageSquare,
  DollarSign,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: string | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  lastSyncAt: string | null;
}

interface Snapshot {
  snapshotDate: string;
  followers: number;
  engagementRate: string | null;
  avgLikes: number | null;
  avgViews: number | null;
  followerGrowth: number | null;
  growthPercentage: string | null;
  socialAccountId: string | null;
}

interface AnalyticsData {
  profile: {
    id: string;
    displayName: string;
    socialAccounts: SocialAccount[];
  };
  snapshots: Snapshot[];
  stats: {
    totalContracts: number;
    totalEarned: number | string;
    completedPayments: number;
  };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'from-pink-500 to-purple-500',
  YOUTUBE: 'from-red-500 to-red-600',
  TIKTOK: 'from-gray-900 to-gray-700',
  TWITTER: 'from-blue-400 to-blue-500',
  FACEBOOK: 'from-blue-600 to-blue-700',
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  const { profile, snapshots, stats } = data;
  const totalFollowers = profile.socialAccounts.reduce((sum, a) => sum + a.followers, 0);
  const avgEngagement =
    profile.socialAccounts.length > 0
      ? profile.socialAccounts.reduce((sum, a) => sum + (parseFloat(a.engagementRate || '0')), 0) /
        profile.socialAccounts.length
      : 0;

  // Calculate growth from snapshots
  const recentGrowth = snapshots.length >= 2
    ? snapshots[snapshots.length - 1]!.followers - snapshots[0]!.followers
    : 0;
  const growthIsPositive = recentGrowth >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">Resumen de tu rendimiento y métricas</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Seguidores Totales</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatNumber(totalFollowers)}</p>
          {recentGrowth !== 0 && (
            <div className={cn('mt-1 flex items-center gap-1 text-xs', growthIsPositive ? 'text-green-500' : 'text-red-500')}>
              {growthIsPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {formatNumber(Math.abs(recentGrowth))} últimos 30 días
            </div>
          )}
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Engagement Promedio</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs">Contratos</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalContracts}</p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Total Ganado</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(parseFloat(String(stats.totalEarned)))}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.completedPayments} pagos</p>
        </div>
      </div>

      {/* Platform Cards */}
      <div>
        <h2 className="mb-4 font-semibold">Plataformas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.socialAccounts.map((account) => {
            const gradient = PLATFORM_COLORS[account.platform] || 'from-gray-500 to-gray-600';

            return (
              <div key={account.id} className="bento-card overflow-hidden">
                {/* Platform Header */}
                <div className={cn('bg-gradient-to-r p-4 text-white', gradient)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-90">{account.platform}</p>
                      <p className="text-xs opacity-70">@{account.username}</p>
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(account.followers)}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 divide-x divide-border p-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{account.engagementRate ? `${parseFloat(account.engagementRate).toFixed(1)}%` : '—'}</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{account.avgLikes ? formatNumber(account.avgLikes) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Avg. Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{account.avgViews ? formatNumber(account.avgViews) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Avg. Views</p>
                  </div>
                </div>

                {/* Last sync */}
                {account.lastSyncAt && (
                  <div className="border-t border-border px-4 py-2">
                    <p className="text-xs text-muted-foreground">
                      Última sincronización: {new Date(account.lastSyncAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {profile.socialAccounts.length === 0 && (
            <div className="bento-card col-span-full flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">No tienes cuentas sociales conectadas</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Agrega tus redes sociales desde tu perfil para ver estadísticas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Growth Timeline */}
      {snapshots.length > 0 && (
        <div className="bento-card p-6">
          <h2 className="mb-4 font-semibold">Crecimiento (últimos 30 días)</h2>
          <div className="space-y-2">
            {snapshots.slice(-10).map((snap, i) => {
              const maxFollowers = Math.max(...snapshots.map((s) => s.followers));
              const width = maxFollowers > 0 ? (snap.followers / maxFollowers) * 100 : 0;

              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-20 flex-shrink-0 text-xs text-muted-foreground">
                    {new Date(snap.snapshotDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="h-5 flex-1 rounded-full bg-muted">
                    <div
                      className="h-5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
                      style={{ width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 flex-shrink-0 text-right text-xs font-medium">
                    {formatNumber(snap.followers)}
                  </span>
                  {snap.followerGrowth != null && snap.followerGrowth !== 0 && (
                    <span
                      className={cn(
                        'w-14 flex-shrink-0 text-right text-xs',
                        snap.followerGrowth > 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      {snap.followerGrowth > 0 ? '+' : ''}{formatNumber(snap.followerGrowth)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
