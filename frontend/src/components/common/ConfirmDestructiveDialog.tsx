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
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

export interface SummaryItem {
  label: string
  value: React.ReactNode
}

export interface ConfirmDestructiveDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  warningText: string
  summaryItems: SummaryItem[]
  confirmKeyword?: string // e.g. "XÓA"
  confirmIdentifier?: string // e.g. shop name or user email
  confirmPrompt?: React.ReactNode
  confirmButtonText: string
  loadingText?: string
  onConfirm: () => Promise<void>
}

export const ConfirmDestructiveDialog: React.FC<ConfirmDestructiveDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Cảnh báo: Hành động không thể hoàn tác',
  warningText,
  summaryItems,
  confirmKeyword = 'XÓA',
  confirmIdentifier,
  confirmPrompt,
  confirmButtonText,
  loadingText = 'Đang xử lý...',
  onConfirm,
}) => {
  const [confirmInput, setConfirmInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('')
      setErrorMsg('')
      setLoading(false)
    }
  }, [isOpen])

  const normalizedInput = confirmInput.trim().toUpperCase()
  const isKeywordValid = confirmKeyword
    ? normalizedInput === confirmKeyword.toUpperCase() ||
      normalizedInput === confirmKeyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    : false

  const isIdentifierValid = confirmIdentifier
    ? confirmInput.trim().toLowerCase() === confirmIdentifier.trim().toLowerCase()
    : false

  const isUnlocked = !confirmKeyword && !confirmIdentifier ? true : (isKeywordValid || isIdentifierValid)

  const handleAction = async () => {
    if (!isUnlocked || loading) return
    setLoading(true)
    setErrorMsg('')
    try {
      await onConfirm()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-3 text-left">
            <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <Trash2 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-destructive font-semibold mt-0.5">
                {subtitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Warning Alert Banner */}
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Cảnh báo quan trọng!</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {warningText}
          </p>
        </div>

        {/* Entity Summary Details */}
        {summaryItems.length > 0 && (
          <div className="bg-muted/50 border border-border rounded-xl p-3.5 space-y-2 text-xs">
            {summaryItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">{item.label}:</span>
                <span className="font-semibold text-foreground text-right">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Type to confirm unlock input */}
        {(confirmKeyword || confirmIdentifier) && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground block">
              {confirmPrompt || (
                <>
                  Nhập <span className="text-destructive font-mono font-bold">{confirmKeyword}</span>
                  {confirmIdentifier ? ` hoặc "${confirmIdentifier}"` : ''} để mở khóa nút xóa:
                </>
              )}
            </label>
            <Input
              type="text"
              placeholder={confirmIdentifier ? `Nhập "${confirmKeyword}" hoặc "${confirmIdentifier}"` : `Nhập "${confirmKeyword}"`}
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={loading}
              className="text-xs"
            />
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
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
            disabled={loading || !isUnlocked}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 mr-1" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
