'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  FileText,
  Send,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  description: string;
  brief: any;
  requirements: any;
  deliverableSpecs: any;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetType: string;
  currency: string;
  applicationDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  maxCreators: number;
  currentCreators: number;
  brand: {
    name: string;
    logo: string | null;
    industry: string[];
  };
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);

  // Application form state
  const [proposedRate, setProposedRate] = useState('');
  const [pitch, setPitch] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState(['']);

  useEffect(() => {
    fetchCampaign();
    checkIfApplied();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data);
      } else {
        toast.error('Campaña no encontrada');
        router.push('/dashboard/opportunities');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast.error('Error al cargar la campaña');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await fetch('/api/applications/my-applications');
      if (response.ok) {
        const result = await response.json();
        const applied = result.data.some((app: any) => app.campaign.id === params.id);
        setHasApplied(applied);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleAddPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, '']);
  };

  const handlePortfolioLinkChange = (index: number, value: string) => {
    const newLinks = [...portfolioLinks];
    newLinks[index] = value;
    setPortfolioLinks(newLinks);
  };

  const handleRemovePortfolioLink = (index: number) => {
    const newLinks = portfolioLinks.filter((_, i) => i !== index);
    setPortfolioLinks(newLinks);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el pitch tenga al menos 100 caracteres
    if (pitch.length < 100) {
      toast.error('El pitch debe tener al menos 100 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/campaigns/${params.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedRate: proposedRate || null,
          pitch,
          portfolioLinks: portfolioLinks.filter((link) => link.trim() !== ''),
        }),
      });

      if (response.ok) {
        toast.success('¡Aplicación enviada exitosamente!');
        setShowApplyModal(false);
        // Esperar un momento para que se vea el toast
        setTimeout(() => {
          router.push('/dashboard/applications');
        }, 500);
      } else {
        const error = await response.json();

        // Si ya aplicó, redirigir a aplicaciones
        if (error.message.includes('Ya aplicaste')) {
          toast.error(error.message);
          setShowApplyModal(false);
          setTimeout(() => {
            router.push('/dashboard/applications');
          }, 1000);
        } else {
          toast.error(error.message || 'Error al enviar aplicación');
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Error al enviar aplicación');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const daysLeft = campaign.applicationDeadline
    ? Math.ceil((new Date(campaign.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const spotsLeft = campaign.maxCreators - campaign.currentCreators;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/opportunities"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a oportunidades
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                  {campaign.brand.logo ? (
                    <img
                      src={campaign.brand.logo}
                      alt={campaign.brand.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-brand-500" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{campaign.title}</h1>
                <p className="text-muted-foreground">{campaign.brand.name}</p>
              </div>
            </div>

            {checkingApplication ? (
              <button
                disabled
                className="btn-primary flex items-center gap-2 opacity-50"
              >
                Verificando...
              </button>
            ) : hasApplied ? (
              <Link
                href="/dashboard/applications"
                className="btn-secondary flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Ya aplicaste - Ver aplicación
              </Link>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Aplicar ahora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bento-card p-4">
                <DollarSign className="w-5 h-5 text-brand-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Presupuesto</p>
                <p className="font-semibold">
                  {campaign.budgetMin && campaign.budgetMax
                    ? `$${parseInt(campaign.budgetMin).toLocaleString()} - $${parseInt(campaign.budgetMax).toLocaleString()}`
                    : 'A negociar'}
                </p>
              </div>

              <div className="bento-card p-4">
                <Users className="w-5 h-5 text-purple-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Lugares</p>
                <p className="font-semibold">{spotsLeft} disponibles</p>
              </div>

              <div className="bento-card p-4">
                <Clock className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Tiempo restante</p>
                <p className="font-semibold">
                  {daysLeft !== null ? `${daysLeft} días` : 'N/A'}
                </p>
              </div>

              <div className="bento-card p-4">
                <Calendar className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Duración</p>
                <p className="font-semibold">
                  {campaign.startDate && campaign.endDate
                    ? `${Math.ceil((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24))} días`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bento-card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                Descripción de la Campaña
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {campaign.description}
              </p>
            </div>

            {/* Brief */}
            {campaign.brief && (
              <div className="bento-card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-brand-500" />
                  Brief de la Campaña
                </h2>

                {campaign.brief.objective && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Objetivo</h3>
                    <p className="text-muted-foreground">{campaign.brief.objective}</p>
                  </div>
                )}

                {campaign.brief.keyMessages && campaign.brief.keyMessages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Mensajes Clave</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {campaign.brief.keyMessages.map((message: string, i: number) => (
                        <li key={i} className="text-muted-foreground">{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {campaign.brief.dos && campaign.brief.dos.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Qué hacer
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {campaign.brief.dos.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {campaign.brief.donts && campaign.brief.donts.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        Qué NO hacer
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {campaign.brief.donts.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {campaign.brief.hashtags && campaign.brief.hashtags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Hashtags</h3>
                    <div className="flex flex-wrap gap-2">
                      {campaign.brief.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deliverables */}
            {campaign.deliverableSpecs?.items && (
              <div className="bento-card p-6">
                <h2 className="text-xl font-semibold mb-4">Entregables Requeridos</h2>
                <div className="space-y-3">
                  {campaign.deliverableSpecs.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                      <Sparkles className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity}x {item.type}
                        </p>
                        {item.duration && (
                          <p className="text-sm text-muted-foreground">Duración: {item.duration}</p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Requisitos</h3>
              <div className="space-y-3">
                {campaign.requirements?.minFollowers && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Seguidores mínimos</p>
                    <p className="font-medium">
                      {campaign.requirements.minFollowers.toLocaleString()}+
                    </p>
                  </div>
                )}

                {campaign.requirements?.platforms?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Plataformas</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.requirements.platforms.map((platform: string) => (
                        <span
                          key={platform}
                          className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-sm"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {campaign.requirements?.niches?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Nichos</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.requirements.niches.map((niche: string) => (
                        <span
                          key={niche}
                          className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm"
                        >
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {campaign.requirements?.countries?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Países</p>
                    <div className="flex flex-wrap gap-2">
                      {campaign.requirements.countries.map((country: string) => (
                        <span
                          key={country}
                          className="px-3 py-1 rounded-full bg-secondary text-sm"
                        >
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Info */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Sobre la Marca</h3>
              <p className="text-muted-foreground mb-3">{campaign.brand.name}</p>
              {campaign.brand.industry.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {campaign.brand.industry.map((ind: string) => (
                    <span
                      key={ind}
                      className="px-3 py-1 rounded-full bg-secondary text-sm"
                    >
                      {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold">Aplicar a la Campaña</h2>
              <p className="text-muted-foreground mt-1">{campaign.title}</p>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-6">
              {/* Proposed Rate */}
              <div>
                <label className="block font-medium mb-2">
                  Tu tarifa propuesta (opcional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="Ej: 1500"
                    value={proposedRate}
                    onChange={(e) => setProposedRate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Si el presupuesto es negociable, propón tu tarifa
                </p>
              </div>

              {/* Pitch */}
              <div>
                <label className="block font-medium mb-2">
                  ¿Por qué eres ideal para esta campaña? *
                </label>
                <textarea
                  required
                  placeholder="Cuéntale a la marca por qué deberían elegirte..."
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Mínimo 100 caracteres
                </p>
              </div>

              {/* Portfolio Links */}
              <div>
                <label className="block font-medium mb-2">
                  Links a tu trabajo (opcional)
                </label>
                <div className="space-y-2">
                  {portfolioLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="url"
                          placeholder="https://instagram.com/p/..."
                          value={link}
                          onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                      </div>
                      {portfolioLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolioLink(index)}
                          className="px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddPortfolioLink}
                  className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  + Agregar otro link
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Aplicación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
