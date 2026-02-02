import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@markinflu/database';
import { ApplicationsList } from './applications-list';

export const metadata: Metadata = {
  title: 'Aplicaciones de Campaña',
  description: 'Gestiona los aplicantes de tu campaña',
};

async function getCampaignWithApplications(campaignId: string, brandProfileId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, brandProfileId },
    include: {
      applications: {
        include: {
          creatorProfile: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
              primaryNiche: true,
              secondaryNiches: true,
              location: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  return campaign;
}

export default async function CampaignApplicationsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'BRAND') {
    redirect('/dashboard');
  }

  if (!session.user.brandProfileId) {
    redirect('/onboarding');
  }

  const campaign = await getCampaignWithApplications(
    params.id,
    session.user.brandProfileId,
  );

  if (!campaign) {
    redirect('/dashboard/campaigns');
  }

  const applications = campaign.applications.map((app) => ({
    id: app.id,
    status: app.status,
    proposedRate: app.proposedRate?.toString() || null,
    currency: app.currency,
    pitch: app.pitch,
    portfolioLinks: app.portfolioLinks,
    appliedAt: app.appliedAt.toISOString(),
    shortlistedAt: app.shortlistedAt?.toISOString() || null,
    rejectedAt: app.rejectedAt?.toISOString() || null,
    hiredAt: app.hiredAt?.toISOString() || null,
    internalNotes: app.internalNotes,
    rejectionReason: app.rejectionReason,
    creatorProfile: app.creatorProfile,
  }));

  return (
    <ApplicationsList
      campaignId={campaign.id}
      campaignTitle={campaign.title}
      maxCreators={campaign.maxCreators}
      currentCreators={campaign.currentCreators}
      applications={applications}
    />
  );
}
