FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/clip-service/requirements.txt ./
# Tải torch bản CPU siêu nhẹ để tối ưu dung lượng và tốc độ build
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch
RUN pip install --no-cache-dir -r requirements.txt

COPY services/clip-service ./services/clip-service

EXPOSE 5005

ENV CLIP_PORT=5005
ENV PYTHONUNBUFFERED=1

CMD ["python", "services/clip-service/server.py"]
