import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchVisualWithAI, type VisualSearchResponse } from '../../../services/ai-search.service';
import { toSlug } from '../../../utils/slug';

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<VisualSearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dọn dẹp webcam stream khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setImagePreview(null);
      setSearchResult(null);
      setErrorMessage(null);
      setIsScanning(false);
      setImageUrlInput('');
    }
  }, [isOpen]);

  // Hỗ trợ dán ảnh trực tiếp từ clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chỉ chọn tệp hình ảnh (.jpg, .png, .webp)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh không được vượt quá 20MB');
      return;
    }

    setErrorMessage(null);
    stopCamera();

    try {
      const dataUrl = await compressImage(file);
      setImagePreview(dataUrl);
      triggerVisualSearch(dataUrl);
    } catch {
      setErrorMessage('Không thể xử lý hình ảnh');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = imageUrlInput.trim();
    if (!url) return;
    setErrorMessage(null);
    stopCamera();
    setImagePreview(url);
    triggerVisualSearch(undefined, url);
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      setImagePreview(null);
      setSearchResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      setErrorMessage('Không thể truy cập camera thiết bị. Vui lòng cấp quyền hoặc tải ảnh từ máy.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setImagePreview(dataUrl);
    triggerVisualSearch(dataUrl);
  };

  const triggerVisualSearch = async (b64?: string, url?: string) => {
    setIsScanning(true);
    setSearchResult(null);
    setErrorMessage(null);

    try {
      const res = await searchVisualWithAI({
        imageBase64: b64,
        imageUrl: url,
        limit: 20,
      });
      setSearchResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi quét ảnh. Vui lòng thử lại với hình ảnh khác.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleProductClick = (product: any) => {
    onClose();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/product/${toSlug(product.name)}-i.${product.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg shadow-md shadow-emerald-600/20">
              📸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-800">
                  ZeroAI Visual Search • Tìm Kiếm Bằng Hình Ảnh
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-3xs">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Tải ảnh hoặc chụp trực tiếp sản phẩm, AI sẽ tự động phân tích kiểu dáng và tìm mẫu tương tự trên ZeroMall.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-100 border border-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* UPLOAD / CAMERA CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left Area: Upload / Camera Box (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Viewport Box */}
              <div className="relative aspect-4/3 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group shadow-inner">
                {isCameraActive ? (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={captureCameraFrame}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>📸</span> Chụp Ảnh Này
                    </button>
                  </div>
                ) : imagePreview ? (
                  <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />

                    {/* Laser Scanning Animation Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite] opacity-90"></div>
                        <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[1px]"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                          <span className="animate-spin text-xs">✨</span>
                          <span>ZeroAI Multimodal Vision đang quét...</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setSearchResult(null);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition shadow-md cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 transition w-full h-full"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl group-hover:scale-110 transition shadow-xs">
                      🖼️
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-2.5">
                      Kéo thả ảnh hoặc <span className="text-emerald-600 underline">Chọn từ máy</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Hỗ trợ JPG, PNG, WEBP hoặc nhấn <strong>Ctrl + V</strong> để dán ảnh
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs"
                >
                  <span>📁</span> Chọn Tệp Ảnh
                </button>
                <button
                  type="button"
                  onClick={isCameraActive ? stopCamera : startCamera}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs ${
                    isCameraActive
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  <span>📷</span> {isCameraActive ? 'Tắt Camera' : 'Mở Camera'}
                </button>
              </div>

              {/* Image URL input */}
              <form onSubmit={handleUrlSubmit} className="flex gap-1.5">
                <input
                  type="url"
                  placeholder="Hoặc dán URL hình ảnh..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={!imageUrlInput.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  Tìm
                </button>
              </form>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-semibold text-rose-700 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Right Area: AI Analysis & Product Results (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* AI VISUAL ANALYSIS CARD */}
              {searchResult && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 border border-emerald-200/80 rounded-2xl space-y-2 text-xs shadow-3xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <strong className="text-emerald-950 font-black">
                        {searchResult.visualAnalysis.detectedProduct}
                      </strong>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      {searchResult.source === 'clip-vector-engine'
                        ? '⚡ Vector Vision (CLIP)'
                        : searchResult.source === 'local-knowledge'
                          ? '🎯 Bộ Não Đã Học'
                          : searchResult.source === 'local-ai-engine'
                            ? '🧠 ZeroAI Local Engine'
                            : '✨ Gemini Vision'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {searchResult.visualAnalysis.suggestedCategory && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-700">
                        🏷️ {searchResult.visualAnalysis.suggestedCategory}
                      </span>
                    )}
                    {searchResult.visualAnalysis.dominantColors?.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-600">
                        🎨 {c}
                      </span>
                    ))}
                    {searchResult.visualAnalysis.style && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-600">
                        👔 {searchResult.visualAnalysis.style}
                      </span>
                    )}
                    {searchResult.visualAnalysis.gender && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-600">
                        👥 {searchResult.visualAnalysis.gender}
                      </span>
                    )}
                  </div>

                  {searchResult.visualAnalysis.searchTerms?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-emerald-200/40">
                      <span className="text-[10px] text-slate-400 font-semibold">Từ khóa gợi ý:</span>
                      {searchResult.visualAnalysis.searchTerms.slice(0, 5).map((term, i) => (
                        <span key={i} className="text-[10px] font-medium bg-emerald-100/60 text-emerald-800 px-1.5 py-0.2 rounded">
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PRODUCT RESULTS LIST */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Sản Phẩm Tương Đồng Trên ZeroMall</span>
                    {searchResult && (
                      <span className="text-[10px] font-bold text-emerald-600">
                        ({searchResult.totalMatches} sản phẩm)
                      </span>
                    )}
                  </h4>
                </div>

                {isScanning ? (
                  <div className="p-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
                    <span className="text-3xl animate-bounce">🔍</span>
                    <p className="text-xs font-bold text-slate-700">Đang quét đặc trưng thị giác của ảnh...</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      ZeroAI Multimodal Vision đang đối soát kiểu dáng, hoa văn và màu sắc với kho hàng ZeroMall.
                    </p>
                  </div>
                ) : searchResult && searchResult.products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                    {searchResult.products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="group bg-white border border-slate-200/80 hover:border-emerald-500 rounded-2xl p-2.5 transition duration-150 cursor-pointer shadow-3xs hover:shadow-md flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                            <img
                              src={product.image || 'https://placehold.co/300x300?text=No+Image'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          </div>
                          <h5 className="text-[11px] font-bold text-slate-800 line-clamp-2 group-hover:text-emerald-600 transition leading-snug">
                            {product.name}
                          </h5>
                        </div>

                        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black text-rose-600">
                            {Number(product.price).toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            ⭐ {product.rating || 5}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResult ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-2xl">📦</span>
                    <p className="text-xs font-bold text-slate-700">Chưa tìm thấy sản phẩm hoàn toàn khớp kiểu dáng</p>
                    <p className="text-[10px] text-slate-400">
                      Hãy thử đổi góc chụp rõ nét hơn hoặc chọn một hình ảnh khác.
                    </p>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <span className="text-2xl text-slate-300">💡</span>
                    <p className="text-xs font-bold text-slate-500">Chưa có hình ảnh nào được tải lên</p>
                    <p className="text-[10px] text-slate-400">
                      Hãy tải ảnh lên hoặc chụp bằng camera ở khung bên trái để bắt đầu tìm kiếm thông minh.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
