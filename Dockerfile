# ---- deps: full install for building ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy values only needed for build-time prerender analysis; runtime uses real env.
ENV DATABASE_URL=postgres://build:build@localhost/build
RUN npm run build

# ---- production deps only ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---- runtime ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S pythia && adduser -S pythia -G pythia
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY package.json ./
USER pythia
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1 || exit 1
CMD ["sh", "-c", "node scripts/migrate.js && node build"]
