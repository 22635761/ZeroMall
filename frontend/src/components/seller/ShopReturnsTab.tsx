import React, { useState, useEffect } from 'react';
import { returnService, type ReturnData } from '../../services/return.service';
import { ReturnStockDecisionModal } from './ReturnStockDecisionModal';

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
    return `${hours}h ${mins}m`;
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
                    {ret.sellerInspectDeadline && ret.status === 'DELIVERED_TO_SELLER' && (
                      <span className="text-xs bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-lg font-bold">
                        🔍 Còn {calculateDeadline(ret.sellerInspectDeadline)} kiểm hàng
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Số tiền hoàn</span>
                      <span className="font-black text-orange-600 text-base">
                        {ret.refundAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Cột 1: Thông tin yêu cầu */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Thông tin yêu cầu:</p>
                    <p className="text-slate-600">
                      <strong>Phương án:</strong>{' '}
                      {ret.resolution === 'REFUND_ONLY' ? 'Chỉ hoàn tiền' : 'Trả hàng & hoàn tiền'}
                    </p>
                    <p className="text-slate-600">
                      <strong>Lý do:</strong> {ret.reason}
                    </p>
                    {ret.reasonDetail && (
                      <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                        "{ret.reasonDetail}"
                      </p>
                    )}
                  </div>

                  {/* Cột 2: Sản phẩm trả */}
                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Sản phẩm yêu cầu hoàn ({ret.items.length}):</p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {ret.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200 text-[11px]">
                          <span className="font-medium text-slate-800 truncate max-w-[160px]">{it.productName}</span>
                          <span className="font-bold text-orange-600">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột 3: Vận đơn hoàn & Bằng chứng */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <p className="font-bold text-slate-700">Vận đơn & Bằng chứng:</p>
                    {ret.returnTrackingNumber ? (
                      <div className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 font-medium">Mã vận đơn:</span>
                        <span className="font-mono font-bold text-slate-800">{ret.returnTrackingNumber}</span>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px]">Chưa phát sinh vận đơn hoàn</p>
                    )}

                    {ret.evidences.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                        {ret.evidences.map((ev) => (
                          <a key={ev.id} href={ev.fileUrl} target="_blank" rel="noopener noreferrer">
                            <img src={ev.fileUrl} alt="Proof" className="w-10 h-10 rounded-lg object-cover border border-slate-300" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card: Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Tạo ngày: {new Date(ret.createdAt).toLocaleString('vi-VN')}
                  </span>

                  <div className="flex items-center gap-2">
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
                          className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
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
                          className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                        >
                          💬 Đề Xuất Hoàn Một Phần
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleQuickApprove(ret)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                        >
                          ✓ Chấp Nhận Yêu Cầu
                        </button>
                      </>
                    )}

                    {/* Hành động khi hàng đã về kho DELIVERED_TO_SELLER */}
                    {ret.status === 'DELIVERED_TO_SELLER' && (
                      <button
                        type="button"
                        onClick={() => setSelectedForStockModal(ret)}
                        className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl shadow-md shadow-orange-600/20 transition-all"
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

    </div>
  );
};
