export const formatOrderId = (id: string | number | undefined | null): string => {
  if (!id) return ''
  const strId = String(id).trim()
  
  // Nếu đã là chuỗi số thuần túy (ví dụ: 260723849102) -> Giữ nguyên
  if (/^\d+$/.test(strId)) return strId

  // Nếu là dạng UUID cũ (ví dụ: a1986a2b-a3a8-4b81-8b52-b9671e3e3105)
  // Chuyển đổi qua thuật toán hash sang chuỗi số 10 chữ số đẹp cố định
  let hash = 0
  for (let i = 0; i < strId.length; i++) {
    hash = (hash << 5) - hash + strId.charCodeAt(i)
    hash |= 0
  }
  const positiveHash = Math.abs(hash).toString().padStart(8, '0')
  return `26${positiveHash.slice(0, 8)}`
}
