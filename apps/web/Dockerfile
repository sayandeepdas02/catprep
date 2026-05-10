FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN npm install --workspaces=false

COPY apps/web ./apps/web
COPY packages ./packages

WORKDIR /app/apps/web
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/next.config.ts ./
COPY --from=builder /app/apps/web/public ./public

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start"]