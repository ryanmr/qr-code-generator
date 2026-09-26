FROM node:24-bookworm-slim AS build
WORKDIR /app

# Install against the lockfile first so dependency layers cache independently
# of source changes.
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm ci

COPY server ./server
COPY web ./web
RUN npm run build

# Drop dev dependencies from what gets copied forward.
RUN npm prune --omit=dev


FROM node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/web/dist ./web/dist

ENV WEB_DIST=/app/web/dist

EXPOSE 8640

# Traefik's Docker provider skips unhealthy containers, so this only asks
# whether the process is serving.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8640)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Stateless: nothing to write, so no reason to be root.
USER node

CMD ["node", "server/dist/index.js"]
