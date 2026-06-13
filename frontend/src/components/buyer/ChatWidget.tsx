import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  sender: 'buyer' | 'seller'
  text: string
  time: string
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'seller',
      text: 'Dạ, chào bạn! ZeroMall Official Mall rất vui được hỗ trợ. Bạn cần tư vấn về sản phẩm nào hôm nay ạ? 💚',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!inputText.trim()) return

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'buyer',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, newMsg])
    setInputText('')
    setIsTyping(true)

    // Simulate Seller typing & replying
    setTimeout(() => {
      setIsTyping(false)
      const replyText = getSimulatedReply(inputText)
      const replyMsg: Message = {
        id: `m-${Date.now() + 1}`,
        sender: 'seller',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, replyMsg])
    }, 1200)
  }

  const getSimulatedReply = (userInput: string): string => {
    const text = userInput.toLowerCase()
    if (text.includes('iphone') || text.includes('ip')) {
      return 'Dạ iPhone 15 Pro Max Titanium bản chính hãng VN/A đang có sẵn hàng tại kho. Nếu bạn thanh toán ngay bây giờ sẽ được miễn phí ship toàn quốc và tặng thêm củ sạc 20W ạ! 📱'
    }
    if (text.includes('sony') || text.includes('tai nghe')) {
      return 'Sony WH-1000XM5 bên mình là hàng nhập khẩu chính hãng, bảo hành 12 tháng. Dòng này chống ồn cực tốt, đeo cực êm tai nha bạn!'
    }
    if (text.includes('bàn phím') || text.includes('keyboard') || text.includes('gmmk') || text.includes('logitech')) {
      return 'Bên mình có phím cơ custom GMMK 2 và Logitech MX Keys Mini gõ rất êm. Các phím đều là hàng chính hãng bảo hành dài hạn ạ!'
    }
    if (text.includes('ship') || text.includes('giao')) {
      return 'Dạ bên mình liên kết với GHN và GHTK. Đơn hàng giao trong nội thành Hà Nội/TP.HCM mất khoảng 1 ngày, các tỉnh khác từ 2-3 ngày ạ.'
    }
    if (text.includes('voucher') || text.includes('giảm giá') || text.includes('mã')) {
      return 'Dạ bạn có thể áp dụng Voucher Freeship Xtra hoặc Voucher Hoàn Xu 10% ngay tại phần Thanh Toán của Giỏ Hàng để được hưởng ưu đãi tối đa ạ!'
    }
    return 'Dạ shop cảm ơn bạn đã quan tâm. Bạn có thể nhấn nút "Thêm vào giỏ hàng" hoặc "Mua Ngay" để đặt hàng nhanh nhất, shop sẽ chuẩn bị và bàn giao cho Đơn vị vận chuyển sớm nhất cho bạn ạ! 📦'
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 text-slate-800">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 cursor-pointer transition duration-200 relative group"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
        {/* Tooltip */}
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-[#222] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition duration-150 shadow-xl whitespace-nowrap">
            Chat với người bán 💬
          </span>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="absolute bottom-18 right-0 w-80 sm:w-96 h-[420px] bg-[#f9f9f9] border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between animate-in fade-in slide-in-from-bottom-3 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 bg-emerald-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-xl">🏪</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white"></span>
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold">ZeroMall Official Mall</h4>
                <p className="text-[9px] text-white/80 font-medium">Vừa hoạt động</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-slate-200 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col max-w-[80%] ${
                  m.sender === 'buyer' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                    m.sender === 'buyer'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-3 rounded-lg w-16 mr-auto">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Input form */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition bg-slate-50"
            />
            <button
              onClick={handleSend}
              className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer transition active:scale-95 shadow-sm"
            >
              Gửi
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
