import { notFound } from 'next/navigation';
import { prisma } from '@markinflu/database';
import { Metadata } from 'next';
import { CreatorProfileView } from './profile-view';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: params.id },
    select: {
      displayName: true,
      tagline: true,
      avatarUrl: true,
      primaryNiche: true,
    },
  });

  if (!profile) {
    return {
      title: 'Creador no encontrado | MarkInflu',
    };
  }

  return {
    title: `${profile.displayName} | MarkInflu`,
    description: profile.tagline || `Perfil de ${profile.displayName} en MarkInflu`,
    openGraph: {
      title: profile.displayName,
      description: profile.tagline || `Creador de contenido de ${profile.primaryNiche}`,
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function CreatorProfilePage({ params }: Props) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { id: params.id },
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

  // Calculate stats
  const totalFollowers = profile.socialAccounts.reduce(
    (sum, acc) => sum + (acc.followers || 0),
    0
  );
  const avgEngagement =
    profile.socialAccounts.length > 0
      ? profile.socialAccounts.reduce(
          (sum, acc) => sum + (acc.engagementRate || 0),
          0
        ) / profile.socialAccounts.length
      : 0;

  const enrichedProfile = {
    ...profile,
    totalFollowers,
    avgEngagementRate: Math.round(avgEngagement * 100) / 100,
    avgRating: 0,
    completedProjects: 0,
    reviews: [],
  };

  return <CreatorProfileView profile={enrichedProfile} />;
}
