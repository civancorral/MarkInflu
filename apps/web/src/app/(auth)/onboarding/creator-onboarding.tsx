'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  User,
  MapPin,
  Instagram,
  Youtube,
  AtSign,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Globe,
} from 'lucide-react';

const NICHES = [
  'Estilo de vida', 'Moda', 'Belleza', 'Tecnología', 'Gaming', 'Viajes',
  'Comida', 'Fitness', 'Finanzas', 'Educación', 'Entretenimiento',
  'Música', 'Arte', 'Fotografía', 'Deportes', 'Paternidad', 'Mascotas',
  'Negocios', 'Salud', 'Hogar y Jardín', 'Bricolaje', 'Comedia'
];

const CONTENT_TYPES = [
  { value: 'INSTAGRAM_POST', label: 'Instagram Post' },
  { value: 'INSTAGRAM_STORY', label: 'Instagram Story' },
  { value: 'INSTAGRAM_REEL', label: 'Instagram Reel' },
  { value: 'TIKTOK_VIDEO', label: 'TikTok Video' },
  { value: 'YOUTUBE_VIDEO', label: 'YouTube Video' },
  { value: 'YOUTUBE_SHORT', label: 'YouTube Short' },
  { value: 'TWITTER_POST', label: 'Twitter/X Post' },
  { value: 'BLOG_POST', label: 'Blog Post' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'LIVE_STREAM', label: 'Live Stream' },
];

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
];

const step1Schema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  tagline: z.string().max(100, 'Máximo 100 caracteres').optional(),
});

const step2Schema = z.object({
  country: z.string().min(1, 'Selecciona un país'),
  city: z.string().optional(),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
});

const step3Schema = z.object({
  primaryNiche: z.string().min(1, 'Selecciona tu nicho principal'),
  secondaryNiches: z.array(z.string()).max(5, 'Máximo 5 nichos secundarios'),
  contentTypes: z.array(z.string()).min(1, 'Selecciona al menos un tipo de contenido'),
});

