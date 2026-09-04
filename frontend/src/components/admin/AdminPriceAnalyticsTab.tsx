import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../config/api.config';

interface ProductItem {
  id: string;
  name: string;
  price: string;
  costPrice?: number | null;
  shopId: string;
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

export default function AdminPriceAnalyticsTab() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chart' | 'selling_history' | 'cost_history'>('chart');

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    point: PricePoint;
  } | null>(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchAnalytics(selectedProductId, timeRange);
    }
  }, [selectedProductId, timeRange]);

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(prev => prev && list.some((p: any) => p.id === prev) ? prev : list[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm admin:', err);
    }
  };

  const fetchAnalytics = async (prodId: string, range: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/price-analytics?productId=${prodId}&range=${range}`);
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

  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.id.includes(searchFilter));
  }, [products, searchFilter]);

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

      return { ...d, x, ySelling, yCost };
    });

    const createPath = (key: 'ySelling' | 'yCost') => {
      const validPoints = points.filter(p => p[key] !== null);
      if (validPoints.length === 0) return '';
      return validPoints.reduce((acc, curr, idx) => {
        return idx === 0 ? `M ${curr.x} ${curr[key]}` : `${acc} L ${curr.x} ${curr[key]}`;
      }, '');
    };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Giám Sát Biến Động Giá & Giá Vốn Toàn Sàn</h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi chi tiết giá bán, giá nhập đợt hàng và kiểm tra tính minh bạch giá của các Shop
          </p>
        </div>
      </div>

      {/* Selector & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc ID sản phẩm..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {filteredProducts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Shop: {p.shopId?.slice(0, 8)}... | Giá: {parseInt(p.price || '0').toLocaleString('vi-VN')}₫)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['7d', '30d', '90d', '1y', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
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

      {/* Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Giá Bán Niêm Yết</div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.currentSellingPrice?.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-xs text-slate-400 mt-1">Đang hiển thị cho người mua</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Giá Vốn Nhập Gần Nhất</div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.currentCostPrice !== null && analytics.metrics?.currentCostPrice !== undefined && analytics.metrics?.currentCostPrice > 0
                ? `${analytics.metrics.currentCostPrice.toLocaleString('vi-VN')} ₫`
                : 'Chưa có thông tin'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Hóa đơn nhập mới nhất của Shop</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Biên Lợi Nhuận Gộp</div>
            <div className="text-2xl font-bold text-indigo-600">
              {analytics.metrics?.marginPercent !== null && analytics.metrics?.marginPercent !== undefined ? `${analytics.metrics.marginPercent}%` : 'N/A'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {analytics.metrics?.marginAmount !== null && analytics.metrics?.marginAmount !== undefined
                ? `Chênh lệch: ${analytics.metrics.marginAmount.toLocaleString('vi-VN')} ₫`
                : 'Cần dữ liệu giá vốn'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tổng Lần Điều Chỉnh Giá</div>
            <div className="text-2xl font-bold text-slate-800">
              {analytics.metrics?.totalPriceChanges || 0} lần
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Tổng {analytics.metrics?.totalBatches || 0} lô hàng đã nhập
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'chart'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📊</span> Biểu Đồ Giá Bán vs Giá Nhập
          </button>
          <button
            onClick={() => setActiveTab('selling_history')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'selling_history'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>🏷️</span> Lịch Sử Điều Chỉnh Giá Bán ({analytics?.priceHistories?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('cost_history')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cost_history'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>📦</span> Lịch Sử Hóa Đơn Nhập Hàng ({analytics?.costHistories?.length || 0})
          </button>
        </div>

        {/* Tab 1: SVG Chart */}
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
              <span className="text-xs text-slate-400">Rê chuột vào điểm để xem thông tin chi tiết</span>
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

                  {chartConfig.points.map((p, idx) => (
                    <g key={idx}>
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
                        <span className="font-semibold">{hoveredPoint.point.sellingPrice.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    )}
                    {hoveredPoint.point.costPrice !== null && (
                      <div className="flex justify-between gap-4 py-0.5">
                        <span className="text-blue-400">Giá nhập:</span>
                        <span className="font-semibold">{hoveredPoint.point.costPrice.toLocaleString('vi-VN')} ₫</span>
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

        {/* Tab 2: Selling History */}
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
                    <th className="py-3 px-4">Tài Khoản Thay Đổi</th>
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
                          <td className="py-3.5 px-4 text-slate-600">{h.reason || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{h.changedBy || 'Hệ thống'}</td>
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

        {/* Tab 3: Cost History */}
        {activeTab === 'cost_history' && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase bg-slate-50 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Thời Gian Nhập</th>
                    <th className="py-3 px-4">Mã Đợt / HĐ</th>
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
                        <td className="py-3.5 px-4 text-slate-700">{c.supplier || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                          {c.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {c.costPrice.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                          {(c.quantity * c.costPrice).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{c.note || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{c.importedBy || 'Hệ thống'}</td>
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
    </div>
  );
}
