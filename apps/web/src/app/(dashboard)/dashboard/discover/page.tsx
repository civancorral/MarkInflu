import { Metadata } from 'next';
import { Suspense } from 'react';
import { DiscoveryGrid } from './discovery-grid';
import { DiscoveryFilters } from './discovery-filters';
import { DiscoverySkeleton } from './discovery-skeleton';

export const metadata: Metadata = {
  title: 'Descubrir Creadores',
  description: 'Encuentra los mejores creadores de contenido para tu marca',
};

interface DiscoverPageProps {
  searchParams: {
    q?: string;
    niches?: string;
    platforms?: string;
    minFollowers?: string;
    maxFollowers?: string;
    minEngagement?: string;
    countries?: string;
    page?: string;
  };
}

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Descubrir Creadores</h1>
        <p className="page-description">
          Explora miles de creadores y encuentra el match perfecto para tu marca.
        </p>
      </div>

      {/* Filters */}
      <DiscoveryFilters />

      {/* Results */}
      <Suspense fallback={<DiscoverySkeleton />}>
        <DiscoveryGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
