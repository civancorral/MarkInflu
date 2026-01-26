# 🚀 Guía de Deployment - MarkInflu

## 📋 Información del Servidor

- **IP:** 173.249.40.63
- **OS:** Ubuntu 24.04 LTS
- **Dominio:** http://markinflu.socialmindcrm.com
- **Stack:** Next.js + NestJS + PostgreSQL + Redis

---

## 📝 Checklist de Deployment

- [ ] Servidor Ubuntu 24 configurado
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL instalado y configurado
- [ ] Redis instalado y configurado
- [ ] pnpm instalado
- [ ] Nginx instalado y configurado
- [ ] SSL/HTTPS configurado
- [ ] Variables de entorno configuradas
- [ ] Código clonado del repositorio
- [ ] Dependencias instaladas
- [ ] Base de datos migrada
- [ ] PM2 configurado para procesos
- [ ] Dominio apuntando al servidor

---

## 🔧 Paso 1: Conectar al Servidor

```bash
# Conectar vía SSH
ssh root@173.249.40.63

# O si tienes usuario específico
ssh usuario@173.249.40.63
```

---

## 📦 Paso 2: Instalar Dependencias del Sistema

### 2.1 Actualizar Sistema

```bash
# Actualizar paquetes
sudo apt update
sudo apt upgrade -y

# Instalar herramientas esenciales
sudo apt install -y curl wget git build-essential
```

### 2.2 Instalar Node.js 20+

```bash
# Agregar repositorio de NodeSource para Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalación
node --version  # debe mostrar v20.x.x
npm --version
```

### 2.3 Instalar pnpm

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalación
pnpm --version
```

### 2.4 Instalar PostgreSQL

```bash
# Instalar PostgreSQL 16
sudo apt install -y postgresql postgresql-contrib

# Iniciar y habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### 2.5 Instalar Redis

```bash
# Instalar Redis
sudo apt install -y redis-server

# Configurar Redis para iniciar automáticamente
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar status
sudo systemctl status redis-server
```

### 2.6 Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar y habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

### 2.7 Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalación
pm2 --version
```

---

## 🗄️ Paso 3: Configurar PostgreSQL

### 3.1 Crear Usuario y Base de Datos

```bash
# Conectar a PostgreSQL como usuario postgres
sudo -u postgres psql

# Dentro de PostgreSQL:
```

```sql
-- Crear usuario
CREATE USER markinflu WITH PASSWORD 'tu_password_seguro_aqui';

-- Crear base de datos
CREATE DATABASE markinflu OWNER markinflu;

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE markinflu TO markinflu;

-- Salir
\q
```

### 3.2 Configurar Acceso Remoto (Opcional)

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Agregar esta línea al final:
# host    markinflu    markinflu    127.0.0.1/32    md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 3.3 Verificar Conexión

```bash
# Probar conexión
psql -U markinflu -d markinflu -h localhost -W
# Ingresar password cuando lo pida
# Si funciona, escribir \q para salir
```

---

## 📂 Paso 4: Clonar y Configurar Proyecto

### 4.1 Crear Directorio de Aplicación

```bash
# Crear directorio para aplicaciones
sudo mkdir -p /var/www
cd /var/www

# Clonar repositorio (ajusta la URL según tu repo)
sudo git clone https://github.com/tu-usuario/markinflu.git
# O si es privado:
# sudo git clone https://tu-token@github.com/tu-usuario/markinflu.git

# Cambiar permisos
sudo chown -R $USER:$USER /var/www/markinflu
cd markinflu
```

### 4.2 Instalar Dependencias

```bash
# Instalar dependencias con pnpm
pnpm install

# Esto puede tomar varios minutos
```

---

## 🔐 Paso 5: Configurar Variables de Entorno

### 5.1 Crear Archivo .env para Database Package

```bash
# Crear .env en packages/database
nano packages/database/.env
```

Contenido:

```env
# Database
DATABASE_URL="postgresql://markinflu:tu_password_seguro_aqui@localhost:5432/markinflu?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 5.2 Crear Archivo .env para Web App

