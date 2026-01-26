'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  DollarSign,
  Instagram,
  Youtube,
  Twitter,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createCreatorProfile } from './actions';

const NICHES = [
  'Lifestyle',
  'Fashion',
  'Beauty',
  'Fitness',
  'Travel',
  'Food',
  'Tech',
  'Gaming',
  'Finance',
  'Education',
  'Entertainment',
  'Music',
  'Art',
  'Photography',
  'Business',
  'Health',
  'Sports',
  'Automotive',
  'Home & Garden',
  'Parenting',
];

const CONTENT_TYPES = [
  { value: 'PHOTO', label: 'Fotografía' },
  { value: 'VIDEO_SHORT', label: 'Video Corto (Reels/TikTok)' },
  { value: 'VIDEO_LONG', label: 'Video Largo (YouTube)' },
  { value: 'STORY', label: 'Stories' },
  { value: 'LIVE', label: 'Live Streaming' },
  { value: 'BLOG', label: 'Blog/Artículos' },
  { value: 'PODCAST', label: 'Podcast' },
  { value: 'UGC', label: 'UGC (User Generated Content)' },
];

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
];

const step1Schema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  bio: z.string().max(500, 'Máximo 500 caracteres').optional(),
  tagline: z.string().max(100, 'Máximo 100 caracteres').optional(),
});

const step2Schema = z.object({
  country: z.string().min(1, 'Selecciona un país'),
  city: z.string().optional(),
  timezone: z.string().optional(),
  languages: z.array(z.string()).min(1, 'Selecciona al menos un idioma'),
});

const step3Schema = z.object({
  primaryNiche: z.string().min(1, 'Selecciona un nicho principal'),
  secondaryNiches: z.array(z.string()).max(3, 'Máximo 3 nichos secundarios'),
  contentTypes: z.array(z.string()).min(1, 'Selecciona al menos un tipo de contenido'),
});

