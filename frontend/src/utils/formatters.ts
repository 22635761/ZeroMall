export { formatCurrencyVND, parseCurrencyNumber } from './productFormatter'

/**
 * An toàn parse chuỗi JSON với giá trị dự phòng, tránh throw ngoại lệ và nuốt lỗi âm thầm
 */
export function safeParseJson<T>(raw: any, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') return fallback
  if (typeof raw !== 'string') return (raw as T) ?? fallback
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn('[safeParseJson] Error parsing JSON string:', err)
    return fallback
  }
}
