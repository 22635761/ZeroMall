-- Migration: 12_setup_supabase_storage_and_policies.sql
-- Description: Khởi tạo Schema Supabase Storage, 4 Buckets chuyên dụng và RLS Policies bảo vệ tài nguyên ảnh/video.
-- Áp dụng quy chuẩn: supabase skill (Storage access control: SELECT + INSERT + UPDATE cho Upsert) & supabase-postgres-best-practices.

-- ============================================================================
-- 1. Khởi tạo Schema storage & các bảng quản trị Storage chuẩn Supabase
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS storage;

-- Bảng quản lý Buckets
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

-- Bảng quản lý Objects (Tệp tin lưu trữ)
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  version text
);

-- ============================================================================
-- 2. Helper Functions chuẩn của Supabase Storage
-- ============================================================================
CREATE OR REPLACE FUNCTION storage.filename(name text)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  _parts text[];
BEGIN
  _parts := string_to_array(name, '/');
  RETURN _parts[array_length(_parts, 1)];
END;
$$;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  _parts text[];
BEGIN
  _parts := string_to_array(name, '/');
  IF array_length(_parts, 1) <= 1 THEN
    RETURN ARRAY[]::text[];
  END IF;
  RETURN _parts[1:array_length(_parts, 1) - 1];
END;
$$;

CREATE OR REPLACE FUNCTION storage.extension(name text)
RETURNS text
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  _filename text;
BEGIN
  _filename := storage.filename(name);
  RETURN split_part(_filename, '.', 2);
END;
$$;

-- ============================================================================
-- 3. Đánh Index tối ưu hóa truy vấn cho storage.objects
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_objects_bucket_name ON storage.objects(bucket_id, name);
CREATE INDEX IF NOT EXISTS idx_objects_owner ON storage.objects(owner);
CREATE INDEX IF NOT EXISTS idx_objects_path_tokens ON storage.objects USING GIN (path_tokens);

-- ============================================================================
-- 4. Đăng ký 4 Buckets theo nghiệp vụ Marketplace & Logistics
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('return-evidence', 'return-evidence', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('delivery-pod', 'delivery-pod', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('driver-attendance', 'driver-attendance', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = now();

-- ============================================================================
-- 5. Kích hoạt Row Level Security & Thiết lập Chính sách (RLS Policies)
-- ============================================================================

-- Bảng storage.buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_buckets_read ON storage.buckets;
CREATE POLICY p_buckets_read ON storage.buckets
  FOR SELECT
  USING (true);

-- Bảng storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5.1 Quyền tối cao Admin / Service Role
DROP POLICY IF EXISTS p_objects_admin ON storage.objects;
CREATE POLICY p_objects_admin ON storage.objects
  FOR ALL
  USING ((SELECT app.is_admin()));

-- 5.2 Bucket: product-images (Công khai đọc, Seller chỉ quản lý ảnh shop mình)
-- Cấu trúc đường dẫn: <shopId>/<filename>
DROP POLICY IF EXISTS p_prod_img_select ON storage.objects;
CREATE POLICY p_prod_img_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS p_prod_img_insert ON storage.objects;
CREATE POLICY p_prod_img_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      (SELECT app.is_admin())
      OR (
        (SELECT app.current_shop_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT app.current_shop_id())
      )
    )
  );

DROP POLICY IF EXISTS p_prod_img_update ON storage.objects;
CREATE POLICY p_prod_img_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND (
      (SELECT app.is_admin())
      OR (
        (SELECT app.current_shop_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT app.current_shop_id())
      )
    )
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      (SELECT app.is_admin())
      OR (
        (SELECT app.current_shop_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT app.current_shop_id())
      )
    )
  );

DROP POLICY IF EXISTS p_prod_img_delete ON storage.objects;
CREATE POLICY p_prod_img_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      (SELECT app.is_admin())
      OR (
        (SELECT app.current_shop_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT app.current_shop_id())
      )
    )
  );

-- 5.3 Bucket: return-evidence (Private! Bằng chứng mở hộp / hàng lỗi)
-- Cấu trúc đường dẫn: <returnId>/<filename>
DROP POLICY IF EXISTS p_ret_evid_select ON storage.objects;
CREATE POLICY p_ret_evid_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'return-evidence'
    AND (
      (SELECT app.is_cskh())
      OR EXISTS (
        SELECT 1 FROM delivery."Return" r
        WHERE r.id = (storage.foldername(name))[1]
          AND (
            r."buyerId" = (SELECT app.current_user_id())
            OR r."sellerId" = (SELECT app.current_shop_id())
          )
      )
    )
  );

DROP POLICY IF EXISTS p_ret_evid_insert ON storage.objects;
CREATE POLICY p_ret_evid_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'return-evidence'
    AND (
      (SELECT app.is_cskh())
      OR EXISTS (
        SELECT 1 FROM delivery."Return" r
        WHERE r.id = (storage.foldername(name))[1]
          AND (
            r."buyerId" = (SELECT app.current_user_id())
            OR r."sellerId" = (SELECT app.current_shop_id())
          )
      )
    )
  );

