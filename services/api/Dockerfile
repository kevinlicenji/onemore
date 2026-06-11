# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY services/api/package.json services/api/
RUN pnpm install --frozen-lockfile --ignore-scripts \
  --filter @onemore/api \
  --filter @onemore/shared \
  --filter @onemore/eslint-config

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/api/node_modules ./services/api/node_modules
COPY packages ./packages
COPY services/api ./services/api
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
RUN pnpm --filter @onemore/api... build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/services/api/dist ./services/api/dist
COPY --from=build /app/services/api/node_modules ./services/api/node_modules
COPY --from=build /app/services/api/package.json ./services/api/package.json
COPY --from=build /app/services/api/prisma ./services/api/prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

WORKDIR /app/services/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
