'use client';

import { useState } from 'react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { UserRole } from '@markinflu/database';

interface DashboardShellProps {
  user: { id: string; email: string; role: UserRole };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardSidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-64">
        <DashboardHeader user={user} onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
