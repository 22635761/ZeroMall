import psycopg2

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/zeromall')
cur = conn.cursor()
cur.execute('SELECT id, name, status, "isViolated", "createdAt", image FROM "Product" ORDER BY "createdAt" DESC LIMIT 10;')
rows = cur.fetchall()
for r in rows:
    name = r[1].encode('ascii', 'replace').decode('ascii')
    img = (r[5] or '')[:60]
    print(r[0], name, r[2], r[3], str(r[4]), img)
conn.close()
