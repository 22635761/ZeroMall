import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  fetchConversations,
  fetchMessages,
  getOrCreateConversation,
  markConversationRead,
  createChatSocket,
} from '../../services/chat.service';
import type { ChatConversation, ChatMessage } from '../../services/chat.service';
import type { Socket } from 'socket.io-client';

interface ShopeeChatWindowProps {
  user: any;
  mode?: 'BUYER' | 'SELLER';
  isOpen: boolean;
  onClose: () => void;
  initialShopId?: string;
  initialShopName?: string;
}

export const ShopeeChatWindow: React.FC<ShopeeChatWindowProps> = ({
  user,
  mode = 'BUYER',
  isOpen,
  onClose,
  initialShopId,
  initialShopName,
}) => {
  const isSeller = mode === 'SELLER';
  const currentUserId = user?.id || user?._id || user?.userId;
  const sellerShopId = user?.shopId || currentUserId;

  // Window State: 'POPUP' (Floating bottom-right 760x520) or 'EXPANDED' (Full Screen / Large Modal)
  const [windowMode, setWindowMode] = useState<'POPUP' | 'EXPANDED'>('POPUP');

  // Conversations State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD'>('ALL');

  // Socket & Scroll Refs
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // 1. Fetch Conversations List
  const loadConversationsList = async () => {
    if (!currentUserId) return;
    setLoadingConvs(true);
    try {
      const filter = isSeller ? { shopId: sellerShopId } : { buyerId: currentUserId };
      let list = await fetchConversations(filter);

      // If buyer opened a specific shop from product page, ensure conversation exists
      if (!isSeller && initialShopId) {
        const existing = list.find((c) => c.shopId === initialShopId);
        if (existing) {
          setSelectedConv(existing);
        } else {
          const newConv = await getOrCreateConversation(currentUserId, initialShopId);
          list = [newConv, ...list.filter((c) => c.id !== newConv.id)];
          setSelectedConv(newConv);
        }
      } else if (list.length > 0 && !selectedConv) {
        setSelectedConv(list[0]);
      }

      setConversations(list);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversationsList();
    }
  }, [isOpen, currentUserId, initialShopId, mode]);

  // 2. Fetch Messages & Connect Socket when Selected Conversation changes
  useEffect(() => {
    if (!selectedConv?.id) return;

    setLoadingMsgs(true);
    fetchMessages(selectedConv.id)
      .then((res) => {
        setMessages(res.messages || []);
        // Mark conversation as read
        const userType = isSeller ? 'SHOP' : 'BUYER';
        markConversationRead(selectedConv.id, userType).catch(() => {});
      })
      .catch((err) => console.error('Error fetching messages:', err))
      .finally(() => setLoadingMsgs(false));

    // Connect WebSockets
    const socket = createChatSocket();
    socketRef.current = socket;
    socket.emit('join_conversation', { conversationId: selectedConv.id });

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setPartnerTyping(false);
      loadConversationsList();
    });

    socket.on('user_typing', (data: { senderId: string; isTyping: boolean }) => {
      if (data.senderId !== currentUserId) {
        setPartnerTyping(data.isTyping);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedConv?.id]);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Send Message Handler
  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedConv?.id) return;

    const messageData = {
      conversationId: selectedConv.id,
      senderId: isSeller ? sellerShopId : currentUserId,
      senderType: (isSeller ? 'SHOP' : 'BUYER') as 'BUYER' | 'SHOP',
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
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socketRef.current && selectedConv?.id && currentUserId) {
      socketRef.current.emit('typing', {
        conversationId: selectedConv.id,
        senderId: isSeller ? sellerShopId : currentUserId,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          conversationId: selectedConv.id,
          senderId: isSeller ? sellerShopId : currentUserId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  // Total Unread Count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => {
      return sum + (isSeller ? c.unreadShopCount : c.unreadBuyerCount);
    }, 0);
  }, [conversations, isSeller]);

  // Filtered Conversations List
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const partnerName = isSeller
        ? `Khách hàng ${c.buyerId.substring(0, 8)}`
        : c.shopInfo?.name || initialShopName || `Shop ${c.shopId.substring(0, 8)}`;
      const matchesSearch = partnerName.toLowerCase().includes(searchQuery.toLowerCase());
      const unreadCount = isSeller ? c.unreadShopCount : c.unreadBuyerCount;
      const matchesFilter = filterType === 'ALL' || (filterType === 'UNREAD' && unreadCount > 0);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filterType, isSeller, initialShopName]);

  // Date Formatter (Shopee style e.g. "07/08" or "18:30")
  const formatConvTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  // Message Time Formatter
  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fallback Avatar Initials
  const getInitials = (name: string) => {
    if (!name) return 'ZM';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-200 font-sans text-slate-800 selection:bg-rose-500 selection:text-white ${
        windowMode === 'EXPANDED'
          ? 'inset-4 md:inset-10 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col'
          : 'bottom-4 right-4 w-[850px] max-w-[95vw] h-[560px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden'
      }`}
    >
      {/* 1. SHOPEE CHAT HEADER BAR */}
      <div className="h-13 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#ee4d2d] font-black">Chat</span>
          {totalUnread > 0 && (
            <span className="bg-[#ee4d2d] text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
              ({totalUnread})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {/* Expand / Popup mode toggle */}
          <button
            onClick={() => setWindowMode(windowMode === 'POPUP' ? 'EXPANDED' : 'POPUP')}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer text-sm"
            title={windowMode === 'POPUP' ? 'Phóng to' : 'Thu nhỏ'}
          >
            {windowMode === 'POPUP' ? '⤢' : '↙'}
          </button>
          {/* Close / Minimize */}
          <button
            onClick={onClose}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer text-base"
            title="Đóng chat"
          >
            ⋁
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT BODY */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50">
        
        {/* LEFT SIDEBAR: CONVERSATION LIST (Shopee Style 300px) */}
        <div className="w-[300px] sm:w-[320px] bg-white border-r border-slate-200/80 flex flex-col shrink-0">
          
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100/80 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#ee4d2d] focus:bg-white transition"
              />
              <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-transparent border-none font-bold text-slate-600 cursor-pointer focus:outline-none"
              >
                <option value="ALL">Tất cả ({conversations.length})</option>
                <option value="UNREAD">Chưa đọc ({totalUnread})</option>
              </select>
            </div>
          </div>

          {/* Conversations Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
            {loadingConvs ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold space-y-2">
                <div className="w-5 h-5 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span>Đang tải danh sách chat...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1 px-4">
                <span className="text-2xl block">💬</span>
                <p className="font-bold text-slate-500">Chưa có cuộc hội thoại nào</p>
                <p className="text-[10px]">Hội thoại của bạn sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const partnerName = isSeller
                  ? `Khách hàng #${conv.buyerId.substring(0, 6)}`
                  : conv.shopInfo?.name || initialShopName || `Shop #${conv.shopId.substring(0, 6)}`;
                const unread = isSeller ? conv.unreadShopCount : conv.unreadBuyerCount;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3 flex gap-3 items-center cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-[#feeee9]/40 border-l-4 border-[#ee4d2d]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar Circle */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full border border-slate-200 overflow-hidden bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                        {conv.shopInfo?.logo ? (
                          <img
                            src={conv.shopInfo.logo}
                            alt={partnerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(partnerName)}</span>
                        )}
                      </div>
                      <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute bottom-0 right-0"></span>
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className="text-xs font-black text-slate-800 truncate">{partnerName}</h4>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {formatConvTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center gap-1">
                        <p className="text-[11px] text-slate-500 truncate font-semibold">
                          {conv.lastMessage || 'Bắt đầu trò chuyện...'}
                        </p>
                        {unread > 0 && (
                          <span className="bg-[#ee4d2d] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT DETAIL AREA */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedConv ? (
            /* Shopee Empty State graphic illustration */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 select-none space-y-4">
              <div className="w-48 h-36 relative flex items-center justify-center">
                {/* Laptop Graphic Mockup */}
                <div className="w-40 h-28 bg-white border-2 border-slate-300 rounded-xl shadow-md flex flex-col justify-between p-2 relative">
                  <div className="space-y-1.5">
                    <div className="h-4 bg-sky-500 rounded-md w-1/2"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-2/3"></div>
                  </div>
                  {/* Red/Emerald Speech Bubble */}
                  <div className="absolute -top-3 -right-3 bg-[#ee4d2d] text-white p-2 rounded-2xl shadow-lg font-black text-xs flex items-center justify-center gap-1">
                    <span>💬</span>
                    <span>•••</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  Chào mừng bạn đến với ZeroMall Chat
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  Start chatting with our sellers & buyers now!
                </p>
              </div>
            </div>
          ) : (
            /* Active Chat Window */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Active Conversation Top Bar */}
              <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-slate-200 overflow-hidden bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    {selectedConv.shopInfo?.logo ? (
                      <img
                        src={selectedConv.shopInfo.logo}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {getInitials(
                          isSeller
                            ? `Khách hàng #${selectedConv.buyerId.substring(0, 6)}`
                            : selectedConv.shopInfo?.name || initialShopName || 'Shop'
                        )}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-xs text-slate-800">
                      {isSeller
                        ? `Khách hàng #${selectedConv.buyerId.substring(0, 8)}`
                        : selectedConv.shopInfo?.name || initialShopName || `Shop #${selectedConv.shopId.substring(0, 8)}`}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Online 5 phút trước</span>
                    </p>
                  </div>
                </div>

                {!isSeller && (
                  <button
                    onClick={() => window.location.href = `/shop/${selectedConv.shopId}`}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    🏠 Xem Shop
                  </button>
                )}
              </div>

              {/* Messages Stream Container */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 space-y-3">
                {loadingMsgs ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang nạp tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                    <span className="text-3xl block">👋</span>
                    <p className="font-bold text-slate-600">Hãy gửi tin nhắn đầu tiên để mở đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = isSeller
                      ? msg.senderType === 'SHOP'
                      : msg.senderType === 'BUYER';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                            isMyMessage
                              ? 'bg-[#ee4d2d] text-white rounded-br-xs font-medium'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs font-semibold'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1 font-semibold">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Partner Typing Indicator */}
                {partnerTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-full px-3 py-1 w-fit animate-pulse">
                    <span>Đối phương đang gõ...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bottom Input Footer (Shopee Style Input Toolbar) */}
              <div className="p-3 bg-white border-t border-slate-200/80 space-y-2 shrink-0">
                {/* Toolbar icons */}
                <div className="flex items-center gap-3 text-slate-400 text-sm px-1">
                  <button className="hover:text-slate-700 cursor-pointer bg-transparent border-none">📷</button>
                  <button className="hover:text-slate-700 cursor-pointer bg-transparent border-none">🛍️</button>
                  <button className="hover:text-slate-700 cursor-pointer bg-transparent border-none">😊</button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập nội dung tin nhắn..."
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-full px-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#ee4d2d] focus:bg-white transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="px-4 py-2 bg-[#ee4d2d] hover:bg-[#d03e20] text-white text-xs font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border-none shrink-0 shadow-xs"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
