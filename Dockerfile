# ─── Stage 1: Install all dependencies ────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# ─── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ── Next.js standalone output ──────────────────────────────────────────────────
# server.js + traced node_modules (minimal set for the app itself)
COPY --from=builder /app/.next/standalone ./
# Static assets served by Next.js
COPY --from=builder /app/.next/static ./.next/static
# Public folder (favicon, etc.)
COPY --from=builder /app/public ./public

# ── Prisma CLI + client for startup-time schema push & seeding ─────────────────
# These are NOT included in the standalone trace — we need them for startup only.
COPY --from=builder /app/node_modules/.bin/prisma          ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma               ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma              ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma              ./node_modules/.prisma

# bcryptjs is used by the seed script
COPY --from=builder /app/node_modules/bcryptjs             ./node_modules/bcryptjs

# Prisma schema (needed by CLI at runtime) and seed script
COPY --from=builder /app/prisma    ./prisma
COPY --from=builder /app/package.json ./package.json

# ── Entrypoint ─────────────────────────────────────────────────────────────────
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

# Azure App Services expects the container to listen on this port.
# Set WEBSITES_PORT=3000 in your Azure App Service Configuration → App Settings.
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["/bin/sh", "startup.sh"]
