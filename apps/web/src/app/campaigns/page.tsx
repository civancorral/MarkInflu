'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ChevronDown,
  Briefcase,
  Target,
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  maxCreators: number;
  currentCreators: number;
  applicationDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  brief: {
    targetNiches?: string[];
    targetPlatforms?: string[];
  } | null;
  brandProfile: {
    companyName: string;
    logoUrl: string | null;
    industry: string[];
  };
  _count: {
    applications: number;
  };
  spotsRemaining: number;
}

const INDUSTRIES = [
  'Todas', 'Tecnología', 'Moda y Ropa', 'Belleza y Cosméticos', 'Alimentos y Bebidas',
  'Salud y Bienestar', 'Viajes y Hospitalidad', 'Finanzas y Banca', 'Entretenimiento'
];

const BUDGET_RANGES = [
  { value: 'all', label: 'Cualquier presupuesto' },
  { value: '0-1000', label: '$0 - $1,000' },
  { value: '1000-5000', label: '$1,000 - $5,000' },
  { value: '5000-10000', label: '$5,000 - $10,000' },
  { value: '10000+', label: '$10,000+' },
];

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDaysRemaining(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('Todas');
  const [budgetRange, setBudgetRange] = useState('all');

  useEffect(() => {
    fetchCampaigns();
  }, [selectedIndustry, budgetRange]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'PUBLISHED');
      
      if (budgetRange !== 'all') {
        const [min, max] = budgetRange.split('-');
        if (min) params.append('minBudget', min);
        if (max && max !== '+') params.append('maxBudget', max);
      }
      
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/campaigns?${params}`);
      const data = await response.json();
      setCampaigns(data.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

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
            <Link href="/campaigns" className="text-sm font-medium text-brand-500">
              Campañas
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <h1 className="text-4xl sm:text-5xl font-bold font-display mb-4">
              <span className="gradient-text">Campañas</span> Activas
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Encuentra oportunidades de colaboración con marcas increíbles
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar campañas por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-32 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-4">
              {/* Industry Pills */}
              <div className="flex flex-wrap gap-2 flex-1">
                {INDUSTRIES.slice(0, 6).map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedIndustry === industry
                        ? 'bg-brand-500 text-white'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>

              {/* Budget Filter */}
              <div className="relative">
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-xl bg-secondary/50 border border-border text-sm focus:border-brand-500 outline-none cursor-pointer"
                >
                  {BUDGET_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Campaigns Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bento-card p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-muted rounded mb-2" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-full bg-muted rounded mb-2" />
                    <div className="h-4 w-3/4 bg-muted rounded mb-4" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay campañas disponibles</h3>
                <p className="text-muted-foreground mb-6">
                  Vuelve pronto para ver nuevas oportunidades de colaboración
                </p>
                <Link href="/register?role=creator" className="btn-primary">
                  Registrarme como creador
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                  const daysRemaining = campaign.applicationDeadline
                    ? getDaysRemaining(campaign.applicationDeadline)
                    : null;
                  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

                  return (
                    <div
                      key={campaign.id}
                      className="bento-card p-6 hover:border-brand-500/50 transition-all group flex flex-col"
                    >
                      {/* Brand Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {campaign.brandProfile.companyName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">
                            {campaign.brandProfile.companyName}
                          </p>
                          {campaign.brandProfile.industry[0] && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                              {campaign.brandProfile.industry[0]}
                            </span>
                          )}
                        </div>
                        {isUrgent && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-500 font-medium">
                            {daysRemaining}d restantes
                          </span>
                        )}
                      </div>

                      {/* Campaign Info */}
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-brand-500 transition-colors">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                        {campaign.description}
                      </p>

                      {/* Niches */}
                      {campaign.brief?.targetNiches && campaign.brief.targetNiches.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {campaign.brief.targetNiches.slice(0, 3).map((niche) => (
                            <span
                              key={niche}
                              className="px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400"
                            >
                              {niche}
                            </span>
                          ))}
                          {campaign.brief.targetNiches.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                              +{campaign.brief.targetNiches.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {formatCurrency(campaign.budgetMin)} - {formatCurrency(campaign.budgetMax)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">
                            {campaign.spotsRemaining} de {campaign.maxCreators} spots
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {campaign.applicationDeadline && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Deadline: {formatDate(campaign.applicationDeadline)}
                          </div>
                        )}
                        {campaign.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Inicio: {formatDate(campaign.startDate)}
                          </div>
                        )}
                      </div>

                      {/* Apply Button */}
                      <Link
                        href={`/login?redirect=/campaigns/${campaign.slug}`}
                        className="mt-4 w-full py-2 text-center rounded-lg bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-all text-sm font-medium"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA para creadores */}
            {!loading && (
              <div className="mt-16 text-center">
                <div className="bento-card p-8 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold mb-2">¿Eres creador de contenido?</h3>
                  <p className="text-muted-foreground mb-6">
                    Crea tu perfil gratis y empieza a aplicar a campañas que se ajusten a tu estilo
                  </p>
                  <Link href="/register?role=creator" className="btn-primary inline-flex items-center gap-2">
                    Crear mi perfil de creador
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
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
            <p className="text-sm text-muted-foreground">
              © 2024 MarkInflu. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
