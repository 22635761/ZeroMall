import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @EventPattern('order.created')
  handleOrderCreated(@Payload() data: any) {
    console.log('[Kafka Consumer] Received order.created event');
    try {
      const order = typeof data === 'string' ? JSON.parse(data) : data;
      
      console.log('--------------------------------------------------');
      console.log(`🔔 ĐƠN HÀNG MỚI ĐÃ ĐƯỢC TẠO THÀNH CÔNG:`);
      console.log(`- Mã Đơn Hàng: ${order.orderId}`);
      console.log(`- Khách Hàng: ${order.buyerName} (${order.buyerEmail})`);
      console.log(`- Số Điện Thoại: ${order.buyerPhone}`);
      console.log(`- Địa Chỉ Giao Hàng: ${order.shippingAddress}`);
      console.log(`- Tổng Tiền: ${order.totalAmount.toLocaleString('vi-VN')}đ`);
      console.log(`- Phương Thức Thanh Toán: ${order.paymentMethod.toUpperCase()}`);
      console.log(`- Số Lượng Sản Phẩm: ${order.items?.length || 0} sản phẩm`);
      console.log(`- Trạng Thái Ban Đầu: ${order.status}`);
      console.log(`📧 Hệ thống đang tiến hành gửi Email xác nhận đơn hàng tới: ${order.buyerEmail}...`);
      console.log('--------------------------------------------------');
    } catch (e) {
      console.error('[Kafka Consumer] Failed to process order.created payload:', e, 'Raw data:', data);
    }
  }
}
