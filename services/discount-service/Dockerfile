FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/discount-service/package.json ./services/discount-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/discount-service

# Copy source code and Prisma configurations
COPY services/discount-service ./services/discount-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/discount-service
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/discount-service/package.json ./services/discount-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/discount-service

# Copy compiled source code and generated database client
COPY --from=builder /app/services/discount-service/dist ./services/discount-service/dist
COPY --from=builder /app/services/discount-service/src/generated ./services/discount-service/src/generated
COPY --from=builder /app/services/discount-service/prisma ./services/discount-service/prisma

EXPOSE 3003

WORKDIR /app/services/discount-service

CMD ["node", "dist/src/main"]
