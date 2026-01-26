# ✅ Checklist de Deployment - MarkInflu

**Servidor:** 173.249.40.63 (Ubuntu 24.04)
**Dominio:** https://markinflu.socialmindcrm.com

---

## 📋 Pre-requisitos

- [ ] Acceso SSH al servidor (root@173.249.40.63)
- [ ] Dominio configurado y apuntando al servidor
- [ ] Credenciales de OAuth de Instagram/YouTube/TikTok
- [ ] Repositorio Git accesible

---

## 🔧 Fase 1: Setup Inicial del Servidor

### Conectar al Servidor
```bash
ssh root@173.249.40.63
```

### Ejecutar Script de Setup Automático
```bash
# Descargar el script
curl -o setup-server.sh https://raw.githubusercontent.com/tu-usuario/markinflu/main/scripts/setup-server.sh

# Dar permisos de ejecución
chmod +x setup-server.sh

# Ejecutar
sudo ./setup-server.sh
```

**O manualmente:**

- [ ] Sistema actualizado: `sudo apt update && sudo apt upgrade -y`
- [ ] Node.js 20 instalado
- [ ] pnpm instalado globalmente
- [ ] PostgreSQL instalado y corriendo
- [ ] Redis instalado y corriendo
- [ ] Nginx instalado y corriendo
- [ ] PM2 instalado globalmente
- [ ] Certbot instalado
- [ ] UFW firewall configurado

---

## 🗄️ Fase 2: Configurar PostgreSQL

```bash
# Conectar a PostgreSQL
sudo -u postgres psql
```

```sql
-- Ejecutar en PostgreSQL:
CREATE USER markinflu WITH PASSWORD 'TU_PASSWORD_SEGURO_AQUI';
CREATE DATABASE markinflu OWNER markinflu;
GRANT ALL PRIVILEGES ON DATABASE markinflu TO markinflu;
\q
```

- [ ] Usuario `markinflu` creado
- [ ] Base de datos `markinflu` creada
- [ ] Conexión verificada: `psql -U markinflu -d markinflu -h localhost -W`

---

## 📂 Fase 3: Clonar y Configurar Proyecto

```bash
# Ir al directorio de aplicaciones
cd /var/www

# Clonar repositorio
git clone https://github.com/tu-usuario/markinflu.git
# O si es privado:
# git clone https://token@github.com/tu-usuario/markinflu.git

# Cambiar permisos
chown -R $USER:$USER /var/www/markinflu
cd markinflu
```

- [ ] Código clonado en `/var/www/markinflu`
- [ ] Permisos correctos configurados

---

## 🔐 Fase 4: Configurar Variables de Entorno

### 4.1 Database Package

```bash
nano packages/database/.env
```

```env
DATABASE_URL="postgresql://markinflu:TU_PASSWORD@localhost:5432/markinflu?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 4.2 Web App

```bash
nano apps/web/.env.local
```

```env
# Database
DATABASE_URL="postgresql://markinflu:TU_PASSWORD@localhost:5432/markinflu?schema=public"

# NextAuth
NEXTAUTH_URL="https://markinflu.socialmindcrm.com"
NEXTAUTH_SECRET="GENERAR_CON_openssl_rand_-base64_32"

# Instagram OAuth
INSTAGRAM_CLIENT_ID="tu_app_id"
INSTAGRAM_CLIENT_SECRET="tu_app_secret"
INSTAGRAM_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"

# YouTube OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# TikTok OAuth (opcional)
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""
TIKTOK_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"
```

### Generar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

- [ ] `packages/database/.env` creado
- [ ] `apps/web/.env.local` creado
- [ ] `NEXTAUTH_SECRET` generado
- [ ] Credenciales de OAuth configuradas

---

## 📦 Fase 5: Instalar y Compilar

```bash
cd /var/www/markinflu

# Instalar dependencias
pnpm install

# Generar Prisma Client
pnpm --filter @markinflu/database prisma generate

# Aplicar migraciones
pnpm --filter @markinflu/database prisma migrate deploy

# Compilar aplicación
pnpm --filter web build
```

- [ ] Dependencias instaladas
- [ ] Prisma Client generado
- [ ] Migraciones aplicadas
- [ ] Aplicación compilada sin errores

---

## 🌐 Fase 6: Configurar Nginx

### 6.1 Crear Configuración

```bash
sudo nano /etc/nginx/sites-available/markinflu
```

**Contenido:** Ver archivo completo en [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#paso-8-configurar-nginx)

**Versión simplificada sin SSL (temporal):**

```nginx
server {
    listen 80;
    server_name markinflu.socialmindcrm.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.2 Habilitar Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/markinflu /etc/nginx/sites-enabled/

# Eliminar default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

- [ ] Configuración de Nginx creada
- [ ] Sitio habilitado
- [ ] Nginx recargado sin errores

---

## 🔒 Fase 7: Configurar SSL

**IMPORTANTE:** Antes de esto, verifica que el DNS apunte al servidor.

### Verificar DNS
```bash
# Desde tu computadora local
nslookup markinflu.socialmindcrm.com
# Debe mostrar: 173.249.40.63
```

### Obtener Certificado SSL

```bash
sudo certbot --nginx -d markinflu.socialmindcrm.com
```

Seguir las instrucciones:
1. Ingresar email
2. Aceptar términos
3. Seleccionar redirigir HTTP a HTTPS

- [ ] DNS apunta al servidor
- [ ] Certificado SSL obtenido
- [ ] HTTPS funcionando

---

## 🚀 Fase 8: Iniciar Aplicación con PM2

### 8.1 Crear Directorio de Logs

```bash
mkdir -p /var/www/markinflu/logs
```

### 8.2 Iniciar PM2

```bash
cd /var/www/markinflu

# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs markinflu-web --lines 50
```

### 8.3 Configurar Auto-inicio

```bash
# Guardar configuración
pm2 save

# Generar script de startup
pm2 startup

# Ejecutar el comando que PM2 muestra
# (será algo como: sudo env PATH=... pm2 startup systemd ...)
```

- [ ] Directorio de logs creado
- [ ] Aplicación iniciada con PM2
- [ ] PM2 configurado para auto-inicio
- [ ] Logs verificados sin errores críticos

---

## ✅ Fase 9: Verificación Final

### 9.1 Verificar Servicios

```bash
# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis-server

# Nginx
sudo systemctl status nginx

# PM2
pm2 status
```

### 9.2 Verificar Aplicación

```bash
# Abrir navegador
https://markinflu.socialmindcrm.com
```

**Checklist de funcionalidad:**
- [ ] Página carga correctamente
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] OAuth de Instagram funciona
- [ ] No hay errores en consola del navegador

