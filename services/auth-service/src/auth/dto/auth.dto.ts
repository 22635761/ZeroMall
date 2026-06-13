export class RegisterDto {
  email: string;
  password: string;
  name: string;
  role: 'BUYER' | 'ADMIN' | 'SHOP_OWNER' | 'SHOP_STAFF' | 'PLATFORM_SUPPORT';
  shopId?: string; // Optional: Only for SHOP_STAFF
  shopName?: string; // Optional: For SHOP_OWNER to auto-create a Shop
}

export class LoginDto {
  email: string;
  password: string;
}
