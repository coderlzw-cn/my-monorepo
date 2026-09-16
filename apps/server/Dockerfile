# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter demo --prod --frozen-lockfile

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter demo --frozen-lockfile

COPY tooling/typescript/tsconfig.base.json ./tooling/typescript/tsconfig.base.json
COPY apps/server/nest-cli.json apps/server/tsconfig.json apps/server/tsconfig.build.json apps/server/webpack.config.cjs ./apps/server/
COPY apps/server/src ./apps/server/src
WORKDIR /app/apps/server
RUN pnpm run build

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app/apps/server

COPY --from=production-dependencies --chown=node:node /app/node_modules /app/node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/server/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/server/dist ./dist
COPY --chown=node:node apps/server/package.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
