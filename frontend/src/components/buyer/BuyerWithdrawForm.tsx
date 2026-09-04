import React, { useState, useEffect } from 'react'
import type { BankAccount } from './BuyerBankAccounts'
import { API_BASE_URL } from '../../config/api.config'

interface WithdrawRequest {
  id: string
  shopId: string
  amount: number
  bankName: string
  bankAccount: string
  accountName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

interface BuyerWithdrawFormProps {
  userId: string
  walletBalance: number
  bankAccounts?: BankAccount[]
  onWithdrawSuccess: () => void
}

export const BuyerWithdrawForm: React.FC<BuyerWithdrawFormProps> = ({
  userId,
  walletBalance,
  bankAccounts: initialBankAccounts,
  onWithdrawSuccess,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts || [])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load from localStorage
  useEffect(() => {
    if (initialBankAccounts && initialBankAccounts.length > 0) {
      setBankAccounts(initialBankAccounts)
    } else {
      try {
        const stored = localStorage.getItem(`zeromall_bank_accounts_${userId}`)
        if (stored) {
          setBankAccounts(JSON.parse(stored))
        }
      } catch (e) {
        console.error('Error loading bank accounts in withdraw form:', e)
      }
    }
  }, [userId, initialBankAccounts])

  // Auto-select default bank account
  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedAccountId) {
      const defaultAccount = bankAccounts.find(a => a.isDefault) || bankAccounts[0]
      setSelectedAccountId(defaultAccount.id)
    }
  }, [bankAccounts])

  // Fetch withdraw history
  const fetchWithdrawRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdraw?shopId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setWithdrawRequests(data)
      }
    } catch (e) {
      console.error('Error fetching withdraw requests:', e)
    }
  }

  useEffect(() => {
    fetchWithdrawRequests()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionMessage(null)

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 2000) {
      setActionMessage({ text: 'Số tiền rút tối thiểu là 2.000đ', type: 'error' })
      return
    }

    if (amount > walletBalance) {
      setActionMessage({ text: 'Số dư ví không đủ để rút số tiền này!', type: 'error' })
      return
    }

    const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId)
    if (!selectedAccount) {
      setActionMessage({ text: 'Vui lòng chọn tài khoản ngân hàng thụ hưởng!', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: userId, // Wallet uses buyerId as key for both shop and buyer
          amount,
          bankName: selectedAccount.bankName,
          bankAccount: selectedAccount.bankAccount,
          accountName: selectedAccount.accountName,
        }),
      })

      if (res.ok) {
        setActionMessage({ text: `Tạo yêu cầu rút ${amount.toLocaleString('vi-VN')}đ thành công! Vui lòng chờ CSKH phê duyệt.`, type: 'success' })
        setWithdrawAmount('')
        fetchWithdrawRequests()
        onWithdrawSuccess()
      } else {
        const data = await res.json()
        setActionMessage({ text: data.message || 'Lỗi khi tạo yêu cầu rút tiền.', type: 'error' })
      }
    } catch (err) {
      setActionMessage({ text: 'Lỗi kết nối mạng khi tạo yêu cầu rút tiền.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + 'đ'

  const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId)

  return (
    <div className="space-y-5">
      {/* Withdraw Form */}
      <div className="bg-white border border-slate-200/80 rounded-sm p-5 space-y-4 shadow-3xs">
        <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <span>💸</span> Rút Tiền Về Ngân Hàng
        </h4>

        {bankAccounts.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <span className="text-3xl block opacity-50">🏦</span>
            <p className="text-xs text-slate-500 font-bold">Bạn chưa thiết lập tài khoản ngân hàng thụ hưởng!</p>
            <p className="text-[10px] text-slate-400 font-medium">Vui lòng thêm ngân hàng tại phần <strong>Tài Khoản Của Tôi &gt; Ngân Hàng</strong> để rút tiền.</p>
            <a
              href="/user/account/payment"
              className="inline-block mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm text-[10px] transition cursor-pointer"
            >
              + Thêm Ngân Hàng Ngay
            </a>
          </div>
        ) : (
          <>
            {actionMessage && (
              <div className={`p-2.5 rounded-sm text-[11px] font-semibold border ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Select Bank Account */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Tài khoản thụ hưởng</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800 bg-white"
                >
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} ({account.bankCode}) - {account.bankAccount} - {account.accountName}
                      {account.isDefault ? ' ⭐' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Account Preview */}
              {selectedAccount && (
                <div className="bg-slate-50 border border-slate-100 rounded-sm p-3 text-[10px] font-semibold text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="font-bold text-slate-800">{selectedAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <span className="font-bold text-slate-800">{selectedAccount.bankAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{selectedAccount.accountName}</span>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Số tiền rút (VND)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Tối thiểu 2,000đ"
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800"
                    required
                    min="2000"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">đ</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Số dư khả dụng: <span className="font-bold text-emerald-600">{formatMoney(walletBalance)}</span>
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[100000, 500000, 1000000, walletBalance].map((amount, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setWithdrawAmount(Math.floor(amount).toString())}
                    className={`py-1.5 border rounded-sm text-[10px] font-bold transition cursor-pointer ${
                      idx === 3
                        ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-emerald-50/30'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-600 hover:text-emerald-600'
                    }`}
                  >
                    {idx === 3 ? 'Rút hết' : formatMoney(amount)}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || bankAccounts.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-sm text-xs transition shadow-3xs cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  '💸 Gửi Yêu Cầu Rút Tiền'
                )}
              </button>
            </form>

            {/* Info Notice */}
            <div className="border border-amber-200 bg-amber-50/50 rounded-sm p-3 text-[10px] font-medium text-amber-700 leading-relaxed">
              ⚠️ <strong>Lưu ý:</strong> Số tiền sẽ được tạm giữ từ ví ngay khi gửi yêu cầu. Nếu yêu cầu bị từ chối, tiền sẽ được hoàn lại vào ví. Thời gian xử lý: 1-3 ngày làm việc.
            </div>
          </>
        )}
      </div>

      {/* Withdraw Request History */}
      {withdrawRequests.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-sm p-5 space-y-4 shadow-3xs">
          <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <span>⏳</span> Lịch Sử Yêu Cầu Rút Tiền
          </h4>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {withdrawRequests.map(req => {
              const statusColor =
                req.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                req.status === 'PENDING' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                'text-rose-600 bg-rose-50 border-rose-100'

              const statusLabel =
                req.status === 'APPROVED' ? '✅ Đã duyệt' :
                req.status === 'PENDING' ? '⏳ Chờ duyệt' : '❌ Bị từ chối'

              return (
                <div
                  key={req.id}
                  className="p-3 border border-slate-100 rounded-sm flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      Rút {formatMoney(req.amount)} về {req.bankName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      STK: {req.bankAccount} • {req.accountName} • {new Date(req.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={`border px-2 py-0.5 rounded-sm text-[9px] font-black shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
