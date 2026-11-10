# -*- coding: utf-8 -*-
path = 'frontend/src/data/benchmark100Data.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_interface = """export interface BenchmarkItem {
  id: string
  title: string
  category: string
  visual_detected?: string
  visual_domain?: string
  suggested_category?: string
  trick_type: string
  ground_truth: 'VALID' | 'VIOLATION'
  album_images_count?: number
  poison_index?: number
  worst_image_mismatch?: boolean
  expected_reason?: string
}"""

new_interface = """export interface BenchmarkItem {
  id: string
  title: string
  category: string
  visual_detected?: string
  visual_domain?: string
  suggested_category?: string
  trick_type: string
  ground_truth: 'VALID' | 'VIOLATION'
  album_images_count?: number
  poison_index?: number
  worst_image_mismatch?: boolean
  expected_reason?: string
  adversarial_keyword?: string
  explicit_keyword?: string
  [key: string]: any
}"""

code = code.replace(old_interface, new_interface, 1)
with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print('[+] Successfully updated BenchmarkItem interface in frontend/src/data/benchmark100Data.ts')
