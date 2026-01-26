'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
  Video,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { toast } from 'sonner';

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  contract: {
    id: string;
    campaign: {
      id: string;
      title: string;
      brand: {
        name: string;
        logo: string | null;
      };
    };
  };
  latestVersion: {
    id: string;
    versionNumber: number;
    fileUrl: string;
    thumbnailUrl: string | null;
    uploadedAt: string;
  } | null;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: Clock,
  },
  DRAFT: {
    label: 'Borrador',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: FileText,
  },
  IN_REVIEW: {
    label: 'En revisión',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: Eye,
  },
  CHANGES_REQUESTED: {
    label: 'Cambios solicitados',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: AlertCircle,
  },
  APPROVED: {
    label: 'Aprobado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: XCircle,
  },
};

const TYPE_ICONS = {
  VIDEO: Video,
  IMAGE: ImageIcon,
  DOCUMENT: File,
  OTHER: FileText,
};

export default function DeliverablesPage() {
  const searchParams = useSearchParams();
  const contractFilter = searchParams.get('contract');

  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetchDeliverables();
  }, [activeFilter, contractFilter]);

  const fetchDeliverables = async () => {
    try {
      let url = '/api/deliverables/my-deliverables';
      const params = new URLSearchParams();

      if (activeFilter !== 'all') {
        params.append('status', activeFilter);
      }

      if (contractFilter) {
        params.append('contract', contractFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        setDeliverables(result.data);
      } else {
        toast.error('Error al cargar entregables');
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      toast.error('Error al cargar entregables');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: deliverables.length,
    pending: deliverables.filter((d) => d.status === 'PENDING' || d.status === 'DRAFT').length,
    inReview: deliverables.filter((d) => d.status === 'IN_REVIEW').length,
    approved: deliverables.filter((d) => d.status === 'APPROVED').length,
    changesRequested: deliverables.filter((d) => d.status === 'CHANGES_REQUESTED').length,
  };

  const filters = [
    { value: 'all', label: 'Todos', count: stats.total },
    { value: 'PENDING', label: 'Pendientes', count: stats.pending },
    { value: 'IN_REVIEW', label: 'En revisión', count: stats.inReview },
    { value: 'CHANGES_REQUESTED', label: 'Cambios solicitados', count: stats.changesRequested },
    { value: 'APPROVED', label: 'Aprobados', count: stats.approved },
  ];

  const getTypeIcon = (type: string) => {
    return TYPE_ICONS[type as keyof typeof TYPE_ICONS] || FileText;
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
              <h1 className="text-3xl font-bold mb-2">Mis Entregables</h1>
              <p className="text-muted-foreground">
                Sube y gestiona el contenido de tus campañas activas
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
                <div className="p-2 rounded-lg bg-gray-500/10">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Eye className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                  <p className="text-sm text-muted-foreground">En revisión</p>
                </div>
              </div>
            </div>

            <div className="bento-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
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
        {deliverables.length === 0 ? (
          <div className="bento-card p-12 text-center">
            <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No tienes entregables</h3>
            <p className="text-muted-foreground mb-6">
              {activeFilter === 'all'
                ? 'Cuando tengas contratos activos, tus entregables aparecerán aquí'
                : `No tienes entregables con estado: ${filters.find(f => f.value === activeFilter)?.label}`}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="btn-secondary"
              >
                Ver todos los entregables
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {deliverables.map((deliverable) => {
              const statusConfig = STATUS_CONFIG[deliverable.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;
              const TypeIcon = getTypeIcon(deliverable.type);
              const overdue = deliverable.dueDate && isOverdue(deliverable.dueDate) && deliverable.status !== 'APPROVED';

              return (
                <Link
                  key={deliverable.id}
                  href={`/dashboard/deliverables/${deliverable.id}`}
                  className="bento-card overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Thumbnail or Icon */}
                  <div className="relative h-48 bg-gradient-to-br from-brand-400/20 to-purple-500/20">
                    {deliverable.latestVersion?.thumbnailUrl ? (
                      <img
                        src={deliverable.latestVersion.thumbnailUrl}
                        alt={deliverable.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon className="w-16 h-16 text-muted-foreground opacity-50" />
                      </div>
                    )}

                    {/* Overdue Badge */}
                    {overdue && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Vencido
                      </div>
                    )}

                    {/* Version Badge */}
                    {deliverable.latestVersion && (
                      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium">
                        v{deliverable.latestVersion.versionNumber}
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* Brand Logo & Name */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-lg bg-background flex items-center justify-center">
                          {deliverable.contract.campaign.brand.logo ? (
                            <img
                              src={deliverable.contract.campaign.brand.logo}
                              alt={deliverable.contract.campaign.brand.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-brand-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {deliverable.contract.campaign.brand.name}
                      </p>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-brand-500 transition-colors line-clamp-2">
                      {deliverable.title}
                    </h3>

                    {/* Campaign */}
                    <p className="text-sm text-muted-foreground mb-4 truncate">
                      {deliverable.contract.campaign.title}
                    </p>

                    {/* Status Badge */}
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Due Date */}
                    {deliverable.dueDate && (
                      <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>
                          Vence: {new Date(deliverable.dueDate).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {deliverable.status === 'CHANGES_REQUESTED' && deliverable.rejectionReason && (
                      <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-600 line-clamp-2">
                          {deliverable.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
