import re
from collections import Counter

with open('frontend/src/data/benchmark100Data.ts', 'r', encoding='utf-8') as f:
    text = f.read()

trick_types = re.findall(r'"trick_type":\s*"([^"]+)"', text)
counts = Counter(trick_types)
print(f"Total benchmark items: {len(trick_types)}")
for k, v in counts.items():
    print(f"  - {k}: {v}")

ground_truths = re.findall(r'"ground_truth":\s*"([^"]+)"', text)
print("Ground truth counts:", Counter(ground_truths))
