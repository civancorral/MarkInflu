# 🔐 OAuth en Producción - Configuración

## ⚠️ Cambios Necesarios para Producción

Cuando despliegues a producción en `https://markinflu.socialmindcrm.com`, necesitas actualizar la configuración OAuth.

---

## 📱 Instagram OAuth - Producción

### 1. Actualizar Redirect URIs en Meta for Developers

1. **Ir a Meta for Developers:**
   - https://developers.facebook.com/
   - Selecciona tu app de MarkInflu

2. **Instagram Basic Display → Basic Display:**
   - Scroll a "Client OAuth Settings"

3. **Agregar URLs de producción:**

   **Valid OAuth Redirect URIs:**
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/callback
   http://localhost:3000/api/auth/oauth/callback
   ```
   *(Mantén localhost para desarrollo local)*

   **Deauthorize Callback URL:**
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/deauthorize
   ```

   **Data Deletion Request URL:**
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/delete
   ```

4. **Save Changes**

### 2. Actualizar Variables de Entorno en Servidor

En el servidor, editar `apps/web/.env.local`:

```bash
# En el servidor
ssh root@173.249.40.63
nano /var/www/markinflu/apps/web/.env.local
```

Actualizar:
```env
# Instagram OAuth
INSTAGRAM_CLIENT_ID="tu_app_id"
INSTAGRAM_CLIENT_SECRET="tu_app_secret"
INSTAGRAM_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"

# NextAuth
NEXTAUTH_URL="https://markinflu.socialmindcrm.com"
```

### 3. Reiniciar Aplicación

```bash
cd /var/www/markinflu
pm2 restart markinflu-web
```

### 4. Probar OAuth en Producción

1. Ir a: https://markinflu.socialmindcrm.com/dashboard/profile
2. Click en "Conectar Instagram"
3. Debería redirigir correctamente y volver a tu app

---

## 🎥 YouTube OAuth - Producción

### 1. Configurar en Google Cloud Console

1. **Ir a Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Credenciales → OAuth 2.0 Client IDs → Tu Cliente:**

3. **Agregar URIs autorizados:**

   **Authorized JavaScript origins:**
   ```
   https://markinflu.socialmindcrm.com
   ```

   **Authorized redirect URIs:**
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/callback
   http://localhost:3000/api/auth/oauth/callback
   ```

4. **Guardar**

### 2. Variables de Entorno

```env
# YouTube OAuth
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

---

## 🎵 TikTok OAuth - Producción

### 1. Configurar en TikTok for Developers

1. **Ir a TikTok for Developers:**
   - https://developers.tiktok.com/

2. **Tu App → Settings:**

3. **Redirect URIs:**
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/callback
   http://localhost:3000/api/auth/oauth/callback
   ```

4. **Guardar**

### 2. Variables de Entorno

```env
# TikTok OAuth
TIKTOK_CLIENT_KEY="tu_tiktok_client_key"
TIKTOK_CLIENT_SECRET="tu_tiktok_client_secret"
TIKTOK_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"
```

---

## 🔒 Modo Live vs Sandbox

### Instagram

**Modo Sandbox (Desarrollo):**
- Solo usuarios testers pueden autorizar
- No requiere revisión de app
- Limitado a 25 usuarios

**Modo Live (Producción):**
Para pasar a Live:

1. **Completar información de la app:**
   - Política de privacidad (URL pública)
   - Términos de servicio (URL pública)
   - Icono de la app (1024x1024 px)
   - Categoría de la app

2. **Pasar App Review:**
   - Solo si necesitas permisos adicionales
   - Instagram Basic Display no requiere revisión
   - Instagram Graph API sí requiere revisión

3. **Cambiar a Live Mode:**
   - Settings → App Modes
   - Toggle "Live" mode

### YouTube

**Modo Testing:**
- Limitado a 100 usuarios de prueba
- No requiere verificación

**Modo Producción:**
- Requiere verificación de Google
- Proceso puede tomar semanas
- Necesario para más de 100 usuarios

### TikTok

**Modo Sandbox:**
- Para desarrollo y testing
- Limitado

**Modo Producción:**
- Requiere aprobación de TikTok
- Solicitar acceso a Login Kit

---

## 📋 Checklist de Producción

### Instagram
- [ ] URLs de producción agregadas en Meta
- [ ] `INSTAGRAM_REDIRECT_URI` actualizado en servidor
- [ ] `NEXTAUTH_URL` actualizado a HTTPS
- [ ] Aplicación reiniciada
- [ ] OAuth probado en producción
- [ ] App en modo Live (si necesario)

### YouTube
- [ ] URLs agregadas en Google Cloud Console
- [ ] Variables de entorno configuradas
- [ ] OAuth probado

### TikTok
- [ ] URLs agregadas en TikTok Developers
- [ ] Variables de entorno configuradas
- [ ] OAuth probado

### General
- [ ] Todos los Redirect URIs son HTTPS
- [ ] NextAuth URL es HTTPS
- [ ] Certificado SSL válido
- [ ] DNS configurado correctamente

---

