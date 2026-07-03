# Installation Guide (Local Development)

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (running locally, or via Docker)
- `pg_dump` / `psql` on your PATH (needed for the backup/restore features)

## 1. Install dependencies

```bash
npm install
```

This installs both `apps/api` and `apps/web` via npm workspaces from the repo root.

## 2. Configure environment variables

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Edit `apps/api/.env`:
- `DATABASE_URL` - point at your local Postgres instance, e.g.
  `postgresql://postgres@localhost:5432/los_version_portal?schema=public`
- Generate real secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`,
  `CSRF_SECRET` (e.g. `openssl rand -hex 64`) - the defaults are only safe for local dev.

Edit `apps/web/.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

## 3. Create the database and run migrations

```bash
createdb los_version_portal   # or create it via your Postgres client of choice
npm run prisma:migrate        # applies migrations from apps/api/prisma/migrations
npm run prisma:seed           # seeds roles, masters, demo users and demo versions
```

The seed script prints the Super Admin login on completion:
`admin@company.com` / `Admin@123` (forced password change on first login).

## 4. Run the app

In two terminals:

```bash
npm run dev:api   # NestJS API on http://localhost:4000 (Swagger at /api/docs)
npm run dev:web   # Next.js on http://localhost:3000
```

Visit http://localhost:3000, sign in with the Super Admin credentials above, and set a new
password when prompted.

## Troubleshooting

- **"password authentication failed" from Prisma**: check `DATABASE_URL` matches how your local
  Postgres is configured (trust vs password auth).
- **CORS errors in the browser console**: confirm `CORS_ORIGINS` in `apps/api/.env` includes
  `http://localhost:3000`.
- **File uploads fail**: `apps/api/uploads` is created automatically on API boot; make sure the
  process has write permission to `apps/api/`.
- **Backups fail with "pg_dump: command not found"**: install the PostgreSQL client tools and set
  `PG_DUMP_PATH` in `apps/api/.env` to the full path if it's not on your PATH.
