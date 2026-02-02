'use client';

import Link from 'next/link';
import {
  Calendar,
  Users,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  FileText,
} from 'lucide-react';
import { Campaign, CampaignStatus } from '@markinflu/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CampaignCardProps {
  campaign: Campaign;
  applicationsCount: number;
  contractsCount: number;
}

const statusConfig: Record<CampaignStatus, { label: string; class: string }> = {
  DRAFT: { label: 'Borrador', class: 'bg-muted text-muted-foreground' },
  PUBLISHED: { label: 'Publicada', class: 'bg-green-500/10 text-green-500' },
  IN_PROGRESS: { label: 'En progreso', class: 'bg-purple-500/10 text-purple-500' },
  PAUSED: { label: 'Pausada', class: 'bg-yellow-500/10 text-yellow-500' },
  COMPLETED: { label: 'Completada', class: 'bg-blue-500/10 text-blue-500' },
  CANCELLED: { label: 'Cancelada', class: 'bg-red-500/10 text-red-500' },
};

export function CampaignCard({
  campaign,
  applicationsCount,
  contractsCount,
}: CampaignCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const status = statusConfig[campaign.status];

  const handleDuplicate = async () => {
    setShowMenu(false);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        toast.success('Campaña duplicada');
        router.refresh();
      } else {
        toast.error('Error al duplicar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Campaña eliminada');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="bento-card group relative">
      {/* Menu Button */}
      <div className="absolute right-4 top-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
              <Link
                href={`/dashboard/campaigns/${campaign.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setShowMenu(false)}
              >
                <Eye className="h-4 w-4" />
                Ver Detalles
              </Link>
              <Link
                href={`/dashboard/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setShowMenu(false)}
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </button>
              <div className="my-1 border-t border-border" />
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Status Badge */}
      <span className={`badge ${status.class} mb-3 inline-flex`}>
        {status.label}
      </span>

      {/* Title */}
      <Link href={`/dashboard/campaigns/${campaign.id}`}>
        <h3 className="mb-2 line-clamp-2 font-semibold transition-colors group-hover:text-primary">
          {campaign.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
        {campaign.description}
      </p>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3">
        <div className="text-center">
          <p className="text-lg font-semibold">{applicationsCount}</p>
          <p className="text-xs text-muted-foreground">Aplicaciones</p>
        </div>
        <div className="text-center border-x border-border">
          <p className="text-lg font-semibold">{contractsCount}</p>
          <p className="text-xs text-muted-foreground">Contratados</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">{campaign.maxCreators - campaign.currentCreators}</p>
          <p className="text-xs text-muted-foreground">Disponibles</p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {campaign.budgetMax && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>
              {formatCurrency(Number(campaign.budgetMin) || 0)} - {formatCurrency(Number(campaign.budgetMax))}
            </span>
          </div>
        )}
        {campaign.applicationDeadline && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Cierra {formatDate(campaign.applicationDeadline)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        <Link
          href={`/dashboard/campaigns/${campaign.id}/applications`}
          className="btn-secondary flex-1 justify-center text-sm"
        >
          <Users className="mr-2 h-4 w-4" />
          Aplicaciones ({applicationsCount})
        </Link>
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="btn-ghost px-3"
        >
          <FileText className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
