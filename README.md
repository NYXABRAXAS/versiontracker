# LOS Version Management Portal

A centralized, enterprise-grade version management portal for a Loan Origination System (LOS)
deployed across multiple banks and NBFCs. Tracks every release across Development, QA, SIT, UAT,
Production, Hotfix, Patch and Disaster Recovery environments, with full audit history, role-based
access control, change logs, bug tracking, deployment pipelines, approvals, reports and exports.

## Tech Stack

**Frontend** - React, Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Radix UI primitives
(shadcn-style component library), React Hook Form + Zod, TanStack Table, Recharts.

**Backend** - NestJS, PostgreSQL, Prisma ORM, JWT auth (access + rotating refresh tokens in
httpOnly cookies), bcrypt, class-validator, Helmet, rate limiting, CSRF protection, Swagger.

**Deployment** - Docker, Docker Compose, Render Blueprint (`render.yaml`).

## Monorepo Layout

```
apps/api/     NestJS + Prisma + PostgreSQL backend (REST API, Swagger at /api/docs)
apps/web/     Next.js 15 frontend
docs/         Installation, deployment, backup/restore guides
scripts/      Operational scripts (database restore)
docker-compose.yml, render.yaml, .env.example
```

## Quick Start (local)

```bash
npm install
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
# edit apps/api/.env: set DATABASE_URL to your local Postgres

npm run prisma:migrate
npm run prisma:seed

npm run dev:api    # http://localhost:4000  (Swagger: /api/docs)
npm run dev:web    # http://localhost:3000
```

Default login (forced password change on first sign-in):

```
Email:    admin@company.com
Password: Admin@123
```

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for full local setup and
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Render / Docker deployment.

## Core Capabilities

- **Versions module** - the central release record: product, environment, release type, priority,
  severity, status, developer/tester/approver, Git commit/branch/build, sprint & ticket, estimated
  vs actual hours, deployment window & downtime, rollback tracking, database/API/config change
  notes, breaking-change and backward-compatibility flags, release notes, attachments.
- **Change logs & bug fixes** - unlimited per version, each with old/new behaviour, business
  requirement, reviewer sign-off.
- **Deployment history** - full PRO -> QA -> UAT -> Production pipeline trail per version.
- **Version comparison** - diff any two versions: added/removed/modified change log entries, field
  diffs, bug fix deltas.
- **Release notes generator** - export to PDF, Word, Excel, CSV, or email directly from a version.
- **Dashboards & reports** - executive KPI cards, release/bug trend charts, developer contribution,
  per-product/environment breakdowns, release/developer/QA/deployment/bug-summary reports with
  PDF/Excel/CSV export.
- **Admin** - users (with per-product/environment/module access scoping), roles with a full
  module x action permission matrix, generic no-code Masters engine (add new products,
  environments, statuses, etc. without touching code), audit logs, login history, announcements,
  system settings (company profile, SMTP, password policy, session timeout, upload limits, logo).
- **Workflow** - maker-checker approvals, release freeze calendar, in-app notifications, favourite
  versions, global search.
- **Security** - JWT + rotating refresh tokens, bcrypt, Helmet, rate limiting, CSRF double-submit
  cookie, RBAC on every endpoint, full audit trail (nothing is ever hard-deleted - soft delete
  throughout), scheduled encrypted-at-rest-adjacent secrets handling for SMTP.

## License

Internal project - all rights reserved.
