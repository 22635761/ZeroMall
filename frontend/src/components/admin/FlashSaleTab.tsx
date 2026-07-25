import React, { useState } from 'react'

interface FlashSaleTabProps {
  flashSales: any[]
  fetchFlashSales: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const FlashSaleTab: React.FC<FlashSaleTabProps> = ({ flashSales, fetchFlashSales, triggerAuditLog }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTimeSlot, setNewTimeSlot] = useState('')

  // Tự động tính toán trạng thái dựa trên giờ thực của hệ thống (Real-time Clock)
  const getCalculatedStatus = (timeSlotStr: string, manualStatus: string) => {
    try {
      const parts = timeSlotStr.split('-').map(s => s.trim())
      if (parts.length === 2) {
        const [startStr, endStr] = parts
        const [startH] = startStr.split(':').map(Number)
        const [endH] = endStr.split(':').map(Number)
        
        const nowHour = new Date().getHours()

        if (nowHour >= startH && nowHour < endH) {
          return { status: 'RUNNING', label: '🔥 ĐANG CHẠY (Thực tế)', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse' }
        } else if (nowHour < startH) {
          return { status: 'UPCOMING', label: '⏳ SẮP DIỄN RA (Thực tế)', color: 'bg-amber-50 text-amber-600 border border-amber-200' }
        } else if (nowHour >= endH) {
          return { status: 'ENDED', label: '🔒 ĐÃ KẾT THÚC (Thực tế)', color: 'bg-slate-100 text-slate-500' }
        }
      }
    } catch (e) {}

    // Fallback nếu có manual status
    return {
      status: manualStatus,
      label: manualStatus === 'RUNNING' ? '🔥 ĐANG CHẠY' : manualStatus === 'ENDED' ? '🔒 ĐÃ KẾT THÚC' : '⏳ SẮP DIỄN RA',
      color: manualStatus === 'RUNNING' ? 'bg-emerald-50 text-emerald-600' : manualStatus === 'ENDED' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'
    }
  }

  // Định dạng lại ID ngắn gọn (VD: #FS-001) nếu là UUID
  const formatId = (id: string, index: number) => {
    if (!id) return `#FS-00${index + 1}`
    if (id.startsWith('FS-')) return `#${id}`
    return `#FS-00${index + 1}`
  }

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTimeSlot.trim()) return
    try {
      const res = await fetch('http://localhost:8000/products/flash-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot: newTimeSlot })
      })
      const data = await res.json()
      if (res.ok) {
        await triggerAuditLog(`Tạo khung giờ Flash Sale mới "${newTimeSlot}"`)
        fetchFlashSales()
        setNewTimeSlot('')
        setShowAddModal(false)
        alert('⚡ Đã tạo khung giờ Flash Sale mới thành công!')
      } else {
        alert(`⚠️ Không thể tạo: ${data.message || 'Khung giờ Flash Sale bị trùng lặp thời gian!'}`)
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi: ${err.message}`)
    }
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6 text-left font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
            ⚡ Cấu hình giờ vàng Flash Sale Sàn
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Trạng thái hoạt động được tự động kích hoạt theo đồng hồ hệ thống real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs flex items-center gap-1.5 shrink-0"
        >
          ➕ Thêm khung giờ mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã ID</th>
              <th className="pb-3">Khung Giờ Vàng</th>
              <th className="pb-3 text-right">Lượt Sản Phẩm Đăng Ký</th>
              <th className="pb-3 text-center">Trạng thái tự động (Real-Time)</th>
              <th className="pb-3 text-center">Cấu hình trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {flashSales.map((slot, idx) => {
              const statusInfo = getCalculatedStatus(slot.timeSlot, slot.status)
              return (
                <tr key={slot.id} className="hover:bg-slate-50/10">
                  <td className="py-3.5 font-mono text-[11px] font-bold text-slate-800">{formatId(slot.id, idx)}</td>
                  <td className="py-3.5 font-black text-slate-850">{slot.timeSlot}</td>
                  <td className="py-3.5 text-right font-black text-violet-700">{slot.productsCount || 0} sản phẩm</td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <div className="flex justify-center">
                      <select
                        value={slot.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value
                          try {
                            const res = await fetch(`http://localhost:8000/products/flash-sales/${slot.id}/status`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            })
                            if (res.ok) {
                              await triggerAuditLog(`Cập nhật trạng thái Flash Sale ID ${slot.id} thành ${newStatus}`)
                              fetchFlashSales()
                              alert('Đã cập nhật cấu hình trạng thái Flash Sale thành công!')
                            }
                          } catch (err: any) {
                            alert(err.message)
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                      >
                        <option value="UPCOMING">Sắp diễn ra</option>
                        <option value="RUNNING">Đang diễn ra</option>
                        <option value="ENDED">Đã kết thúc</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM KHUNG GIỜ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">⚡ Thêm khung giờ Flash Sale</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Chọn hoặc nhập khung giờ</label>
                <select
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 bg-white mb-2"
                >
                  <option value="">-- Chọn khung giờ có sẵn --</option>
                  <option value="00:00 - 09:00">00:00 - 09:00 (Sáng sớm)</option>
                  <option value="09:00 - 15:00">09:00 - 15:00 (Buổi trưa)</option>
                  <option value="15:00 - 21:00">15:00 - 21:00 (Giờ vàng chiều tối)</option>
                  <option value="21:00 - 24:00">21:00 - 24:00 (Đêm muộn)</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="Hoặc nhập thủ công (Ví dụ: 16:00 - 18:00)"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Xác Nhận Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
