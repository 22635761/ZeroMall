FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/product-service/package.json ./services/product-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/product-service

# Copy source code and Prisma configurations
COPY services/product-service ./services/product-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/product-service
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/product-service/package.json ./services/product-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/product-service

# Copy compiled source code and generated database client
COPY --from=builder /app/services/product-service/dist ./services/product-service/dist
COPY --from=builder /app/services/product-service/src/generated ./services/product-service/src/generated
COPY --from=builder /app/services/product-service/prisma ./services/product-service/prisma

EXPOSE 3002

WORKDIR /app/services/product-service

CMD ["node", "dist/src/main"]
