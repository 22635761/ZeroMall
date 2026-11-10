-- ====================================================================
-- SEED DỮ LIỆU MẠNG LƯỚI LOGISTICS TOÀN QUỐC (SPX EXPRESS / ZEROMALL)
-- Bao gồm:
-- 1. 2 Mega SOC (Hòa Cầm SOC - Đà Nẵng, Trà Nóc SOC - Cần Thơ)
-- 2. 6 Bưu Cục Phát Last-Mile (Q.1, Thủ Đức, Đống Đa, Thanh Xuân, Hải Châu, Ninh Kiều)
-- 3. 12 Tài khoản Auth (Trưởng trạm Hub Operator, Tài xế Linehaul, Shipper xe máy/van)
-- 4. 8 Hồ sơ Tài xế & Shipper giao hàng chuyên trách
-- Mật khẩu mặc định cho tất cả tài khoản: 123456
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. THÊM CÁC TRẠM VÀ BƯU CỤC MỚI VÀO delivery."Hub"
-- --------------------------------------------------------------------

-- A. Mega SOC Miền Trung & Tây Nam Bộ
INSERT INTO delivery."Hub" (id, code, name, address, province, district, ward, latitude, longitude, type, status, "createdAt", "updatedAt")
VALUES
  ('hub-dng-soc', 'DNG01', 'Trung Tâm Phân Loại Hòa Cầm SOC', 'KCN Hòa Cầm, Phường Hòa Thọ Tây', 'Đà Nẵng', 'Quận Cẩm Lệ', 'Phường Hòa Thọ Tây', 16.0125, 108.1812, 'SORTING_CENTER', 'ACTIVE', NOW(), NOW()),
  ('hub-ct-soc', 'CT01', 'Trung Tâm Phân Loại Trà Nóc SOC', 'KCN Trà Nóc 1, Phường Trà Nóc', 'Cần Thơ', 'Quận Bình Thủy', 'Phường Trà Nóc', 10.0831, 105.7425, 'SORTING_CENTER', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  type = EXCLUDED.type,
  "updatedAt" = NOW();

-- B. Bưu Cục Giao Hàng Chặng Cuối (Delivery Hubs)
INSERT INTO delivery."Hub" (id, code, name, address, province, district, ward, latitude, longitude, type, status, "createdAt", "updatedAt")
VALUES
  ('hub-q1-01', 'Q01', 'Bưu Cục Giao Hàng Quận 1 Hub', '68 Nguyễn Huệ, Phường Bến Nghé', 'Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', 10.7745, 106.7032, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW()),
  ('hub-td-01', 'TD01', 'Bưu Cục Giao Hàng Thủ Đức Hub', '216 Võ Văn Ngân, Phường Linh Chiểu', 'Hồ Chí Minh', 'Thành phố Thủ Đức', 'Phường Linh Chiểu', 10.8507, 106.7718, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW()),
  ('hub-dd-01', 'DD01', 'Bưu Cục Giao Hàng Đống Đa Hub', '102 Thái Hà, Phường Trung Liệt', 'Hà Nội', 'Quận Đống Đa', 'Phường Trung Liệt', 21.0118, 105.8197, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW()),
  ('hub-tx-01', 'TX01', 'Bưu Cục Giao Hàng Thanh Xuân Hub', '48 Nguyễn Trãi, Phường Thượng Đình', 'Hà Nội', 'Quận Thanh Xuân', 'Phường Thượng Đình', 20.9984, 105.8142, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW()),
  ('hub-hc-01', 'HC01', 'Bưu Cục Giao Hàng Hải Châu Hub', '155 Nguyễn Văn Linh, Phường Nam Dương', 'Đà Nẵng', 'Quận Hải Châu', 'Phường Nam Dương', 16.0601, 108.2155, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW()),
  ('hub-nk-01', 'NK01', 'Bưu Cục Giao Hàng Ninh Kiều Hub', '30 Tháng 4, Phường An Lạc', 'Cần Thơ', 'Quận Ninh Kiều', 'Phường An Lạc', 10.0315, 105.7794, 'DESTINATION_HUB', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  type = EXCLUDED.type,
  "updatedAt" = NOW();


-- --------------------------------------------------------------------
-- 2. TẠO CÁC TÀI KHOẢN NGƯỜI DÙNG VÀO auth."User" (MẬT KHẨU: 123456)
-- Hash: $2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu
-- --------------------------------------------------------------------

INSERT INTO auth."User" (id, email, password, name, role, "phoneNumber", status, "createdAt", "updatedAt")
VALUES
  -- Hub Operators (Quản lý trạm / bưu cục)
  ('user-hub-q1', 'hub_q1@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Phạm Quốc Đạt (Trưởng Bưu Cục Q1)', 'HUB_OPERATOR', '0901888111', 'ACTIVE', NOW(), NOW()),
  ('user-hub-td', 'hub_thuduc@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Vũ Quốc Toàn (Trưởng Bưu Cục Thủ Đức)', 'HUB_OPERATOR', '0901888112', 'ACTIVE', NOW(), NOW()),
  ('user-hub-dd', 'hub_dongda@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Hoàng Văn Tuyến (Trưởng Bưu Cục Đống Đa)', 'HUB_OPERATOR', '0901888222', 'ACTIVE', NOW(), NOW()),
  ('user-hub-dng', 'hub_danang@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Nguyễn Đức Hậu (Quản Lý Hòa Cầm SOC)', 'HUB_OPERATOR', '0901888333', 'ACTIVE', NOW(), NOW()),
  ('user-hub-ct', 'hub_cantho@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Trương Hữu Nghĩa (Quản Lý Trà Nóc SOC)', 'HUB_OPERATOR', '0901888444', 'ACTIVE', NOW(), NOW()),

  -- Linehaul Truck Drivers (Tài xế xe tải đường dài kho tổng SOC)
  ('driver-user-truck-dng', 'driver_dng@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Trần Hữu Thắng (ZMX Linehaul Miền Trung)', 'DRIVER', '0913777888', 'ACTIVE', NOW(), NOW()),
  ('driver-user-truck-ct', 'driver_ct@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Võ Văn Kiệt (ZMX Linehaul Miền Tây)', 'DRIVER', '0938999111', 'ACTIVE', NOW(), NOW()),

  -- Last-Mile Shippers (Shipper giao hàng xe máy / xe van tại Bưu Cục Phát)
  ('driver-user-q1-01', 'shipper_q1@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Phan Thanh Tuấn (SPX Quận 1)', 'DRIVER', '0909111222', 'ACTIVE', NOW(), NOW()),
  ('driver-user-q1-van', 'shipper_van_q1@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Nguyễn Công Danh (Van Hàng Cồng Kềnh Q1)', 'DRIVER', '0909333444', 'ACTIVE', NOW(), NOW()),
  ('driver-user-td-01', 'shipper_thuduc@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Đặng Hoàng Nam (SPX Thủ Đức)', 'DRIVER', '0977222333', 'ACTIVE', NOW(), NOW()),
  ('driver-user-dd-01', 'shipper_dongda@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Vũ Mạnh Cường (SPX Đống Đa)', 'DRIVER', '0982555666', 'ACTIVE', NOW(), NOW()),
  ('driver-user-tx-01', 'shipper_thanhxuan@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Đỗ Hoàng Long (SPX Thanh Xuân)', 'DRIVER', '0986777888', 'ACTIVE', NOW(), NOW()),
  ('driver-user-hc-01', 'shipper_haichau@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Lê Phước Vinh (SPX Hải Châu)', 'DRIVER', '0905333555', 'ACTIVE', NOW(), NOW()),
  ('driver-user-nk-01', 'shipper_cantho@zeromall.com', '$2b$10$j4c0HJNVZcYp2WIvAmXh/uoBT5nCVfmSMU3lK.h2PnNQYL2ECapJu', 'Huỳnh Minh Trí (SPX Ninh Kiều)', 'DRIVER', '0939888222', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  "phoneNumber" = EXCLUDED."phoneNumber",
  "updatedAt" = NOW();


-- --------------------------------------------------------------------
-- 3. TẠO HỒ SƠ TÀI XẾ VÀO delivery."Driver"
-- --------------------------------------------------------------------

-- A. Tài Xế Xe Tải Tuyến Đường Dài (Gán vào Kho Tổng SOC)
INSERT INTO delivery."Driver" (id, "userId", name, phone, "vehicleType", "vehicleNumber", "hubId", status, "operatingArea", "assignedProvince", "createdAt", "updatedAt")
VALUES
  ('driver-truck-dng', 'driver-user-truck-dng', 'Trần Hữu Thắng (ZMX Linehaul 15T)', '0913777888', 'TRUCK', '43C-668.89', 'hub-dng-soc', 'AVAILABLE', 'Tuyến Miền Trung - Tây Nguyên (Đà Nẵng ➔ Quy Nhơn ➔ Buôn Ma Thuột)', 'Đà Nẵng', NOW(), NOW()),
  ('driver-truck-ct', 'driver-user-truck-ct', 'Võ Văn Kiệt (ZMX Linehaul 8T)', '0938999111', 'TRUCK', '65C-444.77', 'hub-ct-soc', 'AVAILABLE', 'Tuyến Tây Nam Bộ (Cần Thơ ➔ An Giang ➔ Kiên Giang ➔ Cà Mau)', 'Cần Thơ', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  "vehicleType" = EXCLUDED."vehicleType",
  "vehicleNumber" = EXCLUDED."vehicleNumber",
  "hubId" = EXCLUDED."hubId",
  "operatingArea" = EXCLUDED."operatingArea",
  "updatedAt" = NOW();

-- B. Shipper Phát Hàng Chặng Cuối (Gán vào Bưu Cục Hub)
INSERT INTO delivery."Driver" (id, "userId", name, phone, "vehicleType", "vehicleNumber", "hubId", status, "operatingArea", "assignedDistrict", "assignedProvince", "createdAt", "updatedAt")
VALUES
  ('driver-q1-01', 'driver-user-q1-01', 'Phan Thanh Tuấn (SPX Quận 1)', '0909111222', 'MOTORBIKE', '59-T1 668.89', 'hub-q1-01', 'AVAILABLE', 'Bến Nghé, Đa Kao, Bến Thành, Nguyễn Thái Bình', 'Quận 1', 'Hồ Chí Minh', NOW(), NOW()),
  ('driver-q1-van', 'driver-user-q1-van', 'Nguyễn Công Danh (Van Hàng Cồng Kềnh Q1)', '0909333444', 'VAN', '51D-888.22', 'hub-q1-01', 'AVAILABLE', 'Toàn Quận 1 & Quận 3 (Bưu phẩm trên 10kg)', 'Quận 1', 'Hồ Chí Minh', NOW(), NOW()),
  ('driver-td-01', 'driver-user-td-01', 'Đặng Hoàng Nam (SPX Thủ Đức)', '0977222333', 'MOTORBIKE', '59-X3 789.01', 'hub-td-01', 'AVAILABLE', 'Linh Chiểu, Linh Trung, Trường Thọ, Hiệp Phú', 'Thành phố Thủ Đức', 'Hồ Chí Minh', NOW(), NOW()),
  ('driver-dd-01', 'driver-user-dd-01', 'Vũ Mạnh Cường (SPX Đống Đa)', '0982555666', 'MOTORBIKE', '29-E1 555.66', 'hub-dd-01', 'AVAILABLE', 'Thái Hà, Láng Hạ, Ô Chợ Dừa, Trung Liệt', 'Quận Đống Đa', 'Hà Nội', NOW(), NOW()),
  ('driver-tx-01', 'driver-user-tx-01', 'Đỗ Hoàng Long (SPX Thanh Xuân)', '0986777888', 'MOTORBIKE', '29-B1 777.99', 'hub-tx-01', 'AVAILABLE', 'Thượng Đình, Thanh Xuân Bắc, Khương Trung, Nhân Chính', 'Quận Thanh Xuân', 'Hà Nội', NOW(), NOW()),
  ('driver-hc-01', 'driver-user-hc-01', 'Lê Phước Vinh (SPX Hải Châu)', '0905333555', 'MOTORBIKE', '43-D1 333.44', 'hub-hc-01', 'AVAILABLE', 'Nam Dương, Hải Châu 1, Bình Thuận, Thạch Thang', 'Quận Hải Châu', 'Đà Nẵng', NOW(), NOW()),
  ('driver-nk-01', 'driver-user-nk-01', 'Huỳnh Minh Trí (SPX Ninh Kiều)', '0939888222', 'MOTORBIKE', '65-B1 999.55', 'hub-nk-01', 'AVAILABLE', 'An Lạc, Tân An, Hưng Lợi, Xuân Khánh', 'Quận Ninh Kiều', 'Cần Thơ', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  "vehicleType" = EXCLUDED."vehicleType",
  "vehicleNumber" = EXCLUDED."vehicleNumber",
  "hubId" = EXCLUDED."hubId",
  "operatingArea" = EXCLUDED."operatingArea",
  "assignedDistrict" = EXCLUDED."assignedDistrict",
  "assignedProvince" = EXCLUDED."assignedProvince",
  "updatedAt" = NOW();

COMMIT;
