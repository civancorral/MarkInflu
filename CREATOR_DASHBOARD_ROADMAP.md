# 🎯 Roadmap de Desarrollo - Vista de Creador

## 📊 Estado Actual

### ✅ Completado
- Dashboard principal con estadísticas básicas
- Layout y navegación
- Onboarding de creadores
- Sistema de autenticación

### 🚧 Rutas definidas pero sin implementar
- `/dashboard/opportunities` - Descubrir campañas
- `/dashboard/applications` - Mis aplicaciones
- `/dashboard/contracts` - Contratos activos
- `/dashboard/deliverables` - Entregables
- `/dashboard/messages` - Mensajería
- `/dashboard/earnings` - Ganancias
- `/dashboard/analytics` - Estadísticas
- `/dashboard/profile` - Perfil

---

## 🗓️ Plan de Desarrollo por Fases

### **FASE 1: Oportunidades y Aplicaciones** 🎯
**Prioridad:** ALTA | **Duración estimada:** 2-3 horas
**Valor de negocio:** Permite a creadores descubrir y aplicar a campañas

#### 1.1 Vista de Oportunidades (Descubrir Campañas)
- [ ] Página `/dashboard/opportunities/page.tsx`
- [ ] Componente de filtros (nicho, presupuesto, plataforma)
- [ ] Grid de tarjetas de campañas disponibles
- [ ] Vista detallada de campaña individual
- [ ] Formulario de aplicación a campaña
- [ ] API: `GET /api/campaigns` (filtrado por requisitos)
- [ ] API: `POST /api/campaigns/[id]/apply`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/opportunities/
├── page.tsx                    (Lista de campañas)
├── [id]/page.tsx              (Detalle de campaña)
├── campaign-filters.tsx        (Filtros de búsqueda)
├── campaign-opportunity-card.tsx
└── apply-modal.tsx            (Modal de aplicación)

apps/web/src/app/api/campaigns/
└── [id]/apply/route.ts        (Endpoint para aplicar)
```

#### 1.2 Vista de Mis Aplicaciones
- [ ] Página `/dashboard/applications/page.tsx`
- [ ] Lista de aplicaciones enviadas
- [ ] Estados: Pending, Under Review, Shortlisted, Hired, Rejected
- [ ] Detalle de aplicación con timeline
- [ ] Opción de retirar aplicación (withdraw)
- [ ] API: `GET /api/applications/my-applications`
- [ ] API: `PATCH /api/applications/[id]` (retirar)

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/applications/
├── page.tsx                    (Lista de aplicaciones)
├── [id]/page.tsx              (Detalle de aplicación)
├── application-card.tsx
├── application-status-badge.tsx
└── application-timeline.tsx

apps/web/src/app/api/applications/
├── my-applications/route.ts
└── [id]/route.ts
```

---

### **FASE 2: Contratos y Entregables** 📝
**Prioridad:** ALTA | **Duración estimada:** 3-4 horas
**Valor de negocio:** Core del workflow - gestión de trabajo activo

#### 2.1 Vista de Contratos
- [ ] Página `/dashboard/contracts/page.tsx`
- [ ] Lista de contratos (Active, Completed, Cancelled)
- [ ] Detalle de contrato con términos
- [ ] Timeline de milestones (hitos de pago)
- [ ] Estado de pagos por milestone
- [ ] Documentos del contrato (PDF)
- [ ] Chat integrado por contrato
- [ ] API: `GET /api/contracts/my-contracts`
- [ ] API: `GET /api/contracts/[id]`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/contracts/
├── page.tsx                    (Lista de contratos)
├── [id]/page.tsx              (Detalle de contrato)
├── contract-card.tsx
├── contract-terms-view.tsx
├── milestone-timeline.tsx
└── contract-chat.tsx

apps/web/src/app/api/contracts/
├── my-contracts/route.ts
└── [id]/route.ts
```

#### 2.2 Vista de Entregables
- [ ] Página `/dashboard/deliverables/page.tsx`
- [ ] Lista de entregables pendientes y completados
- [ ] Upload de contenido (video/imagen)
- [ ] Sistema de versiones (V1, V2, V3...)
- [ ] Integración con Mux para videos
- [ ] Sistema de comentarios visuales (timestamped)
- [ ] Estado: Pending, Draft, In Review, Approved, Changes Requested
- [ ] API: `GET /api/deliverables/my-deliverables`
- [ ] API: `POST /api/deliverables/[id]/versions`
- [ ] API: `GET /api/deliverables/[id]/comments`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/deliverables/
├── page.tsx                    (Lista de entregables)
├── [id]/page.tsx              (Detalle + upload)
├── deliverable-card.tsx
├── upload-zone.tsx
├── video-player-with-comments.tsx
├── version-history.tsx
└── visual-comments-panel.tsx

apps/web/src/app/api/deliverables/
├── my-deliverables/route.ts
├── [id]/route.ts
└── [id]/versions/route.ts
```

---

### **FASE 3: Perfil y Redes Sociales** 👤
**Prioridad:** MEDIA | **Duración estimada:** 2-3 horas
**Valor de negocio:** Permite optimizar perfil para atraer marcas

#### 3.1 Vista de Perfil
- [ ] Página `/dashboard/profile/page.tsx`
- [ ] Edición de información personal
- [ ] Gestión de nichos y tipos de contenido
- [ ] Portfolio (links a contenido externo)
- [ ] Configuración de tarifas por plataforma/formato
- [ ] Gestión de redes sociales
- [ ] Integración OAuth (Instagram, TikTok, YouTube)
- [ ] Preview de perfil público
- [ ] API: `GET /api/creators/profile`
- [ ] API: `PATCH /api/creators/profile`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/profile/
├── page.tsx                    (Vista principal)
├── edit/page.tsx              (Modo edición)
├── profile-header.tsx
├── social-accounts-manager.tsx
├── rates-configurator.tsx
├── portfolio-section.tsx
└── profile-preview.tsx