DROP POLICY IF EXISTS p_ret_evid_update ON storage.objects;
CREATE POLICY p_ret_evid_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'return-evidence'
    AND (
      (SELECT app.is_cskh())
      OR (
        owner = (SELECT app.current_user_id())
        AND EXISTS (
          SELECT 1 FROM delivery."Return" r
          WHERE r.id = (storage.foldername(name))[1]
            AND (
              r."buyerId" = (SELECT app.current_user_id())
              OR r."sellerId" = (SELECT app.current_shop_id())
            )
        )
      )
    )
  )
  WITH CHECK (
    bucket_id = 'return-evidence'
    AND (
      (SELECT app.is_cskh())
      OR (
        owner = (SELECT app.current_user_id())
        AND EXISTS (
          SELECT 1 FROM delivery."Return" r
          WHERE r.id = (storage.foldername(name))[1]
            AND (
              r."buyerId" = (SELECT app.current_user_id())
              OR r."sellerId" = (SELECT app.current_shop_id())
            )
        )
      )
    )
  );

-- 5.4 Bucket: delivery-pod (Private! Ảnh bằng chứng giao hàng POD)
-- Cấu trúc đường dẫn: <shipmentId>/<filename>
DROP POLICY IF EXISTS p_pod_select ON storage.objects;
CREATE POLICY p_pod_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'delivery-pod'
    AND (
      (SELECT app.is_logistics_operator())
      OR (SELECT app.is_cskh())
      OR EXISTS (
        SELECT 1 FROM delivery."Shipment" s
        WHERE s.id = (storage.foldername(name))[1]
          AND (
            s."buyerId" = (SELECT app.current_user_id())
            OR s."sellerId" = (SELECT app.current_shop_id())
            OR (s."currentHubId" = (SELECT app.current_hub_id()) AND (SELECT app.is_hub_operator()))
            OR EXISTS (
              SELECT 1 FROM delivery."DeliveryAssignment" da
              WHERE da."shipmentId" = s.id
                AND da."driverId" = (SELECT app.current_driver_id())
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS p_pod_insert ON storage.objects;
CREATE POLICY p_pod_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-pod'
    AND (
      (SELECT app.is_logistics_operator())
      OR (SELECT app.is_hub_operator())
      OR EXISTS (
        SELECT 1 FROM delivery."DeliveryAssignment" da
        WHERE da."shipmentId" = (storage.foldername(name))[1]
          AND da."driverId" = (SELECT app.current_driver_id())
      )
    )
  );

DROP POLICY IF EXISTS p_pod_update ON storage.objects;
CREATE POLICY p_pod_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'delivery-pod'
    AND (
      (SELECT app.is_logistics_operator())
      OR (SELECT app.is_hub_operator())
      OR EXISTS (
        SELECT 1 FROM delivery."DeliveryAssignment" da
        WHERE da."shipmentId" = (storage.foldername(name))[1]
          AND da."driverId" = (SELECT app.current_driver_id())
      )
    )
  )
  WITH CHECK (
    bucket_id = 'delivery-pod'
    AND (
      (SELECT app.is_logistics_operator())
      OR (SELECT app.is_hub_operator())
      OR EXISTS (
        SELECT 1 FROM delivery."DeliveryAssignment" da
        WHERE da."shipmentId" = (storage.foldername(name))[1]
          AND da."driverId" = (SELECT app.current_driver_id())
      )
    )
  );

-- 5.5 Bucket: driver-attendance (Private! Ảnh selfie điểm danh & khuôn mặt tài xế)
-- Cấu trúc đường dẫn: <driverId>/<filename>
DROP POLICY IF EXISTS p_attend_select ON storage.objects;
CREATE POLICY p_attend_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'driver-attendance'
    AND (
      (SELECT app.is_logistics_operator())
      OR (storage.foldername(name))[1] = (SELECT app.current_driver_id())
      OR (
        (SELECT app.is_hub_operator())
        AND EXISTS (
          SELECT 1 FROM delivery."Driver" d
          WHERE d.id = (storage.foldername(name))[1]
            AND d."hubId" = (SELECT app.current_hub_id())
        )
      )
    )
  );

DROP POLICY IF EXISTS p_attend_insert ON storage.objects;
CREATE POLICY p_attend_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'driver-attendance'
    AND (
      (SELECT app.is_logistics_operator())
      OR (storage.foldername(name))[1] = (SELECT app.current_driver_id())
    )
  );

DROP POLICY IF EXISTS p_attend_update ON storage.objects;
CREATE POLICY p_attend_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'driver-attendance'
    AND (
      (SELECT app.is_logistics_operator())
      OR (storage.foldername(name))[1] = (SELECT app.current_driver_id())
    )
  )
  WITH CHECK (
    bucket_id = 'driver-attendance'
    AND (
      (SELECT app.is_logistics_operator())
      OR (storage.foldername(name))[1] = (SELECT app.current_driver_id())
    )
  );

-- ============================================================================
-- 6. Cấp quyền truy cập cho test role
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_app_user') THEN
    GRANT USAGE ON SCHEMA storage TO test_app_user;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO test_app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO test_app_user;
  END IF;
END $$;
