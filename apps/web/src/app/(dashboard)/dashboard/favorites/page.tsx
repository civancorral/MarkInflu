'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  Heart,
  MapPin,
  Users,
  Trash2,
  MessageSquare,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FavoriteCreator {
  id: string;
  listName: string | null;
  notes: string | null;
  createdAt: string;
  creatorProfile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    primaryNiche: string | null;
    location: string | null;
    user: { id: string };
    socialAccounts: { platform: string; followers: number }[];
  };
}

interface ListInfo {
  name: string;
  count: number;
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function FavoritesPage() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteCreator[]>([]);
  const [lists, setLists] = useState<ListInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeList, setActiveList] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [activeList]);

  const fetchFavorites = async () => {
    try {
      const params = activeList ? `?list=${encodeURIComponent(activeList)}` : '';
      const res = await fetch(`/api/favorites${params}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.data || []);
        setLists(data.lists || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (creatorProfileId: string) => {
    try {
      const res = await fetch(`/api/favorites/${creatorProfileId}`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.creatorProfile.id !== creatorProfileId));
        toast.success('Creador eliminado de favoritos');
      } else {
        toast.error('Error al eliminar favorito');
      }
    } catch {
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="text-muted-foreground">Creadores que has guardado para futuras colaboraciones</p>
      </div>

      {/* List Filters */}
      {lists.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => setActiveList(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              !activeList
                ? 'bg-brand-500/10 text-brand-500 border-brand-500/20'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
            )}
          >
            Todos
          </button>
          {lists.map((list) => (
            <button
              key={list.name}
              onClick={() => setActiveList(list.name)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                activeList === list.name
                  ? 'bg-brand-500/10 text-brand-500 border-brand-500/20'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {list.name} ({list.count})
            </button>
          ))}
          {activeList && (
            <button onClick={() => setActiveList(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16 text-center">
          <Star className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {activeList ? `No tienes creadores en la lista "${activeList}"` : 'No tienes creadores favoritos aún'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Explora creadores y guárdalos con el botón de corazón
          </p>
          <Link href="/dashboard/discover" className="btn-primary mt-4 inline-flex items-center gap-2">
            Descubrir Creadores
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const creator = fav.creatorProfile;
            const totalFollowers = creator.socialAccounts.reduce(
              (sum, a) => sum + a.followers,
              0,
            );

            return (
              <div key={fav.id} className="bento-card group relative overflow-hidden p-0">
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(creator.id)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-red-500/10 hover:text-red-500"
                  title="Eliminar de favoritos"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <Link href={`/dashboard/discover/${creator.user.id}`} className="block p-5">
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                      {creator.avatarUrl ? (
                        <Image
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
                          {creator.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{creator.displayName}</p>
                      {creator.primaryNiche && (
                        <p className="text-xs text-muted-foreground">{creator.primaryNiche}</p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>
                  )}

                  {/* Meta */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {creator.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {creator.location}
                      </span>
                    )}
                    {totalFollowers > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatFollowers(totalFollowers)}
                      </span>
                    )}
                  </div>

                  {/* Platforms */}
                  {creator.socialAccounts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {creator.socialAccounts.map((acc) => (
                        <span
                          key={acc.platform}
                          className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {acc.platform}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* List badge + notes */}
                  {(fav.listName || fav.notes) && (
                    <div className="mt-3 border-t border-border pt-3">
                      {fav.listName && (
                        <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-500 border border-brand-500/20">
                          {fav.listName}
                        </span>
                      )}
                      {fav.notes && (
                        <p className="mt-1 text-xs text-muted-foreground italic line-clamp-1">
                          {fav.notes}
                        </p>
                      )}
                    </div>
                  )}
                </Link>

                {/* Quick action */}
                <div className="border-t border-border px-5 py-3">
                  <Link
                    href={`/dashboard/chat?userId=${creator.user.id}`}
                    className="flex items-center justify-center gap-2 text-sm text-brand-500 hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar mensaje
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
