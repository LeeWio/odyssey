FROM public.ecr.aws/docker/library/node:22-alpine AS base

WORKDIR /app

RUN npm install -g bun

FROM base AS deps

COPY package.json bun.lock ./
RUN --mount=type=secret,id=heroui_auth_token,required=true \
    HEROUI_AUTH_TOKEN="$(cat /run/secrets/heroui_auth_token)" \
    bun install

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

FROM public.ecr.aws/docker/library/node:22-alpine AS runner

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
