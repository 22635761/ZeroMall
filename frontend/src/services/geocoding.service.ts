/**
 * Service chuyển đổi địa chỉ (Tỉnh / Quận / Phường) thành tọa độ GPS qua Goong Map API
 */
export const fetchCoordinatesByAddress = async (
  addressStr: string,
  goongApiKey: string
): Promise<{ lat: number; lng: number } | null> => {
  if (!addressStr.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
    return null
  }

  try {
    const res = await fetch(
      `https://rsapi.goong.io/Geocode?address=${encodeURIComponent(addressStr)}&api_key=${goongApiKey}`
    )
    const data = await res.json()
    if (data.results && data.results.length > 0 && data.results[0].geometry?.location) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng
      }
    }
  } catch (err) {
    console.error('Lỗi khi định vị tọa độ từ địa chỉ qua Goong:', err)
  }

  return null
}
