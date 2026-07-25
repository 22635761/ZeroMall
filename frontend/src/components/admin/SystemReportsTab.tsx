import React, { useState } from 'react'
import { formatOrderId } from '../../utils/orderUtils'

interface SystemReportsTabProps {
  allOrders: any[]
  users: any[]
  commissionRate: number
}

export const SystemReportsTab: React.FC<SystemReportsTabProps> = ({
  allOrders,
  users,
  commissionRate
}) => {
  const now = new Date()
  const [filterMode, setFilterMode] = useState<'RANGE' | 'MONTH_YEAR'>('RANGE')
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [reportRange, setReportRange] = useState<'1_DAY' | '3_DAYS' | '7_DAYS' | '30_DAYS' | 'ALL'>('ALL')
  const [activeStatDetail, setActiveStatDetail] = useState<'GMV' | 'COMMISSION' | 'ORDERS' | 'USERS' | 'REFUNDS'>('GMV')
  const [commTabFilter, setCommTabFilter] = useState<'EARNED' | 'PENDING' | 'IN_TRANSIT' | 'REFUNDED'>('EARNED')

  const filterByRange = (items: any[], dateField: string = 'createdAt') => {
    if (filterMode === 'MONTH_YEAR') {
      return items.filter(item => {
        const d = new Date(item[dateField]);
        return d.getMonth() + 1 === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
      });
    }
    if (reportRange === 'ALL') return items;
    const nowMs = Date.now();
    let msLimit = 0;
    if (reportRange === '1_DAY') msLimit = 24 * 60 * 60 * 1000;
    else if (reportRange === '3_DAYS') msLimit = 3 * 24 * 60 * 60 * 1000;
    else if (reportRange === '7_DAYS') msLimit = 7 * 24 * 60 * 60 * 1000;
    else if (reportRange === '30_DAYS') msLimit = 30 * 24 * 60 * 60 * 1000;
    
    return items.filter(item => {
      const itemDate = new Date(item[dateField]).getTime();
      return (nowMs - itemDate) <= msLimit;
    });
  };

  const filteredOrders = filterByRange(allOrders);
  const filteredUsers = filterByRange(users);

  const getOrderCommRate = (o: any) => o.commissionRate ?? 5;
  const getOrderItemSubtotal = (o: any) => {
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    }
    return Math.max(0, (o.totalAmount || 0) - (o.shippingFee || 0));
  };

  const isValidGmvOrder = (o: any) => {
    const invalidStatuses = ['CANCELLED', 'REFUNDED', 'RETURNED', 'REFUND_PENDING', 'RETURN_PENDING', 'PENDING', 'PENDING_PAYMENT', 'UNPAID'];
    return !invalidStatuses.includes(o.status);
  };

  const validGmvOrders = filteredOrders.filter(isValidGmvOrder);
  const totalGMV = validGmvOrders.reduce((sum, o) => sum + getOrderItemSubtotal(o), 0);
  const orderCount = validGmvOrders.length;
  const userCount = filteredUsers.length;
  const refundCount = filteredOrders.filter(o => o.status === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'RETURN_PENDING').length;
  const refundRate = filteredOrders.length > 0 ? ((refundCount / filteredOrders.length) * 100).toFixed(1) : '0.0';
  const getOrderCommAmount = (o: any) => {
    const itemSubtotal = getOrderItemSubtotal(o);
    const shopDiscount = o.shopDiscountAmount || 0;
    const netSubtotal = Math.max(0, itemSubtotal - shopDiscount);
    return Math.round(netSubtotal * (getOrderCommRate(o) / 100));
  };

  const completedOrdersForComm = filteredOrders.filter(o => o.status === 'COMPLETED');
  const totalCommission = completedOrdersForComm.reduce((sum, o) => sum + getOrderCommAmount(o), 0);
  const heldOrdersForComm = filteredOrders.filter(o => o.status === 'DELIVERED');
  const pendingCommissionCard = heldOrdersForComm.reduce((sum, o) => sum + getOrderCommAmount(o), 0);

  return (
    <div className="space-y-6">
      {/* BỘ LỌC THỜI GIAN & THÁNG NĂM */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase">📊 Báo cáo thống kê hệ thống</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Lọc số liệu theo thời gian thực từ cơ sở dữ liệu</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-600 pl-1">📅 Lọc Tháng/Năm:</span>

          <select
            value={filterMode === 'MONTH_YEAR' ? selectedMonth : 'RANGE'}
            onChange={(e) => {
              if (e.target.value === 'RANGE') {
                setFilterMode('RANGE')
                setReportRange('ALL')
              } else {
                setFilterMode('MONTH_YEAR')
                setSelectedMonth(Number(e.target.value))
              }
            }}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 focus:outline-hidden"
          >
            <option value="RANGE">Tất cả thời gian</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
            ))}
          </select>

          {filterMode === 'MONTH_YEAR' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 focus:outline-hidden"
            >
              {Array.from({ length: now.getFullYear() - 2023 + 1 }, (_, i) => 2023 + i).map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
            {[
              { id: '1_DAY', label: '1 Ngày' },
              { id: '3_DAYS', label: '3 Ngày' },
              { id: '7_DAYS', label: '7 Ngày' },
              { id: '30_DAYS', label: '1 Tháng' },
              { id: 'ALL', label: 'Tất cả' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => {
                  setFilterMode('RANGE')
                  setReportRange(range.id as any)
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-black transition cursor-pointer select-none ${
                  filterMode === 'RANGE' && reportRange === range.id
                    ? 'bg-white text-emerald-600 shadow-2xs border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5 CARD CHỈ SỐ CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* CARD 1: GMV */}
        <div 
          onClick={() => setActiveStatDetail('GMV')}
          className={`border rounded-xl p-6 shadow-2xs cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-98 relative overflow-hidden ${
            activeStatDetail === 'GMV' 
              ? 'bg-emerald-50/20 border-emerald-500 shadow-emerald-50/50 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200/60 hover:border-slate-350'
          }`}
        >
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Tổng GMV Toàn Sàn</p>
          <p className="text-2xl font-black text-emerald-600 mt-1.5">{totalGMV.toLocaleString('vi-VN')}đ</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1">Doanh số thực tế trong kỳ</p>
          {activeStatDetail === 'GMV' && (
            <span className="absolute bottom-1 right-2 text-xs text-emerald-600">✓</span>
          )}
        </div>

        {/* CARD 2: COMMISSION - Doanh Thu Chiết Khấu Sàn (Ngang hàng với GMV) */}
        <div
          onClick={() => setActiveStatDetail('COMMISSION')}
          className={`border rounded-xl p-6 shadow-2xs cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-98 relative overflow-hidden ${
            activeStatDetail === 'COMMISSION'
              ? 'bg-violet-50/30 border-violet-500 shadow-violet-50/50 ring-2 ring-violet-500/20'
              : 'bg-white border-slate-200/60 hover:border-violet-300'
          }`}
        >
          <div className="absolute right-2 top-2 w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px]">💰</div>
          <p className="text-[10px] text-violet-600 font-black uppercase tracking-wider">Doanh Thu Chiết Khấu Sàn</p>
          <p className="text-2xl font-black text-violet-700 mt-1.5">{Math.round(totalCommission).toLocaleString('vi-VN')}đ</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1">Đã thu từ đơn COMPLETED</p>
          {pendingCommissionCard > 0 && (
            <p className="text-[9px] text-amber-500 font-bold mt-0.5">+{Math.round(pendingCommissionCard).toLocaleString('vi-VN')}đ đang tạm giữ</p>
          )}
          {activeStatDetail === 'COMMISSION' && (
            <span className="absolute bottom-1 right-2 text-xs text-violet-600">✓</span>
          )}
        </div>

        {/* CARD 3: ORDERS */}
        <div 
          onClick={() => setActiveStatDetail('ORDERS')}
          className={`border rounded-xl p-6 shadow-2xs cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-98 relative overflow-hidden ${
            activeStatDetail === 'ORDERS' 
              ? 'bg-emerald-50/20 border-emerald-500 shadow-emerald-50/50 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200/60 hover:border-slate-350'
          }`}
        >
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Tổng Số Đơn Hàng</p>
          <p className="text-2xl font-black text-slate-800 mt-1.5">{orderCount}</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1">Đơn đặt hàng phát sinh</p>
          {activeStatDetail === 'ORDERS' && (
            <span className="absolute bottom-1 right-2 text-xs text-emerald-600">✓</span>
          )}
        </div>

        {/* CARD 4: USERS */}
        <div 
          onClick={() => setActiveStatDetail('USERS')}
          className={`border rounded-xl p-6 shadow-2xs cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-98 relative overflow-hidden ${
            activeStatDetail === 'USERS' 
              ? 'bg-emerald-50/20 border-emerald-500 shadow-emerald-50/50 ring-2 ring-emerald-500/20' 
              : 'bg-white border-slate-200/60 hover:border-slate-350'
          }`}
        >
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Tổng Thành Viên</p>
          <p className="text-2xl font-black text-slate-800 mt-1.5">{userCount}</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1">Người dùng đăng ký mới</p>
          {activeStatDetail === 'USERS' && (
            <span className="absolute bottom-1 right-2 text-xs text-emerald-600">✓</span>
          )}
        </div>

        {/* CARD 5: REFUNDS */}
        <div 
          onClick={() => setActiveStatDetail('REFUNDS')}
          className={`border rounded-xl p-6 shadow-2xs cursor-pointer transition-all duration-200 hover:shadow-sm active:scale-98 relative overflow-hidden ${
            activeStatDetail === 'REFUNDS' 
              ? 'bg-rose-50/20 border-rose-500 shadow-rose-50/50 ring-2 ring-rose-500/20' 
              : 'bg-white border-slate-200/60 hover:border-rose-350'
          }`}
        >
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Tỷ Lệ Trả Hàng Hoàn Tiền</p>
          <p className="text-2xl font-black text-rose-600 mt-1.5">{refundRate}%</p>
          <p className="text-[9px] text-slate-400 font-bold mt-1">Tỷ lệ khiếu nại hoàn thành</p>
          {activeStatDetail === 'REFUNDS' && (
            <span className="absolute bottom-1 right-2 text-xs text-rose-600">✓</span>
          )}
        </div>
      </div>

      {/* BẢNG PHÂN TÍCH CHI TIẾT */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
        {activeStatDetail === 'GMV' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>🌱</span> Chi tiết doanh thu (GMV Toàn Sàn)
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                Kỳ lọc: {reportRange === 'ALL' ? 'Tất cả' : reportRange === '1_DAY' ? '24 giờ qua' : `${reportRange.replace('_DAYS', '')} ngày`}
              </span>
            </div>

            {(() => {
              const methods = ['cod', 'zeropay', 'sepay'];
              const methodLabels: Record<string, string> = {
                cod: 'Thanh toán COD',
                zeropay: 'Ví điện tử ZeroPay',
                sepay: 'Chuyển khoản VietQR'
              };
              const distribution = methods.map(m => {
                const ordersForMethod = validGmvOrders.filter(o => o.paymentMethod?.toLowerCase() === m);
                const sum = ordersForMethod.reduce((s, o) => s + getOrderItemSubtotal(o), 0);
                const count = ordersForMethod.length;
                const pct = totalGMV > 0 ? (sum / totalGMV) * 100 : 0;
                return { method: m, label: methodLabels[m] || m, sum, count, pct };
              }).sort((a, b) => b.sum - a.sum);

              return (
                <div className="space-y-6">
                  {/* Khối tóm tắt Doanh thu sàn thu được */}
                  <div className="bg-violet-500/[0.03] border border-violet-500/20 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h5 className="text-[10px] font-black text-violet-700 uppercase tracking-wider">Doanh thu chiết khấu sàn thực thu (COMPLETED)</h5>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-bold">
                        Đã giải ngân thực tế: {Math.round(totalCommission).toLocaleString('vi-VN')}đ ({completedOrdersForComm.length} đơn) 
                        {pendingCommissionCard > 0 && ` • Đang tạm giữ 3 ngày: +${Math.round(pendingCommissionCard).toLocaleString('vi-VN')}đ (${heldOrdersForComm.length} đơn Đã giao)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-violet-700">
                        +{Math.round(totalCommission).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phân bổ doanh số thanh toán (Đơn hợp lệ)</h5>
                      <div className="space-y-3.5">
                        {distribution.map(item => (
                          <div key={item.method} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>{item.label} ({item.count} đơn)</span>
                              <span>{item.sum.toLocaleString('vi-VN')}đ ({item.pct.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Top 5 đơn hàng giá trị cao nhất (Chỉ đơn thành công / Đang xử lý)</h5>
                      <div className="divide-y divide-slate-100">
                        {[...validGmvOrders]
                          .sort((a, b) => getOrderItemSubtotal(b) - getOrderItemSubtotal(a))
                          .slice(0, 5)
                          .map((order, idx) => {
                            const subtotal = getOrderItemSubtotal(order);
                            return (
                              <div key={order.id} className="py-2.5 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">
                                    {idx + 1}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 font-mono">{order.id}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">{order.buyerEmail}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-extrabold text-slate-855">{subtotal.toLocaleString('vi-VN')}đ</p>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">{order.paymentMethod}</span>
                                </div>
                              </div>
                            );
                          })}
                        {validGmvOrders.length === 0 && (
                          <p className="text-xs text-slate-400 font-bold py-4 text-center">Chưa có dữ liệu đơn hàng hợp lệ</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh sách toàn bộ đơn hàng phát sinh</h5>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-2">Mã đơn hàng</th>
                      <th className="pb-2">Thời gian đặt</th>
                      <th className="pb-2">Email Người Mua</th>
                      <th className="pb-2">Phương thức</th>
                      <th className="pb-2">Trạng thái</th>
                      <th className="pb-2 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/10">
                        <td className="py-2 font-mono text-[10px] text-slate-800 font-bold">{order.id}</td>
                        <td className="py-2 text-slate-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="py-2 font-semibold text-slate-650">{order.buyerEmail}</td>
                        <td className="py-2 font-mono text-[9px] text-slate-500 uppercase">{order.paymentMethod}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-650' : 
                            order.status === 'SHIPPING' ? 'bg-blue-50 text-blue-650' : 
                            order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-655'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2 text-right font-black text-slate-750">{getOrderItemSubtotal(order).toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400 font-bold">Không tìm thấy đơn hàng nào trong thời gian này</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeStatDetail === 'ORDERS' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>📦</span> Chi tiết số lượng đơn hàng và trạng thái đơn
              </h4>
              <span className="text-[10px] font-bold text-indigo-655 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                Kỳ lọc: {reportRange === 'ALL' ? 'Tất cả' : reportRange === '1_DAY' ? '24 giờ qua' : `${reportRange.replace('_DAYS', '')} ngày`}
              </span>
            </div>

            {(() => {
              const statuses = ['PENDING_PAYMENT', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
              const statusLabels: Record<string, string> = {
                PENDING_PAYMENT: 'Chờ thanh toán',
                PROCESSING: 'Chờ xử lý',
                SHIPPING: 'Đang giao hàng',
                COMPLETED: 'Đã hoàn thành',
                CANCELLED: 'Đã hủy đơn',
                REFUNDED: 'Đã hoàn tiền'
              };
              const statusColors: Record<string, string> = {
                PENDING_PAYMENT: 'bg-amber-555',
                PROCESSING: 'bg-indigo-555',
                SHIPPING: 'bg-blue-555',
                COMPLETED: 'bg-emerald-555',
                CANCELLED: 'bg-rose-555',
                REFUNDED: 'bg-purple-555'
              };

              const summary = statuses.map(st => {
                const list = filteredOrders.filter(o => o.status === st);
                const count = list.length;
                const amount = list.reduce((s, o) => s + (o.totalAmount || 0), 0);
                const pct = orderCount > 0 ? (count / orderCount) * 100 : 0;
                return { status: st, label: statusLabels[st] || st, count, amount, pct, color: statusColors[st] || 'bg-slate-500' };
              });

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {summary.map(item => (
                      <div key={item.status} className="bg-slate-50/55 border border-slate-100 rounded-xl p-4 text-center space-y-1.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                        </div>
                        <p className="text-xl font-black text-slate-755">{item.count}</p>
                        <p className="text-[9px] text-slate-500 font-extrabold">{item.pct.toFixed(1)}%</p>
                        <p className="text-[9px] text-emerald-650 font-black truncate">{item.amount.toLocaleString('vi-VN')}đ</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mười đơn hàng đặt mới nhất trong kỳ</h5>
                    <div className="overflow-x-auto max-h-[300px]">
                      <table className="w-full text-xs text-left text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="pb-2">Mã đơn hàng</th>
                            <th className="pb-2">Ngày giờ</th>
                            <th className="pb-2">Khách hàng</th>
                            <th className="pb-2">Thanh toán</th>
                            <th className="pb-2">Trạng thái</th>
                            <th className="pb-2 text-right">Tổng tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...filteredOrders]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .slice(0, 10)
                            .map(order => (
                              <tr key={order.id} className="hover:bg-slate-50/10">
                                <td className="py-2 font-mono text-[10px] text-slate-800 font-bold">{order.id}</td>
                                <td className="py-2 text-slate-500">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                                <td className="py-2 font-semibold text-slate-655">{order.buyerName}</td>
                                <td className="py-2 font-mono text-[9px] text-slate-500 uppercase">{order.paymentMethod}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                                    order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-650' : 
                                    order.status === 'SHIPPING' ? 'bg-blue-50 text-blue-650' : 
                                    order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-655'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-2 text-right font-black text-slate-750">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</td>
                              </tr>
                            ))}
                          {filteredOrders.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-slate-400 font-bold">Không tìm thấy đơn hàng nào trong thời gian này</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeStatDetail === 'USERS' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>👥</span> Chi tiết thành viên đăng ký hệ thống
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                Kỳ lọc: {reportRange === 'ALL' ? 'Tất cả' : reportRange === '1_DAY' ? '24 giờ qua' : `${reportRange.replace('_DAYS', '')} ngày`}
              </span>
            </div>

            {(() => {
              const roles = ['BUYER', 'SHOP_OWNER', 'PLATFORM_SUPPORT', 'ADMIN'];
              const roleLabels: Record<string, string> = {
                BUYER: 'Người mua (Buyer)',
                SHOP_OWNER: 'Chủ shop (Seller)',
                PLATFORM_SUPPORT: 'Nhân viên CSKH',
                ADMIN: 'Quản trị viên'
              };

              const summary = roles.map(rl => {
                const count = filteredUsers.filter(u => u.role === rl).length;
                const pct = userCount > 0 ? (count / userCount) * 100 : 0;
                return { role: rl, label: roleLabels[rl] || rl, count, pct };
              });

              const activeCount = filteredUsers.filter(u => u.status === 'ACTIVE').length;
              const blockedCount = filteredUsers.filter(u => u.status === 'BLOCKED').length;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Phân bổ vai trò thành viên</h5>
                      <div className="space-y-3">
                        {summary.map(item => (
                          <div key={item.role} className="space-y-1 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                              <span>{item.label}</span>
                              <span>{item.count} thành viên ({item.pct.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái tài khoản hoạt động</h5>
                      <div className="flex gap-4 text-xs font-bold">
                        <div className="bg-emerald-50 text-emerald-650 px-4 py-2.5 rounded-xl border border-emerald-100 flex-1 text-center">
                          <p className="text-[9px] uppercase font-black text-emerald-500">Đang hoạt động</p>
                          <p className="text-lg font-black mt-1">{activeCount}</p>
                        </div>
                        <div className="bg-rose-50 text-rose-650 px-4 py-2.5 rounded-xl border border-rose-100 flex-1 text-center">
                          <p className="text-[9px] uppercase font-black text-rose-500">Đang bị khóa</p>
                          <p className="text-lg font-black mt-1">{blockedCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh sách thành viên đăng ký mới</h5>
                    <div className="overflow-y-auto max-h-[300px]">
                      <table className="w-full text-xs text-left text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="pb-2">Tên</th>
                            <th className="pb-2">Email</th>
                            <th className="pb-2">Vai trò</th>
                            <th className="pb-2 text-right">Ngày đăng ký</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...filteredUsers]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map(user => (
                              <tr key={user.id} className="hover:bg-slate-50/10">
                                <td className="py-2 font-bold text-slate-800 truncate max-w-[100px]">{user.name}</td>
                                <td className="py-2 text-slate-600 truncate max-w-[120px]">{user.email}</td>
                                <td className="py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                    user.role === 'ADMIN' ? 'bg-red-50 text-red-655' : 
                                    user.role === 'SHOP_OWNER' ? 'bg-blue-50 text-blue-655' : 'bg-slate-50 text-slate-655'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="py-2 text-right text-slate-500 font-semibold">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                              </tr>
                            ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-6 text-slate-400 font-bold">Không tìm thấy thành viên đăng ký nào trong thời gian này</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeStatDetail === 'REFUNDS' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h4 className="text-xs font-black text-rose-600 uppercase tracking-wide flex items-center gap-2">
                <span>⚖️</span> Chi tiết khiếu nại Trả hàng / Hoàn tiền
              </h4>
              <span className="text-[10px] font-bold text-rose-650 bg-rose-50 px-2 py-0.5 rounded uppercase">
                Kỳ lọc: {reportRange === 'ALL' ? 'Tất cả' : reportRange === '1_DAY' ? '24 giờ qua' : `${reportRange.replace('_DAYS', '')} ngày`}
              </span>
            </div>

            {(() => {
              const refundOrders = filteredOrders.filter(o => 
                o.status === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'RETURN_PENDING' || o.status === 'RETURN_DISPUTED'
              );

              const pendingCount = refundOrders.filter(o => o.status === 'RETURN_PENDING').length;
              const disputedCount = refundOrders.filter(o => o.status === 'RETURN_DISPUTED').length;
              const completedRefundCount = refundOrders.filter(o => o.status === 'REFUNDED' || o.status === 'RETURNED').length;

              const reasonCounts: Record<string, number> = {};
              refundOrders.forEach(o => {
                if (o.returnReason) {
                  reasonCounts[o.returnReason] = (reasonCounts[o.returnReason] || 0) + 1;
                }
              });
              const reasonList = Object.entries(reasonCounts)
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count);

              return (
                <div className="space-y-6">
                  <div className="flex gap-4 text-xs font-bold">
                    <div className="bg-amber-50 text-amber-655 px-4 py-3.5 rounded-xl border border-amber-100 flex-1 text-center">
                      <p className="text-[9px] uppercase font-black text-amber-500">Chờ Duyệt Hoàn Tiền</p>
                      <p className="text-xl font-black mt-1">{pendingCount}</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-650 px-4 py-3.5 rounded-xl border border-indigo-100 flex-1 text-center">
                      <p className="text-[9px] uppercase font-black text-indigo-500">Đang Tranh Chấp</p>
                      <p className="text-xl font-black mt-1">{disputedCount}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-650 px-4 py-3.5 rounded-xl border border-emerald-100 flex-1 text-center">
                      <p className="text-[9px] uppercase font-black text-emerald-500">Đã Hoàn Tiền Thành Công</p>
                      <p className="text-xl font-black mt-1">{completedRefundCount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nguyên nhân trả hàng phổ biến</h5>
                      <div className="space-y-3">
                        {reasonList.map(item => {
                          const pct = refundOrders.length > 0 ? (item.count / refundOrders.length) * 100 : 0;
                          return (
                            <div key={item.reason} className="space-y-1 text-xs">
                              <div className="flex justify-between font-bold text-slate-700">
                                <span>{item.reason}</span>
                                <span>{item.count} đơn ({pct.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-500 rounded-full" 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {reasonList.length === 0 && (
                          <p className="text-xs text-slate-400 font-bold py-4 text-center">Chưa có thông tin lý do trả hàng</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh sách chi tiết đơn hàng trả hàng/hoàn tiền</h5>
                      <div className="overflow-y-auto max-h-[300px]">
                        <table className="w-full text-xs text-left text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                              <th className="pb-2">Mã đơn</th>
                              <th className="pb-2">Khách hàng</th>
                              <th className="pb-2">Lý do</th>
                              <th className="pb-2 text-right">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {refundOrders.map(order => (
                              <tr key={order.id} className="hover:bg-slate-50/10">
                                <td className="py-2 font-mono text-[10px] text-slate-800 font-bold">{order.id}</td>
                                <td className="py-2 text-slate-600 truncate max-w-[120px]">{order.buyerEmail}</td>
                                <td className="py-2 font-semibold text-slate-655 truncate max-w-[120px]" title={order.returnReason}>{order.returnReason}</td>
                                <td className="py-2 text-right font-black text-rose-600">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</td>
                              </tr>
                            ))}
                            {refundOrders.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-slate-400 font-bold">Không tìm thấy yêu cầu trả hàng nào trong thời gian này</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeStatDetail === 'COMMISSION' && (() => {
          const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED');
          const pendingOrders = filteredOrders.filter(o => o.status === 'DELIVERED');
          const inTransitOrders = filteredOrders.filter(o =>
            o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'SHIPPING' ||
            o.status === 'DELIVERING' || o.status === 'IN_TRANSIT' || o.status === 'PENDING' || o.status === 'PENDING_PAYMENT'
          );
          const refundedOrders = filteredOrders.filter(o =>
            o.status === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'REFUND_PENDING' ||
            o.status === 'RETURN_PENDING' || o.status === 'REFUND_DISPUTED'
          );

          const earnedGMV = completedOrders.reduce((s, o) => s + getOrderItemSubtotal(o), 0);
          const pendingGMV = pendingOrders.reduce((s, o) => s + getOrderItemSubtotal(o), 0);
          const inTransitGMV = inTransitOrders.reduce((s, o) => s + getOrderItemSubtotal(o), 0);
          const refundedGMV = refundedOrders.reduce((s, o) => s + getOrderItemSubtotal(o), 0);

          const earnedCommission = completedOrders.reduce((s, o) => s + getOrderCommAmount(o), 0);
          const pendingCommission = pendingOrders.reduce((s, o) => s + getOrderCommAmount(o), 0);
          const inTransitCommission = inTransitOrders.reduce((s, o) => s + getOrderCommAmount(o), 0);
          const refundedCommission = refundedOrders.reduce((s, o) => s + getOrderCommAmount(o), 0);

          const currentTabOrders = 
            commTabFilter === 'EARNED' ? completedOrders :
            commTabFilter === 'PENDING' ? pendingOrders :
            commTabFilter === 'IN_TRANSIT' ? inTransitOrders : refundedOrders;

          const currentTabTotalGMV = 
            commTabFilter === 'EARNED' ? earnedGMV :
            commTabFilter === 'PENDING' ? pendingGMV :
            commTabFilter === 'IN_TRANSIT' ? inTransitGMV : refundedGMV;

          const currentTabTotalComm = 
            commTabFilter === 'EARNED' ? earnedCommission :
            commTabFilter === 'PENDING' ? pendingCommission :
            commTabFilter === 'IN_TRANSIT' ? inTransitCommission : refundedCommission;

          return (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h4 className="text-xs font-black text-violet-700 uppercase tracking-wide flex items-center gap-2">
                  <span>💰</span> Chi tiết Doanh Thu Chiết Khấu Sàn
                </h4>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase">
                  Tỷ lệ: {commissionRate}% / đơn hàng
                </span>
              </div>

              {/* 4 INTERACTIVE KPI CARDS */}
              <div className="grid grid-cols-4 gap-3">
                {/* 1. ĐÃ THU */}
                <div 
                  onClick={() => setCommTabFilter('EARNED')}
                  className={`rounded-xl p-3.5 text-white relative overflow-hidden cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                    commTabFilter === 'EARNED'
                      ? 'bg-violet-700 ring-4 ring-violet-500/30 scale-[1.02]'
                      : 'bg-violet-600/90 hover:bg-violet-600'
                  }`}
                >
                  <div className="absolute right-2 bottom-2 opacity-10 text-4xl pointer-events-none">💰</div>
                  <p className="text-[9px] font-black uppercase tracking-wider opacity-90">Đã Thu (Thực tế)</p>
                  <p className="text-lg font-black mt-1">{earnedCommission.toLocaleString('vi-VN')}đ</p>
                  <p className="text-[8px] opacity-80 mt-1">{completedOrders.length} đơn COMPLETED (Đã giải ngân)</p>
                  {commTabFilter === 'EARNED' && (
                    <span className="absolute top-2 right-2 text-[10px] bg-white text-violet-700 rounded-full px-1.5 py-0.5 font-bold">Đang xem</span>
                  )}
                </div>

                {/* 2. ĐANG TẠM GIỮ (ESCROW 3 NGÀY) */}
                <div 
                  onClick={() => setCommTabFilter('PENDING')}
                  className={`border rounded-xl p-3.5 relative overflow-hidden cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                    commTabFilter === 'PENDING'
                      ? 'bg-amber-100/90 border-amber-500 ring-4 ring-amber-500/30 scale-[1.02]'
                      : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="absolute right-2 bottom-2 opacity-10 text-4xl pointer-events-none">🔒</div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Đang Tạm Giữ (Escrow)</p>
                  <p className="text-lg font-black text-amber-700 mt-1">{pendingCommission.toLocaleString('vi-VN')}đ</p>
                  <p className="text-[8px] text-amber-600 font-bold mt-1">{pendingOrders.length} đơn DELIVERED (Chờ 3 ngày/Đánh giá)</p>
                  {commTabFilter === 'PENDING' && (
                    <span className="absolute top-2 right-2 text-[10px] bg-amber-600 text-white rounded-full px-1.5 py-0.5 font-bold">Đang xem</span>
                  )}
                </div>

                {/* 3. CHƯA GIAO / ĐANG GIAO (CHƯA TÍNH TẠM GIỮ) */}
                <div 
                  onClick={() => setCommTabFilter('IN_TRANSIT')}
                  className={`border rounded-xl p-3.5 relative overflow-hidden cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                    commTabFilter === 'IN_TRANSIT'
                      ? 'bg-blue-100/90 border-blue-500 ring-4 ring-blue-500/30 scale-[1.02]'
                      : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="absolute right-2 bottom-2 opacity-10 text-4xl pointer-events-none">🚚</div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">Chưa Giao / Đang Giao</p>
                  <p className="text-lg font-black text-blue-700 mt-1">{inTransitCommission.toLocaleString('vi-VN')}đ</p>
                  <p className="text-[8px] text-blue-600 font-bold mt-1">{inTransitOrders.length} đơn đang xử lý (Chưa tạm giữ)</p>
                  {commTabFilter === 'IN_TRANSIT' && (
                    <span className="absolute top-2 right-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">Đang xem</span>
                  )}
                </div>

                {/* 4. BỊ HOÀN / KHIẾU NẠI (KHÔNG THU) */}
                <div 
                  onClick={() => setCommTabFilter('REFUNDED')}
                  className={`border rounded-xl p-3.5 relative overflow-hidden cursor-pointer transition-all duration-200 shadow-2xs hover:shadow-md ${
                    commTabFilter === 'REFUNDED'
                      ? 'bg-rose-100/90 border-rose-500 ring-4 ring-rose-500/30 scale-[1.02]'
                      : 'bg-rose-50 border-rose-200 hover:border-rose-300'
                  }`}
                >
                  <div className="absolute right-2 bottom-2 opacity-10 text-4xl pointer-events-none">↩️</div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-rose-600">Bị Hoàn (Không thu)</p>
                  <p className="text-lg font-black text-rose-600 mt-1">-{refundedCommission.toLocaleString('vi-VN')}đ</p>
                  <p className="text-[8px] text-rose-500 font-bold mt-1">{refundedOrders.length} đơn hoàn tiền/khiếu nại</p>
                  {commTabFilter === 'REFUNDED' && (
                    <span className="absolute top-2 right-2 text-[10px] bg-rose-600 text-white rounded-full px-1.5 py-0.5 font-bold">Đang xem</span>
                  )}
                </div>
              </div>

              {/* TỔNG KẾT CHIẾT KHẤU */}
              <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 border border-violet-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💰</span>
                    <h5 className="text-xs font-black uppercase text-violet-800 tracking-wide">
                      Doanh Thu Chiết Khấu Thực Tế Đã Về Ví Sàn
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-600 font-semibold">
                    Tiền chiết khấu thực tế đã giải ngân thành công về Ví Sàn từ các đơn COMPLETED.
                  </p>
                </div>

                <div className="flex items-center gap-6 divide-x divide-violet-200/80 shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black text-violet-700">{earnedCommission.toLocaleString('vi-VN')}đ</p>
                    <p className="text-[9px] font-extrabold text-emerald-600 uppercase">✅ Đã thu về Ví Sàn</p>
                  </div>

                  {pendingCommission > 0 && (
                    <div className="pl-6 text-right">
                      <p className="text-lg font-black text-amber-600">+{pendingCommission.toLocaleString('vi-VN')}đ</p>
                      <p className="text-[9px] font-extrabold text-amber-600 uppercase">🔒 Đang tạm giữ (3 ngày)</p>
                    </div>
                  )}

                  <div className="pl-6 text-right">
                    <p className="text-base font-black text-slate-800">{(earnedCommission + pendingCommission).toLocaleString('vi-VN')}đ</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Tổng dự kiến (Đơn đã giao)</p>
                  </div>
                </div>
              </div>


              {/* BẢNG CHI TIẾT ĐƠN HÀNG LỌC THEO TAB ACTIVE */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-white font-bold text-[9px] ${
                      commTabFilter === 'EARNED' ? 'bg-violet-600' :
                      commTabFilter === 'PENDING' ? 'bg-amber-500' :
                      commTabFilter === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-rose-500'
                    }`}>
                      {commTabFilter === 'EARNED' ? '✅ ĐÃ THU THỰC TẾ' :
                       commTabFilter === 'PENDING' ? '🔒 ĐANG TẠM GIỮ (3 NGÀY)' :
                       commTabFilter === 'IN_TRANSIT' ? '🚚 CHƯA GIAO / ĐANG GIAO' : '❌ BỊ HOÀN (KHÔNG THU)'}
                    </span>
                    <span className="text-slate-700">
                      {commTabFilter === 'EARNED' ? 'Danh sách các đơn hàng đã thu chiết khấu thành công' :
                       commTabFilter === 'PENDING' ? 'Danh sách các đơn ĐÃ GIAO (DELIVERED) đang tạm giữ 3 ngày hoặc chờ đánh giá' :
                       commTabFilter === 'IN_TRANSIT' ? 'Danh sách các đơn đang xử lý/vận chuyển (chưa giao tới khách, chưa tính tạm giữ)' : 'Danh sách các đơn hàng bị hoàn tiền (Không lấy chiết khấu)'}
                    </span>
                  </h5>

                  {/* TAB FILTER BUTTONS */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      onClick={() => setCommTabFilter('EARNED')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        commTabFilter === 'EARNED' ? 'bg-white text-violet-700 font-black shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Đã Thu ({completedOrders.length})
                    </button>
                    <button
                      onClick={() => setCommTabFilter('PENDING')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        commTabFilter === 'PENDING' ? 'bg-white text-amber-600 font-black shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Tạm Giữ ({pendingOrders.length})
                    </button>
                    <button
                      onClick={() => setCommTabFilter('IN_TRANSIT')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        commTabFilter === 'IN_TRANSIT' ? 'bg-white text-blue-600 font-black shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Đang Giao ({inTransitOrders.length})
                    </button>
                    <button
                      onClick={() => setCommTabFilter('REFUNDED')}
                      className={`px-2 py-1 rounded-md transition cursor-pointer ${
                        commTabFilter === 'REFUNDED' ? 'bg-white text-rose-600 font-black shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      Bị Hoàn ({refundedOrders.length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[300px] border border-slate-200/80 rounded-xl bg-white">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                      <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Mã đơn hàng</th>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Khách hàng</th>
                        <th className="p-3">PTTT</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 text-right">GMV</th>
                        <th className="p-3 text-right font-black text-violet-700">Chiết khấu ({commissionRate}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTabOrders.map(order => {
                        const commRate = getOrderCommRate(order);
                        const comm = getOrderCommAmount(order);
                        const itemSubtotal = getOrderItemSubtotal(order);
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 font-mono text-[10px] text-slate-800 font-bold">#{formatOrderId(order.id)}</td>
                            <td className="p-3 text-slate-500 font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td className="p-3 font-semibold text-slate-650 truncate max-w-[120px]">{order.buyerEmail}</td>
                            <td className="p-3 font-mono text-[9px] uppercase text-slate-500">{order.paymentMethod}</td>
                            <td className="p-3">
                              {(() => {
                                if (commTabFilter === 'EARNED') {
                                  return <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-650">✅ Đã thu (Giải ngân)</span>;
                                }
                                if (commTabFilter === 'PENDING') {
                                  return <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-655">🔒 Tạm giữ (Chờ 3 ngày/Đánh giá)</span>;
                                }
                                if (commTabFilter === 'IN_TRANSIT') {
                                  return <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-50 text-blue-650">🚚 Chưa giao (Chưa tạm giữ)</span>;
                                }
                                return <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-650">❌ Bị hoàn tiền</span>;
                              })()}
                            </td>
                            <td className="p-3 text-right font-semibold">{itemSubtotal.toLocaleString('vi-VN')}đ</td>
                            <td className="p-3 text-right font-black text-violet-700">
                              {commTabFilter === 'REFUNDED' ? '0đ (Đã hoàn)' : `+${comm.toLocaleString('vi-VN')}đ (${commRate}%)`}
                            </td>
                          </tr>
                        );
                      })}
                      {currentTabOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                            Không có đơn hàng nào thuộc danh mục này trong kỳ lọc
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {currentTabOrders.length > 0 && (
                      <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-black">
                        <tr>
                          <td colSpan={5} className="p-3 text-[10px] text-slate-700 uppercase">
                            Tổng cộng ({currentTabOrders.length} đơn)
                          </td>
                          <td className="p-3 text-right text-slate-800">{currentTabTotalGMV.toLocaleString('vi-VN')}đ</td>
                          <td className="p-3 text-right text-violet-700 text-sm">
                            {commTabFilter === 'REFUNDED' ? '0đ' : `+${currentTabTotalComm.toLocaleString('vi-VN')}đ`}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  )
}
