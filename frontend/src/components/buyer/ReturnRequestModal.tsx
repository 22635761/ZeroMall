import React, { useState, useMemo } from 'react';
import { returnService } from '../../services/return.service';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  variant?: string | null;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  shopId?: string | null;
  buyerId: string;
  totalAmount: number;
  shippingFee: number;
  items: OrderItem[];
}

interface ReturnRequestModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  { key: 'NON_RECEIPT', label: 'Chưa nhận được hàng', solution: 'REFUND_ONLY' },
  { key: 'ITEM_MISSING', label: 'Nhận thiếu hàng / thiếu phụ kiện', solution: 'BOTH' },
  { key: 'ITEM_DAMAGED', label: 'Hàng bị bể vỡ, móp méo do vận chuyển', solution: 'BOTH' },
  { key: 'FUNCTION_FAIL', label: 'Hàng bị lỗi kỹ thuật, không hoạt động', solution: 'RETURN_REFUND' },
  { key: 'WRONG_ITEM', label: 'Hàng giao sai mẫu / sai màu / khác mô tả', solution: 'RETURN_REFUND' },
  { key: 'COUNTERFEIT', label: 'Nghi ngờ hàng giả, hàng nhái', solution: 'BOTH' },
  { key: 'CHANGE_MIND', label: 'Đổi ý, không còn nhu cầu (Hàng nguyên seal)', solution: 'RETURN_REFUND' },
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resolution, setResolution] = useState<'REFUND_ONLY' | 'RETURN_REFUND'>('RETURN_REFUND');
  const [reason, setReason] = useState<string>('WRONG_ITEM');
  const [reasonDetail, setReasonDetail] = useState<string>('');
  const [returnMethod, setReturnMethod] = useState<'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE'>('ZMX_PICKUP');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Partial return state: item selections & quantities
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>(() => {
    const initial: Record<string, { selected: boolean; quantity: number }> = {};
    order.items.forEach((it) => {
      initial[it.id] = { selected: true, quantity: it.quantity };
    });
    return initial;
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const updateQuantity = (itemId: string, qty: number, maxQty: number) => {
    const safeQty = Math.max(1, Math.min(qty, maxQty));
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: safeQty,
      },
    }));
  };

  // Tính số tiền hoàn dự kiến
  const calculatedRefundAmount = useMemo(() => {
    let subtotal = 0;
    order.items.forEach((it) => {
      const selection = selectedItems[it.id];
      if (selection?.selected) {
        subtotal += it.price * selection.quantity;
      }
    });

    // Nếu trả toàn bộ tất cả sản phẩm -> hoàn cả phí ship ban đầu
    const isFullReturn = order.items.every((it) => {
      const s = selectedItems[it.id];
      return s?.selected && s.quantity === it.quantity;
    });

    if (isFullReturn && order.shippingFee) {
      subtotal += order.shippingFee;
    }

    return Math.min(subtotal, order.totalAmount);
  }, [order, selectedItems]);

  if (!isOpen) return null;

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dz209s6jk';
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'zeromall_preset';

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Tải ảnh lên thất bại');
        const data = await res.json();
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setEvidenceUrls((prev) => [...prev, ...uploadedUrls].slice(0, 5));
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh minh chứng');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    const itemsToReturn = order.items
      .filter((it) => selectedItems[it.id]?.selected)
      .map((it) => ({
        orderItemId: it.id,
        productId: it.productId,
        productName: it.name,
        productImage: it.image,
        variant: it.variant || undefined,
        price: it.price,
        quantity: selectedItems[it.id].quantity,
        refundAmount: it.price * selectedItems[it.id].quantity,
      }));

    if (itemsToReturn.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm cần trả hàng!');
      return;
    }

    if (!reasonDetail.trim()) {
      alert('Vui lòng nhập mô tả chi tiết lý do trả hàng/hoàn tiền!');
      return;
    }

    setIsSubmitting(true);
    try {
      await returnService.createReturn({
        orderId: order.id,
        sellerId: order.shopId || 'default-shop',
        buyerId: order.buyerId,
        resolution,
        reason,
        reasonDetail: reasonDetail.trim(),
        refundAmount: calculatedRefundAmount,
        returnMethod: resolution === 'RETURN_REFUND' ? returnMethod : undefined,
        items: itemsToReturn,
        evidences: evidenceUrls.map((url) => ({
          fileUrl: url,
          fileType: url.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
        })),
      });

      alert('Đã gửi yêu cầu Trả hàng / Hoàn tiền thành công! Người bán có 48h để phản hồi.');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <h3 className="font-bold text-lg">Yêu Cầu Trả Hàng / Hoàn Tiền</h3>
              <p className="text-xs text-orange-100">Đơn hàng #{order.id} • Chuẩn bảo vệ người mua Shopee Guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${step >= 1 ? 'bg-orange-600' : 'bg-slate-300'}`}>1</span>
            <span>Phương Án</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${step >= 2 ? 'bg-orange-600' : 'bg-slate-300'}`}>2</span>
            <span>Lý Do & Sản Phẩm</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${step >= 3 ? 'bg-orange-600' : 'bg-slate-300'}`}>3</span>
            <span>Xác Nhận</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: Chọn Phương án */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Chọn phương án bạn mong muốn:</h4>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  resolution === 'RETURN_REFUND'
                    ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'RETURN_REFUND'}
                  onChange={() => setResolution('RETURN_REFUND')}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>📦 Trả hàng và Hoàn tiền</span>
                    <span className="text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Phổ biến</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Bạn sẽ gửi trả sản phẩm về cho Người bán qua Shipper SPX lấy hàng tận nhà hoặc gửi bưu cục. Tiền sẽ được hoàn sau khi Người bán nhận hàng.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  resolution === 'REFUND_ONLY'
                    ? 'border-orange-500 bg-orange-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'REFUND_ONLY'}
                  onChange={() => setResolution('REFUND_ONLY')}
                  className="mt-1 text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>💸 Chỉ hoàn tiền (Không cần trả hàng)</span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Nhanh chóng</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Dành cho trường hợp: Bạn chưa nhận được hàng, kiện hàng bị thiếu đồ, hoặc hàng hóa bị hư hỏng/vỡ nát hoàn toàn không thể tái sử dụng.
                  </p>
                </div>
              </label>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <span>💡</span>
                <span>Shopee Đảm Bảo: Toàn bộ số tiền thanh toán của bạn đang được đóng băng an toàn trong ví trung gian. Người bán không thể rút tiền cho đến khi khiếu nại này được giải quyết.</span>
              </div>
            </div>
          )}

          {/* STEP 2: Lý do & Sản phẩm trả */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Chọn lý do */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Lý do yêu cầu trả hàng / hoàn tiền: *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {RETURN_REASONS.filter(
                    (r) => r.solution === 'BOTH' || r.solution === resolution
                  ).map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Danh sách sản phẩm trả */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Chọn sản phẩm cần trả (Hỗ trợ trả 1 phần đơn):</label>
                  <span className="text-[11px] text-slate-500">Tích chọn sản phẩm</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((item) => {
                    const sel = selectedItems[item.id] || { selected: false, quantity: item.quantity };
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          sel.selected ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200 bg-slate-50/50 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sel.selected}
                          onChange={() => toggleItem(item.id)}
                          className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                        />
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                          {item.variant && <p className="text-[11px] text-slate-500">Phân loại: {item.variant}</p>}
                          <p className="text-xs font-semibold text-orange-600">{item.price.toLocaleString('vi-VN')}đ</p>
                        </div>
                        {sel.selected && (
                          <div className="flex items-center gap-1 border border-slate-300 rounded-lg p-1 bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, sel.quantity - 1, item.quantity)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold w-6 text-center">{sel.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, sel.quantity + 1, item.quantity)}
                              className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hình thức gửi hàng hoàn */}
              {resolution === 'RETURN_REFUND' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Hình thức hoàn trả hàng: *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReturnMethod('ZMX_PICKUP')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        returnMethod === 'ZMX_PICKUP'
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-800'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🛵 SPX Lấy hàng tận nơi
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">Shipper đến địa chỉ của bạn lấy kiện hàng</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnMethod('ZMX_DROPOFF')}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        returnMethod === 'ZMX_DROPOFF'
                          ? 'border-orange-500 bg-orange-50 font-bold text-orange-800'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🏢 Gửi tại Bưu cục SPX
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5">Tự mang bưu kiện ra điểm gửi hàng gần bạn</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tình trạng hàng hóa cụ thể: *</label>
                <textarea
                  rows={3}
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Mô tả chi tiết lỗi sản phẩm, tình trạng hư hỏng, thiếu phụ kiện gì..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Upload ảnh / video minh chứng */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Hình ảnh / Video minh chứng (Khuyên dùng video khui hàng):</label>
                  <span className="text-[11px] text-slate-500">{evidenceUrls.length}/5 tệp</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {evidenceUrls.map((url, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group">
                      <img src={url} alt="Minh chứng" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEvidenceUrls((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {evidenceUrls.length < 5 && (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 text-slate-400 hover:text-orange-600 transition-colors">
                      <span className="text-lg">+</span>
                      <span className="text-[10px] font-medium">{uploadingImage ? 'Đang tải...' : 'Thêm'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleUploadImage}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Xác nhận & Tóm tắt */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Tóm tắt yêu cầu Trả hàng / Hoàn tiền:</h4>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phương án:</span>
                  <span className="font-bold text-slate-800">
                    {resolution === 'REFUND_ONLY' ? '💸 Chỉ hoàn tiền (Không gửi hàng)' : '📦 Trả hàng và hoàn tiền'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lý do:</span>
                  <span className="font-semibold text-slate-800">
                    {RETURN_REASONS.find((r) => r.key === reason)?.label || reason}
                  </span>
                </div>
                {resolution === 'RETURN_REFUND' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hình thức hoàn trả:</span>
                    <span className="font-semibold text-slate-800">
                      {returnMethod === 'ZMX_PICKUP' ? '🛵 SPX Lấy hàng tận nơi' : '🏢 Gửi tại Bưu cục SPX'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Mô tả của bạn:</span>
                  <span className="text-slate-700 max-w-xs text-right truncate">{reasonDetail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bằng chứng đính kèm:</span>
                  <span className="font-semibold text-slate-800">{evidenceUrls.length} ảnh/video</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800">Số tiền hoàn dự kiến:</span>
                  <span className="font-black text-orange-600 text-lg">
                    {calculatedRefundAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                <span>🛡️</span>
                <div>
                  <p className="font-bold">Quy trình xử lý tiếp theo:</p>
                  <p className="mt-0.5 text-[11px] text-blue-700">
                    1. Người bán có <strong>48 giờ</strong> để chấp nhận hoặc đề xuất thỏa thuận.<br />
                    2. Nếu Người bán không phản hồi sau 48 giờ, hệ thống sẽ <strong>tự động duyệt</strong> yêu cầu của bạn.<br />
                    3. Tiền sẽ được hoàn trực tiếp vào <strong>Số dư ví ZeroPay</strong> của bạn.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Quay lại
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !reasonDetail.trim()) {
                  alert('Vui lòng nhập mô tả chi tiết!');
                  return;
                }
                setStep((prev) => (prev + 1) as any);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-md shadow-orange-600/20"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white transition-all shadow-md shadow-orange-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác Nhận & Gửi Yêu Cầu'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
