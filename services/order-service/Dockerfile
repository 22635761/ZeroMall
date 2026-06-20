FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/order-service/package.json ./services/order-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/order-service

# Copy source code and Prisma configurations
COPY services/order-service ./services/order-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/order-service
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/order-service/package.json ./services/order-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/order-service

# Copy compiled source code and generated database client
COPY --from=builder /app/services/order-service/dist ./services/order-service/dist
COPY --from=builder /app/services/order-service/src/generated ./services/order-service/src/generated
COPY --from=builder /app/services/order-service/prisma ./services/order-service/prisma

EXPOSE 3004

WORKDIR /app/services/order-service

CMD ["node", "dist/src/main"]
