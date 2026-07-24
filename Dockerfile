FROM public.ecr.aws/docker/library/node:24-alpine AS base

WORKDIR /app

# Install Bun via ghproxy.net proxy to bypass docker.io blocking and ensure high-speed, stable builds
RUN apk add --no-cache curl unzip \
    && curl -fsSL -o bun.zip "https://ghproxy.net/https://github.com/oven-sh/bun/releases/download/bun-v1.3.14/bun-linux-x64.zip" \
    && unzip bun.zip \
    && mv bun-linux-x64/bun /usr/local/bin/bun \
    && chmod +x /usr/local/bin/bun \
    && rm -rf bun.zip bun-linux-x64

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


# ========================================================
# 🌟 Stage 5: runner-prebuilt (专为 GitHub Actions 宿主机编译打造的极速精简运行层)
# ========================================================
FROM public.ecr.aws/docker/library/node:24-alpine AS runner-prebuilt

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建无特权生产运行账号
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 直接从 GitHub 宿主机上 COPY 编译完的打包产物
COPY public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

