#!/usr/bin/env python3
"""
MASTER VERIFICATION RUNNER: FULL SUPABASE & POSTGRESQL ARCHITECTURE
Runs all 5 specialized test suites in sequence:
1. Database Integrity & Concurrency (Migrations 01-10)
2. Row Level Security for CSKH & SPX Fleet (Migration 11)
3. Supabase Storage Architecture & 4 Buckets RLS (Migration 12)
4. Supabase Realtime Publication & Full Replica Identity (Migration 13)
5. Edge Functions & Webhook Gateways (Migration 14)
"""

import subprocess
import sys
import time

SUITES = [
    ("Database Integrity, Constraints & Indexes", "scripts/verify_database_integrity_and_concurrency.py"),
    ("Row Level Security (CSKH & SPX Logistics Fleet)", "scripts/verify_rls_cskh_logistics.py"),
    ("Supabase Storage Architecture & RLS Buckets", "scripts/verify_storage_rls.py"),
    ("Supabase Realtime Publication & Replica Identity", "scripts/verify_realtime_setup.py"),
    ("Supabase Edge Functions & Webhook Security", "scripts/verify_edge_functions.py"),
]

def main():
    start_total = time.time()
    print("=" * 70)
    print("      ZEROMALL ENTERPRISE BACKEND ARCHITECTURE VERIFICATION")
    print("=" * 70)

    passed_count = 0

    for idx, (title, script_path) in enumerate(SUITES, 1):
        print(f"\n[SUITE {idx}/{len(SUITES)}] Running {title}...")
        t0 = time.time()
        res = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
        elapsed = time.time() - t0

        if res.returncode == 0:
            print(f"  ✓ PASSED in {elapsed:.2f}s")
            passed_count += 1
        else:
            print(f"  ✗ FAILED in {elapsed:.2f}s")
            print("STDOUT:")
            print(res.stdout)
            print("STDERR:")
            print(res.stderr)
            sys.exit(1)

    total_time = time.time() - start_total
    print("\n" + "=" * 70)
    print(f"ALL {passed_count}/{len(SUITES)} TEST SUITES COMPLETED WITH 100% SUCCESS!")
    print(f"Total Execution Time: {total_time:.2f}s")
    print("=" * 70)

if __name__ == "__main__":
    main()
