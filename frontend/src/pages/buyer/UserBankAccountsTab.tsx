import React from 'react'
import { BuyerBankAccounts } from '../../components/buyer/BuyerBankAccounts'

interface UserBankAccountsTabProps {
  user: any
}

export const UserBankAccountsTab: React.FC<UserBankAccountsTabProps> = ({ user }) => {
  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800">Tài Khoản Ngân Hàng Thụ Hưởng</h2>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý danh sách tài khoản ngân hàng dùng để nhận khoản rút tiền từ Ví ZeroMall Pay
        </p>
      </div>

      {/* Main Bank Accounts Management Component */}
      <BuyerBankAccounts userId={user?.id || ''} />
    </div>
  )
}
