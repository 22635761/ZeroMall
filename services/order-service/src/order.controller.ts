import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get('buyer/:buyerId')
  async getOrdersByBuyer(@Param('buyerId') buyerId: string) {
    return this.orderService.getOrdersByBuyer(buyerId);
  }

  @Get('seller/:shopId')
  async getOrdersBySeller(@Param('shopId') shopId: string) {
    return this.orderService.getOrdersBySeller(shopId);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto);
  }
}
