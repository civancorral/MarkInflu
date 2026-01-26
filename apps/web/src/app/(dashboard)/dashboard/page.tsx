import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { CreatorDashboard } from '@/components/dashboard/creator-dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Redirect to onboarding if profile not created
  if (session.user.role === 'BRAND' && !session.user.brandProfileId) {
    redirect('/onboarding');
  }
  if (session.user.role === 'CREATOR' && !session.user.creatorProfileId) {
    redirect('/onboarding');
  }

  return (
    <div className="space-y-8">
      {session.user.role === 'BRAND' && <BrandDashboard />}
      {session.user.role === 'CREATOR' && <CreatorDashboard />}
      {session.user.role === 'ADMIN' && (
        <div className="page-header">
          <h1 className="page-title">Panel de Administración</h1>
          <p className="page-description">Gestiona la plataforma</p>
        </div>
      )}
    </div>
  );
}
