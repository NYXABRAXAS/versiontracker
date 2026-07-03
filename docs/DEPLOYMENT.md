# Deployment Guide

## Option A - Render (recommended, uses `render.yaml`)

1. Push this repo to GitHub/GitLab.
2. **Get a Postgres database first.** `render.yaml` does *not* provision a Render-managed
   database by default, because Render only allows one free-tier database per account - if that
   slot is already used by another project on your account, the Blueprint sync fails outright. Get
   a free Postgres from [Neon](https://neon.tech), [Supabase](https://supabase.com), or similar,
   and copy its connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`).
   If you'd rather use Render's own managed Postgres (and know the free slot is available), uncomment
   the `databases:` block at the bottom of `render.yaml` and switch `DATABASE_URL` to use
   `fromDatabase` instead of `sync: false` - see the comments in that file.
3. In the Render dashboard: **New +** -> **Blueprint**, point it at the repo. Render reads
   `render.yaml` at the repo root and creates:
   - `los-version-portal-api` - the NestJS API (Docker runtime, `apps/api/Dockerfile`)
   - `los-version-portal-web` - the Next.js frontend (Docker runtime, `apps/web/Dockerfile`)
4. Render will prompt for the env vars marked `sync: false` in `render.yaml` - fill in
   `DATABASE_URL` with the connection string from step 2, `SEED_SUPER_ADMIN_PASSWORD`, and
   optionally SMTP credentials (leave SMTP blank if you don't have it yet). Set them and deploy.
5. **First-deploy URL wiring** (required - Next.js bakes `NEXT_PUBLIC_API_URL` in at build time,
   so this can't be known before the services exist):
   - After the first deploy, copy each service's `*.onrender.com` URL from the Render dashboard.
   - On `los-version-portal-api`: set `API_URL` to its own URL, and `WEB_URL` + `CORS_ORIGINS` to
     the web service's URL.
   - On `los-version-portal-web`: set `NEXT_PUBLIC_API_URL` to the API service's URL.
   - Trigger a manual redeploy of both services so the values take effect (the web service needs
     a full rebuild since `NEXT_PUBLIC_*` vars are compiled into the client bundle).
6. On boot, the API container automatically runs `prisma migrate deploy` and the seed script
   (idempotent - safe to run on every deploy), then starts the server. Watch the API service logs
   for the Super Admin login line on first boot.

### File uploads on Render

The API writes uploaded attachments and pg_dump backups to local disk
(`apps/api/uploads`, `apps/api/backups`). Render's default web service disk is **ephemeral** -
wiped on every deploy/restart. For uploads to persist:
- Attach a Render **persistent disk** to the API service (commented out in `render.yaml`, requires
  a paid instance type - uncomment and set `mountPath: /repo/apps/api/uploads`), **or**
- Swap the upload storage for an external object store (S3-compatible) - out of scope for this
  build but the `AttachmentsService` in `apps/api/src/attachments` is the single place to change.

### Email

Release notifications, password resets, and user-creation emails go through the SMTP settings in
`apps/api/.env` / Render env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_FROM`). Without SMTP configured, the app still works - emails are logged to the `email_logs`
table with status `FAILED` instead of blocking the request.

## Option B - Docker Compose (self-hosted / VPS)

```bash
cp .env.example .env
# edit .env: set strong JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / COOKIE_SECRET / CSRF_SECRET,
# and POSTGRES_USER / POSTGRES_PASSWORD

docker compose up -d --build
```

This builds and runs three containers: `postgres`, `api` (port 4000), `web` (port 3000). Data
persists in the `postgres_data`, `api_uploads` and `api_backups` named volumes. Put a reverse
proxy (nginx, Caddy, Traefik) in front for TLS in production.

## Option C - Manual Docker build

```bash
# from the repo root (build context matters - both Dockerfiles expect the monorepo root)
docker build -f apps/api/Dockerfile -t los-api .
docker build -f apps/web/Dockerfile -t los-web --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .

docker run -d --env-file apps/api/.env -p 4000:4000 los-api
docker run -d -p 3000:3000 los-web
```

## Post-deploy checklist

- [ ] Log in as `admin@company.com`, complete the forced password change.
- [ ] Update company profile / logo / SMTP under **Admin > Settings**.
- [ ] Review the seeded demo users and either repurpose or disable them.
- [ ] Confirm `/api/health` returns `{"status":"ok","database":"ok"}`.
- [ ] Trigger a manual backup under **Admin > Settings > Backups** to confirm `pg_dump` works in
      the deployed environment.
