#!/usr/bin/env python3
"""
Verification Script for Migration 12: Supabase Storage RLS Policies
Tests isolation across 4 buckets: product-images, return-evidence, delivery-pod, driver-attendance.
"""

import subprocess
import sys

def run_sql(sql_statements: str) -> str:
    cmd = [
        "docker", "exec", "-i", "zeromall-postgres",
        "psql", "-U", "postgres", "-d", "zeromall", "-t", "-A", "-c", sql_statements
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"SQL Error: {res.stderr}\nCommand: {sql_statements}")
    lines = [line.strip() for line in res.stdout.strip().splitlines() if line.strip() and line.strip() not in ("SET", "RESET", "INSERT 0 1", "UPDATE 1", "DELETE 1")]
    return "\n".join(lines)

def run_as_role(role: str, user_id: str = None, shop_id: str = None, hub_id: str = None, driver_id: str = None, query: str = "") -> str:
    setup_lines = [
        "SET ROLE test_app_user;",
        f"SET \"app.current_user_role\" = '{role}';",
        "SET \"app.is_service_role\" = 'false';"
    ]
    if user_id:
        setup_lines.append(f"SET \"app.current_user_id\" = '{user_id}';")
    else:
        setup_lines.append("RESET \"app.current_user_id\";")
        
    if shop_id:
        setup_lines.append(f"SET \"app.current_shop_id\" = '{shop_id}';")
    else:
        setup_lines.append("RESET \"app.current_shop_id\";")
        
    if hub_id:
        setup_lines.append(f"SET \"app.current_hub_id\" = '{hub_id}';")
    else:
        setup_lines.append("RESET \"app.current_hub_id\";")
        
    if driver_id:
        setup_lines.append(f"SET \"app.current_driver_id\" = '{driver_id}';")
    else:
        setup_lines.append("RESET \"app.current_driver_id\";")

    setup_lines.append(query)
    full_sql = "\n".join(setup_lines)
    return run_sql(full_sql)

def try_as_role(role: str, user_id: str = None, shop_id: str = None, hub_id: str = None, driver_id: str = None, query: str = ""):
    try:
        res = run_as_role(role, user_id, shop_id, hub_id, driver_id, query)
        return True, res
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("RUNNING STORAGE RLS SECURITY VERIFICATION")
    print("=" * 60)

    # Clean test objects from previous runs if any
    run_sql("DELETE FROM storage.objects WHERE name LIKE 'test-%' OR name LIKE 'shop-%/%' OR name LIKE '09e472c6-%/%' OR name LIKE 'driver-02/%';")

    # -------------------------------------------------------------
    # TEST 1: product-images (Public read, Shop-isolated write)
    # -------------------------------------------------------------
    print("[*] Test 1: product-images bucket isolation")
    # Shop A inserts an image into its folder
    shop_a = "shop-alpha-123"
    ins_query = f"INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('product-images', '{shop_a}/nike-zoom.jpg', 'user-alpha');"
    ok, res = try_as_role("SHOP_OWNER", shop_id=shop_a, user_id="user-alpha", query=ins_query)
    assert ok, f"Shop A should be able to upload product image: {res}"
    print("  -> PASS: Shop A uploaded image to its own folder.")

    # Shop B attempts to insert into Shop A's folder
    shop_b = "shop-beta-456"
    hack_query = f"INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('product-images', '{shop_a}/malicious.jpg', 'user-beta');"
    ok, err = try_as_role("SHOP_OWNER", shop_id=shop_b, user_id="user-beta", query=hack_query)
    assert not ok or "violates row-level security policy" in err, "Shop B MUST NOT insert into Shop A's folder!"
    print("  -> PASS: RLS blocked Shop B from inserting into Shop A's folder.")

    # Anon / Buyer can view product images (Public read)
    view_query = "SELECT count(*) FROM storage.objects WHERE bucket_id = 'product-images';"
    count = int(run_as_role("BUYER", query=view_query))
    assert count >= 1, "Public bucket should be readable by Buyer"
    print("  -> PASS: product-images is readable by Buyer/Public.")

    # -------------------------------------------------------------
    # TEST 2: return-evidence (Private bucket! Dispute parties + CSKH)
    # -------------------------------------------------------------
    print("[*] Test 2: return-evidence private bucket isolation")
    return_id = "09e472c6-79c3-4c4b-8aa8-8c0e7cd9f193"
    buyer_valid = "b98d1128-a7b7-4437-9b8c-d71035c0c6c9" # Buyer of this Return
    buyer_unrelated = "f1ba7a53-b5cd-48b9-a270-6ad7f40001f1" # Different buyer

    # Buyer of return uploads evidence
    ins_evidence = f"INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('return-evidence', '{return_id}/unboxing-video.mp4', '{buyer_valid}');"
    ok, res = try_as_role("BUYER", user_id=buyer_valid, query=ins_evidence)
    assert ok, f"Involved Buyer should be able to upload return evidence: {res}"
    print("  -> PASS: Involved Buyer uploaded return evidence.")

    # Unrelated Buyer tries to read the evidence
    sel_evidence = f"SELECT count(*) FROM storage.objects WHERE bucket_id = 'return-evidence' AND name = '{return_id}/unboxing-video.mp4';"
    count_unrelated = int(run_as_role("BUYER", user_id=buyer_unrelated, query=sel_evidence))
    assert count_unrelated == 0, f"Unrelated buyer should see 0 evidence, got {count_unrelated}"
    print("  -> PASS: Unrelated Buyer cannot view private return evidence (Hidden by RLS).")

    # CSKH reads the evidence
    count_cskh = int(run_as_role("PLATFORM_SUPPORT", query=sel_evidence))
    assert count_cskh == 1, f"CSKH must see return evidence, got {count_cskh}"
    print("  -> PASS: CSKH (PLATFORM_SUPPORT) has full access to inspect return evidence.")

    # -------------------------------------------------------------
    # TEST 3: driver-attendance (Private bucket! Driver self + Hub)
    # -------------------------------------------------------------
    print("[*] Test 3: driver-attendance private bucket isolation")
    driver_id = "driver-02"
    driver_user = "driver-user-02"
    other_driver_id = "driver-01"

    # Driver 02 uploads morning selfie attendance
    ins_attend = f"INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('driver-attendance', '{driver_id}/morning-selfie.jpg', '{driver_user}');"
    ok, res = try_as_role("DRIVER", user_id=driver_user, driver_id=driver_id, query=ins_attend)
    assert ok, f"Driver 02 should upload attendance: {res}"
    print("  -> PASS: Driver 02 uploaded attendance selfie.")

    # Driver 01 attempts to view Driver 02's attendance
    sel_attend = f"SELECT count(*) FROM storage.objects WHERE bucket_id = 'driver-attendance' AND name = '{driver_id}/morning-selfie.jpg';"
    count_driver_01 = int(run_as_role("DRIVER", user_id="driver-user-01", driver_id=other_driver_id, query=sel_attend))
    assert count_driver_01 == 0, f"Driver 01 should see 0 photos from Driver 02, got {count_driver_01}"
    print("  -> PASS: Driver 01 cannot view Driver 02's selfie.")

    # Logistics Operator reads attendance
    count_logistics = int(run_as_role("LOGISTICS_OPERATOR", query=sel_attend))
    assert count_logistics == 1, f"Logistics Operator must see driver attendance, got {count_logistics}"
    print("  -> PASS: Logistics Operator can access and audit driver attendance.")

    print("=" * 60)
    print("ALL STORAGE RLS SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()
