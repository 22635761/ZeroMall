FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies using npm workspace scoping
RUN npm ci -w services/notification-service

# Copy source code
COPY services/notification-service ./services/notification-service/

# Compile NestJS typescript files
WORKDIR /app/services/notification-service
RUN npm run build

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY services/notification-service/package.json ./services/notification-service/

# Install only production dependencies
RUN npm ci --omit=dev -w services/notification-service

# Copy compiled source code
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

EXPOSE 3006

WORKDIR /app/services/notification-service

CMD ["node", "dist/main"]
