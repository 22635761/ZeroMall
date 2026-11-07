#!/bin/bash
set -e

echo "=================================================="
echo "   ZeroMall - Khôi Phục Cơ Sở Dữ Liệu PostgreSQL   "
echo "=================================================="

SQL_FILE="database/init-zeromall.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "[!] Lỗi: Không tìm thấy tệp '$SQL_FILE'!"
  exit 1
fi

echo "[*] Đang kiểm tra container zeromall-postgres..."
if ! docker ps --format '{{.Names}}' | grep -q "^zeromall-postgres$"; then
  echo "[!] Container zeromall-postgres chưa khởi động. Hãy chạy 'docker compose up -d postgres' trước!"
  exit 1
fi

echo "[*] Đang nạp toàn bộ cấu trúc & dữ liệu vào CSDL 'zeromall'..."
docker exec -i zeromall-postgres psql -U postgres -d zeromall < "$SQL_FILE"

echo "=================================================="
echo " [+] Nạp CSDL thành công 100%!                    "
echo " - Bao gồm: auth, product, discount, order, payment, delivery"
echo " - Hơn 10.000 sản phẩm, flash sale, tài khoản test, đơn hàng & bưu cục"
echo "=================================================="
