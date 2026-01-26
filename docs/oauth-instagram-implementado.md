# ✅ OAuth Instagram - Implementación Completada

## 🎉 Resumen

Se ha implementado exitosamente el flujo OAuth completo para Instagram, permitiendo a los creadores conectar sus cuentas de Instagram y obtener datos básicos del perfil.

## 📁 Archivos Implementados

### 1. API OAuth Instagram - Inicio del flujo
**Archivo:** [apps/web/src/app/api/auth/oauth/instagram/route.ts](../apps/web/src/app/api/auth/oauth/instagram/route.ts)

**Funcionalidad:**
- Valida que el usuario esté autenticado y sea CREATOR
- Construye la URL de autorización de Instagram
- Incluye state con userId para seguridad (CSRF protection)
- Redirige al usuario a Instagram para autorización

**Endpoint:** `GET /api/auth/oauth/instagram`

### 2. API OAuth Callback - Manejo de respuesta
**Archivo:** [apps/web/src/app/api/auth/oauth/callback/route.ts](../apps/web/src/app/api/auth/oauth/callback/route.ts)

**Funcionalidad:**
- Maneja el callback de Instagram (y otras plataformas)
- Valida el state para prevenir ataques CSRF
- Intercambia código de autorización por access token
- Convierte short-lived token a long-lived token (60 días)
- Obtiene información del perfil de Instagram
- Guarda/actualiza la cuenta social en la base de datos
- Redirige al perfil con mensaje de éxito/error

**Endpoint:** `GET /api/auth/oauth/callback`

### 3. Componente Social Accounts Manager - Actualizado
**Archivo:** [apps/web/src/app/(dashboard)/dashboard/profile/components/social-accounts-manager.tsx](../apps/web/src/app/(dashboard)/dashboard/profile/components/social-accounts-manager.tsx)

**Cambios:**
- Botón "Conectar Instagram" ahora redirige a `/api/auth/oauth/instagram`
- Preparado para YouTube y TikTok (pendientes de implementar)

### 4. Página de Perfil - Actualizada
**Archivo:** [apps/web/src/app/(dashboard)/dashboard/profile/page.tsx](../apps/web/src/app/(dashboard)/dashboard/profile/page.tsx)

**Cambios:**
- Lee parámetros de URL después del callback OAuth
- Muestra toast de éxito cuando se conecta Instagram
- Muestra toast de error si algo falla
- Limpia la URL después de mostrar el mensaje

### 5. Documentación Creada

1. **[docs/oauth-instagram-setup.md](../docs/oauth-instagram-setup.md)**
   - Guía paso a paso para crear app en Meta for Developers
   - Configuración de Instagram Basic Display
   - Obtención de credenciales
   - Limitaciones de la API

2. **[docs/oauth-testing-guide.md](../docs/oauth-testing-guide.md)**
   - Guía completa de testing
   - Troubleshooting común
   - Verificación de conexión
   - Próximos pasos

3. **[apps/web/.env.example](../apps/web/.env.example)**
   - Template de variables de entorno
   - Incluye todas las plataformas OAuth

## 🔄 Flujo Completo Implementado

```
1. Usuario → Click "Conectar Instagram"
         ↓
2. Navegador → GET /api/auth/oauth/instagram
         ↓
3. API → Validación de sesión
         ↓
4. API → Redirige a Instagram con state
         ↓
5. Instagram → Usuario autoriza la app
         ↓
6. Instagram → Callback a /api/auth/oauth/callback?code=XXX&state=YYY
         ↓
7. API → Valida state
         ↓
8. API → Intercambia code por access_token (short-lived)
         ↓
9. API → Intercambia short-lived por long-lived token (60 días)
         ↓
10. API → Obtiene perfil de Instagram (username, media_count)
         ↓
11. API → Guarda en base de datos (SocialAccount)
         ↓
12. API → Redirige a /dashboard/profile?connected=instagram&username=XXX
         ↓
13. UI → Muestra toast de éxito
         ↓
14. UI → Muestra Instagram en lista de redes conectadas
```

## 📊 Datos Obtenidos de Instagram

Con **Instagram Basic Display API**, puedes obtener:

### ✅ Disponible:
- `username` - Nombre de usuario (@usuario)
- `id` - ID de Instagram del usuario
- `account_type` - Tipo de cuenta (PERSONAL, BUSINESS, MEDIA_CREATOR)
- `media_count` - Número total de publicaciones

