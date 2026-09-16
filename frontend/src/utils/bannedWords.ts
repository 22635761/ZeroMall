// Danh sách từ khóa cấm theo quy định kiểm duyệt hàng hóa của ZeroMall
export const PROHIBITED_KEYWORDS: string[] = [
  // Hợp chất & thuật ngữ khoa học dài
  'methylenedioxymethamphetamine',
  'methylenedioxyamphetamine',
  'chất kích thích thần kinh',
  'thuốc lá thế hệ mới',
  'thuốc lá nung nóng',
  'thuốc lá điện tử',
  'cần sa tổng hợp',
  'ma túy tổng hợp',
  'chất gây ảo giác',
  'chất gây nghiện',
  'chất hướng thần',
  'chất kích thích',
  'dextromethorphan',
  'dimethyltriptamin',
  'pseudoephedrine',
  'propylphenidate',
  'methamphetamine',
  'acetylpsilocin',
  '1,4-Butanediol',
  'bất hợp pháp',
  'cái chết trắng',
  'dược phẩm cấm',
  'lá thiên đường',
  'dâu tây nhanh',
  'kẹo cục gạch',
  'nấm ma thuật',
  'nấm ảo giác',
  'thuốc an thần',
  'buprenorphin',
  'Carisoprodol',
  'medetomidine',
  'norketamine',
  'amphetamine',
  'mephedrone',
  'psilocybin',
  'thuốc phiện',
  'bạch phiến',
  'cathinone',
  'methylone',
  'bánh lười',
  'bóng cười',
  'bùa lưỡi',
  'hàng cấm',
  'hàng trắng',
  'khí cười',
  'lazy cake',
  'marijuana',
  'mescalin',
  'methadone',
  'muối tắm',
  'nấm thần',
  'nước biển',
  'pethidin',
  'tem giấy',
  'tem nhúng',
  'thuốc cấm',
  'tramadol',
  'alpha-PVP',
  'butylone',
  'cannabis',
  'chất cấm',
  'chất độc',
  'chất gây mê',
  'độc hại',
  'ephedrine',
  'ethylone',
  'Etomidate',
  'fentanyl',
  'hàng đá',
  'ketamine',
  'ketamin',
  'lá khát',
  'ma túy đá',
  'morphine',
  'morphin',
  'nguy hiểm',
  'nước vui',
  'thảo mộc',
  'thuốc lắc',
  'tiền chất',
  'tinh dầu',
  'trái phép',
  'xilazine',
  'xylazine',
  'cần sa',
  'cỏ mỹ',
  'cỏ Mỹ',
  'cỏ ngọt',
  'cocaine',
  'cocain',
  'codein',
  'đá lạnh',
  'ecstasy',
  'flakka',
  'gai dầu',
  'hashish',
  'heroin',
  'hookah',
  'kẹo dẻo',
  'ma túy',
  'nước đá',
  'shisha',
  'tài mà',
  'tobaco',
  'trà sữa',
  'bồ đà',
  '4-MMC',
  '3-MMC',
  '4-MTA',
  'opium',
  'spice',
  '2C-B',
  '2C-I',
  '2C-E',
  'MDPV',
  'PMMA',
  'vape',
  'coca',
  'khói',
  'cấm',
  'lậu',
  'MDMA',
  'tem',
  'bùa',
  'bu',
  'ke',
  'đá',
  'cỏ',
  'pin',
  'pod',
  'LSD',
  'DMT',
  'DOB',
  'DOI',
  'DOM',
  'PMA',
  'GHB',
  'GBL',
  'DXM',
  'N2O',
  'K2'
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Chuẩn hóa chuỗi: xóa toàn bộ dấu tiếng Việt, ký tự đặc biệt, dấu câu, khoảng trắng
 * Ví dụ: "h*e-r.o_i@n" -> "heroin", "c.ầ.n s.a" -> "cansa", "m_a_t_u_y" -> "matuy"
 */
function toCompactCleanString(str: string): string {
  return removeVietnameseTones(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Thay thế ký tự leetspeak thông dụng thành chữ cái tương ứng
 * Ví dụ: "h3r01n" -> "heroin", "m4 tuy" -> "matuy"
 */
function normalizeLeetSpeak(compactStr: string): string {
  return compactStr
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[\$5]/g, 's');
}

// Danh sách từ cấm kèm dạng dính liền không dấu (compact)
const COMPACT_PROHIBITED_MAP: { original: string; compact: string }[] = PROHIBITED_KEYWORDS.map((kw) => ({
  original: kw,
  compact: toCompactCleanString(kw),
})).filter((item) => item.compact.length > 0);

// Sắp xếp các từ có dạng compact dài hơn lên trước để ưu tiên cụm từ
COMPACT_PROHIBITED_MAP.sort((a, b) => b.compact.length - a.compact.length);

/**
 * Tìm từ cấm xuất hiện trong chuỗi văn bản (tên sản phẩm, mô tả)
 * Hỗ trợ toàn diện:
 * 1. Chữ HOA, chữ thường, viết hoa đầu từ
 * 2. Lách bằng ký tự đặc biệt (h*eroin, h.e.r.o.i.n, m_a_t_u_y, c-a-n-s-a, v/a/p/e...)
 * 3. Lách bằng viết không dấu, không khoảng cách (matuy, cansa, thuocphien, thuoclac, bongcuoi...)
 * 4. Lách bằng số leetspeak (h3roin, m4tuy, c4ns4...)
 *
 * @param text Chuỗi văn bản cần kiểm tra
 * @returns Tên từ cấm gốc tìm thấy đầu tiên, hoặc null nếu không có vi phạm
 */
export function findProhibitedKeyword(text: string | undefined | null): string | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Kiểm tra trực tiếp theo từ / cụm từ có ranh giới từ (word boundary)
  for (const item of COMPACT_PROHIBITED_MAP) {
    const escaped = item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu');
    if (regex.test(trimmed)) {
      return item.original;
    }
  }

  // 2. Kiểm tra chuỗi sau khi làm sạch toàn bộ ký tự đặc biệt và khoảng trắng
  const compactText = toCompactCleanString(trimmed);
  const leetText = normalizeLeetSpeak(compactText);

  for (const item of COMPACT_PROHIBITED_MAP) {
    const target = item.compact;
    // Đối với các từ có độ dài compact >= 3 ký tự (hoặc các mã chất đặc biệt), kiểm tra chứa chuỗi dính liền
    if (target.length >= 3 || target === 'k2') {
      if (compactText.includes(target) || leetText.includes(target)) {
        return item.original;
      }
    } else {
      // Đối với từ cực ngắn 2 ký tự (da, co, ke, bu, pin, pod), chỉ kiểm tra khi nó đứng độc lập
      const shortRegex = new RegExp(`(^|[^a-z0-9])${target}($|[^a-z0-9])`, 'i');
      if (shortRegex.test(removeVietnameseTones(trimmed).toLowerCase())) {
        return item.original;
      }
    }
  }

  return null;
}

/**
 * Kiểm tra xem tên hoặc mô tả sản phẩm có chứa từ cấm không
 */
export function isProhibitedProductName(text: string | undefined | null): boolean {
  return findProhibitedKeyword(text) !== null;
}
