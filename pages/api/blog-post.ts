import type { NextApiRequest, NextApiResponse } from 'next';
import { ReactionType } from '@/types/blog';
import { collection, doc, getDoc, getFirestore, increment, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

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

      // Get a reference to the Firestore database
      const firestore = getFirestore();
      
      try {
        // Transaction to update both the individual blog post and the global stats
        await runTransaction(firestore, async (transaction) => {
          // Reference to the blog post document
          const postDocRef = doc(firestore, 'blogPosts', postId);
          
          // Reference to the global stats document where we keep aggregate counts
          const statsDocRef = doc(firestore, 'stats', 'blogStats');
          
          // Get the current state of the blog post
          const postDoc = await transaction.get(postDocRef);
          if (!postDoc.exists()) {
            throw new Error(`Blog post with ID ${postId} not found`);
          }
          
          // Get current reactions or initialize if not present
          const postData = postDoc.data();
          const currentReactions = postData.reactions || {};
          
          // Update the specific reaction count for this post
          if (action === 'increment') {
            transaction.update(postDocRef, {
              [`reactions.${reaction}`]: (currentReactions[reaction] || 0) + 1
            });
            
            // Also update the global stats
            transaction.update(statsDocRef, {
              [`reactions.${reaction}`]: increment(1),
              totalReactions: increment(1)
            });
          } else if (action === 'decrement' && currentReactions[reaction] > 0) {
            transaction.update(postDocRef, {
              [`reactions.${reaction}`]: currentReactions[reaction] - 1
            });
            
            // Also update the global stats
            transaction.update(statsDocRef, {
              [`reactions.${reaction}`]: increment(-1),
              totalReactions: increment(-1)
            });
          }
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Reaction recorded successfully'
        });
      } catch (error) {
        const transactionError = error as Error;
        console.error('Error updating blog reaction:', transactionError);
        
        // Check if the stats document doesn't exist yet and needs to be created
        if (transactionError.message && transactionError.message.includes('No document to update')) {
          try {
            // Create the stats document with initial values
            const statsDocRef = doc(firestore, 'stats', 'blogStats');
            await updateDoc(statsDocRef, {
              [`reactions.${reaction}`]: 1,
              totalReactions: 1
            });
            
            // Also update the individual post
            const postDocRef = doc(firestore, 'blogPosts', postId);
            await updateDoc(postDocRef, {
              [`reactions.${reaction}`]: 1
            });
            
            return res.status(200).json({ 
              success: true, 
              message: 'Reaction recorded successfully (initial)'
            });
          } catch (initError) {
            console.error('Error creating initial stats document:', initError);
            return res.status(500).json({
              success: false,
              error: 'Failed to create initial reaction stats'
            });
          }
        }
        
        return res.status(500).json({
          success: false,
          error: 'Failed to record reaction'
        });
      }
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