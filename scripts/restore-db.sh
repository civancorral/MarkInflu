#!/bin/bash

# Script de Restauración de Base de Datos
# Uso: ./scripts/restore-db.sh <archivo_backup.sql.gz>

set -e

# Variables
DB_NAME="markinflu"
DB_USER="markinflu"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar argumento
if [ -z "$1" ]; then
    error "Uso: ./scripts/restore-db.sh <archivo_backup.sql.gz>"
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    error "Archivo no encontrado: $BACKUP_FILE"
fi

warning "⚠️  ADVERTENCIA: Esta operación sobrescribirá la base de datos actual!"
warning "Base de datos: $DB_NAME"
warning "Archivo: $BACKUP_FILE"
echo ""
read -p "¿Estás seguro? (escribe 'SI' para continuar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    log "❌ Restauración cancelada"
    exit 0
fi

log "📦 Iniciando restauración de base de datos..."

# Crear backup de seguridad antes de restaurar
SAFETY_BACKUP="/tmp/markinflu_pre_restore_$(date +%Y%m%d_%H%M%S).sql"
log "💾 Creando backup de seguridad en $SAFETY_BACKUP..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$SAFETY_BACKUP"
log "✅ Backup de seguridad creado"

# Descomprimir si está comprimido
TEMP_SQL="/tmp/restore_temp_$(date +%Y%m%d_%H%M%S).sql"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "🗜️  Descomprimiendo archivo..."
    gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"
else
    cp "$BACKUP_FILE" "$TEMP_SQL"
fi

# Restaurar base de datos
log "📥 Restaurando base de datos..."
psql -U "$DB_USER" -h localhost -d "$DB_NAME" < "$TEMP_SQL" || {
    error "Error al restaurar base de datos. Backup de seguridad disponible en: $SAFETY_BACKUP"
}

# Limpiar archivo temporal
rm -f "$TEMP_SQL"

log "✅ Base de datos restaurada exitosamente"
log "💡 Backup de seguridad guardado en: $SAFETY_BACKUP"
log "🔄 Recuerda reiniciar la aplicación: pm2 restart markinflu-web"
