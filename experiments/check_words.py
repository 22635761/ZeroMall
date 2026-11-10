with open('frontend/src/utils/bannedWords.ts', 'r', encoding='utf-8') as f:
    text = f.read()

words = ["súng", "khẩu súng", "vũ khí", "lựu đạn", "thuốc nổ", "pháo hoa nổ", "dao găm", "kiếm nhật", "cần sa"]
for w in words:
    found = f"'{w}'" in text.lower() or f'"{w}"' in text.lower()
    print(f"{w}: {found}")
