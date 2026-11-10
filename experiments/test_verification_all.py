import urllib.request
import urllib.error
import json

url = "https://res.cloudinary.com/dxkfusgxs/image/upload/v1794256838/tmts70rzptrvfvl7pj80.jpg"

print("--- TEST 1: audit-category with title 'Súng' and gun image ---")
payload1 = json.dumps({
    "name": "Súng",
    "category": "Vũ khí",
    "image": url,
    "images": [url],
    "description": "Test súng"
}).encode('utf-8')
req1 = urllib.request.Request("http://localhost:3002/products/ai/audit-category", data=payload1, headers={"Content-Type": "application/json"})
resp1 = urllib.request.urlopen(req1)
d1 = json.loads(resp1.read().decode('utf-8'))
print("issueType:", d1.get("issueType"))
print("isProhibited:", d1.get("isProhibited"))
print("prohibitedLabel:", str(d1.get("prohibitedLabel", "")).encode('ascii', 'replace').decode('ascii'))
print("actionRequired:", d1.get("actionRequired"))

print("\n--- TEST 2: audit-category with innocent title 'Áo Thun Nam' and gun image ---")
payload2 = json.dumps({
    "name": "Áo Thun Nam",
    "category": "Thời Trang Nam",
    "image": url,
    "images": [url],
    "description": "Mô tả bình thường"
}).encode('utf-8')
req2 = urllib.request.Request("http://localhost:3002/products/ai/audit-category", data=payload2, headers={"Content-Type": "application/json"})
resp2 = urllib.request.urlopen(req2)
d2 = json.loads(resp2.read().decode('utf-8'))
print("issueType:", d2.get("issueType"))
print("isProhibited:", d2.get("isProhibited"))
print("prohibitedLabel:", str(d2.get("prohibitedLabel", "")).encode('ascii', 'replace').decode('ascii'))
print("actionRequired:", d2.get("actionRequired"))

print("\n--- TEST 3: Attempt POST /products with gun image (Must be rejected with 400) ---")
payload3 = json.dumps({
    "name": "Áo Thun Cao Cấp",
    "category": "Thời Trang Nam",
    "price": 100000,
    "stock": 50,
    "image": url,
    "images": json.dumps([url]),
    "shopId": "00000000-0000-0000-0000-000000000001",
    "description": "Áo thun"
}).encode('utf-8')
req3 = urllib.request.Request("http://localhost:3002/products", data=payload3, headers={"Content-Type": "application/json"})
try:
    resp3 = urllib.request.urlopen(req3)
    print("WARNING: Product was created successfully (HTTP", resp3.getcode(), ")! FAILED!")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print(f"SUCCESS: Backend actively blocked creation with HTTP {e.code}!")
    print(f"Error message: {err_body.encode('ascii', 'replace').decode('ascii')}")
