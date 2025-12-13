FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --verbose --no-cache

FROM deps AS build
ARG SERVICE_NAME
WORKDIR /app
COPY /libs ./libs
COPY src/migrations ./src/migrations
COPY src/$SERVICE_NAME ./src/$SERVICE_NAME
COPY tsconfig*.json nest-cli.json ./
RUN bun run build:$SERVICE_NAME

FROM oven/bun:1.3 AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/$SERVICE_NAME ./dist/$SERVICE_NAME
COPY package.json bun.lockb* ./
COPY envs/${ENVIRONMENT} ./envs/${ENVIRONMENT}
CMD ["sh", "-c", "echo '✅ Container ready! To run: bun run dist/<service>/main.js'"]
