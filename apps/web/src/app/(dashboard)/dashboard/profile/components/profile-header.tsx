'use client';

import Link from 'next/link';
import { Edit, MapPin, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
  profile: {
    displayName: string;
    firstName?: string;
    lastName?: string;
    tagline?: string;
    bio?: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    location?: string;
    city?: string;
    country?: string;
    isVerified?: boolean;
    totalFollowers?: number;
    averageEngagement?: string;
    primaryNiche?: string;
  };
  editable?: boolean;
}

export function ProfileHeader({ profile, editable = false }: ProfileHeaderProps) {
  const getInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return profile.displayName?.substring(0, 2).toUpperCase() || 'CR';
  };

  const formatFollowers = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const location = profile.city && profile.country
    ? `${profile.city}, ${profile.country}`
    : profile.country || profile.location;

  return (
    <div className="bento-card overflow-hidden">
      {/* Cover Image */}
      <div
        className="h-40 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20"
        style={profile.coverImageUrl ? {
          backgroundImage: `url(${profile.coverImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      />

      <div className="p-6">
        {/* Avatar and Edit Button */}
        <div className="flex items-start justify-between -mt-20 mb-4">
          <Avatar className="w-32 h-32 border-4 border-background">
            <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
            <AvatarFallback className="text-2xl font-bold bg-brand-500/20 text-brand-400">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          {editable && (
            <Link href="/dashboard/profile/edit">
              <Button variant="outline" className="mt-16">
                <Edit className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
            </Link>
          )}
        </div>

        {/* Name and Verification */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground">
              {profile.displayName}
            </h1>
            {profile.isVerified && (
              <CheckCircle className="w-6 h-6 text-brand-500" />
            )}
          </div>

          {profile.tagline && (
            <p className="text-lg text-muted-foreground">
              {profile.tagline}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground mb-6 max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-6 mb-4">
          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>
          )}

          {/* Total Followers */}
          {profile.totalFollowers !== undefined && profile.totalFollowers > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-medium">
                <span className="text-foreground">{formatFollowers(profile.totalFollowers)}</span>
                <span className="text-muted-foreground ml-1">seguidores</span>
              </span>
            </div>
          )}

          {/* Average Engagement */}
          {profile.averageEngagement && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">
                <span className="text-foreground">{profile.averageEngagement}%</span>
                <span className="text-muted-foreground ml-1">engagement</span>
              </span>
            </div>
          )}

          {/* Primary Niche */}
          {profile.primaryNiche && (
            <Badge variant="secondary" className="text-sm">
              {profile.primaryNiche}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
