import Link from 'next/link';
import {
  Sparkles,
  Check,
  X,
  ArrowRight,
  Zap,
  Shield,
  Users,
  MessageCircle,
  Video,
  CreditCard,
  BarChart3,
  Headphones,
} from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    description: 'Para marcas que están comenzando con influencer marketing',
    price: 0,
    priceLabel: 'Gratis',
    period: 'para siempre',
    cta: 'Comenzar Gratis',
    ctaLink: '/register?role=brand&plan=starter',
    highlighted: false,
    features: [
      { text: 'Hasta 3 campañas activas', included: true },
      { text: 'Descubrimiento básico de creadores', included: true },
      { text: 'Mensajería ilimitada', included: true },
      { text: 'Contratos digitales básicos', included: true },
      { text: 'Soporte por email', included: true },
      { text: 'Revisión visual de contenido', included: false },
      { text: 'Analytics avanzados', included: false },
      { text: 'API access', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'Para marcas que buscan escalar sus campañas',
    price: 99,
    priceLabel: '$99',
    period: 'por mes',
    cta: 'Iniciar Prueba Gratis',
    ctaLink: '/register?role=brand&plan=pro',
    highlighted: true,
    badge: 'Más Popular',
    features: [
      { text: 'Campañas ilimitadas', included: true },
      { text: 'Descubrimiento avanzado con filtros', included: true },
      { text: 'Mensajería ilimitada', included: true },
      { text: 'Contratos digitales personalizables', included: true },
      { text: 'Soporte por email y chat', included: true },
      { text: 'Revisión visual de contenido', included: true },
      { text: 'Analytics avanzados', included: true },
      { text: 'API access', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
  },
  {
    name: 'Enterprise',
    description: 'Para agencias y grandes marcas con necesidades específicas',
    price: null,
    priceLabel: 'Custom',
    period: 'contactar ventas',
    cta: 'Contactar Ventas',
    ctaLink: '/contact?plan=enterprise',
    highlighted: false,
    features: [
      { text: 'Todo en Pro', included: true },
      { text: 'Usuarios y equipos ilimitados', included: true },
      { text: 'Branding personalizado', included: true },
      { text: 'Contratos con firma legal', included: true },
      { text: 'Soporte dedicado 24/7', included: true },
      { text: 'Integraciones personalizadas', included: true },
      { text: 'Analytics y reportes custom', included: true },
      { text: 'API access completo', included: true },
      { text: 'Onboarding personalizado', included: true },
    ],
  },
];

const CREATOR_BENEFITS = [
  {
    icon: Users,
    title: 'Perfil Profesional',
    description: 'Crea un portfolio que destaque tu trabajo y atraiga marcas',
  },
  {
    icon: Shield,
    title: 'Pagos Seguros',
    description: 'Fondos en escrow garantizan que siempre recibas tu pago',
  },
  {
    icon: MessageCircle,
    title: 'Comunicación Directa',
    description: 'Chat integrado con marcas sin intermediarios',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Métricas de tu perfil y rendimiento de colaboraciones',
  },
];

const FAQS = [
  {
    question: '¿Cuánto cobra MarkInflu por transacción?',
    answer: 'MarkInflu cobra una comisión del 10% sobre el valor de cada contrato. Esta comisión cubre el procesamiento de pagos, escrow, y todos los servicios de la plataforma.',
  },
  {
    question: '¿Los creadores pagan algo?',
    answer: 'No, MarkInflu es completamente gratis para creadores. Pueden crear su perfil, aplicar a campañas y recibir pagos sin ningún costo. Solo cobramos comisión a las marcas.',
  },
  {
    question: '¿Puedo cancelar mi suscripción en cualquier momento?',
    answer: 'Sí, puedes cancelar tu suscripción cuando quieras. Si cancelas, mantendrás acceso hasta el final de tu período de facturación actual.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express). Para planes Enterprise también aceptamos transferencias bancarias.',
  },
  {
    question: '¿Ofrecen descuentos para planes anuales?',
    answer: 'Sí, ofrecemos un 20% de descuento en todos los planes pagados cuando eliges facturación anual en lugar de mensual.',
  },
  {
    question: '¿Cómo funciona el escrow de pagos?',
    answer: 'Cuando creas un contrato, los fondos se depositan en escrow. El creador los recibe automáticamente cuando se aprueban los entregables, o se liberan por hitos según lo acordado.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed top-1/4 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">MarkInflu</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/creators" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Descubre Creadores
            </Link>
            <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Campañas
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-brand-500">
              Precios
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-400 mb-6">
              <Zap className="h-4 w-4" />
              <span>Prueba Pro gratis por 14 días</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
              Precios <span className="gradient-text">Transparentes</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Elige el plan perfecto para tu negocio. Sin costos ocultos.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bento-card p-8 flex flex-col ${
                    plan.highlighted
                      ? 'border-brand-500 ring-2 ring-brand-500/20'
                      : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full text-xs font-semibold bg-brand-500 text-white">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.priceLabel}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaLink}
                    className={`w-full py-3 text-center rounded-xl font-medium transition-all ${
                      plan.highlighted
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Transaction Fee Note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                + 10% de comisión por transacción en todos los planes para cubrir procesamiento de pagos y escrow
              </p>
            </div>
          </div>
        </section>

        {/* For Creators Section */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="bento-card p-8 md:p-12">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-500 mb-4">
                  100% Gratis
                </span>
                <h2 className="text-3xl font-bold mb-4">Para Creadores de Contenido</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  MarkInflu es completamente gratis para creadores. Sin comisiones, sin costos ocultos.
                  Recibe el 100% de lo que las marcas pagan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {CREATOR_BENEFITS.map((benefit) => (
                  <div key={benefit.title} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-500/10 text-green-500 mb-4">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <Link
                  href="/register?role=creator"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Crear mi perfil de creador
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Todo lo que incluye cada plan
            </h2>

            <div className="bento-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Característica</th>
                    <th className="text-center p-4 font-medium">Starter</th>
                    <th className="text-center p-4 font-medium bg-brand-500/5">Pro</th>
                    <th className="text-center p-4 font-medium">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-4">Campañas activas</td>
                    <td className="text-center p-4">3</td>
                    <td className="text-center p-4 bg-brand-500/5">Ilimitadas</td>
                    <td className="text-center p-4">Ilimitadas</td>
                  </tr>
                  <tr>
                    <td className="p-4">Usuarios del equipo</td>
                    <td className="text-center p-4">1</td>
                    <td className="text-center p-4 bg-brand-500/5">5</td>
                    <td className="text-center p-4">Ilimitados</td>
                  </tr>
                  <tr>
                    <td className="p-4">Descubrimiento de creadores</td>
                    <td className="text-center p-4">Básico</td>
                    <td className="text-center p-4 bg-brand-500/5">Avanzado</td>
                    <td className="text-center p-4">Premium + AI</td>
                  </tr>
                  <tr>
                    <td className="p-4">Revisión visual de contenido</td>
                    <td className="text-center p-4"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></td>
                    <td className="text-center p-4 bg-brand-500/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Analytics</td>
                    <td className="text-center p-4">Básico</td>
                    <td className="text-center p-4 bg-brand-500/5">Avanzado</td>
                    <td className="text-center p-4">Custom</td>
                  </tr>
                  <tr>
                    <td className="p-4">API Access</td>
                    <td className="text-center p-4"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></td>
                    <td className="text-center p-4 bg-brand-500/5"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-4">Soporte</td>
                    <td className="text-center p-4">Email</td>
                    <td className="text-center p-4 bg-brand-500/5">Email + Chat</td>
                    <td className="text-center p-4">24/7 Dedicado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Preguntas Frecuentes
            </h2>

            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="bento-card p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                ¿Tienes más preguntas?
              </p>
              <Link href="/contact" className="btn-secondary inline-flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Contactar Soporte
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 sm:p-16 text-center">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-4">
                  ¿Listo para empezar?
                </h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  Únete a cientos de marcas que ya están trabajando con los mejores creadores en MarkInflu
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-white/90 transition-all"
                  >
                    Crear Cuenta Gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3 font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Ver Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
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
