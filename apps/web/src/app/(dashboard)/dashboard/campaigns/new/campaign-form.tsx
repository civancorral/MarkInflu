'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  DollarSign,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Image as ImageIcon,
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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { createCampaign, publishCampaign } from './actions';

const CONTENT_TYPES = [
  { value: 'PHOTO', label: 'Fotografía' },
  { value: 'VIDEO_SHORT', label: 'Video Corto (Reels/TikTok)' },
  { value: 'VIDEO_LONG', label: 'Video Largo (YouTube)' },
  { value: 'STORY', label: 'Stories' },
  { value: 'LIVE', label: 'Live Streaming' },
  { value: 'BLOG', label: 'Blog/Artículos' },
  { value: 'UGC', label: 'UGC' },
];

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TWITTER', label: 'Twitter/X' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
];

const campaignSchema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(100),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(2000),
  objectives: z.string().max(1000).optional(),
  targetAudience: z.string().max(500).optional(),
  platforms: z.array(z.string()).min(1, 'Selecciona al menos una plataforma'),
  contentTypes: z.array(z.string()).min(1, 'Selecciona al menos un tipo'),
  budgetMin: z.number().min(100, 'Mínimo $100'),
  budgetMax: z.number().min(100, 'Mínimo $100'),
  currency: z.string().default('USD'),
  budgetType: z.enum(['PER_CREATOR', 'TOTAL']).default('PER_CREATOR'),
  maxCreators: z.number().min(1).max(100).default(10),
  applicationDeadline: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVITE_ONLY']).default('PUBLIC'),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  guidelines: z.string().max(2000).optional(),
  dos: z.array(z.string()).optional(),
  donts: z.array(z.string()).optional(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const STEPS = [
  { id: 1, title: 'Información', icon: FileText },
  { id: 2, title: 'Requisitos', icon: Users },
  { id: 3, title: 'Presupuesto', icon: DollarSign },
  { id: 4, title: 'Fechas', icon: Calendar },
];

interface CampaignFormProps {
  brandProfileId: string;
}

export function CampaignForm({ brandProfileId }: CampaignFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');
  const [doInput, setDoInput] = useState('');
  const [dontInput, setDontInput] = useState('');

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      platforms: [],
      contentTypes: [],
      budgetMin: 500,
      budgetMax: 5000,
      currency: 'USD',
      budgetType: 'PER_CREATOR',
      maxCreators: 10,
      visibility: 'PUBLIC',
      hashtags: [],
      mentions: [],
      dos: [],
      donts: [],
    },
  });

  const { watch, setValue, trigger, getValues } = form;

  const toggleArrayItem = (field: keyof CampaignFormData, item: string) => {
    const current = (watch(field) as string[]) || [];
    const newValue = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setValue(field, newValue as any);
  };

  const addToArray = (field: keyof CampaignFormData, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = (watch(field) as string[]) || [];
    if (!current.includes(value.trim())) {
      setValue(field, [...current, value.trim()] as any);
    }
    setter('');
  };

  const removeFromArray = (field: keyof CampaignFormData, index: number) => {
    const current = (watch(field) as string[]) || [];
    setValue(field, current.filter((_, i) => i !== index) as any);
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof CampaignFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description'];
        break;
      case 2:
        fieldsToValidate = ['platforms', 'contentTypes'];
        break;
      case 3:
        fieldsToValidate = ['budgetMin', 'budgetMax', 'maxCreators'];
        break;
      case 4:
        // No required fields in step 4
        break;
    }

    const isValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const data = getValues();
      const result = await createCampaign(brandProfileId, data, false);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Campaña guardada como borrador');
      router.push('/dashboard/campaigns');
    } catch (error) {
      toast.error('Error al guardar la campaña');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    try {
      const data = getValues();
      const result = await createCampaign(brandProfileId, data, true);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('¡Campaña publicada exitosamente!');
      router.push('/dashboard/campaigns');
    } catch (error) {
      toast.error('Error al publicar la campaña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => isCompleted && setCurrentStep(step.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                  ${isCompleted ? 'bg-brand-500/20 text-brand-400 cursor-pointer hover:bg-brand-500/30' : ''}
                  ${isActive ? 'bg-brand-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-white/5 text-gray-500' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-brand-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form */}
      <Card variant="bento" className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Información de la campaña
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Define el título y descripción de tu campaña
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título de la campaña *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Lanzamiento de Producto Tech 2024"
                      {...form.register('title')}
                      error={form.formState.errors.title?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu campaña, qué buscas lograr y qué tipo de contenido esperas..."
                      rows={5}
                      {...form.register('description')}
                      error={form.formState.errors.description?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objectives">Objetivos de la campaña</Label>
                    <Textarea
                      id="objectives"
                      placeholder="¿Qué métricas o resultados esperas de esta campaña?"
                      rows={3}
                      {...form.register('objectives')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Audiencia objetivo</Label>
                    <Input
                      id="targetAudience"
                      placeholder="Ej: Millennials interesados en tecnología, 25-35 años"
                      {...form.register('targetAudience')}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Requirements */}
            {currentStep === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Requisitos de contenido
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Define qué tipo de contenido necesitas
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label>Plataformas *</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PLATFORMS.map((platform) => {
                        const platforms = watch('platforms') || [];
                        const isSelected = platforms.includes(platform.value);
                        return (
                          <button
                            key={platform.value}
                            type="button"
                            onClick={() => toggleArrayItem('platforms', platform.value)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              isSelected
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                            }`}
                          >
                            {platform.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label>Tipos de contenido *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {CONTENT_TYPES.map((type) => {
                        const contentTypes = watch('contentTypes') || [];
                        const isSelected = contentTypes.includes(type.value);
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleArrayItem('contentTypes', type.value)}
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

                  <div>
                    <Label>Hashtags requeridos</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="#TuHashtag"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('hashtags', hashtagInput.startsWith('#') ? hashtagInput : `#${hashtagInput}`, setHashtagInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addToArray('hashtags', hashtagInput.startsWith('#') ? hashtagInput : `#${hashtagInput}`, setHashtagInput)}
                      >
                        Agregar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(watch('hashtags') || []).map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeFromArray('hashtags', i)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Menciones requeridas</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="@TuMarca"
                        value={mentionInput}
                        onChange={(e) => setMentionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('mentions', mentionInput.startsWith('@') ? mentionInput : `@${mentionInput}`, setMentionInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addToArray('mentions', mentionInput.startsWith('@') ? mentionInput : `@${mentionInput}`, setMentionInput)}
                      >
                        Agregar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(watch('mentions') || []).map((mention, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeFromArray('mentions', i)}
                        >
                          {mention} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guidelines">Lineamientos adicionales</Label>
                    <Textarea
                      id="guidelines"
                      placeholder="Instrucciones específicas para los creadores..."
                      rows={3}
                      {...form.register('guidelines')}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Presupuesto
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Define el presupuesto de tu campaña
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budgetMin">Presupuesto mínimo *</Label>
                      <Input
                        id="budgetMin"
                        type="number"
                        placeholder="500"
                        {...form.register('budgetMin', { valueAsNumber: true })}
                        error={form.formState.errors.budgetMin?.message}
                        icon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>
                    <div>
                      <Label htmlFor="budgetMax">Presupuesto máximo *</Label>
                      <Input
                        id="budgetMax"
                        type="number"
                        placeholder="5000"
                        {...form.register('budgetMax', { valueAsNumber: true })}
                        error={form.formState.errors.budgetMax?.message}
                        icon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Moneda</Label>
                      <Select
                        value={watch('currency')}
                        onValueChange={(value) => setValue('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - Dólar</SelectItem>
                          <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de presupuesto</Label>
                      <Select
                        value={watch('budgetType')}
                        onValueChange={(value: 'PER_CREATOR' | 'TOTAL') => setValue('budgetType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PER_CREATOR">Por creador</SelectItem>
                          <SelectItem value="TOTAL">Total campaña</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="maxCreators">Número máximo de creadores *</Label>
                    <Input
                      id="maxCreators"
                      type="number"
                      min={1}
                      max={100}
                      {...form.register('maxCreators', { valueAsNumber: true })}
                      error={form.formState.errors.maxCreators?.message}
                      icon={<Users className="w-4 h-4" />}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ¿Cuántos creadores quieres contratar para esta campaña?
                    </p>
                  </div>

                  <div>
                    <Label>Visibilidad de la campaña</Label>
                    <Select
                      value={watch('visibility')}
                      onValueChange={(value: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY') => setValue('visibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Pública - Cualquier creador puede aplicar</SelectItem>
                        <SelectItem value="PRIVATE">Privada - Solo visible para ti</SelectItem>
                        <SelectItem value="INVITE_ONLY">Solo invitación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Dates */}
            {currentStep === 4 && (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Fechas y plazos
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Define las fechas importantes de tu campaña
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="applicationDeadline">Fecha límite de aplicaciones</Label>
                    <Input
                      id="applicationDeadline"
                      type="date"
                      {...form.register('applicationDeadline')}
                      icon={<Calendar className="w-4 h-4" />}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Fecha de inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...form.register('startDate')}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Fecha de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...form.register('endDate')}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <Label>Lo que SÍ deben hacer los creadores</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Ej: Mostrar el producto en uso"
                        value={doInput}
                        onChange={(e) => setDoInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('dos', doInput, setDoInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addToArray('dos', doInput, setDoInput)}
                      >
                        Agregar
                      </Button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {(watch('dos') || []).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-emerald-400 cursor-pointer hover:line-through"
                          onClick={() => removeFromArray('dos', i)}
                        >
                          ✓ {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Label>Lo que NO deben hacer los creadores</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Ej: Mencionar a la competencia"
                        value={dontInput}
                        onChange={(e) => setDontInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('donts', dontInput, setDontInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => addToArray('donts', dontInput, setDontInput)}
                      >
                        Agregar
                      </Button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {(watch('donts') || []).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-red-400 cursor-pointer hover:line-through"
                          onClick={() => removeFromArray('donts', i)}
                        >
                          ✗ {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={currentStep === 1 ? 'invisible' : ''}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            isLoading={isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar borrador
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext}>
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handlePublish} isLoading={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              Publicar campaña
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
