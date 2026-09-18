import React from 'react'
import type { ShippingAddress } from '../../../models/address.model'

interface AddressListViewProps {
  addresses: ShippingAddress[]
  tempSelectedAddressId: string
  setTempSelectedAddressId: (id: string) => void
  onEditAddress: (addr: ShippingAddress) => void
}

export const AddressListView: React.FC<AddressListViewProps> = ({
  addresses,
  tempSelectedAddressId,
  setTempSelectedAddressId,
  onEditAddress
}) => {
  return (
    <div className="space-y-4">
      {addresses.map((addr) => (
        <div
          key={addr.id}
          onClick={() => setTempSelectedAddressId(addr.id)}
          className={`flex items-start gap-4 p-5 border rounded-xl hover:bg-slate-50/50 transition cursor-pointer relative ${
            tempSelectedAddressId === addr.id ? 'border-[#ee4d2d]/60 bg-[#feeee9]/10' : 'border-slate-100 bg-white'
          }`}
        >
          <div className="mt-1 flex items-center justify-center">
            <input
              type="radio"
              name="checkout_address"
              checked={tempSelectedAddressId === addr.id}
              onChange={() => setTempSelectedAddressId(addr.id)}
              className="w-4.5 h-4.5 text-[#ee4d2d] focus:ring-[#ee4d2d] border-slate-300 rounded-full cursor-pointer accent-[#ee4d2d]"
            />
          </div>
          <div className="flex-1 space-y-1 text-left text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-850 text-base">{addr.name}</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-500 font-semibold">{addr.phone}</span>
            </div>
            <p className="text-slate-605 font-medium leading-relaxed pr-16">
              {addr.details}
            </p>
            <p className="text-slate-500 font-medium text-xs">
              {addr.region}
            </p>
            {addr.isDefault && (
              <span className="inline-block mt-1 text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d]/60 px-1.5 py-0.2 rounded-sm uppercase tracking-wider bg-[#feeee9]/20">
                Mặc định
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEditAddress(addr)
            }}
            className="text-sm text-sky-655 hover:text-sky-500 hover:underline font-bold transition absolute top-5 right-5 cursor-pointer"
          >
            Cập nhật
          </button>
        </div>
      ))}
    </div>
  )
}
