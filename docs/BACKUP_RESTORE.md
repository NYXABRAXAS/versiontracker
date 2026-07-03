# Backup & Restore Guide

## Backups

The API takes plain-SQL `pg_dump` backups of the whole database:

- **Scheduled**: a cron job (`BACKUP_CRON` in `apps/api/.env`, default `0 2 * * *` - 2 AM daily)
  runs automatically via `apps/api/src/backup/backup.service.ts`.
- **On demand**: **Admin > Settings > Backups > Run Backup Now**, or `POST /api/backup/run`.

Every run is recorded in the `backup_history` table (status, size, timestamps, error if any) and
visible in the same Settings tab, with a download link for successful backups. Files are written
to `BACKUP_DIR` (default `apps/api/backups`).

> Backups live on the API container's local disk. On Render this is ephemeral unless you attach a
> persistent disk (see `docs/DEPLOYMENT.md`) - for production, also periodically download backups
> to off-server storage.

## Restoring a backup

Restoring is **not** a button in the UI - it's a destructive operation that overwrites live data,
so it's deliberately a manual, explicit CLI step:

```bash
# download the backup file from Admin > Settings > Backups first, then:
DATABASE_URL="postgresql://user:pass@host:5432/los_version_portal" \
  ./scripts/restore.sh path/to/backup-los_version_portal-2026-01-01T02-00-00-000Z.sql
```

The script prints the target database and requires typing `restore` to confirm before it runs
`psql -f <backup>` against it.

### Restoring into a fresh environment (disaster recovery)

1. Provision a new PostgreSQL database (matching major version where possible).
2. Run `npx prisma migrate deploy` from `apps/api` against the new database first, so the schema
   exists (or skip this if your backup already contains a full schema dump - `pg_dump` in plain
   SQL mode used here includes `CREATE TABLE` statements).
3. Run `scripts/restore.sh` as above.
4. Point `DATABASE_URL` at the new database and restart the API service.
5. Verify with `GET /api/health` and a login as Super Admin.
