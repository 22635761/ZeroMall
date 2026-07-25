import React, { useState } from 'react'

interface PlatformVouchersTabProps {
  platformVouchers: any[]
  fetchVouchers: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const PlatformVouchersTab: React.FC<PlatformVouchersTabProps> = ({
  platformVouchers,
  fetchVouchers,
  triggerAuditLog
}) => {
  const [newVoucherCode, setNewVoucherCode] = useState('')
  const [newVoucherDiscount, setNewVoucherDiscount] = useState(0)
  const [targetUserId, setTargetUserId] = useState('')
  const [isGoodwill, setIsGoodwill] = useState(false)

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
      <div className="flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎟️ Quản lý Voucher toàn sàn & CSKH Đền bù</h3>
          <button
            onClick={() => setIsGoodwill(!isGoodwill)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              isGoodwill ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isGoodwill ? '🎁 Chế độ: CSKH Đền Bù 1-1' : '🌐 Chế độ: Voucher Toàn Sàn'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 w-full">
          <input
            type="text"
            placeholder="Mã Voucher (Ví dụ: ZERO50)..."
            value={newVoucherCode}
            onChange={(e) => setNewVoucherCode(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
          />
          <input
            type="number"
            placeholder="Số tiền giảm (đ)..."
            value={newVoucherDiscount}
            onChange={(e) => setNewVoucherDiscount(Number(e.target.value))}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden w-28"
          />
          {isGoodwill && (
            <input
              type="text"
              placeholder="Nhập ID User nhận (CSKH Đền bù)..."
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="px-3.5 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold focus:outline-hidden text-purple-700 w-52"
            />
          )}
          <button
            onClick={async () => {
              if (!newVoucherCode.trim() || newVoucherDiscount <= 0) return
              if (isGoodwill && !targetUserId.trim()) {
                alert('Vui lòng nhập User ID để cấp Voucher Đền Bù CSKH!')
                return
              }
              try {
                const res = await fetch('http://localhost:8000/discounts?shopId=PLATFORM', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: isGoodwill ? 'Voucher CSKH Đền Bù 1-1' : 'Voucher Toàn Sàn ZeroMall',
                    code: newVoucherCode,
                    type: 'fixed',
                    value: newVoucherDiscount,
                    minSpend: 0,
                    usageLimit: isGoodwill ? 1 : 1000,
                    targetUserId: isGoodwill ? targetUserId.trim() : undefined,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 86400000 * 30).toISOString()
                  })
                })
                if (res.ok) {
                  await triggerAuditLog(`Tạo voucher ${isGoodwill ? `CSKH Đền bù cho User "${targetUserId}"` : 'toàn sàn'} "${newVoucherCode}" giảm ${newVoucherDiscount}đ`)
                  fetchVouchers()
                  setNewVoucherCode('')
                  setNewVoucherDiscount(0)
                  setTargetUserId('')
                  alert('Tạo voucher thành công!')
                }
              } catch (err: any) {
                alert(err.message)
              }
            }}
            className={`px-3.5 py-1.5 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs ${
              isGoodwill ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isGoodwill ? '🎁 Cấp Voucher CSKH' : 'Tạo Voucher Sàn'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã Code</th>
              <th className="pb-3 text-right">Giá Trị Giảm</th>
              <th className="pb-3 text-right">Lượt Dùng</th>
              <th className="pb-3">Hạn sử dụng</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {platformVouchers.map(v => (
              <tr key={v.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono font-black text-slate-800">{v.code}</td>
                <td className="py-3.5 text-right font-bold text-emerald-600">-{Number(v.value).toLocaleString('vi-VN')}đ</td>
                <td className="py-3.5 text-right font-semibold text-slate-700">{v.usedCount || 0} / {v.usageLimit}</td>
                <td className="py-3.5 font-semibold text-slate-500">{new Date(v.endDate).toLocaleDateString('vi-VN')}</td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Xóa voucher "${v.code}"?`)) {
                        try {
                          const res = await fetch(`http://localhost:8000/discounts/${v.id}`, {
                            method: 'DELETE'
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Xóa voucher toàn sàn "${v.code}"`)
                            fetchVouchers()
                            alert('Đã xóa voucher thành công!')
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
