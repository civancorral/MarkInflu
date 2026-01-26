'use client';

import { 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Upload,
  Eye,
  Star,
  Instagram,
  Youtube
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils';

// Mock data
const stats = {
  activeContracts: 4,
  pendingDeliverables: 2,
  totalEarnings: 12500,
  thisMonthEarnings: 3200,
  profileViews: 156,
  savedByBrands: 23,
};

const activeContracts = [
  {
    id: '1',
    campaign: 'Lanzamiento App Productividad',
    brand: 'TechBrand Inc.',
    status: 'IN_PROGRESS',
    nextDeliverable: 'Reel Tutorial',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    amount: 1800,
  },
  {
    id: '2',
    campaign: 'Campaña Fitness Verano',
    brand: 'FitLife Co.',
    status: 'PENDING_REVIEW',
    nextDeliverable: 'Stories x3',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    amount: 1200,
  },
];

const opportunities = [
  {
    id: '1',
    title: 'Review Smartphone Premium',
    brand: 'MobileTech',
    budget: '$2,000 - $4,000',
    deadline: '5 días',
    match: 92,
  },
  {
    id: '2',
    title: 'Campaña Lifestyle Otoño',
    brand: 'Fashion Brand',
    budget: '$800 - $1,500',
    deadline: '12 días',
    match: 85,
  },
];

const socialStats = [
  { platform: 'Instagram', icon: Instagram, followers: 250000, growth: 2.4 },
  { platform: 'YouTube', icon: Youtube, followers: 85000, growth: 3.1 },
];

export function CreatorDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Gestiona tus colaboraciones y ganancias.</p>
        </div>
        <Link href="/dashboard/opportunities" className="btn-primary inline-flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Ver Oportunidades
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Earnings This Month */}
        <div className="bento-card bg-gradient-to-br from-brand-500/10 to-brand-600/5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
              <DollarSign className="h-5 w-5 text-brand-500" />
            </div>
            <span className="stat-change-positive flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +18%
            </span>
          </div>
          <div className="mt-4">
            <p className="stat-value">{formatCurrency(stats.thisMonthEarnings)}</p>
            <p className="stat-label">Ganancias Este Mes</p>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.activeContracts}</p>
            <p className="stat-label">Contratos Activos</p>
          </div>
        </div>

        {/* Pending Deliverables */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <Upload className="h-5 w-5 text-yellow-500" />
            </div>
            {stats.pendingDeliverables > 0 && (
              <span className="badge-warning">{stats.pendingDeliverables} pendientes</span>
            )}
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.pendingDeliverables}</p>
            <p className="stat-label">Entregables Pendientes</p>
          </div>
        </div>

        {/* Profile Views */}
        <div className="bento-card">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <span className="stat-change-positive flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12%
            </span>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats.profileViews}</p>
            <p className="stat-label">Vistas al Perfil (7d)</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active Contracts */}
        <div className="bento-card lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contratos Activos</h3>
            <Link href="/dashboard/contracts" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-4">
            {activeContracts.map((contract) => (
              <div
                key={contract.id}
                className="rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{contract.campaign}</p>
                    <p className="text-sm text-muted-foreground">{contract.brand}</p>
                  </div>
                  <span className={`badge ${
                    contract.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'
                  }`}>
                    {contract.status === 'IN_PROGRESS' ? 'En Progreso' : 'Pendiente Revisión'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span>{contract.nextDeliverable}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Vence {formatRelativeTime(contract.dueDate)}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-green-500">
                    {formatCurrency(contract.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Opportunities */}
        <div className="bento-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Oportunidades</h3>
            <Link href="/dashboard/opportunities" className="text-sm text-primary hover:underline">
              Ver más
            </Link>
          </div>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/dashboard/opportunities/${opp.id}`}
                className="block rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-accent/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">{opp.brand}</p>
                  </div>
                  <span className="badge-success">{opp.match}% match</span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{opp.budget}</span>
                  <span>·</span>
                  <span>Cierra en {opp.deadline}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Social Stats & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Social Stats */}
        {socialStats.map((social) => {
          const Icon = social.icon;
          return (
            <div key={social.platform} className="bento-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{social.platform}</p>
                  <p className="font-semibold">{formatNumber(social.followers)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-green-500">
                <TrendingUp className="h-3 w-3" />
                +{social.growth}% este mes
              </div>
            </div>
          );
        })}

        {/* Quick Actions */}
        <Link href="/dashboard/profile" className="bento-card bento-card-glow group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 group-hover:bg-brand-500/20">
              <Star className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="font-medium">Editar Perfil</p>
              <p className="text-sm text-muted-foreground">Actualiza tus rates</p>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
        </Link>

        <Link href="/dashboard/earnings" className="bento-card bento-card-glow group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Ver Ganancias</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(stats.totalEarnings)} total</p>
            </div>
          </div>
          <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
