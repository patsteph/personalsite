/**
 * Blog Writing Assistant Module
 * 
 * Provides AI-powered writing assistance for blog content including:
 * - Grammar and spelling checks
 * - Style enhancement
 * - Tone adjustment
 * - Title suggestions
 * - Content expansion
 */

import { AIResponse, AIServiceConfig, AITask, aiService } from './ai-service';

// Blog writing assistance tasks
export type AssistanceTask = 
  | 'grammar'      // Fix grammar and spelling
  | 'enhance'      // Enhance writing style and clarity
  | 'tone'         // Adjust tone (formal, casual, technical, etc.)
  | 'expand'       // Expand on ideas or sections
  | 'summarize'    // Create a concise summary
  | 'title'        // Generate title suggestions
  | 'seo';         // Optimize for search engines

export interface ToneOption {
  name: string;
  description: string;
  value: string;
}

// Available tone options
export const toneOptions: ToneOption[] = [
  { name: 'Professional', description: 'Clear, authoritative, and straightforward', value: 'professional' },
  { name: 'Casual', description: 'Relaxed, conversational, and approachable', value: 'casual' },
  { name: 'Technical', description: 'Precise, detailed, and industry-specific', value: 'technical' },
  { name: 'Academic', description: 'Scholarly, objective, and research-based', value: 'academic' },
  { name: 'Enthusiastic', description: 'Energetic, positive, and engaging', value: 'enthusiastic' },
  { name: 'Humorous', description: 'Light-hearted, witty, and entertaining', value: 'humorous' },
];

/**
 * Base writing task implementation
 */
abstract class BaseWritingTask implements AITask {
  constructor(protected config?: Partial<AIServiceConfig>) {}
  
  abstract buildPrompt(input: string, options?: any): string;
  
  async execute(input: string, options?: any): Promise<AIResponse> {
    const prompt = this.buildPrompt(input, options);
    return aiService.generateText(prompt, this.config);
  }
}

/**
 * Grammar and spelling checker
 */
export class GrammarChecker extends BaseWritingTask {
  buildPrompt(input: string): string {
    return `
You are a skilled editor with excellent command of grammar, spelling, and punctuation.
Please review the following text and correct any grammar, spelling, or punctuation errors.
Maintain the original tone and style of the writing.
Return only the corrected text without additional comments.

TEXT TO CORRECT:
${input}
    `.trim();
  }
}

/**
 * Writing style enhancer
 */
export class StyleEnhancer extends BaseWritingTask {
  buildPrompt(input: string): string {
    return `
You are an expert writing coach with a talent for improving prose without changing the meaning.
Please enhance the following text to make it more engaging, clear, and impactful.
Improve word choice, sentence structure, and flow while preserving the original meaning and key points.
Return only the enhanced text without additional comments.

TEXT TO ENHANCE:
${input}
    `.trim();
  }
}

/**
 * Tone adjuster
 */
export class ToneAdjuster extends BaseWritingTask {
  buildPrompt(input: string, options: { tone: string }): string {
    return `
You are a skilled writing coach who specializes in adjusting the tone of written content.
Please rewrite the following text to match a ${options.tone} tone.
Preserve the original meaning, information, and key points while adjusting the style and voice.
Return only the rewritten text without additional comments.

TEXT TO ADJUST:
${input}
    `.trim();
  }
}

/**
 * Content expander
 */
export class ContentExpander extends BaseWritingTask {
  buildPrompt(input: string, options?: { focus?: string }): string {
    const focusInstruction = options?.focus 
      ? `Focus particularly on expanding the aspects related to: ${options.focus}`
      : 'Determine which aspects would benefit most from expansion and focus on those.';
    
    return `
You are a creative content developer with expertise in elaborating on ideas.
Please expand on the following text to add depth, detail, and valuable insights.
${focusInstruction}
Maintain the original tone and style while making the content more comprehensive.
Return only the expanded text without additional comments.

TEXT TO EXPAND:
${input}
    `.trim();
  }
}

/**
 * Content summarizer
 */
export class ContentSummarizer extends BaseWritingTask {
  buildPrompt(input: string, options?: { length?: 'short' | 'medium' | 'long' }): string {
    const lengthInstruction = options?.length === 'short' 
      ? 'Create a very concise summary in 1-2 sentences.'
      : options?.length === 'medium'
      ? 'Create a moderate-length summary in 3-4 sentences.'
      : 'Create a comprehensive summary in 5-6 sentences.';
    
    return `
You are an expert at distilling complex information into clear summaries.
Please summarize the following text while preserving the key points and main message.
${lengthInstruction}
Return only the summary without additional comments.

TEXT TO SUMMARIZE:
${input}
    `.trim();
  }
}

/**
 * Title generator
 */
export class TitleGenerator extends BaseWritingTask {
  buildPrompt(input: string, options?: { count?: number }): string {
    const count = options?.count || 5;
    
    return `
You are a creative copywriter who specializes in crafting engaging headlines and titles.
Based on the following content, generate ${count} compelling title options.
The titles should be attention-grabbing, relevant to the content, and optimized for both readers and SEO.
Return only a numbered list of titles without additional comments.

CONTENT:
${input}
    `.trim();
  }
}

/**
 * SEO optimizer
 */
export class SEOOptimizer extends BaseWritingTask {
  buildPrompt(input: string, options?: { keywords?: string[] }): string {
    const keywordInstruction = options?.keywords && options.keywords.length > 0
      ? `Focus on incorporating these keywords naturally: ${options.keywords.join(', ')}`
      : 'Identify and incorporate relevant keywords that would perform well in search engines.';
    
    return `
You are an SEO expert who helps writers optimize their content for search engines.
Please rewrite the following text to improve its SEO performance while maintaining readability and value.
${keywordInstruction}
Improve the heading structure, keyword density, and overall SEO best practices.
Return only the optimized text without additional comments.

TEXT TO OPTIMIZE:
${input}
    `.trim();
  }
}

/**
 * Factory function to create writing assistance tasks
 */
export function createWritingAssistant(
  taskType: AssistanceTask,
  config?: Partial<AIServiceConfig>
): AITask {
  switch (taskType) {
    case 'grammar':
      return new GrammarChecker(config);
    case 'enhance':
      return new StyleEnhancer(config);
    case 'tone':
      return new ToneAdjuster(config);
    case 'expand':
      return new ContentExpander(config);
    case 'summarize':
      return new ContentSummarizer(config);
    case 'title':
      return new TitleGenerator(config);
    case 'seo':
      return new SEOOptimizer(config);
    default:
      throw new Error(`Unsupported writing task: ${taskType}`);
  }
}

/**
 * Helper function to get all available writing tasks
 */
export function getAvailableTasks(): { id: AssistanceTask; name: string; description: string }[] {
  return [
    { id: 'grammar', name: 'Check Grammar', description: 'Fix spelling, grammar, and punctuation errors' },
    { id: 'enhance', name: 'Enhance Writing', description: 'Improve clarity, flow, and impact' },
    { id: 'tone', name: 'Adjust Tone', description: 'Change the tone to match your desired style' },
    { id: 'expand', name: 'Expand Content', description: 'Add depth and detail to your writing' },
    { id: 'summarize', name: 'Summarize', description: 'Create a concise summary of your content' },
    { id: 'title', name: 'Generate Titles', description: 'Create compelling headline options' },
    { id: 'seo', name: 'Optimize for SEO', description: 'Improve search engine performance' },
  ];
}
