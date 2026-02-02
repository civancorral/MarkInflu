'use client';

import { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, Shield, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface Transaction {
  id: string;
  totalAmount: string;
  releasedAmount: string;
  platformFee: string;
  currency: string;
  status: string;
  createdAt: string;
  contract: {
    contractNumber: string;
    campaign: {
      title: string;
      brandProfile: { companyName: string };
    };
    application: {
      creatorProfile: { displayName: string };
    };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_DEPOSIT: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  FUNDED: { label: 'Fondeado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  PARTIALLY_RELEASED: { label: 'Parcial', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  FULLY_RELEASED: { label: 'Completado', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  REFUNDED: { label: 'Reembolsado', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  DISPUTED: { label: 'En disputa', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // Summary stats from current page
  const totalVolume = transactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
  const totalFees = transactions.reduce((sum, t) => sum + parseFloat(t.platformFee), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <p className="text-muted-foreground">{total} transacciones de escrow</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bento-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <CreditCard className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volumen (esta página)</p>
              <p className="text-xl font-bold">{formatCurrency(totalVolume)}</p>
            </div>
          </div>
        </div>
        <div className="bento-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Shield className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comisiones (esta página)</p>
              <p className="text-xl font-bold">{formatCurrency(totalFees)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING_DEPOSIT">Pendiente</option>
          <option value="FUNDED">Fondeado</option>
          <option value="PARTIALLY_RELEASED">Parcialmente liberado</option>
          <option value="FULLY_RELEASED">Completado</option>
          <option value="REFUNDED">Reembolsado</option>
          <option value="DISPUTED">En disputa</option>
        </select>
      </div>

      {/* Table */}
      <div className="bento-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No se encontraron transacciones</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden border-b border-border bg-muted/30 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <span className="col-span-3 text-xs font-medium text-muted-foreground uppercase">Campaña</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Partes</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Monto</span>
              <span className="col-span-1 text-xs font-medium text-muted-foreground uppercase">Fee</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Estado</span>
              <span className="col-span-2 text-xs font-medium text-muted-foreground uppercase">Fecha</span>
            </div>

            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const statusCfg = (STATUS_CONFIG[tx.status] || STATUS_CONFIG.PENDING_DEPOSIT)!;
                const releasedPct = parseFloat(tx.totalAmount) > 0
                  ? (parseFloat(tx.releasedAmount) / parseFloat(tx.totalAmount)) * 100
                  : 0;

                return (
                  <div key={tx.id} className="items-center px-6 py-3 hover:bg-accent/30 transition-colors sm:grid sm:grid-cols-12 sm:gap-4">
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.contract.campaign.title}</p>
                      <p className="text-xs text-muted-foreground">{tx.contract.contractNumber}</p>
                    </div>
                    <div className="col-span-2 min-w-0 mt-1 sm:mt-0">
                      <p className="text-xs truncate">{tx.contract.campaign.brandProfile.companyName}</p>
                      <p className="text-xs text-muted-foreground truncate">{tx.contract.application.creatorProfile.displayName}</p>
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-sm font-medium">{formatCurrency(parseFloat(tx.totalAmount), tx.currency)}</p>
                      <div className="mt-1 h-1 w-full rounded-full bg-muted">
                        <div className="h-1 rounded-full bg-green-500" style={{ width: `${Math.min(releasedPct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="col-span-1 mt-1 sm:mt-0">
                      <p className="text-sm text-muted-foreground">{formatCurrency(parseFloat(tx.platformFee), tx.currency)}</p>
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="col-span-2 mt-1 sm:mt-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-border px-6 py-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">Anterior</button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
