import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  fetchConversations,
  fetchMessages,
  getOrCreateConversation,
  markConversationRead,
  sendChatMessage,
  createChatSocket,
} from '../../services/chat.service';
import type { ChatConversation, ChatMessage } from '../../services/chat.service';
import type { Socket } from 'socket.io-client';

interface ShopeeChatWindowProps {
  user: any;
  mode?: 'BUYER' | 'SELLER';
  isOpen: boolean;
  onClose?: () => void;
  initialShopId?: string | null;
  initialShopName?: string | null;
  shopId?: string | null;
  isEmbedded?: boolean;
}

export const ShopeeChatWindow: React.FC<ShopeeChatWindowProps> = ({
  user,
  mode = 'BUYER',
  isOpen,
  onClose,
  initialShopId,
  initialShopName,
  shopId: propShopId,
  isEmbedded = false,
}) => {
  const isSeller = mode === 'SELLER';
  const currentUserId = user?.id || user?._id || user?.userId;
  const sellerShopId = propShopId || user?.shopId || currentUserId;

  // Window State: 'POPUP' (Floating bottom-right) or 'EXPANDED' (Full Screen / Large Modal)
  const [windowMode, setWindowMode] = useState<'POPUP' | 'EXPANDED'>('POPUP');

  // Conversations State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Shop and User details map for genuine avatars and real names
  const [shopsMap, setShopsMap] = useState<Record<string, { id: string; name: string; logo?: string | null }>>({});
  const [usersMap, setUsersMap] = useState<Record<string, { id: string; name: string; avatar?: string | null }>>({});

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD'>('ALL');

  // Socket & Scroll Refs
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // 1. Fetch Shops and Users info to resolve correct names & avatars
  useEffect(() => {
    if (!isOpen) return;

    // Fetch all approved shops
    fetch('http://localhost:8000/auth/shops')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, { id: string; name: string; logo?: string | null }> = {
            'zeromall-official': {
              id: 'zeromall-official',
              name: 'ZeroMall Official Mall',
              logo: null,
            },
          };
          data.forEach((s) => {
            map[s.id] = { id: s.id, name: s.name, logo: s.logo };
          });
          setShopsMap(map);
        }
      })
      .catch(() => {});

    // Fetch users info
    fetch('http://localhost:8000/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, { id: string; name: string; avatar?: string | null }> = {};
          data.forEach((u) => {
            map[u.id] = { id: u.id, name: u.name || u.email, avatar: u.avatar };
          });
          setUsersMap(map);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // 2. Fetch Conversations List (Polling & Initial)
  const loadConversationsList = async (targetShopIdToSelect?: string | null) => {
    const effectiveSenderId = isSeller ? sellerShopId : currentUserId;
    if (!effectiveSenderId) return;

    try {
      const filter = isSeller ? { shopId: sellerShopId } : { buyerId: currentUserId };
      let list = await fetchConversations(filter);

      const targetId = targetShopIdToSelect || initialShopId;

      // If buyer opened a specific shop from product page, ensure conversation exists
      if (!isSeller && targetId) {
        let existing = list.find((c) => c.shopId === targetId);
        if (!existing) {
          const newConv = await getOrCreateConversation(currentUserId, targetId);
          list = [newConv, ...list.filter((c) => c.id !== newConv.id)];
          existing = newConv;
        }
        setSelectedConv(existing);
      } else if (list.length > 0) {
        setSelectedConv((prev) => {
          if (prev) {
            const stillInList = list.find((c) => c.id === prev.id);
            return stillInList || list[0];
          }
          return list[0];
        });
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
      setLoadingConvs(true);
      loadConversationsList(initialShopId);
    }
  }, [isOpen, currentUserId, sellerShopId, initialShopId, mode]);

  // 3. Global Conversations List Auto-Polling every 3s to reflect new incoming messages
  useEffect(() => {
    if (!isOpen) return;

    const listPollInterval = setInterval(() => {
      const filter = isSeller ? { shopId: sellerShopId } : { buyerId: currentUserId };
      fetchConversations(filter)
        .then((latestList) => {
          setConversations((prev) => {
            const isChanged = prev.length !== latestList.length ||
              latestList.some((n, idx) => n.lastMessage !== prev[idx]?.lastMessage || n.lastMessageAt !== prev[idx]?.lastMessageAt);
            return isChanged ? latestList : prev;
          });
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(listPollInterval);
  }, [isOpen, isSeller, sellerShopId, currentUserId]);

  // 4. Fetch Messages & Connect Socket when Selected Conversation changes
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
      // Refresh list
      loadConversationsList();
    });

    socket.on('user_typing', (data: { senderId: string; isTyping: boolean }) => {
      const myId = isSeller ? sellerShopId : currentUserId;
      if (data.senderId !== myId) {
        setPartnerTyping(data.isTyping);
      }
    });

    // Fallback Background Polling every 2.5s for the active chat messages
    const messagePollInterval = setInterval(() => {
      if (selectedConv?.id) {
        fetchMessages(selectedConv.id)
          .then((res) => {
            if (res.messages && res.messages.length > 0) {
              setMessages((prev) => {
                if (prev.length !== res.messages.length || prev[prev.length - 1]?.id !== res.messages[res.messages.length - 1]?.id) {
                  return res.messages;
                }
                return prev;
              });
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      clearInterval(messagePollInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedConv?.id, sellerShopId, currentUserId, isSeller]);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Send Message Handler (Instant Local + WebSockets + HTTP API Direct Call)
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedConv?.id) return;

    const contentToSend = inputText.trim();
    const senderId = isSeller ? sellerShopId : currentUserId;
    const senderType = isSeller ? 'SHOP' : 'BUYER';

    const messageData = {
      conversationId: selectedConv.id,
      senderId,
      senderType: senderType as 'BUYER' | 'SHOP',
      type: 'TEXT' as const,
      content: contentToSend,
    };

    setInputText('');

    // Emit via WebSocket
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }

    // Direct HTTP API call to guarantee saving to Database even if WebSocket dropped
    try {
      const savedMsg = await sendChatMessage(messageData);
      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      // Soft refresh conversation list
      loadConversationsList();
    } catch (e) {
      console.error('Error sending chat message via API:', e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    const myId = isSeller ? sellerShopId : currentUserId;
    if (socketRef.current && selectedConv?.id && myId) {
      socketRef.current.emit('typing', {
        conversationId: selectedConv.id,
        senderId: myId,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          conversationId: selectedConv.id,
          senderId: myId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  // Helper to get partner's accurate name
  const getPartnerName = (conv: ChatConversation): string => {
    if (isSeller) {
      const u = usersMap[conv.buyerId];
      if (u?.name) return u.name;
      return `Khách hàng #${conv.buyerId.substring(0, 6)}`;
    }
    const s = shopsMap[conv.shopId];
    if (s?.name) return s.name;
    if (conv.shopInfo?.name) return conv.shopInfo.name;
    if (conv.shopId === initialShopId && initialShopName) return initialShopName;
    if (conv.shopId === 'zeromall-official') return 'ZeroMall Official Mall';
    return `Shop #${conv.shopId.substring(0, 6)}`;
  };

  // Helper to get partner's logo/avatar
  const getPartnerLogo = (conv: ChatConversation): string | null => {
    if (isSeller) {
      return usersMap[conv.buyerId]?.avatar || null;
    }
    return shopsMap[conv.shopId]?.logo || conv.shopInfo?.logo || null;
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
      const partnerName = getPartnerName(c);
      const matchesSearch = partnerName.toLowerCase().includes(searchQuery.toLowerCase());
      const unreadCount = isSeller ? c.unreadShopCount : c.unreadBuyerCount;
      const matchesFilter = filterType === 'ALL' || (filterType === 'UNREAD' && unreadCount > 0);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filterType, isSeller, shopsMap, usersMap]);

  // Date Formatter
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

  // Dynamic Initial Badge
  const getInitials = (name: string) => {
    if (!name) return 'Z';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`font-sans text-slate-800 selection:bg-emerald-600 selection:text-white ${
        isEmbedded
          ? 'w-full h-full flex flex-col overflow-hidden rounded-2xl bg-white'
          : windowMode === 'EXPANDED'
            ? 'fixed z-50 inset-4 md:inset-8 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden'
            : 'fixed z-50 bottom-4 right-4 w-[860px] max-w-[95vw] h-[570px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden'
      }`}
    >
      {/* 1. ZERO MALL BRANDED CHAT HEADER BAR */}
      <div className="h-14 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 flex items-center justify-between shrink-0 select-none shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-base">
            💬
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black tracking-tight">
              {isSeller ? 'Quản Lý Tin Nhắn Cửa Hàng' : 'ZeroMall Chat'}
            </span>
            {totalUnread > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                {totalUnread} mới
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-white/80">
          {!isEmbedded && (
            <>
              {/* Expand / Popup mode toggle */}
              <button
                onClick={() => setWindowMode(windowMode === 'POPUP' ? 'EXPANDED' : 'POPUP')}
                className="p-1.5 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer text-sm"
                title={windowMode === 'POPUP' ? 'Phóng to toàn màn hình' : 'Thu nhỏ cửa sổ'}
              >
                {windowMode === 'POPUP' ? '⤢' : '↙'}
              </button>
              {/* Close / Minimize */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer text-base"
                  title="Đóng chat"
                >
                  ✕
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. MAIN SPLIT BODY */}
      <div className="flex-1 flex overflow-hidden bg-slate-50/50">
        
        {/* LEFT SIDEBAR: CONVERSATION LIST (320px) */}
        <div className="w-[300px] sm:w-[330px] bg-white border-r border-slate-200/80 flex flex-col shrink-0">
          
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/40">
            <div className="relative">
              <input
                type="text"
                placeholder={isSeller ? "Tìm tên khách hàng..." : "Tìm tên Shop..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 transition shadow-3xs"
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
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/70">
            {loadingConvs ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold space-y-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span>Đang tải danh sách chat...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1.5 px-4">
                <span className="text-3xl block">💬</span>
                <p className="font-bold text-slate-600">Chưa có cuộc hội thoại nào</p>
                <p className="text-[11px] text-slate-400">
                  {isSeller ? 'Tin nhắn của khách hàng sẽ hiển thị tại đây.' : 'Các tin nhắn với Shop sẽ xuất hiện tại đây.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const partnerName = getPartnerName(conv);
                const partnerLogo = getPartnerLogo(conv);
                const unread = isSeller ? conv.unreadShopCount : conv.unreadBuyerCount;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3 flex gap-3 items-center cursor-pointer transition relative group ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar Circle with Dynamic Initial letter */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full border border-emerald-200 overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                        {partnerLogo ? (
                          <img
                            src={partnerLogo}
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
                        <p className="text-[11px] text-slate-500 truncate font-medium">
                          {conv.lastMessage || 'Bắt đầu trò chuyện...'}
                        </p>
                        {unread > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-2xs">
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
            /* ZeroMall Empty State illustration */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 select-none space-y-4">
              <div className="w-48 h-36 relative flex items-center justify-center">
                {/* Laptop Graphic Mockup */}
                <div className="w-44 h-30 bg-white border-2 border-slate-300 rounded-xl shadow-md flex flex-col justify-between p-3 relative">
                  <div className="space-y-2">
                    <div className="h-4 bg-emerald-600/80 rounded-md w-1/2"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-2/3"></div>
                  </div>
                  {/* Emerald Speech Bubble */}
                  <div className="absolute -top-3 -right-3 bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-lg font-black text-xs flex items-center justify-center gap-1.5 border-2 border-white">
                    <span>💬</span>
                    <span>•••</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  {isSeller ? 'Hộp Thư Cửa Hàng ZeroMall' : 'Chào mừng bạn đến với ZeroMall Chat'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {isSeller
                    ? 'Chọn một khách hàng từ danh sách bên trái để phản hồi tin nhắn!'
                    : 'Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu!'}
                </p>
              </div>
            </div>
          ) : (
            /* Active Chat Window */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Active Conversation Top Bar */}
              <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-emerald-200 overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                    {getPartnerLogo(selectedConv) ? (
                      <img
                        src={getPartnerLogo(selectedConv)!}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(getPartnerName(selectedConv))}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">
                      {getPartnerName(selectedConv)}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Đang trực tuyến</span>
                    </p>
                  </div>
                </div>

                {!isSeller && selectedConv.shopId !== 'zeromall-official' && (
                  <button
                    onClick={() => window.location.href = `/shop/${selectedConv.shopId}`}
                    className="px-3.5 py-1.5 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏪</span> Xem Shop
                  </button>
                )}
              </div>

              {/* Messages Stream Container */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 space-y-3.5">
                {loadingMsgs ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-bold flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
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
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                            isMyMessage
                              ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
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
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3.5 py-1 w-fit animate-pulse shadow-3xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Đối phương đang nhập tin nhắn...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Bottom Input Footer Toolbar */}
              <div className="p-3 bg-white border-t border-slate-200/80 space-y-2 shrink-0">
                <div className="flex items-center gap-3 text-slate-400 text-sm px-1">
                  <button className="hover:text-emerald-600 cursor-pointer bg-transparent border-none transition" title="Gửi hình ảnh">📷</button>
                  <button className="hover:text-emerald-600 cursor-pointer bg-transparent border-none transition" title="Gửi sản phẩm">🛍️</button>
                  <button className="hover:text-emerald-600 cursor-pointer bg-transparent border-none transition" title="Biểu cảm">😊</button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập nội dung tin nhắn..."
                    className="flex-1 bg-slate-100/90 border border-slate-200 rounded-full px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer border-none shrink-0 shadow-xs flex items-center gap-1.5"
                  >
                    <span>Gửi</span>
                    <span>➔</span>
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
