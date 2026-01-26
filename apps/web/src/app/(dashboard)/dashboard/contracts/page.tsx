'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: string | null;
  dueDate: string;
  status: string;
  completedAt: string | null;
  paidAt: string | null;
}

interface Contract {
  id: string;
  status: string;
  totalAmount: string | null;
  currency: string;
  startDate: string;
  endDate: string | null;
  terms: any;
  createdAt: string;
  signedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  campaign: {
    id: string;
    title: string;
    slug: string;
    brand: {
      name: string;
      logo: string | null;
      industry: string[];
    };
  };
  milestones: Milestone[];
}

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Borrador',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: FileText,
  },
  PENDING_SIGNATURES: {
    label: 'Pendiente de firmas',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: Clock,
  },
  ACTIVE: {
    label: 'Activo',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: TrendingUp,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: XCircle,
  },
};

const MILESTONE_STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-gray-500/10 text-gray-500',
  },
  IN_PROGRESS: {
    label: 'En progreso',
    color: 'bg-blue-500/10 text-blue-500',
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-green-500/10 text-green-500',
  },
  PAID: {
    label: 'Pagado',
    color: 'bg-purple-500/10 text-purple-500',
  },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchContracts();
  }, [activeFilter]);

  const fetchContracts = async () => {
    try {
      const url = activeFilter === 'all'
        ? '/api/contracts/my-contracts'
        : `/api/contracts/my-contracts?status=${activeFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setContracts(result.data);
      } else {
        toast.error('Error al cargar contratos');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Error al cargar contratos');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'ACTIVE').length,
    completed: contracts.filter((c) => c.status === 'COMPLETED').length,
    pending: contracts.filter((c) => c.status === 'PENDING_SIGNATURES').length,
  };

  const filters = [
    { value: 'all', label: 'Todos', count: stats.total },
    { value: 'ACTIVE', label: 'Activos', count: stats.active },
    { value: 'PENDING_SIGNATURES', label: 'Pendientes', count: stats.pending },
    { value: 'COMPLETED', label: 'Completados', count: stats.completed },
  ];

  const getNextMilestone = (milestones: Milestone[]) => {
    return milestones.find((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS');
  };

  const getPaidMilestones = (milestones: Milestone[]) => {
    return milestones.filter((m) => m.status === 'PAID').length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mis Contratos</h1>
              <p className="text-muted-foreground">
                Gestiona tus colaboraciones activas y términos acordados
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10">
                  <FileText className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeFilter === filter.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {contracts.length === 0 ? (
          <div className="bento-card p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No tienes contratos</h3>
            <p className="text-muted-foreground mb-6">
              {activeFilter === 'all'
                ? 'Cuando seas contratado para una campaña, tus contratos aparecerán aquí'
                : `No tienes contratos con estado: ${filters.find(f => f.value === activeFilter)?.label}`}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="btn-secondary"
              >
                Ver todos los contratos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contracts.map((contract) => {
              const statusConfig = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;
              const nextMilestone = getNextMilestone(contract.milestones);
              const paidMilestones = getPaidMilestones(contract.milestones);

              return (
                <Link
                  key={contract.id}
                  href={`/dashboard/contracts/${contract.id}`}
                  className="bento-card p-6 hover:shadow-lg transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                        {contract.campaign.brand.logo ? (
                          <img
                            src={contract.campaign.brand.logo}
                            alt={contract.campaign.brand.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-7 h-7 text-brand-500" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-brand-500 transition-colors truncate">
                        {contract.campaign.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {contract.campaign.brand.name}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Contract Info */}
                  <div className="space-y-3 mb-4">
                    {contract.totalAmount && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          ${parseInt(contract.totalAmount).toLocaleString()} {contract.currency}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(contract.startDate).toLocaleDateString('es-MX')}
                        {contract.endDate && ` - ${new Date(contract.endDate).toLocaleDateString('es-MX')}`}
                      </span>
                    </div>
                  </div>

                  {/* Milestones Progress */}
                  {contract.milestones.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Hitos completados</span>
                        <span className="font-medium">
                          {paidMilestones} / {contract.milestones.length}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${(paidMilestones / contract.milestones.length) * 100}%`,
                          }}
                        />
                      </div>

                      {nextMilestone && (
                        <div className="mt-3 p-3 rounded-lg bg-secondary">
                          <p className="text-xs text-muted-foreground mb-1">Próximo hito</p>
                          <p className="text-sm font-medium">{nextMilestone.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence: {new Date(nextMilestone.dueDate).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
