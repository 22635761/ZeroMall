import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { getLinkedBankAccounts, type LinkedBankAccount } from './ShopBankAccounts'

interface ShopWalletProps {
  user: any
  onNavigateToBankAccounts?: () => void
}

interface Wallet {
  id: string
  buyerId: string
  balance: number
  onHoldBalance: number
  createdAt: string
  updatedAt: string
}

interface WalletTransaction {
  id: string
  walletId: string
  amount: number
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND' | 'WITHDRAW' | 'REVENUE'
  description: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  createdAt: string
}

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

export const ShopWallet: React.FC<ShopWalletProps> = ({ user, onNavigateToBankAccounts }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Linked bank accounts state
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedBankAccount[]>([])
  const [selectedBankId, setSelectedBankId] = useState<string>('')
  
  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('Vietcombank')
  const [bankAccount, setBankAccount] = useState('')
  const [accountName, setAccountName] = useState('')
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const shopId = user?.shopId || user?.id || 'shop-test-id'

  const fetchWalletData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch wallet balance (using shopId as the buyerId key for shop wallet)
      const balanceRes = await fetch(`${API_BASE_URL}/payments/wallet/${shopId}`)
      if (balanceRes.ok) {
        const data = await balanceRes.json()
        setWallet(data)
      }

      // 2. Fetch transactions
      const txRes = await fetch(`${API_BASE_URL}/payments/wallet/${shopId}/transactions`)
      if (txRes.ok) {
        const data = await txRes.json()
        setTransactions(data)
      }

      // 3. Fetch withdrawal requests
      const withdrawRes = await fetch(`${API_BASE_URL}/payments/withdraw?shopId=${shopId}`)
      if (withdrawRes.ok) {
        const data = await withdrawRes.json()
        setWithdrawRequests(data)
      }
    } catch (e) {
      console.error('Error fetching shop wallet data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
    const loadedBanks = getLinkedBankAccounts(shopId)
    setLinkedAccounts(loadedBanks)
    if (loadedBanks.length > 0) {
      const defaultBank = loadedBanks.find(b => b.isDefault) || loadedBanks[0]
      setSelectedBankId(defaultBank.id)
      setBankName(defaultBank.bankName)
      setBankAccount(defaultBank.accountNumber)
      setAccountName(defaultBank.accountName)
    }
  }, [shopId])

  const handleSelectLinkedBank = (accId: string) => {
    setSelectedBankId(accId)
    const found = linkedAccounts.find(a => a.id === accId)
    if (found) {
      setBankName(found.bankName)
      setBankAccount(found.accountNumber)
      setAccountName(found.accountName)
    }
  }

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionMessage(null)

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 2000) {
      setActionMessage({ text: 'Số tiền rút tối thiểu là 2.000đ', type: 'error' })
      return
    }

    if (wallet && wallet.balance < amount) {
      setActionMessage({ text: 'Số dư ví doanh thu không đủ để thực hiện yêu cầu rút tiền này!', type: 'error' })
      return
    }

    if (!bankAccount.trim() || !accountName.trim()) {
      setActionMessage({ text: 'Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản ngân hàng!', type: 'error' })
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/payments/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          amount,
          bankName,
          bankAccount: bankAccount.trim(),
          accountName: accountName.trim().toUpperCase()
        })
      })

      if (res.ok) {
        setActionMessage({ text: 'Tạo yêu cầu rút tiền thành công! Vui lòng chờ Admin phê duyệt.', type: 'success' })
        setWithdrawAmount('')
        setBankAccount('')
        setAccountName('')
        fetchWalletData()
      } else {
        const data = await res.json()
        setActionMessage({ text: data.message || 'Lỗi khi tạo yêu cầu rút tiền.', type: 'error' })
      }
    } catch (err) {
      setActionMessage({ text: 'Lỗi kết nối mạng khi tạo yêu cầu rút tiền.', type: 'error' })
    }
  }

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  return (
    <div className="space-y-6 text-left text-xs font-semibold text-slate-700">
      
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-450">Đang tải dữ liệu tài chính của Shop...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Balance & Withdraw Form (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Shop Balance Card */}
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 text-[120px] pointer-events-none select-none">
                🪙
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Doanh Thu Khả Dụng (Có thể rút)</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {wallet ? formatMoney(wallet.balance) : '0đ'}
              </h3>
              <p className="text-[9px] opacity-75 mt-2">Số dư sau khi trừ chiết khấu sàn, bạn có thể tạo yêu cầu rút tiền về ngân hàng.</p>
            </div>

            {/* On-Hold Balance Card */}
            {wallet && wallet.onHoldBalance > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg shrink-0">
                    🔒
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Đang tạm giữ (Đóng băng)</p>
                    <p className="text-[9px] text-amber-600 mt-0.5">Sẽ tự động giải ngân sau 3 ngày nếu khách không khiếu nại,<br/>hoặc ngay khi khách đánh giá sản phẩm.</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-xl text-amber-700">{formatMoney(wallet.onHoldBalance)}</p>
                  <p className="text-[9px] text-amber-500 font-semibold mt-0.5">Chưa thể rút</p>
                </div>
              </div>
            )}

            {/* Withdraw Request Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span>🏦</span> Yêu Cầu Rút Tiền Về Ngân Hàng
              </h4>

              {actionMessage && (
                <div className={`p-2.5 rounded-xl text-[11px] border ${
                  actionMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {actionMessage.text}
                </div>
              )}

              <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Số tiền rút (VND)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Tối thiểu 2,000đ"
                      className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 font-bold text-slate-800"
                      required
                      min="2000"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-bold">đ</span>
                  </div>
                </div>

                {/* Selecting from Linked Bank Accounts */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Chọn ngân hàng đã liên kết *</label>
                    {onNavigateToBankAccounts && (
                      <button
                        type="button"
                        onClick={onNavigateToBankAccounts}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        ＋ Quản lý ngân hàng
                      </button>
                    )}
                  </div>

                  {linkedAccounts.length > 0 ? (
                    <select
                      value={selectedBankId}
                      onChange={(e) => handleSelectLinkedBank(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      {linkedAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} — {acc.accountNumber} ({acc.accountName}) {acc.isDefault ? '[Mặc Định]' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-left">
                      <p className="text-[11px] font-bold text-amber-800">⚠️ Bạn chưa có tài khoản ngân hàng liên kết</p>
                      {onNavigateToBankAccounts && (
                        <button
                          type="button"
                          onClick={onNavigateToBankAccounts}
                          className="px-3 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg hover:bg-amber-500 transition cursor-pointer"
                        >
                          🔗 Thêm ngân hàng ngay
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Bank Details Preview Card */}
                {bankAccount && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 text-left text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Ngân Hàng:</span>
                      <span className="font-extrabold text-slate-800 font-sans">{bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Số Tài Khoản:</span>
                      <span className="font-black text-emerald-700 tracking-wide">{bankAccount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Chủ Tài Khoản:</span>
                      <span className="font-bold text-slate-700 font-sans uppercase">{accountName}</span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition duration-150 shadow-md cursor-pointer text-xs"
                >
                  Gửi Yêu Cầu Rút Tiền
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Withdrawals & Transaction History (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Withdraw Requests List */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span>⏳</span> Yêu Cầu Rút Tiền Đang Xử Lý
              </h4>

              {withdrawRequests.length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-semibold text-[11px]">
                  Chưa có yêu cầu rút tiền nào được tạo.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {withdrawRequests.map(req => {
                    const statusColor = 
                      req.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                      req.status === 'PENDING' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                      'text-rose-600 bg-rose-50 border-rose-100'
                    
                    const statusLabel = 
                      req.status === 'APPROVED' ? 'Đã duyệt' :
                      req.status === 'PENDING' ? 'Chờ duyệt' : 'Bị từ chối'

                    return (
                      <div 
                        key={req.id}
                        className="p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">
                            Rút {formatMoney(req.amount)} về {req.bankName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            STK: {req.bankAccount} | {req.accountName} - {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <span className={`border px-2 py-0.5 rounded text-[9px] font-black uppercase ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Wallet Transactions List */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span>📋</span> Nhật Ký Giao Dịch Doanh Thu
              </h4>

              {transactions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-semibold text-[11px]">
                  Chưa có nhật ký giao dịch tài chính.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {transactions.map(tx => {
                    const isCredit = tx.type === 'REVENUE' || tx.type === 'DEPOSIT' || tx.type === 'REFUND'
                    const label = 
                      tx.type === 'REVENUE' ? 'Doanh số bán' :
                      tx.type === 'WITHDRAW' ? 'Rút tiền' :
                      tx.type === 'DEPOSIT' ? 'Nạp tiền' : 'Hoàn trả'
                    
                    return (
                      <div 
                        key={tx.id}
                        className="p-2.5 border border-slate-50 hover:bg-slate-50/40 rounded-lg flex items-center justify-between gap-4 transition"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 truncate max-w-[280px]">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Loại: {label} | {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black text-sm tracking-tight ${
                            isCredit ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isCredit ? '+' : '-'}{formatMoney(tx.amount)}
                          </p>
                          <span className={`text-[9px] font-bold ${tx.status === 'PENDING' ? 'text-amber-500' : tx.status === 'SUCCESS' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {tx.status === 'PENDING' ? 'Chờ xử lý' : tx.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
