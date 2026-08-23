import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo Shipment (Vận đơn SPX) độc lập khi Seller xác nhận giao hàng
  async createShipment(dto: {
    orderId: string;
    sellerId: string;
    buyerId: string;
    buyerName: string;
    buyerPhone: string;
    deliveryAddress: string;
    pickupAddressId?: string;
    declaredValue?: number;
    codAmount?: number;
    shippingFee?: number;
    weight?: number;
    itemsSummary?: string;
    fragile?: boolean;
    liquid?: boolean;
  }) {
    const existing = await this.prisma.shipment.findUnique({
      where: { orderId: dto.orderId },
      include: {
        package: true,
        trackingLogs: { orderBy: { timestamp: 'desc' } },
        assignments: { include: { driver: true } },
        codTransaction: true,
      },
    });

    if (existing) {
      return existing;
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `ZMX${yy}${mm}${dd}${rand}`;

    const originHub = await this.prisma.hub.findFirst({
      where: { status: 'ACTIVE' },
    });

    const shipment = await this.prisma.$transaction(async (tx) => {
      const createdShipment = await tx.shipment.create({
        data: {
          orderId: dto.orderId,
          sellerId: dto.sellerId,
          buyerId: dto.buyerId,
          trackingNumber,
          pickupAddressId: dto.pickupAddressId || null,
          deliveryAddress: dto.deliveryAddress,
          buyerName: dto.buyerName,
          buyerPhone: dto.buyerPhone,
          declaredValue: dto.declaredValue || 0,
          codAmount: dto.codAmount || 0,
          shippingFee: dto.shippingFee || 25000,
          carrierId: 'ZMX',
          status: 'CREATED',
          currentHubId: originHub?.id || null,
          package: {
            create: {
              weight: dto.weight || 0.5,
              length: 15,
              width: 10,
              height: 10,
              declaredValue: dto.declaredValue || 0,
              fragile: dto.fragile || false,
              liquid: dto.liquid || false,
              itemsSummary: dto.itemsSummary || 'Bưu kiện ZeroMall Express',
            },
          },
          trackingLogs: {
            create: {
              status: 'CREATED',
              title: 'Người bán đã tạo đơn vận chuyển',
              description: `Vận đơn ${trackingNumber} được khởi tạo thành công. Hệ thống ZeroMall Express (ZMX) đang chờ phân công tài xế lấy hàng.`,
              location: 'Kênh Người Bán ZeroMall',
            },
          },
          codTransaction: {
            create: {
              orderId: dto.orderId,
              sellerId: dto.sellerId,
              codAmount: dto.codAmount || 0,
              status: dto.codAmount && dto.codAmount > 0 ? 'PENDING' : 'NOT_APPLICABLE',
            },
          },
        },
        include: {
          package: true,
          trackingLogs: true,
          codTransaction: true,
        },
      });

      return createdShipment;
    });

    // Đồng bộ trạng thái SHIPPED sang order-service
    await this.syncOrderStatus(dto.orderId, 'SHIPPED', trackingNumber);

    // Tự động gán Shipper khu vực đi lấy hàng (Auto-Dispatch Pickup Driver)
    try {
      await this.autoDispatch(shipment.id, 'PICKUP');
      console.log(`[SPX-Logistics] Auto-dispatched pickup driver for shipment ${shipment.trackingNumber}`);
    } catch (err) {
      console.error(`[SPX-Logistics] Failed to auto-dispatch pickup driver:`, err);
    }

    return this.prisma.shipment.findUnique({
      where: { id: shipment.id },
      include: {
        package: true,
        pickupAddress: true,
        currentHub: true,
        assignments: { include: { driver: true } },
        trackingLogs: { orderBy: { timestamp: 'desc' } },
        codTransaction: true,
      },
    });
  }

  // 2. Tra cứu danh sách vận đơn (hỗ trợ lọc theo sellerId, driverId, status)
  async getShipments(query: { sellerId?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.search) {
      where.OR = [
        { trackingNumber: { contains: query.search, mode: 'insensitive' } },
        { orderId: { contains: query.search, mode: 'insensitive' } },
        { buyerName: { contains: query.search, mode: 'insensitive' } },
        { buyerPhone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.shipment.findMany({
      where,
      include: {
        package: true,
        pickupAddress: true,
        currentHub: true,
        assignments: {
          include: { driver: true },
          orderBy: { assignedAt: 'desc' },
        },
        trackingLogs: {
          orderBy: { timestamp: 'desc' },
        },
        codTransaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Tra cứu timeline vận đơn theo orderId hoặc trackingNumber (cho Buyer & Seller)
  async getTracking(identifier: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        OR: [
          { orderId: identifier },
          { trackingNumber: identifier },
        ],
      },
      include: {
        package: true,
        pickupAddress: true,
        currentHub: true,
        assignments: {
          include: { driver: true },
          orderBy: { assignedAt: 'desc' },
        },
        trackingLogs: {
          orderBy: { timestamp: 'desc' },
        },
        codTransaction: true,
        attempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      // Auto-fallback: Tự động khởi tạo shipment nếu chưa có
      try {
        const orderRes = await fetch(`http://order-service:3004/orders/${identifier}`);
        if (orderRes.ok) {
          const ord = await orderRes.json();
          const itemsSummary = ord.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ');
          return this.createShipment({
            orderId: ord.id,
            sellerId: ord.items[0]?.shopId || 'seller-default',
            buyerId: ord.buyerId,
            buyerName: ord.buyerName,
            buyerPhone: ord.buyerPhone,
            deliveryAddress: ord.shippingAddress,
            codAmount: ord.paymentMethod === 'cod' ? ord.totalAmount : 0,
            declaredValue: ord.totalAmount,
            itemsSummary,
          });
        }
      } catch (e) {
        console.error('Error auto-creating shipment for tracking:', e);
      }
      throw new NotFoundException(`Không tìm thấy thông tin vận đơn cho mã ${identifier}`);
    }

    return shipment;
  }

  // 4.1. Tự Động Định Tuyến & Gán Shipper Khu Vực (Auto-Dispatch by Area & Geofencing)
  async autoDispatch(shipmentId: string, type: 'PICKUP' | 'DELIVERY') {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { pickupAddress: true, currentHub: true },
    });

    if (!shipment) throw new NotFoundException('Không tìm thấy Vận đơn');

    // Phân tích địa chỉ để tìm Driver phù hợp (100% từ dữ liệu thực tế)
    const targetAddress = type === 'PICKUP'
      ? (shipment.pickupAddress?.address || '')
      : (shipment.deliveryAddress || '');

    if (!targetAddress) {
      throw new BadRequestException('Không tìm thấy thông tin địa chỉ lấy hàng hoặc giao hàng thực tế của đơn hàng.');
    }

    const lowerAddr = targetAddress.toLowerCase();

    // Tìm Driver có khu vực phụ trách khớp nhất
    const allDrivers = await this.prisma.driver.findMany({
      where: { status: { in: ['AVAILABLE', 'ONLINE'] } },
      include: { hub: true },
    });

    // 4.1.1. Kiểm tra Hạn Mức COD của Tài Xế (COD Cap: Tối đa 10.000.000đ)
    const activeDrivers = await Promise.all(
      allDrivers.map(async (d) => {
        // Tính tổng COD tài xế đang cầm từ các đơn đã DELIVERED nhưng chưa nộp bưu cục
        const deliveredAssignments = await this.prisma.deliveryAssignment.findMany({
          where: { driverId: d.id, type: 'DELIVERY' },
          include: { shipment: true },
        });
        const heldCod = deliveredAssignments
          .filter((a) => a.shipment.status === 'DELIVERED')
          .reduce((sum, a) => sum + (a.shipment.codAmount || 0), 0);

        return { ...d, heldCod, isBlocked: heldCod >= 10000000 };
      })
    );

    let matchedDriver = activeDrivers.find((d) => {
      if (d.isBlocked) return false;
      if (d.assignedDistrict && lowerAddr.includes(d.assignedDistrict.toLowerCase())) return true;
      if (d.assignedProvince && lowerAddr.includes(d.assignedProvince.toLowerCase())) return true;
      if (d.operatingArea) {
        const areas = d.operatingArea.toLowerCase().split(',');
        if (areas.some((a) => lowerAddr.includes(a.trim()))) return true;
      }
      return false;
    });

    // Fallback: nếu không khớp chính xác, chọn tài xế thuộc Hub gần nhất (không bị khóa COD)
    if (!matchedDriver && activeDrivers.filter((d) => !d.isBlocked).length > 0) {
      const eligible = activeDrivers.filter((d) => !d.isBlocked);
      if (lowerAddr.includes('đồng nai') || lowerAddr.includes('biên hòa')) {
        matchedDriver = eligible.find((d) => d.hub?.code === 'DN01') || eligible[0];
      } else if (lowerAddr.includes('hà nội') || lowerAddr.includes('mê linh')) {
        matchedDriver = eligible.find((d) => d.hub?.code === 'HN01') || eligible[0];
      } else {
        matchedDriver = eligible.find((d) => d.hub?.code === 'HCM01') || eligible[0];
      }
    }

    if (!matchedDriver) {
      throw new BadRequestException('Hiện tại không có tài xế khả dụng (các tài xế trong khu vực đang Offline hoặc đã vượt hạn mức COD 10 triệu đồng cần nộp kho).');
    }

    return this.assignDriver(shipmentId, matchedDriver.id, type);
  }

  // 4.1.2. Nộp Tiền COD Về Bưu Cục Cuối Ngày (Driver Remittance)
  async remitDriverCod(driverId: string, amount: number, paymentMethod: 'CASH' | 'BANK_TRANSFER', proof?: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId }, include: { hub: true } });
    if (!driver) throw new NotFoundException('Không tìm thấy tài xế');

    // Chuyển toàn bộ các giao dịch COD của tài xế này sang trạng thái REMITTED
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: { driverId, type: 'DELIVERY' },
      include: { shipment: true },
    });

    const shipmentIds = assignments.map((a) => a.shipmentId);

    await this.prisma.codTransaction.updateMany({
      where: {
        shipmentId: { in: shipmentIds },
        status: 'COLLECTED',
      },
      data: {
        status: 'SETTLED',
        settledAt: new Date(),
      },
    });

    // Mở khóa lại trạng thái AVAILABLE cho tài xế nếu trước đó bị khóa
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'AVAILABLE' },
    });

    return {
      success: true,
      message: `Tài xế ${driver.name} đã nộp thành công ${amount.toLocaleString('vi-VN')}đ tiền COD về ${driver.hub?.name || 'Bưu cục'} (${paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}).`,
      remittedAt: new Date(),
    };
  }

  // 4. Gán Tài xế (Driver Assignment: PICKUP hoặc DELIVERY)
  async assignDriver(shipmentId: string, driverId: string, type: 'PICKUP' | 'DELIVERY') {
    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId }, include: { hub: true } });

    if (!shipment || !driver) {
      throw new NotFoundException('Không tìm thấy Vận đơn hoặc Tài xế');
    }

    const nextStatus = type === 'PICKUP' ? 'PICKUP_ASSIGNED' : 'OUT_FOR_DELIVERY';
    const title = type === 'PICKUP' ? 'Đã điều phối tài xế lấy hàng' : 'Đã phân công tài xế giao hàng';
    const desc = type === 'PICKUP'
      ? `Tài xế ${driver.name} (SĐT: ${driver.phone} - Xe: ${driver.vehicleNumber} - Tuyến: ${driver.operatingArea || 'Khu vực phụ trách'}) đang trên đường đến địa chỉ người bán để lấy kiện hàng.`
      : `Tài xế ${driver.name} (SĐT: ${driver.phone} - Xe: ${driver.vehicleNumber}) đang tiến hành giao hàng đến địa chỉ người nhận.`;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.deliveryAssignment.create({
        data: {
          shipmentId,
          driverId,
          type,
          status: 'ASSIGNED',
        },
      });

      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: nextStatus,
          trackingLogs: {
            create: {
              status: nextStatus,
              driverId,
              title,
              description: desc,
              location: `${driver.name} (${driver.vehicleNumber})`,
            },
          },
        },
        include: {
          trackingLogs: { orderBy: { timestamp: 'desc' } },
          assignments: { include: { driver: true } },
        },
      });

      return updated;
    });

    return result;
  }

  // 5. Cập nhật trạng thái chuyển chặng (State Machine Chặt Chẽ)
  async updateStatus(shipmentId: string, dto: {
    status: string;
    hubId?: string;
    driverId?: string;
    note?: string;
    failureReason?: string;
    proofImage?: string;
  }) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { currentHub: true },
    });

    if (!shipment) {
      throw new NotFoundException('Không tìm thấy vận đơn');
    }

    let title = '';
    let desc = '';
    let location = shipment.currentHub?.name || 'Trạm trung chuyển SPX';

    switch (dto.status) {
      case 'PICKED_UP':
        title = 'Tài xế đã lấy hàng thành công';
        desc = 'Kiện hàng đã được tài xế tiếp nhận từ người bán và đang trên đường nhập kho xuất phát.';
        location = 'Kho người bán';
        break;
      case 'AT_ORIGIN_HUB':
        title = 'Đơn hàng đã đến kho xuất phát';
        desc = `Bưu kiện đã nhập kho ${location}. Đang chuẩn bị quét mã vạch và phân loại.`;
        break;
      case 'SORTING':
        title = 'Đang phân loại bưu kiện';
        desc = `Bưu kiện đang được máy phân loại tự động điều hướng sang tuyến xe tải liên tỉnh.`;
        break;
      case 'IN_TRANSIT':
        title = 'Đang luân chuyển giữa các Hub';
        desc = `Bưu kiện đã rời kho xuất phát và đang trên xe tải trung chuyển đến Bưu cục phát hàng địa phương.`;
        location = 'Xe trung chuyển SPX';
        break;
      case 'AT_DESTINATION_HUB':
        title = 'Đã đến bưu cục phát hàng địa phương';
        desc = `Bưu kiện đã đến bưu cục khu vực người nhận và sẵn sàng phân chia tuyến phát cho shipper.`;
        break;
      case 'OUT_FOR_DELIVERY':
        title = 'Shipper đang giao hàng đến bạn';
        desc = `Shipper đang di chuyển đến địa chỉ của bạn. Vui lòng chú ý điện thoại.`;
        break;
      case 'DELIVERED':
        title = 'Giao hàng thành công';
        desc = shipment.codAmount > 0
          ? `Giao hàng thành công. Tài xế đã thu COD: ${shipment.codAmount.toLocaleString('vi-VN')}đ. Khách hàng đã ký nhận.`
          : 'Giao hàng thành công. Người nhận đã nhận đầy đủ bưu phẩm.';
        location = shipment.deliveryAddress;
        break;
      case 'DELIVERY_FAILED':
        title = 'Giao hàng không thành công';
        desc = `Lý do: ${dto.failureReason || 'Người nhận hẹn giao lại thời gian khác'}. SPX sẽ điều phối phát lại vào ngày làm việc tiếp theo.`;
        break;
      case 'RETURNING':
        title = 'Đơn hàng đang chuyển hoàn về Người Bán';
        desc = `Sau 3 lần phát không thành công hoặc người mua từ chối nhận, bưu kiện đang được chuyển hoàn về kho người bán.`;
        break;
      case 'RETURNED':
        title = 'Đã hoàn trả thành công về Người Bán';
        desc = `Người bán đã nhận lại bưu phẩm hoàn. Đơn hàng kết thúc quy trình vận chuyển.`;
        location = 'Kho người bán';
        break;
      default:
        title = dto.note || 'Cập nhật trạng thái vận đơn';
        desc = dto.note || 'Trạng thái bưu kiện đã được ghi nhận trên hệ thống SPX.';
    }

    const updatedShipment = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật Shipment
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: dto.status,
          currentHubId: dto.hubId || shipment.currentHubId,
          pickedUpAt: dto.status === 'PICKED_UP' ? new Date() : shipment.pickedUpAt,
          deliveredAt: dto.status === 'DELIVERED' ? new Date() : shipment.deliveredAt,
          trackingLogs: {
            create: {
              status: dto.status,
              hubId: dto.hubId || shipment.currentHubId,
              driverId: dto.driverId,
              title,
              description: desc,
              location,
            },
          },
        },
        include: {
          trackingLogs: { orderBy: { timestamp: 'desc' } },
          codTransaction: true,
          package: true,
        },
      });

      // 2. Nếu quét tại Hub -> ghi HubScan
      if (['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(dto.status) && (dto.hubId || shipment.currentHubId)) {
        await tx.hubScan.create({
          data: {
            shipmentId,
            hubId: (dto.hubId || shipment.currentHubId)!,
            scanType: dto.status,
            note: dto.note,
          },
        });
      }

      // 3. Nếu giao thất bại -> ghi DeliveryAttempt
      if (dto.status === 'DELIVERY_FAILED') {
        const attemptsCount = await tx.deliveryAttempt.count({ where: { shipmentId } });
        const driverId = dto.driverId || 'driver-01';
        await tx.deliveryAttempt.create({
          data: {
            shipmentId,
            driverId,
            attemptNumber: attemptsCount + 1,
            failureReason: dto.failureReason || 'Khách không nghe máy',
            note: dto.note,
            proofImage: dto.proofImage,
          },
        });
      }

      // 4. Nếu giao thành công & có COD -> Cập nhật CodTransaction
      if (dto.status === 'DELIVERED' && shipment.codAmount > 0) {
        await tx.codTransaction.updateMany({
          where: { shipmentId },
          data: {
            status: 'COLLECTED',
            collectedAmount: shipment.codAmount,
            collectedAt: new Date(),
          },
        });
      }

      return updated;
    });

    // Đồng bộ trạng thái đơn hàng sang order-service & payment-service
    if (dto.status === 'DELIVERED') {
      await this.syncOrderStatus(shipment.orderId, 'DELIVERED');
      
      // Nếu là đơn thanh toán COD -> Cập nhật trạng thái giao dịch trong payment-service thành SUCCESS
      if (shipment.codAmount > 0) {
        try {
          const paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
          await fetch(`${paymentUrl}/payments/charge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: shipment.orderId,
              buyerId: shipment.buyerId,
              amount: shipment.codAmount,
              paymentMethod: 'cod',
            }),
          });
          console.log(`[SPX-Logistics] Synced COD payment success for order ${shipment.orderId}`);
        } catch (e) {
          console.error(`[SPX-Logistics] Failed to sync COD payment to payment-service:`, e);
        }
      }
    } else if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(dto.status)) {
      await this.syncOrderStatus(shipment.orderId, 'SHIPPED');
    }

    return updatedShipment;
  }

  // 6. Quản lý Hubs
  async getHubs() {
    return this.prisma.hub.findMany({
      include: {
        drivers: true,
        _count: { select: { shipments: true } },
      },
    });
  }

  // 7. Quản lý Drivers & Trạng Thái Hoạt Động (Online / Offline / Available / Busy)
  async getDrivers(hubId?: string) {
    const where: any = {};
    if (hubId) where.hubId = hubId;
    return this.prisma.driver.findMany({
      where,
      include: {
        hub: true,
        assignments: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          include: { shipment: true },
        },
      },
    });
  }

  async updateDriverStatus(driverId: string, status: string, lat?: number, lng?: number) {
    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status,
        currentLat: lat !== undefined ? lat : undefined,
        currentLng: lng !== undefined ? lng : undefined,
      },
      include: { hub: true },
    });
  }

  // Shipper Chấp nhận đơn / Từ chối đơn
  async respondAssignment(assignmentId: string, action: 'ACCEPT' | 'REJECT', note?: string) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { shipment: true, driver: true },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy lệnh phân công');
    }

    if (action === 'ACCEPT') {
      const nextStatus = assignment.type === 'PICKUP' ? 'PICKING_UP' : 'OUT_FOR_DELIVERY';
      const desc = assignment.type === 'PICKUP'
        ? `Tài xế ${assignment.driver.name} đã chấp nhận đơn và đang di chuyển đến địa chỉ người bán.`
        : `Tài xế ${assignment.driver.name} đã nhận kiện hàng và bắt đầu lộ trình giao đến bạn.`;

      const result = await this.prisma.$transaction(async (tx) => {
        await tx.deliveryAssignment.update({
          where: { id: assignmentId },
          data: { status: 'IN_PROGRESS' },
        });

        await tx.driver.update({
          where: { id: assignment.driverId },
          data: { status: 'BUSY' },
        });

        const updated = await tx.shipment.update({
          where: { id: assignment.shipmentId },
          data: {
            status: nextStatus,
            trackingLogs: {
              create: {
                status: nextStatus,
                driverId: assignment.driverId,
                title: assignment.type === 'PICKUP' ? 'Tài xế đang đến lấy hàng' : 'Đang tiến hành giao hàng',
                description: desc,
                location: assignment.driver.vehicleNumber,
              },
            },
          },
          include: {
            trackingLogs: { orderBy: { timestamp: 'desc' } },
            assignments: { include: { driver: true } },
          },
        });

        return updated;
      });

      return result;
    } else {
      // REJECT -> Hủy phân công, đưa đơn về lại trạng thái chờ gán
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.deliveryAssignment.update({
          where: { id: assignmentId },
          data: { status: 'CANCELLED', note: note || 'Tài xế từ chối nhận cuốc' },
        });

        await tx.driver.update({
          where: { id: assignment.driverId },
          data: { status: 'AVAILABLE' },
        });

        const updated = await tx.shipment.update({
          where: { id: assignment.shipmentId },
          data: {
            status: assignment.type === 'PICKUP' ? 'WAITING_PICKUP' : 'AT_DESTINATION_HUB',
            trackingLogs: {
              create: {
                status: 'REASSIGNING',
                title: 'Đang điều phối lại tài xế',
                description: `Tài xế ${assignment.driver.name} bận, hệ thống SPX đang tự động điều phối tài xế khác.`,
              },
            },
          },
        });

        return updated;
      });

      return result;
    }
  }

  // 8. Quản lý Đối Soát (Settlement)
  async getSettlements(sellerId?: string) {
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    return this.prisma.settlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateSettlement(sellerId: string) {
    const codTxs = await this.prisma.codTransaction.findMany({
      where: {
        sellerId,
        status: 'COLLECTED',
      },
    });

    const totalCod = codTxs.reduce((sum, tx) => sum + tx.collectedAmount, 0);
    const shippingFee = codTxs.length * 25000;
    const platformFee = totalCod * 0.05; // 5% hoa hồng sàn
    const netAmount = Math.max(0, totalCod - shippingFee - platformFee);

    const settlement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.settlement.create({
        data: {
          sellerId,
          periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          periodEnd: new Date(),
          totalCod,
          shippingFee,
          platformFee,
          netAmount,
          status: 'APPROVED',
          settledAt: new Date(),
        },
      });

      await tx.codTransaction.updateMany({
        where: {
          id: { in: codTxs.map((t) => t.id) },
        },
        data: {
          status: 'SETTLED',
          settledAt: new Date(),
        },
      });

      return created;
    });

    return settlement;
  }

  // 9. Quản lý Khiếu Nại (Claims)
  async createClaim(data: {
    orderId: string;
    shipmentId: string;
    sellerId: string;
    buyerId?: string;
    claimType: string;
    description: string;
    requestedAmount: number;
    evidences?: string[];
  }) {
    return this.prisma.claim.create({
      data: {
        orderId: data.orderId,
        shipmentId: data.shipmentId,
        sellerId: data.sellerId,
        buyerId: data.buyerId,
        claimType: data.claimType,
        description: data.description,
        requestedAmount: data.requestedAmount,
        status: 'OPEN',
        evidences: {
          create: data.evidences?.map((url) => ({
            fileUrl: url,
            fileType: 'IMAGE',
          })) || [],
        },
      },
      include: { evidences: true },
    });
  }

  async getClaims(sellerId?: string) {
    const where: any = {};
    if (sellerId) where.sellerId = sellerId;
    return this.prisma.claim.findMany({
      where,
      include: {
        shipment: true,
        evidences: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

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
}
