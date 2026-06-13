# Stage 1: Build React SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root monorepo package configuration files
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install dependencies using npm workspace scoping
RUN npm ci -w frontend

# Copy frontend source code
COPY frontend ./frontend/

# Build production bundle
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled frontend assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
