-- Migration: 03_index_missing_foreign_keys.sql
-- Description: Bổ sung B-Tree Indexes cho 15 Khóa ngoại (Foreign Keys) đang thiếu trên CSDL.
-- Áp dụng quy chuẩn: supabase-postgres-best-practices (schema-foreign-key-indexes.md).
-- Giúp tăng tốc 10x-100x cho các phép JOIN và loại bỏ Full Table Scan khi ON DELETE CASCADE.

-- 1. Schema auth
CREATE INDEX IF NOT EXISTS idx_user_shopid ON auth."User" ("shopId");

-- 2. Schema delivery
-- Driver -> Hub
CREATE INDEX IF NOT EXISTS idx_driver_hubid ON delivery."Driver" ("hubId");

-- Shipment -> PickupAddress
CREATE INDEX IF NOT EXISTS idx_shipment_pickupaddressid ON delivery."Shipment" ("pickupAddressId");

-- ShipmentTracking -> Shipment
CREATE INDEX IF NOT EXISTS idx_shipmenttracking_shipmentid ON delivery."ShipmentTracking" ("shipmentId");

-- HubScan -> Hub & Shipment
CREATE INDEX IF NOT EXISTS idx_hubscan_hubid ON delivery."HubScan" ("hubId");
CREATE INDEX IF NOT EXISTS idx_hubscan_shipmentid ON delivery."HubScan" ("shipmentId");

-- DeliveryAttempt -> Driver & Shipment
CREATE INDEX IF NOT EXISTS idx_deliveryattempt_driverid ON delivery."DeliveryAttempt" ("driverId");
CREATE INDEX IF NOT EXISTS idx_deliveryattempt_shipmentid ON delivery."DeliveryAttempt" ("shipmentId");

-- Return -> Shipment
CREATE INDEX IF NOT EXISTS idx_return_shipmentid ON delivery."Return" ("shipmentId");

-- Return details -> Return
CREATE INDEX IF NOT EXISTS idx_returnitem_returnid ON delivery."ReturnItem" ("returnId");
CREATE INDEX IF NOT EXISTS idx_returnevidence_returnid ON delivery."ReturnEvidence" ("returnId");
CREATE INDEX IF NOT EXISTS idx_returnnegotiation_returnid ON delivery."ReturnNegotiation" ("returnId");

-- Claim -> Shipment & ClaimEvidence -> Claim
CREATE INDEX IF NOT EXISTS idx_claim_shipmentid ON delivery."Claim" ("shipmentId");
CREATE INDEX IF NOT EXISTS idx_claimevidence_claimid ON delivery."ClaimEvidence" ("claimId");

-- DriverAttendance -> Driver
CREATE INDEX IF NOT EXISTS idx_driverattendance_driverid ON delivery."DriverAttendance" ("driverId");