```bash
# Crear .env.local en apps/web
nano apps/web/.env.local
```

Contenido:

```env
# Database
DATABASE_URL="postgresql://markinflu:tu_password_seguro_aqui@localhost:5432/markinflu?schema=public"

# NextAuth
NEXTAUTH_URL="https://markinflu.socialmindcrm.com"
NEXTAUTH_SECRET="genera_un_secret_aleatorio_de_32_chars"

# Instagram OAuth
INSTAGRAM_CLIENT_ID="tu_instagram_app_id"
INSTAGRAM_CLIENT_SECRET="tu_instagram_app_secret"
INSTAGRAM_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"

# YouTube OAuth (si ya lo tienes)
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"

# TikTok OAuth (si ya lo tienes)
TIKTOK_CLIENT_KEY="tu_tiktok_client_key"
TIKTOK_CLIENT_SECRET="tu_tiktok_client_secret"
TIKTOK_REDIRECT_URI="https://markinflu.socialmindcrm.com/api/auth/oauth/callback"

# Stripe (si lo usas)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Mux (para videos)
MUX_TOKEN_ID="tu_mux_token_id"
MUX_TOKEN_SECRET="tu_mux_token_secret"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 5.3 Generar NEXTAUTH_SECRET

```bash
# Generar secret aleatorio
openssl rand -base64 32

# Copiar el resultado y pegarlo en NEXTAUTH_SECRET
```

---

## 🗃️ Paso 6: Configurar Base de Datos

### 6.1 Generar Cliente Prisma

```bash
# Desde el directorio raíz del proyecto
cd /var/www/markinflu

# Generar Prisma Client
pnpm --filter @markinflu/database prisma generate
```

### 6.2 Ejecutar Migraciones

```bash
# Aplicar migraciones a la base de datos
pnpm --filter @markinflu/database prisma migrate deploy

# Si es primera vez, también puedes hacer:
# pnpm --filter @markinflu/database prisma db push
```

### 6.3 (Opcional) Seed de Datos

```bash
# Si tienes seed data
pnpm --filter @markinflu/database prisma db seed
```

---

## 🏗️ Paso 7: Build del Proyecto

### 7.1 Build de Web App

```bash
# Desde el directorio raíz
cd /var/www/markinflu

# Build de la app web
pnpm --filter web build

# Esto puede tomar varios minutos
```

### 7.2 Build de API (NestJS)

```bash
# Build de la API (si la tienes)
pnpm --filter api build
```

---

## 🌐 Paso 8: Configurar Nginx

### 8.1 Crear Configuración de Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/markinflu
```

Contenido:

```nginx
# Upstream para Next.js
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name markinflu.socialmindcrm.com;

    # Redirigir a HTTPS (comentar si aún no tienes SSL)
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name markinflu.socialmindcrm.com;

    # Certificados SSL (configurar después con Certbot)
    ssl_certificate /etc/letsencrypt/live/markinflu.socialmindcrm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/markinflu.socialmindcrm.com/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Logs
    access_log /var/log/nginx/markinflu_access.log;
    error_log /var/log/nginx/markinflu_error.log;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Ubicación raíz - proxy a Next.js
    location / {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Cache para archivos estáticos
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API routes con mayor timeout para OAuth
    location /api/ {
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts más largos para OAuth
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

### 8.2 Habilitar Sitio

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/markinflu /etc/nginx/sites-enabled/

# Eliminar default si existe
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Paso 9: Configurar SSL con Let's Encrypt

### 9.1 Instalar Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtener Certificado SSL

**IMPORTANTE:** Antes de esto, asegúrate que el dominio `markinflu.socialmindcrm.com` apunte a la IP `173.249.40.63`

```bash
# Primero, comenta las líneas SSL en Nginx temporalmente
sudo nano /etc/nginx/sites-available/markinflu
# Comenta las líneas de ssl_certificate y ssl_certificate_key
# También comenta la redirección 301 de HTTP a HTTPS

