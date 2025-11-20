FROM oven/bun:latest as builder

WORKDIR /app

COPY package.json bun.lock ./
COPY tsconfig.json tsconfig.build.json ./
COPY src/bot ./apps/bot
COPY libs ./libs

RUN bun install
RUN bun run build


FROM oven/bun:slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production

CMD ["bun", "dist/apps/bot/main.js"]
