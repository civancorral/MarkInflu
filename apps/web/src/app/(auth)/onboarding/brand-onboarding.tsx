'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  Phone,
} from 'lucide-react';

const INDUSTRIES = [
  'Tecnología', 'Moda y Ropa', 'Belleza y Cosméticos', 'Alimentos y Bebidas',
  'Salud y Bienestar', 'Viajes y Hospitalidad', 'Finanzas y Banca',
  'Automotriz', 'Entretenimiento', 'Gaming', 'Deportes y Fitness',
  'Hogar y Jardín', 'Educación', 'E-commerce', 'Retail', 'Telecomunicaciones',
  'Bienes Raíces', 'Medios y Editorial', 'Sin fines de lucro', 'Otro'
];

const COMPANY_SIZES = [
  { value: 'STARTUP', label: '1-10 empleados' },
  { value: 'SMALL', label: '11-50 empleados' },
  { value: 'MEDIUM', label: '51-200 empleados' },
  { value: 'LARGE', label: '201-1000 empleados' },
  { value: 'ENTERPRISE', label: '1000+ empleados' },
];

const step1Schema = z.object({
  companyName: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

const step2Schema = z.object({
  industry: z.array(z.string()).min(1, 'Selecciona al menos una industria'),
  companySize: z.string().min(1, 'Selecciona el tamaño de empresa'),
  country: z.string().min(1, 'Selecciona un país'),
});

const step3Schema = z.object({
  contactName: z.string().min(2, 'Mínimo 2 caracteres').optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  monthlyBudget: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const STEPS = [
  { id: 1, title: 'Empresa', icon: Building2 },
  { id: 2, title: 'Industria', icon: Globe },
  { id: 3, title: 'Contacto', icon: Users },
];

export function BrandOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({
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

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData,
  });

  const handleNext = async (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < 3) {
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
      const response = await fetch('/api/brands/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          website: data.website || null,
          industry: data.industry,
          companySize: data.companySize,
          country: data.country,
          contactName: data.contactName,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear perfil');
      }

      toast.success('¡Perfil de empresa creado exitosamente!');
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
                className={`w-16 h-0.5 mx-2 transition-all ${
                  currentStep > step.id ? 'bg-brand-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">{STEPS[currentStep - 1].title}</h2>
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
                    Nombre de la empresa *
                  </label>
                  <input
                    {...step1Form.register('companyName')}
                    className="input-base w-full"
                    placeholder="Ej: TechBrand Inc."
                  />
                  {step1Form.formState.errors.companyName && (
                    <p className="text-sm text-red-500 mt-1">
                      {step1Form.formState.errors.companyName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sitio web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      {...step1Form.register('website')}
                      className="input-base w-full pl-10"
                      placeholder="https://www.tuempresa.com"
                    />
                  </div>
                  {step1Form.formState.errors.website && (
                    <p className="text-sm text-red-500 mt-1">
                      {step1Form.formState.errors.website.message}
                    </p>
                  )}
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
                    Industria *
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {INDUSTRIES.map((ind) => {
                      const industry = step2Form.watch('industry') || [];
                      const isSelected = industry.includes(ind);
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => {
                            const current = step2Form.getValues('industry') || [];
                            if (isSelected) {
                              step2Form.setValue('industry', current.filter((i) => i !== ind));
                            } else if (current.length < 3) {
                              step2Form.setValue('industry', [...current, ind]);
                            }
                          }}
                          className={`
                            px-3 py-1.5 rounded-full text-sm transition-all
                            ${isSelected
                              ? 'bg-brand-500 text-white'
                              : 'bg-secondary hover:bg-secondary/80 text-foreground'
                            }
                          `}
                        >
                          {ind}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step2Form.watch('industry')?.length || 0}/3 seleccionadas
                  </p>
                  {step2Form.formState.errors.industry && (
                    <p className="text-sm text-red-500 mt-1">
                      {step2Form.formState.errors.industry.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tamaño de empresa *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPANY_SIZES.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => step2Form.setValue('companySize', size.value)}
                        className={`
                          px-4 py-3 rounded-lg text-sm text-left transition-all border
                          ${step2Form.watch('companySize') === size.value
                            ? 'bg-brand-500/10 border-brand-500 text-foreground'
                            : 'bg-secondary/50 border-border hover:border-brand-500/50 text-muted-foreground'
                          }
                        `}
                      >
                        <Users className="w-4 h-4 inline mr-2" />
                        {size.label}
                      </button>
                    ))}
                  </div>
                  {step2Form.formState.errors.companySize && (
                    <p className="text-sm text-red-500 mt-1">
                      {step2Form.formState.errors.companySize.message}
                    </p>
                  )}
                </div>

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
                    Nombre de contacto
                  </label>
                  <input
                    {...step3Form.register('contactName')}
                    className="input-base w-full"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email de contacto
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      {...step3Form.register('contactEmail')}
                      className="input-base w-full pl-10"
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  {step3Form.formState.errors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1">
                      {step3Form.formState.errors.contactEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Teléfono de contacto
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      {...step3Form.register('contactPhone')}
                      className="input-base w-full pl-10"
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presupuesto mensual estimado para influencer marketing
                  </label>
                  <select
                    {...step3Form.register('monthlyBudget')}
                    className="input-base w-full"
                  >
                    <option value="">Selecciona un rango</option>
                    <option value="0-5000">$0 - $5,000 USD</option>
                    <option value="5000-15000">$5,000 - $15,000 USD</option>
                    <option value="15000-50000">$15,000 - $50,000 USD</option>
                    <option value="50000-100000">$50,000 - $100,000 USD</option>
                    <option value="100000+">$100,000+ USD</option>
                  </select>
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
