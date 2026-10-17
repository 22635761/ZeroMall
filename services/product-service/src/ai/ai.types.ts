export class AiModerateDto {
  text: string;
  type?: 'TITLE' | 'DESCRIPTION';
  category?: string;
  customApiKey?: string;
}

export class AiSemanticSearchDto {
  query: string;
  category?: string;
  limit?: number;
  customApiKey?: string;
}

export class AiVisualSearchDto {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  limit?: number;
  customApiKey?: string;
}

export interface SemanticSearchResult {
  query: string;
  detectedIntent: string;
  suggestedCategory?: string;
  expandedKeywords: string[];
  priceRange?: { min?: number; max?: number };
  attributes?: Record<string, any>;
  products: any[];
  totalMatches: number;
  source: 'local-knowledge' | 'gemini-ai' | 'local-ai-engine';
  hitCount?: number;
  message?: string;
}

export interface VisualSearchResult {
  visualAnalysis: {
    detectedProduct: string;
    suggestedCategory?: string;
    dominantColors: string[];
    style?: string;
    material?: string;
    gender?: string;
    searchTerms: string[];
  };
  products: any[];
  totalMatches: number;
  source: 'local-knowledge' | 'gemini-ai' | 'local-ai-engine' | 'clip-vector-engine';
  hitCount?: number;
  message?: string;
}

export interface SearchStatsResult {
  totalLearned: number;
  totalHits: number;
  semanticCount: number;
  visualCount: number;
  modelStatus: string;
  lastUpdated: Date | null;
}

export interface AiModerationResult {
  isViolated: boolean;
  violationType: 'SAFE' | 'NARCOTICS' | 'WEAPONS' | 'COUNTERFEIT' | 'OBSCENE' | 'DANGEROUS' | 'RESTRICTED';
  confidence: number;
  reason: string;
  suggestion: string;
  detectedKeywords: string[];
  source: 'local-knowledge' | 'gemini-ai' | 'safe-pattern' | 'local-ai-engine';
  hitCount?: number;
  message?: string;
  stats?: {
    totalLearned: number;
    totalHits: number;
    violationCount: number;
  };
}

export interface ModerationStatsResult {
  totalLearned: number;
  totalHits: number;
  violationCount: number;
  modelStatus: string;
  lastUpdated: Date | null;
}
