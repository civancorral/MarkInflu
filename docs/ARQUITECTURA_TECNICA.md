# MarkInflu - Arquitectura Técnica y Plan de Desarrollo

## Documento de Especificación Técnica v1.0

**Autor:** CTO / Arquitecto de Software  
**Fecha:** Enero 2026  
**Stack:** Next.js 14 + NestJS + PostgreSQL + Prisma + Stripe Connect + Mux

---

## Índice

1. [Visión General de Arquitectura](#1-visión-general-de-arquitectura)
2. [Análisis del Schema de Base de Datos](#2-análisis-del-schema-de-base-de-datos)
3. [TAREA B: Flujos Críticos de Negocio](#3-tarea-b-flujos-críticos-de-negocio)
4. [TAREA C: Roadmap de Desarrollo](#4-tarea-c-roadmap-de-desarrollo)
5. [Decisiones Arquitectónicas (ADRs)](#5-decisiones-arquitectónicas-adrs)
6. [Estructura de Proyecto Recomendada](#6-estructura-de-proyecto-recomendada)

---

## 1. Visión General de Arquitectura

### 1.1 Diagrama de Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 14 (App Router)                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │ Brand    │  │ Creator  │  │ Admin    │  │ Shared Components    │ │   │
│  │  │ Dashboard│  │ Dashboard│  │ Panel    │  │ (Shadcn/UI + Bento)  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │   │
│  │                           │                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │   Zustand (Global State) + React Query (Server State)         │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS / WebSocket
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         NestJS API Gateway                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Auth     │  │ Campaigns│  │ Media    │  │ Payments │            │   │
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Chat     │  │ Reviews  │  │ Contracts│  │ Analytics│            │   │
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │            │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Prisma ORM (Query Layer)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  PostgreSQL   │          │   Redis         │          │   S3 / R2       │
│  (Primary DB) │          │   (Cache +      │          │   (File         │
│               │          │    Sessions +   │          │    Storage)     │
│               │          │    Pub/Sub)     │          │                 │
└───────────────┘          └─────────────────┘          └─────────────────┘
                                     │
                                     │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ Stripe        │  │ Mux           │  │ Socket.io     │                   │
│  │ Connect       │  │ (Video        │  │ (Real-time)   │                   │
│  │ (Payments)    │  │  Processing)  │  │               │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ Resend        │  │ Meta/TikTok   │  │ Sentry        │                   │
│  │ (Email)       │  │ APIs (V3)     │  │ (Monitoring)  │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Decisiones de Stack Justificadas

| Tecnología | Justificación |
|------------|---------------|
| **Next.js 14 (App Router)** | RSC para SEO en perfiles públicos, Server Actions para operaciones simples, API routes para webhooks |
| **NestJS (Backend separado)** | Arquitectura modular para escalar equipos, soporte nativo para WebSockets, guards y decorators para RBAC |
| **PostgreSQL + Prisma** | Transacciones ACID críticas para pagos, full-text search nativo, JSON fields para flexibilidad |
| **Mux** | Transcoding optimizado, reproductor con soporte para thumbnails a timestamp específico, API robusta |
| **Stripe Connect** | Express accounts para onboarding rápido de creadores, manejo de escrow nativo, split payments |
| **Socket.io** | Rooms para chats y notificaciones, fallback automático, reconexión inteligente |
| **Zustand** | Lightweight, sin boilerplate, excelente para estado de UI (sidebar, modals, filters) |
| **React Query** | Cache inteligente, optimistic updates para UX, background refetching |

---

## 2. Análisis del Schema de Base de Datos

### 2.1 Diagrama de Entidad-Relación Simplificado

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id              │
│ email           │
│ role            │◄──────────────────────────────────────────────────┐
│ stripeConnectId │                                                    │
└────────┬────────┘                                                    │
         │                                                             │
         │ 1:1                                                         │
         ▼                                                             │
┌─────────────────┐     1:N      ┌─────────────────┐     1:N          │
│ CreatorProfile  │◄─────────────│  SocialAccount  │◄─────────────────│
│─────────────────│              │─────────────────│                   │
│ displayName     │              │ platform        │     ┌─────────────┴─────┐
│ bio             │              │ followers       │     │ MetricsSnapshot   │
│ rates (JSON)    │              │ engagementRate  │     │───────────────────│
│ niches[]        │              └─────────────────┘     │ snapshotDate      │
│ languages[]     │                                      │ followers         │
└────────┬────────┘                                      │ audienceData      │
         │                                               └───────────────────┘
         │ 1:N
         ▼
┌─────────────────┐     N:1      ┌─────────────────┐
│   Application   │─────────────►│    Campaign     │
│─────────────────│              │─────────────────│
│ status          │              │ title           │
│ proposedRate    │              │ brief (JSON)    │
│ pitch           │              │ requirements    │
│ proposal (JSON) │              │ budgetMin/Max   │
└────────┬────────┘              │ status          │
         │                       └────────┬────────┘
         │ 1:1                            │
         ▼                                │ 1:N
┌─────────────────┐                       │
│    Contract     │◄──────────────────────┘
│─────────────────│
│ terms (JSON)    │
│ totalAmount     │
│ status          │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌──────────────────┐     1:1      ┌─────────────────────┐
│Milestone│ │   Deliverable    │◄─────────────│ EscrowTransaction   │
│───────│  │──────────────────│              │─────────────────────│
│amount │  │ status           │              │ totalAmount         │
│status │  │ currentVersionId │              │ releasedAmount      │
│trigger│  └────────┬─────────┘              │ status              │
└───────┘           │                        │ stripePaymentIntent │
                    │ 1:N                    └─────────────────────┘
                    ▼
         ┌─────────────────────┐
         │ DeliverableVersion  │
         │─────────────────────│
         │ versionNumber       │
         │ fileUrl             │
         │ videoAssetId (Mux)  │
         │ status              │
         └────────┬────────────┘
                  │ 1:N
                  ▼
         ┌─────────────────────┐
         │   VisualComment     │
         │─────────────────────│
         │ timestamp (float)   │ ◄── Segundo del video (ej: 15.5)
         │ coordinateX (0-1)   │ ◄── Posición horizontal normalizada
         │ coordinateY (0-1)   │ ◄── Posición vertical normalizada
         │ annotationType      │ ◄── POINT, RECTANGLE, FREEHAND, ARROW
         │ text                │
         │ isResolved          │
         │ parentCommentId     │ ◄── Threading para respuestas
         └─────────────────────┘
```

### 2.2 Decisiones de Diseño del Schema

#### 2.2.1 Perfiles Polimórficos

```typescript
// ❌ NO: Herencia con discriminador
model User {
  profile Json // Problema: No type-safety, no relaciones
}

// ✅ SÍ: Tablas separadas con relación 1:1
model User {
  brandProfile    BrandProfile?
  creatorProfile  CreatorProfile?
  agencyProfile   AgencyProfile?
}
```

**Justificación:** Cada tipo de perfil tiene campos muy diferentes. Las relaciones 1:1 opcionales permiten queries específicos sin JOINs innecesarios y mantienen type-safety con Prisma.

#### 2.2.2 JSON Fields para Flexibilidad

```typescript
// Campo rates en CreatorProfile
rates Json?
// Ejemplo de estructura:
// {
//   "instagram": {
//     "story": { "price": 500, "currency": "USD" },
//     "reel": { "price": 1500, "currency": "USD" },
//     "pack_3_stories": { "price": 1200, "currency": "USD", "notes": "24h destacadas" }
//   },
//   "tiktok": {
//     "video": { "price": 2000, "currency": "USD" }
//   }
// }
```

**Justificación:** Las tarifas son altamente variables entre creadores. Un schema relacional requeriría múltiples tablas y JOINs complejos. JSON permite flexibilidad para agregar plataformas y formatos sin migraciones.

#### 2.2.3 Versionado de Entregables

```
Deliverable (contenedor lógico)
    │
    ├── DeliverableVersion (V1) ──── VisualComment[]
    │
    ├── DeliverableVersion (V2) ──── VisualComment[]
    │
    └── DeliverableVersion (V3) ──── VisualComment[] ◄── currentVersionId
```

**Justificación:** Los comentarios visuales están ligados a una versión específica. Cuando el creador sube V2, los comentarios de V1 permanecen intactos para referencia histórica. El campo `currentVersionId` en Deliverable permite saber cuál es la versión activa.

---

## 3. TAREA B: Flujos Críticos de Negocio

### 3.1 Flujo de Revisión de Video (Killer Feature)

#### 3.1.1 Diagrama de Secuencia

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Creator  │      │ Frontend │      │ Backend  │      │   Mux    │      │   DB     │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                 │                 │                 │                 │
     │ 1. Upload Video │                 │                 │                 │
     │────────────────►│                 │                 │                 │
     │                 │                 │                 │                 │
     │                 │ 2. Request      │                 │                 │
     │                 │    Upload URL   │                 │                 │
     │                 │────────────────►│                 │                 │
     │                 │                 │                 │                 │
     │                 │                 │ 3. Create       │                 │
     │                 │                 │    Direct Upload│                 │
     │                 │                 │────────────────►│                 │
     │                 │                 │                 │                 │
     │                 │                 │◄────────────────│                 │
     │                 │                 │  Upload URL +   │                 │
     │                 │                 │  Asset ID       │                 │
     │                 │◄────────────────│                 │                 │
     │                 │                 │                 │                 │
     │                 │ 4. Direct       │                 │                 │
     │                 │    Upload to Mux│                 │                 │
     │                 │─────────────────────────────────►│                 │
     │                 │                 │                 │                 │
     │                 │                 │ 5. Webhook:     │                 │
     │                 │                 │    video.ready  │                 │
     │                 │                 │◄────────────────│                 │
     │                 │                 │                 │                 │
     │                 │                 │ 6. Create       │                 │
     │                 │                 │    Version      │                 │
     │                 │                 │────────────────────────────────►│
     │                 │                 │                 │                 │
     │                 │◄────────────────│                 │                 │
     │                 │  Version Ready  │                 │                 │
     │◄────────────────│                 │                 │                 │
     │   Notification  │                 │                 │                 │
```

#### 3.1.2 Implementación del Reproductor de Video con Comentarios

**Stack para el Player:**
- **Mux Player React** (`@mux/mux-player-react`): Player oficial con soporte para thumbnails
- **React** para el canvas de anotaciones superpuesto
- **Zustand** para estado de comentarios y modo de anotación

```tsx
// components/video-review/VideoReviewPlayer.tsx
'use client';

import MuxPlayer from '@mux/mux-player-react';
import { useRef, useState, useCallback } from 'react';
import { useVideoReviewStore } from '@/stores/video-review-store';
import { AnnotationCanvas } from './AnnotationCanvas';
import { CommentsSidebar } from './CommentsSidebar';
import { CommentMarkers } from './CommentMarkers';

interface VideoReviewPlayerProps {
  playbackId: string;
  deliverableVersionId: string;
  comments: VisualComment[];
  isReviewer: boolean; // true para Brand, false para Creator
}

export function VideoReviewPlayer({ 
  playbackId, 
  deliverableVersionId,
  comments,
  isReviewer 
}: VideoReviewPlayerProps) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    annotationMode, 
    setAnnotationMode,
    pendingComment,
    setPendingComment,
    selectedComment,
    setSelectedComment
  } = useVideoReviewStore();

  // Capturar coordenadas del click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !isReviewer) return;
    
    const container = containerRef.current;
    const player = playerRef.current;
    if (!container || !player) return;

    const rect = container.getBoundingClientRect();
    
    // Coordenadas normalizadas (0-1)
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Timestamp actual del video
    const timestamp = player.currentTime;

    setPendingComment({
      timestamp,
      coordinateX: x,
      coordinateY: y,
      annotationType: annotationMode
    });
  }, [annotationMode, isReviewer, setPendingComment]);

  // Navegar a un comentario específico
  const handleCommentClick = useCallback((comment: VisualComment) => {
    const player = playerRef.current;
    if (!player || comment.timestamp === null) return;
    
    player.currentTime = comment.timestamp;
    player.pause();
    setSelectedComment(comment.id);
  }, [setSelectedComment]);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Video Player Container */}
      <div className="flex-1 relative">
        <div 
          ref={containerRef}
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
          onClick={handleCanvasClick}
        >
          {/* Mux Player */}
          <MuxPlayer
            ref={playerRef}
            playbackId={playbackId}
            streamType="on-demand"
            className="w-full h-full"
            thumbnailTime={0}
            accentColor="#8B5CF6" // Brand color
          />
          
          {/* Capa de anotaciones */}
          <AnnotationCanvas
            comments={comments}
            selectedCommentId={selectedComment}
            pendingComment={pendingComment}
            currentTime={playerRef.current?.currentTime ?? 0}
          />
          
          {/* Marcadores en la línea de tiempo */}
          <CommentMarkers
            comments={comments}
            duration={playerRef.current?.duration ?? 0}
            onMarkerClick={handleCommentClick}
          />
        </div>

        {/* Toolbar de anotación */}
        {isReviewer && (
          <div className="mt-4 flex items-center gap-2">
            <AnnotationToolbar 
              activeMode={annotationMode}
              onModeChange={setAnnotationMode}
            />
          </div>
        )}
      </div>

      {/* Sidebar de comentarios */}
      <CommentsSidebar
        comments={comments}
        deliverableVersionId={deliverableVersionId}
        selectedCommentId={selectedComment}
        onCommentClick={handleCommentClick}
        canResolve={isReviewer}
      />
    </div>
  );
}
```

#### 3.1.3 Canvas de Anotaciones

```tsx
// components/video-review/AnnotationCanvas.tsx
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnnotationCanvasProps {
  comments: VisualComment[];
  selectedCommentId: string | null;
  pendingComment: PendingComment | null;
  currentTime: number;
}

export function AnnotationCanvas({
  comments,
  selectedCommentId,
  pendingComment,
  currentTime
}: AnnotationCanvasProps) {
  // Filtrar comentarios visibles (±0.5 segundos del timestamp actual)
  const visibleComments = useMemo(() => {
    return comments.filter(c => {
      if (c.timestamp === null) return false;
      return Math.abs(c.timestamp - currentTime) < 0.5;
    });
  }, [comments, currentTime]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {visibleComments.map(comment => (
          <AnnotationMarker
            key={comment.id}
            comment={comment}
            isSelected={comment.id === selectedCommentId}
          />
        ))}
        
        {/* Comentario pendiente (preview) */}
        {pendingComment && (
          <AnnotationMarker
            comment={pendingComment}
            isPending
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnotationMarker({ 
  comment, 
  isSelected = false,
  isPending = false 
}: {
  comment: VisualComment | PendingComment;
  isSelected?: boolean;
  isPending?: boolean;
}) {
  const style = {
    left: `${(comment.coordinateX ?? 0) * 100}%`,
    top: `${(comment.coordinateY ?? 0) * 100}%`,
  };

  // Renderizar según tipo de anotación
  switch (comment.annotationType) {
    case 'POINT':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 
            ${isPending ? 'bg-yellow-500/50' : isSelected ? 'bg-purple-500' : 'bg-purple-500/70'}
            rounded-full border-2 border-white shadow-lg pointer-events-auto cursor-pointer
            flex items-center justify-center text-xs font-bold text-white`}
          style={style}
        >
          {!isPending && comment.id?.slice(-2)}
        </motion.div>
      );
    
    case 'RECTANGLE':
      const rectData = comment.annotationData as { width: number; height: number };
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute border-2 ${isPending ? 'border-yellow-500' : 'border-purple-500'} 
            rounded pointer-events-auto cursor-pointer`}
          style={{
            ...style,
            width: `${(rectData?.width ?? 0.1) * 100}%`,
            height: `${(rectData?.height ?? 0.1) * 100}%`,
          }}
        />
      );
    
    case 'FREEHAND':
      const pathData = comment.annotationData as { path: [number, number][] };
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            d={pathData?.path?.map((p, i) => 
              `${i === 0 ? 'M' : 'L'} ${p[0] * 100}% ${p[1] * 100}%`
            ).join(' ')}
            stroke={isPending ? '#EAB308' : '#8B5CF6'}
            strokeWidth="3"
            fill="none"
          />
        </svg>
      );
    
    default:
      return null;
  }
}
```

#### 3.1.4 Backend: Crear Comentario Visual

```typescript
// modules/deliverables/services/visual-comments.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class VisualCommentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createComment(
    userId: string,
    dto: CreateVisualCommentDto,
  ): Promise<VisualComment> {
    // Verificar permisos (solo participantes del contrato)
    const version = await this.prisma.deliverableVersion.findUnique({
      where: { id: dto.deliverableVersionId },
      include: {
        deliverable: {
          include: {
            contract: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Deliverable version not found');
    }

    const { contract } = version.deliverable;
    const isParticipant = 
      contract.brandUserId === userId || 
      contract.creatorUserId === userId;

    if (!isParticipant) {
      throw new ForbiddenException('Not authorized to comment');
    }

    // Crear comentario
    const comment = await this.prisma.visualComment.create({
      data: {
        deliverableVersionId: dto.deliverableVersionId,
        authorUserId: userId,
        timestamp: dto.timestamp,
        coordinateX: dto.coordinateX,
        coordinateY: dto.coordinateY,
        annotationType: dto.annotationType,
        annotationData: dto.annotationData,
        text: dto.text,
        commentType: dto.commentType ?? 'FEEDBACK',
        priority: dto.priority ?? 'NORMAL',
        parentCommentId: dto.parentCommentId,
      },
      include: {
        deliverableVersion: {
          include: {
            deliverable: true,
          },
        },
      },
    });

    // Determinar destinatario de notificación
    const recipientId = userId === contract.brandUserId 
      ? contract.creatorUserId 
      : contract.brandUserId;

    // Enviar notificación
    await this.notifications.create({
      userId: recipientId,
      type: 'VISUAL_COMMENT_ADDED',
      title: 'Nuevo comentario en tu entregable',
      body: `Tienes un nuevo comentario en "${version.deliverable.title}"`,
      referenceType: 'DeliverableVersion',
      referenceId: version.id,
      actionUrl: `/deliverables/${version.deliverableId}?version=${version.versionNumber}&comment=${comment.id}`,
    });

    // Emitir evento real-time via Socket.io
    this.eventEmitter.emit('visual-comment.created', {
      comment,
      contractId: contract.id,
      recipientId,
    });

    return comment;
  }

  async resolveComment(
    userId: string,
    commentId: string,
  ): Promise<VisualComment> {
    const comment = await this.prisma.visualComment.findUnique({
      where: { id: commentId },
      include: {
        deliverableVersion: {
          include: {
            deliverable: {
              include: { contract: true },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Solo el autor del comentario o la marca pueden resolver
    const { contract } = comment.deliverableVersion.deliverable;
    const canResolve = 
      comment.authorUserId === userId || 
      contract.brandUserId === userId;

    if (!canResolve) {
      throw new ForbiddenException('Not authorized to resolve');
    }

    return this.prisma.visualComment.update({
      where: { id: commentId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedByUserId: userId,
      },
    });
  }
}
```

#### 3.1.5 API Endpoints

```typescript
// modules/deliverables/controllers/visual-comments.controller.ts
@Controller('deliverable-versions/:versionId/comments')
@UseGuards(JwtAuthGuard)
export class VisualCommentsController {
  constructor(private commentsService: VisualCommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create visual comment on video' })
  async create(
    @CurrentUser() user: User,
    @Param('versionId') versionId: string,
    @Body() dto: CreateVisualCommentDto,
  ) {
    return this.commentsService.createComment(user.id, {
      ...dto,
      deliverableVersionId: versionId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments for a version' })
  async findAll(
    @Param('versionId') versionId: string,
    @Query('includeResolved') includeResolved?: boolean,
  ) {
    return this.commentsService.findByVersion(versionId, {
      includeResolved: includeResolved ?? true,
    });
  }

  @Patch(':commentId/resolve')
  @ApiOperation({ summary: 'Mark comment as resolved' })
  async resolve(
    @CurrentUser() user: User,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.resolveComment(user.id, commentId);
  }
}
```

---

### 3.2 Flujo de Contratación y Escrow

#### 3.2.1 Diagrama de Secuencia Completo

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Brand   │   │ Frontend │   │ Backend  │   │  Stripe  │   │ Creator  │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │              │
     │ 1. Accept    │              │              │              │
     │    Proposal  │              │              │              │
     │─────────────►│              │              │              │
     │              │ 2. POST      │              │              │
     │              │    /contracts│              │              │
     │              │─────────────►│              │              │
     │              │              │              │              │
     │              │              │ 3. Create    │              │
     │              │              │    Contract  │              │
     │              │              │    (DRAFT)   │              │
     │              │              │──────────────│              │
     │              │              │              │              │
     │              │              │ 4. Create    │              │
     │              │              │    Milestones│              │
     │              │              │──────────────│              │
     │              │              │              │              │
     │              │◄─────────────│              │              │
     │              │  Contract ID │              │              │
     │◄─────────────│              │              │              │
     │              │              │              │              │
     │ 5. Review    │              │              │              │
     │    & Sign    │              │              │              │
     │─────────────►│              │              │              │
     │              │ 6. PATCH     │              │              │
     │              │    /sign     │              │              │
     │              │─────────────►│              │              │
     │              │              │              │              │
     │              │              │ 7. Update    │              │
     │              │              │    brandSignedAt            │
     │              │              │──────────────│              │
     │              │              │              │              │
     │              │              │ 8. Notify    │              │
     │              │              │    Creator   │              │
     │              │              │─────────────────────────────►
     │              │              │              │              │
     │              │              │              │  9. Sign     │
     │              │              │              │◄─────────────│
     │              │              │              │              │
     │              │              │ 10. Create   │              │
     │              │              │     Escrow   │              │
     │              │              │──────────────│              │
     │              │              │              │              │
     │              │              │ 11. Create   │              │
     │              │              │     PaymentIntent           │
     │              │              │     (manual capture)        │
     │              │              │─────────────►│              │
     │              │              │              │              │
     │              │              │◄─────────────│              │
     │              │              │ client_secret│              │
     │              │◄─────────────│              │              │
     │◄─────────────│              │              │              │
     │              │              │              │              │
     │ 12. Enter    │              │              │              │
     │     Card     │              │              │              │
     │─────────────►│              │              │              │
     │              │ 13. Confirm  │              │              │
     │              │     Payment  │              │              │
     │              │─────────────────────────────►              │
     │              │              │              │              │
     │              │              │ 14. Webhook: │              │
     │              │              │     payment_intent.         │
     │              │              │     amount_capturable       │
     │              │              │◄─────────────│              │
     │              │              │              │              │
     │              │              │ 15. Capture  │              │
     │              │              │     Payment  │              │
     │              │              │─────────────►│              │
     │              │              │              │              │
     │              │              │ 16. Update   │              │
     │              │              │     Escrow   │              │
     │              │              │     FUNDED   │              │
     │              │              │──────────────│              │
     │              │              │              │              │
     │              │              │ 17. Notify   │              │
     │              │              │     "Start   │              │
     │              │              │      Work"   │              │
     │              │              │─────────────────────────────►
```

#### 3.2.2 Implementación del Servicio de Contratos

```typescript
// modules/contracts/services/contracts.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EscrowService } from './escrow.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { nanoid } from 'nanoid';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private escrow: EscrowService,
    private notifications: NotificationsService,
  ) {}

  async createFromApplication(
    brandUserId: string,
    applicationId: string,
    terms: ContractTermsDto,
  ): Promise<Contract> {
    // Transacción atómica
    return this.prisma.$transaction(async (tx) => {
      // 1. Obtener y validar aplicación
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: {
          campaign: { include: { brandProfile: true } },
          creatorProfile: { include: { user: true } },
        },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.campaign.brandProfile.userId !== brandUserId) {
        throw new ForbiddenException('Not your campaign');
      }

      if (application.status !== 'SHORTLISTED') {
        throw new BadRequestException('Application must be shortlisted first');
      }

      // 2. Actualizar estado de aplicación
      await tx.application.update({
        where: { id: applicationId },
        data: { 
          status: 'HIRED',
          hiredAt: new Date(),
        },
      });

      // 3. Incrementar contador de creadores en campaña
      await tx.campaign.update({
        where: { id: application.campaignId },
        data: { currentCreators: { increment: 1 } },
      });

      // 4. Crear contrato
      const contract = await tx.contract.create({
        data: {
          campaignId: application.campaignId,
          applicationId: application.id,
          brandUserId: brandUserId,
          creatorUserId: application.creatorProfile.userId,
          contractNumber: `MKI-${nanoid(10).toUpperCase()}`,
          terms: terms,
          totalAmount: terms.totalAmount,
          currency: terms.currency ?? 'USD',
          status: 'DRAFT',
          startDate: terms.startDate,
          endDate: terms.endDate,
        },
      });

      // 5. Crear hitos de pago
      const milestones = terms.milestones ?? this.getDefaultMilestones(terms.totalAmount);
      
      for (let i = 0; i < milestones.length; i++) {
        await tx.milestone.create({
          data: {
            contractId: contract.id,
            title: milestones[i].title,
            description: milestones[i].description,
            amount: milestones[i].amount,
            percentage: milestones[i].percentage,
            triggerType: milestones[i].triggerType,
            triggerCondition: milestones[i].triggerCondition,
            dueDate: milestones[i].dueDate,
            orderIndex: i,
          },
        });
      }

      // 6. Crear entregables desde specs
      if (terms.deliverables) {
        for (let i = 0; i < terms.deliverables.length; i++) {
          await tx.deliverable.create({
            data: {
              contractId: contract.id,
              creatorProfileId: application.creatorProfileId,
              title: terms.deliverables[i].title,
              type: terms.deliverables[i].type,
              specifications: terms.deliverables[i].specifications,
              dueDate: terms.deliverables[i].dueDate,
              orderIndex: i,
            },
          });
        }
      }

      // 7. Notificar al creador
      await this.notifications.create({
        userId: application.creatorProfile.userId,
        type: 'CONTRACT_CREATED',
        title: '¡Has sido seleccionado!',
        body: `Has sido seleccionado para "${application.campaign.title}". Revisa y firma el contrato.`,
        referenceType: 'Contract',
        referenceId: contract.id,
        actionUrl: `/contracts/${contract.id}`,
      });

      return contract;
    });
  }

  private getDefaultMilestones(totalAmount: number) {
    // Por defecto: 30% al firmar, 70% al entregar todo
    return [
      {
        title: 'Pago inicial',
        description: 'Se libera al firmar ambas partes',
        amount: totalAmount * 0.3,
        percentage: 30,
        triggerType: 'CONTRACT_SIGNED',
      },
      {
        title: 'Pago final',
        description: 'Se libera al aprobar todos los entregables',
        amount: totalAmount * 0.7,
        percentage: 70,
        triggerType: 'ALL_DELIVERABLES_APPROVED',
      },
    ];
  }

  async signContract(userId: string, contractId: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: true },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const isBrand = contract.brandUserId === userId;
    const isCreator = contract.creatorUserId === userId;

    if (!isBrand && !isCreator) {
      throw new ForbiddenException('Not a party to this contract');
    }

    // Actualizar firma correspondiente
    const updateData: any = {};
    
    if (isBrand && !contract.brandSignedAt) {
      updateData.brandSignedAt = new Date();
      updateData.status = 'PENDING_CREATOR_SIGNATURE';
    } else if (isCreator && !contract.creatorSignedAt) {
      updateData.creatorSignedAt = new Date();
    }

    // Verificar si ambos firmaron
    const willBothSign = 
      (isBrand && contract.creatorSignedAt) ||
      (isCreator && contract.brandSignedAt);

    if (willBothSign) {
      updateData.status = 'ACTIVE';
      
      // Crear transacción de escrow
      await this.escrow.createEscrowForContract(contract.id);
    }

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });

    // Notificar a la otra parte
    const recipientId = isBrand ? contract.creatorUserId : contract.brandUserId;
    
    await this.notifications.create({
      userId: recipientId,
      type: 'CONTRACT_SIGNED',
      title: willBothSign ? 'Contrato activo' : 'Firma pendiente',
      body: willBothSign 
        ? 'Ambas partes han firmado. El contrato está activo.'
        : `${isBrand ? 'La marca' : 'El creador'} ha firmado el contrato.`,
      referenceType: 'Contract',
      referenceId: contract.id,
    });

    return updated;
  }
}
```

#### 3.2.3 Servicio de Escrow con Stripe

```typescript
// modules/payments/services/escrow.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EscrowService {
  private stripe: Stripe;
  private platformFeePercent = 0.10; // 10% fee

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createEscrowForContract(contractId: string): Promise<{
    escrow: EscrowTransaction;
    clientSecret: string;
  }> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        brandProfile: { include: { user: true } },
        creatorProfile: { include: { user: true } },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const totalAmount = Number(contract.totalAmount);
    const platformFee = totalAmount * this.platformFeePercent;

    // 1. Crear PaymentIntent con manual capture (hold)
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe usa centavos
      currency: contract.currency.toLowerCase(),
      customer: contract.brandProfile.user.stripeCustomerId,
      capture_method: 'manual', // CRÍTICO: No captura automática
      metadata: {
        contractId: contract.id,
        type: 'escrow_deposit',
      },
      // Transfer data para cuando se liberen fondos
      transfer_group: `contract_${contract.id}`,
    });

    // 2. Crear registro de escrow
    const escrow = await this.prisma.escrowTransaction.create({
      data: {
        contractId: contract.id,
        brandUserId: contract.brandUserId,
        creatorUserId: contract.creatorUserId,
        totalAmount: totalAmount,
        platformFee: platformFee,
        currency: contract.currency,
        status: 'PENDING_DEPOSIT',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      escrow,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  // Webhook handler para cuando el pago está listo para capturar
  async handlePaymentIntentAmountCapturable(paymentIntent: Stripe.PaymentIntent) {
    const contractId = paymentIntent.metadata.contractId;
    
    // Capturar el pago (mover de "hold" a "captured")
    const captured = await this.stripe.paymentIntents.capture(paymentIntent.id);

    // Actualizar escrow
    await this.prisma.escrowTransaction.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'FUNDED',
        fundedAt: new Date(),
      },
    });

    // Liberar primer hito si es "CONTRACT_SIGNED"
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { milestones: { orderBy: { orderIndex: 'asc' } } },
    });

    const firstMilestone = contract?.milestones[0];
    if (firstMilestone?.triggerType === 'CONTRACT_SIGNED') {
      await this.releaseMilestone(firstMilestone.id);
    }

    // Notificar al creador que puede empezar
    await this.notifications.create({
      userId: contract.creatorUserId,
      type: 'ESCROW_FUNDED',
      title: 'Fondos asegurados - ¡A trabajar!',
      body: 'La marca ha depositado los fondos. Puedes comenzar a trabajar en los entregables.',
      referenceType: 'Contract',
      referenceId: contractId,
    });
  }

  async releaseMilestone(milestoneId: string): Promise<Payment> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        contract: {
          include: {
            escrowTransaction: true,
            creatorProfile: { include: { user: true } },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.status !== 'READY' && milestone.status !== 'PENDING') {
      throw new BadRequestException('Milestone is not ready for release');
    }

    const { contract } = milestone;
    const { escrowTransaction } = contract;
    const creator = contract.creatorProfile.user;

    if (!creator.stripeConnectId) {
      throw new BadRequestException('Creator has not connected Stripe');
    }

    const amount = Number(milestone.amount);
    const platformFee = amount * this.platformFeePercent;
    const netAmount = amount - platformFee;

    // Crear transfer a la cuenta conectada del creador
    const transfer = await this.stripe.transfers.create({
      amount: Math.round(netAmount * 100),
      currency: contract.currency.toLowerCase(),
      destination: creator.stripeConnectId,
      transfer_group: `contract_${contract.id}`,
      metadata: {
        contractId: contract.id,
        milestoneId: milestone.id,
        type: 'milestone_release',
      },
    });

    // Crear registro de pago
    const payment = await this.prisma.payment.create({
      data: {
        escrowTransactionId: escrowTransaction.id,
        milestoneId: milestone.id,
        recipientUserId: creator.id,
        amount: amount,
        platformFee: platformFee,
        netAmount: netAmount,
        currency: contract.currency,
        type: 'MILESTONE_RELEASE',
        status: 'COMPLETED',
        stripeTransferId: transfer.id,
        completedAt: new Date(),
      },
    });

    // Actualizar milestone
    await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Actualizar escrow
    const newReleasedAmount = Number(escrowTransaction.releasedAmount) + amount;
    const isFullyReleased = newReleasedAmount >= Number(escrowTransaction.totalAmount);

    await this.prisma.escrowTransaction.update({
      where: { id: escrowTransaction.id },
      data: {
        releasedAmount: newReleasedAmount,
        status: isFullyReleased ? 'FULLY_RELEASED' : 'PARTIALLY_RELEASED',
        releasedAt: new Date(),
      },
    });

    // Notificar al creador
    await this.notifications.create({
      userId: creator.id,
      type: 'PAYMENT_RECEIVED',
      title: '¡Pago recibido!',
      body: `Has recibido ${netAmount} ${contract.currency} por "${milestone.title}"`,
      referenceType: 'Payment',
      referenceId: payment.id,
    });

    return payment;
  }
}
```

#### 3.2.4 Webhook Handler de Stripe

```typescript
// modules/payments/controllers/stripe-webhooks.controller.ts
@Controller('webhooks/stripe')
export class StripeWebhooksController {
  constructor(
    private escrowService: EscrowService,
    private configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        await this.escrowService.handlePaymentIntentAmountCapturable(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.succeeded':
        // Log para auditoría
        console.log('Payment captured:', event.data.object.id);
        break;

      case 'transfer.created':
        // Pago al creador exitoso
        console.log('Transfer to creator:', event.data.object.id);
        break;

      case 'account.updated':
        // Estado de cuenta conectada
        await this.handleConnectAccountUpdate(
          event.data.object as Stripe.Account,
        );
        break;
    }

    return { received: true };
  }

