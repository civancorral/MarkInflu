# MarkInflu - Plataforma de Influencer Marketing

## 🚀 Quick Start

### Prerrequisitos

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 1. Clonar e instalar

```bash
# Clonar repositorio
git clone <repo-url>
cd markinflu

# Instalar dependencias
pnpm install
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
```

### 3. Iniciar servicios de desarrollo

```bash
# Iniciar PostgreSQL, Redis, MinIO, Mailpit
docker-compose up -d

# Generar cliente Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# Cargar datos de prueba
pnpm --filter @markinflu/database db:seed
```

### 4. Ejecutar aplicaciones

```bash
# Desarrollo (todos los servicios)
pnpm dev

# O ejecutar individualmente:
pnpm --filter @markinflu/web dev    # Frontend: http://localhost:3000
pnpm --filter @markinflu/api dev    # API: http://localhost:4000
```

## 📁 Estructura del Proyecto

```
markinflu/
├── apps/
│   ├── web/                 # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── lib/         # Utilities & config
│   │   │   └── styles/      # Global styles
│   │   └── ...
│   │
│   └── api/                 # NestJS backend
│       └── src/
│           ├── common/      # Shared services (Prisma, Redis)
│           └── modules/     # Feature modules
│
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── types/               # Shared TypeScript types
│   └── config-typescript/   # Shared TS configs
│
├── docker-compose.yml       # Local development services
├── turbo.json               # Turborepo config
└── package.json             # Root package.json
```

## 🔗 URLs de Desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api/docs |
| Prisma Studio | http://localhost:5555 |
| Mailpit (Email) | http://localhost:8025 |
| MinIO Console | http://localhost:9001 |

## 📚 Comandos Útiles

```bash
# Desarrollo
pnpm dev                    # Iniciar todo
pnpm build                  # Build de producción
pnpm lint                   # Linting
pnpm typecheck              # Type checking

# Base de datos
pnpm db:generate            # Generar Prisma Client
pnpm db:migrate             # Ejecutar migraciones
pnpm db:push                # Push schema sin migración
pnpm db:studio              # Abrir Prisma Studio
pnpm db:seed                # Cargar datos de prueba

# Docker
docker-compose up -d        # Iniciar servicios
docker-compose down         # Detener servicios
docker-compose logs -f      # Ver logs
```

## 🔐 Cuentas de Prueba

Después de ejecutar el seed:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@markinflu.com | Admin123! |
| Marca | demo-brand@markinflu.com | Brand123! |
| Creador | sofia.lifestyle@markinflu.com | Creator123! |
| Creador | carlos.tech@markinflu.com | Creator123! |
| Creador | ana.fitness@markinflu.com | Creator123! |

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Auth**: NextAuth.js

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Real-time**: Socket.io
- **Video**: Mux
- **Payments**: Stripe Connect

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Containerization**: Docker

## 📋 Roadmap

### ✅ Fase 1: Core MVP (Completado)
- Setup monorepo
- Autenticación (NextAuth + JWT)
- Perfiles (Brand/Creator)
- Discovery de creadores
- Campañas CRUD

### 🚧 Fase 2: Transaction & Workflow (En progreso)
- Sistema de mensajería real-time
- Video review con comentarios visuales
- Contratos digitales
- Escrow con Stripe Connect

### 📅 Fase 3: Intelligence (Próximo)
- Integración APIs sociales (Meta, TikTok)
- Métricas automáticas
- Algoritmo de matching
- Recomendaciones AI

### 📅 Fase 4: Scale (Futuro)
- Multi-tenant (Agencias)
- White-label
- Analytics avanzados
- Mobile apps

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Propietario - Todos los derechos reservados
