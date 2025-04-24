/**
 * AI Service Module
 * 
 * Provides a unified interface for interacting with different AI providers
 * (OpenAI, Anthropic) while abstracting the implementation details.
 */

// Type for supported AI providers
export type AIProvider = 'openai' | 'anthropic';

// Configuration for AI requests
export interface AIServiceConfig {
  provider: AIProvider;
  apiKey?: string; // If not provided, will use the one from environment variables
  temperature?: number;
  maxTokens?: number;
  isAdminRequest?: boolean; // Whether this request is from an admin area (allows using all providers)
}

// Response from AI models
export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Base interface for all AI tasks
export interface AITask {
  execute(input: string, config?: AIServiceConfig): Promise<AIResponse>;
}

/**
 * Determines the appropriate AI provider based on whether the request is from an admin area
 * Admin requests can use either provider (as specified), while public requests only use OpenAI
 */
export function getAIProvider(config: AIServiceConfig): 'anthropic' | 'openai' {
  // If this is an admin request, honor the requested provider
  if (config.isAdminRequest) {
    return config.provider;
  }
  
  // For public-facing features, always use OpenAI
  return 'openai';
}

/**
 * Factory function to create AI service instances based on the selected provider
 * @param defaultProvider Default AI provider to use
 * @returns An AIService instance
 */
export function createAIService(defaultProvider: AIProvider = 'anthropic') {
  // Default configuration
  const defaultConfig: AIServiceConfig = {
    provider: defaultProvider,
    temperature: 0.7,
    maxTokens: 1000,
  };

  /**
   * Execute a text generation request to the selected AI provider
   * @param prompt The text prompt to send to the AI
   * @param config Optional configuration overrides
   * @returns Promise resolving to the AI's response
   */
  async function generateText(
    prompt: string, 
    config?: Partial<AIServiceConfig>
  ): Promise<AIResponse> {
    // Merge default config with any overrides
    const finalConfig = { ...defaultConfig, ...config };
    
    try {
      // Determine the actual provider to use based on admin status
      const provider = getAIProvider(finalConfig);
      
      // Route to the appropriate provider implementation
      if (provider === 'anthropic') {
        return await callAnthropic(prompt, finalConfig);
      } else if (provider === 'openai') {
        return await callOpenAI(prompt, finalConfig);
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Implementation for Anthropic Claude API
   */
  async function callAnthropic(
    prompt: string,
    config: AIServiceConfig
  ): Promise<AIResponse> {
    // Get API key from config or environment variables
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not provided');
    }

    try {
      // Call Anthropic Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        success: true,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Implementation for OpenAI API
   */
  async function callOpenAI(
    prompt: string,
    config: AIServiceConfig
  ): Promise<AIResponse> {
    // Get API key from config or environment variables
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    try {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        success: true,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Return the public API of the service
  return {
    generateText,
    // We can add more specific AI tasks here later
  };
}

// Export a singleton instance with default settings
export const aiService = createAIService();
