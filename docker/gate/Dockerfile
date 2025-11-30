FROM oven/bun:latest AS deps

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock* ./
COPY prisma/ ./prisma

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN bun install --verbose --no-cache --ignore-scripts

COPY node_modules/.prisma/ ./node_modules/.prisma

RUN bunx prisma generate

FROM deps AS build
ARG SERVICE_NAME

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY /libs ./libs
COPY src/$SERVICE_NAME .//$SERVICE_NAME
COPY tsconfig*.json nest-cli.json ./
RUN if [ -n "$SERVICE_NAME" ]; then \
      echo "🚀 Building only $SERVICE_NAME" && \
      bun run build $SERVICE_NAME; \
    else \
      echo "❌ SERVICE_NAME is not set. Please provide --build-arg SERVICE_NAME=<name>" >&2 && \
      exit 1; \
    fi


FROM oven/bun:latest AS runtime

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist/apps/$SERVICE_NAME ./dist/apps/$SERVICE_NAME

COPY package.json bun.lockb* ./
COPY envs/${ENVIRONMENT} ./envs/${ENVIRONMENT}


CMD ["sh", "-c", "echo '✅ Container ready! To run: bun run dist/apps/<service>/main.js'"]
