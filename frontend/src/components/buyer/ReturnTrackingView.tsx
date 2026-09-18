import React, { useState } from 'react';
import { returnService, type ReturnData } from '../../services/return.service';

interface ReturnTrackingViewProps {
  returnData: ReturnData;
  onRefresh: () => void;
  isSellerView?: boolean;
}

export const ReturnTrackingView: React.FC<ReturnTrackingViewProps> = ({
  returnData,
  onRefresh,
  isSellerView = false,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipMethod, setShipMethod] = useState<'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE'>('ZMX_PICKUP');
  const [externalTracking, setExternalTracking] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
      case 'SELLER_REVIEWING':
        return { label: 'Chờ Người Bán Phản Hồi', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'RETURN_SHIPPING':
      case 'APPROVED':
        return { label: 'Đã Duyệt • Chờ Người Mua Gửi Hàng', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'RETURN_IN_TRANSIT':
        return { label: 'Hàng Hoàn Đang Vận Chuyển', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'DELIVERED_TO_SELLER':
        return { label: 'Đã Đến Kho Shop • Chờ Kiểm Hàng', color: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'SELLER_DISPUTED':
      case 'CS_ARBITRATING':
        return { label: 'CS Đang Phân Xử Tranh Chấp', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'COMPLETED':
        return { label: 'Hoàn Tiền Thành Công', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'CANCELLED':
        return { label: 'Đã Hủy Yêu Cầu', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'REJECTED':
        return { label: 'Yêu Cầu Bị Bác Bỏ', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const badge = getStatusBadge(returnData.status);

  // Tính thời gian còn lại (SLA deadline)
  const calculateDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return 'Đã hết hạn';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Còn ${days} ngày ${hours % 24} giờ`;
    }
    return `Còn ${hours} giờ ${mins} phút`;
  };

  const handleNegotiationRespond = async (accept: boolean) => {
    if (!window.confirm(accept ? 'Bạn có đồng ý nhận số tiền thỏa thuận này không?' : 'Bạn muốn từ chối và để CS Sàn phân xử?')) return;
    setActionLoading(true);
    try {
      await returnService.buyerRespondNegotiation(returnData.id, { accept });
      alert(accept ? 'Đã đồng ý và hoàn tiền thành công!' : 'Đã gửi yêu cầu tới CS Sàn phân xử.');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Lỗi thao tác');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipSubmit = async () => {
    setActionLoading(true);
    try {
      await returnService.buyerShipReturn(returnData.id, {
        returnMethod: shipMethod,
        externalTrackingNumber: externalTracking.trim() || undefined,
      });
      alert('Đã cập nhật gửi hàng hoàn thành công!');
      setShowShipModal(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Lỗi gửi hàng hoàn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReturn = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu trả hàng/hoàn tiền này không?')) return;
    setActionLoading(true);
    try {
      await returnService.cancelReturn(returnData.id, 'Người mua tự nguyện hủy yêu cầu');
      alert('Đã hủy yêu cầu trả hàng thành công.');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Lỗi hủy');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingNegotiation = returnData.negotiations?.find((n) => n.status === 'PENDING');

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-md p-5 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔄</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">Yêu Cầu Hoàn Hàng #{returnData.returnNumber}</span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tạo lúc: {new Date(returnData.createdAt).toLocaleString('vi-VN')} • Phương án:{' '}
              {returnData.resolution === 'REFUND_ONLY' ? 'Chỉ hoàn tiền' : 'Trả hàng & hoàn tiền'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-500 block">Số tiền yêu cầu hoàn:</span>
          <span className="font-black text-orange-600 text-base">
            {returnData.refundAmount.toLocaleString('vi-VN')}đ
          </span>
        </div>
      </div>

      {/* SLA Countdown Timer */}
      {returnData.status === 'REQUESTED' && returnData.sellerDeadline && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span>Hạn chót Người bán phản hồi (48h):</span>
          </div>
          <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700">
            {calculateDeadline(returnData.sellerDeadline)}
          </span>
        </div>
      )}

      {returnData.status === 'RETURN_SHIPPING' && returnData.buyerShipDeadline && (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <span>Hạn chót bạn gửi hàng hoàn (6 ngày):</span>
          </div>
          <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-300 text-blue-700">
            {calculateDeadline(returnData.buyerShipDeadline)}
          </span>
        </div>
      )}

      {returnData.status === 'DELIVERED_TO_SELLER' && returnData.sellerInspectDeadline && (
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <span>Hạn chót Người bán kiểm tra hàng (48h tự động hoàn tiền):</span>
          </div>
          <span className="font-bold bg-white px-2.5 py-1 rounded-lg border border-purple-300 text-purple-700">
            {calculateDeadline(returnData.sellerInspectDeadline)}
          </span>
        </div>
      )}

      {/* Thông tin vận đơn hoàn trả (nếu có) */}
      {returnData.returnTrackingNumber && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Mã vận đơn hoàn trả (SPX):</span>
            <span className="font-bold text-slate-800 text-sm tracking-wider">{returnData.returnTrackingNumber}</span>
          </div>
          <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded-lg">
            {returnData.returnMethod === 'ZMX_PICKUP' ? 'Shipper lấy tận nơi' : 'Gửi tại Bưu cục'}
          </span>
        </div>
      )}

      {/* Đề xuất thỏa thuận từ Người bán (Negotiation) */}
      {pendingNegotiation && !isSellerView && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-300 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
              <span>💬</span> Người bán đề xuất thương lượng hoàn một phần:
            </span>
            <span className="text-sm font-black text-orange-600">
              {pendingNegotiation.proposedAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {pendingNegotiation.message && (
            <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-lg border border-amber-200">
              "{pendingNegotiation.message}"
            </p>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleNegotiationRespond(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 transition-colors"
            >
              Từ Chối
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleNegotiationRespond(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-sm transition-colors"
            >
              Đồng Ý Nhận Tiền
            </button>
          </div>
        </div>
      )}

      {/* Danh sách sản phẩm trả */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-700 block">Sản phẩm yêu cầu hoàn:</span>
        <div className="space-y-2">
          {returnData.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
              {item.productImage && (
                <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                <p className="text-[11px] text-slate-500">
                  Số lượng: x{item.quantity} {item.variant ? `• Phân loại: ${item.variant}` : ''}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {(item.price * item.quantity).toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Minh chứng ảnh */}
      {returnData.evidences.length > 0 && (
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-1.5">Hình ảnh / Bằng chứng ({returnData.evidences.length}):</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {returnData.evidences.map((ev) => (
              <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative group flex-shrink-0">
                <img src={ev.fileUrl} alt="Minh chứng" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-sm group-hover:opacity-90" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center rounded-b-lg py-0.5">
                  {ev.uploadedBy === 'SELLER' ? 'Shop' : 'Khách'}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Buyer Action Buttons */}
      {!isSellerView && returnData.status === 'RETURN_SHIPPING' && (
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancelReturn}
            disabled={actionLoading}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Hủy yêu cầu
          </button>
          <button
            type="button"
            onClick={() => setShowShipModal(true)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all"
          >
            🛵 Tôi Đã Gửi Hàng / Nhập Mã Vận Đơn
          </button>
        </div>
      )}

      {/* Modal gửi hàng hoàn */}
      {showShipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>📦</span> Xác Nhận Gửi Hàng Hoàn
            </h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phương thức gửi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShipMethod('ZMX_PICKUP')}
                    className={`p-2.5 rounded-xl border text-left ${shipMethod === 'ZMX_PICKUP' ? 'border-orange-500 bg-orange-50 font-bold text-orange-700' : 'border-slate-200'}`}
                  >
                    🛵 SPX lấy tận nơi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipMethod('ZMX_DROPOFF')}
                    className={`p-2.5 rounded-xl border text-left ${shipMethod === 'ZMX_DROPOFF' ? 'border-orange-500 bg-orange-50 font-bold text-orange-700' : 'border-slate-200'}`}
                  >
                    🏢 Gửi bưu cục SPX
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã vận đơn (Nếu gửi đơn vị ngoài):</label>
                <input
                  type="text"
                  placeholder="Để trống nếu để SPX tự sinh mã ZMX..."
                  value={externalTracking}
                  onChange={(e) => setExternalTracking(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowShipModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleShipSubmit}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-600/20"
              >
                {actionLoading ? 'Đang lưu...' : 'Xác Nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
