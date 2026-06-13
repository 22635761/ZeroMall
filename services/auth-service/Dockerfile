FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/auth-service/package.json ./services/auth-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/auth-service

# Copy source code and Prisma configurations
COPY services/auth-service ./services/auth-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/auth-service
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/auth-service/package.json ./services/auth-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/auth-service

# Copy compiled source code and generated database client
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/src/generated ./services/auth-service/src/generated
COPY --from=builder /app/services/auth-service/prisma ./services/auth-service/prisma

EXPOSE 3001

WORKDIR /app/services/auth-service

CMD ["node", "dist/src/main"]
