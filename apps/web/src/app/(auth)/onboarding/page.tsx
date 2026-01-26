'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { CreatorOnboarding } from './creator-onboarding';
import { BrandOnboarding } from './brand-onboarding';

export default function OnboardingPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!session?.user) {
    redirect('/login');
  }

  // If user already has a profile, redirect to dashboard
  if (session.user.creatorProfileId || session.user.brandProfileId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-50" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 container max-w-4xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-display mb-4">
            ¡Bienvenido a <span className="gradient-text">MarkInflu</span>!
          </h1>
          <p className="text-muted-foreground text-lg">
            Completa tu perfil para comenzar a conectar con{' '}
            {session.user.role === 'CREATOR' ? 'marcas increíbles' : 'creadores talentosos'}
          </p>
        </div>

        {/* Onboarding Form */}
        {session.user.role === 'CREATOR' ? (
          <CreatorOnboarding />
        ) : session.user.role === 'BRAND' ? (
          <BrandOnboarding />
        ) : (
          <div className="text-center text-muted-foreground">
            Rol no soportado para onboarding
          </div>
        )}
      </div>
    </div>
  );
}
