import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta de MarkInflu',
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-500/20 blur-[100px]" />
      <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-brand-600/20 blur-[100px]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold">MarkInflu</span>
        </Link>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bento-card">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">Bienvenido de vuelta</h1>
              <p className="mt-2 text-muted-foreground">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <LoginForm />

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline"
              >
                Regístrate gratis
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Al continuar, aceptas nuestros{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
