import { useState, useEffect, useMemo, type FormEvent } from 'react';

interface PriceManagementProps {
  user: any;
  shopDetails?: any;
}

interface ProductOption {
  id: string;
  name: string;
  price: string;
  costPrice?: number | null;
  image?: string;
  images?: string;
  stock: number;
}

interface PricePoint {
  date: string;
  sellingPrice: number | null;
  costPrice: number | null;
  profitMargin?: number;
  marginPercentage?: number;
  events?: any[];
  note?: string;
  changedBy?: string;
}

interface PriceHistoryItem {
  id: string;
  oldPrice: number;
  newPrice: number;
  changeType?: string;
  reason?: string;
  changedBy: string;
  createdAt: string;
}

interface CostHistoryItem {
  id: string;
  invoiceCode?: string;
  supplier?: string;
  quantity: number;
  costPrice: number;
  note?: string;
  importedBy: string;
  importDate?: string;
  createdAt: string;
}

interface AnalyticsData {
  product: {
    id: string;
    name: string;
    currentSellingPrice: number;
    currentCostPrice: number | null;
  } | null;
  metrics: {
    currentSellingPrice: number;
    currentCostPrice: number | null;
    marginAmount: number | null;
    marginPercent: number | null;
    totalPriceChanges: number;
    totalBatches: number;
  };
  chartData: PricePoint[];
  priceHistories: PriceHistoryItem[];
  costHistories: CostHistoryItem[];
}

