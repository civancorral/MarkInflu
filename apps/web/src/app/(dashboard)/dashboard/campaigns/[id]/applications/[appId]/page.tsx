'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  StickyNote,
  Save,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  APPLIED: { label: 'Aplicado', color: 'bg-blue-500/10 text-blue-500', icon: FileText },
  UNDER_REVIEW: { label: 'En revisión', color: 'bg-purple-500/10 text-purple-500', icon: Eye },
  SHORTLISTED: { label: 'Preseleccionado', color: 'bg-yellow-500/10 text-yellow-500', icon: Star },
  HIRED: { label: 'Contratado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', color: 'bg-red-500/10 text-red-500', icon: XCircle },
  WITHDRAWN: { label: 'Retirado', color: 'bg-gray-500/10 text-gray-500', icon: Clock },
};

const NEXT_ACTIONS: Record<string, { status: string; label: string; color: string }[]> = {
  APPLIED: [
    { status: 'UNDER_REVIEW', label: 'Marcar en revisión', color: 'bg-purple-500 hover:bg-purple-600 text-white' },
    { status: 'REJECTED', label: 'Rechazar', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  ],
  UNDER_REVIEW: [
    { status: 'SHORTLISTED', label: 'Preseleccionar', color: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    { status: 'REJECTED', label: 'Rechazar', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  ],
  SHORTLISTED: [
    { status: 'HIRED', label: 'Contratar', color: 'bg-green-500 hover:bg-green-600 text-white' },
    { status: 'REJECTED', label: 'Rechazar', color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
  ],
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const appId = params.appId as string;

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [appId]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'GET',
      });
      // Use the campaign applications endpoint instead
      const detailRes = await fetch(`/api/campaigns/${campaignId}/applications?limit=100`);
      if (detailRes.ok) {
        const result = await detailRes.json();
        const app = result.data?.find((a: any) => a.id === appId);
        if (app) {
          setApplication(app);
          setNotes(app.internalNotes || '');
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      if (res.ok) {
        setApplication((prev: any) => ({ ...prev, status }));
        setShowRejectModal(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/applications/${appId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Aplicación no encontrada</p>
        <Link
          href={`/dashboard/campaigns/${campaignId}/applications`}
          className="btn-primary mt-4 inline-block"
        >
          Volver a aplicaciones
        </Link>
      </div>
    );
  }

  const statusConfig = (STATUS_CONFIG[application.status] || STATUS_CONFIG.APPLIED)!;
  const StatusIcon = statusConfig.icon;
  const nextActions = (NEXT_ACTIONS[application.status] || [])!;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-6">
        <Link
          href={`/dashboard/campaigns/${campaignId}/applications`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a aplicaciones
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {application.creatorProfile.avatarUrl ? (
                  <img
                    src={application.creatorProfile.avatarUrl}
                    alt={application.creatorProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-brand-500" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">
                {application.creatorProfile.displayName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
                {application.creatorProfile.primaryNiche && (
                  <span className="text-sm text-muted-foreground">
                    {application.creatorProfile.primaryNiche}
                  </span>
                )}
                {application.creatorProfile.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {application.creatorProfile.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {nextActions.length > 0 && (
            <div className="flex items-center gap-2">
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                nextActions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => {
                      if (action.status === 'REJECTED') {
                        setShowRejectModal(true);
                      } else {
                        handleStatusChange(action.status);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                  >
                    {action.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pitch */}
          {application.pitch && (
            <div className="bento-card p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                Pitch del Creador
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {application.pitch}
              </p>
            </div>
          )}

          {/* Proposed Rate */}
          {application.proposedRate && (
            <div className="bento-card p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-500" />
                Tarifa Propuesta
              </h2>
              <p className="text-3xl font-bold">
                ${parseInt(application.proposedRate).toLocaleString()}{' '}
                <span className="text-lg text-muted-foreground font-normal">
                  {application.currency}
                </span>
              </p>
            </div>
          )}

          {/* Portfolio Links */}
          {application.portfolioLinks && application.portfolioLinks.length > 0 && (
            <div className="bento-card p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-brand-500" />
                Portfolio / Referencias
              </h2>
              <div className="space-y-2">
                {application.portfolioLinks.map((link: string, i: number) => (
                  <a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-brand-500 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Creator Bio */}
          {application.creatorProfile.bio && (
            <div className="bento-card p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-500" />
                Sobre el Creador
              </h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {application.creatorProfile.bio}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bento-card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Línea de Tiempo
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Aplicó</span>
                <span className="ml-auto text-muted-foreground">
                  {new Date(application.appliedAt).toLocaleDateString('es-MX')}
                </span>
              </div>
              {application.shortlistedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Preseleccionado</span>
                  <span className="ml-auto text-muted-foreground">
                    {new Date(application.shortlistedAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
              {application.hiredAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Contratado</span>
                  <span className="ml-auto text-muted-foreground">
                    {new Date(application.hiredAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
              {application.rejectedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Rechazado</span>
                  <span className="ml-auto text-muted-foreground">
                    {new Date(application.rejectedAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {application.rejectionReason && (
            <div className="bento-card p-6 border-red-500/20">
              <h2 className="font-semibold text-lg mb-3 text-red-500">
                Motivo de Rechazo
              </h2>
              <p className="text-sm text-muted-foreground">
                {application.rejectionReason}
              </p>
            </div>
          )}

          {/* Internal Notes */}
          <div className="bento-card p-6">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-brand-500" />
              Notas Internas
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Solo visible para tu equipo
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas sobre este aplicante..."
              className="w-full min-h-[120px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 w-full btn-secondary text-sm flex items-center justify-center gap-2"
            >
              {savingNotes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Notas
            </button>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Rechazar Aplicación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Proporciona un motivo de rechazo. El creador podrá ver este motivo.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              className="w-full min-h-[100px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleStatusChange('REJECTED', rejectionReason)}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Confirmar Rechazo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
