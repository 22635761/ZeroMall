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
import { API_BASE_URL } from '../../config/api.config';
import { toSlug } from '../../utils/slug';

interface ProductContext {
  id: string;
  name: string;
  price: string | number;
  originalPrice?: string | number;
  image: string;
  variant?: string;
}

interface OrderContext {
  id: string;
  totalAmount: number | string;
  status: string;
  items?: any[];
}

interface ShopeeChatWindowProps {
  user: any;
  mode?: 'BUYER' | 'SELLER';
  isOpen: boolean;
  onClose?: () => void;
  onOpenLogin?: () => void;
  initialShopId?: string | null;
  initialShopName?: string | null;
  initialProduct?: ProductContext | null;
  initialOrder?: OrderContext | null;
  shopId?: string | null;
  isEmbedded?: boolean;
}

export const ShopeeChatWindow: React.FC<ShopeeChatWindowProps> = ({
  user,
  mode = 'BUYER',
  isOpen,
  onClose,
  onOpenLogin,
  initialShopId,
  initialShopName,
  initialProduct,
  initialOrder,
  shopId: propShopId,
  isEmbedded = false,
}) => {
  const isSeller = mode === 'SELLER';
  const currentUserId = user?.id || user?._id || user?.userId;
  const sellerShopId = propShopId || user?.shopId || currentUserId;

  // Window State: 'POPUP' (Floating bottom-right) or 'EXPANDED' (Full Screen / Large Modal)
  const [windowMode, setWindowMode] = useState<'POPUP' | 'EXPANDED'>('POPUP');

  // Active Contexts attached from caller
  const [activeProduct, setActiveProduct] = useState<ProductContext | null>(initialProduct || null);
  const [activeOrder, setActiveOrder] = useState<OrderContext | null>(initialOrder || null);

  // Conversations State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  // Shop and User details map for genuine avatars and real names
  const [shopsMap, setShopsMap] = useState<Record<string, { id: string; name: string; logo?: string | null }>>({
    'PLATFORM_SUPPORT': {
      id: 'PLATFORM_SUPPORT',
      name: '🎧 ZeroMall CSKH & Hỗ Trợ Sàn',
      logo: null,
    },
    'zeromall-official': {
      id: 'zeromall-official',
      name: 'ZeroMall Official Mall',
      logo: null,
    },
  });
  const [usersMap, setUsersMap] = useState<Record<string, { id: string; name: string; avatar?: string | null }>>({});

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UNREAD'>('ALL');

  // Socket & Scroll Refs
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Sync contexts from props
  useEffect(() => {
    if (initialProduct) setActiveProduct(initialProduct);
    if (initialOrder) setActiveOrder(initialOrder);
  }, [initialProduct, initialOrder]);

  // 1. Fetch Shops and Users info to resolve correct names & avatars
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    // Fetch all approved shops
    fetch(`${API_BASE_URL}/auth/shops`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, { id: string; name: string; logo?: string | null }> = {
            'PLATFORM_SUPPORT': {
              id: 'PLATFORM_SUPPORT',
              name: '🎧 ZeroMall CSKH & Hỗ Trợ Sàn',
              logo: null,
            },
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
    fetch(`${API_BASE_URL}/auth/users`)
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
  }, [isOpen, currentUserId]);

  // 2. Fetch Conversations List (Polling & Initial)
  const loadConversationsList = async (targetShopIdToSelect?: string | null) => {
    const effectiveSenderId = isSeller ? sellerShopId : currentUserId;
    if (!effectiveSenderId) return;

    try {
      const filter = isSeller ? { shopId: sellerShopId } : { buyerId: currentUserId };
      let list = await fetchConversations(filter);

      // Exclude invalid self-chat (where user is buyer of their own shop)
      if (user?.shopId && !isSeller) {
        list = list.filter((c) => !(c.buyerId === currentUserId && c.shopId === user.shopId));
      }

      const targetId = targetShopIdToSelect || initialShopId;

      // If buyer opened a specific shop/support from product/order/help page, ensure conversation exists
      if (!isSeller && targetId && targetId !== user?.shopId) {
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
      } else {
        setSelectedConv(null);
      }

      setConversations(list);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUserId) {
      setLoadingConvs(true);
      loadConversationsList(initialShopId);
    }
  }, [isOpen, currentUserId, sellerShopId, initialShopId, mode]);

  // 3. Global Conversations List Auto-Polling every 3s to reflect new incoming messages
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const listPollInterval = setInterval(() => {
      const filter = isSeller ? { shopId: sellerShopId } : { buyerId: currentUserId };
      fetchConversations(filter)
        .then((latestList) => {
          let cleanedList = latestList;
          if (user?.shopId && !isSeller) {
            cleanedList = latestList.filter((c) => !(c.buyerId === currentUserId && c.shopId === user.shopId));
          }
          setConversations((prev) => {
            const isChanged = prev.length !== cleanedList.length ||
              cleanedList.some((n, idx) => n.lastMessage !== prev[idx]?.lastMessage || n.lastMessageAt !== prev[idx]?.lastMessageAt);
            return isChanged ? cleanedList : prev;
          });
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(listPollInterval);
  }, [isOpen, isSeller, sellerShopId, currentUserId, user?.shopId]);

  // 4. Fetch Messages & Connect Socket when Selected Conversation changes
  useEffect(() => {
    if (!selectedConv?.id) {
      setMessages([]);
      return;
    }

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

  // Send Message Handler
  const handleSendMessage = async (
    customContent?: string,
    type: 'TEXT' | 'IMAGE' | 'PRODUCT_CARD' | 'ORDER_CARD' = 'TEXT',
    metadata?: any
  ) => {
    const text = (customContent !== undefined ? customContent : inputText).trim();
    if (!text || !selectedConv?.id) return;

    const senderId = isSeller ? sellerShopId : currentUserId;
    const senderType = isSeller ? 'SHOP' : 'BUYER';

    const messageData = {
      conversationId: selectedConv.id,
      senderId,
      senderType: senderType as 'BUYER' | 'SHOP',
      type,
      content: text,
      metadata: metadata || null,
    };

    if (customContent === undefined) {
      setInputText('');
    }

    // Emit via WebSocket
    if (socketRef.current) {
      socketRef.current.emit('send_message', messageData);
    }

    // Direct HTTP API call
    try {
      const savedMsg = await sendChatMessage(messageData);
      setMessages((prev) => {
        if (prev.some((m) => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      loadConversationsList();
    } catch (e) {
      console.error('Error sending chat message via API:', e);
    }
  };

  // Quick Send Product Card
  const handleSendProductCard = () => {
    if (!activeProduct || !selectedConv?.id) return;
    const content = `🛍️ Tôi đang quan tâm sản phẩm: ${activeProduct.name}`;
    handleSendMessage(content, 'PRODUCT_CARD', activeProduct);
    setActiveProduct(null);
  };

  // Quick Send Order Card
  const handleSendOrderCard = () => {
    if (!activeOrder || !selectedConv?.id) return;
    const content = `📦 Tôi cần hỗ trợ về đơn hàng #${activeOrder.id}`;
    handleSendMessage(content, 'ORDER_CARD', activeOrder);
    setActiveOrder(null);
  };

  // Quick CS Support Issue Click
  const handleSendSupportIssue = (topic: string) => {
    handleSendMessage(`🆘 Yêu cầu hỗ trợ: ${topic}`);
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
    if (conv.shopId === 'PLATFORM_SUPPORT') return '🎧 ZeroMall CSKH & Hỗ Trợ Sàn';
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
    if (conv.shopId === 'PLATFORM_SUPPORT') return null;
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

  // Open Platform Support Chat
  const handleOpenPlatformSupport = async () => {
    if (!currentUserId) return;
    try {
      const conv = await getOrCreateConversation(currentUserId, 'PLATFORM_SUPPORT');
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setSelectedConv(conv);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  // Unauthenticated screen
  if (!user || !currentUserId) {
    return (
      <div
        className={`font-sans text-slate-800 ${
          isEmbedded
            ? 'w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl'
            : 'fixed z-50 bottom-4 right-4 w-[420px] max-w-[95vw] h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden p-6 text-center'
        }`}
      >
        <div className="flex justify-end w-full">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-4 my-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-3xl flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
            💬
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-800">
              Đăng Nhập Để Bắt Đầu Chat
            </h3>
            <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">
              Bạn cần đăng nhập tài khoản ZeroMall để nhắn tin trao đổi với <strong>Người bán</strong> hoặc gửi yêu cầu hỗ trợ đến <strong>CSKH Sàn</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              if (onOpenLogin) onOpenLogin();
            }}
            className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔐</span> Đăng Nhập Ngay
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-medium">
          Chưa có tài khoản? Bạn có thể đăng ký tài khoản miễn phí chỉ trong 1 phút.
        </p>
      </div>
    );
  }

  const isPlatformSupportConv = selectedConv?.shopId === 'PLATFORM_SUPPORT';

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
              {isSeller
                ? sellerShopId === 'PLATFORM_SUPPORT'
                  ? 'Kênh Tiếp Nhận CSKH & Hỗ Trợ Sàn'
                  : 'Quản Lý Tin Nhắn Cửa Hàng'
                : 'ZeroMall Chat'}
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
              <button
                onClick={() => setWindowMode(windowMode === 'POPUP' ? 'EXPANDED' : 'POPUP')}
                className="p-1.5 hover:text-white hover:bg-white/15 rounded-lg transition cursor-pointer text-sm"
                title={windowMode === 'POPUP' ? 'Phóng to toàn màn hình' : 'Thu nhỏ cửa sổ'}
              >
                {windowMode === 'POPUP' ? '⤢' : '↙'}
              </button>
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
          
          {/* Quick CSKH Button for Buyer */}
          {!isSeller && (
            <div className="p-2.5 bg-emerald-50/70 border-b border-emerald-100">
              <button
                onClick={handleOpenPlatformSupport}
                className="w-full bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-700 font-extrabold text-xs py-2 px-3 rounded-xl transition shadow-3xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🎧</span>
                <span>Chat với CSKH Sàn ZeroMall</span>
              </button>
            </div>
          )}

          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/40">
            <div className="relative">
              <input
                type="text"
                placeholder={isSeller ? "Tìm tên khách hàng..." : "Tìm tên Shop hoặc CSKH..."}
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
                  {isSeller
                    ? 'Tin nhắn của khách hàng sẽ hiển thị tại đây.'
                    : 'Bấm "Chat ngay" tại trang sản phẩm, trang shop hoặc đơn hàng để trò chuyện.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const partnerName = getPartnerName(conv);
                const partnerLogo = getPartnerLogo(conv);
                const unread = isSeller ? conv.unreadShopCount : conv.unreadBuyerCount;
                const isSupport = conv.shopId === 'PLATFORM_SUPPORT';

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
                    {/* Avatar Circle */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full border overflow-hidden flex items-center justify-center font-black text-sm shadow-2xs ${
                        isSupport
                          ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white border-rose-200 text-lg'
                          : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-emerald-200'
                      }`}>
                        {isSupport ? (
                          <span>🎧</span>
                        ) : partnerLogo ? (
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
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/40 select-none space-y-4">
              <div className="w-48 h-36 relative flex items-center justify-center">
                <div className="w-44 h-30 bg-white border-2 border-slate-300 rounded-xl shadow-md flex flex-col justify-between p-3 relative">
                  <div className="space-y-2">
                    <div className="h-4 bg-emerald-600/80 rounded-md w-1/2"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded-md w-2/3"></div>
                  </div>
                  <div className="absolute -top-3 -right-3 bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-lg font-black text-xs flex items-center justify-center gap-1.5 border-2 border-white">
                    <span>💬</span>
                    <span>•••</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">
                  {isSeller
                    ? sellerShopId === 'PLATFORM_SUPPORT'
                      ? 'Kênh Hỗ Trợ & Tiếp Nhận Yêu Cầu Khách Hàng'
                      : 'Hộp Thư Cửa Hàng ZeroMall'
                    : 'Chào mừng bạn đến với ZeroMall Chat'}
                </h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {isSeller
                    ? 'Chọn một khách hàng từ danh sách bên trái để giải đáp và hỗ trợ!'
                    : 'Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Active Conversation Top Bar */}
              <div className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0 shadow-3xs">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center font-bold text-sm shadow-2xs ${
                    isPlatformSupportConv
                      ? 'bg-gradient-to-tr from-rose-500 to-amber-500 text-white border-rose-200 text-lg'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-emerald-200'
                  }`}>
                    {isPlatformSupportConv ? (
                      <span>🎧</span>
                    ) : getPartnerLogo(selectedConv) ? (
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
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      {getPartnerName(selectedConv)}
                      {isPlatformSupportConv && (
                        <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-black px-1.5 py-0.5 rounded-sm">
                          CHÍNH THỨC
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{isPlatformSupportConv ? 'CSKH Trực Tuyến 24/7' : 'Đang trực tuyến'}</span>
                    </p>
                  </div>
                </div>

                {!isSeller && !isPlatformSupportConv && selectedConv.shopId !== 'zeromall-official' && (
                  <button
                    onClick={() => window.location.href = `/shop/${selectedConv.shopId}`}
                    className="px-3 py-1.5 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏪</span> Xem Shop
                  </button>
                )}
              </div>

              {/* ATTACHED CONTEXT BANNERS (Product or Order attached) */}
              {activeProduct && !isSeller && !isPlatformSupportConv && (
                <div className="bg-emerald-50/90 border-b border-emerald-100 p-2.5 px-4 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={activeProduct.image || 'https://placehold.co/100x100?text=Product'}
                      alt={activeProduct.name}
                      className="w-9 h-9 rounded-lg object-cover border border-emerald-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{activeProduct.name}</p>
                      <p className="text-[10px] font-extrabold text-emerald-700">
                        {typeof activeProduct.price === 'number' ? `${activeProduct.price.toLocaleString('vi-VN')}đ` : activeProduct.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSendProductCard}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] rounded-lg shadow-3xs cursor-pointer transition flex items-center gap-1"
                    >
                      <span>🛍️</span> Gửi Cho Shop
                    </button>
                    <button
                      onClick={() => setActiveProduct(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {activeOrder && !isSeller && !isPlatformSupportConv && (
                <div className="bg-amber-50/90 border-b border-amber-100 p-2.5 px-4 flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl">📦</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800">
                        Đơn hàng #{activeOrder.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        Tổng tiền: <strong className="text-amber-700">{Number(activeOrder.totalAmount).toLocaleString('vi-VN')}đ</strong> • Trạng thái: {activeOrder.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSendOrderCard}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] rounded-lg shadow-3xs cursor-pointer transition flex items-center gap-1"
                    >
                      <span>📦</span> Gửi Cho Shop
                    </button>
                    <button
                      onClick={() => setActiveOrder(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* CSKH Quick Topics if Platform Support & Empty Conversation */}
              {isPlatformSupportConv && !isSeller && messages.length <= 2 && (
                <div className="p-3 bg-rose-50/50 border-b border-rose-100 space-y-2 text-xs shrink-0">
                  <span className="font-extrabold text-slate-700 text-[11px] flex items-center gap-1">
                    <span>💡</span> Chọn nhanh chủ đề bạn cần Sàn can thiệp:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '💸 Lỗi thanh toán SePay / Ví',
                      '📦 Chưa nhận được hàng / Giao trễ',
                      '🔄 Yêu cầu Trả hàng & Hoàn tiền',
                      '⚖️ Khiếu nại Người bán / Hàng giả',
                      '👤 Vấn đề tài khoản & bảo mật',
                    ].map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendSupportIssue(topic)}
                        className="bg-white hover:bg-rose-500 hover:text-white text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-full border border-slate-200 transition cursor-pointer shadow-3xs"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    <p className="font-bold text-slate-600">
                      {isPlatformSupportConv
                        ? 'Chào bạn! Bộ phận CSKH ZeroMall luôn sẵn sàng giải đáp thắc mắc của bạn.'
                        : 'Hãy gửi tin nhắn đầu tiên để mở đầu cuộc trò chuyện!'}
                    </p>
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
                        {/* PRODUCT CARD MESSAGE */}
                        {msg.type === 'PRODUCT_CARD' && msg.metadata ? (
                          <div className={`p-3 rounded-2xl max-w-xs space-y-2.5 shadow-2xs border ${
                            isMyMessage ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                          }`}>
                            <div className="flex gap-2.5 items-center">
                              <img
                                src={msg.metadata.image || 'https://placehold.co/100x100?text=Product'}
                                alt={msg.metadata.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                                  {msg.metadata.name}
                                </h4>
                                <span className="text-xs font-black text-emerald-600">
                                  {typeof msg.metadata.price === 'number'
                                    ? `${msg.metadata.price.toLocaleString('vi-VN')}đ`
                                    : msg.metadata.price}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 bg-white/80 p-2 rounded-lg">
                              {msg.content}
                            </div>
                            {msg.metadata.id && (
                              <button
                                onClick={() => window.open(`/product/${toSlug(msg.metadata.name)}-i.${msg.metadata.id}`, '_blank')}
                                className="w-full text-center text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 py-1.5 rounded-md border border-emerald-200 transition cursor-pointer"
                              >
                                Xem chi tiết sản phẩm ➔
                              </button>
                            )}
                          </div>
                        ) : msg.type === 'ORDER_CARD' && msg.metadata ? (
                          /* ORDER CARD MESSAGE */
                          <div className={`p-3 rounded-2xl max-w-xs space-y-2 shadow-2xs border ${
                            isMyMessage ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-1.5 font-bold text-xs text-slate-800">
                              <span>📦</span>
                              <span>Đơn hàng #{msg.metadata.id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              <p>Tổng tiền: <strong className="text-amber-700 font-black">{Number(msg.metadata.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></p>
                              <p>Trạng thái: <strong className="text-slate-800 font-bold">{msg.metadata.status}</strong></p>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 bg-white/80 p-2 rounded-lg">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          /* NORMAL TEXT MESSAGE */
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                              isMyMessage
                                ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs font-semibold'
                            }`}
                          >
                            {msg.content}
                          </div>
                        )}

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
                  <button className="hover:text-emerald-600 cursor-pointer bg-transparent border-none transition" title="Biểu cảm">😊</button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isPlatformSupportConv
                        ? "Mô tả vấn đề bạn cần CSKH Sàn hỗ trợ..."
                        : "Nhập nội dung tin nhắn..."
                    }
                    className="flex-1 bg-slate-100/90 border border-slate-200 rounded-full px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                  <button
                    onClick={() => handleSendMessage()}
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
