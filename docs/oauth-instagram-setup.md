# 🔐 Configuración OAuth - Instagram/Facebook

## Paso 1: Crear App en Meta for Developers

### 1.1 Crear Cuenta de Desarrollador

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Facebook
3. Si es tu primera vez, acepta los términos como desarrollador

### 1.2 Crear Nueva App

1. Click en **"Mis Apps"** → **"Crear App"**
2. Selecciona tipo de app: **"Consumidor"** (para Instagram Basic Display)
3. Completa el formulario:
   - **Nombre de la app:** MarkInflu Dev (o el nombre que prefieras)
   - **Email de contacto:** tu email
   - **Propósito de la app:** Empresa
4. Click en **"Crear app"**

### 1.3 Configurar Instagram Basic Display

1. En el dashboard de tu app, busca **"Instagram Basic Display"**
2. Click en **"Configurar"** (Setup)
3. En la página de configuración, scroll hasta **"Basic Display"**

### 1.4 Configurar OAuth Redirect URIs

1. En la sección **"Client OAuth Settings"**, agrega:
   ```
   Valid OAuth Redirect URIs:
   - http://localhost:3000/api/auth/oauth/callback
   - https://tudominio.com/api/auth/oauth/callback (para producción)
   ```

2. En **"Deauthorize Callback URL"**:
   ```
   http://localhost:3000/api/auth/oauth/deauthorize
   ```

3. En **"Data Deletion Request URL"**:
   ```
   http://localhost:3000/api/auth/oauth/delete
   ```

4. Click en **"Save Changes"**

### 1.5 Obtener Credenciales

1. En la misma página, encontrarás:
   - **Instagram App ID** (este es tu Client ID)
   - **Instagram App Secret** (este es tu Client Secret)

2. Copia estos valores, los necesitarás en el `.env`

### 1.6 Agregar Cuenta de Prueba

1. Ve a la sección **"User Token Generator"**
2. Click en **"Add or Remove Instagram Testers"**
3. Agrega tu cuenta de Instagram como tester:
   - Busca tu usuario de Instagram
   - Click en **"Add"**

4. **IMPORTANTE:** Debes aceptar la invitación desde tu cuenta de Instagram:
   - Ve a tu perfil de Instagram
   - Settings → Apps and Websites → Tester Invites
   - Acepta la invitación

### 1.7 Permisos y Scopes

Los scopes disponibles con Instagram Basic Display son:
- `user_profile` - Obtener información básica del perfil
- `user_media` - Obtener fotos y videos del usuario

**Nota:** Instagram Basic Display tiene limitaciones. Para métricas avanzadas (followers count, engagement, etc.) necesitarías **Instagram Graph API** que requiere Business/Creator account.

## Paso 2: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env` en `apps/web/`:

```env
# Instagram OAuth
INSTAGRAM_CLIENT_ID=tu_instagram_app_id
INSTAGRAM_CLIENT_SECRET=tu_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/oauth/callback

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera_un_secret_aleatorio_aqui
```

Para generar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Paso 3: Limitaciones de Instagram Basic Display

⚠️ **Importante:** Instagram Basic Display API tiene estas limitaciones:

### ✅ Lo que SÍ puedes obtener:
- ID de usuario
- Username
- Account type (BUSINESS, MEDIA_CREATOR, PERSONAL)
- Media count (número de publicaciones)

### ❌ Lo que NO puedes obtener:
- Followers count
- Following count
- Engagement rate
- Likes/comments de publicaciones individuales
- Stories

### 🔄 Alternativa: Instagram Graph API

Para obtener métricas completas, necesitas:
1. Convertir la cuenta de Instagram a Business o Creator
2. Conectar con una página de Facebook
3. Usar **Instagram Graph API** en lugar de Basic Display
4. Requiere proceso de revisión de Facebook

**Recomendación para MVP:**
1. Usa Instagram Basic Display para obtener username y conectar cuenta
2. Pide al usuario que ingrese manualmente sus métricas (followers, engagement)
3. Implementa Instagram Graph API más adelante cuando tengas cuentas Business

## Paso 4: Testing en Modo Sandbox

Instagram Basic Display funciona en modo sandbox automáticamente:
- Solo usuarios agregados como "testers" pueden autorizar
- Datos limitados disponibles
- No requiere revisión de la app para desarrollo

## Paso 5: Producción

Para llevar a producción:
1. Completa la información de la app en Meta for Developers
2. Agrega política de privacidad
3. Sube la app a revisión (si necesitas permisos adicionales)
4. Actualiza `INSTAGRAM_REDIRECT_URI` con tu dominio de producción

## Recursos Útiles

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [OAuth Flow Guide](https://developers.facebook.com/docs/instagram-basic-display-api/guides/getting-access-tokens-and-permissions)

---

**Próximo paso:** Implementar el código OAuth en la aplicación →
