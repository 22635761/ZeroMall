import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { AiSearchService } from './ai-search.service';
import { AiModerationService } from './ai-moderation.service';
import { RecommendationService, TrackActionDto } from './recommendation.service';
import { AiAssistantService, AssistantChatDto } from './ai-assistant.service';
import { AiCategoryAuditorService, AuditProductDto } from './ai-category-auditor.service';
import { AiSemanticSearchDto, AiVisualSearchDto, AiModerateDto } from './ai.types';

@Controller('products')
export class AiController {
  constructor(
    private readonly aiSearchService: AiSearchService,
    private readonly aiModerationService: AiModerationService,
    private readonly recommendationService: RecommendationService,
    private readonly aiAssistantService: AiAssistantService,
    private readonly aiCategoryAuditorService: AiCategoryAuditorService,
  ) {}

  @Post('ai-search/semantic')
  async searchSemantic(@Body() dto: AiSemanticSearchDto) {
    return this.aiSearchService.searchSemantic(dto);
  }

  @Post('ai-search/visual')
  async searchVisual(@Body() dto: AiVisualSearchDto) {
    return this.aiSearchService.searchVisual(dto);
  }

  @Get('ai-search/stats')
  async getSearchStats() {
    return this.aiSearchService.getSearchStats();
  }

  @Post('ai-moderate')
  async moderateContent(@Body() dto: AiModerateDto) {
    return this.aiModerationService.moderateContent(dto);
  }

  @Get('ai-moderate/stats')
  async getModerationStats() {
    return this.aiModerationService.getModerationStats();
  }

  @Get('ai/recommendations')
  async getRecommendations(
    @Query('userId') userId?: string,
    @Query('gender') gender?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recommendationService.getPersonalizedFeed({
      userId,
      gender,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Post('ai/track')
  async trackUserAction(@Body() dto: TrackActionDto) {
    await this.recommendationService.trackUserAction(dto);
    return { success: true };
  }

  @Post('ai/assistant/chat')
  async assistantChat(@Body() dto: AssistantChatDto) {
    return this.aiAssistantService.processChat(dto);
  }

  @Post('ai/audit-category')
  async auditCategory(@Body() dto: AuditProductDto) {
    return this.aiCategoryAuditorService.auditProduct(dto);
  }

  @Get('ai/audit-scan')
  async auditScan(@Query('shopId') shopId?: string) {
    return this.aiCategoryAuditorService.scanProducts(shopId);
  }

  @Post('ai/fix-category/:id')
  async fixCategory(
    @Param('id') id: string,
    @Body('category') category: string,
  ) {
    return this.aiCategoryAuditorService.fixProductCategory(id, category);
  }
}
