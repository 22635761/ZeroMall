import React, { useState, useEffect } from 'react';
import { formatOrderId } from '../../utils/orderUtils';
import { returnService, type ReturnData } from '../../services/return.service';

interface CsDisputesTabProps {
  disputesLoading?: boolean;
  disputes?: any[];
  refundDestinations?: Record<string, string>;
  setRefundDestinations?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  actionLoadingId?: string | null;
  handleAdminApproveDispute?: (order: any) => Promise<void>;
  handleAdminRejectDispute?: (order: any) => Promise<void>;
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const CsDisputesTab: React.FC<CsDisputesTabProps> = ({
  disputesLoading = false,
  disputes = [],
  refundDestinations = {},
  setRefundDestinations = () => {},
  actionLoadingId = null,
  handleAdminApproveDispute = async () => {},
  handleAdminRejectDispute = async () => {},
}) => {
  const [subTab, setSubTab] = useState<'ARBITRATION' | 'ALL_RETURNS' | 'LEGACY'>('ARBITRATION');
  const [returnDisputes, setReturnDisputes] = useState<ReturnData[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [arbitrationNotes, setArbitrationNotes] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<string | null>(null);

  const fetchReturnDisputes = async () => {
    setLoadingReturns(true);
    try {
      const data = await returnService.getReturns();
      setReturnDisputes(data);
    } catch (err) {
      console.error('Failed to fetch return disputes:', err);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchReturnDisputes();
  }, []);

  const pendingArbitrationList = returnDisputes.filter(
    (r) => r.status === 'CS_ARBITRATING' || r.status === 'SELLER_DISPUTED'
  );

  const handleArbitrate = async (returnId: string, decision: 'REFUND_BUYER' | 'REJECT_RETURN') => {
    const note = arbitrationNotes[returnId]?.trim();
    if (!note) {
      alert('Vui lòng nhập Biên Bản Phán Quyết / Lý do trước khi xác nhận phán quyết!');
      return;
    }

    const confirmMsg =
      decision === 'REFUND_BUYER'
        ? `Xác nhận PHÁN QUYẾT CHO NGƯỜI MUA?\n- Hệ thống sẽ kích hoạt hoàn tiền về ví người mua ngay lập tức.\n- Nếu tiền đã giải ngân cho Shop, hệ thống sẽ Clawback (truy thu ví Shop).\n- Ghi chú: "${note}"`
        : `Xác nhận BÁC BỎ HOÀN TIỀN (NGƯỜI BÁN THẮNG)?\n- Đơn hàng sẽ hoàn tất và Escrow được mở khóa giải ngân cho Người bán.\n- Ghi chú: "${note}"`;

    if (!window.confirm(confirmMsg)) return;

    setSubmittingId(returnId);
    try {
      const res = await returnService.csArbitrate(returnId, {
        decision,
        note,
        csAgentId: 'CS_SPECIALIST_ZERO',
      });
      alert(res.message || 'Phán quyết thành công!');
      fetchReturnDisputes();
    } catch (err: any) {
      alert('Lỗi khi phân xử: ' + (err.message || 'Không thể kết nối máy chủ'));
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans animate-in fade-in">
      {/* Header & Sub-Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Hội Đồng Trọng Tài CSKH - Xử Lý Tranh Chấp Trả Hàng / Hoàn Tiền
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân xử công tâm dựa trên ảnh/video đóng hàng và mở kiện hàng giữa Người mua và Người bán theo tiêu chuẩn Shopee Mall.
            </p>
          </div>

          <button
            onClick={fetchReturnDisputes}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span> Làm mới
          </button>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex items-center gap-2 pt-1 border-b border-slate-100">
          <button
            onClick={() => setSubTab('ARBITRATION')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              subTab === 'ARBITRATION'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🚨 Cần Phán Xử Khẩn Cấp</span>
            {pendingArbitrationList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                {pendingArbitrationList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('ALL_RETURNS')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              subTab === 'ALL_RETURNS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📦 Tất Cả Yêu Cầu Trả Hàng ({returnDisputes.length})</span>
          </button>

          <button
            onClick={() => setSubTab('LEGACY')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              subTab === 'LEGACY'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📑 Đơn Hàng Khiếu Nại Cũ ({disputes.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PHÁN XỬ KHẨN CẤP */}
      {subTab === 'ARBITRATION' && (
        <div className="space-y-6">
          {loadingReturns ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs font-bold text-slate-400 animate-pulse">
              Đang tải danh sách tranh chấp cần phán xử...
            </div>
          ) : pendingArbitrationList.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-4xl">🎉</span>
              <p className="text-sm font-bold text-slate-700">Tuyệt vời! Không có tranh chấp nào đang chờ phán xử</p>
              <p className="text-xs text-slate-400">Tất cả yêu cầu trả hàng đã được người mua và người bán thống nhất.</p>
            </div>
          ) : (
            pendingArbitrationList.map((ret) => (
              <div
                key={ret.id}
                className="bg-white border-2 border-rose-200 rounded-2xl p-6 shadow-sm space-y-6 text-left"
              >
                {/* Case Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                        {ret.status === 'SELLER_DISPUTED' ? 'Shop Khiếu Nại Bưu Kiện' : 'CS Đang Thụ Lý Phán Xử'}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600">
                        Mã THHT: #{ret.returnNumber || ret.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mã đơn hàng liên kết: <strong className="font-mono text-slate-800">#{formatOrderId(ret.orderId)}</strong> • Ngày tạo: {new Date(ret.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Số tiền yêu cầu hoàn:</span>
                    <p className="text-xl font-black text-rose-600">{formatMoney(ret.refundAmount)}</p>
                  </div>
                </div>

                {/* Evidence Confrontation Matrix (Đối Chiếu Bằng Chứng Hai Bên) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200">
                  {/* Cột Bên Mua (Buyer) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                        👤
                      </span>
                      <span>Bên Khiếu Nại (Người Mua)</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Lý do chọn:</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800">
                        {ret.reasonDetail || ret.reason}
                      </p>
                    </div>

                    {ret.returnMethod && (
                      <div className="text-xs text-slate-600">
                        <span className="font-bold">Hình thức gửi trả: </span>
                        <span>{ret.returnMethod}</span>
                        {ret.returnTrackingNumber && (
                          <span className="font-mono text-emerald-700 ml-1">({ret.returnTrackingNumber})</span>
                        )}
                      </div>
                    )}

                    {/* Buyer Evidences */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Hình ảnh / Video bằng chứng từ Người Mua ({ret.evidences?.length || 0}):
                      </p>
                      {ret.evidences && ret.evidences.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {ret.evidences.map((ev) => (
                            <button
                              key={ev.id}
                              onClick={() => setSelectedPreviewMedia(ev.fileUrl)}
                              className="relative group border border-slate-200 rounded-lg overflow-hidden w-20 h-20 bg-black cursor-pointer"
                            >
                              {ev.fileType === 'VIDEO' ? (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">
                                  ▶️ Video
                                </div>
                              ) : (
                                <img
                                  src={ev.fileUrl}
                                  alt="Buyer Evidence"
                                  className="w-full h-full object-cover group-hover:scale-110 transition"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400">Người mua không tải lên ảnh bằng chứng</p>
                      )}
                    </div>
                  </div>

                  {/* Cột Bên Bán (Seller) */}
                  <div className="space-y-3 md:border-l md:border-slate-200 md:pl-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                      <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[10px]">
                        🏪
                      </span>
                      <span>Bên Phản Đối (Người Bán / Shop)</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Lý do khiếu nại kiện hàng hoàn:</p>
                      <p className="bg-white p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800">
                        {ret.sellerNote || 'Người bán báo cáo sản phẩm bị tráo đổi, hư hại hoặc kiện hàng rỗng khi nhận lại.'}
                      </p>
                    </div>

                    {/* Seller Dispute Evidences */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-slate-500 uppercase">
                        Hình ảnh bằng chứng đồng kiểm từ Người Bán:
                      </p>
                      {ret.sellerEvidenceUrl ? (
                        <button
                          onClick={() => setSelectedPreviewMedia(ret.sellerEvidenceUrl!)}
                          className="relative group border border-rose-200 rounded-lg overflow-hidden w-20 h-20 bg-black cursor-pointer"
                        >
                          <img
                            src={ret.sellerEvidenceUrl}
                            alt="Seller Dispute Proof"
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                          />
                        </button>
                      ) : (
                        <p className="text-xs italic text-slate-400">Người bán chưa đính kèm ảnh bằng chứng đồng kiểm</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items in Return */}
                {ret.items && ret.items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700 uppercase">Danh sách sản phẩm hoàn lại:</p>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                      {ret.items.map((item) => (
                        <div key={item.id} className="p-3 bg-white flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.productImage || 'https://placehold.co/60x60?text=SP'}
                              alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.productName}</p>
                              <p className="text-[11px] text-slate-500">Số lượng: x{item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-bold text-slate-900">{formatMoney(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CS Verdict & Arbitration Console */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <span>⚡</span> BẢNG ĐIỀU KHIỂN PHÁN QUYẾT TRỌNG TÀI CSKH
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Biên bản phán quyết CS (Ghi rõ lý do căn cứ theo điều lệ):
                    </label>
                    <textarea
                      value={arbitrationNotes[ret.id] || ''}
                      onChange={(e) =>
                        setArbitrationNotes((prev) => ({ ...prev, [ret.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Ví dụ: Người mua cung cấp video mở hộp rõ mã vận đơn và sản phẩm nứt vỡ, Người bán không có video đối ứng lúc giao -> Chấp thuận hoàn tiền người mua."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      disabled={submittingId === ret.id}
                      onClick={() => handleArbitrate(ret.id, 'REFUND_BUYER')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>✅</span>
                      <span>{submittingId === ret.id ? 'Đang xử lý...' : 'Phán Quyết: Người Mua Thắng (Hoàn Tiền)'}</span>
                    </button>

                    <button
                      disabled={submittingId === ret.id}
                      onClick={() => handleArbitrate(ret.id, 'REJECT_RETURN')}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>❌</span>
                      <span>{submittingId === ret.id ? 'Đang xử lý...' : 'Phán Quyết: Người Bán Thắng (Bác Bỏ)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUB-TAB 2: TẤT CẢ YÊU CẦU TRẢ HÀNG (GIÁM SÁT) */}
      {subTab === 'ALL_RETURNS' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase">
            Toàn Bộ Hồ Sơ Trả Hàng / Hoàn Tiền Trên Sàn
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Mã THHT</th>
                  <th className="py-3 px-3">Mã Đơn</th>
                  <th className="py-3 px-3">Phương Án</th>
                  <th className="py-3 px-3">Số Tiền Hoàn</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3">Mã Vận Đơn Hoàn</th>
                  <th className="py-3 px-3">Ngày Tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnDisputes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      #{r.returnNumber || r.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      #{formatOrderId(r.orderId)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700">
                        {r.resolution === 'REFUND_ONLY' ? 'Hoàn tiền ngay' : 'Trả hàng hoàn tiền'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600">{formatMoney(r.refundAmount)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-700">
                      {r.returnTrackingNumber || '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ĐƠN HÀNG KHIẾU NẠI CŨ (LEGACY) */}
      {subTab === 'LEGACY' && (
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase">
            Khiếu Nại Đơn Hàng Cũ
          </h3>
          {disputesLoading ? (
            <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">
              Đang tải danh sách khiếu nại...
            </p>
          ) : disputes.length === 0 ? (
            <p className="text-center py-6 text-sm font-extrabold text-slate-400">
              Không có đơn khiếu nại tranh chấp nào cần xử lý
            </p>
          ) : (
            <div className="space-y-6">
              {disputes.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-800">
                        Mã Đơn Hàng: <span className="font-mono text-emerald-600">#{formatOrderId(order.id)}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                      {order.status === 'RETURN_DISPUTED' ? 'ĐANG TRANH CHẤP' : 'CHỜ DUYỆT HOÀN TIỀN'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                        Lý do người mua yêu cầu trả hàng
                      </p>
                      <p className="text-xs font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                        {order.refundReason || 'Không có lý do'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">{order.refundDescription}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">
                        Số tiền giao dịch Escrow bị treo
                      </p>
                      <p className="text-xl font-black text-rose-600">
                        {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        🔒 Tiền đang bị khóa tại hệ thống Escrow
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                      <span className="font-bold text-slate-600 shrink-0">Nguồn tiền hoàn:</span>
                      <select
                        value={refundDestinations[order.id] || 'WALLET'}
                        onChange={(e) =>
                          setRefundDestinations((prev) => ({ ...prev, [order.id]: e.target.value }))
                        }
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs focus:outline-hidden focus:border-emerald-500 w-full sm:w-auto"
                      >
                        <option value="WALLET">Ví ZeroPay người mua (Tức thì)</option>
                        <option value="BANK">Chuyển khoản Ngân hàng (1-3 ngày)</option>
                      </select>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => handleAdminApproveDispute(order)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs disabled:opacity-50 transition"
                      >
                        {actionLoadingId === order.id ? 'Đang duyệt...' : 'Duyệt Hoàn Tiền'}
                      </button>
                      <button
                        disabled={actionLoadingId === order.id}
                        onClick={() => handleAdminRejectDispute(order)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg text-xs cursor-pointer border border-rose-100 disabled:opacity-50 transition"
                      >
                        {actionLoadingId === order.id ? 'Đang bác...' : 'Bác bỏ & Trả tiền Seller'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Zoom Xem Bằng Chứng */}
      {selectedPreviewMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedPreviewMedia(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center font-bold cursor-pointer"
            >
              ✕
            </button>
            <img
              src={selectedPreviewMedia}
              alt="Preview"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
