'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  Search,
  Megaphone,
  FileText,
  MessageSquare,
  CreditCard,
  Settings,
  Users,
  Briefcase,
  Star,
  BarChart3,
  Upload,
} from 'lucide-react';
import { UserRole } from '@markinflu/database';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

const brandNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Descubrir Creadores', href: '/dashboard/discover', icon: Search },
  { name: 'Mis Campañas', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
  { name: 'Mensajes', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Favoritos', href: '/dashboard/favorites', icon: Star },
  { name: 'Pagos', href: '/dashboard/payments', icon: CreditCard },
];

const creatorNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Oportunidades', href: '/dashboard/opportunities', icon: Briefcase },
  { name: 'Mis Aplicaciones', href: '/dashboard/applications', icon: FileText },
  { name: 'Mis Contratos', href: '/dashboard/contracts', icon: FileText },
  { name: 'Entregables', href: '/dashboard/deliverables', icon: Upload },
  { name: 'Mensajes', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Ganancias', href: '/dashboard/earnings', icon: CreditCard },
  { name: 'Mi Perfil', href: '/dashboard/profile', icon: Users },
  { name: 'Estadísticas', href: '/dashboard/analytics', icon: BarChart3 },
];

const adminNavigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Campañas', href: '/admin/campaigns', icon: Megaphone },
  { name: 'Transacciones', href: '/admin/transactions', icon: CreditCard },
  { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = 
    user.role === 'ADMIN' 
      ? adminNavigation 
      : user.role === 'BRAND' 
        ? brandNavigation 
        : creatorNavigation;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">MarkInflu</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-border p-4">
            <Link
              href="/dashboard/settings"
              className={cn(
                'sidebar-item',
                pathname === '/dashboard/settings' && 'sidebar-item-active'
              )}
            >
              <Settings className="h-5 w-5" />
              <span>Configuración</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar - TODO: Add mobile menu toggle */}
    </>
  );
}
