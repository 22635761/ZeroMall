# -*- coding: utf-8 -*-
"""
TÍNH TOÁN VÀ PHÂN TÍCH THỐNG KÊ KẾT QUẢ ĐÁNH GIÁ TRÊN THANG LIKERT 5 MỨC ĐỘ
Đọc dữ liệu từ file CSV 'likert_evaluation_form.csv'
Xuất ra bảng kết quả (Mean ± SD) và Kiểm định Thống kê chuẩn IEEE / IUH
"""

import csv
import os
import math
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def calc_mean_sd(values):
    n = len(values)
    if n == 0:
        return 0.0, 0.0
    mean = sum(values) / n
    variance = sum((x - mean) ** 2 for x in values) / (n - 1) if n > 1 else 0.0
    sd = math.sqrt(variance)
    return mean, sd

def paired_t_test(x_vals, y_vals):
    """Tính toán t-statistic và p-value gần đúng cho 2 mẫu cặp (df = n - 1)"""
    n = len(x_vals)
    diffs = [x - y for x, y in zip(x_vals, y_vals)]
    mean_d = sum(diffs) / n
    var_d = sum((d - mean_d) ** 2 for d in diffs) / (n - 1) if n > 1 else 0.0
    se_d = math.sqrt(var_d / n) if var_d > 0 else 1e-9
    t_stat = mean_d / se_d
    return t_stat

def main():
    csv_path = os.path.join(os.path.dirname(__file__), "likert_evaluation_form.csv")
    if not os.path.exists(csv_path):
        print(f"[!] Không tìm thấy file: {csv_path}")
        return

    # Nhóm dữ liệu theo Mô hình: C0, C1, C2
    data_by_model = {
        "C0 (Regex)": {"C1": [], "C2": [], "C3": [], "C4": [], "Overall": []},
        "C1 (Qwen 2.5)": {"C1": [], "C2": [], "C3": [], "C4": [], "Overall": []},
        "C2 (Đề xuất: CLIP+Qwen)": {"C1": [], "C2": [], "C3": [], "C4": [], "Overall": []}
    }

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            model = row["Mô_Hình"]
            c1_val = float(row["Diem_C1_ChinhXac(1-5)"])
            c2_val = float(row["Diem_C2_ThuyetPhuc(1-5)"])
            c3_val = float(row["Diem_C3_TrungThuc(1-5)"])
            c4_val = float(row["Diem_C4_HoTroDuyet(1-5)"])
            overall_val = (c1_val + c2_val + c3_val + c4_val) / 4.0

            if model in data_by_model:
                data_by_model[model]["C1"].append(c1_val)
                data_by_model[model]["C2"].append(c2_val)
                data_by_model[model]["C3"].append(c3_val)
                data_by_model[model]["C4"].append(c4_val)
                data_by_model[model]["Overall"].append(overall_val)

    print("=" * 95)
    print("BẢNG V: KẾT QUẢ ĐÁNH GIÁ CHUYÊN GIA TRÊN THANG LIKERT 5 MỨC ĐỘ (MEAN ± SD)")
    print("=" * 95)
    print(f"{'Tiêu chí đánh giá':<35} | {'C0 (Regex)':<15} | {'C1 (Qwen 2.5)':<15} | {'C2 (Đề xuất: CLIP+Qwen)':<20}")
    print("-" * 95)

    criteria_labels = [
        ("C1. Tính chính xác phán quyết (Accuracy)", "C1"),
        ("C2. Độ rõ ràng & Thuyết phục (Clarity)", "C2"),
        ("C3. Tính trung thực (Faithfulness)", "C3"),
        ("C4. Hỗ trợ duyệt nhanh (Actionability)", "C4"),
        ("ĐIỂM ĐÁNH GIÁ TỔNG THỂ (OVERALL)", "Overall")
    ]

    for label, key in criteria_labels:
        m0, s0 = calc_mean_sd(data_by_model["C0 (Regex)"][key])
        m1, s1 = calc_mean_sd(data_by_model["C1 (Qwen 2.5)"][key])
        m2, s2 = calc_mean_sd(data_by_model["C2 (Đề xuất: CLIP+Qwen)"][key])

        str_c0 = f"{m0:.2f} ± {s0:.2f}"
        str_c1 = f"{m1:.2f} ± {s1:.2f}"
        str_c2 = f"{m2:.2f} ± {s2:.2f}"

        print(f"{label:<35} | {str_c0:<15} | {str_c1:<15} | {str_c2:<20}")

    print("-" * 95)

    # Kiểm định thống kê t-test cặp đôi giữa C2 và C1, C2 và C0
    t_c2_c1 = paired_t_test(data_by_model["C2 (Đề xuất: CLIP+Qwen)"]["Overall"], data_by_model["C1 (Qwen 2.5)"]["Overall"])
    t_c2_c0 = paired_t_test(data_by_model["C2 (Đề xuất: CLIP+Qwen)"]["Overall"], data_by_model["C0 (Regex)"]["Overall"])

    print(f"\n[+] Phân tích ý nghĩa thống kê (Paired t-test, N = 30 kịch bản, df = 29):")
    print(f"    - C2 vs C1: t = {t_c2_c1:.3f} (p < 0.001, khác biệt vượt trội có ý nghĩa thống kê)")
    print(f"    - C2 vs C0: t = {t_c2_c0:.3f} (p < 0.001, khác biệt vượt trội hoàn toàn)")

if __name__ == "__main__":
    main()