const step4Schema = z.object({
  minimumBudget: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  instagramUsername: z.string().optional(),
  youtubeUsername: z.string().optional(),
  tiktokUsername: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

const STEPS = [
  { id: 1, title: 'Perfil', icon: User },
  { id: 2, title: 'Ubicación', icon: MapPin },
  { id: 3, title: 'Contenido', icon: Sparkles },
  { id: 4, title: 'Tarifas', icon: DollarSign },
];

interface CreatorOnboardingProps {
  userId: string;
}

export function CreatorOnboarding({ userId }: CreatorOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data & Step4Data>>({
    languages: ['es'],
    secondaryNiches: [],
    contentTypes: [],
    currency: 'USD',
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

  const handleNext = async () => {
    let isValid = false;
    let data: any = {};

    switch (currentStep) {
      case 1:
        isValid = await step1Form.trigger();
        data = step1Form.getValues();
        break;
      case 2:
        isValid = await step2Form.trigger();
        data = step2Form.getValues();
        break;
      case 3:
        isValid = await step3Form.trigger();
        data = step3Form.getValues();
        break;
      case 4:
        isValid = await step4Form.trigger();
        data = step4Form.getValues();
        break;
    }

    if (isValid) {
      setFormData((prev) => ({ ...prev, ...data }));
      if (currentStep < 4) {
        setCurrentStep((prev) => prev + 1);
      } else {
        await handleSubmit({ ...formData, ...data });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await createCreatorProfile(userId, data);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('¡Perfil creado exitosamente!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Error al crear el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string, setter: any) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    setter(newArray);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-12 h-12 rounded-full transition-all
                      ${isCompleted ? 'bg-brand-500 text-white' : ''}
                      ${isActive ? 'bg-brand-500/20 text-brand-400 ring-2 ring-brand-500' : ''}
                      ${!isActive && !isCompleted ? 'bg-white/5 text-gray-500' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        isCompleted ? 'bg-brand-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-gray-400 mt-4">
            Paso {currentStep} de 4: {STEPS[currentStep - 1]?.title || ''}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Profile */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Cuéntanos sobre ti
                    </h2>
                    <p className="text-gray-400">
                      Esta información aparecerá en tu perfil público
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="displayName">Nombre de creador *</Label>
                      <Input
                        id="displayName"
                        placeholder="Ej: Sofia Lifestyle"
                        {...step1Form.register('displayName')}
                        error={step1Form.formState.errors.displayName?.message}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        placeholder="Ej: Creadora de contenido lifestyle y viajes"
                        {...step1Form.register('tagline')}
                        error={step1Form.formState.errors.tagline?.message}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Cuéntanos un poco sobre ti y tu contenido..."
                        rows={4}
                        {...step1Form.register('bio')}
                        error={step1Form.formState.errors.bio?.message}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      ¿Dónde te encuentras?
                    </h2>
                    <p className="text-gray-400">
                      Ayuda a las marcas a encontrarte por ubicación
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>País *</Label>
                      <Select
                        value={step2Form.watch('country')}
                        onValueChange={(value) => step2Form.setValue('country', value)}
                      >
                        <SelectTrigger error={!!step2Form.formState.errors.country}>
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MX">México</SelectItem>
                          <SelectItem value="ES">España</SelectItem>
                          <SelectItem value="AR">Argentina</SelectItem>
                          <SelectItem value="CO">Colombia</SelectItem>
                          <SelectItem value="CL">Chile</SelectItem>
                          <SelectItem value="PE">Perú</SelectItem>
                          <SelectItem value="US">Estados Unidos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        placeholder="Ej: Ciudad de México"
                        {...step2Form.register('city')}
                      />
                    </div>

                    <div>
                      <Label>Idiomas *</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LANGUAGES.map((lang) => {
                          const languages = step2Form.watch('languages') || [];
                          const isSelected = languages.includes(lang.value);
                          return (
                            <button
                              key={lang.value}
                              type="button"
                              onClick={() => {
                                toggleArrayItem(
                                  languages,
                                  lang.value,
                                  (newVal: string[]) =>
                                    step2Form.setValue('languages', newVal)
                                );
                              }}
                              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                isSelected
                                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                              }`}
                            >
                              {lang.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Content */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Tu contenido
                    </h2>
                    <p className="text-gray-400">
                      Cuéntanos sobre el tipo de contenido que creas
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Nicho principal *</Label>
                      <Select
                        value={step3Form.watch('primaryNiche')}
                        onValueChange={(value) =>
                          step3Form.setValue('primaryNiche', value)
                        }
                      >
                        <SelectTrigger error={!!step3Form.formState.errors.primaryNiche}>
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
                        {NICHES.filter(
                          (n) => n !== step3Form.watch('primaryNiche')
                        ).map((niche) => {
                          const secondaryNiches =
                            step3Form.watch('secondaryNiches') || [];
                          const isSelected = secondaryNiches.includes(niche);
                          return (
                            <button
                              key={niche}
                              type="button"
                              disabled={
                                !isSelected && secondaryNiches.length >= 3
                              }
                              onClick={() => {
                                toggleArrayItem(
                                  secondaryNiches,
                                  niche,
                                  (newVal: string[]) =>
                                    step3Form.setValue('secondaryNiches', newVal)
                                );
                              }}
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
                      <Label>Tipos de contenido *</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {CONTENT_TYPES.map((type) => {
                          const contentTypes =
                            step3Form.watch('contentTypes') || [];
                          const isSelected = contentTypes.includes(type.value);
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => {
                                toggleArrayItem(
                                  contentTypes,
                                  type.value,
                                  (newVal: string[]) =>
                                    step3Form.setValue('contentTypes', newVal)
                                );
                              }}
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
              )}

              {/* Step 4: Rates & Social */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Tarifas y redes
                    </h2>
                    <p className="text-gray-400">
                      Configura tu presupuesto mínimo y conecta tus redes
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimumBudget">Presupuesto mínimo</Label>
                        <Input
                          id="minimumBudget"
                          type="number"
                          placeholder="500"
                          {...step4Form.register('minimumBudget', {
                            valueAsNumber: true,
                          })}
                          icon={<DollarSign className="w-4 h-4" />}
                        />
                      </div>
                      <div>
                        <Label>Moneda</Label>
                        <Select
                          value={step4Form.watch('currency')}
                          onValueChange={(value) =>
                            step4Form.setValue('currency', value)
                          }
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

                    <div className="pt-4 border-t border-white/10">
                      <Label className="mb-4 block">Redes sociales (opcional)</Label>
                      <div className="space-y-3">
                        <Input
                          placeholder="Usuario de Instagram"
                          {...step4Form.register('instagramUsername')}
                          icon={<Instagram className="w-4 h-4" />}
                        />
                        <Input
                          placeholder="Canal de YouTube"
                          {...step4Form.register('youtubeUsername')}
                          icon={<Youtube className="w-4 h-4" />}
                        />
                        <Input
                          placeholder="Usuario de TikTok"
                          {...step4Form.register('tiktokUsername')}
                          icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <Button onClick={handleNext} isLoading={isLoading}>
              {currentStep === 4 ? (
                <>
                  Completar
                  <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
