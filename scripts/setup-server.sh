#!/bin/bash

# Script de Setup Inicial del Servidor
# Uso: sudo ./scripts/setup-server.sh

set -e

echo "🔧 Configurando servidor para MarkInflu..."

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

# Colores
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 1. Actualizar sistema
log "📦 Actualizando sistema..."
apt update
apt upgrade -y

# 2. Instalar herramientas esenciales
log "🛠️  Instalando herramientas esenciales..."
apt install -y curl wget git build-essential software-properties-common

# 3. Instalar Node.js 20
log "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Instalar pnpm
log "📦 Instalando pnpm..."
npm install -g pnpm

# 5. Instalar PostgreSQL
log "🗄️  Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Iniciar PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 6. Instalar Redis
log "📦 Instalando Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# 7. Instalar Nginx
log "🌐 Instalando Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 8. Instalar PM2
log "📦 Instalando PM2..."
npm install -g pm2

# 9. Instalar Certbot
log "🔒 Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

# 10. Configurar Firewall (UFW)
log "🔥 Configurando firewall..."
apt install -y ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 11. Crear directorio de aplicación
log "📁 Creando directorio de aplicación..."
mkdir -p /var/www/markinflu
chown -R $SUDO_USER:$SUDO_USER /var/www/markinflu

# 12. Configurar PostgreSQL
log "🗃️  Configurando PostgreSQL..."
sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1 || true

log "✅ Setup inicial completado!"
echo ""
echo "📝 Próximos pasos:"
echo "1. Configurar PostgreSQL: sudo -u postgres psql"
echo "   CREATE USER markinflu WITH PASSWORD 'tu_password';"
echo "   CREATE DATABASE markinflu OWNER markinflu;"
echo "2. Clonar repositorio en /var/www/markinflu"
echo "3. Configurar variables de entorno (.env)"
echo "4. Ejecutar migraciones de base de datos"
echo "5. Configurar Nginx"
echo "6. Obtener certificado SSL"
echo "7. Iniciar aplicación con PM2"
