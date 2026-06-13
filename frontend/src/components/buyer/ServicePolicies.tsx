import React from 'react'

export const ServicePolicies: React.FC = () => {
  const policies = [
    {
      title: 'Hàng Chính Hãng 100%',
      desc: 'Tất cả sản phẩm trên gian hàng ZeroMall Mall đều được cam kết chính hãng 100%. Phát hiện hàng giả hoàn tiền gấp đôi.',
      icon: '🛡️',
      badge: 'Chính Hãng',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600'
    },
    {
      title: 'Đổi Trả Dễ Dàng 7 Ngày',
      desc: 'Bạn được quyền hoàn trả sản phẩm miễn phí trong vòng 7 ngày kể từ ngày nhận hàng với bất cứ lý do gì (bao gồm cả đổi ý).',
      icon: '🔄',
      badge: 'Đổi Trả Miễn Phí',
      color: 'bg-teal-50 border-teal-200 text-teal-600'
    },
    {
      title: 'Miễn Phí Vận Chuyển',
      desc: 'Hỗ trợ chi phí vận chuyển toàn quốc cho đơn hàng từ 0đ. Áp dụng mã miễn phí vận chuyển Freeship Xtra ngay tại bước thanh toán.',
      icon: '🚚',
      badge: 'Freeship Xtra',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600'
    },
    {
      title: 'Thanh Khoản An Toàn',
      desc: 'Bảo mật thông tin thanh toán tuyệt đối. Tiền mua hàng được giữ tại hệ thống cho tới khi bạn nhận được hàng và xác nhận hài lòng.',
      icon: '💳',
      badge: 'ZeroMall Đảm Bảo',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-600'
    }
  ]

  return (
    <section className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-6 text-left">
      <div className="border-b border-slate-100 pb-3 mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cam Kết Từ Hệ Thống</h2>
        <p className="text-xs text-slate-400 mt-1">Nền tảng mua sắm an toàn, tiện lợi và tin cậy hàng đầu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((p, idx) => (
          <div
            key={idx}
            className="p-5 border border-slate-100 hover:border-emerald-500/20 rounded-xl hover:shadow-md transition duration-200 flex gap-4 items-start bg-slate-50/20"
          >
            <span className="text-3xl p-3 bg-white border border-slate-100 rounded-xl shrink-0 shadow-3xs">
              {p.icon}
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{p.title}</h3>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-sm ${p.color}`}>
                  {p.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
