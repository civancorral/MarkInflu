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
  Eye,
  Sparkles,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

interface Application {
  id: string;
  status: string;
  proposedRate: string | null;
  currency: string;
  pitch: string | null;
  portfolioLinks: string[];
  appliedAt: string;
  shortlistedAt: string | null;
  rejectedAt: string | null;
  hiredAt: string | null;
  rejectionReason: string | null;
  campaign: {
    id: string;
    title: string;
    slug: string;
    budgetMin: string | null;
    budgetMax: string | null;
    currency: string;
    applicationDeadline: string | null;
    brand: {
      name: string;
      logo: string | null;
      industry: string[];
    };
  };
}

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Aplicado',
    color: 'bg-blue-500/10 text-blue-500',
    icon: FileText,
  },
  UNDER_REVIEW: {
    label: 'En revisión',
    color: 'bg-purple-500/10 text-purple-500',
    icon: Eye,
  },
  SHORTLISTED: {
    label: 'Preseleccionado',
    color: 'bg-yellow-500/10 text-yellow-500',
    icon: TrendingUp,
  },
  HIRED: {
    label: 'Contratado',
    color: 'bg-green-500/10 text-green-500',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-500/10 text-red-500',
    icon: XCircle,
  },
  WITHDRAWN: {
    label: 'Retirado',
    color: 'bg-gray-500/10 text-gray-500',
    icon: AlertCircle,
  },
};

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'APPLIED', label: 'Aplicadas' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'SHORTLISTED', label: 'Preseleccionadas' },
  { value: 'HIRED', label: 'Contratadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
];

function getTimeSince(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `Hace ${diffInHours} horas`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hace 1 día';
  if (diffInDays < 30) return `Hace ${diffInDays} días`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return 'Hace 1 mes';
  return `Hace ${diffInMonths} meses`;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const response = await fetch(`/api/applications/my-applications?${params}`);
      const result = await response.json();
      setApplications(result.data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group applications by status
  const stats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === 'APPLIED').length,
    underReview: applications.filter((app) => app.status === 'UNDER_REVIEW').length,
    shortlisted: applications.filter((app) => app.status === 'SHORTLISTED').length,
    hired: applications.filter((app) => app.status === 'HIRED').length,
    rejected: applications.filter((app) => app.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                <FileText className="w-7 h-7 text-brand-500" />
                Mis Aplicaciones
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona y da seguimiento a tus aplicaciones
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Aplicadas</p>
              <p className="text-2xl font-bold text-blue-500">{stats.applied}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">En revisión</p>
              <p className="text-2xl font-bold text-purple-500">{stats.underReview}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Preseleccionadas</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.shortlisted}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Contratadas</p>
              <p className="text-2xl font-bold text-green-500">{stats.hired}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Rechazadas</p>
              <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedStatus === filter.value
                    ? 'bg-brand-500 text-white'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bento-card p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                  <div className="flex-1">
                    <div className="h-5 w-2/3 bg-muted rounded mb-2" />
                    <div className="h-4 w-1/3 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedStatus === 'all'
                ? 'No has enviado aplicaciones aún'
                : `No tienes aplicaciones ${FILTERS.find((f) => f.value === selectedStatus)?.label.toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedStatus === 'all'
                ? 'Explora las oportunidades disponibles y aplica a las campañas que te interesen'
                : 'Prueba con otro filtro o explora nuevas oportunidades'}
            </p>
            {selectedStatus === 'all' ? (
              <Link href="/dashboard/opportunities" className="btn-primary">
                Explorar Oportunidades
              </Link>
            ) : (
              <button
                onClick={() => setSelectedStatus('all')}
                className="btn-secondary"
              >
                Ver todas las aplicaciones
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applications.map((application) => {
              const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig.icon;

              return (
                <Link
                  key={application.id}
                  href={`/dashboard/applications/${application.id}`}
                  className="bento-card p-6 hover:border-brand-500/50 transition-all group"
                >
                  {/* Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                        {application.campaign.brand.logo ? (
                          <img
                            src={application.campaign.brand.logo}
                            alt={application.campaign.brand.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-brand-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-brand-500 transition-colors truncate">
                        {application.campaign.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {application.campaign.brand.name}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {application.proposedRate && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          ${parseInt(application.proposedRate).toLocaleString()} {application.currency}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {getTimeSince(application.appliedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Pitch Preview */}
                  {application.pitch && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {application.pitch}
                    </p>
                  )}

                  {/* Rejection Reason */}
                  {application.status === 'REJECTED' && application.rejectionReason && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                      <p className="text-sm text-red-500">
                        <span className="font-medium">Motivo:</span> {application.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Hired Notice */}
                  {application.status === 'HIRED' && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
                      <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        ¡Felicidades! Has sido seleccionado para esta campaña
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Aplicado {new Date(application.appliedAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-brand-500 font-medium text-sm group-hover:gap-2 transition-all">
                      Ver detalles
                      <ChevronRight className="w-4 h-4" />
                    </div>
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
