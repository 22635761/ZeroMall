import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Clock, AlertCircle, Loader2 } from 'lucide-react'

export interface EntityLockDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  entityInfo: {
    leftLabel: string
    leftTitle: React.ReactNode
    leftSub?: React.ReactNode
    rightLabel: string
    rightTitle: React.ReactNode
    rightSub?: React.ReactNode
  }
  reasons: string[]
  submitButtonText: string
  onSubmit: (data: {
    status: string
    blockedUntil: string | null
    blockReason: string
    durationText: string
  }) => Promise<void>
}

const DURATION_PRESETS = [
  { id: '1', label: '1 Ngày' },
  { id: '3', label: '3 Ngày' },
  { id: '7', label: '7 Ngày' },
  { id: '14', label: '14 Ngày' },
  { id: '30', label: '30 Ngày' },
  { id: '90', label: '90 Ngày' },
  { id: 'PERMANENT', label: 'Vĩnh viễn' },
  { id: 'CUSTOM', label: 'Tùy chỉnh' },
]

export const EntityLockDialog: React.FC<EntityLockDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Thiết lập thời hạn khóa và lý do kỷ luật',
  entityInfo,
  reasons,
  submitButtonText,
  onSubmit,
}) => {
  const [durationMode, setDurationMode] = useState<string>('7')
  const [customDays, setCustomDays] = useState<number>(5)
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0] || 'KHAC')
  const [customReason, setCustomReason] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setDurationMode('7')
      setCustomDays(5)
      setSelectedReason(reasons[0] || 'KHAC')
      setCustomReason('')
      setErrorMsg('')
      setLoading(false)
    }
  }, [isOpen, reasons])

  const calculateBlockedUntil = (): { date: Date | null; label: string; text: string } => {
    if (durationMode === 'PERMANENT') {
      return {
        date: null,
        label: 'Khóa vĩnh viễn (Không giới hạn thời gian)',
        text: 'Vĩnh viễn',
      }
    }

    let days = 7
    if (durationMode === 'CUSTOM') {
      days = Math.max(1, customDays || 1)
    } else {
      days = parseInt(durationMode, 10) || 7
    }

    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return {
      date: targetDate,
      label: `${days} ngày (Mở khóa vào ${targetDate.toLocaleDateString('vi-VN')} lúc ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
      text: `${days} ngày`,
    }
  }

  const finalReason = selectedReason === 'KHAC' ? customReason.trim() : selectedReason
  const { date: blockedUntilDate, label: durationPreview, text: durationText } = calculateBlockedUntil()

  const handleAction = async () => {
    if (!finalReason) {
      setErrorMsg('Vui lòng chọn hoặc nhập lý do khóa.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      await onSubmit({
        status: 'BLOCKED',
        blockedUntil: blockedUntilDate ? blockedUntilDate.toISOString() : null,
        blockReason: finalReason,
        durationText,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi thực hiện khóa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Lock className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Entity Info Box */}
        <div className="bg-muted/50 border border-border rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">{entityInfo.leftLabel}</div>
            <div className="font-black text-foreground text-sm mt-0.5">{entityInfo.leftTitle}</div>
            {entityInfo.leftSub && (
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{entityInfo.leftSub}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-muted-foreground">{entityInfo.rightLabel}</div>
            <div className="mt-0.5">{entityInfo.rightTitle}</div>
            {entityInfo.rightSub && (
              <div className="text-[10px] text-muted-foreground mt-0.5">{entityInfo.rightSub}</div>
            )}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>Chọn Thời Hạn Khóa (Bộ đếm ngày)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDurationMode(opt.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  durationMode === opt.id
                    ? 'bg-destructive text-destructive-foreground border-destructive shadow-xs'
                    : 'bg-card text-foreground border-border hover:bg-muted/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {durationMode === 'CUSTOM' && (
            <div className="mt-2 flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
              <span className="text-xs font-medium text-foreground">Khóa trong:</span>
              <Input
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 text-center font-bold text-destructive bg-card"
              />
              <span className="text-xs font-bold text-foreground">ngày</span>
            </div>
          )}

          {/* Duration Preview Notice */}
          <div className="mt-2 text-[11px] p-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-center gap-1.5 font-medium">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{durationPreview}</span>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">
            📋 Lý do khóa
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive cursor-pointer"
          >
            {reasons.map((r, i) => (
              <option key={i} value={r}>
                {r}
              </option>
            ))}
            <option value="KHAC">Lý do khác (Tự nhập nội dung)...</option>
          </select>

          {selectedReason === 'KHAC' && (
            <textarea
              rows={2}
              placeholder="Nhập lý do cụ thể..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
            />
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter className="flex flex-row items-center justify-end gap-2.5 pt-3 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleAction}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Lock className="size-3.5 mr-1" />
                <span>{submitButtonText}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
