# 🔐 OAuth Integration - MarkInflu

Esta documentación cubre la integración completa de OAuth para conectar redes sociales de creadores.

## 📚 Índice de Documentación

### 🚀 Para Empezar (Start Here!)

1. **[OAUTH_CHECKLIST.md](./OAUTH_CHECKLIST.md)** ⭐
   - Checklist paso a paso para configurar OAuth de Instagram
   - Perfecto para empezar desde cero
   - Incluye troubleshooting común

### 📖 Guías Detalladas

2. **[oauth-instagram-setup.md](./oauth-instagram-setup.md)**
   - Guía completa de configuración en Meta for Developers
   - Cómo crear la app y obtener credenciales
   - Explicación de limitaciones de Instagram Basic Display API

3. **[oauth-testing-guide.md](./oauth-testing-guide.md)**
   - Cómo probar la integración OAuth localmente
   - Troubleshooting detallado
   - Verificación de conexión exitosa

4. **[oauth-instagram-implementado.md](./oauth-instagram-implementado.md)**
   - Detalles técnicos de la implementación
   - Flujo completo del OAuth
   - Seguridad implementada
   - Próximos pasos recomendados

### 📋 Resúmenes

5. **[fase-3-resumen.md](./fase-3-resumen.md)**
   - Resumen general de la Fase 3
   - Todas las funcionalidades implementadas
   - Estado del proyecto

## 🎯 Quick Start

### Opción 1: Checklist Interactivo (Recomendado)
```bash
# Abre el checklist y sigue los pasos
cat docs/OAUTH_CHECKLIST.md
```

### Opción 2: Configuración Rápida
Si ya tienes experiencia con OAuth:

1. **Crear app en Meta:** https://developers.facebook.com/
2. **Copiar credenciales** (App ID y Secret)
3. **Configurar .env.local:**
   ```bash
   cd apps/web
   cp .env.example .env.local
   # Editar .env.local con tus credenciales
   ```
4. **Iniciar servidor:**
   ```bash
   pnpm dev
   ```
5. **Probar:** http://localhost:3000/dashboard/profile

## 🌟 Estado de Implementación

| Plataforma | Estado | Documentación | Notas |
|------------|--------|---------------|-------|
| Instagram | ✅ Completo | [Setup](./oauth-instagram-setup.md), [Testing](./oauth-testing-guide.md) | Instagram Basic Display API |
| YouTube | 🟡 Pendiente | TBD | Usar Google OAuth |
| TikTok | 🟡 Pendiente | TBD | Usar TikTok Login Kit |
| Twitter/X | 🟡 Pendiente | TBD | Usar X API v2 |

## 📁 Archivos Implementados

### APIs OAuth
```
apps/web/src/app/api/auth/oauth/
├── instagram/
│   └── route.ts          ✅ Iniciar flujo OAuth Instagram
├── callback/
│   └── route.ts          ✅ Callback unificado (todas las plataformas)
├── youtube/
│   └── route.ts          🟡 Pendiente
└── tiktok/
    └── route.ts          🟡 Pendiente
```

### Componentes
```
apps/web/src/app/(dashboard)/dashboard/profile/
├── page.tsx                                    ✅ Vista de perfil
├── edit/page.tsx                               ✅ Edición de perfil
├── actions.ts                                  ✅ Server actions
└── components/
    ├── profile-header.tsx                      ✅
    ├── social-accounts-manager.tsx             ✅ (con OAuth funcional)
    ├── rates-configurator.tsx                  ✅
    └── portfolio-section.tsx                   ✅
```

### Configuración
```
apps/web/
├── .env.example          ✅ Template de variables de entorno
└── .env.local            ⚠️  Debes crear este archivo
```

### Documentación
```
docs/
├── README-OAUTH.md                    ✅ Este archivo
├── OAUTH_CHECKLIST.md                 ✅ Checklist interactivo
├── oauth-instagram-setup.md           ✅ Configuración Meta
├── oauth-testing-guide.md             ✅ Guía de testing
├── oauth-instagram-implementado.md    ✅ Detalles técnicos
└── fase-3-resumen.md                  ✅ Resumen Fase 3
```

