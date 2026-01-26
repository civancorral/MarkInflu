'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
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
import { createBrandProfile } from './actions';

const INDUSTRIES = [
  'Technology',
  'Fashion',
  'Beauty',
  'Food & Beverage',
  'Health & Wellness',
  'Finance',
  'Automotive',
  'Travel',
  'Entertainment',
  'Sports',
  'Education',
  'Real Estate',
  'E-commerce',
  'SaaS',
  'Consumer Goods',
  'Retail',
  'Media',
  'Hospitality',
];

const COMPANY_SIZES = [
  { value: 'STARTUP', label: 'Startup (1-10 empleados)' },
  { value: 'SMALL', label: 'Pequeña (11-50 empleados)' },
  { value: 'MEDIUM', label: 'Mediana (51-200 empleados)' },
  { value: 'LARGE', label: 'Grande (201-1000 empleados)' },
  { value: 'ENTERPRISE', label: 'Corporativo (1000+ empleados)' },
];

const step1Schema = z.object({
  companyName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

const step2Schema = z.object({
  industry: z.array(z.string()).min(1, 'Selecciona al menos una industria'),
  companySize: z.string().min(1, 'Selecciona el tamaño de empresa'),
  country: z.string().min(1, 'Selecciona un país'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const STEPS = [
  { id: 1, title: 'Empresa', icon: Building2 },
  { id: 2, title: 'Detalles', icon: Users },
];

interface BrandOnboardingProps {
  userId: string;
}

export function BrandOnboarding({ userId }: BrandOnboardingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data>>({
    industry: [],
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
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
    }

    if (isValid) {
      setFormData((prev) => ({ ...prev, ...data }));
      if (currentStep < 2) {
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
      const result = await createBrandProfile(userId, data);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('¡Perfil de marca creado exitosamente!');
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
                      className={`w-16 h-0.5 mx-2 ${
                        isCompleted ? 'bg-brand-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-center text-gray-400 mt-4">
            Paso {currentStep} de 2: {STEPS[currentStep - 1]?.title || ''}
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
              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Cuéntanos sobre tu empresa
                    </h2>
                    <p className="text-gray-400">
                      Esta información aparecerá en tus campañas
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Nombre de la empresa *</Label>
                      <Input
                        id="companyName"
                        placeholder="Ej: TechBrand Inc."
                        {...step1Form.register('companyName')}
                        error={step1Form.formState.errors.companyName?.message}
                        icon={<Building2 className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Sitio web</Label>
                      <Input
                        id="website"
                        placeholder="https://www.tuempresa.com"
                        {...step1Form.register('website')}
                        error={step1Form.formState.errors.website?.message}
                        icon={<Globe className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción de la empresa</Label>
                      <Textarea
                        id="description"
                        placeholder="Cuéntanos brevemente sobre tu empresa y qué la hace única..."
                        rows={4}
                        {...step1Form.register('description')}
                        error={step1Form.formState.errors.description?.message}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Detalles adicionales
                    </h2>
                    <p className="text-gray-400">
                      Ayúdanos a conectarte con los creadores correctos
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Industrias *</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Selecciona las que apliquen
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRIES.map((industry) => {
                          const industries = step2Form.watch('industry') || [];
                          const isSelected = industries.includes(industry);
                          return (
                            <button
                              key={industry}
                              type="button"
                              onClick={() => {
                                toggleArrayItem(
                                  industries,
                                  industry,
                                  (newVal: string[]) =>
                                    step2Form.setValue('industry', newVal)
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                isSelected
                                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50'
                                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                              }`}
                            >
                              {industry}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label>Tamaño de la empresa *</Label>
                      <Select
                        value={step2Form.watch('companySize')}
                        onValueChange={(value) =>
                          step2Form.setValue('companySize', value)
                        }
                      >
                        <SelectTrigger
                          error={!!step2Form.formState.errors.companySize}
                        >
                          <SelectValue placeholder="Selecciona el tamaño" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_SIZES.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>País *</Label>
                      <Select
                        value={step2Form.watch('country')}
                        onValueChange={(value) =>
                          step2Form.setValue('country', value)
                        }
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
              {currentStep === 2 ? (
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
