import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo Shipment (Vận đơn SPX) độc lập khi Seller xác nhận giao hàng
  async createShipment(dto: {
    orderId: string;
    sellerId?: string;
    shopId?: string;
    buyerId?: string;
    buyerName?: string;
    buyerPhone?: string;
    deliveryAddress?: string;
    shippingAddress?: string;
    pickupAddressId?: string;
    declaredValue?: number;
    codAmount?: number;
    shippingFee?: number;
    totalAmount?: number;
    paymentMethod?: string;
    weight?: number;
    itemsSummary?: string;
    fragile?: boolean;
    liquid?: boolean;
  }) {
    const existing = await this.prisma.shipment.findUnique({
      where: { orderId: dto.orderId },
      include: {
        package: true,
        pickupAddress: true,
        currentHub: true,
        trackingLogs: { orderBy: { timestamp: 'desc' } },
        assignments: { include: { driver: true } },
        codTransaction: true,
      },
    });

    if (existing) {
      return existing;
    }

    const sellerId = dto.sellerId || dto.shopId || 'seller-default';
    const deliveryAddress = dto.deliveryAddress || dto.shippingAddress || '';
    const buyerId = dto.buyerId || 'buyer-default';
    const buyerName = dto.buyerName || 'Khách hàng';
    const buyerPhone = dto.buyerPhone || '0900000000';
    const declaredValue = dto.declaredValue || dto.totalAmount || 0;
    const codAmount = dto.codAmount !== undefined 
      ? dto.codAmount 
      : (dto.paymentMethod === 'cod' ? (dto.totalAmount || 0) : 0);
    const shippingFee = dto.shippingFee || 25000;

    // Tự động tìm hoặc đồng bộ địa chỉ lấy hàng của Shop từ auth-service nếu chưa có
    let pickupAddressId = dto.pickupAddressId;
    if (!pickupAddressId && sellerId) {
      let sellerAddr = await this.prisma.sellerAddress.findFirst({
        where: { sellerId },
      });

      if (!sellerAddr) {
        try {
          const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
          const shopRes = await fetch(`${authUrl}/auth/shops/${sellerId}`);
          if (shopRes.ok) {
            const shopData = await shopRes.json();
            if (shopData.pickupAddress) {
              const parsed = typeof shopData.pickupAddress === 'string'
                ? JSON.parse(shopData.pickupAddress)
                : shopData.pickupAddress;

              sellerAddr = await this.prisma.sellerAddress.create({
                data: {
                  sellerId,
                  name: shopData.name || 'Kho người bán',
                  contactName: parsed.fullName || shopData.name || 'Chủ Shop',
                  phone: parsed.phoneNumber || shopData.phoneNumber || '0900000000',
                  address: parsed.detailAddress || parsed.address || '',
                  province: parsed.province || '',
                  district: parsed.district || '',
                  ward: parsed.ward || '',
                  latitude: parsed.coordinates?.lat || null,
                  longitude: parsed.coordinates?.lng || null,
                  isDefault: true,
                },
              });
              console.log(`[SPX-Logistics] Auto-synced SellerAddress for shop ${sellerId} from auth-service`);
            }
          }
        } catch (e) {
          console.warn('[SPX-Logistics] Could not fetch shop pickup address from auth-service:', e);
        }
      }

      if (!sellerAddr) {
        sellerAddr = await this.prisma.sellerAddress.findFirst({
          where: { isDefault: true },
        });
      }

      if (sellerAddr) {
        pickupAddressId = sellerAddr.id;
      }
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `ZMX${yy}${mm}${dd}${rand}`;

    // Tìm Hub gốc tương ứng với địa chỉ lấy hàng của Shop (dynamic matching theo province từ DB)
    let originHub: any = null;
    if (pickupAddressId) {
      const pAddr = await this.prisma.sellerAddress.findUnique({ where: { id: pickupAddressId } });
      if (pAddr && pAddr.province) {
        const sellerProvince = pAddr.province.toLowerCase();
        // Tìm Hub có province khớp với province của SellerAddress
        const allHubs = await this.prisma.hub.findMany({ where: { status: 'ACTIVE' } });
        originHub = allHubs.find((h) => {
          const hubProvince = (h.province || '').toLowerCase();
          return hubProvince && (hubProvince.includes(sellerProvince) || sellerProvince.includes(hubProvince));
        });
      }
    }
    if (!originHub) {
      // Fallback: chọn Hub active đầu tiên (không ưu tiên HCM cố định)
      originHub = await this.prisma.hub.findFirst({ where: { status: 'ACTIVE' } });
    }

    const shipment = await this.prisma.$transaction(async (tx) => {
      const createdShipment = await tx.shipment.create({
        data: {
          orderId: dto.orderId,
          sellerId,
          buyerId,
          trackingNumber,
          pickupAddressId: pickupAddressId || null,
          deliveryAddress,
          buyerName,
          buyerPhone,
          declaredValue,
          codAmount,
          shippingFee,
          carrierId: 'ZMX',
          status: 'CREATED',
          currentHubId: originHub?.id || null,
          package: {
            create: {
              weight: dto.weight || 0.5,
              length: 15,
              width: 10,
              height: 10,
              declaredValue,
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
              sellerId,
              codAmount,
              status: codAmount > 0 ? 'PENDING' : 'NOT_APPLICABLE',
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

    const shipments = await this.prisma.shipment.findMany({
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

    // Tự động phân tích và gắn địa chỉ kho thực tế của Shop nếu shipment chưa được link pickupAddress
    for (const s of shipments) {
      if (!s.pickupAddress && s.sellerId) {
        let sellerAddr = await this.prisma.sellerAddress.findFirst({
          where: { sellerId: s.sellerId },
        });

        if (!sellerAddr) {
          try {
            const authUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
            const shopRes = await fetch(`${authUrl}/auth/shops/${s.sellerId}`);
            if (shopRes.ok) {
              const shopData = await shopRes.json();
              if (shopData.pickupAddress) {
                const parsed = typeof shopData.pickupAddress === 'string'
                  ? JSON.parse(shopData.pickupAddress)
                  : shopData.pickupAddress;

                sellerAddr = await this.prisma.sellerAddress.create({
                  data: {
                    sellerId: s.sellerId,
                    name: shopData.name || 'Kho người bán',
                    contactName: parsed.fullName || shopData.name || 'Chủ Shop',
                    phone: parsed.phoneNumber || shopData.phoneNumber || '0900000000',
                    address: parsed.detailAddress || parsed.address || '',
                    province: parsed.province || '',
                    district: parsed.district || '',
                    ward: parsed.ward || '',
                    latitude: parsed.coordinates?.lat || null,
                    longitude: parsed.coordinates?.lng || null,
                    isDefault: true,
                  },
                });
              }
            }
          } catch (e) {
            console.warn('[SPX-Logistics] Could not auto-sync shop address in getShipments:', e);
          }
        }

        if (sellerAddr) {
          (s as any).pickupAddress = sellerAddr;
          this.prisma.shipment.update({
            where: { id: s.id },
            data: { pickupAddressId: sellerAddr.id },
          }).catch(() => {});
        }
      }
    }

    return shipments;
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

    // Trích xuất thông tin địa lý có cấu trúc từ pickupAddress (SellerAddress) hoặc deliveryAddress
    // Ưu tiên dùng province/district có cấu trúc thay vì match chuỗi address thô
    let targetProvince = '';
    let targetDistrict = '';
    let targetFullAddress = '';

    if (type === 'PICKUP' && shipment.pickupAddress) {
      targetProvince = shipment.pickupAddress.province || '';
      targetDistrict = shipment.pickupAddress.district || '';
      // Ghép đầy đủ các trường có cấu trúc để tăng khả năng match
      targetFullAddress = [
        shipment.pickupAddress.address,
        shipment.pickupAddress.ward,
        shipment.pickupAddress.district,
        shipment.pickupAddress.province,
      ].filter(Boolean).join(', ');
    } else {
      targetFullAddress = shipment.deliveryAddress || '';
    }

    // Nếu không có thông tin gì, log cảnh báo
    if (!targetProvince && !targetFullAddress) {
      console.warn(`[SPX-Logistics] autoDispatch: Shipment ${shipmentId} has no address info for ${type}`);
    }

    const lowerProvince = targetProvince.toLowerCase();
    const lowerDistrict = targetDistrict.toLowerCase();
    const lowerFullAddr = targetFullAddress.toLowerCase();

    // Tìm Driver khả dụng: CHỈ CHỌN TÀI XẾ ĐANG ONLINE / AVAILABLE (ĐÃ ĐIỂM DANH VÀO CA)
    // Tuyệt đối không chọn tài xế OFFLINE hoặc chưa vào ca làm việc
    const allDrivers = await this.prisma.driver.findMany({
      where: { status: { in: ['AVAILABLE', 'ONLINE'] } },
      include: { hub: true },
    });

    // 4.1.1. Kiểm tra Hạn Mức COD của Tài Xế (COD Cap: Tối đa 10.000.000đ từ các đơn chưa đối soát)
    const activeDrivers = await Promise.all(
      allDrivers.map(async (d) => {
        const deliveredAssignments = await this.prisma.deliveryAssignment.findMany({
          where: { driverId: d.id, type: 'DELIVERY' },
          include: { shipment: { include: { codTransaction: true } } },
        });
        const heldCod = deliveredAssignments
          .filter((a) => a.shipment.status === 'DELIVERED' && a.shipment.codTransaction?.status === 'COLLECTED')
          .reduce((sum, a) => sum + (a.shipment.codAmount || 0), 0);

        return { ...d, heldCod, isBlocked: heldCod >= 10000000 };
      })
    );

    // === MATCHING STRATEGY ===
    // Priority 1: Khớp chính xác theo province (dữ liệu có cấu trúc từ SellerAddress)
    // Priority 2: Khớp theo district
    // Priority 3: Khớp theo chuỗi địa chỉ đầy đủ (fullAddress text search)
    // Priority 4: Khớp theo Hub cùng tỉnh/thành

    let matchedDriver: any = null;

    const eligible = activeDrivers.filter((d) => !d.isBlocked);
    if (eligible.length > 0) {
      // Priority 1: Khớp province có cấu trúc (chính xác nhất)
      if (lowerProvince) {
        matchedDriver = eligible.find((d) => {
          const driverProvince = (d.assignedProvince || '').toLowerCase();
          const hubProvince = (d.hub?.province || '').toLowerCase();
          return (driverProvince && lowerProvince.includes(driverProvince)) ||
                 (driverProvince && driverProvince.includes(lowerProvince)) ||
                 (hubProvince && lowerProvince.includes(hubProvince)) ||
                 (hubProvince && hubProvince.includes(lowerProvince));
        });
      }

      // Priority 2: Khớp district có cấu trúc
      if (!matchedDriver && lowerDistrict) {
        matchedDriver = eligible.find((d) => {
          const driverDistrict = (d.assignedDistrict || '').toLowerCase();
          return driverDistrict && (lowerDistrict.includes(driverDistrict) || driverDistrict.includes(lowerDistrict));
        });
      }

      // Priority 3: Text search trên fullAddress (bao gồm cả ward, district, province đã ghép)
      if (!matchedDriver && lowerFullAddr) {
        matchedDriver = eligible.find((d) => {
          if (d.assignedProvince && lowerFullAddr.includes(d.assignedProvince.toLowerCase())) return true;
          if (d.assignedDistrict && lowerFullAddr.includes(d.assignedDistrict.toLowerCase())) return true;
          if (d.hub?.province && lowerFullAddr.includes(d.hub.province.toLowerCase())) return true;
          if (d.operatingArea) {
            const areas = d.operatingArea.toLowerCase().split(',');
            if (areas.some((a) => lowerFullAddr.includes(a.trim()))) return true;
          }
          return false;
        });
      }

      // Priority 4: Khớp Hub cùng tỉnh/thành
      if (!matchedDriver && lowerProvince) {
        matchedDriver = eligible.find((d) => {
          const hubProvince = (d.hub?.province || '').toLowerCase();
          return hubProvince && hubProvince === lowerProvince;
        });
      }
    }

    // NẾU KHÔNG CÓ TÀI XẾ ONLINE PHÙ HỢP TRONG KHU VỰC:
    // Tuyệt đối KHÔNG gán cho tài xế OFFLINE! Đơn hàng được đưa vào Hàng Đợi Bưu Cục (WAITING_PICKUP)
    if (!matchedDriver) {
      console.log(`[SPX-Logistics] autoDispatch: Không có tài xế ONLINE trong khu vực (tỉnh="${targetProvince}"). Đơn hàng ${shipment.trackingNumber} đưa vào Hàng Đợi Bưu Cục.`);

      await this.prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: 'WAITING_PICKUP' },
      });

      const hubName = shipment.currentHub?.name || 'Bưu cục khu vực';
      await this.prisma.shipmentTracking.create({
        data: {
          shipmentId,
          status: 'WAITING_PICKUP',
          title: 'Đang trong Hàng Đợi Bưu Cục',
          description: `Đơn hàng đang chờ tại ${hubName}. Hiện chưa có tài xế trong ca làm việc tại khu vực này. Hệ thống sẽ tự động gán ngay khi tài xế điểm danh vào ca.`,
          location: hubName,
        },
      });

      return {
        success: true,
        queued: true,
        status: 'WAITING_PICKUP',
        message: `Đơn hàng đã được lưu vào Hàng Đợi Bưu Cục (${hubName}), chờ tài xế điểm danh vào ca.`,
      };
    }

    console.log(`[SPX-Logistics] autoDispatch: Matched driver ${matchedDriver.name} (${matchedDriver.id}) for ${type} shipment ${shipmentId} | Target: province="${targetProvince}", district="${targetDistrict}" | Driver: assignedProvince="${matchedDriver.assignedProvince}", hub="${matchedDriver.hub?.name}"`);

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

    const nextStatus = type === 'PICKUP' ? 'PICKUP_ASSIGNED' : 'DELIVERY_ASSIGNED';
    const title = type === 'PICKUP' ? 'Đã điều phối tài xế lấy hàng' : 'Đã phân công Shipper giao hàng';
    const desc = type === 'PICKUP'
      ? `Tài xế ${driver.name} (SĐT: ${driver.phone} - Xe: ${driver.vehicleNumber} - Tuyến: ${driver.operatingArea || 'Khu vực phụ trách'}) đang trên đường đến địa chỉ người bán để lấy kiện hàng.`
      : `Bưu cục ${driver.hub?.name || ''} đã phân tuyến cho Shipper ${driver.name} (SĐT: ${driver.phone} - Xe: ${driver.vehicleNumber} - Tuyến: ${driver.operatingArea || 'Khu vực phụ trách'}). Bưu kiện đang ở kệ phân tuyến tại bưu cục, chờ Shipper quét nhận lên xe.`;

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
    truckNumber?: string;
    truckDriver?: string;
    truckDriverPhone?: string;
    sealNumber?: string;
    targetHubId?: string;
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
        title = 'Đang vận chuyển liên tỉnh (Xe tải trung chuyển)';
        if (dto.truckNumber) {
          const sealPart = dto.sealNumber ? ` • Niêm phong Seal: [${dto.sealNumber}]` : '';
          const driverPart = dto.truckDriver ? ` • Bác tài: ${dto.truckDriver}${dto.truckDriverPhone ? ` (${dto.truckDriverPhone})` : ''}` : '';
          desc = `Bưu kiện đã được xếp lên Xe tải Linehaul [${dto.truckNumber}]${driverPart}${sealPart}. Xe đang vận chuyển trên tuyến liên tỉnh đến bưu cục phát.`;
          location = `Xe tải ${dto.truckNumber}`;
        } else {
          desc = dto.note || `Bưu kiện đã rời kho xuất phát và đang trên xe tải trung chuyển đến Bưu cục phát hàng địa phương.`;
          location = 'Xe trung chuyển SPX';
        }
        break;
      case 'AT_DESTINATION_HUB':
        title = 'Đã đến bưu cục phát hàng địa phương';
        desc = `Bưu kiện đã đến bưu cục khu vực người nhận và sẵn sàng phân chia tuyến phát cho shipper.`;
        break;
      case 'DELIVERY_ASSIGNED':
        title = 'Đã phân công Shipper giao hàng';
        desc = `Bưu kiện đã được phân tuyến cho Shipper phụ trách tại bưu cục. Bưu kiện đang chờ Shipper quét nhận lên xe để xuất kho đi phát.`;
        break;
      case 'OUT_FOR_DELIVERY':
        title = 'Shipper đã quét xuất kho & đang giao đến bạn';
        desc = `Shipper đã nhận bưu kiện rời bưu cục và đang di chuyển đến địa chỉ của bạn. Vui lòng chú ý điện thoại.`;
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
              proofImage: dto.proofImage || null,
            },
          },
        },
        include: {
          trackingLogs: { orderBy: { timestamp: 'desc' } },
          codTransaction: true,
          package: true,
        },
      });

      // Nếu là Lấy Hàng Thành Công (PICKED_UP) -> Hoàn thành DeliveryAssignment và lưu proofImage
      if (dto.status === 'PICKED_UP') {
        const pickupAssignment = await tx.deliveryAssignment.findFirst({
          where: { shipmentId, type: 'PICKUP', status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } },
        });
        if (pickupAssignment) {
          await tx.deliveryAssignment.update({
            where: { id: pickupAssignment.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              proofImage: dto.proofImage || null,
            },
          });
        }
      }

      // 2. Nếu quét tại Hub -> ghi HubScan
      if (['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(dto.status) && (dto.hubId || shipment.currentHubId)) {
        await tx.hubScan.create({
          data: {
            shipmentId,
            hubId: (dto.hubId || shipment.currentHubId)!,
            scanType: dto.status,
            note: dto.note || (dto.truckNumber ? `Xuất xe Linehaul: [${dto.truckNumber}] • Bác tài: ${dto.truckDriver || 'N/A'} • Seal: ${dto.sealNumber || 'N/A'}` : undefined),
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

  // Helper tính khoảng cách Haversine (mét) giữa 2 tọa độ GPS
  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Bán kính Trái Đất (mét)
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  // 7.2. Tự động quét hàng đợi gom đơn của Hub khi Tài Xế Điểm Danh vào ca
  async dispatchPendingHubQueue(driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { hub: true },
    });
    if (!driver || driver.status === 'OFFLINE') return [];

    // Tìm các đơn hàng WAITING_PICKUP hoặc CREATED chưa có tài xế phân công trong cùng bưu cục hoặc cùng tỉnh
    const pendingShipments = await this.prisma.shipment.findMany({
      where: {
        status: { in: ['WAITING_PICKUP', 'CREATED'] },
        assignments: { none: { status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } } },
        OR: [
          { currentHubId: driver.hubId },
          driver.assignedProvince ? {
            pickupAddress: {
              province: { contains: driver.assignedProvince, mode: 'insensitive' },
            },
          } : {},
        ],
      },
      include: { pickupAddress: true, currentHub: true },
      take: 15, // Gán tối đa 15 đơn cùng đợt gom
    });

    console.log(`[SPX-Logistics] dispatchPendingHubQueue: Tìm thấy ${pendingShipments.length} đơn đang chờ cho tài xế ${driver.name}`);

    const dispatched: any[] = [];
    for (const s of pendingShipments) {
      try {
        const assignment = await this.assignDriver(s.id, driver.id, 'PICKUP');
        dispatched.push(assignment);
      } catch (err) {
        console.error(`[SPX-Logistics] Không thể gán đơn ${s.trackingNumber} cho tài xế ${driver.name}:`, err);
      }
    }

    return dispatched;
  }

  // 7.3. Điểm danh ca làm việc (Check-in ca sáng / vào ca)
  async checkInDriverShift(driverId: string, dto: { faceImage?: string; lat?: number; lng?: number; note?: string }) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { hub: true },
    });

    if (!driver) throw new NotFoundException('Không tìm thấy tài xế');

    // Bắt buộc ảnh khuôn mặt chụp trực tiếp từ Camera (không chấp nhận ảnh tải lên từ thư viện)
    if (!dto.faceImage || typeof dto.faceImage !== 'string' || !dto.faceImage.startsWith('data:image')) {
      throw new BadRequestException('Quy định SPX: Bắt buộc chụp ảnh nhận diện khuôn mặt trực tiếp từ Camera tại Bưu cục. Không được phép tải ảnh từ thư viện hoặc để trống.');
    }

    let distanceToHub: number | null = null;
    let isWithinHub = true;

    if (driver.hub?.latitude && driver.hub?.longitude && dto.lat && dto.lng) {
      distanceToHub = this.calculateDistanceMeters(
        dto.lat,
        dto.lng,
        driver.hub.latitude,
        driver.hub.longitude
      );
      // Bán kính hợp lệ tại Bưu cục: trong vòng 1000m (hoặc chấp nhận nếu GPS mô phỏng)
      if (distanceToHub > 1000) {
        isWithinHub = false;
      }
    }

    // Tạo bản ghi điểm danh
    const attendance = await this.prisma.driverAttendance.create({
      data: {
        driverId,
        hubId: driver.hubId,
        faceImage: dto.faceImage || null,
        latitude: dto.lat || driver.hub?.latitude || null,
        longitude: dto.lng || driver.hub?.longitude || null,
        distanceToHub: distanceToHub,
        status: 'CHECKED_IN',
        note: dto.note || (isWithinHub ? 'Điểm danh tại Bưu cục thành công' : `Điểm danh ngoài phạm vi Hub (${distanceToHub}m)`),
      },
    });

    // Cập nhật trạng thái tài xế sang AVAILABLE (ONLINE)
    await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'AVAILABLE',
        currentLat: dto.lat || driver.hub?.latitude || null,
        currentLng: dto.lng || driver.hub?.longitude || null,
      },
    });

    console.log(`[SPX-Logistics] Tài xế ${driver.name} đã điểm danh vào ca làm việc tại Hub: ${driver.hub?.name}`);

    // Tự động quét và điều phối các đơn trong hàng đợi của Hub cho tài xế vừa vào ca
    const assignedQueue = await this.dispatchPendingHubQueue(driverId);

    return {
      success: true,
      attendance,
      driver: {
        id: driver.id,
        name: driver.name,
        status: 'AVAILABLE',
        hub: driver.hub,
      },
      assignedOrdersCount: assignedQueue.length,
      message: `Điểm danh ca làm việc thành công. Đã tự động phân công ${assignedQueue.length} đơn hàng đang chờ trong khu vực.`,
    };
  }

  // 7.4. Kết thúc ca làm việc (Check-out ca)
  async checkOutDriverShift(driverId: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Không tìm thấy tài xế');

    // Cập nhật bản ghi điểm danh gần nhất
    const latestAttendance = await this.prisma.driverAttendance.findFirst({
      where: { driverId, status: 'CHECKED_IN' },
      orderBy: { checkInAt: 'desc' },
    });

    if (latestAttendance) {
      await this.prisma.driverAttendance.update({
        where: { id: latestAttendance.id },
        data: {
          checkOutAt: new Date(),
          status: 'CHECKED_OUT',
        },
      });
    }

    // Chuyển trạng thái tài xế sang OFFLINE
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: 'OFFLINE' },
    });

    console.log(`[SPX-Logistics] Tài xế ${driver.name} đã kết thúc ca làm việc (OFFLINE).`);

    return {
      success: true,
      status: 'OFFLINE',
      message: 'Đã kết thúc ca làm việc. Chúc bạn một ngày tốt lành!',
    };
  }

  // 7.5. Lấy trạng thái điểm danh hôm nay của tài xế
  async getDriverAttendanceToday(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.driverAttendance.findFirst({
      where: {
        driverId,
        checkInAt: { gte: today },
      },
      orderBy: { checkInAt: 'desc' },
    });

    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { hub: true },
    });

    return {
      isCheckedIn: attendance?.status === 'CHECKED_IN' && driver?.status !== 'OFFLINE',
      attendance,
      driver,
    };
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

  // ─── 10. QUẢN LÝ TRẢ HÀNG & HOÀN TIỀN (SHOPEE-STANDARD RETURNS & REFUNDS) ───

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
        shipment: true,
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
      action: 'APPROVE' | 'REJECT' | 'NEGOTIATE';
      note?: string;
      proposedAmount?: number;
      evidenceUrl?: string;
    }
  ) {
    const ret = await this.getReturnById(id);

    if (ret.status !== 'REQUESTED' && ret.status !== 'SELLER_REVIEWING') {
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

    if (dto.action === 'APPROVE') {
      if (ret.resolution === 'REFUND_ONLY') {
        await this.prisma.return.update({
          where: { id: ret.id },
          data: {
            status: 'COMPLETED',
            sellerNote: dto.note,
            completedAt: new Date(),
          },
        });

        await this.executePaymentRefund(ret.orderId, ret.buyerId, ret.sellerId, ret.refundAmount, ret.reason);
        await this.syncOrderStatus(ret.orderId, 'REFUNDED');

        return {
          success: true,
          status: 'COMPLETED',
          message: 'Đã chấp nhận hoàn tiền ngay cho người mua mà không cần trả hàng.',
        };
      } else {
        const buyerShipDeadline = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
        const updated = await this.prisma.return.update({
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
      const updated = await this.prisma.return.update({
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

    const updated = await this.prisma.return.update({
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

  async getSellerAddress(sellerId: string) {
    return this.prisma.sellerAddress.findFirst({
      where: { sellerId },
    });
  }
}