### ❌ NO Disponible (requiere Instagram Graph API):
- Followers count
- Following count
- Engagement rate
- Likes/comments por publicación
- Stories
- Insights avanzados

## ⚙️ Configuración Requerida

### Variables de Entorno (.env.local)

```env
# Instagram OAuth
INSTAGRAM_CLIENT_ID="tu_app_id_de_meta"
INSTAGRAM_CLIENT_SECRET="tu_app_secret"
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/oauth/callback"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera_con_openssl_rand_-base64_32"
```

### En Meta for Developers

1. App creada en https://developers.facebook.com/
2. Instagram Basic Display configurado
3. Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/oauth/callback`
4. Cuenta de Instagram agregada como tester
5. Invitación aceptada en Instagram

## 🧪 Cómo Probar

1. **Configurar credenciales** (ver [oauth-instagram-setup.md](../docs/oauth-instagram-setup.md))

2. **Iniciar servidor:**
   ```bash
   cd apps/web
   pnpm dev
   ```

3. **Navegar a perfil:**
   ```
   http://localhost:3000/dashboard/profile
   ```

4. **Click en "Conectar Instagram"**

5. **Autorizar en Instagram**

6. **Verificar conexión exitosa**

Ver guía completa en [oauth-testing-guide.md](../docs/oauth-testing-guide.md)

## 🔐 Seguridad Implementada

1. **CSRF Protection:**
   - State parameter con userId, platform y timestamp
   - Validación de state en callback

2. **Timestamp Validation:**
   - Requests expirados después de 10 minutos
   - Previene replay attacks

3. **Session Validation:**
   - Solo usuarios autenticados pueden iniciar OAuth
   - Solo CREATORS pueden conectar redes sociales

4. **Token Expiration:**
   - Long-lived tokens válidos por 60 días
   - `tokenExpiresAt` guardado en BD para refresh futuro

## ⚠️ Limitaciones Conocidas

### 1. No hay followers/engagement

**Problema:** Instagram Basic Display no proporciona métricas de followers.

**Soluciones:**
- **Corto plazo:** Pedir al usuario que ingrese manualmente
- **Largo plazo:** Implementar Instagram Graph API (requiere Business account)

### 2. Tokens expiran en 60 días

**Problema:** Los tokens long-lived expiran.

**Solución (pendiente):**
- Implementar token refresh automático
- Crear cron job que refresque tokens antes de expirar

### 3. Solo usuarios testers en desarrollo

**Problema:** En modo sandbox, solo testers pueden conectar.

**Solución:**
- Para producción, la app debe pasar revisión de Meta
- Subir app a "Live Mode"

## 🚀 Próximos Pasos

### 1. Token Refresh (Recomendado)
Crear job que refresque tokens antes de que expiren:

```typescript
// Pseudo-código
async function refreshInstagramToken(accountId: string) {
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId }
  });

  const response = await fetch(
    `https://graph.instagram.com/refresh_access_token?` +
    `grant_type=ig_refresh_token&access_token=${account.accessToken}`
  );

  const { access_token, expires_in } = await response.json();

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: {
      accessToken: access_token,
      tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
    }
  });
}
```

### 2. Implementar YouTube OAuth
Seguir patrón similar:
- Crear `/api/auth/oauth/youtube/route.ts`
- Usar Google OAuth 2.0
- Obtener datos de YouTube Data API v3

### 3. Implementar TikTok OAuth
- Crear `/api/auth/oauth/tiktok/route.ts`
- Usar TikTok Login Kit
- Obtener datos de TikTok API

### 4. Sincronización de Métricas
Crear job periódico que actualice:
- Media count
- Otras métricas disponibles
- Ejecutar diariamente o semanalmente

### 5. Encriptación de Tokens
Encriptar access tokens antes de guardar:

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  // ... implementación
}
```

### 6. Instagram Graph API (Opcional)
Para obtener métricas completas:
1. Convertir cuenta a Business/Creator
2. Conectar con Facebook Page
3. Solicitar permisos adicionales
4. Pasar revisión de Meta
5. Usar endpoints de Graph API para followers, engagement, etc.

## 📚 Referencias

- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [OAuth 2.0 Flow](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions)
- [Long-Lived Tokens](https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens)

---

**Estado:** ✅ Implementación completa y funcional
**Plataforma:** Instagram
**API:** Instagram Basic Display API
**Siguiente:** YouTube OAuth
