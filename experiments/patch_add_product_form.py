with open('frontend/src/components/seller/AddProductForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

import_target = "import { moderateContentWithAI, type AiModerationResponse } from '../../services/ai-moderation.service'"
import_repl = """import { moderateContentWithAI, type AiModerationResponse } from '../../services/ai-moderation.service'
import { type AuditCategoryResult } from '../../services/ai-category-auditor.service'"""

state_target = """export const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, onCancel, initialData, shopDetails }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'shipping' | 'other'>('basic')"""
state_repl = """export const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, onCancel, initialData, shopDetails }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'shipping' | 'other'>('basic')
  const [categoryAudit, setCategoryAudit] = useState<AuditCategoryResult | null>(null)
  const isProhibitedItem = Boolean(categoryAudit?.isProhibited || categoryAudit?.issueType === 'PROHIBITED_ITEM')"""

submit_target = """  const handleSubmit = async (e: React.FormEvent, targetStatus: 'active' | 'hidden' = 'active') => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}"""
submit_repl = """  const handleSubmit = async (e: React.FormEvent, targetStatus: 'active' | 'hidden' = 'active') => {
    e.preventDefault()

    if (isProhibitedItem) {
      alert(`🚫 VI PHẠM AN TOÀN NGHIÊM TRỌNG: AI đã phát hiện hình ảnh hoặc nội dung sản phẩm chứa mặt hàng cấm (${categoryAudit?.prohibitedLabel || 'Hàng cấm / Vũ khí'}). ZeroMall từ chối đăng tải sản phẩm này theo chính sách của sàn!`)
      return
    }

    const newErrors: Record<string, string> = {}"""

basic_tab_target = """              aiModerationResult={aiModerationTitle}
              isAiChecking={isAiCheckingTitle}
              onTriggerAiCheck={handleTriggerAiCheck}
            />"""
basic_tab_repl = """              aiModerationResult={aiModerationTitle}
              isAiChecking={isAiCheckingTitle}
              onTriggerAiCheck={handleTriggerAiCheck}
              onAuditChange={setCategoryAudit}
            />"""

footer_target = """        {/* Form Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/60 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-3xs bg-white"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'hidden')}
              className="border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-3xs bg-white"
            >
              Lưu & Ẩn
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'active')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              {initialData ? 'Cập nhật sản phẩm' : 'Lưu & Hiển thị'}
            </button>
          </div>
        </div>"""

footer_repl = """        {/* Form Footer Buttons */}
        {isProhibitedItem && (
          <div className="mx-6 mb-2 p-3.5 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3 text-red-700 animate-pulse">
            <span className="text-xl">🚫</span>
            <div className="text-xs">
              <span className="font-bold">ĐĂNG BÁN BỊ CHẶN:</span> Sản phẩm bị phát hiện chứa mặt hàng cấm ({categoryAudit?.prohibitedLabel || 'Vũ khí / Hàng cấm'}). Nút lưu sản phẩm đã bị vô hiệu hóa để bảo vệ an toàn sàn!
            </div>
          </div>
        )}
        <div className="p-4 bg-slate-50 border-t border-slate-200/60 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-3xs bg-white"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isProhibitedItem}
              onClick={(e) => handleSubmit(e, 'hidden')}
              className={`border border-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-3xs ${
                isProhibitedItem ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-800 cursor-pointer bg-white'
              }`}
            >
              Lưu & Ẩn
            </button>
            <button
              type="button"
              disabled={isProhibitedItem}
              onClick={(e) => handleSubmit(e, 'active')}
              className={`text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition ${
                isProhibitedItem
                  ? 'bg-red-500 cursor-not-allowed text-white opacity-85'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              }`}
              title={isProhibitedItem ? 'Sản phẩm vi phạm mặt hàng cấm' : ''}
            >
              {isProhibitedItem ? '🚫 Bị Chặn: Ảnh Chứa Hàng Cấm' : (initialData ? 'Cập nhật sản phẩm' : 'Lưu & Hiển thị')}
            </button>
          </div>
        </div>"""

assert import_target in c, 'import_target not found'
assert state_target in c, 'state_target not found'
assert submit_target in c, 'submit_target not found'
assert basic_tab_target in c, 'basic_tab_target not found'
assert footer_target in c, 'footer_target not found'

c = c.replace(import_target, import_repl)
c = c.replace(state_target, state_repl)
c = c.replace(submit_target, submit_repl)
c = c.replace(basic_tab_target, basic_tab_repl)
c = c.replace(footer_target, footer_repl)

with open('frontend/src/components/seller/AddProductForm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully patched AddProductForm.tsx')
