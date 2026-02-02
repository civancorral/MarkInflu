'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Megaphone, Search, Calendar, Users, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface CampaignItem {
  id: string;
  title: string;
  status: string;
  budgetMin: string | null;
  budgetMax: string | null;
  currency: string;
  maxCreators: number;
  currentCreators: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  brandProfile: { companyName: string; logoUrl: string | null };
  _count: { applications: number; contracts: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  PUBLISHED: { label: 'Publicada', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-brand-500/10 text-brand-500 border-brand-500/20' },
  PAUSED: { label: 'Pausada', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  COMPLETED: { label: 'Completada', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [page, statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campañas</h1>
        <p className="text-muted-foreground">{total} campañas en la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campañas..."
            className="input pl-9"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicada</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="PAUSED">Pausada</option>
          <option value="COMPLETED">Completada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      {/* List */}
      <div className="bento-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No se encontraron campañas</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => {
              const statusCfg = (STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT)!;
              return (
                <div key={campaign.id} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors">
                  {/* Brand logo */}
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {campaign.brandProfile.logoUrl ? (
                      <Image src={campaign.brandProfile.logoUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                        {campaign.brandProfile.companyName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{campaign.title}</p>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {campaign.brandProfile.companyName}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden items-center gap-6 sm:flex">
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.budgetMax ? formatCurrency(parseFloat(campaign.budgetMax), campaign.currency) : '—'}</p>
                      <p className="text-xs text-muted-foreground">Presupuesto</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign._count.applications}</p>
                      <p className="text-xs text-muted-foreground">Aplicaciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{campaign.currentCreators}/{campaign.maxCreators}</p>
                      <p className="text-xs text-muted-foreground">Creadores</p>
                    </div>
                  </div>

                  {/* Date */}
                  <p className="hidden text-xs text-muted-foreground lg:block">
                    {new Date(campaign.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              );
            })}
          </div>
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
