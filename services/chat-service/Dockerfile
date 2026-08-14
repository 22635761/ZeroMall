FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/chat-service/package.json ./services/chat-service/

# Set npm retry and timeout configs for network stability
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-timeout 600000 && \
    npm config set prefer-offline true

# Install ALL dependencies (dev + prod) once in builder
RUN npm ci -w services/chat-service --prefer-offline || npm ci -w services/chat-service

# Copy source code and Prisma configurations
COPY services/chat-service ./services/chat-service/

# Generate Prisma Client locally in the service folder
WORKDIR /app/services/chat-service
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
COPY --from=builder /app/services/chat-service/package.json ./services/chat-service/package.json

# Copy compiled source code and generated database client
COPY --from=builder /app/services/chat-service/dist ./services/chat-service/dist
COPY --from=builder /app/services/chat-service/src/generated ./services/chat-service/src/generated
COPY --from=builder /app/services/chat-service/prisma ./services/chat-service/prisma

EXPOSE 3007

WORKDIR /app/services/chat-service

CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js"]
