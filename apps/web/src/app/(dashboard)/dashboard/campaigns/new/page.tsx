import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { CampaignForm } from './campaign-form';

export const metadata: Metadata = {
  title: 'Nueva Campaña',
  description: 'Crea una nueva campaña de influencer marketing',
};

export default async function NewCampaignPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'BRAND') {
    redirect('/dashboard');
  }

  if (!session.user.brandProfileId) {
    redirect('/onboarding');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Crear Nueva Campaña</h1>
        <p className="page-description">
          Define los detalles de tu campaña para atraer a los mejores creadores.
        </p>
      </div>

      {/* Form */}
      <CampaignForm brandProfileId={session.user.brandProfileId} />
    </div>
  );
}
