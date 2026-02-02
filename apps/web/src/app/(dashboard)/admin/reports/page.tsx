'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Megaphone,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface ReportStats {
  totalUsers: number;
  totalBrands: number;
  totalCreators: number;
  activeCampaigns: number;
  totalContracts: number;
  totalTransactions: number;
  platformRevenue: number | string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => (r.ok ? r.json() : null))
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

  const metrics = [
    {
      title: 'Usuarios',
      sections: [
        { label: 'Total Usuarios', value: stats.totalUsers, icon: Users },
        { label: 'Marcas', value: stats.totalBrands, icon: Users },
        { label: 'Creadores', value: stats.totalCreators, icon: Users },
      ],
    },
    {
      title: 'Actividad',
      sections: [
        { label: 'Campañas Activas', value: stats.activeCampaigns, icon: Megaphone },
        { label: 'Contratos Totales', value: stats.totalContracts, icon: BarChart3 },
        { label: 'Transacciones', value: stats.totalTransactions, icon: DollarSign },
      ],
    },
  ];

  const conversionRate = stats.totalCreators > 0
    ? ((stats.totalContracts / stats.totalCreators) * 100).toFixed(1)
    : '0';

  const avgContractValue = stats.totalContracts > 0 && parseFloat(String(stats.platformRevenue)) > 0
    ? parseFloat(String(stats.platformRevenue)) / stats.totalContracts
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Métricas y análisis de la plataforma</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Ingresos Plataforma</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(parseFloat(String(stats.platformRevenue)))}</p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Tasa de Conversión</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{conversionRate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">Creadores con contrato</p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Fee Promedio/Contrato</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(avgContractValue)}</p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Ratio Marca/Creador</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {stats.totalCreators > 0 ? (stats.totalBrands / stats.totalCreators).toFixed(2) : '0'}
          </p>
        </div>
      </div>

      {/* Metric Groups */}
      {metrics.map((group) => (
        <div key={group.title} className="bento-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold">{group.title}</h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {group.sections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.label} className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                    <Icon className="h-6 w-6 text-brand-500" />
                  </div>
                  <p className="text-3xl font-bold">{formatNumber(section.value)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{section.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Distribution Bar */}
      <div className="bento-card p-6">
        <h2 className="mb-4 font-semibold">Distribución de Usuarios</h2>
        <div className="space-y-3">
          {[
            { label: 'Marcas', count: stats.totalBrands, color: 'bg-purple-500' },
            { label: 'Creadores', count: stats.totalCreators, color: 'bg-pink-500' },
            { label: 'Otros', count: Math.max(0, stats.totalUsers - stats.totalBrands - stats.totalCreators), color: 'bg-gray-400' },
          ].map((item) => {
            const pct = stats.totalUsers > 0 ? (item.count / stats.totalUsers) * 100 : 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-sm text-muted-foreground">{item.label}</span>
                <div className="h-4 flex-1 rounded-full bg-muted">
                  <div
                    className={cn('h-4 rounded-full transition-all', item.color)}
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm font-medium">{item.count}</span>
                <span className="w-12 text-right text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
