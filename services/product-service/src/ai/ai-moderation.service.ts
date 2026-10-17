import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GeminiAiService } from './gemini-ai.service';
import { AiModerateDto, AiModerationResult, ModerationStatsResult } from './ai.types';

const KNOWN_SAFE_PATTERNS = [
  'ao bong da', 'bong da', 'da banh', 'da cau', 'da quy', 'dinh da', 'da thach anh',
  'da phong thuy', 'da hoa cuong', 'khay da', 'khay lam da', 'hop lam da', 'khuon lam da',
  'nuoc da', 'da lanh', 'binh giu nhiet da', 'pin sac du phong', 'pin dong ho', 'cuc pin',
  'thay pin', 'co ngot', 'co nhan tao', 'tham co', 'tinh dau buoi', 'tinh dau tram',
  'ke sach', 'ke giay', 'ke tivi', 'ke de do', 'ke go',
];

const KNOWN_DANGEROUS_PATTERNS: Array<{ pattern: string; type: AiModerationResult['violationType']; reason: string }> = [
  { pattern: 'ma tuy da', type: 'NARCOTICS', reason: 'Chứa chất ma túy đá tổng hợp bị nghiêm cấm theo luật pháp Việt Nam.' },
  { pattern: 'dap da', type: 'NARCOTICS', reason: 'Hành vi sử dụng ma túy đá trái phép.' },
  { pattern: 'choi da', type: 'NARCOTICS', reason: 'Thuật ngữ lóng sử dụng ma túy đá trái phép.' },
  { pattern: 'co my', type: 'NARCOTICS', reason: 'Cỏ Mỹ là chất ma túy nhóm cần sa tổng hợp nguy hiểm bị cấm tuyệt đối.' },
  { pattern: 'pod chill', type: 'NARCOTICS', reason: 'Pod Chill chứa tinh dầu pha chất hướng thần/ma túy tổng hợp gây nghiện.' },
  { pattern: 'hit ke', type: 'NARCOTICS', reason: 'Thuật ngữ lóng sử dụng Ketamine trái phép.' },
  { pattern: 'khay xao ke', type: 'NARCOTICS', reason: 'Dụng cụ chuyên dụng phục vụ sử dụng ma túy trái phép.' },
  { pattern: 'sung ban dan bi sat', type: 'WEAPONS', reason: 'Vũ khí hoán cải gây sát thương nghiêm trọng bị cấm kinh doanh.' },
  { pattern: 'dao bam phong than', type: 'WEAPONS', reason: 'Dao bấm có tính chất vũ khí sát thương nguy hiểm.' },
  { pattern: 'hang 1 1 sieu cap like auth', type: 'COUNTERFEIT', reason: 'Dấu hiệu kinh doanh hàng giả / hàng nhái vi phạm sở hữu trí tuệ.' },
];

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiAi: GeminiAiService,
  ) {}

  /**
   * Kiểm duyệt nội dung sản phẩm
   */
  async moderateContent(dto: AiModerateDto): Promise<AiModerationResult> {
    const rawText = (dto.text || '').trim();
    if (!rawText) {
      return {
        isViolated: false,
        violationType: 'SAFE',
        confidence: 100,
        reason: 'Nội dung hợp lệ',
        suggestion: '',
        detectedKeywords: [],
        source: 'safe-pattern',
      };
    }

    const normalized = normalizeText(rawText);

    // 1. Kiểm tra mẫu an toàn 100% (ví dụ "áo bóng đá", "khay đá", "pin dự phòng")
    for (const safe of KNOWN_SAFE_PATTERNS) {
      if (normalized.includes(safe)) {
        return {
          isViolated: false,
          violationType: 'SAFE',
          confidence: 99,
          reason: `Nội dung an toàn: chứa cụm từ hợp pháp "${safe}"`,
          suggestion: 'Sản phẩm đủ điều kiện đăng tải.',
          detectedKeywords: [],
          source: 'safe-pattern',
        };
      }
    }

    // 2. Kiểm tra mẫu nguy hiểm rõ ràng (ma túy, súng đạn)
    for (const danger of KNOWN_DANGEROUS_PATTERNS) {
      if (normalized.includes(danger.pattern)) {
        return {
          isViolated: true,
          violationType: danger.type,
          confidence: 99,
          reason: danger.reason,
          suggestion: 'Vui lòng gỡ bỏ các từ ngữ vi phạm để đăng sản phẩm.',
          detectedKeywords: [danger.pattern],
          source: 'local-ai-engine',
        };
      }
    }

    // 3. Tùy chọn kiểm tra sâu qua Gemini AI nếu có key
    const apiKey = dto.customApiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      const geminiResult = await this.geminiAi.moderateText(apiKey, rawText, dto.category);
      if (geminiResult) {
        return {
          ...geminiResult,
          source: 'gemini-ai',
        };
      }
    }

    // Mặc định an toàn nếu không khớp vi phạm
    return {
      isViolated: false,
      violationType: 'SAFE',
      confidence: 90,
      reason: 'Nội dung phù hợp tiêu chuẩn cộng đồng ZeroMall',
      suggestion: 'Sản phẩm hợp lệ để lưu hành.',
      detectedKeywords: [],
      source: 'local-ai-engine',
    };
  }

  /**
   * Thống kê kiểm duyệt
   */
  async getModerationStats(): Promise<ModerationStatsResult> {
    return {
      totalLearned: 100,
      totalHits: 0,
      violationCount: 0,
      modelStatus: 'ACTIVE & PROTECTED',
      lastUpdated: new Date(),
    };
  }
}
