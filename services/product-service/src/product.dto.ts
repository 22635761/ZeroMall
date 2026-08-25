export class CreateProductDto {
  shopId: string;
  name: string;
  image?: string;
  images?: string;
  video?: string;
  category: string;
  brand: string;
  description: string;
  price: string;
  originalPrice?: string;
  stock: number;
  sales?: number;
  status: string;
  sku?: string;
  variationsText?: string;
  hasVariations?: boolean;
  variationGroups?: string;
  variationRows?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  condition?: string;
  isPreOrder?: boolean;
  preOrderDays?: string;
  costPrice?: number;
}

export class UpdateProductDto {
  name?: string;
  image?: string;
  images?: string;
  video?: string;
  category?: string;
  brand?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  costPrice?: number;
  stock?: number;
  sales?: number;
  status?: string;
  sku?: string;
  variationsText?: string;
  hasVariations?: boolean;
  variationGroups?: string;
  variationRows?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  condition?: string;
  isPreOrder?: boolean;
  preOrderDays?: string;
}

export class UpdatePriceDto {
  shopId?: string; // Optional for validation (if seller)
  newPrice: number;
  originalPrice?: number;
  changedBy: string; // Email or name
  changedByRole?: string; // "SELLER" | "ADMIN"
  reason?: string;
}

export class ImportBatchDto {
  shopId?: string; // Optional for validation (if seller)
  costPrice: number;
  quantity: number;
  invoiceCode?: string;
  supplier?: string;
  note?: string;
  importedBy: string;
  importDate?: string;
}
