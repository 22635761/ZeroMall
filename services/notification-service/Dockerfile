FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/notification-service/package.json ./services/notification-service/

# Set npm retry and timeout configs for network stability
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 300000 && \
    npm config set fetch-timeout 300000

# Install ALL dependencies (dev + prod) once in builder
RUN npm ci -w services/notification-service

# Copy source code and Prisma configurations
COPY services/notification-service ./services/notification-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/notification-service
RUN npx prisma generate
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated || true

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

# Copy node_modules from builder — NO npm ci needed in runtime stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/package.json

# Copy compiled source code and generated database client
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/src/generated ./services/notification-service/src/generated
COPY --from=builder /app/services/notification-service/prisma ./services/notification-service/prisma

EXPOSE 3006

WORKDIR /app/services/notification-service

CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js"]
