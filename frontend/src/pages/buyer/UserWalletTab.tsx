import React, { useState, useEffect } from 'react'
import { BuyerWithdrawForm } from '../../components/buyer/BuyerWithdrawForm'

interface UserWalletTabProps {
  user: any
}

interface Wallet {
  id: string
  buyerId: string
  balance: number
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

export const UserWalletTab: React.FC<UserWalletTabProps> = ({ user }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [activeSection, setActiveSection] = useState<'deposit' | 'withdraw'>('deposit')
  const [sepayConfig, setSepayConfig] = useState({ bankId: 'MB', bankAcc: '0964579675', bankName: 'VU QUOC CUONG' })

  // QR Modal states — same pattern as CartPage Sepay payment
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [activeTxId, setActiveTxId] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [depositMemo, setDepositMemo] = useState('')
  const [depositAmountNum, setDepositAmountNum] = useState(0)
  const [isCreatingTx, setIsCreatingTx] = useState(false)

  const userShortId = user?.id ? user.id.substring(0, 8).toUpperCase() : ''

  const fetchWalletData = async (silent = false) => {
    if (!user?.id) return
    if (!silent) setIsLoading(true)
    try {
      const [balanceRes, txRes, configRes] = await Promise.all([
        fetch(`http://localhost:8000/payments/wallet/${user.id}`),
        fetch(`http://localhost:8000/payments/wallet/${user.id}/transactions`),
        fetch('http://localhost:8000/payments/sepay-config'),
      ])
      if (balanceRes.ok) setWallet(await balanceRes.json())
      if (txRes.ok) setTransactions(await txRes.json())
      if (configRes.ok) setSepayConfig(await configRes.json())
    } catch (e) {
      console.error('Error fetching wallet:', e)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [user])

  // ─── Polling theo transactionId — y hệt CartPage polling orderId ───
  useEffect(() => {
    let intervalId: any
    if (showDepositModal && activeTxId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/payments/wallet/tx/${activeTxId}/status`)
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'SUCCESS') {
              clearInterval(intervalId)
              setShowDepositModal(false)
              setActiveTxId('')
              setDepositAmount('')
              // Reload wallet data sau khi nạp thành công
              await fetchWalletData(true)
              alert(`🎉 Nạp tiền thành công! Ví đã được cộng +${depositAmountNum.toLocaleString('vi-VN')}đ`)
            }
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 3000)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [showDepositModal, activeTxId])

  // ─── Bấm nút Nạp tiền → tạo pending tx trước → hiện QR Modal ───
  const handleOpenDepositModal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < 1000) {
      alert('Vui lòng nhập số tiền nạp tối thiểu 1.000đ')
      return
    }

    setIsCreatingTx(true)
    try {
      const memo = `ZMWALLET${userShortId}`
      const res = await fetch('http://localhost:8000/payments/wallet/deposit-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: user.id, amount, memo }),
      })
      if (!res.ok) throw new Error('Không thể tạo giao dịch nạp tiền')
      const data = await res.json()

      const generatedQr = `https://img.vietqr.io/image/${sepayConfig.bankId}-${sepayConfig.bankAcc}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${encodeURIComponent(sepayConfig.bankName)}`

      setActiveTxId(data.transactionId)
      setDepositMemo(memo)
      setDepositAmountNum(amount)
      setQrUrl(generatedQr)
      setShowDepositModal(true)
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`)
    } finally {
      setIsCreatingTx(false)
    }
  }

  // ─── Bấm dấu ✕ đóng QR Modal → Hủy / xóa giao dịch nạp tiền PENDING ───
  const handleCloseDepositModal = async () => {
    if (activeTxId) {
      try {
        await fetch(`http://localhost:8000/payments/wallet/tx/${activeTxId}`, {
          method: 'DELETE',
        })
      } catch (e) {
        console.error('Error cancelling pending deposit tx:', e)
      }
    }
    setShowDepositModal(false)
    setActiveTxId('')
    setDepositAmount('')
    fetchWalletData(true)
  }

  const formatMoney = (amount: number) => amount.toLocaleString('vi-VN') + 'đ'

