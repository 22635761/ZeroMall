import { ConflictException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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
          },
        };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
}
