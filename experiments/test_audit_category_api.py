import urllib.request
import json

url = "https://res.cloudinary.com/dxkfusgxs/image/upload/v1794256838/tmts70rzptrvfvl7pj80.jpg"

payload = json.dumps({
    "name": "Áo Thun Nam Cotton Trơn",
    "category": "Thời Trang Nam",
    "image": url,
    "images": [url],
    "description": "Áo thun nam"
}).encode('utf-8')

req = urllib.request.Request("http://localhost:3002/products/ai/audit-category", data=payload, headers={"Content-Type": "application/json"})
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read().decode('utf-8'))
    for k, v in data.items():
        v_str = str(v).encode('ascii', 'replace').decode('ascii')
        print(f"{k}: {v_str}")
except Exception as e:
    print("Error calling audit-category:", e)
