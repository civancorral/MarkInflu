'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  File,
  Video,
  Image as ImageIcon,
  Download,
  Eye,
  Send,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

interface Version {
  id: string;
  versionNumber: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl: string | null;
  duration: number | null;
  uploadedAt: string;
  comments: Array<{
    id: string;
    content: string;
    timestamp: number | null;
    createdAt: string;
    author: {
      id: string;
      email: string;
      role: string;
    };
  }>;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  contract: {
    id: string;
    campaign: {
      id: string;
      title: string;
      brand: {
        name: string;
        logo: string | null;
        industry: string[];
      };
    };
  };
  versions: Version[];
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: Clock,
    description: 'Aún no has subido ningún archivo',
  },
  DRAFT: {
    label: 'Borrador',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: FileText,
    description: 'Tienes archivos guardados pero no enviados para revisión',
  },
  IN_REVIEW: {
    label: 'En revisión',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: Eye,
    description: 'La marca está revisando tu contenido',
  },
  CHANGES_REQUESTED: {
    label: 'Cambios solicitados',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: AlertCircle,
    description: 'Se requieren cambios en el contenido',
  },
  APPROVED: {
    label: 'Aprobado',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: CheckCircle2,
    description: '¡Tu contenido ha sido aprobado!',
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: XCircle,
    description: 'El contenido no fue aprobado',
  },
};

export default function DeliverableDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliverable();
  }, [params.id]);

  const fetchDeliverable = async () => {
    try {
      const response = await fetch(`/api/deliverables/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDeliverable(data);
      } else {
        toast.error('Entregable no encontrado');
        router.push('/dashboard/deliverables');
      }
    } catch (error) {
      console.error('Error fetching deliverable:', error);
      toast.error('Error al cargar el entregable');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // In a real implementation, you would upload to S3/MinIO here
      // For now, we'll simulate the upload
      toast.info('La funcionalidad de upload se implementará con MinIO/S3');

      // Example structure for when you implement real upload:
      // const formData = new FormData();
      // formData.append('file', file);
      // const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
      // const { fileUrl, thumbnailUrl } = await uploadResponse.json();

      // const response = await fetch(`/api/deliverables/${params.id}/versions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     fileUrl,
      //     fileName: file.name,
      //     fileSize: file.size,
      //     mimeType: file.type,
      //     thumbnailUrl,
      //   }),
      // });

      // if (response.ok) {
      //   toast.success('Archivo subido exitosamente');
      //   fetchDeliverable();
      // }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir archivo');
    } finally {
      setUploading(false);
    }
  }, [params.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading || deliverable?.status === 'APPROVED',
  });

  const handleSubmitForReview = async () => {
    if (!deliverable) return;

    if (deliverable.versions.length === 0) {
      toast.error('Debes subir al menos un archivo antes de enviar para revisión');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/deliverables/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });

      if (response.ok) {
        toast.success('Entregable enviado para revisión');
        fetchDeliverable();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al enviar para revisión');
      }
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      toast.error('Error al enviar para revisión');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!deliverable) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[deliverable.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;
  const latestVersion = deliverable.versions[0];
  const canUpload = !['APPROVED', 'IN_REVIEW'].includes(deliverable.status);
  const canSubmit = deliverable.status === 'DRAFT' && deliverable.versions.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/deliverables"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a entregables
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-400 to-purple-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                  {deliverable.contract.campaign.brand.logo ? (
                    <img
                      src={deliverable.contract.campaign.brand.logo}
                      alt={deliverable.contract.campaign.brand.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-brand-500" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">{deliverable.title}</h1>
                <p className="text-muted-foreground">{deliverable.contract.campaign.title}</p>
              </div>
            </div>

            {canSubmit && (
              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Enviando...' : 'Enviar para revisión'}
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
            {/* Status Card */}
            <div className={`bento-card p-6 border-2 ${statusConfig.color}`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-current/10">
                  <StatusIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{statusConfig.label}</h3>
                  <p className="text-sm opacity-90">{statusConfig.description}</p>
                </div>
              </div>
            </div>

            {/* Rejection/Changes Reason */}
            {(deliverable.status === 'CHANGES_REQUESTED' || deliverable.status === 'REJECTED') && deliverable.rejectionReason && (
              <div className="bento-card p-6 border-2 border-yellow-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Comentarios de la marca
                </h3>
                <p className="text-muted-foreground">{deliverable.rejectionReason}</p>
              </div>
            )}

            {/* Upload Zone */}
            {canUpload && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-4">Subir archivo</h3>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                    isDragActive
                      ? 'border-brand-500 bg-brand-500/5'
                      : 'border-border hover:border-brand-500/50 hover:bg-brand-500/5'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                  {uploading ? (
                    <p className="text-lg font-medium mb-2">Subiendo archivo...</p>
                  ) : isDragActive ? (
                    <p className="text-lg font-medium mb-2">Suelta el archivo aquí</p>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">
                        Arrastra un archivo o haz clic para seleccionar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Soporta videos, imágenes y documentos
                      </p>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Nota: La funcionalidad de upload se integrará con MinIO/S3
                </p>
              </div>
            )}

            {/* Versions History */}
            {deliverable.versions.length > 0 && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-4">
                  Historial de versiones ({deliverable.versions.length})
                </h3>
                <div className="space-y-4">
                  {deliverable.versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-lg border ${index === 0 ? 'border-brand-500/30 bg-brand-500/5' : 'border-border'}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                            <File className="w-5 h-5 text-brand-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{version.fileName}</p>
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-medium">
                                  Última
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Versión {version.versionNumber} · {formatFileSize(version.fileSize)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={version.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Descargar
                        </a>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Subido el {new Date(version.uploadedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Comments */}
                      {version.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm font-medium mb-2">
                            Comentarios ({version.comments.length})
                          </p>
                          <div className="space-y-2">
                            {version.comments.map((comment) => (
                              <div key={comment.id} className="p-3 rounded-lg bg-secondary">
                                <p className="text-sm mb-1">{comment.content}</p>
                                <p className="text-xs text-muted-foreground">
                                  {comment.author.email} - {new Date(comment.createdAt).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {deliverable.description && (
              <div className="bento-card p-6">
                <h3 className="font-semibold text-lg mb-3">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-line">{deliverable.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Información</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                  <p className="font-medium">{deliverable.type}</p>
                </div>

                {deliverable.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de entrega</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(deliverable.dueDate).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {deliverable.submittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Enviado el</p>
                    <p className="font-medium">
                      {new Date(deliverable.submittedAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {deliverable.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aprobado el</p>
                    <p className="font-medium text-green-500">
                      {new Date(deliverable.approvedAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Estado</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Link */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Contrato</h3>
              <Link
                href={`/dashboard/contracts/${deliverable.contract.id}`}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver contrato
              </Link>
            </div>

            {/* Brand Info */}
            <div className="bento-card p-6">
              <h3 className="font-semibold mb-4">Marca</h3>
              <p className="font-medium mb-2">{deliverable.contract.campaign.brand.name}</p>
              {deliverable.contract.campaign.brand.industry.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deliverable.contract.campaign.brand.industry.map((ind: string) => (
                    <span key={ind} className="px-2 py-1 rounded-md bg-secondary text-xs">
                      {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
