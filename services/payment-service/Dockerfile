FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/payment-service/package.json ./services/payment-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/payment-service

# Copy source code and Prisma configurations
COPY services/payment-service ./services/payment-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/payment-service
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/payment-service/package.json ./services/payment-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/payment-service

# Copy compiled source code and generated database client
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist
COPY --from=builder /app/services/payment-service/src/generated ./services/payment-service/src/generated
COPY --from=builder /app/services/payment-service/prisma ./services/payment-service/prisma

EXPOSE 3005

WORKDIR /app/services/payment-service

CMD ["node", "dist/src/main"]
