import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Language = 'vi' | 'en'

interface Translations {
  [key: string]: {
    vi: string
    en: string
  }
}

export const translations: Translations = {
  // Header Top Utility
  'header.seller_centre': {
    vi: '🏪 Kênh Người Bán',
    en: '🏪 Seller Centre'
  },
  'header.platform_support': {
    vi: '🎧 Kênh CSKH Sàn',
    en: '🎧 Platform CS'
  },
  'header.customer_support': {
    vi: '❓ Hỗ Trợ CSKH',
    en: '❓ Help & Support'
  },
  'header.notifications': {
    vi: 'Thông Báo',
    en: 'Notifications'
  },
  'header.register': {
    vi: 'Đăng Ký',
    en: 'Register'
  },
  'header.login': {
    vi: 'Đăng Nhập',
    en: 'Login'
  },
  'header.my_account': {
    vi: 'Tài Khoản Của Tôi',
    en: 'My Account'
  },
  'header.my_orders': {
    vi: 'Đơn Mua',
    en: 'My Orders'
  },
  'header.my_wallet': {
    vi: 'Ví ZeroMall',
    en: 'ZeroMall Wallet'
  },
  'header.logout': {
    vi: 'Đăng Xuất',
    en: 'Logout'
  },

  // Header Main
  'header.search_placeholder': {
    vi: 'Tìm kiếm sản phẩm, thương hiệu...',
    en: 'Search products, brands...'
  },
  'header.cart_new_items': {
    vi: 'SẢN PHẨM MỚI THÊM',
    en: 'RECENTLY ADDED PRODUCTS'
  },
  'header.cart_empty': {
    vi: 'Chưa có sản phẩm nào',
    en: 'No products in cart yet'
  },
  'header.cart_items_count': {
    vi: 'sản phẩm trong giỏ',
    en: 'items in cart'
  },
  'header.view_cart': {
    vi: 'Xem Giỏ Hàng',
    en: 'View Cart'
  },
  'header.remove': {
    vi: 'Xóa',
    en: 'Delete'
  },
  'header.variant': {
    vi: 'Phân loại',
    en: 'Variant'
  },

  // Home sections
  'home.categories': {
    vi: 'DANH MỤC',
    en: 'CATEGORIES'
  },
  'home.flash_sale': {
    vi: 'FLASH SALE',
    en: 'FLASH SALE'
  },
  'home.daily_discover': {
    vi: 'GỢI Ý HÔM NAY',
    en: 'DAILY DISCOVER'
  },
  'home.see_all': {
    vi: 'Xem Tất Cả >',
    en: 'See All >'
  },
  'home.sold': {
    vi: 'Đã bán',
    en: 'Sold'
  },
  'home.filter_active': {
    vi: 'Đang lọc theo danh mục:',
    en: 'Filtering by category:'
  },
  'home.cancel_filter': {
    vi: '✕ Hủy lọc danh mục',
    en: '✕ Clear filter'
  },

  // Product Detail & Actions
  'product.add_to_cart': {
    vi: '🛒 Thêm Vào Giỏ Hàng',
    en: '🛒 Add To Cart'
  },
  'product.buy_now': {
    vi: 'Mua Ngay',
    en: 'Buy Now'
  },
  'product.quantity': {
    vi: 'Số Lượng',
    en: 'Quantity'
  },
  'product.available': {
    vi: 'sản phẩm có sẵn',
    en: 'pieces available'
  },
  'product.shipping': {
    vi: 'Vận Chuyển',
    en: 'Shipping'
  },
  'product.free_shipping': {
    vi: 'Miễn Phí Vận Chuyển',
    en: 'Free Shipping'
  },
  'product.shipping_to': {
    vi: 'Vận chuyển tới',
    en: 'Shipping to'
  },
  'product.shipping_fee': {
    vi: 'Phí vận chuyển',
    en: 'Shipping Fee'
  },
  'product.shop_vouchers': {
    vi: 'Mã Giảm Giá Shop',
    en: 'Shop Vouchers'
  },
  'product.reviews': {
    vi: 'Đánh Giá',
    en: 'Reviews'
  },
  'product.chat_now': {
    vi: 'Chat Ngay',
    en: 'Chat Now'
  },
  'product.follow_shop': {
    vi: '➕ Theo Dõi Shop',
    en: '➕ Follow Shop'
  },
  'product.following_shop': {
    vi: '✓ Đang Theo Dõi',
    en: '✓ Following'
  },

  // Modals & Prompts
  'auth.prompt_title': {
    vi: 'Bạn chưa đăng nhập tài khoản',
    en: 'You are not logged in'
  },
  'auth.prompt_cart_desc': {
    vi: 'Vui lòng đăng nhập hoặc tạo tài khoản ZeroMall để xem giỏ hàng, lưu trữ sản phẩm và tiến hành đặt hàng.',
    en: 'Please log in or create a ZeroMall account to view cart, save items, and proceed to checkout.'
  },
  'auth.login_now': {
    vi: '🔑 Đăng Nhập Ngay',
    en: '🔑 Log In Now'
  },
  'auth.register_now': {
    vi: 'Tạo Tài Khoản Mới',
    en: 'Create New Account'
  },
  'auth.later': {
    vi: 'Để sau',
    en: 'Maybe Later'
  },

  // Footer
  'footer.customer_service': {
    vi: 'CHĂM SÓC KHÁCH HÀNG',
    en: 'CUSTOMER CARE'
  },
  'footer.help_centre': {
    vi: 'Trung Tâm Trợ Giúp ZeroMall',
    en: 'ZeroMall Help Centre'
  },
  'footer.shopping_guide': {
    vi: 'Hướng Dẫn Mua Hàng & Đặt Hàng',
    en: 'How to Buy & Order Guide'
  },
  'footer.selling_guide': {
    vi: 'Hướng Dẫn Bán Hàng Cho Shop',
    en: 'How to Sell Guide for Shops'
  },
  'footer.payments_refunds': {
    vi: 'Thanh Toán & Trả Hàng',
    en: 'Payment & Return Policy'
  },
  'footer.about_zeromall': {
    vi: 'VỀ ZEROMALL',
    en: 'ABOUT ZEROMALL'
  },
  'footer.about_us': {
    vi: 'Giới Thiệu Về ZeroMall Việt Nam',
    en: 'About ZeroMall Vietnam'
  },
  'footer.careers': {
    vi: 'Tuyển Dụng',
    en: 'Careers'
  },
  'footer.terms': {
    vi: 'Điều Khoản ZeroMall',
    en: 'Terms & Conditions'
  },
  'footer.privacy': {
    vi: 'Chính Sách Bảo Mật',
    en: 'Privacy Policy'
  },
  'footer.payment': {
    vi: 'THANH TOÁN',
    en: 'PAYMENT'
  },
  'footer.shipping_partners': {
    vi: 'ĐƠN VỊ VẬN CHUYỂN',
    en: 'LOGISTICS PARTNERS'
  },
  'footer.follow_us': {
    vi: 'THEO DÕI CHÚNG TÔI',
    en: 'FOLLOW US'
  },
  'footer.all_rights': {
    vi: '© 2026 ZeroMall. Tất cả quyền lợi được bảo lưu.',
    en: '© 2026 ZeroMall. All rights reserved.'
  },
  'footer.regions': {
    vi: 'Quốc gia & Khu vực: Việt Nam | Singapore | Malaysia | Thái Lan | Philippines | Indonesia',
    en: 'Countries & Regions: Vietnam | Singapore | Malaysia | Thailand | Philippines | Indonesia'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultText?: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('vi')

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('zm_language', lang)
  }

  const t = (key: string, defaultText?: string): string => {
    const entry = translations[key]
    if (entry && entry[language]) {
      return entry[language]
    }
    return defaultText || key
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
