import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Zap, Users, Video, CreditCard } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
      <div className="absolute inset-0 bg-grid-pattern" />
      
      {/* Gradient Orbs */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-brand-500/20 blur-[100px]" />
      <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-brand-600/20 blur-[100px]" />
      <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-brand-400/20 blur-[100px]" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">MarkInflu</span>
          </div>
          
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/creators" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Descubre Creadores
            </Link>
            <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Campañas
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm"
            >
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-400">
            <Sparkles className="h-4 w-4" />
            <span>La plataforma #1 de Influencer Marketing</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Conecta con{' '}
            <span className="gradient-text">Creadores</span>
            <br />
            que impulsan resultados
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Gestiona todo el ciclo de tus campañas de influencer marketing: 
            desde el descubrimiento hasta el pago. Todo en un solo lugar.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register?role=brand"
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              Soy una Marca
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=creator"
              className="btn-secondary inline-flex items-center gap-2 text-base"
            >
              Soy Creador de Contenido
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: '10K+', label: 'Creadores Activos' },
              { value: '500+', label: 'Marcas Confiando' },
              { value: '$2M+', label: 'Pagos Procesados' },
              { value: '98%', label: 'Satisfacción' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesitas para{' '}
            <span className="gradient-text">escalar</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Herramientas profesionales para gestionar campañas de principio a fin.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 - Large */}
          <div className="bento-card bento-card-glow lg:col-span-2 lg:row-span-2">
            <div className="flex h-full flex-col">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                <Users className="h-6 w-6 text-brand-500" />
              </div>
              <h3 className="text-xl font-semibold">Descubrimiento Inteligente</h3>
              <p className="mt-2 text-muted-foreground">
                Encuentra creadores perfectos para tu marca con filtros avanzados: 
                demografía, engagement, nicho, y más. Nuestro algoritmo de matching 
                te sugiere los mejores perfiles para tu campaña.
              </p>
              <div className="mt-6 flex-1 rounded-xl bg-gradient-to-br from-brand-500/5 to-brand-600/5 p-4">
                {/* Placeholder for discovery UI preview */}
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-muted/50 animate-pulse"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bento-card bento-card-glow">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Shield className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Pagos en Escrow</h3>
            <p className="mt-2 text-muted-foreground">
              Fondos seguros hasta que se aprueben los entregables. 
              Liberación automática por hitos.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bento-card bento-card-glow">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Video className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold">Revisión Visual</h3>
            <p className="mt-2 text-muted-foreground">
              Comenta directamente sobre el video con timestamps y 
              coordenadas. Feedback preciso, cero confusiones.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bento-card bento-card-glow">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold">Workflow Automatizado</h3>
            <p className="mt-2 text-muted-foreground">
              Contratos digitales, notificaciones en tiempo real, 
              y seguimiento automático de deadlines.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bento-card bento-card-glow lg:col-span-2">
            <div className="flex items-start gap-6">
              <div className="mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Pagos Globales</h3>
                <p className="mt-2 text-muted-foreground">
                  Integración con Stripe Connect para pagos instantáneos a creadores 
                  en cualquier parte del mundo. Split payments automáticos y reportes 
                  fiscales incluidos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 sm:p-16">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          <div className="relative text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ¿Listo para transformar tu marketing?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Únete a cientos de marcas y miles de creadores que ya están 
              creciendo juntos en MarkInflu.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-brand-600 transition-all hover:bg-white/90 hover:shadow-lg"
              >
                Crear Cuenta Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3 font-semibold text-white transition-all hover:bg-white/10"
              >
                Ver Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">MarkInflu</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Términos
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contacto
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 MarkInflu. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
