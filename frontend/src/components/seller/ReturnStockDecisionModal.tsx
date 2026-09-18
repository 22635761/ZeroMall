import React, { useState } from 'react';
import { returnService, type ReturnData } from '../../services/return.service';

interface ReturnStockDecisionModalProps {
  returnData: ReturnData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnStockDecisionModal: React.FC<ReturnStockDecisionModalProps> = ({
  returnData,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'RESTOCK' | 'SCRAP' | 'DISPUTE'>('RESTOCK');
  const [note, setNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz209s6jk';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'zeromall_preset';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Tải ảnh/video thất bại');
      const data = await res.json();
      setEvidenceUrl(data.secure_url);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải tệp minh chứng');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (decision === 'DISPUTE' && !note.trim()) {
      alert('Vui lòng nhập lý do khiếu nại hàng hoàn bị lỗi/tráo đổi!');
      return;
    }

    setLoading(true);
    try {
      if (decision === 'DISPUTE') {
        await returnService.sellerConfirmReceive(returnData.id, {
          conditionOk: false,
          note: note.trim() || 'Người bán khiếu nại hàng hoàn bị hư hại/tráo đổi',
          evidenceUrl: evidenceUrl || undefined,
        });
        alert('Đã gửi khiếu nại tới CS Sàn ZeroMall. Bộ phận CS sẽ liên hệ kiểm tra bằng chứng.');
      } else {
        await returnService.sellerConfirmReceive(returnData.id, {
          conditionOk: true,
          restockAction: decision, // 'RESTOCK' hoặc 'SCRAP'
          note: note.trim() || undefined,
          evidenceUrl: evidenceUrl || undefined,
        });
        alert(
          decision === 'RESTOCK'
            ? 'Đã xác nhận nhận hàng, hoàn tiền cho khách và nhập lại kho thành công!'
            : 'Đã xác nhận nhận hàng, hoàn tiền cho khách và ghi nhận tổn thất (không nhập kho).'
        );
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Lỗi thao tác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Kiểm Hàng Hoàn & Xử Lý Tồn Kho</h3>
              <p className="text-[11px] text-slate-500">Mã đơn #{returnData.orderId} • Mã hoàn #{returnData.returnNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Danh sách sản phẩm hoàn về */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <span className="font-bold text-slate-700 block">Sản phẩm hoàn về:</span>
          {returnData.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800 truncate max-w-[220px]">{item.productName}</span>
              <span className="font-bold text-orange-600">x{item.quantity}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Tiền hoàn cho khách:</span>
            <span className="font-black text-orange-600 text-sm">{returnData.refundAmount.toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        {/* 3 Lựa chọn kiểm hàng & tồn kho */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700">Quyết định sau khi mở kiện hàng kiểm tra: *</label>

          {/* Lựa chọn 1: Hàng nguyên vẹn -> Nhập kho */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
              decision === 'RESTOCK'
                ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="stockDecision"
              checked={decision === 'RESTOCK'}
              onChange={() => setDecision('RESTOCK')}
              className="mt-1 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">✅ Hàng nguyên vẹn: Hoàn tiền & Nhập lại kho</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Sản phẩm còn mới, nguyên seal/hộp. Hệ thống sẽ tự động cộng lại tồn kho cho sản phẩm này.
              </p>
            </div>
          </label>

          {/* Lựa chọn 2: Hàng hỏng -> Ghi nhận tổn thất */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
              decision === 'SCRAP'
                ? 'border-amber-500 bg-amber-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="stockDecision"
              checked={decision === 'SCRAP'}
              onChange={() => setDecision('SCRAP')}
              className="mt-1 text-amber-600 focus:ring-amber-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">⚠️ Hàng hư hại nhẹ: Hoàn tiền & Ghi nhận tổn thất</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Chấp nhận hoàn tiền cho khách nhưng KHÔNG cộng lại tồn kho (hàng bị móp vỡ, hư hỏng không thể bán lại).
              </p>
            </div>
          </label>

          {/* Lựa chọn 3: Bị tráo đổi / Lừa đảo -> Khiếu nại */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
              decision === 'DISPUTE'
                ? 'border-rose-500 bg-rose-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="stockDecision"
              checked={decision === 'DISPUTE'}
              onChange={() => setDecision('DISPUTE')}
              className="mt-1 text-rose-600 focus:ring-rose-500"
            />
            <div className="text-xs">
              <span className="font-bold text-rose-700 block">❌ Hàng bị tráo / Gian lận: Khiếu nại lên CS Sàn</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Kiện hàng bị tráo gạch đá/hàng cũ nát hoặc rỗng ruột. Đóng băng tiền hoàn và chuyển CS Sàn phân xử bồi thường.
              </p>
            </div>
          </label>
        </div>

        {/* Ghi chú & Video khui hàng */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú kiểm hàng:</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú tình trạng kiện hàng khi khui..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Video / Ảnh khui kiện hàng hoàn (Đồng kiểm):</label>
            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer font-semibold transition-colors flex items-center gap-2">
                <span>📷</span>
                <span>{uploading ? 'Đang tải...' : 'Chọn video/ảnh'}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUploadProof}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {evidenceUrl && (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  ✓ Đã tải lên minh chứng
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || uploading}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
              decision === 'DISPUTE'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } disabled:opacity-50`}
          >
            {loading ? 'Đang lưu...' : 'Xác Nhận Quyết Định'}
          </button>
        </div>

      </div>
    </div>
  );
};
