'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, BadgeCheck, MapPin, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';
import type { CreatorProfile, SocialAccount } from '@markinflu/database';

interface CreatorCardProps {
  creator: CreatorProfile & {
    socialAccounts: SocialAccount[];
  };
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
};

export function CreatorCard({ creator }: CreatorCardProps) {
  const totalFollowers = creator.socialAccounts.reduce(
    (sum, acc) => sum + acc.followers,
    0
  );
  
  const avgEngagement = creator.socialAccounts.length > 0
    ? creator.socialAccounts.reduce((sum, acc) => sum + (Number(acc.engagementRate) || 0), 0) /
      creator.socialAccounts.length
    : 0;

  return (
    <Link
      href={`/dashboard/discover/${creator.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Cover / Gradient Background */}
      <div className="relative h-24 bg-gradient-to-br from-brand-500/20 via-brand-600/10 to-transparent">
        {creator.coverImageUrl && (
          <Image
            src={creator.coverImageUrl}
            alt=""
            fill
            className="object-cover"
          />
        )}
        
        {/* Verified Badge */}
        {creator.isVerified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium backdrop-blur-sm">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-500" />
            Verificado
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            // TODO: Implement favorite functionality
          }}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-red-500"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar */}
      <div className="relative -mt-10 px-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-card bg-muted">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt={creator.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-600 text-2xl font-bold text-white">
              {creator.displayName.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {/* Name & Location */}
        <div className="mb-2">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {creator.displayName}
          </h3>
          {creator.location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {creator.location}
            </p>
          )}
        </div>

        {/* Niches */}
        <div className="mb-3 flex flex-wrap gap-1">
          {creator.primaryNiche && (
            <span className="badge-primary">{creator.primaryNiche}</span>
          )}
          {creator.secondaryNiches?.slice(0, 2).map((niche) => (
            <span key={niche} className="badge bg-muted text-muted-foreground">
              {niche}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3">
          <div className="text-center">
            <p className="text-lg font-semibold">{formatNumber(totalFollowers)}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{avgEngagement.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>

        {/* Platforms */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {creator.socialAccounts.slice(0, 3).map((account) => {
              const Icon = platformIcons[account.platform] || ExternalLink;
              return (
                <div
                  key={account.id}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                  title={`${account.platform}: ${formatNumber(account.followers)}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
          </div>
          
          {/* Rate Hint */}
          {creator.minimumBudget && (
            <p className="text-sm">
              <span className="text-muted-foreground">Desde </span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(creator.minimumBudget), creator.currency || 'USD')}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <span className="btn-primary">Ver Perfil</span>
      </div>
    </Link>
  );
}
