import React, { useState, useEffect } from 'react'

interface BankAccount {
  id: string
  bankName: string
  bankCode: string
  bankAccount: string
  accountName: string
  isDefault: boolean
}

interface BuyerBankAccountsProps {
  userId: string
  onAccountsChange?: (accounts: BankAccount[]) => void
}

const BANK_LIST = [
  { name: 'Vietcombank', code: 'VCB' },
  { name: 'MBBank', code: 'MB' },
  { name: 'Techcombank', code: 'TCB' },
  { name: 'Vietinbank', code: 'CTG' },
  { name: 'BIDV', code: 'BID' },
  { name: 'Agribank', code: 'ARG' },
  { name: 'TPBank', code: 'TPB' },
  { name: 'ACB', code: 'ACB' },
  { name: 'Sacombank', code: 'STB' },
  { name: 'VPBank', code: 'VPB' },
]

const STORAGE_KEY = (userId: string) => `zeromall_bank_accounts_${userId}`

export const BuyerBankAccounts: React.FC<BuyerBankAccountsProps> = ({ userId, onAccountsChange }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBankName, setNewBankName] = useState('Vietcombank')
  const [newBankAccount, setNewBankAccount] = useState('')
  const [newAccountName, setNewAccountName] = useState('')

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(userId))
      if (stored) {
        const parsed = JSON.parse(stored)
        setAccounts(parsed)
        onAccountsChange?.(parsed)
      }
    } catch (e) {
      console.error('Error loading bank accounts:', e)
    }
  }, [userId])

  const saveAccounts = (updated: BankAccount[]) => {
    setAccounts(updated)
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(updated))
    onAccountsChange?.(updated)
  }

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBankAccount.trim() || !newAccountName.trim()) {
      alert('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng!')
      return
    }

    const bank = BANK_LIST.find(b => b.name === newBankName)
    const newAccount: BankAccount = {
      id: `ba_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      bankName: newBankName,
      bankCode: bank?.code || '',
      bankAccount: newBankAccount.trim(),
      accountName: newAccountName.trim().toUpperCase(),
      isDefault: accounts.length === 0, // First account is default
    }

    saveAccounts([...accounts, newAccount])
    setNewBankAccount('')
    setNewAccountName('')
    setNewBankName('Vietcombank')
    setShowAddForm(false)
  }

  const handleDeleteAccount = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản ngân hàng này?')) return
    const updated = accounts.filter(a => a.id !== id)
    // If deleted account was default, set first remaining as default
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true
    }
    saveAccounts(updated)
  }

  const handleSetDefault = (id: string) => {
    const updated = accounts.map(a => ({
      ...a,
      isDefault: a.id === id,
    }))
    saveAccounts(updated)
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-sm p-5 space-y-4 shadow-3xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
          <span>🏦</span> Tài Khoản Ngân Hàng Thụ Hưởng
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm text-[10px] transition cursor-pointer shadow-3xs flex items-center gap-1"
        >
          {showAddForm ? '✕ Đóng' : '+ Thêm tài khoản'}
        </button>
      </div>

      {/* Add New Account Form */}
      {showAddForm && (
        <form onSubmit={handleAddAccount} className="bg-slate-50 border border-slate-200/60 rounded-sm p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thêm Tài Khoản Ngân Hàng Mới</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Ngân hàng</label>
              <select
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800 bg-white"
              >
                {BANK_LIST.map(bank => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Số tài khoản</label>
              <input
                type="text"
                value={newBankAccount}
                onChange={(e) => setNewBankAccount(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 0964579675"
                className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Tên chủ tài khoản (Không dấu, in hoa)</label>
            <input
              type="text"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Ví dụ: NGUYEN VAN A"
              className="w-full px-3 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-emerald-600 text-xs font-bold text-slate-800 uppercase"
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-sm text-xs transition cursor-pointer shadow-3xs"
            >
              ✓ Lưu tài khoản
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setNewBankAccount(''); setNewAccountName('') }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-sm text-xs transition cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Saved Accounts List */}
      {accounts.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <span className="text-3xl block opacity-50">🏦</span>
          <p className="text-xs text-slate-400 font-semibold">Chưa có tài khoản ngân hàng nào được lưu.</p>
          <p className="text-[10px] text-slate-350 font-medium">Thêm tài khoản ngân hàng để rút tiền từ ví.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map(account => (
            <div
              key={account.id}
              className={`p-3 border rounded-sm flex items-center justify-between gap-3 transition ${
                account.isDefault
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center text-[10px] font-black shrink-0 ${
                  account.isDefault ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {account.bankCode}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">{account.bankName}</p>
                    {account.isDefault && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase border border-emerald-200">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    STK: {account.bankAccount} • {account.accountName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!account.isDefault && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    className="px-2 py-1 text-[9px] font-bold text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-sm transition cursor-pointer"
                  >
                    Đặt mặc định
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  className="px-2 py-1 text-[9px] font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-sm transition cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export type { BankAccount }
export { BANK_LIST }
