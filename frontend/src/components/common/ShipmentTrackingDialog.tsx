import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LiveMapTracking } from '../delivery/LiveMapTracking'
import { Truck, ExternalLink, Package, Loader2 } from 'lucide-react'

export interface ShipmentTrackingDialogProps {
  isOpen: boolean
  onClose: () => void
  trackingData: any
  trackingLoading: boolean
  orderId?: string
  title?: string
  showPortalLink?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Đã tạo vận đơn (Chờ lấy)',
  WAITING_PICKUP: 'Chờ Shipper đến lấy',
  PICKUP_ASSIGNED: 'Shipper đang đến lấy',
  PICKED_UP: 'Shipper đã lấy hàng',
  AT_ORIGIN_HUB: 'Tại Bưu cục gửi',
  SORTING: 'Đang phân loại tại Kho SOC',
  IN_TRANSIT: 'Xe tải đang trung chuyển',
  AT_DESTINATION_HUB: 'Đã đến Bưu cục phát',
  OUT_FOR_DELIVERY: 'Shipper đang giao tận nhà',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao không thành công',
}

export const ShipmentTrackingDialog: React.FC<ShipmentTrackingDialogProps> = ({
  isOpen,
  onClose,
  trackingData,
  trackingLoading,
  orderId,
  title = 'Hành Trình Vận Chuyển ZeroExpress (ZMX)',
  showPortalLink = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-5 sm:p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3 shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {trackingData
                  ? `Mã vận đơn: ${trackingData.trackingNumber}`
                  : orderId
                  ? `Đơn hàng #${orderId}`
                  : 'Đang tra cứu dữ liệu trạm vận chuyển ZMX...'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {trackingLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground font-bold">
                Đang tra cứu dữ liệu trạm vận chuyển ZMX...
              </p>
            </div>
          ) : !trackingData ? (
            <div className="py-8 text-center space-y-2">
              <Package className="size-10 text-muted-foreground mx-auto stroke-1" />
              <p className="text-xs text-foreground font-bold">Đang chuẩn bị điều phối kiện hàng</p>
              <p className="text-[11px] text-muted-foreground">
                Đơn vị vận chuyển ZMX đang điều phối tài xế khu vực đến kho lấy hàng.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 🗺️ Interactive Live Goong/OSM Map */}
              <LiveMapTracking
                trackingData={trackingData}
                goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
              />

              {/* Status Stepper Box */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/15 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground">Trạng thái hiện tại:</span>
                  <Badge variant="success" className="text-[11px]">
                    {STATUS_LABELS[trackingData.status] || trackingData.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p>
                    • <b className="text-foreground">Đơn vị vận chuyển:</b> ZeroMall Express (ZMX Logistics)
                  </p>
                  {trackingData.assignments && trackingData.assignments[0] && (
                    <p>
                      • <b className="text-foreground">Tài xế phụ trách:</b> {trackingData.assignments[0].driver?.name} (SĐT: {trackingData.assignments[0].driver?.phone} - Biển số: {trackingData.assignments[0].driver?.vehicleNumber})
                    </p>
                  )}
                  {trackingData.currentHub && (
                    <p>
                      • <b className="text-foreground">Kho/Bưu cục hiện tại:</b> {trackingData.currentHub.name} ({trackingData.currentHub.province})
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline Milestones */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                  Lịch Sử Vận Chuyển
                </p>
                {trackingData.trackingLogs &&
                  trackingData.trackingLogs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="flex gap-3 relative text-xs">
                      {idx !== trackingData.trackingLogs.length - 1 && (
                        <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-border" />
                      )}
                      <div
                        className={`size-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold z-10 ${
                          idx === 0
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {idx === 0 ? '●' : '○'}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span
                            className={`font-bold ${
                              idx === 0 ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {log.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed font-normal">
                          {log.description}
                        </p>
                        {log.location && (
                          <p className="text-[10px] text-muted-foreground font-medium">
                            📍 {log.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t shrink-0 flex items-center justify-between">
          {showPortalLink ? (
            <a
              href="http://delivery.zeromall.local:3000"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="size-3.5" />
              <span>Mở cổng ZMX Delivery Portal ↗</span>
            </a>
          ) : (
            <div />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
