# -*- coding: utf-8 -*-
"""
Tự động vẽ đồ thị nghiên cứu chuẩn Kỷ yếu Hội nghị IUH / IEEE dưới dạng file SVG vector
Không cần cài thêm thư viện ngoài (dùng Python thuần).
"""
import json
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

results_path = os.path.join(os.path.dirname(__file__), "synthetic_100_benchmark.json")
if not os.path.exists(results_path):
    results_path = os.path.join(os.path.dirname(__file__), "experiment_results.json")
with open(results_path, "r", encoding="utf-8") as f:
    data = json.load(f)
metrics = data.get("metrics", data)

m_c0 = metrics["C0 (Regex Baseline)"]
m_c1 = metrics["C1 (Text-only Qwen 2.5)"]
m_c2 = metrics.get("C2 (Đề xuất: Multimodal Multi-Agent)", metrics.get("C2 (Hybrid CLIP + Qwen)"))

p0, r0, f0 = m_c0["Precision"], m_c0["Recall"], m_c0["F1"]
p1, r1, f1 = m_c1["Precision"], m_c1["Recall"], m_c1["F1"]
p2, r2, f2 = m_c2["Precision"], m_c2["Recall"], m_c2["F1"]

def to_y(val):
    return 280 - (val / 100.0) * 230

def to_h(val):
    return (val / 100.0) * 230

svg_fig2 = f"""<svg xmlns="http://www.w3.org/2000/svg" width="650" height="360" viewBox="0 0 650 360" style="background:#ffffff; font-family:Arial, sans-serif;">
  <text x="325" y="28" font-size="15" font-weight="bold" text-anchor="middle" fill="#111827">Hình 2. So sánh Precision, Recall và F1-Score trên 100 Kịch bản Benchmark (%)</text>
  
  <!-- Trục Y -->
  <line x1="80" y1="50" x2="80" y2="280" stroke="#9ca3af" stroke-width="1.5"/>
  <line x1="80" y1="280" x2="600" y2="280" stroke="#9ca3af" stroke-width="1.5"/>
  
  <!-- Các vạch giá trị Y -->
  <text x="70" y="284" font-size="11" text-anchor="end" fill="#6b7280">0%</text>
  <line x1="75" y1="280" x2="600" y2="280" stroke="#f3f4f6" stroke-width="1"/>
  
  <text x="70" y="238" font-size="11" text-anchor="end" fill="#6b7280">20%</text>
  <line x1="75" y1="234" x2="600" y2="234" stroke="#f3f4f6" stroke-width="1"/>
  
  <text x="70" y="192" font-size="11" text-anchor="end" fill="#6b7280">40%</text>
  <line x1="75" y1="188" x2="600" y2="188" stroke="#f3f4f6" stroke-width="1"/>
  
  <text x="70" y="146" font-size="11" text-anchor="end" fill="#6b7280">60%</text>
  <line x1="75" y1="142" x2="600" y2="142" stroke="#f3f4f6" stroke-width="1"/>
  
  <text x="70" y="100" font-size="11" text-anchor="end" fill="#6b7280">80%</text>
  <line x1="75" y1="96" x2="600" y2="96" stroke="#f3f4f6" stroke-width="1"/>
  
  <text x="70" y="54" font-size="11" text-anchor="end" fill="#6b7280">100%</text>
  <line x1="75" y1="50" x2="600" y2="50" stroke="#f3f4f6" stroke-width="1"/>

  <!-- Nhóm C0: Regex Baseline -->
  <rect x="130" y="{to_y(p0):.1f}" width="35" height="{to_h(p0):.1f}" fill="#3b82f6" rx="3"/>
  <text x="147" y="{to_y(p0)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#1d4ed8">{p0}%</text>
  
  <rect x="170" y="{to_y(r0):.1f}" width="35" height="{to_h(r0):.1f}" fill="#10b981" rx="3"/>
  <text x="187" y="{to_y(r0)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#047857">{r0}%</text>
  
  <rect x="210" y="{to_y(f0):.1f}" width="35" height="{to_h(f0):.1f}" fill="#f59e0b" rx="3"/>
  <text x="227" y="{to_y(f0)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#b45309">{f0}%</text>
  <text x="187" y="305" font-size="12" font-weight="bold" text-anchor="middle" fill="#374151">C0 (Regex)</text>

  <!-- Nhóm C1: Text-only SLM -->
  <rect x="290" y="{to_y(p1):.1f}" width="35" height="{to_h(p1):.1f}" fill="#3b82f6" rx="3"/>
  <text x="307" y="{to_y(p1)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#1d4ed8">{p1}%</text>
  
  <rect x="330" y="{to_y(r1):.1f}" width="35" height="{to_h(r1):.1f}" fill="#10b981" rx="3"/>
  <text x="347" y="{to_y(r1)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#047857">{r1}%</text>
  
  <rect x="370" y="{to_y(f1):.1f}" width="35" height="{to_h(f1):.1f}" fill="#f59e0b" rx="3"/>
  <text x="387" y="{to_y(f1)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#b45309">{f1}%</text>
  <text x="347" y="305" font-size="12" font-weight="bold" text-anchor="middle" fill="#374151">C1 (Qwen 2.5)</text>

  <!-- Nhóm C2: Hybrid Multimodal -->
  <rect x="450" y="{to_y(p2):.1f}" width="35" height="{to_h(p2):.1f}" fill="#3b82f6" rx="3"/>
  <text x="467" y="{to_y(p2)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#1d4ed8">{p2}%</text>
  
  <rect x="490" y="{to_y(r2):.1f}" width="35" height="{to_h(r2):.1f}" fill="#10b981" rx="3"/>
  <text x="507" y="{to_y(r2)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#047857">{r2}%</text>
  
  <rect x="530" y="{to_y(f2):.1f}" width="35" height="{to_h(f2):.1f}" fill="#f59e0b" rx="3"/>
  <text x="547" y="{to_y(f2)-6:.1f}" font-size="10" font-weight="bold" text-anchor="middle" fill="#b45309">{f2}%</text>
  <text x="507" y="305" font-size="12" font-weight="bold" text-anchor="middle" fill="#374151">C2 (Đề xuất Multi-Agent)</text>

  <!-- Chú thích Legend -->
  <rect x="180" y="332" width="14" height="14" fill="#3b82f6" rx="2"/>
  <text x="200" y="344" font-size="11" fill="#374151">Precision</text>
  
  <rect x="280" y="332" width="14" height="14" fill="#10b981" rx="2"/>
  <text x="300" y="344" font-size="11" fill="#374151">Recall</text>
  
  <rect x="380" y="332" width="14" height="14" fill="#f59e0b" rx="2"/>
  <text x="400" y="344" font-size="11" fill="#374151">F1-Score</text>
</svg>
"""

fig2_path = os.path.join(os.path.dirname(__file__), "fig2_f1_comparison.svg")
with open(fig2_path, "w", encoding="utf-8") as f:
    f.write(svg_fig2)

print(f"[+] Đã tạo đồ thị Vector SVG: {fig2_path}")