  private async handleConnectAccountUpdate(account: Stripe.Account) {
    const isActive = account.charges_enabled && account.payouts_enabled;
    
    await this.prisma.user.updateMany({
      where: { stripeConnectId: account.id },
      data: {
        stripeConnectStatus: isActive ? 'ACTIVE' : 'RESTRICTED',
      },
    });
  }
}
```

---

## 4. TAREA C: Roadmap de Desarrollo

### 4.1 Visión General del Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MARKINFLU ROADMAP                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FASE 1: CORE MVP                    FASE 2: TRANSACTION                    │
│  ═══════════════                     ═══════════════════                    │
│  Semanas 1-6                         Semanas 7-14                           │
│                                                                             │
│  ┌─────────────────────┐            ┌─────────────────────┐                │
│  │ ✓ Auth + Perfiles   │            │ ✓ Chat Real-time    │                │
│  │ ✓ Discovery Básico  │    ──►     │ ✓ Video Upload      │                │
│  │ ✓ Campañas CRUD     │            │ ✓ Visual Review     │                │
│  │ ✓ Aplicaciones      │            │ ✓ Escrow + Pagos    │                │
│  │ ✓ Links Externos    │            │ ✓ Contratos         │                │
│  └─────────────────────┘            └─────────────────────┘                │
│           │                                   │                             │
│           │                                   │                             │
│           ▼                                   ▼                             │
│  FASE 3: INTELLIGENCE                FASE 4: SCALE                         │
│  ═══════════════════                 ═════════════                         │
│  Semanas 15-22                       Semanas 23-30                         │
│                                                                             │
│  ┌─────────────────────┐            ┌─────────────────────┐                │
│  │ ○ Meta/TikTok APIs  │            │ ○ Multi-tenant      │                │
│  │ ○ Auto-Metrics      │    ──►     │ ○ White-label       │                │
│  │ ○ Match Algorithm   │            │ ○ Advanced          │                │
│  │ ○ Audience Insights │            │   Analytics         │                │
│  │ ○ AI Suggestions    │            │ ○ Mobile Apps       │                │
│  └─────────────────────┘            └─────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Fase 1: Core MVP (Semanas 1-6)

**Objetivo:** Plataforma funcional para conectar marcas con creadores y gestionar aplicaciones.

#### Sprint 1-2: Foundation

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Setup proyecto | Next.js 14 + NestJS + Prisma + Docker | 3 días |
| Auth system | NextAuth.js + JWT + email verification | 4 días |
| Base UI | Shadcn/UI + Tailwind + Layout Bento | 3 días |
| User CRUD | Registro por rol, settings | 2 días |
| Schema DB | Implementar Prisma schema completo | 2 días |

**Entregables:**
- Monorepo configurado (Turborepo)
- Sistema de autenticación funcionando
- Layout base con navegación por rol
- Base de datos desplegada

#### Sprint 3-4: Profiles & Discovery

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Creator Profile | Form completo, rates JSON, portfolio links | 4 días |
| Brand Profile | Company info, billing setup | 2 días |
| Discovery UI | Grid de creadores, cards | 3 días |
| Search & Filters | Full-text search, filtros combinados | 4 días |
| Creator Detail | Página pública de perfil | 2 días |

**Entregables:**
- Perfiles completos para ambos roles
- Búsqueda con filtros funcionales
- Páginas de perfil público (SEO ready)

#### Sprint 5-6: Campaigns & Applications

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Campaign CRUD | Crear, editar, publicar campañas | 4 días |
| Campaign Detail | Vista pública con requisitos | 2 días |
| Application Flow | Aplicar a campaña con propuesta | 3 días |
| Brand Dashboard | Gestión de aplicaciones | 3 días |
| Status Workflow | APPLIED → SHORTLISTED → HIRED | 2 días |

**Entregables:**
- Flujo completo de publicación de campañas
- Sistema de aplicaciones funcional
- Dashboard para gestionar candidatos

### 4.3 Fase 2: Transaction & Workflow (Semanas 7-14)

**Objetivo:** Gestión completa del ciclo de trabajo y pagos seguros.

#### Sprint 7-8: Messaging

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Socket.io Setup | Server + Client integration | 2 días |
| Chat Model | Chats, participants, messages | 2 días |
| Chat UI | Lista de conversaciones, composer | 3 días |
| Real-time Messages | Send/receive con typing indicators | 2 días |
| Notifications | Sistema de notificaciones push | 3 días |

**Entregables:**
- Chat 1:1 entre marca y creador
- Notificaciones en tiempo real
- Historial de mensajes

#### Sprint 9-10: Media & Review

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Mux Integration | Account setup, direct uploads | 3 días |
| Upload Flow | Drag & drop, progress, versions | 4 días |
| Video Player | Mux Player + custom controls | 3 días |
| Visual Comments | Canvas, markers, sidebar | 5 días |
| Review Workflow | Submit → Review → Approve/Reject | 2 días |

**Entregables:**
- Upload de videos con transcodificación
- Player con comentarios visuales (KILLER FEATURE)
- Sistema de versiones

#### Sprint 11-12: Contracts & Escrow

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| Contract Service | Generación desde aplicación | 3 días |
| Contract UI | Vista de términos, firma digital | 3 días |
| Stripe Connect | Onboarding de creadores | 4 días |
| Escrow Logic | PaymentIntent + hold + capture | 4 días |
| Milestone Release | Triggers automáticos y manuales | 3 días |

**Entregables:**
- Contratos con firma de ambas partes
- Escrow funcional con Stripe
- Pagos por hitos

#### Sprint 13-14: Polish & Launch Prep

| Tarea | Descripción | Estimación |
|-------|-------------|------------|
| E2E Testing | Cypress/Playwright flows críticos | 4 días |
| Error Handling | Sentry, error boundaries | 2 días |
| Performance | Optimización de queries, caching | 3 días |
| Security Audit | OWASP top 10, pen testing básico | 3 días |
| Documentation | API docs, user guides | 2 días |

**Entregables:**
- Suite de tests E2E
- Monitoring configurado
- Documentación lista

### 4.4 Fase 3: Intelligence (Semanas 15-22)

**Objetivo:** Automatización de métricas y recomendaciones inteligentes.

#### Funcionalidades Principales

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| Meta Graph API | OAuth + metrics fetch | Alta |
| TikTok API | Creator metrics integration | Alta |
| Metrics Scheduler | Cron jobs para snapshots | Media |
| Audience Insights | Demographics parsing | Media |
| Match Algorithm | Scoring brand-creator fit | Alta |
| AI Suggestions | Recomendaciones de creadores | Alta |

**Consideraciones Técnicas:**

```typescript
// Ejemplo de Match Score Algorithm
interface MatchScore {
  creatorId: string;
  score: number; // 0-100
  factors: {
    nicheMatch: number;      // Coincidencia de nicho
    budgetFit: number;       // Dentro del rango de presupuesto
    audienceOverlap: number; // Demografía de audiencia vs target
    engagementQuality: number; // Engagement rate vs benchmark
    availabilityScore: number; // Disponibilidad actual
    historyScore: number;    // Performance en campañas anteriores
  };
}

