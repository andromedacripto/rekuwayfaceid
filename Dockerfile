# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN npm install -g bun@1.2

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ─── Stage 2: builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g bun@1.2

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (needs a valid-format URL, actual connection not needed at build)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN node_modules/.bin/prisma generate

# Build Next.js standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL is only needed at runtime — skip DB calls during build
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

# ─── Stage 3: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema + generated client for runtime migrations
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy startup script
COPY --from=builder /app/scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./scripts/start.sh"]
