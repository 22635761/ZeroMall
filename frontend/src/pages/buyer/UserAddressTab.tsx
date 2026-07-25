import React, { useState, useEffect } from 'react'
import type { ShippingAddress } from '../../models/address.model'

interface UserAddressTabProps {
  user: any
}

export const UserAddressTab: React.FC<UserAddressTabProps> = ({ user }) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [activeAddressId, setActiveAddressId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState('')
  const [details, setDetails] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load from localStorage (shared with CartPage checkout)
  useEffect(() => {
    try {
      const savedAddresses = localStorage.getItem('zm_user_addresses')
      if (savedAddresses) {
        const parsed = JSON.parse(savedAddresses)
        setAddresses(parsed)
      } else {
        // Fallback default address if empty
        const initialAddr: ShippingAddress = {
          id: 'addr_default',
          name: user?.name || 'Vũ Quốc Cường',
          phone: user?.phoneNumber || '0964579675',
          region: 'Hồ Chí Minh, Quận 1, Phường Bến Nghé',
          details: 'Số 123 Đường Lê Lợi',
          isDefault: true,
        }
        setAddresses([initialAddr])
        localStorage.setItem('zm_user_addresses', JSON.stringify([initialAddr]))
      }

      const savedActiveId = localStorage.getItem('zm_active_address_id')
      if (savedActiveId) {
        setActiveAddressId(savedActiveId)
      } else if (addresses.length > 0) {
        const def = addresses.find(a => a.isDefault) || addresses[0]
        setActiveAddressId(def.id)
      }
    } catch (e) {
      console.error('Error loading addresses:', e)
    }
  }, [user])

  const saveAddresses = (updatedList: ShippingAddress[], newActiveId?: string) => {
    setAddresses(updatedList)
    localStorage.setItem('zm_user_addresses', JSON.stringify(updatedList))
    
    const activeId = newActiveId || activeAddressId || (updatedList.find(a => a.isDefault)?.id || updatedList[0]?.id || '')
    setActiveAddressId(activeId)
    localStorage.setItem('zm_active_address_id', activeId)
  }

  const handleOpenAddModal = () => {
    setEditingAddress(null)
    setName(user?.name || '')
    setPhone(user?.phoneNumber || '')
    setRegion('Hồ Chí Minh, Quận 1')
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

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !region.trim() || !details.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin địa chỉ!')
      return
    }

    if (editingAddress) {
      // Edit existing
      let updated = addresses.map(a => {
        if (a.id === editingAddress.id) {
          return {
            ...a,
            name: name.trim(),
            phone: phone.trim(),
            region: region.trim(),
            details: details.trim(),
            isDefault: isDefault ? true : a.isDefault,
          }
        }
        return isDefault ? { ...a, isDefault: false } : a
      })
      saveAddresses(updated, isDefault ? editingAddress.id : undefined)
      setMessage({ text: 'Cập nhật địa chỉ nhận hàng thành công!', type: 'success' })
    } else {
      // Add new
      const newId = `addr_${Date.now()}_${Math.random().toString(36).substring(7)}`
      let updated = [...addresses]
      if (isDefault) {
        updated = updated.map(a => ({ ...a, isDefault: false }))
      }
      const newAddr: ShippingAddress = {
        id: newId,
        name: name.trim(),
        phone: phone.trim(),
        region: region.trim(),
        details: details.trim(),
        isDefault: isDefault || addresses.length === 0,
      }
      updated.push(newAddr)
      saveAddresses(updated, newAddr.isDefault ? newId : undefined)
      setMessage({ text: 'Thêm địa chỉ giao hàng mới thành công!', type: 'success' })
    }

    setShowModal(false)
  }

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      alert('Bạn phải giữ lại ít nhất 1 địa chỉ giao hàng!')
      return
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return

    const updated = addresses.filter(a => a.id !== id)
    if (!updated.some(a => a.isDefault)) {
      updated[0].isDefault = true
    }
    saveAddresses(updated)
    setMessage({ text: 'Đã xóa địa chỉ thành công!', type: 'success' })
  }

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    }))
    saveAddresses(updated, id)
    setMessage({ text: 'Đã đặt địa chỉ mặc định mới cho các đơn hàng!', type: 'success' })
  }

  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      
      {/* Header */}
      <div className="pb-5 border-b border-slate-200/60 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Địa Chỉ Của Tôi</h2>
          <p className="text-xs text-slate-500 mt-1">Quản lý địa chỉ giao hàng mặc định cho các đơn mua</p>
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

      {/* Address List */}
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-sm text-xs transition cursor-pointer"
                >
                  Trở Lại
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-bold rounded-sm text-xs transition cursor-pointer shadow-3xs"
                >
                  Hoàn Thành
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