// Weights configurables por campaña
const defaultWeights = {
  nicheMatch: 0.25,
  budgetFit: 0.20,
  audienceOverlap: 0.25,
  engagementQuality: 0.15,
  availabilityScore: 0.05,
  historyScore: 0.10,
};
```

### 4.5 Fase 4: Scale (Semanas 23-30)

**Objetivo:** Preparar la plataforma para crecimiento masivo.

| Feature | Descripción |
|---------|-------------|
| Multi-tenant | Soporte para agencias con sub-cuentas |
| White-label | Customización de branding por cliente |
| Advanced Analytics | Dashboards con Metabase/Cube.js |
| Mobile Apps | React Native para iOS/Android |
| API Pública | REST API para integraciones |

---

## 5. Decisiones Arquitectónicas (ADRs)

### ADR-001: Monorepo vs Polyrepo

**Decisión:** Monorepo con Turborepo

**Razones:**
- Compartir tipos TypeScript entre frontend y backend
- Atomic commits para features cross-cutting
- Simplified CI/CD pipeline
- Consistencia de dependencias

**Estructura:**
```
markinflu/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   └── admin/        # Admin panel (opcional)
├── packages/
│   ├── database/     # Prisma schema + client
│   ├── config/       # Shared configs (ESLint, TS)
│   ├── ui/           # Shared UI components
│   └── types/        # Shared TypeScript types
└── turbo.json
```

### ADR-002: Server Actions vs API Separada

**Decisión:** Híbrido - Server Actions para operaciones simples, NestJS para lógica compleja

**Server Actions (Next.js):**
- Mutations simples (update profile, toggle settings)
- Operaciones que no requieren WebSockets
- Validación de formularios

**NestJS API:**
- Lógica de negocio compleja (escrow, contracts)
- WebSocket gateway (chat, notifications)
- Webhooks (Stripe, Mux)
- Jobs en background (metrics sync)

### ADR-003: Estrategia de Caching

```typescript
// Layers de cache
┌─────────────────────────────────────────┐
│  Browser Cache (React Query)            │  TTL: 5min
├─────────────────────────────────────────┤
│  Edge Cache (Vercel/Cloudflare)         │  TTL: 1min (public pages)
├─────────────────────────────────────────┤
│  Redis Cache                            │  TTL: variable
│  - Sessions                             │  TTL: 24h
│  - User permissions                     │  TTL: 5min
│  - Search results                       │  TTL: 1min
│  - Creator metrics                      │  TTL: 1h
├─────────────────────────────────────────┤
│  PostgreSQL                             │  Source of truth
└─────────────────────────────────────────┘
```

---

## 6. Estructura de Proyecto Recomendada

```
markinflu/
├── apps/
│   ├── web/                          # Next.js 14 App
│   │   ├── app/
│   │   │   ├── (auth)/              # Auth routes
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── verify/
│   │   │   ├── (dashboard)/         # Protected routes
│   │   │   │   ├── brand/
│   │   │   │   │   ├── campaigns/
│   │   │   │   │   ├── contracts/
│   │   │   │   │   └── settings/
│   │   │   │   ├── creator/
│   │   │   │   │   ├── applications/
│   │   │   │   │   ├── deliverables/
│   │   │   │   │   └── earnings/
│   │   │   │   └── shared/
│   │   │   │       ├── chat/
│   │   │   │       └── notifications/
│   │   │   ├── (public)/            # Public pages
│   │   │   │   ├── creators/
│   │   │   │   │   └── [slug]/
│   │   │   │   └── campaigns/
│   │   │   │       └── [slug]/
│   │   │   └── api/                 # API routes & webhooks
│   │   │       └── webhooks/
│   │   │           ├── stripe/
│   │   │           └── mux/
│   │   ├── components/
│   │   │   ├── ui/                  # Shadcn components
│   │   │   ├── layouts/
│   │   │   ├── forms/
│   │   │   └── features/
│   │   │       ├── video-review/
│   │   │       ├── chat/
│   │   │       └── campaign/
│   │   ├── lib/
│   │   │   ├── api/                 # API client (react-query)
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── stores/                  # Zustand stores
│   │
│   └── api/                          # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── campaigns/
│       │   │   ├── applications/
│       │   │   ├── contracts/
│       │   │   ├── deliverables/
│       │   │   ├── payments/
│       │   │   ├── chat/
│       │   │   └── notifications/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   └── interceptors/
│       │   ├── prisma/
│       │   └── config/
│       └── test/
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       └── client.ts
│   ├── config/
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   ├── ui/
│   │   └── src/
│   │       └── components/
│   └── types/
│       └── src/
│           ├── user.ts
│           ├── campaign.ts
│           └── contract.ts
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Apéndices

