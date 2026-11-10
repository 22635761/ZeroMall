# -*- coding: utf-8 -*-
with open('frontend/src/pages/admin/AdminPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update getTabFromParam
old_tab_param = "case 'price-analytics': return 'PRICE_ANALYTICS';"
new_tab_param = "case 'price-analytics': return 'PRICE_ANALYTICS';\n      case 'ai-evaluation':\n      case 'ai-studio': return 'AI_EVALUATION';"
if old_tab_param in text and new_tab_param not in text:
    text = text.replace(old_tab_param, new_tab_param, 1)

# 2. Update getParamFromTab
old_param_tab = "case 'PRICE_ANALYTICS': return 'price-analytics';"
new_param_tab = "case 'PRICE_ANALYTICS': return 'price-analytics';\n      case 'AI_EVALUATION': return 'ai-evaluation';"
if old_param_tab in text and new_param_tab not in text:
    text = text.replace(old_param_tab, new_param_tab, 1)

# 3. Update activePortalTab union type
old_type = "'AUDIT_LOGS' | 'COMMISSION_SETTING' | 'PRICE_ANALYTICS'"
new_type = "'AUDIT_LOGS' | 'COMMISSION_SETTING' | 'PRICE_ANALYTICS' | 'AI_EVALUATION'"
if old_type in text and new_type not in text:
    text = text.replace(old_type, new_type, 1)

# 4. Update menuItems
old_menu = "{ id: 'VIOLATIONS', label: 'Quản lý & Kiểm duyệt SP', icon: '📦' },"
new_menu = "{ id: 'VIOLATIONS', label: 'Quản lý & Kiểm duyệt SP', icon: '📦' },\n    { id: 'AI_EVALUATION', label: '🔬 Đánh giá AI NCKH (Likert)', icon: '🔬' },"
if old_menu in text and new_menu not in text:
    text = text.replace(old_menu, new_menu, 1)

# 5. Render component
old_render = "{activePortalTab === 'AUDIT_LOGS' && (\n            <AuditLogsTab auditLogs={auditLogs} />\n          )}"
new_render = "{activePortalTab === 'AUDIT_LOGS' && (\n            <AuditLogsTab auditLogs={auditLogs} />\n          )}\n\n          {activePortalTab === 'AI_EVALUATION' && (\n            <AiEvaluationStudioTab />\n          )}"
if old_render in text and new_render not in text:
    text = text.replace(old_render, new_render, 1)

with open('frontend/src/pages/admin/AdminPage.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('[+] Successfully patched AdminPage.tsx with AI_EVALUATION tab')
