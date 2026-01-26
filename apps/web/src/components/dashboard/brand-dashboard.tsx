'use client';

import { 
  Users, 
  Megaphone, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatNumber } from '@/lib/utils';

// Mock data - will be replaced with real API calls
const stats = {
  activeCampaigns: 3,
  totalCreators: 12,
  activeContracts: 8,
  totalSpent: 45000,
  pendingApprovals: 5,
  completedDeliverables: 24,
};

const recentCampaigns = [
  {
    id: '1',
    title: 'Lanzamiento App Productividad',
    status: 'PUBLISHED',
    applications: 15,
    hired: 3,
    budget: 7500,
  },
  {
    id: '2',
    title: 'Review Gadgets Tech Q1',
    status: 'DRAFT',
    applications: 0,
    hired: 0,
    budget: 15000,
  },
];

const pendingActions = [
  { type: 'review', title: 'Revisar entregable de @sofia_lifestyle', campaign: 'Lanzamiento App', time: '2h' },
  { type: 'application', title: '5 nuevas aplicaciones', campaign: 'Lanzamiento App', time: '4h' },
  { type: 'payment', title: 'Aprobar pago milestone', campaign: 'Review Gadgets', time: '1d' },
];

export function BrandDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Bienvenido de vuelta. Aquí está el resumen de tu actividad.</p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1 */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <Megaphone className="h-5 w-5 text-brand-500" />
            </div>
            <span className="stat-change-positive flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +2
            </span>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.activeCampaigns}</p>
            <p className="stat-label">Campañas Activas</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <span className="stat-change-positive flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +5
            </span>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.totalCreators}</p>
            <p className="stat-label">Creadores Contratados</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.activeContracts}</p>
            <p className="stat-label">Contratos Activos</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{formatCurrency(stats.totalSpent)}</p>
            <p className="stat-label">Total Invertido</p>
          </div>
        </div>
      </div>

      {/* Second Row - Large Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Campaigns - 2 cols */}
        <div className="bento-card lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Campañas Recientes</h3>
            <Link href="/dashboard/campaigns" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-4">
            {recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${
                    campaign.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">{campaign.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.applications} aplicaciones · {campaign.hired} contratados
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                </div>
              </div>
            ))}
            {recentCampaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No tienes campañas aún</p>
                <Link href="/dashboard/campaigns/new" className="btn-primary mt-4">
                  Crear Primera Campaña
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bento-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Acciones Pendientes</h3>
            <span className="badge-warning">{pendingActions.length}</span>
          </div>
          <div className="space-y-3">
            {pendingActions.map((action, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  action.type === 'review' ? 'bg-blue-500/10 text-blue-500' :
                  action.type === 'application' ? 'bg-green-500/10 text-green-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {action.type === 'review' && <CheckCircle2 className="h-4 w-4" />}
                  {action.type === 'application' && <Users className="h-4 w-4" />}
                  {action.type === 'payment' && <DollarSign className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.campaign}</p>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {action.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/discover" className="bento-card bento-card-glow group">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
              <Users className="h-6 w-6 text-brand-500" />
            </div>
            <div>
              <h3 className="font-semibold">Descubrir Creadores</h3>
              <p className="text-sm text-muted-foreground">Encuentra el talento perfecto</p>
            </div>
            <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </Link>

        <Link href="/dashboard/contracts" className="bento-card bento-card-glow group">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 transition-colors group-hover:bg-green-500/20">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Gestionar Contratos</h3>
              <p className="text-sm text-muted-foreground">Revisa entregables pendientes</p>
            </div>
            <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </Link>

        <Link href="/dashboard/payments" className="bento-card bento-card-glow group">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 transition-colors group-hover:bg-yellow-500/20">
              <DollarSign className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold">Pagos y Facturación</h3>
              <p className="text-sm text-muted-foreground">Gestiona tus transacciones</p>
            </div>
            <ArrowUpRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
