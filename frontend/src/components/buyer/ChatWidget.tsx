import React, { useState, useRef, useEffect } from 'react';
import {
  getOrCreateConversation,
  fetchMessages,
  markConversationRead,
  createChatSocket,
} from '../../services/chat.service';
import type { ChatConversation, ChatMessage } from '../../services/chat.service';

interface ChatWidgetProps {
  user?: any;
  targetShopId?: string;
  targetShopName?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  user,
  targetShopId = 'zeromall-official',
  targetShopName = 'ZeroMall Official Mall',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeShopId, setActiveShopId] = useState(targetShopId);
  const [activeShopName, setActiveShopName] = useState(targetShopName);

  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const buyerId = user?.id || user?._id || user?.userId;

  // Listen to global open chat event from product detail/shop pages
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      if (e.detail?.shopId) {
        setActiveShopId(e.detail.shopId);
        setActiveShopName(e.detail.shopName || 'Shop');
        setIsOpen(true);
      }
    };

    window.addEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Load conversations when widget opens or user changes
  useEffect(() => {
    if (!isOpen) return;

    if (!buyerId) {
      // Guest mode placeholder notice
      return;
    }

    setLoading(true);

    // Get or create conversation with the target shop
    getOrCreateConversation(buyerId, activeShopId)
      .then((conv) => {
        setCurrentConversation(conv);
        return fetchMessages(conv.id);
      })
      .then((res) => {
        setMessages(res.messages || []);
      })
      .catch((err) => {
        console.error('Error initializing chat:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Conversations list available for future use if needed
  }, [isOpen, buyerId, activeShopId]);

  // Socket connection setup for active conversation
  useEffect(() => {
    if (!currentConversation?.id) return;

    const socket = createChatSocket();
    socketRef.current = socket;

    socket.emit('join_conversation', { conversationId: currentConversation.id });

    // Mark as read when entering room
    if (buyerId) {
      markConversationRead(currentConversation.id, 'BUYER').catch(() => {});
    }

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Clear typing indicator
      setPartnerTyping(false);
    });

    socket.on('user_typing', (data: { senderId: string; isTyping: boolean }) => {
      if (data.senderId !== buyerId) {
        setPartnerTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentConversation?.id, buyerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socketRef.current && currentConversation?.id && buyerId) {
      socketRef.current.emit('typing', {
        conversationId: currentConversation.id,
        senderId: buyerId,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          conversationId: currentConversation.id,
          senderId: buyerId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !currentConversation?.id) return;

    const messageData = {
      conversationId: currentConversation.id,
      senderId: buyerId || 'guest',
      senderType: 'BUYER' as const,
      type: 'TEXT' as const,
      content: inputText.trim(),
    };

    setInputText('');

    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper fallback for shop initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 text-slate-800">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 cursor-pointer transition duration-200 relative group border-none"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-[#222] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition duration-150 shadow-xl whitespace-nowrap">
            Chat với Người bán 💬
          </span>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 sm:w-96 h-[460px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between animate-in fade-in slide-in-from-bottom-3 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold text-white">
                {getInitials(activeShopName)}
              </div>
              <div>
                <h3 className="font-bold text-xs truncate max-w-[180px]">{activeShopName}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>Đang hoạt động</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-lg bg-transparent border-none p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto bg-slate-50 space-y-3">
            {!user ? (
              <div className="py-12 text-center text-slate-500 text-xs px-4">
                <span className="text-3xl block mb-2">🔒</span>
                Vui lòng đăng nhập để bắt đầu trò chuyện với Shop.
              </div>
            ) : loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                Đang nạp cuộc hội thoại...
              </div>
            ) : messages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <span className="text-2xl block mb-1">👋</span>
                Chào bạn! Gửi tin nhắn cho Shop để được tư vấn nhé.
              </div>
            ) : (
              messages.map((msg) => {
                const isBuyer = msg.senderType === 'BUYER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs shadow-xs leading-relaxed ${
                        isBuyer
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            )}

            {/* Partner Typing Indicator */}
            {partnerTyping && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1 w-fit animate-pulse">
                <span>Shop đang nhập tin nhắn...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          {user && (
            <div className="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-700 transition cursor-pointer border-none flex-shrink-0"
              >
                ➔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
