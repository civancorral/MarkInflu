'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Instagram,
  Youtube,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NICHES = [
  'Lifestyle',
  'Fashion',
  'Beauty',
  'Fitness',
  'Technology',
  'Gaming',
  'Food',
  'Travel',
  'Business',
  'Education',
  'Entertainment',
  'Health',
];

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: Instagram },
  { value: 'TIKTOK', label: 'TikTok', icon: null },
  { value: 'YOUTUBE', label: 'YouTube', icon: Youtube },
  { value: 'TWITTER', label: 'Twitter/X', icon: null },
];

const FOLLOWER_RANGES = [
  { value: '1000-10000', label: 'Nano (1K - 10K)' },
  { value: '10000-50000', label: 'Micro (10K - 50K)' },
  { value: '50000-500000', label: 'Mid-tier (50K - 500K)' },
  { value: '500000-1000000', label: 'Macro (500K - 1M)' },
  { value: '1000000+', label: 'Mega (1M+)' },
];

export function DiscoveryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const selectedNiches = searchParams.get('niches')?.split(',').filter(Boolean) || [];
  const selectedPlatforms = searchParams.get('platforms')?.split(',').filter(Boolean) || [];

  const updateFilters = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    params.delete('page'); // Reset pagination
    router.push(`/dashboard/discover?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('q', query);
  };

  const toggleNiche = (niche: string) => {
    const newNiches = selectedNiches.includes(niche)
      ? selectedNiches.filter((n) => n !== niche)
      : [...selectedNiches, niche];
    updateFilters('niches', newNiches);
  };

  const togglePlatform = (platform: string) => {
    const newPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    updateFilters('platforms', newPlatforms);
  };

  const clearFilters = () => {
    router.push('/dashboard/discover');
    setQuery('');
  };

  const hasActiveFilters = selectedNiches.length > 0 || selectedPlatforms.length > 0 || query;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nombre, nicho, keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-base pl-11 pr-4"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn-secondary inline-flex items-center gap-2',
            showFilters && 'bg-primary/10 text-primary'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {selectedNiches.length + selectedPlatforms.length + (query ? 1 : 0)}
            </span>
          )}
        </button>
      </form>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bento-card space-y-6">
          {/* Platforms */}
          <div>
            <label className="mb-3 block text-sm font-medium">Plataformas</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => togglePlatform(platform.value)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                    selectedPlatforms.includes(platform.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {platform.icon && <platform.icon className="h-4 w-4" />}
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niches */}
          <div>
            <label className="mb-3 block text-sm font-medium">Nichos</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((niche) => (
                <button
                  key={niche}
                  onClick={() => toggleNiche(niche)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition-colors',
                    selectedNiches.includes(niche)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Follower Range */}
          <div>
            <label className="mb-3 block text-sm font-medium">Rango de Seguidores</label>
            <div className="flex flex-wrap gap-2">
              {FOLLOWER_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => updateFilters('followers', range.value)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition-colors',
                    searchParams.get('followers') === range.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-end border-t border-border pt-4">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {selectedNiches.map((niche) => (
            <button
              key={niche}
              onClick={() => toggleNiche(niche)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {niche}
              <X className="h-3 w-3" />
            </button>
          ))}
          {selectedPlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {platform}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
