import type { NextApiRequest, NextApiResponse } from 'next';
// Removed Firestore import. Use server-side API or stubbed logic.
// Removed firebase-admin import. Use server-side API or stubbed logic.
import { ReactionType } from '@/types/blog';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content?: string;
  summary?: string;
  date?: string;
  publishedAt?: Date;
  updatedAt?: Date;
  published?: boolean;
  reactions?: Record<string, number>;
  tags?: string[];
  _matchType?: string;
  [key: string]: unknown; // For any other fields from Firestore
}

type PostResponse = {
  success: boolean;
  data?: BlogPostData;
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse>
) {
  // Log request for debugging
  console.log('Blog Post API received', req.method, 'request', 
    req.query ? `with query: ${JSON.stringify(req.query)}` : '');
  
  // Handle reactions (POST method)
  if (req.method === 'POST') {
    try {
      const { postId, reaction, action } = req.body;

      // Track visits
      if (action === 'visit') {
        if (!postId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required field: postId is required for visit tracking' 
          });
        }
        
        // Special handling for site-global visits
        if (postId === 'site-global') {
          console.log('Recording global site visit');
          // TODO: Replace with server-side API call to increment global site stats
          // Placeholder: Simulate incrementing global site visits
          return res.status(200).json({ 
            success: true, 
            message: 'Global site visit recorded successfully (stub)'
          });
        }
        
        // For regular blog post visits
        try {
          // Reference to the blog post document
          // TODO: Replace with server-side API call to increment blog post visits
          // Placeholder: Simulate successful visit tracking
          return res.status(200).json({ 
            success: true, 
            message: 'Visit recorded successfully (stub)' 
          });
        } catch (visitError) {
          console.error('Error recording visit:', visitError);
          return res.status(500).json({
            success: false,
            error: `Error recording visit: ${visitError instanceof Error ? visitError.message : 'Unknown error'}`
          });
        }
      }
      
      // Regular reaction handling
      if (!postId || !reaction) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: postId and reaction are required' 
        });
      }

      // Validate that reaction is a valid type
      const validReactions: ReactionType[] = ['thumbsUp', 'celebrate', 'brain', 'meh'];
      if (!validReactions.includes(reaction)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid reaction type. Must be one of: ${validReactions.join(', ')}` 
        });
      }

      // TODO: Replace with server-side API call to record reaction
      // Placeholder: Simulate successful reaction recording
      return res.status(200).json({ 
        success: true, 
        message: 'Reaction recorded successfully (stub)'
      });
    } catch (error) {
      console.error('Error processing blog post reaction:', error);
      return res.status(500).json({
        success: false,
        error: `Error processing reaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Handle GET requests for fetching blog posts
  if (req.method === 'GET') {
    const { id} = req.query;
    
    // TODO: Replace with server-side API call to fetch blog post(s)
    // Placeholder: Simulate fetching blog post by ID or slug
    if (id && typeof id === 'string') {
      // Simulate found post
      const blogPost: BlogPostData = {
        id,
        title: 'Stubbed Post',
        slug: id,
        content: 'This is a stubbed blog post content.'
      };
      return res.status(200).json({
        success: true,
        data: blogPost
      });
    }
  }
  
  // Handle unsupported HTTP methods
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`
  });
}