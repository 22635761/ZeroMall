FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY services/discount-service/package.json ./services/discount-service/

# Set npm retry and timeout configs for network stability
RUN npm config set fetch-retries 5 && npm config set fetch-retry-maxtimeout 120000

# Install ALL dependencies (dev + prod) once in builder
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

# Copy node_modules from builder — NO npm ci needed in runtime stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/services/discount-service/package.json ./services/discount-service/package.json

# Copy compiled source code and generated database client
COPY --from=builder /app/services/discount-service/dist ./services/discount-service/dist
COPY --from=builder /app/services/discount-service/src/generated ./services/discount-service/src/generated
COPY --from=builder /app/services/discount-service/prisma ./services/discount-service/prisma

EXPOSE 3003

WORKDIR /app/services/discount-service

CMD ["node", "dist/src/main"]
