import React, { useState, useEffect } from 'react';
import { returnService, type ReturnData } from '../../services/return.service';
import { ReturnStockDecisionModal } from './ReturnStockDecisionModal';
import { ReturnTrackingView } from '../buyer/ReturnTrackingView';

interface ShopReturnsTabProps {
  currentShop: any;
}

export const ShopReturnsTab: React.FC<ShopReturnsTabProps> = ({ currentShop }) => {
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedForStockModal, setSelectedForStockModal] = useState<ReturnData | null>(null);
  const [selectedForNegotiate, setSelectedForNegotiate] = useState<ReturnData | null>(null);
  const [negotiateAmount, setNegotiateAmount] = useState<number>(0);
  const [negotiateNote, setNegotiateNote] = useState('');
  const [selectedForReject, setSelectedForReject] = useState<ReturnData | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedForTrackingModal, setSelectedForTrackingModal] = useState<ReturnData | null>(null);

  const fetchReturns = async () => {
    if (!currentShop?.id) return;
    setLoading(true);
    try {
      const data = await returnService.getReturns({
        sellerId: currentShop.id,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        search: search.trim() || undefined,
      });
      setReturns(data);
    } catch (e) {
      console.error('Error fetching seller returns:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [currentShop?.id, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReturns();
  };

  // Seller duyệt yêu cầu
  const handleQuickApprove = async (ret: ReturnData) => {
    const isRefundOnly = ret.resolution === 'REFUND_ONLY';
    const confirmMsg = isRefundOnly
      ? `Xác nhận HOÀN TIỀN NGAY ${ret.refundAmount.toLocaleString('vi-VN')}đ cho khách mà không cần trả hàng?`
      : `Đồng ý nhận hàng hoàn cho đơn #${ret.orderId}? Khách sẽ có 6 ngày để gửi bưu kiện hoàn trả.`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await returnService.sellerRespond(ret.id, { action: 'APPROVE' });
      alert(res.message);
      fetchReturns();
    } catch (e: any) {
      alert(e.message || 'Lỗi thao tác');
    } finally {
      setActionLoading(false);
    }
  };

  // Seller gửi đề xuất đàm phán một phần
  const handleNegotiateSubmit = async () => {
    if (!selectedForNegotiate) return;
    if (negotiateAmount <= 0 || negotiateAmount > selectedForNegotiate.refundAmount) {
      alert(`Số tiền đề xuất phải lớn hơn 0 và tối đa ${selectedForNegotiate.refundAmount.toLocaleString('vi-VN')}đ!`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await returnService.sellerRespond(selectedForNegotiate.id, {
        action: 'NEGOTIATE',
        proposedAmount: negotiateAmount,
        note: negotiateNote.trim() || undefined,
      });
      alert(res.message);
      setSelectedForNegotiate(null);
      fetchReturns();
    } catch (e: any) {
      alert(e.message || 'Lỗi gửi đề xuất');
    } finally {
      setActionLoading(false);
    }
  };

  // Seller từ chối yêu cầu
  const handleRejectSubmit = async () => {
    if (!selectedForReject) return;
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối!');
      return;
    }

    setActionLoading(true);
    try {
      const res = await returnService.sellerRespond(selectedForReject.id, {
        action: 'REJECT',
        note: rejectReason.trim(),
      });
      alert(res.message);
      setSelectedForReject(null);
      fetchReturns();
    } catch (e: any) {
      alert(e.message || 'Lỗi thao tác');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDeadline = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff <= 0) return 'Đã hết hạn';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} ngày ${hours % 24}h`;
    }
    return `${hours}h ${mins}m`;
  };

  // Seller hoàn tiền ngay cho người mua (không cần chờ hàng về)
  const handleImmediateRefund = async (ret: ReturnData) => {
    const itemsTotal = (ret.items || []).reduce((sum, it) => sum + ((it.price || 0) * it.quantity), 0);
    const shopDeduct = itemsTotal > 0 ? Math.min(ret.refundAmount, itemsTotal) : ret.refundAmount;
    const shippingPart = Math.max(0, ret.refundAmount - itemsTotal);

    const confirmMsg = `⚡ Xác nhận HOÀN TIỀN NGAY cho người mua mà KHÔNG cần nhận lại hàng?\n\n- Khách hàng nhận được: ${ret.refundAmount.toLocaleString('vi-VN')}đ${shippingPart > 0 ? ` (gồm ${shopDeduct.toLocaleString('vi-VN')}đ tiền hàng + ${shippingPart.toLocaleString('vi-VN')}đ phí ship do Sàn hoàn)` : ''}\n- Số tiền khấu trừ từ Shop: ${shopDeduct.toLocaleString('vi-VN')}đ (Shop KHÔNG bị trừ phí ship)\n- Khiếu nại đổi trả sẽ kết thúc ngay lập tức.`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await returnService.sellerRespond(ret.id, {
        action: 'REFUND_IMMEDIATELY',
        note: 'Shop chọn hoàn tiền ngay cho người mua mà không cần thu hồi lại sản phẩm',
      });
      alert(res.message || 'Đã hoàn tiền ngay cho người mua thành công!');
      fetchReturns();
    } catch (e: any) {
      alert(e.message || 'Lỗi xử lý hoàn tiền ngay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChatWithBuyer = (buyerId: string) => {
    window.location.href = `/seller?menu=customers&sub=chat-mgmt&buyerId=${buyerId}`;
  };

  const handleOpenOriginalOrder = (orderId: string) => {
    window.location.href = `/seller?menu=orders&sub=all-orders&search=${orderId}`;
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'Chờ Shop Duyệt', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'SELLER_REVIEWING':
        return { label: 'Đang Đàm Phán', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'RETURN_SHIPPING':
        return { label: 'Chờ Khách Gửi Hàng', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'RETURN_IN_TRANSIT':
        return { label: 'Đang Vận Chuyển Về', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'DELIVERED_TO_SELLER':
        return { label: 'Đã Đến Kho • Cần Kiểm Hàng', color: 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse' };
      case 'SELLER_DISPUTED':
      case 'CS_ARBITRATING':
        return { label: 'Tranh Chấp • CS Phân Xử', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'COMPLETED':
        return { label: 'Đã Hoàn Tất', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'REJECTED':
        return { label: 'Shop Đã Từ Chối', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'CANCELLED':
        return { label: 'Đã Hủy', color: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất Cả' },
    { key: 'REQUESTED', label: 'Chờ Xử Lý' },
    { key: 'RETURN_SHIPPING', label: 'Chờ Gửi Hàng' },
    { key: 'RETURN_IN_TRANSIT', label: 'Đang Về Kho' },
    { key: 'DELIVERED_TO_SELLER', label: 'Cần Kiểm Tra' },
    { key: 'CS_ARBITRATING', label: 'Tranh Chấp CS' },
    { key: 'COMPLETED', label: 'Đã Hoàn Tiền' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center text-2xl border border-orange-100">
            🔄
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">Quản Lý Trả Hàng / Hoàn Tiền</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xử lý khiếu nại, đồng kiểm bưu kiện hoàn trả và quyết định tồn kho theo chuẩn Shopee Seller Center.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Tìm theo mã RTN, mã đơn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3.5 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterStatus(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === t.key
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-200">
          Đang tải danh sách trả hàng...
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <span className="text-4xl">📦</span>
          <p className="font-bold text-slate-700 text-sm">Không có yêu cầu trả hàng nào trong mục này</p>
          <p className="text-xs text-slate-400">Tất cả các đơn hàng của bạn đang được vận chuyển và hoàn tất suôn sẻ.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => {
            const badge = getStatusBadge(ret.status);
            return (
              <div
                key={ret.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-orange-300 transition-colors text-left"
              >
                {/* Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800 text-sm">#{ret.returnNumber}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Đơn hàng: <strong className="text-slate-700 font-mono">#{ret.orderId}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {ret.sellerDeadline && ret.status === 'REQUESTED' && (
                      <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                        ⏳ Còn {calculateDeadline(ret.sellerDeadline)} để phản hồi
                      </span>
                    )}
                    {ret.buyerShipDeadline && ret.status === 'RETURN_SHIPPING' && (
                      <div className="flex flex-col items-end">
                        <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs">
                          <span className="text-blue-600">⏳</span> Chờ khách gửi hàng: Còn {calculateDeadline(ret.buyerShipDeadline) || '6 ngày'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Quá hạn tự hủy khiếu nại & trả tiền cho Shop</span>
                      </div>
                    )}
                    {ret.status === 'RETURN_IN_TRANSIT' && (
                      <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                        🚚 Bưu kiện đang trên đường về kho
                      </span>
                    )}
                    {ret.sellerInspectDeadline && ret.status === 'DELIVERED_TO_SELLER' && (
                      <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg font-bold">
                        🔍 Còn {calculateDeadline(ret.sellerInspectDeadline)} kiểm hàng
                      </span>
                    )}
                    {(() => {
                      const itemsTotal = (ret.items || []).reduce(
                        (sum, it) => sum + ((it.price || 0) * it.quantity),
                        0
                      );
                      const shippingRefund = Math.max(0, ret.refundAmount - itemsTotal);
                      const shopDeductAmount = itemsTotal > 0 ? Math.min(ret.refundAmount, itemsTotal) : ret.refundAmount;

                      return (
                        <div className="text-right pl-3 border-l border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            Khấu Trừ Shop:
                          </span>
                          <span className="font-black text-rose-600 text-base block leading-tight">
                            {shopDeductAmount.toLocaleString('vi-VN')}đ
                          </span>
                          {shippingRefund > 0 ? (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Khách nhận: <strong className="text-slate-700">{ret.refundAmount.toLocaleString('vi-VN')}đ</strong>{' '}
                              <span className="text-emerald-600 font-medium">(+{shippingRefund.toLocaleString('vi-VN')}đ ship Sàn hoàn)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Khách nhận hoàn: {ret.refundAmount.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Banner Thông Báo Nghiệp Vụ Theo Trạng Thái */}
                {ret.status === 'RETURN_SHIPPING' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-blue-900 shadow-2xs">
                    <span className="text-xl shrink-0 mt-0.5">📦</span>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-bold">Đã chấp thuận yêu cầu • Đang chờ người mua đóng gói & gửi bưu kiện hoàn</p>
                      <p className="text-[11px] text-blue-700">
                        Người mua có tối đa <strong>6 ngày</strong> để bàn giao kiện hàng cho Shipper ZMX. Nếu quá hạn, khiếu nại sẽ tự động bị hủy và tiền thanh toán sẽ được giải phóng cho Shop.
                        Nếu sản phẩm giá trị nhỏ hoặc bạn muốn tặng luôn hàng cho khách, bạn có thể bấm <strong>"⚡ Hoàn Tiền Ngay"</strong> ở bên dưới.
                      </p>
                    </div>
                  </div>
                )}

                {ret.status === 'RETURN_IN_TRANSIT' && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50/60 border border-purple-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-purple-900 shadow-2xs">
                    <span className="text-xl shrink-0 mt-0.5">🚚</span>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-bold">Bưu kiện hoàn đang trên đường vận chuyển về kho của bạn</p>
                      <p className="text-[11px] text-purple-700">
                        Shipper ZMX đã tiếp nhận bưu kiện từ người mua và đang trung chuyển về kho của Shop. Khi hàng đến nơi, bạn sẽ có 48 giờ để đồng kiểm hàng trước khi quyết định xử lý kho.
                      </p>
                    </div>
                  </div>
                )}

                {/* Body Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Cột 1: Thông tin yêu cầu */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Thông tin yêu cầu:</p>
                    <p className="text-slate-600">
                      <strong>Phương án:</strong>{' '}
                      <span className="font-medium text-slate-800">
                        {ret.resolution === 'REFUND_ONLY' ? 'Chỉ hoàn tiền (không trả hàng)' : 'Trả hàng & hoàn tiền'}
                      </span>
                    </p>
                    <p className="text-slate-600">
                      <strong>Lý do:</strong> <span className="font-medium text-slate-800">{ret.reason}</span>
                    </p>
                    {ret.reasonDetail && (
                      <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                        "{ret.reasonDetail}"
                      </p>
                    )}
                    <div className="pt-1 text-[11px] text-slate-500">
                      <span>Nơi nhận hàng hoàn: </span>
                      <span className="font-semibold text-slate-700">Kho hàng của Shop</span>
                    </div>
                  </div>

                  {/* Cột 2: Sản phẩm trả */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Sản phẩm yêu cầu hoàn ({ret.items.length}):</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {ret.items.map((it) => (
                        <div key={it.id} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                          <img
                            src={it.productImage || 'https://placehold.co/80x80?text=SP'}
                            alt={it.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate text-[11px]">{it.productName}</p>
                            {it.variant && (
                              <p className="text-[10px] text-slate-400 font-medium truncate">Phân loại: {it.variant}</p>
                            )}
                            <div className="flex items-center justify-between mt-0.5 text-[11px]">
                              <span className="text-slate-500 font-semibold">x{it.quantity}</span>
                              <span className="font-bold text-orange-600">
                                {((it.price || 0) * it.quantity).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột 3: Vận đơn hoàn & Bằng chứng */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Vận đơn & Bằng chứng:</p>
                    {ret.returnTrackingNumber ? (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Mã ZMX Hoàn:</span>
                          <span className="font-mono font-bold text-slate-800 tracking-wider">#{ret.returnTrackingNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedForTrackingModal(ret)}
                          className="w-full py-1 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-lg border border-orange-200 text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🚚</span> Xem Hành Trình Bưu Kiện ZMX
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-2.5 rounded-xl border border-dashed border-slate-300 text-[11px] space-y-0.5">
                        <p className="font-semibold text-slate-700 flex items-center gap-1">
                          <span>🛵</span> ZMX Shipper Thu Hồi Tận Nơi
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          Đang chờ khách đóng gói hoặc shipper tiếp nhận lấy hàng
                        </p>
                      </div>
                    )}

                    {ret.evidences.length > 0 ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">
                          Hình ảnh/Video bằng chứng ({ret.evidences.length}) - <em>Bấm để phóng to</em>:
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                          {ret.evidences.map((ev) => (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={() => setPreviewImageUrl(ev.fileUrl)}
                              className="relative group shrink-0 rounded-lg overflow-hidden border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <img
                                src={ev.fileUrl}
                                alt="Proof"
                                className="w-11 h-11 object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                {ev.uploadedBy === 'SELLER' ? 'Shop' : 'Khách'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[10px] italic">Không có ảnh đính kèm</p>
                    )}
                  </div>
                </div>

                {/* Footer Card: Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Tạo ngày: {new Date(ret.createdAt).toLocaleString('vi-VN')}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút xem chi tiết đơn gốc & tiến trình */}
                    <button
                      type="button"
                      onClick={() => handleOpenOriginalOrder(ret.orderId)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      📄 Đơn Gốc
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedForTrackingModal(ret)}
                      className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer"
                    >
                      🔍 Chi Tiết Tiến Trình
                    </button>

                    {/* Hành động khi đơn ở REQUESTED */}
                    {ret.status === 'REQUESTED' && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            setSelectedForReject(ret);
                            setRejectReason('');
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          ✕ Từ Chối
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            setSelectedForNegotiate(ret);
                            setNegotiateAmount(Math.round(ret.refundAmount * 0.5));
                            setNegotiateNote('');
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                        >
                          💬 Đề Xuất Hoàn Một Phần
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleQuickApprove(ret)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          ✓ Chấp Nhận Yêu Cầu
                        </button>
                      </>
                    )}

                    {/* Hành động khi đơn ở RETURN_SHIPPING (Chờ Khách Gửi Hàng) */}
                    {ret.status === 'RETURN_SHIPPING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenChatWithBuyer(ret.buyerId)}
                          className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>💬</span> Nhắn Tin Cho Khách
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleImmediateRefund(ret)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>⚡</span> Hoàn Tiền Ngay (Không Cần Hàng Về)
                        </button>
                      </>
                    )}

                    {/* Hành động khi hàng đang vận chuyển RETURN_IN_TRANSIT */}
                    {ret.status === 'RETURN_IN_TRANSIT' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenChatWithBuyer(ret.buyerId)}
                          className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>💬</span> Nhắn Tin Cho Khách
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleImmediateRefund(ret)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>⚡</span> Hoàn Tiền Ngay
                        </button>
                      </>
                    )}

                    {/* Hành động khi hàng đã về kho DELIVERED_TO_SELLER */}
                    {ret.status === 'DELIVERED_TO_SELLER' && (
                      <button
                        type="button"
                        onClick={() => setSelectedForStockModal(ret)}
                        className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
                      >
                        🔍 Mở Kiện Hàng & Xử Lý Tồn Kho
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xử lý tồn kho */}
      {selectedForStockModal && (
        <ReturnStockDecisionModal
          returnData={selectedForStockModal}
          isOpen={!!selectedForStockModal}
          onClose={() => setSelectedForStockModal(null)}
          onSuccess={() => fetchReturns()}
        />
      )}

      {/* Modal Đề xuất thương lượng hoàn 1 phần */}
      {selectedForNegotiate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <h3 className="font-bold text-slate-800 text-base">💬 Đề Xuất Hoàn Tiền Một Phần</h3>
            <p className="text-xs text-slate-500">
              Khách hàng yêu cầu hoàn <strong>{selectedForNegotiate.refundAmount.toLocaleString('vi-VN')}đ</strong>. Bạn có thể đề xuất số tiền hợp lý để hai bên cùng đồng thuận.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tiền bạn đề xuất hoàn (VNĐ): *</label>
                <input
                  type="number"
                  value={negotiateAmount}
                  onChange={(e) => setNegotiateAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lời nhắn gửi tới Người mua:</label>
                <textarea
                  rows={3}
                  value={negotiateNote}
                  onChange={(e) => setNegotiateNote(e.target.value)}
                  placeholder="Giải thích lý do đề xuất số tiền này (ví dụ: hỗ trợ phí sửa chữa, giữ lại hàng...)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForNegotiate(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleNegotiateSubmit}
                className="px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md shadow-orange-600/20"
              >
                {actionLoading ? 'Đang gửi...' : 'Gửi Đề Xuất'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối yêu cầu */}
      {selectedForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
            <h3 className="font-bold text-rose-600 text-base">✕ Từ Chối Yêu Cầu Trả Hàng</h3>
            <p className="text-xs text-slate-500">
              Khi bạn từ chối, yêu cầu sẽ được chuyển tới đội ngũ CS Khách hàng ZeroMall để phân xử dựa trên bằng chứng của hai bên.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do từ chối: *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nêu rõ lý do (Shop đã kiểm tra hàng trước khi đóng, khách làm rách tem bảo hành...)"
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedForReject(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRejectSubmit}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20"
              >
                {actionLoading ? 'Đang lưu...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phóng To Bằng Chứng Khiếu Nại */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold z-10 transition-colors cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewImageUrl}
              alt="Bằng chứng khiếu nại"
              className="max-h-[85vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal Xem Tiến Trình Đổi Trả & Vận Đơn Hoàn ZMX */}
      {selectedForTrackingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedForTrackingModal(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>🚚</span> Chi Tiết Tiến Trình Đổi Trả & Vận Chuyển ZMX
              </h3>
              <button
                onClick={() => setSelectedForTrackingModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ReturnTrackingView
              returnData={selectedForTrackingModal}
              onRefresh={() => {
                fetchReturns();
                setSelectedForTrackingModal(null);
              }}
              isSellerView={true}
            />
          </div>
        </div>
      )}

    </div>
  );
};
