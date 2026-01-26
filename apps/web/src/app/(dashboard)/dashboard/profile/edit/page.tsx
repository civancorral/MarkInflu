'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SocialAccountsManager } from '../components/social-accounts-manager';
import { RatesConfigurator } from '../components/rates-configurator';
import { PortfolioSection } from '../components/portfolio-section';
import { updateCreatorProfile, updateRates, updatePortfolio } from '../actions';

const NICHES = [
  'Lifestyle', 'Fashion', 'Beauty', 'Fitness', 'Travel', 'Food',
  'Tech', 'Gaming', 'Finance', 'Education', 'Entertainment', 'Music',
  'Art', 'Photography', 'Business', 'Health', 'Sports', 'Automotive',
  'Home & Garden', 'Parenting',
];

const CONTENT_TYPES = [
  { value: 'PHOTO', label: 'Fotografía' },
  { value: 'VIDEO_SHORT', label: 'Video Corto (Reels/TikTok)' },
  { value: 'VIDEO_LONG', label: 'Video Largo (YouTube)' },
  { value: 'STORY', label: 'Stories' },
  { value: 'LIVE_STREAM', label: 'Live Streaming' },
  { value: 'BLOG_POST', label: 'Blog/Artículos' },
  { value: 'PODCAST', label: 'Podcast' },
];

const profileSchema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  tagline: z.string().max(100, 'Máximo 100 caracteres').optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  primaryNiche: z.string().min(1, 'Selecciona un nicho'),
  minimumBudget: z.number().min(0).optional(),
  currency: z.string().default('USD'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [secondaryNiches, setSecondaryNiches] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(['es']);
  const [rates, setRates] = useState<any>({});
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (session?.user?.role !== 'CREATOR') {
      router.push('/dashboard');
      return;
    }
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creators/profile');

      if (!response.ok) {
        throw new Error('Error al cargar perfil');
      }

      const result = await response.json();
      const data = result.data;
      setProfile(data);

      // Set form values
      form.reset({
        displayName: data.displayName || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        bio: data.bio || '',
        tagline: data.tagline || '',
        country: data.country || '',
        city: data.city || '',
        primaryNiche: data.primaryNiche || '',
        minimumBudget: data.minimumBudget ? parseFloat(data.minimumBudget) : undefined,
        currency: data.currency || 'USD',
      });

      setSecondaryNiches(data.secondaryNiches || []);
      setContentTypes(data.contentTypes || []);
      setLanguages(data.languages || ['es']);
      setRates(data.rates || {});
      setPortfolioUrls(data.portfolioUrls || []);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);

      // Update profile
      const result = await updateCreatorProfile({
        ...data,
        secondaryNiches,
        contentTypes,
        languages,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update rates
      await updateRates(rates);

      // Update portfolio
      await updatePortfolio(portfolioUrls);

      toast.success('Perfil actualizado exitosamente');
      router.push('/dashboard/profile');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: any) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    setter(newArray);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al perfil
          </Link>
          <h1 className="text-3xl font-bold">Editar Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Actualiza tu información personal y profesional
          </p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <div className="bento-card p-6">
          <h3 className="text-lg font-semibold mb-6">Información Personal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="displayName">Nombre de creador *</Label>
              <Input
                id="displayName"
                {...form.register('displayName')}
                error={form.formState.errors.displayName?.message}
              />
            </div>

            <div>
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                {...form.register('firstName')}
              />
            </div>

            <div>
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                {...form.register('lastName')}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="Ej: Creadora de contenido lifestyle y viajes"
                {...form.register('tagline')}
                error={form.formState.errors.tagline?.message}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                {...form.register('bio')}
                error={form.formState.errors.bio?.message}
              />
            </div>

            <div>
              <Label htmlFor="country">País</Label>
              <Input id="country" {...form.register('country')} />
            </div>

            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...form.register('city')} />
            </div>
          </div>
        </div>

        {/* Niche & Content */}
        <div className="bento-card p-6">
          <h3 className="text-lg font-semibold mb-6">Nicho y Contenido</h3>
          <div className="space-y-6">
            <div>
              <Label>Nicho principal *</Label>
              <Select
                value={form.watch('primaryNiche')}
                onValueChange={(value) => form.setValue('primaryNiche', value)}
              >
                <SelectTrigger error={!!form.formState.errors.primaryNiche}>
                  <SelectValue placeholder="Selecciona tu nicho principal" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nichos secundarios (máx. 3)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {NICHES.filter((n) => n !== form.watch('primaryNiche')).map((niche) => {
                  const isSelected = secondaryNiches.includes(niche);
                  return (
                    <button
                      key={niche}
                      type="button"
                      disabled={!isSelected && secondaryNiches.length >= 3}
                      onClick={() => toggleArrayItem(secondaryNiches, niche, setSecondaryNiches)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 disabled:opacity-50'
                      }`}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Tipos de contenido</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONTENT_TYPES.map((type) => {
                  const isSelected = contentTypes.includes(type.value);
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => toggleArrayItem(contentTypes, type.value, setContentTypes)}
                      className={`px-4 py-3 rounded-lg text-sm text-left transition-all ${
                        isSelected
                          ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Rates */}
        <div className="bento-card p-6">
          <RatesConfigurator rates={rates} editable={true} onChange={setRates} />
        </div>

        {/* Portfolio */}
        <div className="bento-card p-6">
          <PortfolioSection portfolioUrls={portfolioUrls} editable={true} onChange={setPortfolioUrls} />
        </div>

        {/* Social Accounts */}
        <div className="bento-card p-6">
          <SocialAccountsManager
            socialAccounts={profile?.socialAccounts || []}
            editable={true}
          />
        </div>

        {/* Budget */}
        <div className="bento-card p-6">
          <h3 className="text-lg font-semibold mb-6">Presupuesto Mínimo</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minimumBudget">Presupuesto mínimo</Label>
              <Input
                id="minimumBudget"
                type="number"
                {...form.register('minimumBudget', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/profile">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
