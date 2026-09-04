import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface CsWithdrawalsTabProps {
  withdrawLoading: boolean
  withdrawals: any[]
  actionLoadingId: string | null
  handleApproveWithdrawal: (reqId: string, status: string) => Promise<void>
}

// Convert raw UUID request ID to clean numeric display ID (e.g. #WR-849201)
const formatWithdrawId = (id: string) => {
  if (!id) return '#WR-000000'
  if (id.startsWith('#WR-')) return id
  const hex = id.replace(/-/g, '').substring(0, 8)
  const num = (parseInt(hex, 16) % 899999) + 100000
  return `#WR-${num}`
}

// Convert raw UUID shop/user ID to clean numeric display ID (e.g. #SHP-4921 / #USR-1082)
const formatOwnerId = (id: string, isShop: boolean) => {
  if (!id) return isShop ? '#SHP-0000' : '#USR-0000'
  if (id.startsWith('#SHP-') || id.startsWith('#USR-') || id.startsWith('#SHOP-') || id.startsWith('#USER-')) return id
  const hex = id.replace(/-/g, '').substring(0, 6)
  const num = (parseInt(hex, 16) % 8999) + 1000
  return isShop ? `#SHP-${num}` : `#USR-${num}`
}

// Map bank name to standard VietQR Bank ID
const getVietQrBankId = (bankName: string = ''): string => {
  const name = bankName.toLowerCase()
  if (name.includes('vietcombank') || name.includes('vcb')) return 'VCB'
  if (name.includes('mbbank') || name.includes('mb')) return 'MB'
  if (name.includes('techcombank') || name.includes('tcb')) return 'TCB'
  if (name.includes('vietinbank') || name.includes('ctg')) return 'CTG'
  if (name.includes('bidv') || name.includes('bid')) return 'BIDV'
  if (name.includes('agribank') || name.includes('arg')) return 'VAB'
  if (name.includes('tpbank') || name.includes('tpb')) return 'TPB'
  if (name.includes('acb')) return 'ACB'
  if (name.includes('sacombank') || name.includes('stb')) return 'STB'
  if (name.includes('vpbank') || name.includes('vpb')) return 'VPB'
  return 'MB'
}

