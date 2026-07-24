FROM oven/bun:1.2-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock ./
RUN --mount=type=secret,id=heroui_auth_token,required=true \
    HEROUI_AUTH_TOKEN="$(cat /run/secrets/heroui_auth_token)" \
    bun install --frozen-lockfile

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Force V8 engine to cap heap memory at 1200MB to prevent Next.js build from OOMing the server
ENV NODE_OPTIONS="--max-old-space-size=1200"

RUN bun run build

FROM public.ecr.aws/docker/library/node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