# Recargar Nginx
sudo systemctl reload nginx

# Obtener certificado
sudo certbot --nginx -d markinflu.socialmindcrm.com

# Seguir las instrucciones:
# - Ingresar email
# - Aceptar términos
# - Decidir si compartir email (opcional)
# - Seleccionar redirigir HTTP a HTTPS

# Certbot configurará automáticamente Nginx
```

### 9.3 Renovación Automática

```bash
# Probar renovación
sudo certbot renew --dry-run

# Certbot crea un cron job automáticamente para renovar
# Verificar que existe:
sudo systemctl status certbot.timer
```

---

## 🚀 Paso 10: Configurar PM2 para Procesos

### 10.1 Crear Archivo de Configuración PM2

```bash
# En el directorio raíz del proyecto
cd /var/www/markinflu

# Crear ecosystem.config.js
nano ecosystem.config.js
```

Contenido:

```javascript
module.exports = {
  apps: [
    {
      name: 'markinflu-web',
      script: 'pnpm',
      args: '--filter web start',
      cwd: '/var/www/markinflu',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/www/markinflu/logs/web-error.log',
      out_file: '/var/www/markinflu/logs/web-out.log',
      log_file: '/var/www/markinflu/logs/web-combined.log',
      time: true,
    },
    // Descomentar si tienes API NestJS
    /*
    {
      name: 'markinflu-api',
      script: 'pnpm',
      args: '--filter api start:prod',
      cwd: '/var/www/markinflu',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/www/markinflu/logs/api-error.log',
      out_file: '/var/www/markinflu/logs/api-out.log',
      log_file: '/var/www/markinflu/logs/api-combined.log',
      time: true,
    },
    */
  ],
};
```

### 10.2 Crear Directorio de Logs

```bash
# Crear directorio para logs
mkdir -p /var/www/markinflu/logs
```

### 10.3 Iniciar Aplicación con PM2

```bash
# Iniciar PM2 con el archivo de configuración
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Ver logs
pm2 logs

# Ver logs solo de web
pm2 logs markinflu-web
```

### 10.4 Configurar PM2 para Auto-inicio

```bash
# Guardar configuración PM2
pm2 save

# Generar script de startup
pm2 startup

# Ejecutar el comando que PM2 te muestra
# (será algo como: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u tu-usuario --hp /home/tu-usuario)
```

---

## 🔄 Paso 11: Actualizar DNS

### 11.1 Configurar DNS del Dominio

En tu proveedor de DNS (donde gestionas socialmindcrm.com):

1. **Agregar registro A:**
   ```
   Tipo: A
   Nombre: markinflu
   Valor: 173.249.40.63
   TTL: 3600 (o automático)
   ```

2. **Esperar propagación DNS** (puede tomar hasta 48h, usualmente 5-15 min)

3. **Verificar DNS:**
   ```bash
   # Desde tu computadora local
   nslookup markinflu.socialmindcrm.com
   # Debería mostrar 173.249.40.63

   # O con dig
   dig markinflu.socialmindcrm.com
   ```

---

## ✅ Paso 12: Verificación Final

### 12.1 Verificar Servicios

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

### 12.2 Verificar Aplicación

```bash
# Abrir navegador y visitar:
https://markinflu.socialmindcrm.com

# Verificar que carga correctamente
```

### 12.3 Verificar Logs

```bash
# Logs de Nginx
sudo tail -f /var/log/nginx/markinflu_access.log
sudo tail -f /var/log/nginx/markinflu_error.log

# Logs de PM2
pm2 logs markinflu-web

# Logs de PostgreSQL (si hay problemas)
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 🛠️ Comandos Útiles de Mantenimiento

