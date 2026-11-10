# -*- coding: utf-8 -*-
with open('services/clip-service/server.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add PROHIBITED_CONCEPTS definition
prohibited_block = '''
# ------------------------------------------------------------------------------
# DANH MỤC VẬT PHẨM NGUY HẠI / CẤM KINH DOANH TRÊN SÀN (Visual Contraband Detector)
# ------------------------------------------------------------------------------
PROHIBITED_CONCEPTS = {
    "Vũ khí / Súng đạn": {
        "prompt": "gun handgun pistol rifle shotgun assault firearm weapon ammunition military weapon súng đạn vũ khí quân dụng",
        "label": "Súng / Vũ khí sát thương (Firearms/Weapons)",
        "threshold": 0.26
    },
    "Vũ khí lạnh / Kiếm / Dao găm": {
        "prompt": "sword katana samurai combat blade tactical dagger hunting knife switchblade weapon kiếm nhật dao găm vũ khí thô sơ",
        "label": "Kiếm / Dao găm / Vũ khí thô sơ (Swords/Blades)",
        "threshold": 0.26
    },
    "Chất cấm / Cần sa / Ma túy": {
        "prompt": "cannabis marijuana weed dried drug narcotic pills ecstasy heroin substance lá cần sa ma túy thuốc phiện",
        "label": "Cần sa / Ma túy / Chất kích thích (Cannabis/Drugs)",
        "threshold": 0.26
    },
    "Pháo nổ / Thuốc nổ": {
        "prompt": "firecrackers fireworks pyrotechnics explosives explosive device pháo nổ pháo hoa nổ thuốc nổ",
        "label": "Pháo nổ / Thuốc nổ (Fireworks/Explosives)",
        "threshold": 0.26
    },
    "Thiết bị quay lén giấu kín": {
        "prompt": "hidden spy camera pinhole spy cam covert surveillance camera camera quay lén ngụy trang",
        "label": "Camera quay lén ngụy trang (Spy Cameras)",
        "threshold": 0.26
    },
    "Tiền polymer giả": {
        "prompt": "counterfeit currency fake banknotes fake money polymer bills tiền polymer giả",
        "label": "Tiền polymer giả (Counterfeit Currency)",
        "threshold": 0.26
    }
}

PROHIBITED_KEYS = list(PROHIBITED_CONCEPTS.keys())
PROHIBITED_PROMPTS = [PROHIBITED_CONCEPTS[k]["prompt"] for k in PROHIBITED_KEYS]
print("[*] Pre-encoding prohibited safety vectors for visual contraband detection...")
PROHIBITED_EMBEDDINGS = model.encode(PROHIBITED_PROMPTS)
print(f"[+] {len(PROHIBITED_KEYS)} prohibited safety concepts ready!")
'''

if 'PROHIBITED_CONCEPTS' not in code:
    anchor = 'CAT_EMBEDDINGS = model.encode(CAT_PROMPTS)'
    code = code.replace(anchor, anchor + '\n' + prohibited_block, 1)

# Update audit_single_image_logic
old_logic_start = '''    img_emb = model.encode(pil_img)

    sims = util.cos_sim(img_emb, CAT_EMBEDDINGS)[0]'''

new_logic_start = '''    img_emb = model.encode(pil_img)

    # 0. QUÉT AN TOÀN THỊ GIÁC: PHÁT HIỆN HÀNG CẤM (Vũ khí, Súng, Kiếm, Cần sa...)
    prohibited_sims = util.cos_sim(img_emb, PROHIBITED_EMBEDDINGS)[0]
    best_proh_idx = prohibited_sims.argmax().item()
    max_proh_sim = float(prohibited_sims[best_proh_idx].item())
    proh_key = PROHIBITED_KEYS[best_proh_idx]
    proh_info = PROHIBITED_CONCEPTS[proh_key]

    is_prohibited = False
    prohibited_label = ""
    if max_proh_sim >= proh_info["threshold"]:
        is_prohibited = True
        prohibited_label = proh_info["label"]

    sims = util.cos_sim(img_emb, CAT_EMBEDDINGS)[0]'''

if 'prohibited_sims = util.cos_sim(img_emb, PROHIBITED_EMBEDDINGS)[0]' not in code:
    code = code.replace(old_logic_start, new_logic_start, 1)

# If prohibited, set is_mismatch and reason
old_reason_check = '''    if best_cat == "Sơ đồ / Tài liệu":'''
new_reason_check = '''    if is_prohibited:
        is_mismatch = True
        reason = f"[Visual Safety Guard] Hình ảnh nhận diện là {prohibited_label} (độ tin cậy: {round(max_proh_sim*100, 1)}%) - thuộc danh mục hàng cấm kinh doanh tuyệt đối trên sàn ZeroMall!"
    elif best_cat == "Sơ đồ / Tài liệu":'''

if 'if is_prohibited:' not in code:
    code = code.replace(old_reason_check, new_reason_check, 1)

# Update return dict
old_return = '''    return {
        "isMismatch": is_mismatch,
        "detectedVisual": cat_info["label"],'''

new_return = '''    return {
        "isMismatch": is_mismatch,
        "isProhibited": is_prohibited,
        "prohibitedLabel": prohibited_label,
        "detectedVisual": prohibited_label if is_prohibited else cat_info["label"],'''

if '"isProhibited": is_prohibited,' not in code:
    code = code.replace(old_return, new_return, 1)

with open('services/clip-service/server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print('[+] Successfully patched server.py with PROHIBITED_CONCEPTS visual scanner')
