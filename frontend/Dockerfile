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

# Đón nhận các biến build-time từ docker-compose để Vite có thể nhúng vào bundle
ARG VITE_GOONG_API_KEY
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_API_KEY
ARG VITE_CLOUDINARY_UPLOAD_PRESET
ARG VITE_GHN_TOKEN
ARG VITE_GHN_SHOP_ID

# Thiết lập chúng làm biến môi trường cho Vite build
ENV VITE_GOONG_API_KEY=$VITE_GOONG_API_KEY
ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
ENV VITE_CLOUDINARY_API_KEY=$VITE_CLOUDINARY_API_KEY
ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
ENV VITE_GHN_TOKEN=$VITE_GHN_TOKEN
ENV VITE_GHN_SHOP_ID=$VITE_GHN_SHOP_ID

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
