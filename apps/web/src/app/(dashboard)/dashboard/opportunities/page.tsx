'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Building2,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetType: string;
  currency: string;
  applicationDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  maxCreators: number;
  currentCreators: number;
  applicationsCount: number;
  brand: {
    name: string;
    logo: string | null;
    industry: string[];
  };
  requirements: {
    minFollowers: number | null;
    platforms: string[];
    niches: string[];
    countries: string[];
  };
}

const NICHES = [
  'Todos',
  'Estilo de vida',
  'Moda',
  'Belleza',
  'Tecnología',
  'Gaming',
  'Viajes',
  'Comida',
  'Fitness',
  'Finanzas',
  'Educación',
  'Entretenimiento',
];

const PLATFORMS = [
  { value: '', label: 'Todas las plataformas' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter/X' },
];

function formatBudget(min: string | null, max: string | null, currency: string) {
  if (!min && !max) return 'A negociar';
  if (min && max) return `$${parseInt(min).toLocaleString()} - $${parseInt(max).toLocaleString()} ${currency}`;
  if (min) return `Desde $${parseInt(min).toLocaleString()} ${currency}`;
  if (max) return `Hasta $${parseInt(max).toLocaleString()} ${currency}`;
  return 'A negociar';
}

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OpportunitiesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Todos');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [selectedNiche, selectedPlatform, minBudget, maxBudget]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedNiche !== 'Todos') params.append('niche', selectedNiche);
      if (selectedPlatform) params.append('platform', selectedPlatform);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);

      const response = await fetch(`/api/campaigns/available?${params}`);
      const result = await response.json();
      setCampaigns(result.data || []);
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
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-brand-500" />
                Descubrir Oportunidades
              </h1>
              <p className="text-muted-foreground mt-1">
                Encuentra campañas perfectas para tu perfil
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre de campaña, marca o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-3 rounded-xl bg-secondary/50 border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Niche Filter */}
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
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="px-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm focus:border-brand-500 outline-none cursor-pointer"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtros</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presupuesto mínimo (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presupuesto máximo (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bento-card p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                  <div className="flex-1">
                    <div className="h-5 w-2/3 bg-muted rounded mb-2" />
                    <div className="h-4 w-1/3 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No se encontraron oportunidades
            </h3>
            <p className="text-muted-foreground mb-6">
              Intenta ajustar los filtros o revisa más tarde
            </p>
            <button
              onClick={() => {
                setSelectedNiche('Todos');
                setSelectedPlatform('');
                setMinBudget('');
                setMaxBudget('');
                setSearchQuery('');
              }}
              className="btn-secondary"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-semibold text-foreground">{campaigns.length}</span>{' '}
                oportunidades
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((campaign) => {
                const daysLeft = getDaysLeft(campaign.applicationDeadline);
                const spotsLeft = campaign.maxCreators - campaign.currentCreators;

                return (
                  <Link
                    key={campaign.id}
                    href={`/dashboard/opportunities/${campaign.id}`}
                    className="bento-card p-6 hover:border-brand-500/50 transition-all group"
                  >
                    {/* Header */}
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                          {campaign.brand.logo ? (
                            <img
                              src={campaign.brand.logo}
                              alt={campaign.brand.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-brand-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-brand-500 transition-colors truncate">
                          {campaign.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.brand.name}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {campaign.requirements.platforms.slice(0, 3).map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 rounded-md text-xs bg-brand-500/10 text-brand-400"
                        >
                          {platform}
                        </span>
                      ))}
                      {campaign.requirements.niches.slice(0, 2).map((niche) => (
                        <span
                          key={niche}
                          className="px-2 py-1 rounded-md text-xs bg-purple-500/10 text-purple-400"
                        >
                          {niche}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatBudget(campaign.budgetMin, campaign.budgetMax, campaign.currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {spotsLeft} {spotsLeft === 1 ? 'lugar' : 'lugares'}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      {daysLeft !== null && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {daysLeft > 0 ? `${daysLeft} días restantes` : 'Último día'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-brand-500 font-medium text-sm group-hover:gap-2 transition-all">
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
