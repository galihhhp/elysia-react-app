FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production
COPY src ./src

FROM oven/bun:1-alpine AS production
RUN addgroup -g 1001 -S elysia-group && \
    adduser -S elysia -u 1001 -G elysia-group
WORKDIR /app
RUN mkdir -p /app/logs && \
    chown -R elysia:elysia-group /app/logs

COPY --from=builder --chown=elysia:elysia-group /app/node_modules ./node_modules
COPY --from=builder --chown=elysia:elysia-group /app/src ./src
COPY --chown=elysia:elysia-group package.json ./

USER elysia
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --version || exit 1
CMD ["bun", "run", "src/index.ts"]
