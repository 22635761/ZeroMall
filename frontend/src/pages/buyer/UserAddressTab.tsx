import React, { useState, useEffect } from 'react'
import type { ShippingAddress } from '../../models/address.model'
import { API_BASE_URL } from '../../config/api.config'

interface UserAddressTabProps {
  user: any
}

export const UserAddressTab: React.FC<UserAddressTabProps> = ({ user }) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [activeAddressId, setActiveAddressId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [details, setDetails] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Fetch addresses for current user from API
  const fetchAddresses = async () => {
    // Xóa bỏ key cũ không phân biệt user để tránh nhiễm địa chỉ giữa các tài khoản
    try {
      localStorage.removeItem('zm_user_addresses')
      localStorage.removeItem('zm_active_address_id')
    } catch (e) {}

    if (!user?.id) {
      setAddresses([])
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses`)
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
        const def = data.find((a: ShippingAddress) => a.isDefault) || data[0]
        if (def) {
          setActiveAddressId(def.id)
        } else {
          setActiveAddressId('')
        }
        localStorage.setItem(`zm_user_addresses_${user.id}`, JSON.stringify(data))
      } else {
        // Fallback local cache per-user only
        const cached = localStorage.getItem(`zm_user_addresses_${user.id}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          setAddresses(parsed)
        } else {
          setAddresses([])
        }
      }
    } catch (e) {
      console.error('Error loading addresses:', e)
      const cached = localStorage.getItem(`zm_user_addresses_${user.id}`)
      if (cached) {
        try {
          setAddresses(JSON.parse(cached))
        } catch (_) {
          setAddresses([])
        }
      } else {
        setAddresses([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [user?.id])

  const handleOpenAddModal = () => {
    setEditingAddress(null)
    setName(user?.name || '')
    setPhone(user?.phoneNumber || '')
    setRegion('')
    setDetails('')
    setIsDefault(addresses.length === 0)
    setShowModal(true)
  }

  const handleOpenEditModal = (addr: ShippingAddress) => {
    setEditingAddress(addr)
    setName(addr.name)
    setPhone(addr.phone)
    setRegion(addr.region)
    setDetails(addr.details)
    setIsDefault(addr.isDefault)
    setShowModal(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !region.trim() || !details.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin địa chỉ!')
      return
    }

    if (!user?.id) {
      alert('Vui lòng đăng nhập để lưu địa chỉ!')
      return
    }

    setSubmitting(true)
    try {
      if (editingAddress) {
        // Cập nhật địa chỉ hiện có
        const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            region: region.trim(),
            details: details.trim(),
            isDefault,
          }),
        })
        if (!res.ok) throw new Error('Không thể cập nhật địa chỉ')
        setMessage({ text: 'Cập nhật địa chỉ nhận hàng thành công!', type: 'success' })
      } else {
        // Tạo mới địa chỉ
        const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            region: region.trim(),
            details: details.trim(),
            isDefault: isDefault || addresses.length === 0,
          }),
        })
        if (!res.ok) throw new Error('Không thể tạo mới địa chỉ')
        setMessage({ text: 'Thêm địa chỉ giao hàng mới thành công!', type: 'success' })
      }

      setShowModal(false)
      await fetchAddresses()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể lưu địa chỉ'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return

    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Không thể xóa địa chỉ')
      setMessage({ text: 'Đã xóa địa chỉ thành công!', type: 'success' })
      await fetchAddresses()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa địa chỉ'))
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses/${id}/default`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Không thể đặt địa chỉ mặc định')
      setMessage({ text: 'Đã đặt địa chỉ mặc định mới cho các đơn hàng!', type: 'success' })
      await fetchAddresses()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể cập nhật'))
    }
  }

  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      
      {/* Header */}
      <div className="pb-5 border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Địa Chỉ Của Tôi</h2>
          <p className="text-xs text-slate-500 mt-1">Quản lý địa chỉ giao hàng cho các đơn mua sắm</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-bold rounded-sm text-xs transition cursor-pointer shadow-3xs flex items-center gap-1.5"
        >
          <span>+</span> Thêm địa chỉ mới
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-sm text-xs font-semibold border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
          Đang tải danh sách địa chỉ của bạn...
        </div>
      )}

      {/* Empty State when user has NO addresses */}
      {!loading && addresses.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-lg p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-orange-50 text-[#ee4d2d] rounded-full flex items-center justify-center mx-auto text-2xl">
            📍
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Bạn chưa có địa chỉ nhận hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hãy thêm địa chỉ giao hàng chính xác để các đơn vị vận chuyển giao hàng tận nơi cho bạn.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-bold rounded-sm text-xs transition cursor-pointer shadow-xs"
          >
            + Thêm Địa Chỉ Mới Ngay
          </button>
        </div>
      )}

      {/* Address List */}
      {!loading && addresses.length > 0 && (
        <div className="space-y-4">
          {addresses.map(addr => {
            const isSelectedDefault = addr.isDefault || addr.id === activeAddressId

            return (
              <div
                key={addr.id}
                className={`p-5 border rounded-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition ${
                  isSelectedDefault ? 'border-[#ee4d2d]/40 bg-orange-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800">{addr.name}</span>
                    <div className="h-3 w-px bg-slate-300"></div>
                    <span className="text-xs font-semibold text-slate-500">{addr.phone}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {addr.details}
                  </p>

                  <p className="text-xs text-slate-400 font-normal">
                    {addr.region}
                  </p>

                  {isSelectedDefault && (
                    <span className="inline-block px-2 py-0.5 border border-[#ee4d2d] text-[#ee4d2d] text-[10px] font-bold rounded-xs uppercase tracking-wider">
                      Mặc Định
                    </span>
                  )}
                </div>

                {/* Action buttons right */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => handleOpenEditModal(addr)}
                      className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                    >
                      Cập nhật
                    </button>
                    {!isSelectedDefault && (
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {!isSelectedDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="px-3 py-1 border border-slate-300 hover:border-[#ee4d2d] text-slate-600 hover:text-[#ee4d2d] text-[11px] font-medium rounded-sm transition cursor-pointer"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden border border-slate-200 text-left font-sans animate-in zoom-in-95 duration-150">
            
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingAddress ? 'Cập Nhật Địa Chỉ Giao Hàng' : 'Địa Chỉ Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 block">Họ và tên người nhận</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#ee4d2d]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 block">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#ee4d2d]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">Tỉnh/Thành phố, Quận/Huyện, Phường/Xã</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Ví dụ: TPHCM, Quận 1, Phường Bến Nghé"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 block">Địa chỉ chi tiết (Số nhà, tên đường...)</label>
                <textarea
                  rows={2}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ví dụ: Tòa nhà Bitexco, Số 2 Hải Triều"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-[#ee4d2d] w-4 h-4"
                />
                <span className="text-slate-600 font-medium">Đặt làm địa chỉ mặc định</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-sm text-xs transition cursor-pointer"
                >
                  Trở Lại
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-bold rounded-sm text-xs transition cursor-pointer shadow-3xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Hoàn Thành'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
