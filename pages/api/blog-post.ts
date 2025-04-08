import type { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
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
      const { postId, reaction, previousReaction, action } = req.body;

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
          
          // Increment global site stats - this is what the admin dashboard reads
          const statsRef = firestore.collection('site-stats').doc('global');
          const statsSnapshot = await statsRef.get();
          
          if (statsSnapshot.exists) {
            await statsRef.update({
              'visits': admin.firestore.FieldValue.increment(1),
              'lastVisit': admin.firestore.FieldValue.serverTimestamp(),
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Updated existing site-stats/global document');
          } else {
            // Create stats document if it doesn't exist
            await statsRef.set({
              'visits': 1,
              'blogVisits': 0,
              'bookVisits': 0,
              'contactVisits': 0,
              'feedbackCount': 0,
              'lastVisit': admin.firestore.FieldValue.serverTimestamp(),
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
              'reactions': {
                'thumbsUp': 0,
                'celebrate': 0,
                'insightful': 0,
                'meh': 0,
                'total': 0
              }
            });
            console.log('Created new site-stats/global document');
          }
          
          return res.status(200).json({ 
            success: true, 
            message: 'Global site visit recorded successfully' 
          });
        }
        
        // For regular blog post visits
        try {
          // Reference to the blog post document
          const docRef = firestore.collection('blog-posts').doc(postId);
          const docSnapshot = await docRef.get();
          
          // Check if post exists
          if (!docSnapshot.exists) {
            return res.status(404).json({
              success: false,
              error: `No blog post found with ID ${postId}`
            });
          }
          
          // Update visit count
          await docRef.update({
            'visits': admin.firestore.FieldValue.increment(1)
          });
          
          // Also increment global site stats
          const statsRef = firestore.collection('site-stats').doc('global');
          const statsSnapshot = await statsRef.get();
          
          if (statsSnapshot.exists) {
            await statsRef.update({
              'blogVisits': admin.firestore.FieldValue.increment(1),
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Create stats document if it doesn't exist
            await statsRef.set({
              'visits': 1,
              'blogVisits': 1,
              'bookVisits': 0,
              'contactVisits': 0,
              'feedbackCount': 0,
              'lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
              'reactions': {
                'thumbsUp': 0,
                'celebrate': 0,
                'insightful': 0,
                'meh': 0,
                'total': 0
              }
            });
          }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Visit recorded successfully' 
        });
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

      // Reference to the blog post document
      const docRef = firestore.collection('blog-posts').doc(postId);
      const docSnapshot = await docRef.get();
      
      // Check if post exists
      if (!docSnapshot.exists) {
        return res.status(404).json({
          success: false,
          error: `No blog post found with ID ${postId}`
        });
      }

      // If there was a previous reaction, decrement it
      if (previousReaction && validReactions.includes(previousReaction as ReactionType)) {
        await docRef.update({
          [`reactions.${previousReaction}`]: admin.firestore.FieldValue.increment(-1)
        });
      }

      // Update the reaction count using atomic increment
      await docRef.update({
        [`reactions.${reaction}`]: admin.firestore.FieldValue.increment(1),
        'reactionCount': admin.firestore.FieldValue.increment(previousReaction ? 0 : 1) // Only increment total count if it's a new reaction
      });
      
      // Update the global site stats for reactions
      try {
        const statsRef = firestore.collection('site-stats').doc('global');
        const statsSnapshot = await statsRef.get();
        
        const reactionMapping = {
          'thumbsUp': 'thumbsUp',
          'celebrate': 'celebrate',
          'brain': 'insightful',
          'meh': 'meh'
        };
        
        const mappedReaction = reactionMapping[reaction as keyof typeof reactionMapping] || reaction;
        const mappedPrevious = previousReaction ? 
          reactionMapping[previousReaction as keyof typeof reactionMapping] || previousReaction : 
          null;
        
        if (statsSnapshot.exists) {
          // If there was a previous reaction, decrement it
          if (mappedPrevious) {
            await statsRef.update({
              [`reactions.${mappedPrevious}`]: admin.firestore.FieldValue.increment(-1),
              'reactions.total': admin.firestore.FieldValue.increment(0) // total stays the same when changing reactions
            });
          }
          
          // Increment the new reaction
          await statsRef.update({
            [`reactions.${mappedReaction}`]: admin.firestore.FieldValue.increment(1),
            'reactions.total': admin.firestore.FieldValue.increment(previousReaction ? 0 : 1), // Only increment total if it's a new reaction
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Create stats document if it doesn't exist with default values
          const reactions: Record<string, number> = {
            'thumbsUp': 0,
            'celebrate': 0,
            'insightful': 0,
            'meh': 0,
            'total': 1
          };
          reactions[mappedReaction] = 1;
          
          await statsRef.set({
            'visits': 0,
            'blogVisits': 0,
            'bookVisits': 0,
            'contactVisits': 0,
            'feedbackCount': 0,
            'lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            'reactions': reactions
          });
        }
      } catch (statsError) {
        console.error('Error updating global reaction stats:', statsError);
        // Continue anyway - don't fail the main reaction update if the stats update fails
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Reaction recorded successfully' 
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
    const { id, slug } = req.query;
    
    try {
      const postsCollection = firestore.collection('blog-posts');
      
      // Get by ID is more reliable if it's provided
      if (id && typeof id === 'string') {
        console.log(`Blog Post API: Fetching post with ID "${id}"`);
        const docRef = postsCollection.doc(id);
        const docSnapshot = await docRef.get();
        
        if (!docSnapshot.exists) {
          return res.status(404).json({
            success: false,
            error: `No blog post found with ID ${id}`
          });
        }
        
        const postData = docSnapshot.data() || {};
        const blogPost: BlogPostData = {
          id: docSnapshot.id,
          title: typeof postData?.title === 'string' ? postData.title : 'Untitled Post',
          slug: typeof postData?.slug === 'string' ? postData.slug : docSnapshot.id,
          ...postData
        };
        
        return res.status(200).json({
          success: true,
          data: blogPost
        });
      }
      
      // If ID is not provided, try by slug
      if (slug && typeof slug === 'string') {
        console.log(`Blog Post API: Fetching post with slug "${slug}"`);
        
        // Try exact slug match first
        let snapshot = await postsCollection.where('slug', '==', slug).get();
        
        // Try known alternative slugs if no exact match
        if (snapshot.empty) {
          console.log(`Blog Post API: No exact match for slug "${slug}", trying alternatives`);
          
          const alternativeSlugs = [
            'building-my-personal-site-a-journey-from-not-a-programmer-to-web-developer-sort-of-',
            'this-site'
          ];
          
          for (const altSlug of alternativeSlugs) {
            if (altSlug === slug) continue;
            
            console.log(`Blog Post API: Trying alternative slug "${altSlug}"`);
            snapshot = await postsCollection.where('slug', '==', altSlug).get();
            
            if (!snapshot.empty) {
              console.log(`Blog Post API: Found post with alternative slug "${altSlug}"`);
              break;
            }
          }
        }
        
        // If we still have no match, get all posts and try to find the closest match
        if (snapshot.empty) {
          console.log(`Blog Post API: No post found for known slugs, trying to find closest match`);
          
          snapshot = await postsCollection.get();
          
          // Log all available slugs for debugging
          if (!snapshot.empty) {
            console.log('Blog Post API: Available slugs:');
            snapshot.forEach(doc => {
              console.log(`  ${doc.id}: ${doc.data().slug}`);
            });
            
            // Try to find a closest match
            const allDocs = snapshot.docs;
            const closestMatch = allDocs.find(doc => {
              const postSlug = doc.data().slug || '';
              return postSlug.includes(slug) || slug.includes(postSlug);
            });
            
            if (closestMatch) {
              console.log(`Blog Post API: Found closest match with slug "${closestMatch.data().slug}"`);
              
              const matchData = closestMatch.data() || {};
              const blogPost: BlogPostData = {
                id: closestMatch.id,
                title: typeof matchData?.title === 'string' ? matchData.title : 'Untitled Post',
                slug: typeof matchData?.slug === 'string' ? matchData.slug : closestMatch.id,
                _matchType: 'similar',
                ...matchData
              };
              
              return res.status(200).json({
                success: true,
                data: blogPost
              });
            }
          }
        }
        
        // If no post found after all attempts
        if (snapshot.empty) {
          return res.status(404).json({
            success: false,
            error: `No blog post found with slug "${slug}" after trying all alternatives`
          });
        }
        
        // Return the first document if multiple matches
        const doc = snapshot.docs[0];
        const docData = doc.data() || {};
        const blogPost: BlogPostData = {
          id: doc.id,
          title: typeof docData?.title === 'string' ? docData.title : 'Untitled Post',
          slug: typeof docData?.slug === 'string' ? docData.slug : doc.id,
          ...docData
        };
        
        return res.status(200).json({
          success: true,
          data: blogPost
        });
      }
      
      // If neither ID nor slug provided
      return res.status(400).json({
        success: false,
        error: 'You must provide either an ID or a slug parameter'
      });
    } catch (error) {
      console.error('Blog Post API error:', error);
      return res.status(500).json({
        success: false,
        error: `Error fetching blog post: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }
  
  // Handle unsupported HTTP methods
  return res.status(405).json({
    success: false,
    error: `Method ${req.method} not allowed`
  });
}