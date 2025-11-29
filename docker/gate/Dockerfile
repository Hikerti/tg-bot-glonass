FROM oven/bun:latest as builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY tsconfig.json tsconfig.build.json ./
COPY src/gate ./apps/gate
COPY libs ./libs

RUN bun run build

FROM oven/bun:slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production

CMD ["bun", "dist/apps/gate/main.js"]
