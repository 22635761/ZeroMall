FROM python:3.11-slim

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho OpenCV và xử lý hình ảnh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/tryon-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy mã nguồn service và tài nguyên ảnh mẫu
COPY services/tryon-service ./services/tryon-service
COPY frontend/public ./frontend/public

EXPOSE 5006

ENV TRYON_PORT=5006
ENV PYTHONUNBUFFERED=1

CMD ["python", "services/tryon-service/server.py"]
