'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle2,
  Instagram,
  Youtube,
  Sparkles,
  ChevronDown,
  X,
  ArrowRight,
} from 'lucide-react';

interface Creator {
  id: string;
  displayName: string;
  tagline: string | null;
  avatarUrl: string | null;
  country: string | null;
  primaryNiche: string | null;
  isVerified: boolean;
  totalFollowers: number;
  avgEngagementRate: number;
  socialAccounts: {
    platform: string;
    followers: number | null;
  }[];
}

const NICHES = [
  'Todos', 'Estilo de vida', 'Moda', 'Belleza', 'Tecnología', 'Gaming', 'Viajes',
  'Comida', 'Fitness', 'Finanzas', 'Educación', 'Entretenimiento'
];

const PLATFORMS = [
  { value: 'all', label: 'Todas' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Todos');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [selectedNiche, selectedPlatform]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedNiche !== 'Todos') params.append('niches', selectedNiche);
      if (selectedPlatform !== 'all') params.append('platforms', selectedPlatform);
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/creators?${params}`);
      const data = await response.json();
      setCreators(data.data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCreators();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

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
            <Link href="/creators" className="text-sm font-medium text-brand-500">
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
              Descubre <span className="gradient-text">Creadores</span> Increíbles
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Encuentra el talento perfecto para tu próxima campaña entre miles de creadores verificados
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, nicho o ubicación..."
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
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Niche Pills */}
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => setSelectedNiche(niche)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedNiche === niche
                        ? 'bg-brand-500 text-white'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>

              {/* Platform Filter */}
              <div className="relative ml-auto">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-xl bg-secondary/50 border border-border text-sm focus:border-brand-500 outline-none cursor-pointer"
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Creators Grid */}
        <section className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bento-card p-6 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-muted rounded mb-2" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-full bg-muted rounded mb-2" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron creadores</h3>
                <p className="text-muted-foreground mb-6">
                  Intenta con otros filtros o términos de búsqueda
                </p>
                <button
                  onClick={() => {
                    setSelectedNiche('Todos');
                    setSelectedPlatform('all');
                    setSearchQuery('');
                  }}
                  className="btn-secondary"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/creators/${creator.id}`}
                    className="bento-card p-6 hover:border-brand-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-background overflow-hidden">
                            {creator.avatarUrl ? (
                              <Image
                                src={creator.avatarUrl}
                                alt={creator.displayName}
                                width={64}
                                height={64}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-brand-500">
                                {creator.displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                        {creator.isVerified && (
                          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-background">
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-brand-500 transition-colors">
                          {creator.displayName}
                        </h3>
                        {creator.primaryNiche && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400">
                            {creator.primaryNiche}
                          </span>
                        )}
                      </div>
                    </div>

                    {creator.tagline && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {creator.tagline}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(creator.totalFollowers)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span>{creator.avgEngagementRate}%</span>
                      </div>
                      {creator.country && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{creator.country}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* CTA para registrarse */}
            {!loading && creators.length > 0 && (
              <div className="mt-16 text-center">
                <div className="bento-card p-8 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold mb-2">¿Quieres contactar a estos creadores?</h3>
                  <p className="text-muted-foreground mb-6">
                    Regístrate gratis para enviar propuestas y gestionar tus campañas
                  </p>
                  <Link href="/register?role=brand" className="btn-primary inline-flex items-center gap-2">
                    Crear cuenta de marca
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
