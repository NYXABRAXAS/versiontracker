# LOS Version Management Portal - API (NestJS + Prisma)
# Build context MUST be the monorepo root, e.g.:
#   docker build -f apps/api/Dockerfile -t los-api .

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run prisma:generate --workspace=apps/api
RUN npm run build --workspace=apps/api

# ---------- Stage 2: production dependencies only ----------
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache openssl libc6-compat
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev --workspace=apps/api --include-workspace-root
COPY apps/api/prisma apps/api/prisma
RUN npm run prisma:generate --workspace=apps/api

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl libc6-compat postgresql-client
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json
# prisma/seed.ts imports from ../src at runtime via ts-node (--transpile-only,
# so no type-checking needed) - the compiled dist/ output isn't enough on its
# own for the seed script's relative imports.
COPY apps/api/src apps/api/src

RUN mkdir -p apps/api/uploads apps/api/backups && \
    addgroup -S nodejs && adduser -S nestjs -G nodejs && \
    chown -R nestjs:nodejs /repo/apps/api

WORKDIR /repo/apps/api
USER nestjs

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
