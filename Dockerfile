# syntax=docker/dockerfile:1

FROM oven/bun:1.3 AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile


FROM oven/bun:1.3 AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bun run build


FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nuxt \
  && useradd --system --uid 1001 --gid nuxt nuxt

COPY --from=builder --chown=nuxt:nuxt /app/.output ./.output

USER nuxt

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
