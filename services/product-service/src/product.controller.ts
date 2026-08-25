import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, UpdatePriceDto, ImportBatchDto } from './product.dto';
import { CreateReviewDto } from './review.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query('shopId') shopId?: string, @Query('category') category?: string) {
    return this.productService.findAll(shopId, category);
  }

  // --- STATIC ROUTES (Must be before wildcard :id routes) ---

  @Get('price-analytics')
  async getPriceAnalytics(
    @Query('shopId') shopId?: string,
    @Query('productId') productId?: string,
    @Query('range') range?: string,
  ) {
    return this.productService.getPriceAnalytics(shopId, productId, range || '30d');
  }

  @Post('purchase')
  async purchase(@Body('items') items: { productId: string; quantity: number }[]) {
    return this.productService.purchase(items);
  }

  @Get('shops/:shopId/stats')
  async getShopStats(@Param('shopId') shopId: string) {
    return this.productService.getShopStats(shopId);
  }

  @Get('categories')
  async getAllCategories() {
    return this.productService.getAllCategories();
  }

  @Post('categories')
  async createCategory(@Body('name') name: string) {
    return this.productService.createCategory(name);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.productService.deleteCategory(id);
  }

  @Get('violations')
  async getViolatedProducts() {
    return this.productService.getViolatedProducts();
  }

  @Put('violations/:id')
  async updateProductViolation(
    @Param('id') id: string,
    @Body('isViolated') isViolated: boolean,
    @Body('reason') reason?: string
  ) {
    return this.productService.updateProductViolation(id, isViolated, reason);
  }

  @Get('flash-sales')
  async getFlashSales() {
    return this.productService.getFlashSales();
  }

  @Post('flash-sales')
  async createFlashSale(@Body('timeSlot') timeSlot: string) {
    return this.productService.createFlashSale(timeSlot);
  }

  @Put('flash-sales/:id/status')
  async updateFlashSaleStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.productService.updateFlashSaleStatus(id, status);
  }

  @Get('shop/:shopId/reviews')
  async getShopReviews(@Param('shopId') shopId: string) {
    return this.productService.getShopReviews(shopId);
  }

  // --- WILDCARD / DYNAMIC ID ROUTES ---

  @Post(':id/update-price')
  async updatePrice(@Param('id') id: string, @Body() dto: UpdatePriceDto) {
    return this.productService.updatePrice(id, dto);
  }

  @Post(':id/import-batch')
  async importBatch(@Param('id') id: string, @Body() dto: ImportBatchDto) {
    return this.productService.importBatch(id, dto);
  }

  @Get(':id/price-history')
  async getPriceHistory(@Param('id') id: string) {
    return this.productService.getPriceHistory(id);
  }

  @Get(':id/cost-history')
  async getCostHistory(@Param('id') id: string) {
    return this.productService.getCostHistory(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Put(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    return this.productService.toggleStatus(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.productService.getReviews(id);
  }

  @Post(':id/reviews')
  async createReview(@Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.productService.createReview(id, dto);
  }

  @Get(':id/likes')
  async getProductLikes(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.productService.getProductLikes(id, userId);
  }

  @Post(':id/like')
  async toggleLikeProduct(@Param('id') id: string, @Body('userId') userId: string) {
    return this.productService.toggleLikeProduct(id, userId);
  }
}
