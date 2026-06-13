import { Body, Controller, Get, Post, UseGuards, Request, Param, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAdminOnlyData() {
    return {
      message: 'Chào mừng Admin! Đây là dữ liệu bảo mật của hệ thống ZeroMall.',
    };
  }

  @Get('shop-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SHOP_OWNER', 'SHOP_STAFF')
  getShopData(@Request() req) {
    return {
      message: 'Chào mừng thành viên cửa hàng! Quyền truy cập hợp lệ.',
      user: req.user,
    };
  }

  @Get('shops/:id')
  async getShop(@Param('id') id: string) {
    return this.authService.getShopById(id);
  }

  @Get('shops/:id/follow-status')
  async getShopFollowStatus(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.authService.getShopFollowStatus(id, userId);
  }

  @Post('shops/:id/follow')
  async toggleFollowShop(@Param('id') id: string, @Body('userId') userId: string) {
    return this.authService.toggleFollowShop(id, userId);
  }
}