export default function PriceManagement({ user, shopDetails }: PriceManagementProps) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'selling_history' | 'cost_history'>('chart');

  // Modals
  const [showUpdatePriceModal, setShowUpdatePriceModal] = useState<boolean>(false);
  const [showImportBatchModal, setShowImportBatchModal] = useState<boolean>(false);

  // Form states
  const [newSellingPrice, setNewSellingPrice] = useState<string>('');
  const [priceReason, setPriceReason] = useState<string>('');
  const [updatingPrice, setUpdatingPrice] = useState<boolean>(false);

  const [invoiceCode, setInvoiceCode] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [batchQuantity, setBatchQuantity] = useState<string>('');
  const [batchCostPrice, setBatchCostPrice] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>('');
  const [importingBatch, setImportingBatch] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // SVG Chart Tooltip State
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    point: PricePoint;
  } | null>(null);

  const effectiveShopId = user?.shopId || shopDetails?.id || '';

  useEffect(() => {
    fetchProducts();
  }, [effectiveShopId]);

  useEffect(() => {
    if (selectedProductId) {
      fetchAnalytics(selectedProductId, timeRange);
    }
  }, [selectedProductId, timeRange]);

  const fetchProducts = async () => {
    try {
      const url = effectiveShopId
        ? `http://localhost:8000/products?shopId=${effectiveShopId}`
        : 'http://localhost:8000/products';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(prev => prev && list.some((p: any) => p.id === prev) ? prev : list[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm:', err);
    }
  };

  const fetchAnalytics = async (prodId: string, range: string) => {
    setLoading(true);
    try {
      const shopParam = effectiveShopId ? `&shopId=${effectiveShopId}` : '';
      const res = await fetch(`http://localhost:8000/products/price-analytics?productId=${prodId}&range=${range}${shopParam}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics({
          product: data.product || null,
          metrics: data.metrics || {
            currentSellingPrice: data.summary?.currentSellingPrice || 0,
            currentCostPrice: data.summary?.currentCostPrice || 0,
            marginAmount: data.summary?.profitMargin || 0,
            marginPercent: data.summary?.marginPercentage || 0,
            totalPriceChanges: data.summary?.totalPriceChangesCount || 0,
            totalBatches: data.summary?.totalBatchesCount || 0,
          },
          chartData: data.chartData || data.timeline || [],
          priceHistories: data.priceHistories || [],
          costHistories: data.costHistories || [],
        });
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu biến động giá:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdatePrice = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newSellingPrice) return;

    setUpdatingPrice(true);
    try {
      const res = await fetch(`http://localhost:8000/products/${selectedProductId}/update-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPrice: parseFloat(newSellingPrice),
          reason: priceReason || undefined,
          changedBy: user?.name || user?.email || 'Người bán',
          changedByRole: 'SELLER',
          shopId: effectiveShopId,
        })
      });

      if (res.ok) {
        showToast('success', 'Cập nhật giá bán thành công!');
        setShowUpdatePriceModal(false);
        setNewSellingPrice('');
        setPriceReason('');
        await fetchAnalytics(selectedProductId, timeRange);
        await fetchProducts();
      } else {
        const errData = await res.json().catch(() => null);
        showToast('error', errData?.message || 'Cập nhật giá thất bại');
      }
    } catch (err) {
      showToast('error', 'Có lỗi kết nối máy chủ');
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleImportBatch = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !batchQuantity || !batchCostPrice) return;

    setImportingBatch(true);
    try {
      const res = await fetch(`http://localhost:8000/products/${selectedProductId}/import-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceCode: invoiceCode || undefined,
          supplier: supplier || undefined,
          quantity: parseInt(batchQuantity),
          costPrice: parseFloat(batchCostPrice),
          note: batchNotes || undefined,
          importedBy: user?.name || user?.email || 'Quản lý kho',
          shopId: effectiveShopId,
        })
      });

      if (res.ok) {
        showToast('success', 'Ghi nhận đợt nhập hàng thành công!');
        setShowImportBatchModal(false);
        setInvoiceCode('');
        setSupplier('');
        setBatchQuantity('');
        setBatchCostPrice('');
        setBatchNotes('');
        await fetchAnalytics(selectedProductId, timeRange);
        await fetchProducts();
      } else {
        const errData = await res.json().catch(() => null);
        showToast('error', errData?.message || 'Ghi nhận đợt nhập hàng thất bại');
      }
    } catch (err) {
      showToast('error', 'Có lỗi kết nối máy chủ');
    } finally {
      setImportingBatch(false);
    }
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // SVG Line Chart Coordinate Calculations
  const chartConfig = useMemo(() => {
    if (!analytics || !analytics.chartData || analytics.chartData.length === 0) {
      return null;
    }

    const data = analytics.chartData;
    const width = 800;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 50, left: 70 };

    let allPrices: number[] = [];
    data.forEach(d => {
      if (d.sellingPrice !== null && d.sellingPrice !== undefined) allPrices.push(d.sellingPrice);
      if (d.costPrice !== null && d.costPrice !== undefined) allPrices.push(d.costPrice);
    });

    if (allPrices.length === 0) allPrices = [0, 100000];

    const minPrice = Math.min(...allPrices) * 0.9;
    const maxPrice = Math.max(...allPrices) * 1.1;
    const priceRange = maxPrice - minPrice || 1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const ySelling = d.sellingPrice !== null && d.sellingPrice !== undefined
        ? padding.top + chartHeight - ((d.sellingPrice - minPrice) / priceRange) * chartHeight
        : null;
      const yCost = d.costPrice !== null && d.costPrice !== undefined
        ? padding.top + chartHeight - ((d.costPrice - minPrice) / priceRange) * chartHeight
        : null;

      return {
        ...d,
        x,
        ySelling,
        yCost
      };
    });

    const createPath = (key: 'ySelling' | 'yCost') => {
      const validPoints = points.filter(p => p[key] !== null);
      if (validPoints.length === 0) return '';
      return validPoints.reduce((acc, curr, idx) => {
        return idx === 0 ? `M ${curr.x} ${curr[key]}` : `${acc} L ${curr.x} ${curr[key]}`;
      }, '');
    };

    // Y Axis Ticks (4 steps)
    const yTicks = [0, 1, 2, 3].map(i => {
      const val = minPrice + (priceRange / 3) * i;
      const y = padding.top + chartHeight - (i / 3) * chartHeight;
      return { val, y };
    });

    return {
      width,
      height,
      padding,
      points,
      sellingPath: createPath('ySelling'),
      costPath: createPath('yCost'),
      yTicks
    };
  }, [analytics]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản Lý Giá & Lịch Sử Biến Động</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi chi tiết lịch sử đổi giá bán, giá nhập đợt hàng, biên lợi nhuận và xu hướng biến động
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportBatchModal(true)}
            disabled={!selectedProductId}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>📥</span> Ghi Nhận Nhập Hàng
          </button>
          <button
            onClick={() => {
              if (analytics?.metrics?.currentSellingPrice) {
                setNewSellingPrice(analytics.metrics.currentSellingPrice.toString());
              } else if (selectedProduct?.price) {
                setNewSellingPrice(selectedProduct.price);
              }
              setShowUpdatePriceModal(true);
            }}
            disabled={!selectedProductId}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>🏷️</span> Cập Nhật Giá Bán
          </button>
        </div>
      </div>

      {/* Product & Time Range Selector Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 shrink-0">Chọn sản phẩm:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full max-w-md px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {products.length === 0 ? (
              <option value="">Chưa có sản phẩm nào</option>
            ) : (
              products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — (Đang bán: {parseInt(p.price || '0').toLocaleString('vi-VN')}₫)
                </option>
              ))
            )}
          </select>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto">
          {(['7d', '30d', '90d', '1y', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r === '7d' && '7 Ngày'}
              {r === '30d' && '30 Ngày'}
              {r === '90d' && '3 Tháng'}
              {r === '1y' && '1 Năm'}
              {r === 'all' && 'Tất Cả'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Giá Bán Hiện Tại</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm">🏷️</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.currentSellingPrice?.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-xs text-slate-400 mt-1">Đang hiển thị trên sàn</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Giá Nhập Gần Nhất</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-sm">📦</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.currentCostPrice !== null && analytics.metrics?.currentCostPrice !== undefined && analytics.metrics?.currentCostPrice > 0
                ? `${analytics.metrics.currentCostPrice.toLocaleString('vi-VN')} ₫`
                : 'Chưa nhập giá gốc'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Đợt nhập mới nhất</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Biên Lợi Nhuận Gộp</span>
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg text-sm">📈</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.marginPercent !== null && analytics.metrics?.marginPercent !== undefined
                ? `${analytics.metrics.marginPercent}%`
                : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {analytics.metrics?.marginAmount !== null && analytics.metrics?.marginAmount !== undefined
                ? `Lãi ~${analytics.metrics.marginAmount.toLocaleString('vi-VN')} ₫ / sản phẩm`
                : 'Cần cập nhật giá nhập'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tần Suất Đổi Giá</span>
              <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-sm">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.totalPriceChanges || 0} lần
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Tổng {analytics.metrics?.totalBatches || 0} đợt nhập hàng
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Chart & Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'chart'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📊</span> Biểu Đồ Biến Động Giá
          </button>
          <button
            onClick={() => setActiveTab('selling_history')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'selling_history'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏷️</span> Lịch Sử Giá Bán ({analytics?.priceHistories?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('cost_history')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cost_history'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📦</span> Lịch Sử Giá Nhập ({analytics?.costHistories?.length || 0})
          </button>
        </div>

        {/* Tab 1: Interactive SVG Chart */}
        {activeTab === 'chart' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-slate-700">Giá Bán Sản Phẩm (VNĐ)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span className="text-slate-700">Giá Nhập Hàng (VNĐ)</span>
                </div>
              </div>
              <span className="text-xs text-slate-400">Rê chuột vào điểm trên biểu đồ để xem chi tiết</span>
            </div>

            {loading ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : chartConfig && chartConfig.points.length > 0 ? (
              <div className="relative w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
                  className="w-full h-80 overflow-visible"
                >
                  {/* Grid Lines & Y Axis Ticks */}
                  {chartConfig.yTicks.map((tick, idx) => (
                    <g key={idx}>
                      <line
                        x1={chartConfig.padding.left}
                        y1={tick.y}
                        x2={chartConfig.width - chartConfig.padding.right}
                        y2={tick.y}
                        stroke="#f1f5f9"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartConfig.padding.left - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                        fontSize="11"
                        fill="#94a3b8"
                      >
                        {Math.round(tick.val).toLocaleString('vi-VN')}₫
                      </text>
                    </g>
                  ))}

                  {/* Selling Price Line */}
                  {chartConfig.sellingPath && (
                    <path
                      d={chartConfig.sellingPath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Cost Price Line */}
                  {chartConfig.costPath && (
                    <path
                      d={chartConfig.costPath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {chartConfig.points.map((p, idx) => (
                    <g key={idx}>
                      {/* Selling Point */}
                      {p.ySelling !== null && (
                        <circle
                          cx={p.x}
                          cy={p.ySelling}
                          r={hoveredPoint?.point.date === p.date ? "7" : "5"}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.ySelling!, point: p })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      )}

                      {/* Cost Point */}
                      {p.yCost !== null && (
                        <circle
                          cx={p.x}
                          cy={p.yCost}
                          r={hoveredPoint?.point.date === p.date ? "7" : "4"}
                          fill="#3b82f6"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-pointer transition-all hover:scale-125"
                          onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.yCost!, point: p })}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      )}

                      {/* X Axis Date Label */}
                      <text
                        x={p.x}
                        y={chartConfig.height - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#94a3b8"
                      >
                        {p.date}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Interactive Tooltip Card */}
                {hoveredPoint && (
                  <div
                    style={{
                      left: `${(hoveredPoint.x / chartConfig.width) * 100}%`,
                      top: `${(hoveredPoint.y / chartConfig.height) * 100}%`
                    }}
                    className="absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs pointer-events-none min-w-[200px]"
                  >
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 text-slate-300">
                      Ngày: {hoveredPoint.point.date}
                    </div>
                    {hoveredPoint.point.sellingPrice !== null && (
                      <div className="flex justify-between gap-4 py-0.5">
                        <span className="text-emerald-400">Giá bán:</span>
                        <span className="font-semibold">
                          {hoveredPoint.point.sellingPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                    {hoveredPoint.point.costPrice !== null && (
                      <div className="flex justify-between gap-4 py-0.5">
                        <span className="text-blue-400">Giá nhập:</span>
                        <span className="font-semibold">
                          {hoveredPoint.point.costPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}
                    {hoveredPoint.point.profitMargin !== undefined && (
                      <div className="flex justify-between gap-4 py-0.5 border-t border-slate-800 mt-1 pt-1">
                        <span className="text-purple-400">Chênh lệch lãi:</span>
                        <span className="font-semibold text-purple-300">
                          {hoveredPoint.point.profitMargin.toLocaleString('vi-VN')} ₫ ({hoveredPoint.point.marginPercentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-sm">
                <span className="text-3xl mb-2">📉</span>
                Chưa có dữ liệu biến động giá trong khoảng thời gian này
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Selling Price History Table */}
        {activeTab === 'selling_history' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Giá Cũ</th>
                    <th className="py-3 px-4">Giá Mới</th>
                    <th className="py-3 px-4">Chênh Lệch</th>
                    <th className="py-3 px-4">Lý Do Đổi Giá</th>
                    <th className="py-3 px-4">Người Thực Hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics?.priceHistories && analytics.priceHistories.length > 0 ? (
                    analytics.priceHistories.map((h) => {
                      const diff = h.newPrice - h.oldPrice;
                      const diffPercent = h.oldPrice > 0 ? ((diff / h.oldPrice) * 100).toFixed(1) : '0';
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/60 transition-all">
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {h.oldPrice.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {h.newPrice.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                diff > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : diff < 0
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {diff > 0 ? `+${diff.toLocaleString('vi-VN')}₫ (+${diffPercent}%)` : diff < 0 ? `${diff.toLocaleString('vi-VN')}₫ (${diffPercent}%)` : 'Khởi tạo'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {h.reason || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                            {h.changedBy || 'Hệ thống'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Chưa có lịch sử thay đổi giá bán
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Cost Price / Import Invoices History Table */}
        {activeTab === 'cost_history' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Thời Gian Nhập</th>
                    <th className="py-3 px-4">Mã Đợt / Hóa Đơn</th>
                    <th className="py-3 px-4">Nhà Cung Cấp</th>
                    <th className="py-3 px-4 text-center">Số Lượng</th>
                    <th className="py-3 px-4">Giá Nhập (Đơn vị)</th>
                    <th className="py-3 px-4">Tổng Tiền Đợt</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                    <th className="py-3 px-4">Người Nhập</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics?.costHistories && analytics.costHistories.length > 0 ? (
                    analytics.costHistories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-all">
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {new Date(c.importDate || c.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 text-xs">
                          {c.invoiceCode || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {c.supplier || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                          {c.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {c.costPrice.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                          {(c.quantity * c.costPrice).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {c.note || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                          {c.importedBy || 'Hệ thống'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có lịch sử nhập đợt hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Update Selling Price */}
      {showUpdatePriceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Cập Nhật Giá Bán Sản Phẩm</h3>
              <button
                onClick={() => setShowUpdatePriceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Sản phẩm
                </label>
                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedProduct?.name || 'Đang chọn'}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Giá bán hiện tại
                </label>
                <div className="text-sm font-semibold text-emerald-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {analytics?.metrics?.currentSellingPrice?.toLocaleString('vi-VN') || selectedProduct?.price} ₫
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Giá bán mới (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={newSellingPrice}
                  onChange={(e) => setNewSellingPrice(e.target.value)}
                  placeholder="Nhập giá mới..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Lý do thay đổi giá
                </label>
                <textarea
                  rows={2}
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  placeholder="Ví dụ: Giảm giá kích cầu, điều chỉnh theo thị trường..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdatePriceModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {updatingPrice ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Import Batch (Cost Price) */}
      {showImportBatchModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800">Ghi Nhận Đợt Nhập Hàng (Giá Vốn)</h3>
              <button
                onClick={() => setShowImportBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportBatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Sản phẩm nhập
                </label>
                <div className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {selectedProduct?.name || 'Đang chọn'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Mã đợt / Số hóa đơn
                  </label>
                  <input
                    type="text"
                    value={invoiceCode}
                    onChange={(e) => setInvoiceCode(e.target.value)}
                    placeholder="VD: HD-NK-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Tên NCC..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Số lượng nhập *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Giá vốn nhập / chiếc *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={batchCostPrice}
                    onChange={(e) => setBatchCostPrice(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Ghi chú nhập hàng
                </label>
                <textarea
                  rows={2}
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Ghi chú thêm về đợt hàng, điều khoản bảo hành..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportBatchModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={importingBatch}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
                >
                  {importingBatch ? 'Đang lưu...' : 'Ghi Nhận Đợt Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