### 9.3 Verificar Logs

```bash
# Logs de Next.js
pm2 logs markinflu-web --lines 100

# Logs de Nginx
sudo tail -f /var/log/nginx/markinflu_access.log
sudo tail -f /var/log/nginx/markinflu_error.log

# Logs de PostgreSQL (si hay problemas)
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

- [ ] Todos los servicios corriendo
- [ ] Aplicación accesible vía HTTPS
- [ ] No hay errores en logs
- [ ] Funcionalidades principales funcionan

---

## 🛠️ Comandos Post-Deployment

### Ver Estado
```bash
pm2 status
```

### Ver Logs en Tiempo Real
```bash
pm2 logs markinflu-web
```

### Reiniciar Aplicación
```bash
pm2 restart markinflu-web
```

### Ver Monitoreo
```bash
pm2 monit
```

---

## 🔄 Actualizar Aplicación (Futuro)

Cuando tengas cambios:

```bash
# Conectar al servidor
ssh root@173.249.40.63

# Ejecutar script de deploy
cd /var/www/markinflu
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O manualmente:
```bash
cd /var/www/markinflu
git pull origin main
pnpm install
pnpm --filter @markinflu/database prisma generate
pnpm --filter @markinflu/database prisma migrate deploy
pnpm --filter web build
pm2 restart markinflu-web
```

---

## 📊 Monitoreo

### Recursos del Servidor
```bash
htop          # CPU y Memoria
df -h         # Disco
free -h       # Memoria
pm2 monit     # Monitoreo de PM2
```

### Backup de Base de Datos
```bash
# Crear backup
./scripts/backup-db.sh

# Backups se guardan en /var/www/markinflu/backups/
```

---

## 🐛 Troubleshooting Común

### Aplicación no carga (502 Bad Gateway)
```bash
# Verificar que PM2 esté corriendo
pm2 status

# Ver logs
pm2 logs markinflu-web --lines 100

# Reiniciar
pm2 restart markinflu-web
```

### Error de Base de Datos
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Probar conexión
psql -U markinflu -d markinflu -h localhost -W
```

### SSL no funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar
sudo certbot renew
```

### Puerto 3000 ocupado
```bash
# Ver qué usa el puerto
sudo lsof -i :3000

# Matar proceso si es necesario
sudo kill -9 <PID>
```

---

## ✅ Checklist Final Completo

**Setup Servidor:**
- [ ] Sistema actualizado
- [ ] Node.js 20+ instalado
- [ ] pnpm instalado
- [ ] PostgreSQL configurado
- [ ] Redis configurado
- [ ] Nginx instalado
- [ ] PM2 instalado
- [ ] Certbot instalado
- [ ] Firewall configurado

**Base de Datos:**
- [ ] Usuario PostgreSQL creado
- [ ] Base de datos creada
- [ ] Conexión verificada

**Aplicación:**
- [ ] Código clonado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Migraciones aplicadas
- [ ] Aplicación compilada

**Nginx:**
- [ ] Configuración creada
- [ ] Sitio habilitado
- [ ] SSL configurado

**PM2:**
- [ ] Aplicación iniciada
- [ ] Auto-inicio configurado
- [ ] Logs funcionando

**DNS:**
- [ ] Dominio apunta al servidor
- [ ] DNS propagado

**Verificación:**
- [ ] HTTPS funciona
- [ ] Aplicación carga
- [ ] Login funciona
- [ ] OAuth funciona
- [ ] No hay errores en logs

---

## 🎉 ¡Deployment Completado!

Si todos los checks están ✅, tu aplicación está en producción.

**URLs Importantes:**
- Aplicación: https://markinflu.socialmindcrm.com
- Servidor SSH: root@173.249.40.63

**Comandos Útiles:**
```bash
pm2 status                    # Ver estado
pm2 logs markinflu-web        # Ver logs
pm2 restart markinflu-web     # Reiniciar
./scripts/deploy.sh           # Deploy de actualizaciones
./scripts/backup-db.sh        # Backup de DB
```

**Documentación:**
- [Guía Completa de Deployment](./DEPLOYMENT_GUIDE.md)
- [Scripts de Mantenimiento](../scripts/)
