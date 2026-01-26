'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Globe,
  Star,
  Users,
  TrendingUp,
  CheckCircle2,
  Instagram,
  Youtube,
  Twitter,
  ExternalLink,
  MessageCircle,
  Heart,
  Share2,
  ArrowLeft,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  followers: number | null;
  engagementRate: number | null;
  isVerified: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

interface CreatorProfile {
  id: string;
  displayName: string;
  tagline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  country: string | null;
  city: string | null;
  primaryNiche: string | null;
  secondaryNiches: string[];
  contentTypes: string[];
  languages: string[];
  minimumBudget: number;
  currency: string;
  isVerified: boolean;
  isAvailable: boolean;
  socialAccounts: SocialAccount[];
  reviews: Review[];
  totalFollowers: number;
  avgEngagementRate: number;
  avgRating: number;
  completedProjects: number;
}

interface Props {
  profile: CreatorProfile;
}

const PLATFORM_ICONS: Record<string, any> = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  TWITTER: Twitter,
  TIKTOK: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  ),
};

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'from-purple-500 to-pink-500',
  YOUTUBE: 'from-red-500 to-red-600',
  TIKTOK: 'from-black to-gray-800',
  TWITTER: 'from-blue-400 to-blue-500',
};

export function CreatorProfileView({ profile }: Props) {
  const PlatformIcon = (platform: string) => {
    const Icon = PLATFORM_ICONS[platform];
    return Icon ? <Icon className="w-5 h-5" /> : <Globe className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header with back button */}
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <Link
            href="/dashboard/discover"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Discovery
          </Link>
        </div>

        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-gradient-to-br from-brand-500/20 to-purple-500/20">
          {profile.coverImageUrl && (
            <Image
              src={profile.coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          {/* Profile Header */}
          <div className="relative -mt-20 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 p-1">
                  <div className="w-full h-full rounded-xl bg-background overflow-hidden">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.displayName}
                        width={160}
                        height={160}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-brand-500">
                        {profile.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-background">
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold font-display">
                        {profile.displayName}
                      </h1>
                      {profile.isAvailable && (
                        <span className="badge-success">Disponible</span>
                      )}
                    </div>
                    {profile.tagline && (
                      <p className="text-muted-foreground mt-1">{profile.tagline}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {profile.city && profile.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.city}, {profile.country}
                        </span>
                      )}
                      {profile.languages.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {profile.languages.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="hidden md:flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="btn-primary">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contactar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bento-card p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-brand-500" />
                  <p className="text-2xl font-bold">{formatNumber(profile.totalFollowers)}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="bento-card p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{profile.avgEngagementRate}%</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
                <div className="bento-card p-4 text-center">
                  <Star className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{profile.avgRating || '-'}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="bento-card p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{profile.completedProjects}</p>
                  <p className="text-xs text-muted-foreground">Proyectos</p>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="bento-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Sobre mí</h2>
                  <p className="text-muted-foreground whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {/* Social Accounts */}
              <div className="bento-card p-6">
                <h2 className="text-lg font-semibold mb-4">Redes Sociales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.socialAccounts.map((account) => (
                    <a
                      key={account.id}
                      href={account.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${PLATFORM_COLORS[account.platform] || 'from-gray-500 to-gray-600'}`}>
                        {PlatformIcon(account.platform)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">@{account.username}</p>
                          {account.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(account.followers || 0)} seguidores
                          {account.engagementRate && ` • ${account.engagementRate}% eng.`}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              {profile.reviews && profile.reviews.length > 0 && (
                <div className="bento-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Reseñas</h2>
                  <div className="space-y-4">
                    {profile.reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-purple-500" />
                          <div>
                            <p className="font-medium">Marca verificada</p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bento-card p-6">
                <h2 className="text-lg font-semibold mb-4">Tarifas</h2>
                <div className="text-center p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Desde</p>
                  <p className="text-3xl font-bold text-brand-500">
                    ${profile.minimumBudget.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{profile.currency}</p>
                </div>
                <button className="btn-primary w-full mt-4">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Solicitar cotización
                </button>
              </div>

              {/* Niches */}
              <div className="bento-card p-6">
                <h2 className="text-lg font-semibold mb-4">Nichos</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.primaryNiche && (
                    <span className="badge-primary">{profile.primaryNiche}</span>
                  )}
                  {profile.secondaryNiches.map((niche) => (
                    <span key={niche} className="px-3 py-1 rounded-full text-sm bg-secondary">
                      {niche}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              {profile.contentTypes.length > 0 && (
                <div className="bento-card p-6">
                  <h2 className="text-lg font-semibold mb-4">Tipos de Contenido</h2>
                  <div className="space-y-2">
                    {profile.contentTypes.map((type) => (
                      <div
                        key={type}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {type.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
