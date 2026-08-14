import React, { useState, useEffect, useRef } from 'react';
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  createChatSocket,
} from '../../services/chat.service';
import type { ChatConversation, ChatMessage } from '../../services/chat.service';
import type { Socket } from 'socket.io-client';

interface SellerChatManagerProps {
  user: any;
  shopId?: string;
}

export const SellerChatManager: React.FC<SellerChatManagerProps> = ({ user, shopId }) => {
  const effectiveShopId = shopId || user?.shopId || user?.id || user?._id;

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load conversation list for this seller/shop
  const loadConversations = async () => {
    if (!effectiveShopId) return;
    setLoadingConvs(true);
    try {
      const list = await fetchConversations({ shopId: effectiveShopId });
      setConversations(list);
      if (list.length > 0 && !selectedConv) {
        setSelectedConv(list[0]);
      }
    } catch (e) {
      console.error('Error fetching seller conversations:', e);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [effectiveShopId]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (!selectedConv?.id) return;

    setLoadingMsgs(true);
    fetchMessages(selectedConv.id)
      .then((res) => {
        setMessages(res.messages || []);
        // Mark as read for SHOP
        markConversationRead(selectedConv.id, 'SHOP').catch(() => {});
      })
      .catch((e) => console.error('Error fetching messages:', e))
      .finally(() => setLoadingMsgs(false));

    // Connect socket
    const socket = createChatSocket();
    socketRef.current = socket;
    socket.emit('join_conversation', { conversationId: selectedConv.id });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Refresh list to update lastMessage
      loadConversations();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedConv?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !selectedConv?.id) return;

    const messageData = {
      conversationId: selectedConv.id,
      senderId: effectiveShopId,
      senderType: 'SHOP' as const,
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

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!effectiveShopId) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl min-h-[400px] flex flex-col items-center justify-center">
        <span className="text-4xl block mb-2">🏪</span>
        <h3 className="font-bold text-slate-700">Chưa xác định gian hàng</h3>
        <p className="text-xs text-slate-400 mt-1">
          Vui lòng hoàn tất đăng ký gian hàng để bắt đầu nhận tin nhắn từ Khách hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden h-[600px] flex animate-in fade-in duration-150">
      {/* Cột trái: Danh sách cuộc trò chuyện */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
            <span>Tin Nhắn Khách Hàng</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingConvs ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <span className="text-3xl block mb-2">💬</span>
              Chưa có cuộc trò chuyện nào từ Khách hàng.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const hasUnread = conv.unreadShopCount > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-3.5 cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/60 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-100/60 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                    {(conv.buyerId || 'K').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          hasUnread ? 'font-bold text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        Khách #{conv.buyerId.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {conv.lastMessage || 'Bắt đầu trò chuyện'}
                    </p>
                  </div>

                  {hasUnread && (
                    <span className="w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unreadShopCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cột phải: Cửa sổ Chat chi tiết */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {(selectedConv.buyerId || 'K').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    Khách hàng #{selectedConv.buyerId}
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Trực tuyến
                  </span>
                </div>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/30 space-y-3">
              {loadingMsgs ? (
                <div className="p-8 text-center text-xs text-slate-400">Đang tải tin nhắn...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có tin nhắn nào trong cuộc trò chuyện này.
                </div>
              ) : (
                messages.map((msg) => {
                  const isShop = msg.senderType === 'SHOP';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isShop ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-xs shadow-xs leading-relaxed ${
                          isShop
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
              <div ref={chatEndRef} />
            </div>

            {/* Footer Input */}
            <div className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu trả lời cho Khách hàng..."
                className="flex-1 bg-slate-100/70 border border-slate-200 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold disabled:opacity-40 hover:bg-emerald-700 transition cursor-pointer border-none flex-shrink-0"
              >
                Gửi ➔
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <span className="text-4xl block mb-2">💬</span>
            <p className="text-xs font-semibold">Chọn một cuộc trò chuyện để bắt đầu nhắn tin với Khách hàng.</p>
          </div>
        )}
      </div>
    </div>
  );
};
