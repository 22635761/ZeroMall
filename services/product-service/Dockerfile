FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/product-service/package.json ./services/product-service/

RUN npm config set fetch-retries 5 && npm config set fetch-retry-maxtimeout 120000
RUN npm ci -w services/product-service --prefer-offline

COPY services/product-service ./services/product-service/

WORKDIR /app/services/product-service
RUN npx prisma generate
RUN npm run build
RUN cp -r src/generated dist/src/generated || true

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/services/product-service/package.json ./services/product-service/package.json
COPY --from=builder /app/services/product-service/dist ./services/product-service/dist
COPY --from=builder /app/services/product-service/src/generated ./services/product-service/src/generated
COPY --from=builder /app/services/product-service/prisma ./services/product-service/prisma

EXPOSE 3002

WORKDIR /app/services/product-service

CMD ["node", "dist/src/main"]
