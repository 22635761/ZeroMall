import React, { useState, useEffect, useRef } from 'react';
import { AssistantProductCard } from './AssistantProductCard';
import { sendAssistantChat, type ChatMessage } from '../../../services/ai-assistant.service';

interface ZeroAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string, productName: string) => void;
  user?: any;
}

const DEFAULT_QUICK_PROMPTS = [
  '🎒 Tìm balo học sinh sinh viên đi học',
  '📱 Ốp lưng iPhone 15 Pro Max < 200k',
  '🎁 Gợi ý quà tặng bạn nữ dưới 300k',
  '👕 Áo khoác bomber thời trang nam',
];

export const ZeroAssistantModal: React.FC<ZeroAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  user,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Đọc lịch sử chat gần nhất từ sessionStorage
    try {
      const saved = sessionStorage.getItem('zm_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `Xin chào ${user?.name ? user.name : 'bạn'}! Mình là ZeroAI - Trợ lý Mua Sắm Thông Minh của ZeroMall. ✨\n\nMình có thể giúp bạn tìm kiếm món đồ ưng ý theo ngân sách, sở thích hoặc gợi ý quà tặng. Bạn cần tìm gì hôm nay nè?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(DEFAULT_QUICK_PROMPTS);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('zm_ai_chat_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('zm_ai_chat_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Lưu lịch sử chat vào sessionStorage
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('zm_ai_chat_history', JSON.stringify(messages.slice(-20)));
      }
    } catch {}
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await sendAssistantChat(text, [...messages, userMsg], user?.gender);

      if (response) {
        const aiMsg: ChatMessage = {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          content: response.reply,
          products: response.suggestedProducts || [],
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMsg]);
        if (response.quickReplies && response.quickReplies.length > 0) {
          setQuickReplies(response.quickReplies);
        }
      } else {
        const fallbackMsg: ChatMessage = {
          id: 'ai-err-' + Date.now(),
          role: 'assistant',
          content: 'Dạ hiện tại đường truyền đang bận một chút, bạn thử lại sau vài giây hoặc thử hỏi bằng từ khóa khác nha!',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: 'ai-err-' + Date.now(),
        role: 'assistant',
        content: 'Dạ, hệ thống đang bận. Mời bạn thử lại nha!',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    sessionStorage.removeItem('zm_ai_chat_history');
    setMessages([
      {
        id: 'welcome-msg-cleared',
        role: 'assistant',
        content: 'Đã làm mới cuộc trò chuyện! ZeroAI sẵn sàng hỗ trợ bạn tìm kiếm món đồ mới ngay bây giờ. 🛍️',
        timestamp: Date.now(),
      },
    ]);
    setQuickReplies(DEFAULT_QUICK_PROMPTS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-end sm:items-stretch justify-center">
      {/* Backdrop trên màn hình điện thoại */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs sm:hidden"
        onClick={onClose}
      />

      {/* Main Chat Container */}
      <div
        className={`relative bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-indigo-100/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'w-full sm:w-[780px] lg:w-[920px] h-[92vh] sm:h-[720px] max-h-[850px]'
            : 'w-full sm:w-[440px] h-[85vh] sm:h-[620px] max-h-[720px]'
        }`}
      >
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white p-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
              <span>🤖</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm tracking-wide">ZeroAI Copilot</h3>
                <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  RAG TMĐT
                </span>
                {isExpanded && (
                  <span className="hidden sm:inline-block bg-emerald-500/30 text-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    Khung Rộng
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tư vấn mua sắm theo thời gian thực</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleExpand}
              title={isExpanded ? 'Thu nhỏ khung chat' : 'Phóng to mở rộng khung chat'}
              className="w-8 h-8 rounded-full hover:bg-white/15 text-indigo-100 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
            >
              {isExpanded ? '⤡' : '⤢'}
            </button>
            <button
              onClick={handleClearHistory}
              title="Làm mới đoạn chat"
              className="w-8 h-8 rounded-full hover:bg-white/15 text-indigo-100 hover:text-white flex items-center justify-center transition cursor-pointer text-sm"
            >
              🔄
            </button>
            <button
              onClick={onClose}
              title="Thu nhỏ cửa sổ"
              className="w-8 h-8 rounded-full hover:bg-white/15 text-indigo-100 hover:text-white flex items-center justify-center transition cursor-pointer font-bold text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[90%]">
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🤖
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl shadow-xs leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200/70 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
              </div>

              {/* Product Cards Carousel or Grid */}
              {msg.products && msg.products.length > 0 && (
                <div className="w-full mt-3 pl-8">
                  <div
                    className={
                      isExpanded
                        ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                        : 'flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-indigo-200'
                    }
                  >
                    {msg.products.map((p) => (
                      <AssistantProductCard
                        key={p.id}
                        product={p}
                        onSelectProduct={onSelectProduct}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-500">
              <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs shrink-0">
                🤖
              </div>
              <div className="bg-white border border-slate-200/70 rounded-2xl rounded-bl-xs px-3.5 py-2 shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[11px] text-slate-400 font-medium ml-1">
                  ZeroAI đang tìm kiếm kho hàng...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        {quickReplies.length > 0 && (
          <div className="px-3 py-2 bg-white/70 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] text-indigo-600 font-bold shrink-0">Gợi ý:</span>
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qr)}
                disabled={isTyping}
                className="shrink-0 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-indigo-200 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi ZeroAI: tìm đồ theo giá, quà tặng..."
              disabled={isTyping}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95"
            >
              <span>Gửi</span>
              <span>⚡</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
