#!/bin/bash

# Script de Backup de Base de Datos
# Uso: ./scripts/backup-db.sh

set -e

# Variables
BACKUP_DIR="/var/www/markinflu/backups"
DB_NAME="markinflu"
DB_USER="markinflu"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/markinflu_backup_$DATE.sql"
KEEP_DAYS=7  # Mantener backups de los últimos 7 días

# Colores
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

log "📦 Iniciando backup de base de datos..."

# Crear backup
log "💾 Creando backup en $BACKUP_FILE..."
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$BACKUP_FILE"

# Comprimir backup
log "🗜️  Comprimiendo backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

# Verificar que el backup existe
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✅ Backup creado exitosamente: $BACKUP_FILE ($SIZE)"
else
    log "❌ Error al crear backup"
    exit 1
fi

# Eliminar backups antiguos
log "🧹 Eliminando backups más antiguos de $KEEP_DAYS días..."
find "$BACKUP_DIR" -name "markinflu_backup_*.sql.gz" -type f -mtime +$KEEP_DAYS -delete

# Listar backups disponibles
log "📋 Backups disponibles:"
ls -lh "$BACKUP_DIR"/markinflu_backup_*.sql.gz | tail -n 5

log "✅ Proceso de backup completado"
