'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import {
  Settings,
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Account */}
      <div className="bento-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Cuenta</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Correo electrónico</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Rol</p>
              <p className="text-sm text-muted-foreground">
                {session?.user?.role === 'BRAND'
                  ? 'Marca'
                  : session?.user?.role === 'CREATOR'
                    ? 'Creador'
                    : 'Administrador'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Contraseña</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
            <button
              onClick={() => toast.info('Funcionalidad próximamente')}
              className="text-sm text-brand-500 hover:underline"
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bento-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Notificaciones</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Notificaciones push</p>
              <p className="text-sm text-muted-foreground">Recibe alertas en tiempo real</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                notificationsEnabled ? 'bg-brand-500' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  notificationsEnabled ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </button>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Notificaciones por correo</p>
              <p className="text-sm text-muted-foreground">Resúmenes y alertas importantes</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                emailNotifications ? 'bg-brand-500' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  emailNotifications ? 'left-[22px]' : 'left-0.5',
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bento-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Seguridad</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Autenticación de dos factores</p>
              <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
            </div>
            <button
              onClick={() => toast.info('Funcionalidad próximamente')}
              className="text-sm text-brand-500 hover:underline"
            >
              Configurar
            </button>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium">Sesiones activas</p>
              <p className="text-sm text-muted-foreground">Gestiona tus dispositivos conectados</p>
            </div>
            <button
              onClick={() => toast.info('Funcionalidad próximamente')}
              className="text-sm text-brand-500 hover:underline"
            >
              Ver
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bento-card border-red-500/20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-500">Cerrar sesión</p>
              <p className="text-sm text-muted-foreground">Salir de tu cuenta en este dispositivo</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