const step4Schema = z.object({
  minimumBudget: z.number().min(0).optional(),
  instagramUsername: z.string().optional(),
  instagramFollowers: z.number().min(0).optional(),
  youtubeUsername: z.string().optional(),
  youtubeFollowers: z.number().min(0).optional(),
  tiktokUsername: z.string().optional(),
  tiktokFollowers: z.number().min(0).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

const STEPS = [
  { id: 1, title: 'Perfil Básico', icon: User },
  { id: 2, title: 'Ubicación', icon: MapPin },
  { id: 3, title: 'Contenido', icon: Sparkles },
  { id: 4, title: 'Redes y Tarifas', icon: DollarSign },
];

export function CreatorOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data & Step4Data>>({
    languages: ['es'],
    secondaryNiches: [],
    contentTypes: [],
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData,
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData,
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: formData,
  });

  const handleNext = async (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSubmit({ ...formData, ...data });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Build social accounts array
      const socialAccounts = [];
      if (data.instagramUsername) {
        socialAccounts.push({
          platform: 'INSTAGRAM',
          username: data.instagramUsername,
          profileUrl: `https://instagram.com/${data.instagramUsername}`,
          followers: data.instagramFollowers || 0,
        });
      }
      if (data.youtubeUsername) {
        socialAccounts.push({
          platform: 'YOUTUBE',
          username: data.youtubeUsername,
          profileUrl: `https://youtube.com/@${data.youtubeUsername}`,
          followers: data.youtubeFollowers || 0,
        });
      }
      if (data.tiktokUsername) {
        socialAccounts.push({
          platform: 'TIKTOK',
          username: data.tiktokUsername,
          profileUrl: `https://tiktok.com/@${data.tiktokUsername}`,
          followers: data.tiktokFollowers || 0,
        });
      }

      const response = await fetch('/api/creators/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: data.displayName,
          bio: data.bio,
          tagline: data.tagline,
          country: data.country,
          city: data.city,
          languages: data.languages,
          primaryNiche: data.primaryNiche,
          secondaryNiches: data.secondaryNiches,
          contentTypes: data.contentTypes,
          minimumBudget: data.minimumBudget,
          currency: 'USD',
          socialAccounts,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear perfil');
      }

      toast.success('¡Perfil creado exitosamente!');
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${currentStep >= step.id
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-border text-muted-foreground'
                }
              `}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-all ${
                  currentStep > step.id ? 'bg-brand-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">{STEPS[currentStep - 1]?.title || ''}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {currentStep} de {STEPS.length}
        </p>
      </div>

      {/* Form Steps */}
      <div className="bento-card p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={step1Form.handleSubmit(handleNext)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre de creador *
                  </label>
                  <input
                    {...step1Form.register('displayName')}
                    className="input-base w-full"
                    placeholder="Ej: Sofía Lifestyle"
                  />
                  {step1Form.formState.errors.displayName && (
                    <p className="text-sm text-red-500 mt-1">
                      {step1Form.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tagline
                  </label>
                  <input
                    {...step1Form.register('tagline')}
                    className="input-base w-full"
                    placeholder="Ej: Creadora de contenido lifestyle y viajes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    {...step1Form.register('bio')}
                    className="input-base w-full h-32 resize-none"
                    placeholder="Cuéntanos sobre ti, tu estilo de contenido y lo que te apasiona..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {step1Form.watch('bio')?.length || 0}/500 caracteres
                  </p>
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary">
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={step2Form.handleSubmit(handleNext)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    País *
                  </label>
                  <select
                    {...step2Form.register('country')}
                    className="input-base w-full"
                  >
                    <option value="">Selecciona tu país</option>
                    <option value="MX">México</option>
                    <option value="ES">España</option>
                    <option value="AR">Argentina</option>
                    <option value="CO">Colombia</option>
                    <option value="CL">Chile</option>
                    <option value="PE">Perú</option>
                    <option value="US">Estados Unidos</option>
                    <option value="BR">Brasil</option>
                  </select>
                  {step2Form.formState.errors.country && (
                    <p className="text-sm text-red-500 mt-1">
                      {step2Form.formState.errors.country.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ciudad
                  </label>
                  <input
                    {...step2Form.register('city')}
                    className="input-base w-full"
                    placeholder="Ej: Ciudad de México"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Idiomas *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const languages = step2Form.watch('languages') || [];
                      const isSelected = languages.includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            const current = step2Form.getValues('languages') || [];
                            if (isSelected) {
                              step2Form.setValue('languages', current.filter((l) => l !== lang.code));
                            } else {
                              step2Form.setValue('languages', [...current, lang.code]);
                            }
                          }}
                          className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${isSelected
                              ? 'bg-brand-500 text-white'
                              : 'bg-secondary hover:bg-secondary/80 text-foreground'
                            }
                          `}
                        >
                          <Globe className="w-4 h-4 inline mr-1" />
                          {lang.name}
                        </button>
                      );
                    })}
                  </div>
                  {step2Form.formState.errors.languages && (
                    <p className="text-sm text-red-500 mt-1">
                      {step2Form.formState.errors.languages.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button type="button" onClick={handleBack} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </button>
                  <button type="submit" className="btn-primary">
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={step3Form.handleSubmit(handleNext)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nicho principal *
                  </label>
                  <select
                    {...step3Form.register('primaryNiche')}
                    className="input-base w-full"
                  >
                    <option value="">Selecciona tu nicho principal</option>
                    {NICHES.map((niche) => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                  {step3Form.formState.errors.primaryNiche && (
                    <p className="text-sm text-red-500 mt-1">
                      {step3Form.formState.errors.primaryNiche.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nichos secundarios
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.filter((n) => n !== step3Form.watch('primaryNiche')).map((niche) => {
                      const secondaryNiches = step3Form.watch('secondaryNiches') || [];
                      const isSelected = secondaryNiches.includes(niche);
                      return (
                        <button
                          key={niche}
                          type="button"
                          onClick={() => {
                            const current = step3Form.getValues('secondaryNiches') || [];
                            if (isSelected) {
                              step3Form.setValue('secondaryNiches', current.filter((n) => n !== niche));
                            } else if (current.length < 5) {
                              step3Form.setValue('secondaryNiches', [...current, niche]);
                            }
                          }}
                          className={`
                            px-3 py-1.5 rounded-full text-sm transition-all
                            ${isSelected
                              ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                              : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                            }
                          `}
                        >
                          {niche}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step3Form.watch('secondaryNiches')?.length || 0}/5 seleccionados
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipos de contenido *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTENT_TYPES.map((type) => {
                      const contentTypes = step3Form.watch('contentTypes') || [];
                      const isSelected = contentTypes.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            const current = step3Form.getValues('contentTypes') || [];
                            if (isSelected) {
                              step3Form.setValue('contentTypes', current.filter((t) => t !== type.value));
                            } else {
                              step3Form.setValue('contentTypes', [...current, type.value]);
                            }
                          }}
                          className={`
                            px-4 py-3 rounded-lg text-sm text-left transition-all border
                            ${isSelected
                              ? 'bg-brand-500/10 border-brand-500 text-foreground'
                              : 'bg-secondary/50 border-border hover:border-brand-500/50 text-muted-foreground'
                            }
                          `}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                  {step3Form.formState.errors.contentTypes && (
                    <p className="text-sm text-red-500 mt-1">
                      {step3Form.formState.errors.contentTypes.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button type="button" onClick={handleBack} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </button>
                  <button type="submit" className="btn-primary">
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={step4Form.handleSubmit(handleNext)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presupuesto mínimo (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      {...step4Form.register('minimumBudget', { valueAsNumber: true })}
                      className="input-base w-full pl-10"
                      placeholder="500"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Presupuesto mínimo por colaboración
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Redes Sociales</h3>
                  
                  {/* Instagram */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        <Instagram className="w-4 h-4 inline mr-1" />
                        Usuario de Instagram
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          {...step4Form.register('instagramUsername')}
                          className="input-base w-full pl-9"
                          placeholder="tu_usuario"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Seguidores
                      </label>
                      <input
                        type="number"
                        {...step4Form.register('instagramFollowers', { valueAsNumber: true })}
                        className="input-base w-full"
                        placeholder="100000"
                      />
                    </div>
                  </div>

                  {/* YouTube */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        <Youtube className="w-4 h-4 inline mr-1" />
                        Canal de YouTube
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          {...step4Form.register('youtubeUsername')}
                          className="input-base w-full pl-9"
                          placeholder="tu_canal"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Suscriptores
                      </label>
                      <input
                        type="number"
                        {...step4Form.register('youtubeFollowers', { valueAsNumber: true })}
                        className="input-base w-full"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                        Usuario de TikTok
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          {...step4Form.register('tiktokUsername')}
                          className="input-base w-full pl-9"
                          placeholder="tu_usuario"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Seguidores
                      </label>
                      <input
                        type="number"
                        {...step4Form.register('tiktokFollowers', { valueAsNumber: true })}
                        className="input-base w-full"
                        placeholder="200000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={handleBack} className="btn-secondary">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Creando perfil...
                      </>
                    ) : (
                      <>
                        Completar perfil
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
