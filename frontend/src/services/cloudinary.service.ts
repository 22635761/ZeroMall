/**
 * Service upload media tập trung cho ZeroMall.
 * Tích hợp kiến trúc Supabase Storage (phân hệ Buckets có RLS bảo vệ)
 * đồng thời giữ tương thích ngược với Cloudinary và Local Reader fallback.
 */
import { uploadProductImage } from './supabase-storage.service';

export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Ưu tiên sử dụng Supabase Storage với Bucket 'product-images'
  try {
    return await uploadProductImage(file, 'general', { onProgress });
  } catch (supabaseErr) {
    console.warn('Supabase upload bypassed, trying fallback:', supabaseErr);
  }

  // Fallback sang Cloudinary nếu có cấu hình
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.secure_url) {
            resolve(res.secure_url);
            return;
          }
        } catch (e) {
          console.error('Failed to parse Cloudinary response', e);
        }
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };

    xhr.onerror = () => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };

    xhr.send(formData);
  });
}