## 🔍 Verificar Configuración

### 1. Verificar Variables de Entorno

```bash
# En el servidor
cd /var/www/markinflu
cat apps/web/.env.local | grep -E "INSTAGRAM|NEXTAUTH|GOOGLE|TIKTOK"
```

Deberías ver todas las URLs con `https://markinflu.socialmindcrm.com`

### 2. Probar OAuth

Para cada plataforma:

1. Login en la app de producción
2. Ir a `/dashboard/profile`
3. Click en "Conectar [Plataforma]"
4. Verificar que:
   - Redirige correctamente
   - No hay errores de redirect_uri
   - Vuelve a la app después de autorizar
   - Toast de éxito aparece
   - Cuenta aparece conectada

### 3. Ver Logs

```bash
# Ver logs de OAuth callback
pm2 logs markinflu-web | grep oauth

# Ver logs de Nginx
sudo tail -f /var/log/nginx/markinflu_access.log | grep oauth
```

---

## 🐛 Troubleshooting Producción

### Error: "redirect_uri_mismatch"

**Causa:** La URL de callback no coincide exactamente.

**Solución:**
1. Verificar que en Meta/Google/TikTok tienes exactamente:
   ```
   https://markinflu.socialmindcrm.com/api/auth/oauth/callback
   ```
2. Verificar `.env.local` en servidor
3. No debe haber espacios, http vs https, www, etc.
4. Reiniciar app: `pm2 restart markinflu-web`

### Error: "invalid_client"

**Causa:** Client ID o Secret incorrectos.

**Solución:**
1. Verificar credenciales en Meta/Google/TikTok
2. Copiar nuevamente a `.env.local`
3. Reiniciar app

### OAuth funciona en local pero no en producción

**Verificar:**
1. DNS está propagado: `nslookup markinflu.socialmindcrm.com`
2. SSL funciona: visitar https://markinflu.socialmindcrm.com
3. URLs de producción están en la plataforma OAuth
4. `.env.local` usa URLs de producción, no localhost
5. App reiniciada después de cambios

### App en modo Sandbox/Testing

**Para Instagram:**
- Agregar usuarios como testers
- O pasar app a modo Live

**Para YouTube:**
- Agregar usuarios de prueba en Google Cloud Console
- O completar proceso de verificación

---

## 📄 Documentos Requeridos para Modo Live

### Política de Privacidad

Debe incluir:
- Qué datos recopilas (username, media count)
- Cómo los usas (mostrar en perfil)
- Cuánto tiempo los guardas
- Cómo los proteges
- Derecho a eliminación

Ejemplo de URL:
```
https://markinflu.socialmindcrm.com/privacy-policy
```

### Términos de Servicio

Debe incluir:
- Uso aceptable de la plataforma
- Responsabilidades del usuario
- Limitaciones de responsabilidad
- Proceso de cancelación

Ejemplo de URL:
```
https://markinflu.socialmindcrm.com/terms-of-service
```

### Data Deletion Request

Endpoint que maneja solicitudes de eliminación de datos:
```
https://markinflu.socialmindcrm.com/api/auth/oauth/delete
```

**Implementación básica:**

```typescript
// apps/web/src/app/api/auth/oauth/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signed_request } = body;

    // TODO: Parse signed_request
    // TODO: Delete user data from database
    // TODO: Log deletion request

    // Return confirmation URL
    return NextResponse.json({
      url: 'https://markinflu.socialmindcrm.com/data-deleted',
      confirmation_code: 'unique_code_here',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Seguridad Adicional para Producción

### 1. Encriptar Access Tokens

```typescript
// Ejemplo de encriptación
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 chars
const algorithm = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 2. Rate Limiting

Implementar rate limiting para endpoints OAuth:

```typescript
// Ejemplo con redis
import Redis from 'ioredis';

const redis = new Redis();

async function checkRateLimit(ip: string, limit = 10): Promise<boolean> {
  const key = `ratelimit:oauth:${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // 1 hora
  }

  return count <= limit;
}
```

### 3. Logging de OAuth

```typescript
// Log todos los intentos de OAuth
await prisma.oAuthLog.create({
  data: {
    platform: 'INSTAGRAM',
    userId: session.user.id,
    action: 'CONNECT_INITIATED',
    ip: req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
    success: true,
  },
});
```

---

## ✅ Checklist Final de OAuth en Producción

- [ ] URLs de producción configuradas en todas las plataformas
- [ ] Variables de entorno actualizadas en servidor
- [ ] NEXTAUTH_URL es HTTPS
- [ ] SSL funciona correctamente
- [ ] OAuth de Instagram probado en producción
- [ ] OAuth de YouTube configurado (si aplica)
- [ ] OAuth de TikTok configurado (si aplica)
- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados
- [ ] Endpoint de eliminación de datos implementado
- [ ] Tokens encriptados en base de datos (recomendado)
- [ ] Rate limiting implementado (recomendado)
- [ ] Logging de OAuth implementado (recomendado)

---

**Última actualización:** 2026-01-25
**Versión:** 1.0.0
