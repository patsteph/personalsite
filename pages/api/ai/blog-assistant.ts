import type { NextApiRequest, NextApiResponse } from 'next';
import { validateFirebaseIdToken } from '@/lib/api/server-auth';
import { AssistanceTask, createWritingAssistant } from '@/lib/ai/blog-assistant';
import { AIServiceConfig } from '@/lib/ai/ai-service';

type BlogAssistantResponse = {
  success: boolean;
  content?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BlogAssistantResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Verify user authentication (only allow admin users)
    const uid = await validateFirebaseIdToken(req);
    if (!uid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }

    // Get request parameters
    const { 
      task,      // Type of assistance task
      content,   // Blog content to process
      options,   // Additional options specific to the task
      provider,  // AI provider to use (optional)
      temperature // Model temperature (optional)
    } = req.body;

    // Validate required parameters
    if (!task || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: task and content'
      });
    }

    // Configure AI service with admin privileges
    const config: Partial<AIServiceConfig> = {
      isAdminRequest: true // This is an admin endpoint, so allow all providers
    };
    
    if (provider) config.provider = provider;
    if (temperature !== undefined) config.temperature = temperature;

    // Get appropriate task handler
    const assistant = createWritingAssistant(task as AssistanceTask, config);

    // Process the content with the selected task
    const result = await assistant.execute(content, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error processing content'
      });
    }

    // Return the processed content
    return res.status(200).json({
      success: true,
      content: result.content
    });
  } catch (error) {
    console.error('Blog Assistant API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
