FROM node:22-alpine AS builder

WORKDIR /app/services/delivery-service

# Copy package.json
COPY services/delivery-service/package.json ./

# Set npm retry and timeout configs for network stability
RUN npm config set fetch-retries 5 && npm config set fetch-retry-maxtimeout 120000

# Install dependencies directly
RUN npm install

# Copy source code and Prisma configurations
COPY services/delivery-service ./

# Generate Prisma Client locally in the service folder
RUN npx prisma generate

# Compile NestJS typescript files
RUN npm run build

# Copy generated client into dist/src/generated for runtime import resolution
RUN cp -r src/generated dist/src/generated

# Stage 2: Minimal runtime image
FROM node:22-alpine

WORKDIR /app/services/delivery-service

# Copy node_modules from builder
COPY --from=builder /app/services/delivery-service/node_modules ./node_modules
COPY --from=builder /app/services/delivery-service/package.json ./package.json

# Copy compiled source code and generated database client
COPY --from=builder /app/services/delivery-service/dist ./dist
COPY --from=builder /app/services/delivery-service/src/generated ./src/generated
COPY --from=builder /app/services/delivery-service/prisma ./prisma

EXPOSE 3008

CMD ["node", "dist/src/main"]