## 🔑 Variables de Entorno Necesarias

```env
# Instagram OAuth
INSTAGRAM_CLIENT_ID="tu_app_id"
INSTAGRAM_CLIENT_SECRET="tu_app_secret"
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/oauth/callback"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera_con_openssl_rand_-base64_32"
```

## 🎬 Flujo OAuth Completo

```
Usuario en Perfil
       ↓
Click "Conectar Instagram"
       ↓
GET /api/auth/oauth/instagram
       ↓
Redirige a api.instagram.com
       ↓
Usuario autoriza
       ↓
Callback a /api/auth/oauth/callback?code=XXX
       ↓
Intercambia code por access_token
       ↓
Obtiene long-lived token (60 días)
       ↓
Fetch perfil de Instagram
       ↓
Guarda en BD (SocialAccount)
       ↓
Redirige a /dashboard/profile?connected=instagram
       ↓
Toast de éxito ✅
```

## 📊 Datos Obtenidos

### Instagram Basic Display API

**✅ Disponible:**
- Username (@usuario)
- ID de usuario
- Account type (PERSONAL, BUSINESS, CREATOR)
- Media count (publicaciones)

**❌ NO Disponible:**
- Followers count
- Following count
- Engagement rate
- Likes/comments
- Stories

**💡 Solución:** Para métricas completas, usar Instagram Graph API (requiere Business account)

## 🔐 Seguridad

- ✅ CSRF Protection con state parameter
- ✅ Timestamp validation (10 min expiration)
- ✅ Session validation (solo CREATORS)
- ✅ Long-lived tokens (60 días)
- ✅ Token expiration tracking
- ⚠️  Token encryption (pendiente - recomendado)

## 🚀 Próximos Pasos

### Inmediato
1. [ ] Seguir [OAUTH_CHECKLIST.md](./OAUTH_CHECKLIST.md)
2. [ ] Configurar credenciales en Meta
3. [ ] Probar conexión de Instagram

### Corto Plazo
1. [ ] Implementar token refresh automático
2. [ ] Encriptar access tokens en BD
3. [ ] Implementar YouTube OAuth
4. [ ] Implementar TikTok OAuth

### Largo Plazo
1. [ ] Migrar a Instagram Graph API
2. [ ] Sincronización automática de métricas
3. [ ] Dashboard de analytics por plataforma
4. [ ] Notificaciones de token expiration

## 🐛 Problemas Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Configuración OAuth incompleta" | Faltan variables de entorno | Verificar `.env.local` existe y tiene las variables |
| "Failed to exchange token" | Credenciales incorrectas | Verificar Client ID y Secret en Meta |
| "Invalid redirect_uri" | URI no coincide | Verificar URI en Meta y `.env.local` son idénticos |
| "You are not a tester" | No agregado como tester | Agregar en Meta y aceptar en Instagram |
| "No followers mostrados" | Limitación de API | Normal - Instagram Basic Display no provee followers |

Ver [oauth-testing-guide.md](./oauth-testing-guide.md) para troubleshooting detallado.

## 📞 Soporte

**Documentación Oficial:**
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions)

**Recursos Internos:**
- [Checklist](./OAUTH_CHECKLIST.md)
- [Setup Guide](./oauth-instagram-setup.md)
- [Testing Guide](./oauth-testing-guide.md)

## ✨ Contribuir

Para agregar una nueva plataforma OAuth:

1. Crear API route en `/api/auth/oauth/[platform]/route.ts`
2. Agregar manejo en `/api/auth/oauth/callback/route.ts`
3. Actualizar `SocialAccountsManager` component
4. Documentar en `docs/oauth-[platform]-setup.md`
5. Agregar al checklist
6. Actualizar este README

---

**Última actualización:** 2026-01-25
**Estado:** Instagram ✅ Completo | YouTube/TikTok 🟡 Pendiente
**Versión:** 1.0.0
