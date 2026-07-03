#!/usr/bin/env bash
# Restore a LOS Version Management Portal database backup.
#
# This is intentionally a manual CLI script rather than a one-click button in
# the app - restoring overwrites live data and should never be a single
# accidental click away in a web UI.
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/restore.sh path/to/backup.sql

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: set DATABASE_URL to the target database connection string." >&2
  exit 1
fi

BACKUP_FILE="${1:-}"
if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: DATABASE_URL=... ./scripts/restore.sh <path-to-backup.sql>" >&2
  exit 1
fi

echo "About to restore '$BACKUP_FILE' into:"
echo "  $DATABASE_URL"
echo "This will overwrite existing data in that database."
read -r -p "Type 'restore' to continue: " CONFIRM
if [ "$CONFIRM" != "restore" ]; then
  echo "Aborted."
  exit 1
fi

psql "$DATABASE_URL" -f "$BACKUP_FILE"
echo "Restore complete."
