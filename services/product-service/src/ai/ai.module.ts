import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalAiService } from './local-ai.service';
import { GeminiAiService } from './gemini-ai.service';
import { AiSearchService } from './ai-search.service';
import { AiModerationService } from './ai-moderation.service';
import { RecommendationService } from './recommendation.service';
import { AiAssistantService } from './ai-assistant.service';
import { AiCategoryAuditorService } from './ai-category-auditor.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    PrismaService,
    LocalAiService,
    GeminiAiService,
    AiSearchService,
    AiModerationService,
    RecommendationService,
    AiAssistantService,
    AiCategoryAuditorService,
  ],
  exports: [
    AiSearchService,
    AiModerationService,
    LocalAiService,
    GeminiAiService,
    RecommendationService,
    AiAssistantService,
    AiCategoryAuditorService,
  ],
})
export class AiModule {}
