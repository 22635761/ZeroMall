import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReturnDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper gọi sync order-service
  private async syncOrderStatus(orderId: string, status: string, ghnOrderCode?: string) {
    try {
      const url = `http://order-service:3004/orders/${orderId}/status`;
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ghnOrderCode,
        }),
      });
      console.log(`[SPX-Logistics] Synced order ${orderId} status to ${status}`);
    } catch (e) {
      console.error(`[SPX-Logistics] Failed to sync order status:`, e);
    }
  }

  // ─── QUẢN LÝ TRẢ HÀNG & HOÀN TIỀN (SHOPEE-STANDARD RETURNS & REFUNDS) ───

  async createReturn(dto: {
    orderId: string;
    shipmentId?: string;
    sellerId: string;
    buyerId: string;
    resolution: 'REFUND_ONLY' | 'RETURN_REFUND';
    reason: string;
    reasonDetail?: string;
    refundAmount: number;
    items?: Array<{
      orderItemId: string;
      productId: string;
      productName: string;
      productImage?: string;
      variant?: string;
      price: number;
      quantity: number;
      refundAmount: number;
    }>;
    evidences?: Array<{
      fileUrl: string;
      fileType?: 'IMAGE' | 'VIDEO';
      description?: string;
    }>;
    returnMethod?: 'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE';
  }) {
    // 1. Kiểm tra xem đơn hàng đã có yêu cầu trả hàng đang xử lý chưa
    const existingActive = await this.prisma.return.findFirst({
      where: {
        orderId: dto.orderId,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
    });
    if (existingActive) {
      throw new BadRequestException('Đơn hàng này đang có một yêu cầu trả hàng/hoàn tiền đang được xử lý!');
    }

    // 2. Tìm hoặc liên kết shipment
    let shipmentId = dto.shipmentId;
    if (!shipmentId) {
      const shipment = await this.prisma.shipment.findUnique({ where: { orderId: dto.orderId } });
      if (shipment) shipmentId = shipment.id;
    }
    if (!shipmentId) {
      throw new NotFoundException('Không tìm thấy thông tin vận đơn của đơn hàng này để xử lý hoàn hàng');
    }

    // 3. Sinh mã yêu cầu RTN...
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const returnNumber = `RTN${yy}${mm}${dd}${rand}`;

    // 4. Hạn chót người bán phản hồi: 48 giờ (2 ngày lịch)
    const sellerDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const created = await this.prisma.$transaction(async (tx) => {
      return await tx.return.create({
        data: {
          returnNumber,
          orderId: dto.orderId,
          shipmentId,
          sellerId: dto.sellerId,
          buyerId: dto.buyerId,
          resolution: dto.resolution || 'RETURN_REFUND',
          reason: dto.reason,
          reasonDetail: dto.reasonDetail || null,
          refundAmount: dto.refundAmount || 0,
          status: 'REQUESTED',
          returnMethod: dto.returnMethod || 'ZMX_PICKUP',
          sellerDeadline,
          items: {
            create: (dto.items || []).map((item) => ({
              orderItemId: item.orderItemId,
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage || null,
              variant: item.variant || null,
              price: item.price,
              quantity: item.quantity,
              refundAmount: item.refundAmount || 0,
            })),
          },
          evidences: {
            create: (dto.evidences || []).map((ev) => ({
              uploadedBy: 'BUYER',
              fileUrl: ev.fileUrl,
              fileType: ev.fileType || 'IMAGE',
              description: ev.description || null,
            })),
          },
        },
        include: {
          items: true,
          evidences: true,
          shipment: true,
        },
      });
    });

    // 5. Đóng băng tiền bảo đảm Escrow tại payment-service
    try {
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
      await fetch(`${paymentUrl}/payments/escrow/${dto.orderId}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log(`[SPX-Logistics] Escrow frozen for order ${dto.orderId} due to Return #${created.returnNumber}`);
    } catch (e) {
      console.warn('[SPX-Logistics] Could not call payment-service to freeze escrow:', e);
    }

    // 6. Đồng bộ trạng thái đơn hàng sang order-service
    await this.syncOrderStatus(dto.orderId, 'RETURN_REQUESTED');

    return created;
  }

  async getReturns(query: {
    sellerId?: string;
    buyerId?: string;
    orderId?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.buyerId) where.buyerId = query.buyerId;
    if (query.orderId) where.orderId = query.orderId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.search) {
      where.OR = [
        { returnNumber: { contains: query.search, mode: 'insensitive' } },
        { orderId: { contains: query.search, mode: 'insensitive' } },
        { returnTrackingNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.return.findMany({
      where,
      include: {
        items: true,
        evidences: { orderBy: { createdAt: 'desc' } },
        negotiations: { orderBy: { createdAt: 'desc' } },
        shipment: {
          include: { pickupAddress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReturnById(id: string) {
    const ret = await this.prisma.return.findFirst({
      where: {
        OR: [{ id }, { returnNumber: id }],
      },
      include: {
        items: true,
        evidences: { orderBy: { createdAt: 'desc' } },
        negotiations: { orderBy: { createdAt: 'desc' } },
        shipment: {
          include: { pickupAddress: true },
        },
      },
    });

    if (!ret) {
      throw new NotFoundException(`Không tìm thấy thông tin yêu cầu hoàn hàng với mã ${id}`);
    }

    return ret;
  }

  // Seller phản hồi yêu cầu trả hàng
  async sellerRespondReturn(
    id: string,
    dto: {
      action: 'APPROVE' | 'REJECT' | 'NEGOTIATE' | 'REFUND_IMMEDIATELY';
      note?: string;
      proposedAmount?: number;
      evidenceUrl?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    const isRefundNow = dto.action === 'REFUND_IMMEDIATELY' || 
      (dto.action === 'APPROVE' && (ret.status === 'RETURN_SHIPPING' || ret.status === 'RETURN_IN_TRANSIT'));

    if (
      ret.status !== 'REQUESTED' &&
      ret.status !== 'SELLER_REVIEWING' &&
      !((ret.status === 'RETURN_SHIPPING' || ret.status === 'RETURN_IN_TRANSIT') && isRefundNow)
    ) {
      throw new BadRequestException(`Yêu cầu trả hàng đang ở trạng thái [${ret.status}], không thể phản hồi!`);
    }

    if (dto.evidenceUrl) {
      await this.prisma.returnEvidence.create({
        data: {
          returnId: ret.id,
          uploadedBy: 'SELLER',
          fileUrl: dto.evidenceUrl,
          fileType: dto.evidenceUrl.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
          description: dto.note || 'Bằng chứng đóng gói hàng từ Người bán',
        },
      });
    }

    if (dto.action === 'APPROVE' || dto.action === 'REFUND_IMMEDIATELY') {
      if (ret.resolution === 'REFUND_ONLY' || isRefundNow) {
        await this.prisma.return.update({
          where: { id: ret.id },
          data: {
            status: 'COMPLETED',
            sellerNote: dto.note || (isRefundNow ? 'Người bán chọn hoàn tiền ngay cho người mua mà không cần nhận hàng' : undefined),
            completedAt: new Date(),
          },
        });

        await this.executePaymentRefund(ret.orderId, ret.buyerId, ret.sellerId, ret.refundAmount, ret.reason);
        await this.syncOrderStatus(ret.orderId, 'REFUNDED');

        return {
          success: true,
          status: 'COMPLETED',
          message: 'Đã hoàn tiền ngay cho người mua thành công mà không cần chờ nhận lại hàng.',
        };
      } else {
        const buyerShipDeadline = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        await this.prisma.return.update({
          where: { id: ret.id },
          data: {
            status: 'RETURN_SHIPPING',
            sellerNote: dto.note,
            buyerShipDeadline,
          },
        });

        await this.syncOrderStatus(ret.orderId, 'RETURN_APPROVED');

        return {
          success: true,
          status: 'RETURN_SHIPPING',
          message: 'Đã chấp nhận yêu cầu trả hàng. Đang chờ người mua gửi hàng về địa chỉ của bạn.',
          buyerShipDeadline,
        };
      }
    } else if (dto.action === 'REJECT') {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'SELLER_DISPUTED',
          sellerNote: dto.note || 'Người bán từ chối yêu cầu trả hàng',
        },
      });

      await this.syncOrderStatus(ret.orderId, 'RETURN_DISPUTED');

      return {
        success: true,
        status: 'SELLER_DISPUTED',
        message: 'Bạn đã từ chối yêu cầu trả hàng. Đội ngũ CS Khách hàng ZeroMall sẽ thẩm định bằng chứng của hai bên.',
      };
    } else if (dto.action === 'NEGOTIATE') {
      if (!dto.proposedAmount || dto.proposedAmount <= 0) {
        throw new BadRequestException('Vui lòng nhập số tiền đề xuất hoàn hợp lệ!');
      }

      const negotiation = await this.prisma.returnNegotiation.create({
        data: {
          returnId: ret.id,
          proposedBy: 'SELLER',
          proposedAmount: dto.proposedAmount,
          message: dto.note || 'Người bán đề xuất hoàn tiền một phần',
          status: 'PENDING',
        },
      });

      await this.prisma.return.update({
        where: { id: ret.id },
        data: { status: 'SELLER_REVIEWING' },
      });

      return {
        success: true,
        negotiation,
        message: `Đã gửi đề xuất hoàn một phần: ${dto.proposedAmount.toLocaleString('vi-VN')}đ tới người mua.`,
      };
    }
  }

  // Buyer phản hồi đề xuất thương lượng
  async buyerRespondNegotiation(id: string, dto: { accept: boolean; note?: string }) {
    const ret = await this.getReturnById(id);
    const pendingNeg = await this.prisma.returnNegotiation.findFirst({
      where: { returnId: ret.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!pendingNeg) {
      throw new NotFoundException('Không tìm thấy lời đề xuất hoàn tiền đang chờ phản hồi!');
    }

    if (dto.accept) {
      await this.prisma.returnNegotiation.update({
        where: { id: pendingNeg.id },
        data: { status: 'ACCEPTED' },
      });

      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          refundAmount: pendingNeg.proposedAmount,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await this.executePaymentRefund(
        ret.orderId,
        ret.buyerId,
        ret.sellerId,
        pendingNeg.proposedAmount,
        'Hai bên thỏa thuận hoàn tiền một phần'
      );
      await this.syncOrderStatus(ret.orderId, 'REFUNDED');

      return {
        success: true,
        message: `Đã đồng ý thỏa thuận hoàn ${pendingNeg.proposedAmount.toLocaleString('vi-VN')}đ. Tiền đã được cộng vào ví của bạn!`,
      };
    } else {
      await this.prisma.returnNegotiation.update({
        where: { id: pendingNeg.id },
        data: { status: 'REJECTED' },
      });

      await this.prisma.return.update({
        where: { id: ret.id },
        data: { status: 'CS_ARBITRATING' },
      });

      await this.syncOrderStatus(ret.orderId, 'RETURN_DISPUTED');

      return {
        success: true,
        message: 'Bạn đã từ chối thỏa thuận. Yêu cầu được chuyển đến Nhân viên CS ZeroMall để phân xử.',
      };
    }
  }

  // Buyer xác nhận gửi hàng trả về cho Shop
  async buyerConfirmShipReturn(
    id: string,
    dto: {
      returnMethod: 'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE';
      externalTrackingNumber?: string;
      proofImage?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const returnTrackingNumber = dto.externalTrackingNumber || `RTX${yy}${mm}${dd}${rand}`;

    if (dto.proofImage) {
      await this.prisma.returnEvidence.create({
        data: {
          returnId: ret.id,
          uploadedBy: 'BUYER',
          fileUrl: dto.proofImage,
          fileType: 'IMAGE',
          description: 'Hình ảnh bưu kiện hoàn trả đã gửi',
        },
      });
    }

    await this.prisma.return.update({
      where: { id: ret.id },
      data: {
        status: 'RETURN_IN_TRANSIT',
        returnMethod: dto.returnMethod,
        returnTrackingNumber,
      },
    });

    await this.prisma.shipmentTracking.create({
      data: {
        shipmentId: ret.shipmentId,
        status: 'RETURN_IN_TRANSIT',
        title: 'Bưu kiện hoàn trả đang được vận chuyển về Người Bán',
        description: `Mã vận đơn hoàn: ${returnTrackingNumber} (${dto.returnMethod === 'ZMX_PICKUP' ? 'SPX lấy tận nơi' : 'Gửi tại Bưu cục'}).`,
        location: 'Hệ thống vận chuyển SPX',
      },
    });

    await this.syncOrderStatus(ret.orderId, 'RETURN_SHIPPING');

    return {
      success: true,
      returnTrackingNumber,
      status: 'RETURN_IN_TRANSIT',
      message: `Đã ghi nhận gửi hàng hoàn. Mã vận đơn hoàn: ${returnTrackingNumber}.`,
    };
  }

  // Shipper xác nhận đã đến địa chỉ Người Mua lấy hàng hoàn thành công
  async shipperConfirmReturnPickup(
    id: string,
    dto: {
      driverId?: string;
      proofImage?: string;
      note?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const returnTrackingNumber = ret.returnTrackingNumber || `RTX${yy}${mm}${dd}${rand}`;

    if (dto.proofImage) {
      await this.prisma.returnEvidence.create({
        data: {
          returnId: ret.id,
          uploadedBy: 'CS',
          fileUrl: dto.proofImage,
          fileType: 'IMAGE',
          description: dto.note || 'Ảnh kiện hàng Shipper ZMX đã thu hồi từ người mua',
        },
      });
    }

    await this.prisma.return.update({
      where: { id: ret.id },
      data: {
        status: 'RETURN_IN_TRANSIT',
        returnTrackingNumber,
        returnMethod: 'ZMX_PICKUP',
      },
    });

    let driverInfo = '';
    if (dto.driverId) {
      const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
      if (driver) {
        driverInfo = ` bởi Shipper ${driver.name} (${driver.phone} - ${driver.vehicleNumber})`;
      }
    }

    await this.prisma.shipmentTracking.create({
      data: {
        shipmentId: ret.shipmentId,
        status: 'RETURN_IN_TRANSIT',
        title: 'Shipper ZMX đã nhận hàng hoàn từ Người Mua',
        description: `Kiện hàng hoàn trả đã được thu hồi thành công${driverInfo}. Đang trên đường chuyển về kho Shop. Mã vận đơn hoàn: ${returnTrackingNumber}.`,
        location: 'Hệ thống vận chuyển SPX',
      },
    });

    await this.syncOrderStatus(ret.orderId, 'RETURN_SHIPPING');

    return {
      success: true,
      returnTrackingNumber,
      status: 'RETURN_IN_TRANSIT',
      message: `Đã xác nhận lấy hàng hoàn từ Người Mua thành công! Mã vận đơn hoàn: ${returnTrackingNumber}.`,
    };
  }

  // Hub quét nhận bưu kiện hoàn trả từ Shipper (Inbound Scan)
  async hubInboundReturn(
    id: string,
    dto: {
      hubId: string;
      staffName?: string;
      note?: string;
    }
  ) {
    const ret = await this.getReturnById(id);
    let hubName = 'Bưu Cục ZMX';
    if (dto.hubId) {
      const hub = await this.prisma.hub.findUnique({ where: { id: dto.hubId } });
      if (hub) hubName = hub.name;
    }

    // 1. Ghi HubScan
    await this.prisma.hubScan.create({
      data: {
        shipmentId: ret.shipmentId,
        hubId: dto.hubId,
        scanType: 'ARRIVED',
        note: dto.note || `Nhân viên kho [${dto.staffName || 'ZMX'}] quét nhận kiện hoàn từ Shipper tại ${hubName}`,
      },
    });

    // 2. Cập nhật trạng thái Return thành RETURN_AT_HUB (Hàng hoàn đã nhập bưu cục)
    const updatedReturn = await this.prisma.return.update({
      where: { id: ret.id },
      data: {
        status: 'RETURN_AT_HUB',
      },
    });

    // 3. Cập nhật shipment liên quan
    if (ret.shipmentId) {
      await this.prisma.shipment.update({
        where: { id: ret.shipmentId },
        data: {
          status: 'AT_ORIGIN_HUB',
          currentHubId: dto.hubId,
        },
      });
    }

    // 4. Ghi ShipmentTracking
    await this.prisma.shipmentTracking.create({
      data: {
        shipmentId: ret.shipmentId,
        status: 'RETURN_AT_HUB',
        hubId: dto.hubId,
        title: `Kiện hàng hoàn đã nhập kho Bưu Cục ${hubName}`,
        description: `Nhân viên kho [${dto.staffName || 'ZMX'}] đã quét nhận kiện hàng hoàn #${ret.returnTrackingNumber || ret.returnNumber} từ Shipper bàn giao. Bưu kiện đang lưu tại ${hubName} chờ phân loại chuyển tiếp về Shop.`,
        location: hubName,
      },
    });

    return {
      success: true,
      message: `Đã quét nhận kiện hàng hoàn #${ret.returnTrackingNumber || ret.returnNumber} nhập kho ${hubName} thành công.`,
      return: updatedReturn,
    };
  }

  // Shipper hoặc Hub đánh dấu hàng hoàn đã giao tới người bán
  async markReturnDeliveredToSeller(id: string) {
    const ret = await this.getReturnById(id);
    const sellerInspectDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const updated = await this.prisma.return.update({
      where: { id: ret.id },
      data: {
        status: 'DELIVERED_TO_SELLER',
        sellerInspectDeadline,
      },
    });

    await this.prisma.shipmentTracking.create({
      data: {
        shipmentId: ret.shipmentId,
        status: 'DELIVERED_TO_SELLER',
        title: 'Hàng hoàn đã được giao đến Người Bán',
        description: 'Người bán có 48 giờ để kiểm tra tình trạng hàng hóa trước khi hệ thống tự động hoàn tiền cho Người mua.',
        location: 'Kho người bán',
      },
    });

    await this.syncOrderStatus(ret.orderId, 'DELIVERED_TO_SELLER');

    return updated;
  }

  // Seller xác nhận đã nhận hàng hoàn và kiểm tra tình trạng
  async sellerConfirmReceiveReturn(
    id: string,
    dto: {
      conditionOk: boolean;
      note?: string;
      restockAction?: 'RESTOCK' | 'SCRAP';
      evidenceUrl?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    if (dto.evidenceUrl) {
      await this.prisma.returnEvidence.create({
        data: {
          returnId: ret.id,
          uploadedBy: 'SELLER',
          fileUrl: dto.evidenceUrl,
          fileType: dto.evidenceUrl.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
          description: dto.note || 'Video/Ảnh khui kiện hàng hoàn từ Người bán',
        },
      });
    }

    if (dto.conditionOk) {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'COMPLETED',
          sellerNote: dto.note || 'Người bán xác nhận hàng hoàn nguyên vẹn',
          completedAt: new Date(),
        },
      });

      await this.executePaymentRefund(ret.orderId, ret.buyerId, ret.sellerId, ret.refundAmount, ret.reason);
      await this.syncOrderStatus(ret.orderId, 'REFUNDED');

      if (dto.restockAction === 'RESTOCK' && ret.items && ret.items.length > 0) {
        try {
          const productUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
          await fetch(`${productUrl}/products/restock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: ret.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            }),
          });
          console.log(`[SPX-Logistics] Restocked items for return #${ret.returnNumber}`);
        } catch (e) {
          console.error('[SPX-Logistics] Failed to restock product stock:', e);
        }
      }

      return {
        success: true,
        status: 'COMPLETED',
        message: 'Đã xác nhận nhận hàng và hoàn tiền thành công cho Người mua!',
      };
    } else {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'SELLER_DISPUTED',
          sellerNote: dto.note || 'Hàng hoàn bị hư hỏng / tráo đổi',
        },
      });

      await this.syncOrderStatus(ret.orderId, 'RETURN_DISPUTED');

      return {
        success: true,
        status: 'SELLER_DISPUTED',
        message: 'Đã ghi nhận khiếu nại của Người bán. Nhân viên CS sẽ liên hệ kiểm tra bằng chứng.',
      };
    }
  }

  // CS Sàn phân xử tranh chấp
  async csArbitrateReturn(
    id: string,
    dto: {
      decision: 'REFUND_BUYER' | 'REJECT_RETURN';
      note: string;
      csAgentId?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    if (dto.decision === 'REFUND_BUYER') {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'COMPLETED',
          csAgentId: dto.csAgentId || 'cs-agent-01',
          csNote: dto.note,
          completedAt: new Date(),
        },
      });

      await this.executePaymentRefund(ret.orderId, ret.buyerId, ret.sellerId, ret.refundAmount, `CS phán quyết: ${dto.note}`);
      await this.syncOrderStatus(ret.orderId, 'REFUNDED');

      return {
        success: true,
        status: 'COMPLETED',
        message: 'CS đã phán quyết cho Người mua: Hoàn tiền thành công!',
      };
    } else {
      await this.prisma.return.update({
        where: { id: ret.id },
        data: {
          status: 'REJECTED',
          csAgentId: dto.csAgentId || 'cs-agent-01',
          csNote: dto.note,
          completedAt: new Date(),
        },
      });

      try {
        const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
        await fetch(`${paymentUrl}/payments/escrow/${ret.orderId}/unfreeze`, {
          method: 'POST',
        });
      } catch (e) {
        console.warn('Failed to unfreeze escrow:', e);
      }

      await this.syncOrderStatus(ret.orderId, 'COMPLETED');

      return {
        success: true,
        status: 'REJECTED',
        message: 'CS đã phán quyết cho Người bán: Bác bỏ yêu cầu hoàn tiền!',
      };
    }
  }

  // Hủy yêu cầu trả hàng
  async cancelReturn(id: string, reason?: string) {
    const ret = await this.getReturnById(id);

    await this.prisma.return.update({
      where: { id: ret.id },
      data: {
        status: 'CANCELLED',
        csNote: reason || 'Người mua đã hủy yêu cầu trả hàng',
        completedAt: new Date(),
      },
    });

    try {
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
      await fetch(`${paymentUrl}/payments/escrow/${ret.orderId}/unfreeze`, {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Failed to unfreeze escrow:', e);
    }

    return {
      success: true,
      status: 'CANCELLED',
      message: 'Đã hủy yêu cầu trả hàng.',
    };
  }

  private async executePaymentRefund(
    orderId: string,
    buyerId: string,
    shopId: string,
    refundAmount: number,
    reason?: string
  ) {
    try {
      const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
      const res = await fetch(`${paymentUrl}/payments/return-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          buyerId,
          shopId,
          refundAmount,
          reason,
        }),
      });
      if (res.ok) {
        console.log(`[SPX-Logistics] Refunded ${refundAmount}đ to buyer ${buyerId} for order ${orderId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('[SPX-Logistics] Error executing payment refund:', err);
      }
    } catch (e) {
      console.error('[SPX-Logistics] Failed to call payment-service return-refund:', e);
    }
  }
}
