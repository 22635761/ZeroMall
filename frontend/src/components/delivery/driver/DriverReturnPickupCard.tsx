import React from 'react';
import type { ReturnData } from '../../../services/return.service';

interface DriverReturnPickupCardProps {
  returnData: ReturnData;
  onConfirmPickup: (ret: ReturnData) => void;
  actionLoading?: boolean;
}

export const DriverReturnPickupCard: React.FC<DriverReturnPickupCardProps> = ({
  returnData,
  onConfirmPickup,
  actionLoading = false,
}) => {
  const buyerName = returnData.shipment?.buyerName || 'Người Mua';
  const buyerPhone = returnData.shipment?.buyerPhone || '';
  const buyerAddress = returnData.shipment?.deliveryAddress || 'Địa chỉ khách hàng';
  const shopName = returnData.shipment?.pickupAddress?.name || 'Kho Người Bán';
  const trackingNumber = returnData.returnTrackingNumber || returnData.returnNumber;

  return (
    <div className="bg-white border-2 border-orange-300/80 rounded-2xl p-4 space-y-3 shadow-xs hover:border-orange-400 transition-colors text-left">
      {/* Header: Mã vận đơn thu hồi & Trạng thái */}
      <div className="flex justify-between items-center text-xs pb-2 border-b border-orange-100">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-500 text-[10px] font-bold">Mã Thu Hồi:</span>
          <span className="font-mono font-black text-orange-700 text-xs">
            {trackingNumber}
          </span>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-orange-100 text-orange-800 border border-orange-200">
          🔄 Thu Hồi Từ Khách
        </span>
      </div>

      {/* Thông tin Khách hàng cần đến lấy */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-1.5">
          <span className="text-sm">👤</span>
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">
              {buyerName} {buyerPhone && `• ${buyerPhone}`}
            </p>
            <p className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
              <span>💵 Tiền thu khách: <strong className="text-emerald-700 font-bold">0đ</strong></span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-medium border border-emerald-200">Đổi trả miễn phí</span>
            </p>
            <p className="text-slate-400 text-[10px] mt-0.5">• Không thu tiền mặt của người mua</p>
          </div>
        </div>

        {/* Địa chỉ đến thu hồi */}
        <div className="flex items-start gap-1.5 text-slate-700">
          <span className="text-sm shrink-0">📍</span>
          <p className="text-xs leading-relaxed text-slate-700 font-medium">
            {buyerAddress}
          </p>
        </div>

        {/* Thông tin sản phẩm hoàn trả */}
        <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100 text-[11px] space-y-1">
          <p className="font-bold text-orange-950 flex items-center justify-between">
            <span>Sản phẩm trả ({returnData.items.length} món):</span>
            <span className="text-slate-500 font-normal">Gửi về: {shopName}</span>
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {returnData.items.map((it) => (
              <div key={it.id} className="flex justify-between items-center text-slate-700">
                <span className="truncate max-w-[200px] font-medium">{it.productName}</span>
                <span className="shrink-0 font-bold">x{it.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hành động: Gọi khách, Dẫn đường, Xác nhận lấy hàng */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        {buyerPhone ? (
          <a
            href={`tel:${buyerPhone}`}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer"
          >
            📞 Gọi Khách
          </a>
        ) : (
          <button disabled className="py-2.5 bg-slate-50 text-slate-400 font-bold rounded-xl text-xs">
            Không có SĐT
          </button>
        )}

        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(buyerAddress)}`}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer border border-sky-200/50"
        >
          🗺️ Dẫn Đường
        </a>

        <button
          type="button"
          onClick={() => onConfirmPickup(returnData)}
          disabled={actionLoading}
          className="col-span-2 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
        >
          <span>📷 Xác Nhận Đã Lấy Hàng Hoàn Từ Khách</span>
        </button>
      </div>
    </div>
  );
};
