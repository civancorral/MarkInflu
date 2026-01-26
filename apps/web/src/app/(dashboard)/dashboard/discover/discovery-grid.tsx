import { prisma } from '@markinflu/database';
import { CreatorCard } from './creator-card';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';

interface DiscoveryGridProps {
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

async function getCreators(searchParams: DiscoveryGridProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    isAvailable: true,
    user: {
      status: 'ACTIVE',
    },
  };

  // Search query
  if (searchParams.q) {
    where.OR = [
      { displayName: { contains: searchParams.q, mode: 'insensitive' } },
      { bio: { contains: searchParams.q, mode: 'insensitive' } },
      { primaryNiche: { contains: searchParams.q, mode: 'insensitive' } },
      { keywords: { has: searchParams.q.toLowerCase() } },
    ];
  }

  // Niches filter
  if (searchParams.niches) {
    const niches = searchParams.niches.split(',');
    where.OR = [
      { primaryNiche: { in: niches } },
      { secondaryNiches: { hasSome: niches } },
    ];
  }

  // Platforms filter
  if (searchParams.platforms) {
    const platforms = searchParams.platforms.split(',');
    where.socialAccounts = {
      some: {
        platform: { in: platforms },
      },
    };
  }

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({
      where,
      include: {
        socialAccounts: {
          orderBy: { followers: 'desc' },
          take: 3,
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.creatorProfile.count({ where }),
  ]);

  return {
    creators,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

export async function DiscoveryGrid({ searchParams }: DiscoveryGridProps) {
  const { creators, total, page, totalPages, hasNext, hasPrev } = await getCreators(searchParams);

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No se encontraron creadores</h3>
        <p className="mt-2 text-center text-muted-foreground">
          Intenta ajustar tus filtros o buscar con otros términos.
        </p>
      </div>
    );
  }

  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set('q', searchParams.q);
    if (searchParams.niches) params.set('niches', searchParams.niches);
    if (searchParams.platforms) params.set('platforms', searchParams.platforms);
    params.set('page', newPage.toString());
    return `/dashboard/discover?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium text-foreground">{creators.length}</span> de{' '}
          <span className="font-medium text-foreground">{total}</span> creadores
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {creators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={hasPrev ? buildPageUrl(page - 1) : '#'}
            className={`btn-secondary inline-flex items-center gap-1 ${
              !hasPrev && 'pointer-events-none opacity-50'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm transition-colors ${
                    pageNum === page
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          <Link
            href={hasNext ? buildPageUrl(page + 1) : '#'}
            className={`btn-secondary inline-flex items-center gap-1 ${
              !hasNext && 'pointer-events-none opacity-50'
            }`}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
