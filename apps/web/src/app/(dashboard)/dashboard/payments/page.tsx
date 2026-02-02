'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowDownRight,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EscrowPayment {
  id: string;
  amount: string;
  netAmount: string;
  status: string;
  completedAt: string | null;
  milestone: { id: string; title: string } | null;
}

interface Escrow {
  id: string;
  totalAmount: string;
  releasedAmount: string;
  platformFee: string;
  currency: string;
  status: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  contract: {
    id: string;
    contractNumber: string;
    status: string;
    campaign: { title: string };
    application: { creatorProfile: { displayName: string; avatarUrl: string | null } };
  };
  payments: EscrowPayment[];
}

const ESCROW_STATUS: Record<string, { label: string; color: string }> = {
  PENDING_DEPOSIT: { label: 'Pendiente de depósito', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  FUNDED: { label: 'Fondos retenidos', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  PARTIALLY_RELEASED: { label: 'Parcialmente liberado', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  FULLY_RELEASED: { label: 'Completamente liberado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  REFUNDED: { label: 'Reembolsado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  DISPUTED: { label: 'En disputa', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
};

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEscrows();
  }, [page]);

  const fetchEscrows = async () => {
    try {
      const res = await fetch(`/api/payments/brand/escrows?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setEscrows(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const totalDeposited = escrows.reduce((sum, e) => sum + parseFloat(e.totalAmount), 0);
  const totalReleased = escrows.reduce((sum, e) => sum + parseFloat(e.releasedAmount), 0);
  const totalInEscrow = escrows
    .filter((e) => e.status === 'FUNDED' || e.status === 'PARTIALLY_RELEASED')
    .reduce((sum, e) => sum + parseFloat(e.totalAmount) - parseFloat(e.releasedAmount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">Gestión de escrows y pagos a creadores</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <DollarSign className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Depositado</p>
              <p className="text-xl font-bold">{formatCurrency(totalDeposited)}</p>
            </div>
          </div>
        </div>

        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En Escrow</p>
              <p className="text-xl font-bold">{formatCurrency(totalInEscrow)}</p>
            </div>
          </div>
        </div>

        <div className="bento-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Liberado</p>
              <p className="text-xl font-bold">{formatCurrency(totalReleased)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escrows List */}
      <div className="bento-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold">Escrows por Contrato</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : escrows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No tienes escrows registrados</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Los escrows se crean al firmar contratos con creadores
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {escrows.map((escrow) => {
              const statusConfig = (ESCROW_STATUS[escrow.status] || ESCROW_STATUS.PENDING_DEPOSIT)!;
              const releasedPct = parseFloat(escrow.totalAmount) > 0
                ? (parseFloat(escrow.releasedAmount) / parseFloat(escrow.totalAmount)) * 100
                : 0;

              return (
                <div key={escrow.id} className="px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10">
                      <ArrowDownRight className="h-5 w-5 text-brand-500" />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {escrow.contract.campaign.title}
                        </p>
                        <span
                          className={cn(
                            'hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                            statusConfig.color,
                          )}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {escrow.contract.contractNumber} — {escrow.contract.application.creatorProfile.displayName}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-green-500 transition-all"
                            style={{ width: `${Math.min(releasedPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatCurrency(parseFloat(escrow.releasedAmount))} / {formatCurrency(parseFloat(escrow.totalAmount))}
                        </span>
                      </div>

                      {/* Payments */}
                      {escrow.payments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {escrow.payments.slice(0, 3).map((payment) => (
                            <div key={payment.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {payment.status === 'COMPLETED' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                              ) : payment.status === 'FAILED' ? (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="truncate">{payment.milestone?.title || 'Pago'}</span>
                              <span className="ml-auto font-medium">
                                {formatCurrency(parseFloat(payment.netAmount))}
                              </span>
                            </div>
                          ))}
                          {escrow.payments.length > 3 && (
                            <p className="text-xs text-muted-foreground/70">
                              +{escrow.payments.length - 3} más
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <Link
                      href={`/dashboard/contracts/${escrow.contract.id}`}
                      className="flex items-center gap-1 text-xs text-brand-500 hover:underline whitespace-nowrap"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Ver contrato
                      <ChevronRight className="h-3 w-3" />
                    </Link>
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
