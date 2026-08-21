import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('create')
  async createDeliveryOrder(@Body() body: any) {
    return this.deliveryService.createDeliveryOrder(body);
  }

  @Get('orders')
  async getAllDeliveryOrders(@Query('stage') stage?: string) {
    return this.deliveryService.getAllDeliveryOrders(stage);
  }

  @Get('tracking/:orderId')
  async getTrackingByOrderId(@Param('orderId') orderId: string) {
    return this.deliveryService.getTrackingByOrderId(orderId);
  }

  @Post(':id/advance')
  async advanceStage(
    @Param('id') id: string,
    @Body() body: { stage: string; note?: string; location?: string; proofImage?: string; failedReason?: string }
  ) {
    return this.deliveryService.advanceStage(id, body);
  }
}
