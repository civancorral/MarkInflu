import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Megaphone } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { CampaignCard } from './campaign-card';

export const metadata: Metadata = {
  title: 'Mis Campañas',
  description: 'Gestiona tus campañas de influencer marketing',
};

async function getCampaigns(brandProfileId: string) {
  return prisma.campaign.findMany({
    where: { brandProfileId },
    include: {
      _count: {
        select: {
          applications: true,
          contracts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'BRAND') {
    redirect('/dashboard');
  }

  if (!session.user.brandProfileId) {
    redirect('/onboarding');
  }

  const campaigns = await getCampaigns(session.user.brandProfileId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Mis Campañas</h1>
          <p className="page-description">
            Crea y gestiona tus campañas de influencer marketing.
          </p>
        </div>
        <Link href="/dashboard/campaigns/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </Link>
      </div>

      {/* Campaigns List */}
      {campaigns.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              applicationsCount={campaign._count.applications}
              contractsCount={campaign._count.contracts}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No tienes campañas</h3>
          <p className="mt-2 text-center text-muted-foreground">
            Crea tu primera campaña para comenzar a conectar con creadores.
          </p>
          <Link href="/dashboard/campaigns/new" className="btn-primary mt-6">
            Crear Primera Campaña
          </Link>
        </div>
      )}
    </div>
  );
}
