import React, { useState, useEffect } from 'react'

export interface LinkedBankAccount {
  id: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  branch?: string
  isDefault: boolean
  createdAt: string
}

export const BANK_LIST = [
  { name: 'MBBank (MB)', code: 'MB', fullName: 'Ngân hàng TMCP Quân Đội' },
  { name: 'Vietcombank (VCB)', code: 'VCB', fullName: 'Ngân hàng Ngoại thương Việt Nam' },
  { name: 'Techcombank (TCB)', code: 'TCB', fullName: 'Ngân hàng Kỹ thương Việt Nam' },
  { name: 'Vietinbank (CTG)', code: 'CTG', fullName: 'Ngân hàng Công Thương Việt Nam' },
  { name: 'BIDV (BID)', code: 'BID', fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam' },
  { name: 'Agribank (ARG)', code: 'ARG', fullName: 'Ngân hàng Nông nghiệp & PT Nông thôn' },
  { name: 'VPBank (VPB)', code: 'VPB', fullName: 'Ngân hàng Việt Nam Thịnh Vượng' },
  { name: 'TPBank (TPB)', code: 'TPB', fullName: 'Ngân hàng Tiên Phong' },
  { name: 'Sacombank (STB)', code: 'STB', fullName: 'Ngân hàng Sài Gòn Thương Tín' },
  { name: 'ACB (ACB)', code: 'ACB', fullName: 'Ngân hàng Á Châu' },
  { name: 'OCB (OCB)', code: 'OCB', fullName: 'Ngân hàng Phương Đông' },
]

interface ShopBankAccountsProps {
  user: any
  shopId?: string
}

const getStorageKey = (ownerId: string) => `zeromall_linked_bank_accounts_${ownerId}`

export const getLinkedBankAccounts = (ownerId: string): LinkedBankAccount[] => {
  try {
    const raw = localStorage.getItem(getStorageKey(ownerId))
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Error reading bank accounts:', e)
  }
  return []
}

export const saveLinkedBankAccounts = (ownerId: string, accounts: LinkedBankAccount[]) => {
  try {
    localStorage.setItem(getStorageKey(ownerId), JSON.stringify(accounts))
  } catch (e) {
    console.error('Error saving bank accounts:', e)
  }
}

export const ShopBankAccounts: React.FC<ShopBankAccountsProps> = ({ user, shopId }) => {
  const ownerId = shopId || user?.shopId || user?.id || 'shop-test-id'

  const [accounts, setAccounts] = useState<LinkedBankAccount[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<LinkedBankAccount | null>(null)

  // Form inputs
  const [bankCode, setBankCode] = useState(BANK_LIST[0].code)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [branch, setBranch] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loaded = getLinkedBankAccounts(ownerId)
    if (loaded.length === 0) {
      const initialMock: LinkedBankAccount[] = [
        {
          id: 'bank-' + Date.now(),
          bankName: 'MBBank (MB)',
          bankCode: 'MB',
          accountNumber: '0964579675',
          accountName: 'ZERO MALL FASHION HUB',
          branch: 'Chi nhánh Hà Nội',
          isDefault: true,
          createdAt: new Date().toISOString()
        }
      ]
      setAccounts(initialMock)
      saveLinkedBankAccounts(ownerId, initialMock)
    } else {
      setAccounts(loaded)
    }
  }, [ownerId])

  const openAddModal = () => {
    setEditingAccount(null)
    setBankCode(BANK_LIST[0].code)
    setAccountNumber('')
    setAccountName('')
    setBranch('')
    setIsDefault(accounts.length === 0)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  const openEditModal = (acc: LinkedBankAccount) => {
    setEditingAccount(acc)
    setBankCode(acc.bankCode)
    setAccountNumber(acc.accountNumber)
    setAccountName(acc.accountName)
    setBranch(acc.branch || '')
    setIsDefault(acc.isDefault)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!accountNumber.trim()) {
      setErrorMessage('Vui lòng nhập số tài khoản ngân hàng')
      return
    }
    if (!accountName.trim()) {
      setErrorMessage('Vui lòng nhập tên chủ tài khoản')
      return
    }

    const selectedBank = BANK_LIST.find(b => b.code === bankCode) || BANK_LIST[0]

    let updated: LinkedBankAccount[] = []

    if (editingAccount) {
      // Edit existing
      updated = accounts.map(acc => {
        if (acc.id === editingAccount.id) {
          return {
            ...acc,
            bankName: selectedBank.name,
            bankCode: selectedBank.code,
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim().toUpperCase(),
            branch: branch.trim(),
            isDefault: isDefault
          }
        }
        return isDefault ? { ...acc, isDefault: false } : acc
      })
    } else {
      // Add new
      const newAcc: LinkedBankAccount = {
        id: 'bank-' + Date.now(),
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        branch: branch.trim(),
        isDefault: isDefault || accounts.length === 0,
        createdAt: new Date().toISOString()
      }

      if (newAcc.isDefault) {
        updated = accounts.map(acc => ({ ...acc, isDefault: false }))
        updated.unshift(newAcc)
      } else {
        updated = [...accounts, newAcc]
      }
    }

    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true
    }

    setAccounts(updated)
    saveLinkedBankAccounts(ownerId, updated)
    setIsModalOpen(false)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ngân hàng "${name}"?`)) {
      let updated = accounts.filter(a => a.id !== id)
      if (updated.length > 0 && !updated.some(a => a.isDefault)) {
        updated[0].isDefault = true
      }
      setAccounts(updated)
      saveLinkedBankAccounts(ownerId, updated)
    }
  }

  const handleSetDefault = (id: string) => {
    const updated = accounts.map(a => ({
      ...a,
      isDefault: a.id === id
    }))
    setAccounts(updated)
    saveLinkedBankAccounts(ownerId, updated)
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span>🏦</span> Tài Khoản Ngân Hàng Đã Liên Kết
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Quản lý các tài khoản ngân hàng để thực hiện rút tiền nhanh từ Số Dư Ví ZeroMall
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <span>＋</span> Thêm Tài Khoản Ngân Hàng
        </button>
      </div>

      {/* Account List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => {
          const bankInfo = BANK_LIST.find(b => b.code === acc.bankCode)
          return (
            <div
              key={acc.id}
              className={`border rounded-2xl p-5 relative flex flex-col justify-between space-y-4 transition ${
                acc.isDefault
                  ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs ring-1 ring-emerald-500/30'
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center font-black text-xs text-emerald-700 font-mono shrink-0 shadow-3xs">
                    {acc.bankCode}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{acc.bankName}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{bankInfo?.fullName || acc.bankName}</p>
                  </div>
                </div>

                {acc.isDefault ? (
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider shrink-0 shadow-3xs">
                    Mặc Định
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(acc.id)}
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 underline cursor-pointer shrink-0"
                  >
                    Thiết lập mặc định
                  </button>
                )}
              </div>

              {/* Account Details */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Số Tài Khoản:</span>
                  <span className="font-black text-slate-800 text-sm tracking-wider">{acc.accountNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Chủ Tài Khoản:</span>
                  <span className="font-extrabold text-slate-700 uppercase font-sans">{acc.accountName}</span>
                </div>
                {acc.branch && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 text-[10px] font-sans">
                    <span className="text-slate-400 font-bold">Chi Nhánh:</span>
                    <span className="text-slate-600 font-semibold">{acc.branch}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => openEditModal(acc)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer"
                >
                  ✏️ Sửa
                </button>
                <button
                  onClick={() => handleDelete(acc.id, `${acc.bankName} - ${acc.accountNumber}`)}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition cursor-pointer"
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          )
        })}

        {accounts.length === 0 && (
          <div className="md:col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <span className="text-4xl">🏦</span>
            <p className="text-xs font-bold text-slate-600">Bạn chưa liên kết tài khoản ngân hàng nào</p>
            <p className="text-[11px] text-slate-400">Vui lòng thêm tài khoản ngân hàng để thực hiện rút tiền về ví của bạn.</p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-500 transition cursor-pointer"
            >
              ＋ Thêm Ngân Hàng Mới
            </button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Bank Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-left animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>🏦</span> {editingAccount ? 'Cập Nhật Tài Khoản Ngân Hàng' : 'Thêm Tài Khoản Ngân Hàng Liên Kết'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Chọn ngân hàng *</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {BANK_LIST.map(bank => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name} — {bank.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập số tài khoản (Ví dụ: 0964579675)"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Tên chủ tài khoản (Viết hoa không dấu) *</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 uppercase focus:outline-none focus:border-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Chi nhánh ngân hàng (Tùy chọn)</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Ví dụ: Chi nhánh Hà Nội / TP.HCM"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="chkDefault" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Đặt làm tài khoản ngân hàng mặc định để rút tiền
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm"
                >
                  {editingAccount ? 'Lưu Thay Đổi' : 'Xác Nhận Liên Kết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
