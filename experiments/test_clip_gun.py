import urllib.request
import json

urls = [
    "https://res.cloudinary.com/dxkfusgxs/image/upload/v1794256838/tmts70rzptrvfvl7pj80.jpg",
    "https://res.cloudinary.com/dxkfusgxs/image/upload/v1794256922/haoqngptkok0fbr9x8cv.webp"
]

for u in urls:
    print("Testing URL:", u)
    payload = json.dumps({"imageUrl": u, "name": "Súng", "category": "Vũ khí"}).encode('utf-8')
    req = urllib.request.Request("http://localhost:5005/audit", data=payload, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        print("isMismatch:", data.get("isMismatch"))
        print("isProhibited:", data.get("isProhibited"))
        print("prohibitedLabel:", data.get("prohibitedLabel", "").encode('ascii', 'replace').decode('ascii'))
        print("reason:", data.get("reason", "").encode('ascii', 'replace').decode('ascii'))
    except Exception as e:
        print("Error:", e)
