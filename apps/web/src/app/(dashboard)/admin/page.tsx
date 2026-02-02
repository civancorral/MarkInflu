'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Megaphone,
  CreditCard,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  FileText,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  totalBrands: number;
  totalCreators: number;
  activeCampaigns: number;
  totalContracts: number;
  totalTransactions: number;
  platformRevenue: number | string;
  recentUsers: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  BRAND: 'Marca',
  CREATOR: 'Creador',
  AGENCY: 'Agencia',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-500 border-red-500/20',
  PENDING_VERIFICATION: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : null)
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Usuarios Totales', value: stats.totalUsers, icon: Users, href: '/admin/users', color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Marcas', value: stats.totalBrands, icon: Users, href: '/admin/users?role=BRAND', color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Creadores', value: stats.totalCreators, icon: Users, href: '/admin/users?role=CREATOR', color: 'text-pink-500 bg-pink-500/10' },
    { label: 'Campañas Activas', value: stats.activeCampaigns, icon: Megaphone, href: '/admin/campaigns', color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Contratos', value: stats.totalContracts, icon: FileText, href: '/admin/transactions', color: 'text-brand-500 bg-brand-500/10' },
    { label: 'Transacciones', value: stats.totalTransactions, icon: CreditCard, href: '/admin/transactions', color: 'text-green-500 bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      {/* Revenue Card */}
      <div className="bento-card bg-gradient-to-r from-brand-500/10 to-brand-600/5 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20">
            <DollarSign className="h-6 w-6 text-brand-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingresos de Plataforma (Comisiones)</p>
            <p className="text-3xl font-bold">{formatCurrency(parseFloat(String(stats.platformRevenue)))}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="bento-card p-5 transition-colors hover:border-brand-500/30">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="bento-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold">Usuarios Recientes</h2>
          <Link href="/admin/users" className="text-sm text-brand-500 hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-border">
          {stats.recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role] || user.role} — {new Date(user.createdAt).toLocaleDateString('es-MX')}
                </p>
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                STATUS_COLORS[user.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20',
              )}>
                {user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
