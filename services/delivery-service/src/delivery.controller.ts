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
      truckNumber?: string;
      truckDriver?: string;
      truckDriverPhone?: string;
      sealNumber?: string;
      targetHubId?: string;
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

  // 7.1. Điểm Danh Ca Làm Việc (Check-in ca)
  @Post('drivers/:id/check-in')
  async checkInDriverShift(
    @Param('id') id: string,
    @Body() body: { faceImage?: string; lat?: number; lng?: number; note?: string }
  ) {
    return this.deliveryService.checkInDriverShift(id, body);
  }

  // 7.2. Kết Thúc Ca Làm Việc (Check-out ca)
  @Post('drivers/:id/check-out')
  async checkOutDriverShift(@Param('id') id: string) {
    return this.deliveryService.checkOutDriverShift(id);
  }

  // 7.3. Kiểm tra trạng thái Điểm Danh hôm nay
  @Get('drivers/:id/attendance-today')
  async getDriverAttendanceToday(@Param('id') id: string) {
    return this.deliveryService.getDriverAttendanceToday(id);
  }

  // 7.4. Quét gán đơn từ Hàng Đợi Bưu Cục
  @Post('drivers/:id/drain-queue')
  async drainDriverQueue(@Param('id') id: string) {
    return this.deliveryService.dispatchPendingHubQueue(id);
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

  // 10. QUẢN LÝ TRẢ HÀNG & HOÀN TIỀN (RETURNS & REFUNDS)
  @Post('returns')
  async createReturn(@Body() body: any) {
    return this.deliveryService.createReturn(body);
  }

  @Get('returns')
  async getReturns(
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.deliveryService.getReturns({ sellerId, buyerId, orderId, status, search });
  }

  @Get('returns/:id')
  async getReturnById(@Param('id') id: string) {
    return this.deliveryService.getReturnById(id);
  }

  @Patch('returns/:id/respond')
  async sellerRespondReturn(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT' | 'NEGOTIATE'; note?: string; proposedAmount?: number; evidenceUrl?: string }
  ) {
    return this.deliveryService.sellerRespondReturn(id, body);
  }

  @Patch('returns/:id/negotiate-respond')
  async buyerRespondNegotiation(
    @Param('id') id: string,
    @Body() body: { accept: boolean; note?: string }
  ) {
    return this.deliveryService.buyerRespondNegotiation(id, body);
  }

  @Post('returns/:id/ship')
  async buyerConfirmShipReturn(
    @Param('id') id: string,
    @Body() body: { returnMethod: 'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE'; externalTrackingNumber?: string; proofImage?: string }
  ) {
    return this.deliveryService.buyerConfirmShipReturn(id, body);
  }

  @Patch('returns/:id/mark-delivered')
  async markReturnDeliveredToSeller(@Param('id') id: string) {
    return this.deliveryService.markReturnDeliveredToSeller(id);
  }

  @Patch('returns/:id/confirm-receive')
  async sellerConfirmReceiveReturn(
    @Param('id') id: string,
    @Body() body: { conditionOk: boolean; note?: string; restockAction?: 'RESTOCK' | 'SCRAP'; evidenceUrl?: string }
  ) {
    return this.deliveryService.sellerConfirmReceiveReturn(id, body);
  }

  @Patch('returns/:id/arbitrate')
  async csArbitrateReturn(
    @Param('id') id: string,
    @Body() body: { decision: 'REFUND_BUYER' | 'REJECT_RETURN'; note: string; csAgentId?: string }
  ) {
    return this.deliveryService.csArbitrateReturn(id, body);
  }

  @Patch('returns/:id/cancel')
  async cancelReturn(
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.deliveryService.cancelReturn(id, reason);
  }

  // 11. Lấy thông tin kho lấy hàng của Shop
  @Get('seller-address/:sellerId')
  async getSellerAddress(@Param('sellerId') sellerId: string) {
    return this.deliveryService.getSellerAddress(sellerId);
  }
}
