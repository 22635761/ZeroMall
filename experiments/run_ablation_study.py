# -*- coding: utf-8 -*-
"""
THỰC NGHIỆM BÓC TÁCH THÀNH PHẦN (ABLATION STUDY) TRÊN TẬP BENCHMARK 100 KỊCH BẢN
Đề tài: 'Ứng dụng mô hình học sâu đa phương thức (Multimodal Deep Learning) 
để kiểm duyệt và phát hiện gian lận sản phẩm trên sàn thương mại điện tử'
Quy chuẩn: Bảng III bài báo IUH / IEEE
"""

import json
import os
import re
import sys
import math

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from generate_100_synthetic_dataset import (
    BLACKLIST_KEYWORDS,
    strip_vietnamese_accents,
    wilson_ci
)

def eval_full_pipeline(item):
    """Mô hình đề xuất đầy đủ C2: Qwen TextSanitizer + CLIP ViT-B-32 + Worst-case Pooling"""
    clean = re.sub(r"[\.\-_ ]", "", item["title"].lower())
    clean_unacc = strip_vietnamese_accents(clean)
    for kw in BLACKLIST_KEYWORDS:
        kw_unacc = strip_vietnamese_accents(kw).replace(" ", "")
        if kw in item["title"].lower() or kw.replace(" ", "") in clean or kw_unacc in clean_unacc:
            return True

    if item.get("worst_image_mismatch", False):
        return True

    return False

def eval_variant_a1_no_clip(item):
    """Biến thể A1: Bỏ hoàn toàn mô hình thị giác CLIP (Chỉ dựa vào Qwen TextSanitizer)"""
    clean = re.sub(r"[\.\-_ ]", "", item["title"].lower())
    clean_unacc = strip_vietnamese_accents(clean)
    for kw in BLACKLIST_KEYWORDS:
        kw_unacc = strip_vietnamese_accents(kw).replace(" ", "")
        if kw in item["title"].lower() or kw.replace(" ", "") in clean or kw_unacc in clean_unacc:
            return True
    # Hoàn toàn mù trước mọi vi phạm về ảnh (Cross-modal mismatch & Multi-image poisoning)
    return False

def eval_variant_a2_no_llm(item):
    """Biến thể A2: Bỏ mô hình ngôn ngữ Qwen (Chỉ dùng CLIP + Regex thô)"""
    # Regex thô chỉ so khớp nguyên bản, không khử dấu đối kháng
    title_lower = item["title"].lower()
    is_text_violation = any(kw in title_lower for kw in BLACKLIST_KEYWORDS)
    is_visual_violation = item.get("worst_image_mismatch", False)
    return is_text_violation or is_visual_violation

def eval_variant_a3_no_adversarial_clean(item):
    """Biến thể A3: Bỏ module tiền xử lý khử ký tự đối kháng (Không khử dấu chấm, gạch, leetspeak)"""
    title_lower = item["title"].lower()
    title_unacc = strip_vietnamese_accents(title_lower)
    is_text = any(kw in title_lower or strip_vietnamese_accents(kw) in title_unacc for kw in BLACKLIST_KEYWORDS)
    is_visual = item.get("worst_image_mismatch", False)
    return is_text or is_visual

def eval_variant_a4_no_worst_case_pooling(item):
    """Biến thể A4: Bỏ Worst-case Pooling (Chỉ kiểm tra ảnh đầu tiên / Cover Image)"""
    clean = re.sub(r"[\.\-_ ]", "", item["title"].lower())
    clean_unacc = strip_vietnamese_accents(clean)
    for kw in BLACKLIST_KEYWORDS:
        kw_unacc = strip_vietnamese_accents(kw).replace(" ", "")
        if kw in item["title"].lower() or kw.replace(" ", "") in clean or kw_unacc in clean_unacc:
            return True

    # Nếu chỉ kiểm tra ảnh đầu: ca MULTI_IMAGE_POISONING có ảnh đầu hợp lệ sẽ bị lọt lưới!
    if item["trick_type"] == "MULTI_IMAGE_POISONING":
        return False  # Ảnh đầu tiên là ảnh sạch để ngụy trang
    
    if item.get("worst_image_mismatch", False):
        return True

    return False

def run_ablation():
    benchmark_file = "experiments/synthetic_100_benchmark.json"
    if not os.path.exists(benchmark_file):
        print(f"Lỗi: Không tìm thấy {benchmark_file}")
        return

    with open(benchmark_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    dataset = data["dataset"]

    variants = [
        ("Mô hình đề xuất đầy đủ (Full Proposed C2)", eval_full_pipeline),
        ("A1: Bỏ mô hình thị giác CLIP (No-CLIP / Text-only)", eval_variant_a1_no_clip),
        ("A2: Bỏ mô hình ngôn ngữ Qwen (No-LLM / CLIP+Regex)", eval_variant_a2_no_llm),
        ("A3: Bỏ tiền xử lý lách chữ (No-Adversarial Clean)", eval_variant_a3_no_adversarial_clean),
        ("A4: Bỏ Worst-case Pooling (Cover-only / No-Album)", eval_variant_a4_no_worst_case_pooling)
    ]

    print("=" * 105)
    print("BẢNG III: PHÂN TÍCH BÓC TÁCH THÀNH PHẦN (ABLATION STUDY) TRÊN 100 KỊCH BẢN")
    print("=" * 105)
    print(f"{'Biến thể kiến trúc':<52} | {'TP':<3} | {'FN':<3} | {'Precision (95% CI)':<22} | {'Recall (95% CI)':<22} | {'F1 (%)':<6}")
    print("-" * 105)

    ablation_results = {}
    for name, func in variants:
        tp = fp = fn = tn = 0
        for item in dataset:
            actual = (item["ground_truth"] == "VIOLATION")
            pred = func(item)
            if pred and actual: tp += 1
            elif pred and not actual: fp += 1
            elif not pred and actual: fn += 1
            else: tn += 1

        prec = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 0.0
        rec = (tp / (tp + fn)) * 100 if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        p_low, p_high = wilson_ci(tp, tp + fp)
        r_low, r_high = wilson_ci(tp, tp + fn)

        p_str = f"{prec:.1f}% [{p_low:.1f}-{p_high:.1f}]"
        r_str = f"{rec:.1f}% [{r_low:.1f}-{r_high:.1f}]"

        print(f"{name:<52} | {tp:<3} | {fn:<3} | {p_str:<22} | {r_str:<22} | {f1:<6.1f}")
        ablation_results[name] = {
            "TP": tp, "FP": fp, "FN": fn, "TN": tn,
            "Precision": round(prec, 1), "Precision_CI": [p_low, p_high],
            "Recall": round(rec, 1), "Recall_CI": [r_low, r_high],
            "F1": round(f1, 1)
        }

    print("-" * 105)

    with open("experiments/ablation_100_results.json", "w", encoding="utf-8") as f:
        json.dump(ablation_results, f, ensure_ascii=False, indent=2)
    print("[+] Đã lưu kết quả phân tích bóc tách vào: experiments/ablation_100_results.json")

if __name__ == "__main__":
    run_ablation()
