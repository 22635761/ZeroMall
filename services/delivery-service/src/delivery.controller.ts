import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // 1. Tạo Shipment (Vận đơn SPX)
  @Post('shipments')
  async createShipment(@Body() body: any) {
    return this.deliveryService.createShipment(body);
  }

  // Alias tương thích cũ
  @Post('create')
  async createLegacy(@Body() body: any) {
    return this.deliveryService.createShipment(body);
  }

  // 2. Lấy danh sách Vận đơn (hỗ trợ lọc theo sellerId, status, search)
  @Get('shipments')
  async getShipments(@Query() query: { sellerId?: string; status?: string; search?: string }) {
    return this.deliveryService.getShipments(query);
  }

  // Alias tương thích cũ
  @Get('orders')
  async getOrdersLegacy(@Query('stage') stage?: string) {
    return this.deliveryService.getShipments({ status: stage });
  }

  // 3. Tra cứu timeline tracking chi tiết
  @Get('tracking/:identifier')
  async getTracking(@Param('identifier') identifier: string) {
    return this.deliveryService.getTracking(identifier);
  }

  // 4. Phân công tài xế
  @Post('shipments/:id/assign')
  async assignDriver(
    @Param('id') id: string,
    @Body() body: { driverId: string; type: 'PICKUP' | 'DELIVERY' }
  ) {
    return this.deliveryService.assignDriver(id, body.driverId, body.type);
  }

  // 4.1. Tự Động Định Tuyến & Điều Phối Theo Khu Vực
  @Post('shipments/:id/auto-dispatch')
  async autoDispatch(
    @Param('id') id: string,
    @Body() body: { type: 'PICKUP' | 'DELIVERY' }
  ) {
    return this.deliveryService.autoDispatch(id, body.type);
  }

  // 5. Cập nhật trạng thái chuyển chặng (State Machine)
  @Patch('shipments/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: {
      status: string;
      hubId?: string;
      driverId?: string;
      note?: string;
      failureReason?: string;
      proofImage?: string;
    }
  ) {
    return this.deliveryService.updateStatus(id, body);
  }

  // Alias tương thích cũ
  @Post(':id/advance')
  async advanceLegacy(@Param('id') id: string, @Body() body: any) {
    return this.deliveryService.updateStatus(id, body);
  }

  // 6. Danh sách Hubs
  @Get('hubs')
  async getHubs() {
    return this.deliveryService.getHubs();
  }

  // 7. Danh sách Drivers & Trạng thái hoạt động
  @Get('drivers')
  async getDrivers(@Query('hubId') hubId?: string) {
    return this.deliveryService.getDrivers(hubId);
  }

  @Patch('drivers/:id/status')
  async updateDriverStatus(
    @Param('id') id: string,
    @Body() body: { status: string; lat?: number; lng?: number }
  ) {
    return this.deliveryService.updateDriverStatus(id, body.status, body.lat, body.lng);
  }

  // 7.1. Nộp Tiền COD Cuối Ngày Về Bưu Cục
  @Post('drivers/:id/remit-cod')
  async remitDriverCod(
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod: 'CASH' | 'BANK_TRANSFER'; proof?: string }
  ) {
    return this.deliveryService.remitDriverCod(id, body.amount, body.paymentMethod, body.proof);
  }

  // Shipper Chấp nhận / Từ chối đơn
  @Post('assignments/:id/respond')
  async respondAssignment(
    @Param('id') id: string,
    @Body() body: { action: 'ACCEPT' | 'REJECT'; note?: string }
  ) {
    return this.deliveryService.respondAssignment(id, body.action, body.note);
  }

  // 8. Đối Soát COD & Phí (Settlements)
  @Get('settlements')
  async getSettlements(@Query('sellerId') sellerId?: string) {
    return this.deliveryService.getSettlements(sellerId);
  }

  @Post('settlements/generate')
  async generateSettlement(@Body('sellerId') sellerId: string) {
    return this.deliveryService.generateSettlement(sellerId);
  }

  // 9. Khiếu Nại & Bồi Thường (Claims)
  @Post('claims')
  async createClaim(@Body() body: any) {
    return this.deliveryService.createClaim(body);
  }

  @Get('claims')
  async getClaims(@Query('sellerId') sellerId?: string) {
    return this.deliveryService.getClaims(sellerId);
  }
}