  return (
    <div className="space-y-6 text-left">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>💳</span> Ví Điện Tử ZeroMall Pay
          </h2>
          <p className="text-xs text-slate-500 mt-1">Nạp tiền, rút tiền về ngân hàng, quản lý tài khoản thụ hưởng.</p>
        </div>
        <button
          onClick={() => fetchWalletData()}
          className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-600 font-semibold rounded-sm text-xs transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
        >
          🔄 Làm mới
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-450 font-semibold">Đang tải ví của bạn...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Balance + Deposit/Withdraw Forms */}
          <div className="lg:col-span-5 space-y-5">

            {/* Balance Card */}
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-sm p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 text-[120px] pointer-events-none select-none">💳</div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Số Dư Ví ZeroMall</p>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                {wallet ? formatMoney(wallet.balance) : '0đ'}
              </h3>
              <div className="mt-4 pt-4 border-t border-white/20 text-[10px] opacity-80 font-semibold">
                ID ví: {wallet?.id}
              </div>
            </div>

            {/* Deposit / Withdraw Tab Switcher */}
            <div className="flex border border-slate-200/80 rounded-sm overflow-hidden shadow-3xs">
              <button
                onClick={() => setActiveSection('deposit')}
                className={`flex-1 py-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSection === 'deposit'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                ➕ Nạp Tiền
              </button>
              <button
                onClick={() => setActiveSection('withdraw')}
                className={`flex-1 py-2.5 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSection === 'withdraw'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                💸 Rút Tiền
              </button>
            </div>

            {/* Deposit Box */}
            {activeSection === 'deposit' && (
            <div className="bg-white border border-slate-200/80 rounded-sm p-5 space-y-4 shadow-3xs">
              <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span>➕</span> Nạp Tiền Vào Ví
              </h4>

              <form onSubmit={handleOpenDepositModal} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-650 block">Nhập số tiền nạp (VND)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Ví dụ: 100000"
                      className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800"
                      required
                      min="1000"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">đ</span>
                  </div>
                </div>

                {/* Preset buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[50000, 100000, 200000, 500000, 1000000, 2000000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDepositAmount(amount.toString())}
                      className="py-1.5 border border-slate-200 rounded-sm text-[10px] font-bold text-slate-600 hover:border-emerald-600 hover:text-emerald-600 transition cursor-pointer"
                    >
                      {formatMoney(amount)}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isCreatingTx}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-sm text-xs transition shadow-3xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isCreatingTx ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang tạo mã QR...
                    </>
                  ) : (
                    '📲 Nạp tiền qua QR'
                  )}
                </button>
              </form>
            </div>
            )}

            {/* Withdraw Section */}
            {activeSection === 'withdraw' && (
              <BuyerWithdrawForm
                userId={user?.id || ''}
                walletBalance={wallet?.balance || 0}
                onWithdrawSuccess={() => fetchWalletData(true)}
              />
            )}
          </div>

          {/* Right: Transaction History */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/80 rounded-sm p-5 space-y-4 min-h-[400px] flex flex-col shadow-3xs">
              <h4 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <span>📋</span> Lịch Sử Giao Dịch Ví
              </h4>

              {(() => {
                const displayTransactions = transactions.filter(tx => !(tx.type === 'DEPOSIT' && tx.status === 'PENDING'))
                return displayTransactions.length === 0 ? (
                  <div className="my-auto py-20 text-center space-y-2">
                    <span className="text-4xl block opacity-60">💸</span>
                    <p className="text-xs text-slate-400 font-semibold">Chưa có giao dịch ví nào.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[500px] pr-1">
                    {displayTransactions.map(tx => {
                      const isCredit = tx.type === 'DEPOSIT' || tx.type === 'REFUND' || tx.type === 'REVENUE'
                    const typeLabel =
                      tx.type === 'DEPOSIT' ? 'Nạp tiền' :
                      tx.type === 'PAYMENT' ? 'Thanh toán' :
                      tx.type === 'REFUND' ? 'Hoàn tiền' :
                      tx.type === 'WITHDRAW' ? 'Rút tiền' : 'Bán hàng'
                    const statusColor =
                      tx.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                      tx.status === 'PENDING' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                      'text-rose-600 bg-rose-50 border-rose-100'
                    const statusLabel =
                      tx.status === 'SUCCESS' ? 'Thành công' :
                      tx.status === 'PENDING' ? 'Đang xử lý' : 'Thất bại'

                    return (
                      <div
                        key={tx.id}
                        className="p-3 border border-slate-100 hover:border-slate-200/80 hover:bg-slate-50/20 rounded-sm flex items-center justify-between gap-4 text-xs font-semibold text-slate-700 transition"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                              {typeLabel}
                            </span>
                            <span className="text-[10px] text-slate-450 font-medium">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-slate-800 font-bold truncate pr-2">{tx.description}</p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <p className={`font-black text-sm tracking-tight ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isCredit ? '+' : '-'}{formatMoney(tx.amount)}
                          </p>
                          <span className={`inline-block border px-1.5 py-0.5 rounded-sm text-[9px] font-black leading-none ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Full-screen QR Deposit Modal — y hệt CartPage Sepay Modal ─── */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-emerald-50/60 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📲</span>
                <span className="font-extrabold text-slate-800 text-sm sm:text-base">Nạp Tiền Ví ZeroMall</span>
              </div>
              <button
                onClick={handleCloseDepositModal}
                className="text-slate-400 hover:text-slate-600 transition text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-center">
              {/* QR Image */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl w-fit mx-auto shadow-sm">
                <img src={qrUrl} alt="VietQR Nạp ví" className="w-56 h-56 mx-auto object-contain" />
              </div>

              {/* Waiting animation */}
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang chờ chuyển khoản — sẽ tự động cập nhật...</span>
              </div>

              {/* Bank info table */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-700 text-left space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Ngân hàng:</span>
                  <span className="font-extrabold text-slate-800">{sepayConfig.bankId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-800">{sepayConfig.bankAcc}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(sepayConfig.bankAcc); alert('Đã copy số tài khoản!') }}
                      className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >Copy</button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                  <span className="font-extrabold text-slate-800 uppercase">{sepayConfig.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Số tiền:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-600">{formatMoney(depositAmountNum)}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(String(depositAmountNum)); alert('Đã copy số tiền!') }}
                      className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >Copy</button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Nội dung CK:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-500/25 px-2 py-0.5 rounded text-sm font-mono">
                      {depositMemo}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(depositMemo); alert('Đã copy nội dung chuyển khoản!') }}
                      className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                    >Copy</button>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4 text-[10px] font-medium text-amber-700 text-left leading-relaxed">
                ⚠️ <strong>Quan trọng:</strong> Nhập đúng <strong>Nội dung chuyển khoản ({depositMemo})</strong>. Hệ thống tự động quét và xác nhận nạp tiền vào ví sau vài giây.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