### PM2

```bash
# Ver status
pm2 status

# Reiniciar aplicación
pm2 restart markinflu-web

# Recargar sin downtime
pm2 reload markinflu-web

# Detener aplicación
pm2 stop markinflu-web

# Ver logs en tiempo real
pm2 logs markinflu-web

# Monitoreo
pm2 monit
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/markinflu_error.log
```

### PostgreSQL

```bash
# Conectar a base de datos
psql -U markinflu -d markinflu -h localhost

# Backup de base de datos
pg_dump -U markinflu -h localhost markinflu > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U markinflu -h localhost markinflu < backup_20240125.sql
```

---

## 🔄 Actualizar Aplicación

Cuando tengas cambios en el código:

```bash
# 1. Conectar al servidor
ssh root@173.249.40.63

# 2. Ir al directorio
cd /var/www/markinflu

# 3. Pull de cambios
git pull origin main  # o la rama que uses

# 4. Instalar nuevas dependencias (si hay)
pnpm install

# 5. Regenerar Prisma Client (si hubo cambios en schema)
pnpm --filter @markinflu/database prisma generate

# 6. Aplicar migraciones (si hay cambios en DB)
pnpm --filter @markinflu/database prisma migrate deploy

# 7. Rebuild de aplicación
pnpm --filter web build

# 8. Reiniciar PM2
pm2 restart markinflu-web

# 9. Verificar logs
pm2 logs markinflu-web --lines 100
```

---

## 🐛 Troubleshooting

### Aplicación no inicia

```bash
# Ver logs detallados
pm2 logs markinflu-web --lines 200

# Verificar puerto 3000 no esté ocupado
sudo lsof -i :3000

# Matar proceso si está ocupado
sudo kill -9 <PID>

# Reiniciar
pm2 restart markinflu-web
```

### Error de Base de Datos

```bash
# Verificar PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U markinflu -d markinflu -h localhost -W

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Error 502 Bad Gateway

```bash
# Verificar que Next.js esté corriendo
pm2 status

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/markinflu_error.log

# Reiniciar servicios
pm2 restart markinflu-web
sudo systemctl reload nginx
```

### SSL no funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Verificar configuración de Nginx
sudo nginx -t
```

---

## 📊 Monitoreo

### Uso de Recursos

```bash
# Ver uso de CPU y Memoria
htop

# O con PM2
pm2 monit

# Uso de disco
df -h

# Uso de memoria
free -h
```

### Logs Centralizados

```bash
# Ver todos los logs de PM2
pm2 logs

# Filtrar por aplicación
pm2 logs markinflu-web

# Ver últimas 100 líneas
pm2 logs --lines 100
```

---

## 🔐 Seguridad Adicional (Recomendado)

### Firewall

```bash
# Instalar UFW
sudo apt install ufw

# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP y HTTPS
sudo ufw allow 'Nginx Full'

# Habilitar firewall
sudo ufw enable

# Ver status
sudo ufw status
```

### Fail2Ban

```bash
# Instalar Fail2Ban
sudo apt install fail2ban

# Copiar configuración
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Habilitar y arrancar
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## ✅ Checklist Final de Deployment

- [ ] Servidor Ubuntu actualizado
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL configurado y corriendo
- [ ] Redis configurado y corriendo
- [ ] Código clonado en /var/www/markinflu
- [ ] Dependencias instaladas con pnpm
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] Aplicación compilada (build)
- [ ] Nginx configurado
- [ ] SSL configurado con Let's Encrypt
- [ ] PM2 configurado y aplicación corriendo
- [ ] DNS apuntando al servidor
- [ ] Aplicación accesible en https://markinflu.socialmindcrm.com
- [ ] Logs funcionando correctamente
- [ ] PM2 configurado para auto-inicio

---

**¡Deployment Completado!** 🎉

Si tienes problemas, revisa la sección de Troubleshooting o verifica los logs.
