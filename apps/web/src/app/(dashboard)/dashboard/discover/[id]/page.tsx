import { notFound } from 'next/navigation';
import { prisma } from '@markinflu/database';
import { Metadata } from 'next';
import { CreatorProfileView } from '@/app/creators/[id]/profile-view';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await prisma.creatorProfile.findUnique({
    where: { id },
    select: { displayName: true, tagline: true, primaryNiche: true },
  });

  if (!profile) {
    return { title: 'Creador no encontrado | MarkInflu' };
  }

  return {
    title: `${profile.displayName} | MarkInflu`,
    description: profile.tagline || `Perfil de ${profile.displayName} en MarkInflu`,
  };
}

export default async function DashboardCreatorProfilePage({ params }: Props) {
  const { id } = await params;

  const profile = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      socialAccounts: {
        select: {
          id: true,
          platform: true,
          username: true,
          profileUrl: true,
          followers: true,
          engagementRate: true,
          isVerified: true,
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const totalFollowers = profile.socialAccounts.reduce(
    (sum, acc) => sum + (acc.followers || 0),
    0
  );
  const avgEngagement =
    profile.socialAccounts.length > 0
      ? profile.socialAccounts.reduce(
          (sum, acc) => sum + (Number(acc.engagementRate) || 0),
          0
        ) / profile.socialAccounts.length
      : 0;

  const enrichedProfile = {
    ...profile,
    minimumBudget: profile.minimumBudget ? Number(profile.minimumBudget) : 0,
    socialAccounts: profile.socialAccounts.map((acc) => ({
      ...acc,
      engagementRate: Number(acc.engagementRate) || 0,
    })),
    totalFollowers,
    avgEngagementRate: Math.round(avgEngagement * 100) / 100,
    avgRating: 0,
    completedProjects: 0,
    reviews: [],
  };

  return <CreatorProfileView profile={enrichedProfile} />;
}