### A. Variables de Entorno Requeridas

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/markinflu"

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_CLIENT_ID="ca_..."

# Mux
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
MUX_WEBHOOK_SECRET="..."

# Redis
REDIS_URL="redis://localhost:6379"

# Email
RESEND_API_KEY="..."

# Storage
S3_BUCKET="markinflu-assets"
S3_REGION="us-east-1"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
```

### B. Endpoints API Principales (v1)

| Method | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login |
| GET | `/creators` | Listar creadores (discovery) |
| GET | `/creators/:slug` | Detalle de creador |
| GET | `/campaigns` | Listar campañas públicas |
| POST | `/campaigns` | Crear campaña (Brand) |
| POST | `/campaigns/:id/apply` | Aplicar a campaña (Creator) |
| GET | `/applications` | Mis aplicaciones |
| PATCH | `/applications/:id/status` | Cambiar estado |
| POST | `/contracts` | Crear contrato desde aplicación |
| POST | `/contracts/:id/sign` | Firmar contrato |
| POST | `/deliverables/:id/versions` | Subir nueva versión |
| POST | `/deliverable-versions/:id/comments` | Crear comentario visual |
| GET | `/escrow/:contractId` | Estado del escrow |
| POST | `/milestones/:id/release` | Liberar pago de hito |
| GET | `/chat` | Mis conversaciones |
| POST | `/chat/:id/messages` | Enviar mensaje |

---

*Documento generado como arquitectura técnica para MarkInflu. Sujeto a revisión y actualización durante el desarrollo.*
