# 🧪 Guía de Testing - OAuth Instagram

## Pre-requisitos

Antes de comenzar, asegúrate de tener:

1. ✅ App creada en Meta for Developers
2. ✅ Instagram Basic Display configurado
3. ✅ Tu cuenta de Instagram como tester
4. ✅ Invitación de tester aceptada en Instagram
5. ✅ Credenciales (Client ID y Secret) copiadas

## Paso 1: Configurar Variables de Entorno

1. **Copia el archivo de ejemplo:**
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. **Edita `.env.local` y agrega tus credenciales:**
   ```env
   # Instagram OAuth
   INSTAGRAM_CLIENT_ID="1234567890123456"  # Tu App ID de Instagram
   INSTAGRAM_CLIENT_SECRET="abc123def456..."  # Tu App Secret
   INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/oauth/callback"

   # NextAuth (si aún no lo tienes)
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="genera_uno_con: openssl rand -base64 32"
   ```

3. **Genera NEXTAUTH_SECRET si no lo tienes:**
   ```bash
   openssl rand -base64 32
   ```

## Paso 2: Iniciar el Servidor

```bash
# Desde la raíz del proyecto
cd apps/web
pnpm dev
```

El servidor debería iniciar en `http://localhost:3000`

## Paso 3: Acceder como Creador

1. **Inicia sesión** en la aplicación con una cuenta de tipo `CREATOR`

2. **Verifica que tengas un perfil de creador:**
   - Si no lo tienes, completa el onboarding primero

3. **Navega a tu perfil:**
   ```
   http://localhost:3000/dashboard/profile
   ```

## Paso 4: Conectar Instagram

### 4.1 Click en "Conectar Instagram"

En la sección de "Redes Sociales", deberías ver un botón/card que dice **"Conectar Instagram"**.

**Click en el botón.**

### 4.2 Flujo OAuth

Esto iniciará el flujo OAuth:

1. **Redirección a Instagram:**
   - Serás redirigido a `https://api.instagram.com/oauth/authorize`
   - Verás la página de autorización de Instagram

2. **Autorizar la aplicación:**
   - Instagram te mostrará qué permisos solicita la app:
     - Acceso a tu perfil básico
     - Acceso a tus publicaciones
   - Click en **"Autorizar"** (o "Allow")

3. **Callback automático:**
   - Instagram te redirigirá de vuelta a tu app
   - URL: `http://localhost:3000/api/auth/oauth/callback?code=XXX&state=YYY`

4. **Procesamiento:**
   - La app intercambiará el código por un access token
   - Obtendrá tu información de perfil
   - Guardará los datos en la base de datos
   - Te redirigirá a `/dashboard/profile`

5. **Confirmación:**
   - Deberías ver un toast de éxito: "¡Instagram conectado exitosamente! (@tu_username)"
   - Tu cuenta de Instagram aparecerá en la lista de redes sociales conectadas

## Paso 5: Verificar la Conexión

### 5.1 En la UI

En `/dashboard/profile` deberías ver:

✅ **Card de Instagram con:**
- Username (@tu_usuario)
- Badge "Conectada"
- Número de publicaciones (media_count)
- Botón "Desconectar"
- Última actualización

### 5.2 En la Base de Datos

```sql
-- Conecta a tu base de datos
psql -U user -d markinflu

-- Verifica que la cuenta se guardó
SELECT
  platform,
  username,
  "isConnected",
  "postsCount",
  "lastSyncAt"
FROM "SocialAccount"
WHERE platform = 'INSTAGRAM';
```

Deberías ver:
- `platform`: INSTAGRAM
- `username`: tu_usuario_de_instagram
- `isConnected`: true
- `postsCount`: número de posts (si está disponible)
- `lastSyncAt`: fecha/hora actual

## Paso 6: Probar Desconexión (Opcional)

1. **Click en "Desconectar"** en la card de Instagram
2. La cuenta debería desconectarse (isConnected = false)
3. El access token debería eliminarse de la BD

## 🐛 Troubleshooting

### Error: "Autorización denegada"

**Causa:** Clickeaste "Cancelar" en Instagram

**Solución:** Vuelve a intentar y click en "Autorizar"

---

### Error: "Configuración OAuth incompleta"

**Causa:** Faltan variables de entorno

**Solución:**
1. Verifica que `.env.local` existe
2. Verifica que `INSTAGRAM_CLIENT_ID` y `INSTAGRAM_CLIENT_SECRET` están configurados
3. Reinicia el servidor: `Ctrl+C` y `pnpm dev`

---

### Error: "Failed to exchange token"

**Causas posibles:**
1. Client Secret incorrecto
2. Redirect URI no coincide

**Solución:**
1. Verifica las credenciales en Meta for Developers
2. Verifica que el Redirect URI en Meta coincida exactamente:
   ```
   http://localhost:3000/api/auth/oauth/callback
   ```
3. No debe tener `/` al final
4. Debe ser HTTP (no HTTPS) para desarrollo local

---

### Error: "You are not a tester"

**Causa:** Tu cuenta de Instagram no está agregada como tester

**Solución:**
1. Ve a Meta for Developers → Tu App → Instagram Basic Display
2. Click en "Add or Remove Instagram Testers"
3. Busca tu usuario y agrégalo
4. **IMPORTANTE:** Ve a Instagram → Settings → Apps and Websites → Tester Invites
5. Acepta la invitación

---

### Error: "Invalid redirect_uri"

**Causa:** El Redirect URI en tu código no coincide con el configurado en Meta

**Solución:**
1. Verifica `INSTAGRAM_REDIRECT_URI` en `.env.local`
2. Debe ser exactamente: `http://localhost:3000/api/auth/oauth/callback`
3. Ve a Meta for Developers y verifica que este URI esté en la lista de "Valid OAuth Redirect URIs"

---

### No aparecen followers/engagement

**Esto es normal.** Instagram Basic Display API tiene limitaciones:

✅ **Lo que SÍ puedes obtener:**
- Username
- Account type
- Media count (publicaciones)

❌ **Lo que NO puedes obtener:**
- Followers count
- Following count
- Engagement rate
- Likes/comments individuales

**Soluciones:**
1. **Corto plazo:** Pide al usuario que ingrese manualmente sus métricas
2. **Largo plazo:** Implementa Instagram Graph API (requiere Business account)

## 📊 Verificación Final

Si todo funciona correctamente:

- ✅ Click en "Conectar Instagram" redirige a Instagram
- ✅ Autorizar en Instagram redirige de vuelta a tu app
- ✅ Toast de éxito aparece
- ✅ Instagram aparece en "Redes Conectadas"
- ✅ Username es visible
- ✅ Badge "Conectada" aparece
- ✅ Registro en base de datos existe
- ✅ `isConnected = true` en BD
- ✅ `accessToken` existe en BD (encriptado idealmente)

## 🎯 Próximos Pasos

Una vez que Instagram OAuth funcione:

1. **Implementar token refresh:**
   - Los tokens de Instagram expiran en 60 días
   - Crea un job que refresque tokens antes de que expiren

2. **Implementar YouTube OAuth:**
   - Sigue un patrón similar
   - Usa Google OAuth

3. **Implementar TikTok OAuth:**
   - Similar, pero con TikTok's OAuth flow

4. **Sincronización de métricas:**
   - Crea un cron job que actualice métricas periódicamente
   - Si usas Instagram Graph API, puedes obtener followers/engagement

5. **Encriptar tokens:**
   - Encripta `accessToken` antes de guardar en BD
   - Usa una librería como `crypto` de Node.js

---

**¿Problemas?** Revisa los logs de la consola del servidor y del navegador para más detalles.
