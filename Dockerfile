# ─── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the linux-debian-openssl-3.0.x runtime
RUN npx prisma generate

# Create a temporary SQLite database so Next.js can prerender pages at build
# time (the root page queries the DB). This DB is discarded after the build.
RUN DATABASE_URL="file:/tmp/build.db" npx prisma db push --skip-generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/build.db"
RUN npm run build

# ─── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Next.js standalone output ──────────────────────────────────────────────────
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# ── Prisma CLI + client for startup-time schema push & seeding ─────────────────
# These are not included in the standalone trace — needed for startup.sh only.
COPY --from=builder /app/node_modules/.bin/prisma          ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma               ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma              ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma              ./node_modules/.prisma

# bcryptjs is used by the seed script
COPY --from=builder /app/node_modules/bcryptjs             ./node_modules/bcryptjs

# Prisma schema (needed by CLI at runtime) and seed script
COPY --from=builder /app/prisma       ./prisma
COPY --from=builder /app/package.json ./package.json

# ── Entrypoint ─────────────────────────────────────────────────────────────────
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Azure App Services: set WEBSITES_PORT=3000 in App Settings.
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["/bin/sh", "startup.sh"]
