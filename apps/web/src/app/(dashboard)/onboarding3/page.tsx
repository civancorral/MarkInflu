import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@markinflu/database';
import { CreatorOnboarding } from './creator-onboarding';
import { BrandOnboarding } from './brand-onboarding';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const { role, id: userId } = session.user;

  // Check if profile already exists
  if (role === 'CREATOR') {
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      redirect('/dashboard');
    }
    return <CreatorOnboarding userId={userId} />;
  }

  if (role === 'BRAND') {
    const existingProfile = await prisma.brandProfile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      redirect('/dashboard');
    }
    return <BrandOnboarding userId={userId} />;
  }

  // Admin doesn't need onboarding
  if (role === 'ADMIN') {
    redirect('/admin');
  }

  return null;
}
