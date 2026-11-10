# -*- coding: utf-8 -*-
with open('services/clip-service/server.py', 'r', encoding='utf-8') as f:
    code = f.read()

old_multi = '''                    # Đánh giá tổng hợp: Bất kỳ ảnh nào vi phạm => Album vi phạm
                    any_mismatch = any(r["isMismatch"] for r in image_results)
                    agg_reason = ""
                    if any_mismatch:
                        agg_reason = f"Ảnh số {worst_idx + 1} vi phạm: {worst_item['reason'] if worst_item else 'Bất tương đồng với tiêu đề'}"
                    else:
                        agg_reason = f"Toàn bộ {len(image_results)} ảnh hợp lệ và tương đồng với tiêu đề sản phẩm."

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "isMismatch": any_mismatch,
                        "worstImageIndex": worst_idx,
                        "minSimilarity": round(min_sim, 4),
                        "detectedVisual": worst_item["detectedVisual"] if worst_item else "Sản phẩm",
                        "suggestedTitle": worst_item["suggestedTitle"] if worst_item else name,
                        "suggestedCategory": worst_item["suggestedCategory"] if worst_item else category,
                        "visualConfidence": worst_item["visualConfidence"] if worst_item else 95.0,
                        "similarity": round(min_sim, 4),
                        "reason": agg_reason,
                        "totalImagesScanned": len(image_results),
                        "imageAudits": image_results,
                        "source": "multi-image-clip-agent"
                    }, ensure_ascii=False).encode("utf-8"))'''

new_multi = '''                    # Đánh giá tổng hợp: Ưu tiên phát hiện hàng cấm (Vũ khí, Súng, Dao kiếm, Cần sa...)
                    any_prohibited = any(r.get("isProhibited", False) for r in image_results)
                    any_mismatch = any(r["isMismatch"] for r in image_results) or any_prohibited

                    if any_prohibited:
                        proh_item = next(r for r in image_results if r.get("isProhibited", False))
                        worst_item = proh_item
                        worst_idx = proh_item.get("imageIndex", 0)
                        agg_reason = f"Ảnh số {worst_idx + 1} phát hiện {proh_item.get('prohibitedLabel', 'hàng cấm')} - thuộc danh mục hàng cấm kinh doanh trên sàn!"
                    elif any_mismatch:
                        agg_reason = f"Ảnh số {worst_idx + 1} vi phạm: {worst_item['reason'] if worst_item else 'Bất tương đồng với tiêu đề'}"
                    else:
                        agg_reason = f"Toàn bộ {len(image_results)} ảnh hợp lệ và tương đồng với tiêu đề sản phẩm."

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "isMismatch": any_mismatch,
                        "isProhibited": any_prohibited,
                        "prohibitedLabel": worst_item.get("prohibitedLabel", "") if any_prohibited and worst_item else "",
                        "worstImageIndex": worst_idx,
                        "minSimilarity": round(min_sim, 4),
                        "detectedVisual": worst_item["detectedVisual"] if worst_item else "Sản phẩm",
                        "suggestedTitle": worst_item["suggestedTitle"] if worst_item else name,
                        "suggestedCategory": "Hàng Cấm Kinh Doanh" if any_prohibited else (worst_item["suggestedCategory"] if worst_item else category),
                        "visualConfidence": worst_item["visualConfidence"] if worst_item else 95.0,
                        "similarity": round(min_sim, 4),
                        "reason": agg_reason,
                        "totalImagesScanned": len(image_results),
                        "imageAudits": image_results,
                        "source": "multi-image-clip-agent"
                    }, ensure_ascii=False).encode("utf-8"))'''

if old_multi in code:
    code = code.replace(old_multi, new_multi, 1)
    with open('services/clip-service/server.py', 'w', encoding='utf-8') as f:
        f.write(code)
    print('[+] Successfully updated multi-image prohibited detection in clip server')
else:
    print('[-] Pattern not found, skipping patch')
