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
  FileText,
  ExternalLink,
  Download,
  AlertCircle,
  Target,
  TrendingUp,
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

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
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
    description: string;
    brief: any;
    deliverableSpecs: any;
    brand: {
      name: string;
      logo: string | null;
      industry: string[];
      website: string | null;
    };
  };
  milestones: Milestone[];
  deliverables: Deliverable[];
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
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: Clock,
  },
  IN_PROGRESS: {
    label: 'En progreso',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: Target,
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
  },
  PAID: {
    label: 'Pagado',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: DollarSign,
  },
};

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContract();
  }, [params.id]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContract(data);
      } else {
        toast.error('Contrato no encontrado');
        router.push('/dashboard/contracts');
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[contract.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/contracts"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a contratos
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                  {contract.campaign.brand.logo ? (
                    <img
                      src={contract.campaign.brand.logo}
                      alt={contract.campaign.brand.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-brand-500" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{contract.campaign.title}</h1>
                <p className="text-muted-foreground">{contract.campaign.brand.name}</p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Overview */}
            <div className="bento-card p-6">
              <h3 className="font-semibold text-lg mb-4">Detalles del Contrato</h3>
              <div className="grid grid-cols-2 gap-4">
                {contract.totalAmount && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Monto Total</p>
                    <p className="text-xl font-bold text-brand-500">
                      ${parseInt(contract.totalAmount).toLocaleString()} {contract.currency}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fecha de inicio</p>
                  <p className="font-medium">
                    {new Date(contract.startDate).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {contract.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de finalización</p>
                    <p className="font-medium">
                      {new Date(contract.endDate).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {contract.signedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Firmado el</p>
                    <p className="font-medium">
                      {new Date(contract.signedAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Notice */}
            {contract.status === 'CANCELLED' && contract.cancellationReason && (
              <div className="bento-card p-6 border-2 border-red-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Contrato Cancelado
                </h3>
                <p className="text-muted-foreground">{contract.cancellationReason}</p>
              </div>
            )}

            {/* Milestones */}
            {contract.milestones.length > 0 && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-500" />
                  Hitos de Pago
                </h3>
                <div className="space-y-4">
                  {contract.milestones.map((milestone, index) => {
                    const milestoneConfig = MILESTONE_STATUS_CONFIG[milestone.status as keyof typeof MILESTONE_STATUS_CONFIG];
                    const MilestoneIcon = milestoneConfig.icon;

                    return (
                      <div key={milestone.id} className="p-4 rounded-lg border border-border hover:border-brand-500/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center font-bold text-brand-500">
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h4 className="font-semibold mb-1">{milestone.title}</h4>
                                {milestone.description && (
                                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                )}
                              </div>
                              {milestone.amount && (
                                <p className="font-bold text-brand-500 whitespace-nowrap">
                                  ${parseInt(milestone.amount).toLocaleString()}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${milestoneConfig.color}`}>
                                <MilestoneIcon className="w-3.5 h-3.5" />
                                {milestoneConfig.label}
                              </span>

                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                Vence: {new Date(milestone.dueDate).toLocaleDateString('es-MX')}
                              </span>

                              {milestone.paidAt && (
                                <span className="text-green-500 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Pagado: {new Date(milestone.paidAt).toLocaleDateString('es-MX')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Terms */}
            {contract.terms && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Términos y Condiciones
                </h3>
                <div className="prose prose-sm max-w-none">
                  {typeof contract.terms === 'object' ? (
                    <div className="space-y-4">
                      {contract.terms.usage && (
                        <div>
                          <h4 className="font-medium mb-2">Uso del contenido</h4>
                          <p className="text-muted-foreground">{contract.terms.usage}</p>
                        </div>
                      )}
                      {contract.terms.exclusivity && (
                        <div>
                          <h4 className="font-medium mb-2">Exclusividad</h4>
                          <p className="text-muted-foreground">{contract.terms.exclusivity}</p>
                        </div>
                      )}
                      {contract.terms.revisions && (
                        <div>
                          <h4 className="font-medium mb-2">Revisiones</h4>
                          <p className="text-muted-foreground">{contract.terms.revisions}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{contract.terms}</p>
                  )}
                </div>
              </div>
            )}

            {/* Campaign Brief */}
            {contract.campaign.brief && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-4">Brief de la Campaña</h3>
                {contract.campaign.brief.objective && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Objetivo</h4>
                    <p className="text-muted-foreground">{contract.campaign.brief.objective}</p>
                  </div>
                )}
                {contract.campaign.brief.keyMessages?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Mensajes Clave</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {contract.campaign.brief.keyMessages.map((message: string, i: number) => (
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
            {/* Quick Actions */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/deliverables?contract=${contract.id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Ver Entregables
                </Link>

                <Link
                  href={`/dashboard/opportunities/${contract.campaign.id}`}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver Campaña
                </Link>
              </div>
            </div>

            {/* Brand Info */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Sobre la Marca</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Marca</p>
                  <p className="font-medium">{contract.campaign.brand.name}</p>
                </div>

                {contract.campaign.brand.industry.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Industria</p>
                    <div className="flex flex-wrap gap-2">
                      {contract.campaign.brand.industry.map((ind: string) => (
                        <span key={ind} className="px-2 py-1 rounded-md bg-secondary text-sm">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {contract.campaign.brand.website && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sitio web</p>
                    <a
                      href={contract.campaign.brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1"
                    >
                      Visitar sitio
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Deliverables Summary */}
            {contract.deliverables.length > 0 && (
              <div className="bento-card p-6">
                <h3 className="font-semibold mb-4">Entregables ({contract.deliverables.length})</h3>
                <div className="space-y-2">
                  {contract.deliverables.slice(0, 3).map((deliverable) => (
                    <Link
                      key={deliverable.id}
                      href={`/dashboard/deliverables/${deliverable.id}`}
                      className="block p-3 rounded-lg border border-border hover:border-brand-500/30 transition-all"
                    >
                      <p className="font-medium text-sm truncate">{deliverable.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{deliverable.type}</p>
                    </Link>
                  ))}
                  {contract.deliverables.length > 3 && (
                    <Link
                      href={`/dashboard/deliverables?contract=${contract.id}`}
                      className="block text-center text-sm text-brand-500 hover:text-brand-600 transition-colors py-2"
                    >
                      Ver todos ({contract.deliverables.length})
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
