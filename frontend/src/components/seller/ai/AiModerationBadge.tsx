import React from 'react';
import type { AiModerationResponse } from '../../../services/ai-moderation.service';

interface AiModerationBadgeProps {
  isLoading: boolean;
  result: AiModerationResponse | null;
  onApplySuggestion?: (suggestedText: string) => void;
  className?: string;
}

export const AiModerationBadge: React.FC<AiModerationBadgeProps> = ({
  isLoading,
  result,
  className = '',
}) => {
  // Silent background scan: không hiển thị loading để người bán không biết AI đang quét ngầm
  if (isLoading || !result) return null;

  // Trường hợp vi phạm (Violated) -> Hiển thị cảnh báo nhỏ gọn, súc tích
  if (result.isViolated) {
    return (
      <div className={`flex items-start gap-2 px-3 py-2 bg-rose-50 border border-rose-200/90 rounded-xl text-rose-800 text-[11px] mt-1.5 animate-fadeIn shadow-3xs ${className}`}>
        <span className="text-xs shrink-0 mt-0.5">⚠️</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-rose-900 leading-tight">
            {result.reason}
          </p>
          {result.suggestion && (
            <p className="mt-1 text-[10px] text-slate-600">
              <span className="font-bold text-emerald-700">💡 Gợi ý:</span> {result.suggestion}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Trường hợp hợp lệ (Safe) -> Ẩn hoàn toàn, không hiển thị gì gây rối mắt
  return null;
};

