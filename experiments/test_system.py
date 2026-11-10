import urllib.request
import json

try:
    req = urllib.request.urlopen('http://localhost:3000')
    print('Frontend HTTP:', req.getcode())
except Exception as e:
    print('Frontend error:', e)

try:
    req2 = urllib.request.urlopen('http://localhost:3002/products?inStockOnly=false')
    products = json.loads(req2.read().decode('utf-8'))
    print(f'Total products returned with inStockOnly=false: {len(products)}')
    violations = [p for p in products if p.get('isViolated') or p.get('status') == 'hidden']
    print(f'Violated / Hidden products count: {len(violations)}')
    for v in violations[:5]:
        print(f"  - ID: {v.get('id')}, Name: {v.get('name')}, Status: {v.get('status')}, Violated: {v.get('isViolated')}")
except Exception as e:
    print('Product service error:', e)

try:
    req3 = urllib.request.urlopen('http://localhost:5005/health')
    print('CLIP service:', json.loads(req3.read().decode('utf-8')))
except Exception as e:
    print('CLIP service error:', e)
