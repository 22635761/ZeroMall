export class CreateProductDto {
  shopId: string;
  name: string;
  image?: string;
  category: string;
  brand: string;
  description: string;
  price: string;
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
}

export class UpdateProductDto {
  name?: string;
  image?: string;
  category?: string;
  brand?: string;
  description?: string;
  price?: string;
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
