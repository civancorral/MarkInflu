# ✅ Checklist - Configuración OAuth Instagram

Sigue estos pasos en orden para configurar OAuth de Instagram.

## 📋 Fase 1: Configuración en Meta for Developers

### Paso 1.1: Crear App
- [ ] Ir a https://developers.facebook.com/
- [ ] Iniciar sesión con Facebook
- [ ] Click en "Mis Apps" → "Crear App"
- [ ] Seleccionar tipo: "Consumidor"
- [ ] Completar formulario:
  - [ ] Nombre de app: "MarkInflu Dev"
  - [ ] Email de contacto
  - [ ] Propósito: Empresa
- [ ] Click en "Crear app"

### Paso 1.2: Configurar Instagram Basic Display
- [ ] En el dashboard de la app, buscar "Instagram Basic Display"
- [ ] Click en "Configurar"
- [ ] Scroll hasta "Basic Display"

### Paso 1.3: Configurar OAuth Settings
- [ ] En "Client OAuth Settings", agregar:
  - [ ] Valid OAuth Redirect URIs:
    ```
    http://localhost:3000/api/auth/oauth/callback
    ```
  - [ ] Deauthorize Callback URL:
    ```
    http://localhost:3000/api/auth/oauth/deauthorize
    ```
  - [ ] Data Deletion Request URL:
    ```
    http://localhost:3000/api/auth/oauth/delete
    ```
- [ ] Click en "Save Changes"

### Paso 1.4: Copiar Credenciales
- [ ] Copiar **Instagram App ID**
- [ ] Copiar **Instagram App Secret**
- [ ] Guardar en un lugar seguro

### Paso 1.5: Agregar Tester
- [ ] Click en "Add or Remove Instagram Testers"
- [ ] Buscar tu usuario de Instagram
- [ ] Click en "Add"
- [ ] **IMPORTANTE:** Ir a Instagram app
- [ ] Settings → Apps and Websites → Tester Invites
- [ ] Aceptar la invitación ✅

---

## 🔧 Fase 2: Configuración Local

### Paso 2.1: Crear archivo .env.local
```bash
cd apps/web
cp .env.example .env.local
```

### Paso 2.2: Agregar credenciales
Editar `apps/web/.env.local`:

```env
# Instagram OAuth
INSTAGRAM_CLIENT_ID="pega_aqui_tu_app_id"
INSTAGRAM_CLIENT_SECRET="pega_aqui_tu_app_secret"
INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/auth/oauth/callback"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera_uno_abajo"
```

### Paso 2.3: Generar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```
- [ ] Copiar el resultado
- [ ] Pegar en `NEXTAUTH_SECRET` en `.env.local`

### Paso 2.4: Verificar archivo .env.local
- [ ] Archivo existe en `apps/web/.env.local`
- [ ] `INSTAGRAM_CLIENT_ID` está configurado
- [ ] `INSTAGRAM_CLIENT_SECRET` está configurado
- [ ] `INSTAGRAM_REDIRECT_URI` es correcto
- [ ] `NEXTAUTH_URL` es `http://localhost:3000`
- [ ] `NEXTAUTH_SECRET` está generado

---

## 🚀 Fase 3: Testing

### Paso 3.1: Iniciar servidor
```bash
cd apps/web
pnpm dev
```
- [ ] Servidor inicia sin errores
- [ ] Se puede acceder a http://localhost:3000

### Paso 3.2: Login como CREATOR
- [ ] Iniciar sesión en la aplicación
- [ ] Usuario tiene rol CREATOR
- [ ] Perfil de creador existe (completar onboarding si no)

### Paso 3.3: Navegar al perfil
- [ ] Ir a http://localhost:3000/dashboard/profile
- [ ] Página carga correctamente
- [ ] Se ve sección "Redes Sociales"

### Paso 3.4: Conectar Instagram
- [ ] Ver botón/card "Conectar Instagram"
- [ ] Click en "Conectar Instagram"
- [ ] Redirige a Instagram (api.instagram.com)
- [ ] Ver pantalla de autorización de Instagram
- [ ] Ver permisos solicitados:
  - Acceso a perfil básico
  - Acceso a publicaciones
- [ ] Click en "Autorizar" / "Allow"

### Paso 3.5: Verificar conexión
- [ ] Redirige de vuelta a /dashboard/profile
- [ ] Toast de éxito aparece: "¡Instagram conectado exitosamente!"
- [ ] Card de Instagram aparece en "Redes Conectadas"
- [ ] Muestra username (@tu_usuario)
- [ ] Muestra badge "Conectada"
- [ ] Muestra número de publicaciones (si disponible)
- [ ] Muestra botón "Desconectar"

### Paso 3.6: Verificar en Base de Datos
```sql
SELECT
  platform,
  username,
  "isConnected",
  "postsCount",
  "lastSyncAt"
FROM "SocialAccount"
WHERE platform = 'INSTAGRAM';
```

Debería mostrar:
- [ ] `platform`: INSTAGRAM
- [ ] `username`: tu_usuario
- [ ] `isConnected`: true
- [ ] `lastSyncAt`: fecha/hora reciente

---

## 🐛 Troubleshooting

### Si ves: "Configuración OAuth incompleta"
- [ ] Verificar que `.env.local` existe
- [ ] Verificar que variables están configuradas
- [ ] Reiniciar servidor (Ctrl+C → pnpm dev)

### Si ves: "Failed to exchange token"
- [ ] Verificar Client Secret es correcto
- [ ] Verificar Redirect URI coincide exactamente
- [ ] No debe tener `/` al final
- [ ] Debe ser HTTP (no HTTPS) en desarrollo

### Si ves: "You are not a tester"
- [ ] Verificar que agregaste tu cuenta como tester en Meta
- [ ] Verificar que aceptaste la invitación en Instagram
- [ ] Instagram → Settings → Apps and Websites → Tester Invites

### Si no aparecen followers
- [ ] **Esto es normal** - Instagram Basic Display no provee followers
- [ ] Solo obtienes: username, account_type, media_count
- [ ] Para followers necesitas Instagram Graph API

---

## ✅ Checklist Final

- [ ] App creada en Meta for Developers
- [ ] Instagram Basic Display configurado
- [ ] Redirect URIs configurados
- [ ] Credenciales copiadas
- [ ] Cuenta agregada como tester
- [ ] Invitación aceptada en Instagram
- [ ] `.env.local` creado
- [ ] Variables de entorno configuradas
- [ ] Servidor iniciado sin errores
- [ ] Login exitoso como CREATOR
- [ ] Botón "Conectar Instagram" visible
- [ ] OAuth flow completa exitosamente
- [ ] Instagram aparece conectado en UI
- [ ] Registro existe en base de datos

## 🎉 Si todos los checks están ✅

**¡Felicitaciones!** OAuth de Instagram está funcionando correctamente.

## 📚 Documentación Adicional

- [Guía de Setup Detallada](./oauth-instagram-setup.md)
- [Guía de Testing Completa](./oauth-testing-guide.md)
- [Detalles de Implementación](./oauth-instagram-implementado.md)

## 🚀 Siguiente Paso

Ahora que Instagram funciona, puedes:
1. Implementar token refresh automático
2. Implementar YouTube OAuth
3. Implementar TikTok OAuth
4. Migrar a Instagram Graph API para métricas completas
