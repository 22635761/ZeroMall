/**
 * Service upload ảnh tập trung lên Cloudinary
 */
export async function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxkfusgxs'
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'zeromall_unsigned'

  if (!cloudName || !uploadPreset) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  return new Promise((resolve) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.secure_url) {
            resolve(res.secure_url)
            return
          }
        } catch (e) {
          console.error('Failed to parse Cloudinary response', e)
        }
      }
      // Fallback to local DataURL if Cloudinary response is unexpected
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    }

    xhr.onerror = () => {
      // In case of network errors (or offline/sandbox), fallback to DataURL
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    }

    xhr.send(formData)
  })
}
