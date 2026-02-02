'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: string;
  platformFee: string;
  netAmount: string;
  currency: string;
  status: string;
  type: string;
  completedAt: string | null;
  initiatedAt: string;
  milestone: { id: string; title: string } | null;
  escrowTransaction: {
    contractId: string;
    contract: {
      contractNumber: string;
      campaign: {
        title: string;
        brandProfile: { companyName: string; logoUrl: string | null };
      };
    };
  };
}

interface ConnectStatus {
  status: string;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  COMPLETED: { label: 'Completado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  PENDING: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  PROCESSING: { label: 'Procesando', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  FAILED: { label: 'Fallido', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
};

export default function EarningsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPayments();
    fetchConnectStatus();
  }, [page]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments/creator/history?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectStatus = async () => {
    try {
      const res = await fetch('/api/payments/connect/status');
      if (res.ok) {
        const data = await res.json();
        setConnectStatus(data);
      }
    } catch {
      // silent
    }
  };

  const handleConnectOnboarding = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch('/api/payments/connect/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/dashboard/earnings` }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        toast.error('Error al crear enlace de configuración');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setConnectLoading(false);
    }
  };

  // Calculate summary stats
  const totalEarned = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.netAmount), 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + parseFloat(p.netAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Ganancias</h1>
        <p className="text-muted-foreground">Historial de pagos y configuración de cuenta</p>
      </div>

      {/* Stripe Connect Banner */}
      {connectStatus && connectStatus.status !== 'ACTIVE' && (
        <div className="bento-card border-2 border-yellow-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
              <Wallet className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Configura tu cuenta de pagos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {connectStatus.status === 'NOT_CONNECTED'
                  ? 'Conecta tu cuenta Stripe para recibir pagos de tus colaboraciones.'
                  : connectStatus.status === 'PENDING'
                    ? 'Tu cuenta está pendiente de verificación. Completa el proceso de onboarding.'
                    : 'Tu cuenta tiene restricciones. Actualiza tu información para recibir pagos.'}
              </p>
              <button
                onClick={handleConnectOnboarding}
                disabled={connectLoading}
                className="btn-primary mt-3 inline-flex items-center gap-2"
              >
                {connectLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {connectStatus.status === 'NOT_CONNECTED' ? 'Conectar Stripe' : 'Completar verificación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Ganado</p>
              <p className="text-xl font-bold">{formatCurrency(totalEarned)}</p>
            </div>
          </div>
        </div>

        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <TrendingUp className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transacciones</p>
              <p className="text-xl font-bold">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Status Badge */}
      {connectStatus && (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Stripe Connect:</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
              connectStatus.status === 'ACTIVE'
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : connectStatus.status === 'PENDING'
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  : 'bg-gray-500/10 text-gray-500 border-gray-500/20',
            )}
          >
            {connectStatus.status === 'ACTIVE'
              ? 'Activa'
              : connectStatus.status === 'PENDING'
                ? 'Pendiente'
                : connectStatus.status === 'RESTRICTED'
                  ? 'Restringida'
                  : 'No conectada'}
          </span>
        </div>
      )}

      {/* Payments List */}
      <div className="bento-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Historial de Pagos</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No tienes pagos registrados aún</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Los pagos aparecerán aquí cuando se liberen hitos de tus contratos
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((payment) => {
              const config = (STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING)!;
              const StatusIcon = config.icon;

              return (
                <div
                  key={payment.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                    <ArrowUpRight className="h-5 w-5 text-brand-500" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {payment.milestone?.title || 'Pago de hito'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {payment.escrowTransaction.contract.campaign.title} —{' '}
                      {payment.escrowTransaction.contract.campaign.brandProfile.companyName}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    className={cn(
                      'hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border',
                      config.color,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-semibold text-green-500">
                      +{formatCurrency(parseFloat(payment.netAmount), payment.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.completedAt || payment.initiatedAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
