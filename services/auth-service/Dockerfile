FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/auth-service/package.json ./services/auth-service/

RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-timeout 600000 && \
    npm config set prefer-offline true
RUN npm ci -w services/auth-service --prefer-offline || npm ci -w services/auth-service

COPY services/auth-service ./services/auth-service/

WORKDIR /app/services/auth-service
RUN npx prisma generate
RUN npm run build
RUN cp -r src/generated dist/src/generated || true

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/package.json
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/src/generated ./services/auth-service/src/generated
COPY --from=builder /app/services/auth-service/prisma ./services/auth-service/prisma

EXPOSE 3001

WORKDIR /app/services/auth-service

CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js"]
