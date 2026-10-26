# Build from the repository root. Public settings are compiled into Next.js.
FROM node:24-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g bun@1.4.4
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN bun install --frozen-lockfile --filter web
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_CONSOLE_API_BASE_URL=https://console.hemia.cloud
ARG NEXT_PUBLIC_SSO_COOKIE_NAME=console_session
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CONSOLE_API_BASE_URL=$NEXT_PUBLIC_CONSOLE_API_BASE_URL \
    NEXT_PUBLIC_SSO_COOKIE_NAME=$NEXT_PUBLIC_SSO_COOKIE_NAME
RUN cd apps/web && bun run build

FROM node:24-bookworm-slim AS runtime
ARG CONSOLE_REVISION=local
LABEL org.opencontainers.image.revision=$CONSOLE_REVISION
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=5176 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 5176
CMD ["node", "apps/web/server.js"]
