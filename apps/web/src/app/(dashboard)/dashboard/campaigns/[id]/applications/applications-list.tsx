'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface CreatorProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  primaryNiche: string | null;
  secondaryNiches: string[];
  location: string | null;
}

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
  internalNotes: string | null;
  rejectionReason: string | null;
  creatorProfile: CreatorProfile;
}

interface ApplicationsListProps {
  campaignId: string;
  campaignTitle: string;
  maxCreators: number;
  currentCreators: number;
  applications: Application[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  APPLIED: { label: 'Aplicado', color: 'bg-blue-500/10 text-blue-500', icon: FileText },
  UNDER_REVIEW: { label: 'En revisión', color: 'bg-purple-500/10 text-purple-500', icon: Eye },
  SHORTLISTED: { label: 'Preseleccionado', color: 'bg-yellow-500/10 text-yellow-500', icon: Star },
  HIRED: { label: 'Contratado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', color: 'bg-red-500/10 text-red-500', icon: XCircle },
  WITHDRAWN: { label: 'Retirado', color: 'bg-gray-500/10 text-gray-500', icon: Clock },
};

const FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'APPLIED', label: 'Aplicados' },
  { value: 'UNDER_REVIEW', label: 'En revisión' },
  { value: 'SHORTLISTED', label: 'Preseleccionados' },
  { value: 'HIRED', label: 'Contratados' },
  { value: 'REJECTED', label: 'Rechazados' },
];

function getTimeSince(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Hace unos minutos';
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hace 1 día';
  if (diffInDays < 30) return `Hace ${diffInDays} días`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
}

export function ApplicationsList({
  campaignId,
  campaignTitle,
  maxCreators,
  currentCreators,
  applications: initialApplications,
}: ApplicationsListProps) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const filtered =
    selectedStatus === 'all'
      ? applications
      : applications.filter((app) => app.status === selectedStatus);

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'APPLIED').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
    hired: applications.filter((a) => a.status === 'HIRED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const handleQuickAction = async (
    appId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    setLoadingAction(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId ? { ...app, status } : app,
          ),
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-6">
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a campañas
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                <Users className="w-7 h-7 text-brand-500" />
                Aplicaciones
              </h1>
              <p className="text-muted-foreground mt-1">{campaignTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Cupos</p>
              <p className="text-2xl font-bold">
                {currentCreators}/{maxCreators}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Nuevos</p>
              <p className="text-2xl font-bold text-blue-500">{stats.applied}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">En revisión</p>
              <p className="text-2xl font-bold text-purple-500">{stats.underReview}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Preseleccionados</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.shortlisted}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Contratados</p>
              <p className="text-2xl font-bold text-green-500">{stats.hired}</p>
            </div>
            <div className="bento-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Rechazados</p>
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
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedStatus === 'all'
                ? 'Aún no hay aplicaciones'
                : `No hay aplicaciones con estado "${FILTERS.find((f) => f.value === selectedStatus)?.label}"`}
            </h3>
            <p className="text-muted-foreground">
              {selectedStatus === 'all'
                ? 'Cuando los creadores apliquen a tu campaña, aparecerán aquí'
                : 'Prueba con otro filtro'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((application) => {
              const config = (STATUS_CONFIG[application.status] || STATUS_CONFIG.APPLIED)!;
              const StatusIcon = config.icon;
              const isLoading = loadingAction === application.id;

              return (
                <div
                  key={application.id}
                  className="bento-card p-6 hover:border-brand-500/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                        {application.creatorProfile.avatarUrl ? (
                          <img
                            src={application.creatorProfile.avatarUrl}
                            alt={application.creatorProfile.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-brand-500">
                            {application.creatorProfile.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={`/dashboard/campaigns/${campaignId}/applications/${application.id}`}
                          className="font-semibold text-lg hover:text-brand-500 transition-colors"
                        >
                          {application.creatorProfile.displayName}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                        {application.creatorProfile.primaryNiche && (
                          <span>{application.creatorProfile.primaryNiche}</span>
                        )}
                        {application.creatorProfile.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {application.creatorProfile.location}
                          </span>
                        )}
                        {application.proposedRate && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${parseInt(application.proposedRate).toLocaleString()}{' '}
                            {application.currency}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSince(application.appliedAt)}
                        </span>
                      </div>

                      {application.pitch && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {application.pitch}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {application.status === 'APPLIED' && (
                            <button
                              onClick={() =>
                                handleQuickAction(application.id, 'UNDER_REVIEW')
                              }
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                            >
                              Revisar
                            </button>
                          )}
                          {application.status === 'UNDER_REVIEW' && (
                            <button
                              onClick={() =>
                                handleQuickAction(application.id, 'SHORTLISTED')
                              }
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors"
                            >
                              Preseleccionar
                            </button>
                          )}
                          {application.status === 'SHORTLISTED' && (
                            <button
                              onClick={() =>
                                handleQuickAction(application.id, 'HIRED')
                              }
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                            >
                              Contratar
                            </button>
                          )}
                        </>
                      )}

                      <Link
                        href={`/dashboard/campaigns/${campaignId}/applications/${application.id}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1"
                      >
                        Ver
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