export const CsWithdrawalsTab: React.FC<CsWithdrawalsTabProps> = ({
  withdrawLoading,
  withdrawals,
  actionLoadingId,
  handleApproveWithdrawal
}) => {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null)
  const [payoutQrTarget, setPayoutQrTarget] = useState<any | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'SHOP' | 'BUYER'>('ALL')

  // Auto Polling: Tự động phát hiện chuyển khoản thành công qua Sepay Webhook
  React.useEffect(() => {
    let intervalId: any
    if (payoutQrTarget && payoutQrTarget.id) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/payments/withdraw/${payoutQrTarget.id}/detail`)
          if (res.ok) {
            const data = await res.json()
            if (data && data.status === 'APPROVED') {
              clearInterval(intervalId)
              alert(`🎉 Ngân hàng đã tự động nhận diện chuyển khoản thành công! Lệnh rút tiền ${formatWithdrawId(payoutQrTarget.id)} đã được giải ngân.`)
              setPayoutQrTarget(null)
              handleApproveWithdrawal(payoutQrTarget.id, 'APPROVED')
            }
          }
        } catch (e) {
          console.error('Error polling withdraw payout status:', e)
        }
      }, 2500)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [payoutQrTarget])

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filterType === 'SHOP') return w.accountType === 'SHOP'
    if (filterType === 'BUYER') return w.accountType === 'BUYER'
    return true
  })

  const handleOpenApproveQrModal = (w: any) => {
    setPayoutQrTarget(w)
    if (selectedWithdrawal) setSelectedWithdrawal(null)
  }

  const handleConfirmPayoutSuccess = async () => {
    if (!payoutQrTarget) return
    await handleApproveWithdrawal(payoutQrTarget.id, 'APPROVED')
    setPayoutQrTarget(null)
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-5 font-sans text-left">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
            <span>💰</span> Phê Duyệt Yêu Cầu Rút Tiền Ví (Shop & Người Mua)
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Danh sách lệnh rút tiền chờ CSKH giải ngân về tài khoản ngân hàng thụ hưởng.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold shrink-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'SHOP', label: '🏪 Shop' },
            { id: 'BUYER', label: '👤 Người mua' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                filterType === tab.id
                  ? 'bg-white text-emerald-600 shadow-3xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {withdrawLoading ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải danh sách rút tiền...</p>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <span className="text-4xl block opacity-50">📬</span>
          <p className="text-sm font-extrabold text-slate-400">Không có yêu cầu rút tiền nào cần xử lý</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                <th className="py-3 px-3">Mã Yêu Cầu</th>
                <th className="py-3 px-3">Đối Tượng Rút</th>
                <th className="py-3 px-3 text-right">Số Tiền Rút</th>
                <th className="py-3 px-3">Thông Tin Ngân Hàng Thụ Hưởng</th>
                <th className="py-3 px-3">Thời Gian Tạo</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWithdrawals.map((w) => {
                const isShop = w.accountType === 'SHOP'
                const displayReqId = formatWithdrawId(w.id)
                const displayOwnerId = formatOwnerId(w.shopId, isShop)

                return (
                  <tr
                    key={w.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer group"
                    onClick={() => setSelectedWithdrawal(w)}
                  >
                    {/* Mã Yêu Cầu */}
                    <td className="py-3.5 px-3">
                      <span className="font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono group-hover:border-emerald-500 group-hover:text-emerald-700 transition">
                        {displayReqId}
                      </span>
                    </td>

                    {/* Đối Tượng Rút */}
                    <td className="py-3.5 px-3 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                          isShop ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {isShop ? '🏪 Shop' : '👤 Người mua'}
                        </span>
                        <span className="font-extrabold text-slate-800 text-xs line-clamp-1">{w.ownerName}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-semibold">
                        ID: <span className="text-slate-600">{displayOwnerId}</span>
                      </p>
                    </td>

                    {/* Số Tiền Rút */}
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-black text-sm text-emerald-600 tracking-tight">
                        {Number(w.amount).toLocaleString('vi-VN')}đ
                      </span>
                    </td>

                    {/* Thông Tin Ngân Hàng */}
                    <td className="py-3.5 px-3 space-y-0.5">
                      <p className="font-bold text-slate-800">
                        {w.bankName} • STK: <span className="font-mono text-emerald-700 font-extrabold">{w.bankAccount}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{w.accountName}</p>
                    </td>

                    {/* Thời Gian Tạo */}
                    <td className="py-3.5 px-3 font-semibold text-slate-500 text-[11px]">
                      {new Date(w.createdAt).toLocaleString('vi-VN')}
                    </td>

                    {/* Trạng Thái */}
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        w.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                        w.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {w.status === 'PENDING' ? '⏳ Chờ duyệt' : 
                         w.status === 'APPROVED' ? '✅ Đã duyệt' : '❌ Đã từ chối'}
                      </span>
                    </td>

                    {/* Thao Tác */}
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center items-center gap-1.5">
                        <button
                          onClick={() => setSelectedWithdrawal(w)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] transition cursor-pointer"
                        >
                          👁️ Chi tiết
                        </button>
                        {w.status === 'PENDING' && (
                          <>
                            <button
                              disabled={actionLoadingId === w.id}
                              onClick={() => handleOpenApproveQrModal(w)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] cursor-pointer disabled:opacity-50 transition shadow-3xs flex items-center gap-1"
                            >
                              <span>📲</span>
                              {actionLoadingId === w.id ? '...' : 'Duyệt QR'}
                            </button>
                            <button
                              disabled={actionLoadingId === w.id}
                              onClick={() => handleApproveWithdrawal(w.id, 'REJECTED')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-200 disabled:opacity-50 transition"
                            >
                              {actionLoadingId === w.id ? '...' : 'Từ chối'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL XEM CHI TIẾT YÊU CẦU RÚT TIỀN ─── */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 text-left font-sans animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-slate-50/80 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">💳</span>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    Chi Tiết Yêu Cầu Rút Tiền {formatWithdrawId(selectedWithdrawal.id)}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono font-semibold">
                    Mã UUID gốc: {selectedWithdrawal.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="text-slate-400 hover:text-slate-600 transition text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Amount Badge */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white text-center shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">Số Tiền Yêu Cầu Rút</p>
                <h3 className="text-3xl font-black mt-1 tracking-tight">
                  {Number(selectedWithdrawal.amount).toLocaleString('vi-VN')}đ
                </h3>
              </div>

              {/* Account info section */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs font-semibold text-slate-700">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Thông Tin Đối Tượng Rút Tiền</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Loại tài khoản:</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedWithdrawal.accountType === 'SHOP'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {selectedWithdrawal.accountType === 'SHOP' ? '🏪 Cửa Hàng (Shop)' : '👤 Người Mua (Buyer)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block text-[10px]">Mã định danh:</span>
                    <span className="font-extrabold text-slate-800 font-mono">
                      {formatOwnerId(selectedWithdrawal.shopId, selectedWithdrawal.accountType === 'SHOP')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200/60 pt-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[11px]">Tên hiển thị:</span>
                    <span className="font-extrabold text-slate-800 text-xs">{selectedWithdrawal.ownerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[11px]">Email liên hệ:</span>
                    <span className="font-semibold text-slate-700">{selectedWithdrawal.ownerEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-[11px]">Số điện thoại:</span>
                    <span className="font-semibold text-slate-700">{selectedWithdrawal.ownerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Bank info section */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 space-y-2.5 text-xs font-semibold text-slate-700">
                <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Tài Khoản Ngân Hàng Thụ Hưởng</p>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium text-[11px]">Tên ngân hàng:</span>
                  <span className="font-extrabold text-slate-800">{selectedWithdrawal.bankName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium text-[11px]">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-emerald-700 text-sm font-mono">{selectedWithdrawal.bankAccount}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedWithdrawal.bankAccount)
                        alert('Đã copy số tài khoản ngân hàng!')
                      }}
                      className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >
                      Copy STK
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium text-[11px]">Chủ tài khoản:</span>
                  <span className="font-black text-slate-800 uppercase tracking-wide">{selectedWithdrawal.accountName}</span>
                </div>

                <div className="flex justify-between items-center border-t border-emerald-100/80 pt-2">
                  <span className="text-slate-400 font-medium text-[11px]">Thời gian yêu cầu:</span>
                  <span className="font-semibold text-slate-600">{new Date(selectedWithdrawal.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Đóng
              </button>

              {selectedWithdrawal.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoadingId === selectedWithdrawal.id}
                    onClick={async () => {
                      await handleApproveWithdrawal(selectedWithdrawal.id, 'REJECTED')
                      setSelectedWithdrawal(null)
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-lg text-xs cursor-pointer transition disabled:opacity-50"
                  >
                    ❌ Từ Chối
                  </button>
                  <button
                    disabled={actionLoadingId === selectedWithdrawal.id}
                    onClick={() => handleOpenApproveQrModal(selectedWithdrawal)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>📲</span> Quét VietQR Giải Ngân
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL VIETQR CHUYỂN KHOẢN GIẢI NGÂN (PAYOUT QR MODAL) ─── */}
      {payoutQrTarget && (() => {
        const reqDisplayId = formatWithdrawId(payoutQrTarget.id)
        const bankId = getVietQrBankId(payoutQrTarget.bankName)
        const transferMemo = `RUTTIEN ZM ${reqDisplayId.replace('#', '')}`
        const amountNum = Number(payoutQrTarget.amount)
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${payoutQrTarget.bankAccount}-compact2.png?amount=${amountNum}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(payoutQrTarget.accountName)}`

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 text-left font-sans animate-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="bg-emerald-50/80 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📲</span>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">Mã VietQR Giải Ngân Rút Tiền</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Quét mã bằng App Ngân Hàng để chuyển khoản giải ngân
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPayoutQrTarget(null)}
                  className="text-slate-400 hover:text-slate-600 transition text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-center">
                
                {/* VietQR Image Container */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl w-fit mx-auto shadow-sm">
                  <img
                    src={qrUrl}
                    alt="VietQR Giải Ngân"
                    className="w-56 h-56 mx-auto object-contain"
                  />
                </div>

                {/* Account Details Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-700 text-left space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Ngân hàng nhận:</span>
                    <span className="font-extrabold text-slate-800">{payoutQrTarget.bankName} ({bankId})</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Số tài khoản:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-emerald-700 font-mono text-sm">{payoutQrTarget.bankAccount}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(payoutQrTarget.bankAccount)
                          alert('Đã copy số tài khoản!')
                        }}
                        className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Copy STK
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                    <span className="font-extrabold text-slate-800 uppercase">{payoutQrTarget.accountName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Số tiền giải ngân:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-emerald-600 text-base">{amountNum.toLocaleString('vi-VN')}đ</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(amountNum))
                          alert('Đã copy số tiền!')
                        }}
                        className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Copy số tiền
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                    <span className="text-slate-400 font-medium">Nội dung CK:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-emerald-700 bg-emerald-100/60 border border-emerald-200 px-2 py-0.5 rounded font-mono text-xs">
                        {transferMemo}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transferMemo)
                          alert('Đã copy nội dung chuyển khoản!')
                        }}
                        className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Auto Detection Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Hệ thống đang tự động theo dõi chuyển khoản ngân hàng...</span>
                </div>

                {/* Instruction */}
                <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-3 text-[10px] font-medium text-emerald-800 text-left leading-relaxed">
                  💡 <strong>Hướng dẫn CSKH:</strong> Dùng ứng dụng Ngân hàng quét mã QR trên $\rightarrow$ Thực hiện chuyển khoản. Hệ thống sẽ <strong>tự động nhận diện & phê duyệt ngay lập tức</strong> mà không cần thao tác thêm.
                </div>

                {/* Action confirm button */}
                <button
                  disabled={actionLoadingId === payoutQrTarget.id}
                  onClick={handleConfirmPayoutSuccess}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoadingId === payoutQrTarget.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    '✅ Xác Nhận Đã Chuyển Khoản Thành Công'
                  )}
                </button>

              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
