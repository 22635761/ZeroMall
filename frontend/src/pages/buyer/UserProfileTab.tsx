import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface UserProfileTabProps {
  user: any
  onAuthSuccess: (userData: any, token: string) => void
}

export const UserProfileTab: React.FC<UserProfileTabProps> = ({ user, onAuthSuccess }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('KHAC')
  const [birthdayDay, setBirthdayDay] = useState('15')
  const [birthdayMonth, setBirthdayMonth] = useState('5')
  const [birthdayYear, setBirthdayYear] = useState('2004')
  
  const [avatar, setAvatar] = useState('https://placehold.co/100x100?text=User')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhoneNumber(user.phoneNumber || '')
      setGender(user.gender || 'KHAC')
      setAvatar(user.avatar || 'https://placehold.co/150x150?text=User')
      
      if (user.birthday) {
        const parts = user.birthday.split('-')
        if (parts.length === 3) {
          setBirthdayYear(parts[0])
          setBirthdayMonth(parseInt(parts[1], 10).toString())
          setBirthdayDay(parseInt(parts[2], 10).toString())
        }
      }
    }
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'zeromall_unsigned')

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxkfusgxs'
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setAvatar(data.secure_url)
      setMessage({ text: 'Tải ảnh lên Cloudinary thành công!', type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Có lỗi xảy ra khi tải ảnh lên Cloudinary.', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(false)
    setMessage(null)

    const birthdayStr = `${birthdayYear}-${birthdayMonth.padStart(2, '0')}-${birthdayDay.padStart(2, '0')}`

    const payload = {
      name,
      email,
      phoneNumber,
      gender,
      birthday: birthdayStr,
      avatar,
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('zm_token') || ''
      const response = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      
      // Update local storage and app state
      const zmUser = localStorage.getItem('zm_user')
      if (zmUser) {
        const parsed = JSON.parse(zmUser)
        const newUserData = { ...parsed, ...updatedUser }
        onAuthSuccess(newUserData, token)
      }

      setMessage({ text: 'Cập nhật hồ sơ tài khoản thành công!', type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Có lỗi xảy ra khi cập nhật hồ sơ.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString())

  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      {/* Tab Header Title */}
      <div className="pb-5 border-b border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800">Hồ Sơ Của Tôi</h2>
        <p className="text-xs text-slate-500 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-sm text-xs font-semibold border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Form content wrapper split in cols */}
      <div className="flex flex-col-reverse md:flex-row gap-8 pt-4">
        
        {/* Left Side: Form Controls */}
        <form onSubmit={handleSave} className="flex-1 space-y-6 max-w-[550px]">
          
          {/* Tên đăng nhập */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Tên đăng nhập</label>
            <div className="flex-1 font-semibold text-slate-800 py-1.5">
              {user?.email}
            </div>
          </div>

          {/* Tên */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Tên</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition"
            />
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition"
            />
          </div>

          {/* Số điện thoại */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Số điện thoại</label>
            <input 
              type="text" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition"
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Giới tính */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Giới tính</label>
            <div className="flex-1 flex gap-5 items-center py-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value="NAM" 
                  checked={gender === 'NAM'}
                  onChange={() => setGender('NAM')}
                  className="accent-[#ee4d2d]"
                />
                <span>Nam</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value="NU" 
                  checked={gender === 'NU'}
                  onChange={() => setGender('NU')}
                  className="accent-[#ee4d2d]"
                />
                <span>Nữ</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value="KHAC" 
                  checked={gender === 'KHAC'}
                  onChange={() => setGender('KHAC')}
                  className="accent-[#ee4d2d]"
                />
                <span>Khác</span>
              </label>
            </div>
          </div>

          {/* Ngày sinh */}
          <div className="flex items-center gap-4 text-xs">
            <label className="w-[120px] text-right text-slate-500 shrink-0">Ngày sinh</label>
            <div className="flex-1 flex gap-2">
              <select 
                value={birthdayDay}
                onChange={(e) => setBirthdayDay(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-sm focus:outline-none"
              >
                {days.map(d => <option key={d} value={d}>Ngày {d}</option>)}
              </select>
              <select 
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-sm focus:outline-none"
              >
                {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select 
                value={birthdayYear}
                onChange={(e) => setBirthdayYear(e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-sm focus:outline-none"
              >
                {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-2">
            <div className="w-[120px] shrink-0" />
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2.5 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm text-xs transition duration-150 cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang Lưu...' : 'Lưu'}
            </button>
          </div>

        </form>

        {/* Vertical Divider line */}
        <div className="hidden md:block w-px bg-slate-200/70 self-stretch mx-2" />

        {/* Right Side: Avatar Uploader */}
        <div className="w-full md:w-[220px] flex flex-col items-center py-6 space-y-4 shrink-0">
          <div className="relative">
            <img 
              src={avatar} 
              alt="Avatar preview" 
              className="w-[120px] h-[120px] rounded-full object-cover border border-slate-200/80 shadow-3xs"
            />
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <label className="px-5 py-2 border border-slate-200 rounded-sm text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition shadow-3xs">
            Chọn Ảnh
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleAvatarChange}
              className="hidden" 
              disabled={uploading}
            />
          </label>

          <div className="text-[10px] text-slate-400 text-center space-y-1 leading-relaxed">
            <p>Dung lượng file tối đa 1 MB</p>
            <p>Định dạng: .JPEG, .PNG</p>
          </div>
        </div>

      </div>
    </div>
  )
}
