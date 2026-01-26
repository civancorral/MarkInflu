#!/bin/bash

# Script de Deployment para MarkInflu
# Uso: ./scripts/deploy.sh

set -e  # Exit on error

echo "🚀 Iniciando deployment de MarkInflu..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/markinflu"
LOG_FILE="$APP_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "$APP_DIR" ]; then
    error "Directorio $APP_DIR no existe. ¿Estás en el servidor correcto?"
fi

cd "$APP_DIR"

# 1. Pull de cambios
log "📥 Descargando últimos cambios..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "Rama actual: $CURRENT_BRANCH"

git pull origin "$CURRENT_BRANCH" || error "Error al hacer pull de git"

# 2. Instalar dependencias
log "📦 Instalando dependencias..."
pnpm install || error "Error al instalar dependencias"

# 3. Generar Prisma Client
log "🔧 Generando Prisma Client..."
pnpm --filter @markinflu/database prisma generate || warning "Error al generar Prisma Client"

# 4. Aplicar migraciones
log "🗃️  Aplicando migraciones de base de datos..."
pnpm --filter @markinflu/database prisma migrate deploy || warning "Error al aplicar migraciones"

# 5. Build de aplicación
log "🏗️  Compilando aplicación..."
pnpm --filter web build || error "Error al compilar aplicación"

# 6. Reiniciar PM2
log "🔄 Reiniciando aplicación..."
pm2 restart markinflu-web || error "Error al reiniciar aplicación con PM2"

# 7. Verificar salud de la aplicación
log "🏥 Verificando salud de la aplicación..."
sleep 5  # Esperar a que la app inicie

# Verificar que PM2 esté corriendo
if pm2 status | grep -q "markinflu-web.*online"; then
    log "✅ Aplicación corriendo correctamente"
else
    error "❌ Aplicación no está corriendo. Verifica logs: pm2 logs markinflu-web"
fi

# 8. Limpiar archivos antiguos (opcional)
log "🧹 Limpiando archivos temporales..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf apps/web/.next/cache 2>/dev/null || true

# 9. Guardar configuración de PM2
log "💾 Guardando configuración de PM2..."
pm2 save

log "✅ ¡Deployment completado exitosamente!"
log "📊 Ver logs: pm2 logs markinflu-web"
log "📈 Ver status: pm2 status"
log "🌐 URL: https://markinflu.socialmindcrm.com"

# Mostrar últimos logs
log "📝 Últimos logs de la aplicación:"
pm2 logs markinflu-web --lines 20 --nostream
