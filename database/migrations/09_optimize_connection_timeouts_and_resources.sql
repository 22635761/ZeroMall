-- Migration: 09_optimize_connection_timeouts_and_resources.sql
-- Description: Cấu hình Connection Timeouts, Lock Timeout & Quản lý tài nguyên CSDL.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (conn-idle-timeout.md, conn-limits.md, lock-short-transactions.md).

-- 1. Tự động ngắt giao dịch bị treo / quên commit sau 30 giây để giải phóng Row Locks và chống nghẽn Deadlock
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';

-- 2. Tự động thu hồi các kết nối nhàn rỗi (Zombie connections) sau 10 phút để giải phóng bộ nhớ RAM connection pool
ALTER SYSTEM SET idle_session_timeout = '10min';

-- 3. Giới hạn thời gian chờ khóa (Lock Timeout) 10 giây (Fail-fast thay vì xếp hàng chờ vô hạn làm treo pool)
ALTER SYSTEM SET lock_timeout = '10s';

-- 4. Giới hạn thời gian thực thi câu lệnh tối đa 60 giây (Statement Timeout) để triệt tiêu các runaway query tàn phá CPU
ALTER SYSTEM SET statement_timeout = '60s';

-- 5. Nâng cấp bộ nhớ xử lý Hash Join / Sort từ 4MB lên 16MB để tăng tốc các truy vấn tổng hợp phức tạp
ALTER SYSTEM SET work_mem = '16MB';

-- 6. Tải lại cấu hình runtime của PostgreSQL mà không cần dừng dịch vụ
SELECT pg_reload_conf();
