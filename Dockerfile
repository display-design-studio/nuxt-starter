# syntax=docker/dockerfile:1

# =============================================================================
# Dependencies
# =============================================================================

FROM oven/bun:1.3 AS deps

WORKDIR /app

# Copy dependency manifests first to maximize Docker layer caching.
COPY package.json bun.lock ./

# Install all dependencies required to build the Nuxt application.
RUN bun install --frozen-lockfile


# =============================================================================
# Build
# =============================================================================

FROM oven/bun:1.3 AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server

# Reuse the dependencies installed in the previous stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the application source code.
COPY . .

# Build the production Nuxt application.
RUN bun run build


# =============================================================================
# Production runtime
# =============================================================================

FROM node:22.22.2-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Run the application as an unprivileged system user.
RUN groupadd --system --gid 1001 nuxt \
  && useradd --system --uid 1001 --gid nuxt nuxt

# Copy only the generated Nuxt/Nitro production output.
COPY --from=builder --chown=nuxt:nuxt /app/.output ./.output

USER nuxt

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
