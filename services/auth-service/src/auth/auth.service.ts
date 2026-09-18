import { ConflictException, Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user and auto-create shop if the user is SHOP_OWNER
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          name: dto.name,
          role: dto.role,
        },
      });

      if (dto.role === 'SHOP_OWNER' && dto.shopName) {
        const shop = await tx.shop.create({
          data: {
            name: dto.shopName,
            ownerId: user.id,
          },
        });
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { shopId: shop.id },
        });
        return {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            shopId: updatedUser.shopId,
          },
          shop,
        };
      }

      if (dto.role === 'SHOP_STAFF' && dto.shopId) {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { shopId: dto.shopId },
        });
        return {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            shopId: updatedUser.shopId,
            avatar: updatedUser.avatar,
            gender: updatedUser.gender,
            birthday: updatedUser.birthday,
            phoneNumber: updatedUser.phoneNumber,
          },
        };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          gender: user.gender,
          birthday: user.birthday,
          phoneNumber: user.phoneNumber,
        },
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        ownedShop: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      shopId: user.shopId || user.ownedShop?.id || null,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        shopId: payload.shopId,
        avatar: user.avatar,
        gender: user.gender,
        birthday: user.birthday,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  async getShopById(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        responseRate: true,
        responseTime: true,
        status: true,
        email: true,
        phoneNumber: true,
        pickupAddress: true,
        shippingSettings: true,
        createdAt: true,
      },
    });
    if (!shop) {
      throw new NotFoundException(`Cửa hàng với ID ${id} không tồn tại`);
    }
    const followersCount = await this.prisma.shopFollow.count({
      where: { shopId: id },
    });
    return {
      ...shop,
      followers: followersCount,
    };
  }

  async getShopFollowStatus(shopId: string, userId?: string) {
    const count = await this.prisma.shopFollow.count({
      where: { shopId },
    });
    let isFollowing = false;
    if (userId) {
      const follow = await this.prisma.shopFollow.findUnique({
        where: {
          userId_shopId: { userId, shopId },
        },
      });
      isFollowing = !!follow;
    }
    return {
      count,
      isFollowing,
    };
  }

  async toggleFollowShop(shopId: string, userId: string) {
    const existingFollow = await this.prisma.shopFollow.findUnique({
      where: {
        userId_shopId: { userId, shopId },
      },
    });

    if (existingFollow) {
      await this.prisma.shopFollow.delete({
        where: {
          userId_shopId: { userId, shopId },
        },
      });
    } else {
      await this.prisma.shopFollow.create({
        data: {
          userId,
          shopId,
        },
      });

      // Tạo thông báo cho Shop khi có người dùng nhấn Theo dõi
      try {
        const follower = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        const followerName = follower?.name || follower?.email || 'Một khách hàng';

        // Lấy thông tin Shop để gửi thông báo vào ID của Shop và ID Chủ Shop
        const shop = await this.prisma.shop.findUnique({
          where: { id: shopId },
          select: { ownerId: true, name: true },
        });

        const notifServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
        const targetIds = [shopId];
        if (shop?.ownerId && shop.ownerId !== shopId) {
          targetIds.push(shop.ownerId);
        }

        for (const targetId of targetIds) {
          fetch(`${notifServiceUrl}/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: targetId,
              title: 'Người theo dõi mới 🎉',
              content: `Người dùng ${followerName} vừa nhấn Theo dõi shop của bạn. Hãy đăng thêm sản phẩm mới để tiếp cận khách hàng!`,
              type: 'SYSTEM',
              metadata: { action: 'VIEW_SHOP', shopId },
            }),
          }).catch((err) => console.error('Error sending follow notification:', err));
        }
      } catch (notifErr) {
        console.error('Failed to trigger follow notification:', notifErr);
      }
    }

    return this.getShopFollowStatus(shopId, userId);
  }

  async updateShopOnboarding(id: string, dto: { email: string; phoneNumber: string; pickupAddress: string; shippingSettings: string }) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException(`Cửa hàng với ID ${id} không tồn tại`);
    }

    return this.prisma.shop.update({
      where: { id },
      data: {
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        pickupAddress: dto.pickupAddress,
        shippingSettings: dto.shippingSettings,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async approveShop(id: string, status: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
    });
    if (!shop) {
      throw new NotFoundException(`Cửa hàng với ID ${id} không tồn tại`);
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      throw new Error('Trạng thái phê duyệt không hợp lệ');
    }

    const updatedShop = await this.prisma.shop.update({
      where: { id },
      data: { status },
    });

    if (status === 'APPROVED') {
      await this.prisma.user.updateMany({
        where: { id: shop.ownerId },
        data: { shopId: shop.id },
      });
    }

    return updatedShop;
  }

  async getShops(status?: string) {
    if (status) {
      return this.prisma.shop.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserProfile(
    id: string,
    dto: { name?: string; email?: string; phoneNumber?: string; gender?: string; birthday?: string; avatar?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Người dùng với ID ${id} không tồn tại`);
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        gender: true,
        birthday: true,
        phoneNumber: true,
      }
    });
  }

  async changeUserPassword(id: string, dto: { currentPassword?: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.currentPassword) {
      const isValid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác!');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status }
    });
  }

  async getCsStaff() {
    return this.prisma.user.findMany({
      where: { role: 'PLATFORM_SUPPORT' },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCsStaff(dto: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });
    if (existingUser) {
      throw new ConflictException('Email đã tồn tại trong hệ thống');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: passwordHash,
        name: dto.name,
        role: 'PLATFORM_SUPPORT',
        status: 'ACTIVE'
      }
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }

  async createAuditLog(user: string, action: string) {
    return this.prisma.auditLog.create({
      data: { user, action }
    });
  }

  // Quản lý địa chỉ giao hàng của người dùng (User Addresses)
  async getUserAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createUserAddress(userId: string, dto: {
    name: string;
    phone: string;
    region: string;
    details: string;
    isDefault?: boolean;
    lat?: number;
    lng?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
  }) {
    const count = await this.prisma.userAddress.count({ where: { userId } });
    const shouldBeDefault = dto.isDefault ?? (count === 0);

    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.create({
        data: {
          userId,
          name: dto.name,
          phone: dto.phone,
          region: dto.region,
          details: dto.details,
          isDefault: shouldBeDefault,
          lat: dto.lat,
          lng: dto.lng,
          ghnDistrictId: dto.ghnDistrictId,
          ghnWardCode: dto.ghnWardCode,
        },
      });
    });
  }

  async updateUserAddress(userId: string, addressId: string, dto: {
    name?: string;
    phone?: string;
    region?: string;
    details?: string;
    isDefault?: boolean;
    lat?: number;
    lng?: number;
    ghnDistrictId?: number;
    ghnWardCode?: string;
  }) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.userAddress.update({
        where: { id: addressId },
        data: {
          ...dto,
        },
      });
    });
  }

  async deleteUserAddress(userId: string, addressId: string) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');

    await this.prisma.userAddress.delete({ where: { id: addressId } });

    // Nếu xóa địa chỉ mặc định, tự động gán địa chỉ mới nhất làm mặc định
    if (existing.isDefault) {
      const next = await this.prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) {
        await this.prisma.userAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  async setDefaultUserAddress(userId: string, addressId: string) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');

    await this.prisma.$transaction([
      this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      this.prisma.userAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { success: true };
  }
}
