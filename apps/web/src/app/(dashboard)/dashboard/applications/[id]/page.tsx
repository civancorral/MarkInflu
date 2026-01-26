'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  status: string;
  proposedRate: string | null;
  currency: string;
  pitch: string | null;
  portfolioLinks: string[];
  proposal: any;
  appliedAt: string;
  shortlistedAt: string | null;
  rejectedAt: string | null;
  hiredAt: string | null;
  rejectionReason: string | null;
  campaign: {
    id: string;
    title: string;
    description: string;
    brief: any;
    requirements: any;
    deliverableSpecs: any;
    budgetMin: string | null;
    budgetMax: string | null;
    currency: string;
    brand: {
      name: string;
      logo: string | null;
      industry: string[];
      website: string | null;
    };
  };
}

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Aplicado',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: FileText,
    description: 'Tu aplicación ha sido enviada y está esperando revisión',
  },
  UNDER_REVIEW: {
    label: 'En revisión',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: Eye,
    description: 'La marca está revisando tu propuesta',
  },
  SHORTLISTED: {
    label: 'Preseleccionado',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: TrendingUp,
    description: '¡Felicidades! Has sido preseleccionado para esta campaña',
  },
  HIRED: {
    label: 'Contratado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
    description: '¡Excelente! Has sido contratado para esta campaña',
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: XCircle,
    description: 'Esta vez no fuiste seleccionado',
  },
  WITHDRAWN: {
    label: 'Retirado',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: AlertCircle,
    description: 'Retiraste tu aplicación',
  },
};

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [params.id]);

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
      } else {
        toast.error('Aplicación no encontrada');
        router.push('/dashboard/applications');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Error al cargar la aplicación');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm('¿Estás seguro de que deseas retirar esta aplicación?')) {
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch(`/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'withdraw' }),
      });

      if (response.ok) {
        toast.success('Aplicación retirada exitosamente');
        fetchApplication(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al retirar aplicación');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast.error('Error al retirar aplicación');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;
  const canWithdraw = ['APPLIED', 'UNDER_REVIEW'].includes(application.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/applications"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mis aplicaciones
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex gap-4">
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
              <div>
                <h1 className="text-2xl font-bold mb-1">{application.campaign.title}</h1>
                <p className="text-muted-foreground">{application.campaign.brand.name}</p>
              </div>
            </div>

            {canWithdraw && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="btn-secondary flex items-center gap-2"
              >
                {withdrawing ? 'Retirando...' : 'Retirar Aplicación'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className={`bento-card p-6 border-2 ${statusConfig.color}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-current/10">
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{statusConfig.label}</h3>
                  <p className="text-sm opacity-90">{statusConfig.description}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-6 pt-6 border-t border-current/20">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-sm">Aplicación enviada</p>
                      <p className="text-xs opacity-75">
                        {new Date(application.appliedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {application.shortlistedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Preseleccionado</p>
                        <p className="text-xs opacity-75">
                          {new Date(application.shortlistedAt).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.hiredAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Contratado</p>
                        <p className="text-xs opacity-75">
                          {new Date(application.hiredAt).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.rejectedAt && (
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">Rechazado</p>
                        <p className="text-xs opacity-75">
                          {new Date(application.rejectedAt).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {application.status === 'REJECTED' && application.rejectionReason && (
              <div className="bento-card p-6 border-2 border-red-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Motivo del rechazo
                </h3>
                <p className="text-muted-foreground">{application.rejectionReason}</p>
              </div>
            )}

            {/* Your Pitch */}
            {application.pitch && (
              <div className="bento-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Tu Propuesta
                </h3>
                <p className="text-muted-foreground whitespace-pre-line">{application.pitch}</p>
              </div>
            )}

            {/* Portfolio Links */}
            {application.portfolioLinks.length > 0 && (
              <div className="bento-card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-brand-500" />
                  Links a tu Trabajo
                </h3>
                <div className="space-y-2">
                  {application.portfolioLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-brand-500 hover:text-brand-600 transition-colors group"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="group-hover:underline truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Brief */}
            {application.campaign.brief && (
              <div className="bento-card p-6">
                <h3 className="font-semibold mb-4">Brief de la Campaña</h3>

                {application.campaign.brief.objective && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Objetivo</h4>
                    <p className="text-muted-foreground">{application.campaign.brief.objective}</p>
                  </div>
                )}

                {application.campaign.brief.keyMessages?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Mensajes Clave</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {application.campaign.brief.keyMessages.map((message: string, i: number) => (
                        <li key={i} className="text-muted-foreground">{message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Info */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Información de Aplicación</h3>
              <div className="space-y-3">
                {application.proposedRate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tu tarifa propuesta</p>
                    <p className="font-semibold text-lg">
                      ${parseInt(application.proposedRate).toLocaleString()} {application.currency}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de aplicación</p>
                  <p className="font-medium">
                    {new Date(application.appliedAt).toLocaleDateString('es-MX')}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Info */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Sobre la Campaña</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Presupuesto</p>
                  <p className="font-medium">
                    {application.campaign.budgetMin && application.campaign.budgetMax
                      ? `$${parseInt(application.campaign.budgetMin).toLocaleString()} - $${parseInt(application.campaign.budgetMax).toLocaleString()}`
                      : 'A negociar'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Marca</p>
                  <p className="font-medium">{application.campaign.brand.name}</p>
                </div>

                {application.campaign.brand.industry.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Industria</p>
                    <div className="flex flex-wrap gap-2">
                      {application.campaign.brand.industry.map((ind: string) => (
                        <span
                          key={ind}
                          className="px-2 py-1 rounded-md bg-secondary text-sm"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`/dashboard/opportunities/${application.campaign.id}`}
                className="mt-4 btn-secondary w-full flex items-center justify-center gap-2"
              >
                Ver campaña completa
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
