#!/usr/bin/env python3
"""
Verification Script for Migration 13: Supabase Realtime Publication & REPLICA IDENTITY FULL
"""

import subprocess
import sys

def run_sql(query: str) -> str:
    cmd = [
        "docker", "exec", "-i", "zeromall-postgres",
        "psql", "-U", "postgres", "-d", "zeromall", "-t", "-A", "-c", query
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"SQL Error: {res.stderr}\nQuery: {query}")
    return res.stdout.strip()

def main():
    print("=" * 60)
    print("RUNNING SUPABASE REALTIME CONFIGURATION VERIFICATION")
    print("=" * 60)

    # 1. Verify wal_level is logical
    wal_level = run_sql("SHOW wal_level;")
    print(f"[*] PostgreSQL WAL Level: {wal_level}")
    assert wal_level == "logical", f"Expected wal_level=logical, got {wal_level}"
    print("  -> PASS: wal_level is configured for logical replication.")

    # 2. Verify publication exists
    pub_exists = run_sql("SELECT count(*) FROM pg_publication WHERE pubname = 'supabase_realtime';")
    assert pub_exists == "1", "Publication supabase_realtime does not exist!"
    print("  -> PASS: Publication 'supabase_realtime' exists.")

    # 3. Verify registered tables
    tables = run_sql("SELECT schemaname || '.' || tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';").splitlines()
    print(f"[*] Tables in supabase_realtime: {tables}")
    expected_tables = {
        "order.Order",
        "delivery.Return",
        "delivery.Shipment",
        "delivery.DeliveryAssignment"
    }
    for exp in expected_tables:
        assert exp in tables, f"Missing table {exp} in supabase_realtime!"
    print("  -> PASS: All 4 mission-critical tables are subscribed to supabase_realtime.")

    # 4. Verify REPLICA IDENTITY FULL ('f')
    identities = run_sql("""
        SELECT c.relname || '=' || c.relreplident::text 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname IN ('Order', 'Return', 'Shipment', 'DeliveryAssignment') 
          AND n.nspname IN ('order', 'delivery');
    """).splitlines()
    print(f"[*] Replica identities: {identities}")
    for item in identities:
        name, ident = item.split("=")
        assert ident == "f", f"Table {name} does not have REPLICA IDENTITY FULL (got {ident})!"
    print("  -> PASS: All tables have REPLICA IDENTITY FULL ('f') enabled.")

    print("=" * 60)
    print("SUPABASE REALTIME VERIFICATION PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    main()