apps/web/src/app/api/creators/profile/
└── social-accounts/route.ts
```

---

### **FASE 4: Ganancias y Pagos** 💰
**Prioridad:** MEDIA | **Duración estimada:** 2-3 horas
**Valor de negocio:** Transparencia financiera

#### 4.1 Vista de Ganancias
- [ ] Página `/dashboard/earnings/page.tsx`
- [ ] Dashboard financiero con métricas
- [ ] Historial de pagos recibidos
- [ ] Próximos pagos (pending milestones)
- [ ] Gráficas de ingresos (mensual, anual)
- [ ] Desglose por campaña
- [ ] Estado de Stripe Connect
- [ ] Configuración de payout
- [ ] API: `GET /api/payments/earnings`
- [ ] API: `GET /api/payments/history`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/earnings/
├── page.tsx                    (Dashboard de earnings)
├── earnings-overview.tsx
├── payment-history-table.tsx
├── upcoming-payments.tsx
├── earnings-chart.tsx
└── payout-settings.tsx

apps/web/src/app/api/payments/
├── earnings/route.ts
└── history/route.ts
```

---

### **FASE 5: Mensajería** 💬
**Prioridad:** MEDIA-BAJA | **Duración estimada:** 3-4 horas
**Valor de negocio:** Comunicación directa con marcas

#### 5.1 Sistema de Mensajería
- [ ] Página `/dashboard/messages/page.tsx`
- [ ] Lista de conversaciones
- [ ] Chat en tiempo real (Socket.io)
- [ ] Notificaciones de mensajes nuevos
- [ ] Adjuntar archivos
- [ ] Mensajes del sistema (contract signed, deliverable approved)
- [ ] API: `GET /api/chats`
- [ ] API: `GET /api/chats/[id]/messages`
- [ ] API: `POST /api/chats/[id]/messages`
- [ ] WebSocket endpoint

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/messages/
├── page.tsx                    (Layout con lista + chat)
├── chat-list.tsx
├── chat-window.tsx
├── message-bubble.tsx
└── message-input.tsx

apps/web/src/app/api/chats/
├── route.ts
└── [id]/messages/route.ts
```

---

### **FASE 6: Analíticas** 📈
**Prioridad:** BAJA | **Duración estimada:** 2-3 horas
**Valor de negocio:** Insights de performance

#### 6.1 Vista de Analytics
- [ ] Página `/dashboard/analytics/page.tsx`
- [ ] Métricas de perfil (vistas, favoritos)
- [ ] Tasa de conversión de aplicaciones
- [ ] Evolución de followers por red social
- [ ] Engagement rate histórico
- [ ] Top campañas por earnings
- [ ] Comparativa de performance
- [ ] API: `GET /api/creators/analytics`

**Archivos a crear:**
```
apps/web/src/app/(dashboard)/dashboard/analytics/
├── page.tsx                    (Dashboard de analytics)
├── profile-metrics.tsx
├── application-funnel.tsx
├── social-growth-chart.tsx
├── campaign-performance.tsx
└── engagement-trends.tsx

apps/web/src/app/api/creators/
└── analytics/route.ts
```

---

## 🎯 Recomendación de Orden de Implementación

### Sprint 1 (Más crítico)
1. **Oportunidades** - Sin esto, los creadores no pueden descubrir trabajo
2. **Aplicaciones** - Necesario para aplicar a campañas
3. **Contratos** - Ver términos del trabajo aceptado

### Sprint 2 (Core workflow)
4. **Entregables** - Upload de contenido y sistema de review
5. **Perfil** - Optimizar presencia para atraer marcas

### Sprint 3 (Valor agregado)
6. **Ganancias** - Transparencia financiera
7. **Mensajería** - Comunicación directa

### Sprint 4 (Nice to have)
8. **Analíticas** - Insights de performance

---

## 💡 Notas de Implementación

### Estrategia de Optimización
- **Componentes reutilizables**: Status badges, loading skeletons, empty states
- **API compartida**: Prisma queries optimizados con includes
- **Real-time**: Socket.io solo para mensajería (Fase 5)
- **Upload de archivos**: Usar servicio existente (MinIO o Cloudinary)
- **Video processing**: Mux ya está en el stack

### Priorización por Valor de Negocio
1. **ALTA**: Oportunidades, Aplicaciones, Contratos, Entregables
2. **MEDIA**: Perfil, Ganancias
3. **BAJA**: Mensajería, Analíticas

### Consideraciones Técnicas
- Todas las vistas deben ser responsive
- Implementar skeleton loaders para mejor UX
- Manejar estados de error elegantemente
- Optimizar queries con paginación donde sea necesario
- Implementar permisos (solo el creador puede ver sus datos)

---

## 📝 Próximos Pasos

**Para comenzar con Fase 1:**
```bash
# Crear estructura de archivos
mkdir -p apps/web/src/app/\(dashboard\)/dashboard/opportunities
mkdir -p apps/web/src/app/\(dashboard\)/dashboard/applications
mkdir -p apps/web/src/app/api/campaigns/[id]/apply
mkdir -p apps/web/src/app/api/applications
```

**Preguntas clave antes de empezar:**
1. ¿Quieres empezar por la Fase 1 (Oportunidades)?
2. ¿Prefieres un enfoque de MVP rápido o implementación completa por fase?
3. ¿Hay alguna funcionalidad específica que consideres más prioritaria?
