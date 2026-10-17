import React from 'react';

interface AssistantProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    sales?: number;
    rating?: number;
    recommendationReason?: string;
  };
  onSelectProduct: (productId: string, productName: string) => void;
}

export const AssistantProductCard: React.FC<AssistantProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
  const priceFormatted = (product.price || 0).toLocaleString('vi-VN') + 'đ';
  const originalPriceFormatted = product.originalPrice
    ? (product.originalPrice || 0).toLocaleString('vi-VN') + 'đ'
    : null;

  return (
    <div
      onClick={() => onSelectProduct(product.id, product.name)}
      className="w-48 sm:w-auto min-w-[170px] bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between shrink-0 group cursor-pointer hover:border-indigo-400"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
          loading="lazy"
        />

        {product.recommendationReason && (
          <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs max-w-[90%] truncate">
            {product.recommendationReason}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h4
            className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition"
            title={product.name}
          >
            {product.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
            <span className="text-amber-500 font-bold">★ {product.rating || 4.9}</span>
            <span>•</span>
            <span>Đã bán {product.sales || 0}</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-black text-rose-600">{priceFormatted}</span>
            {originalPriceFormatted && (
              <span className="text-[10px] text-slate-400 line-through">
                {originalPriceFormatted}
              </span>
            )}
          </div>

          <button
            type="button"
            className="w-full mt-2 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-200 hover:border-indigo-600 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Xem Chi Tiết</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
