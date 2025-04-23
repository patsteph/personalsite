import type { NextApiRequest, NextApiResponse } from 'next';
import { Book } from '@/types/book';
import { BookRecommendationInput, createBookRecommender } from '@/lib/ai/book-recommender';
import { AIServiceConfig } from '@/lib/ai/ai-service';
import { getAdminFirestore } from '@/lib/firebase-admin';

type BookRecommendationResponse = {
  success: boolean;
  recommendations?: any[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookRecommendationResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    // Get request parameters
    const {
      preferences,
      temperature
    }: {
      preferences: BookRecommendationInput;
      temperature?: number;
    } = req.body;

    // Validate required parameters
    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: preferences'
      });
    }

    // Fetch all books from Firestore
    const books = await fetchAllBooks();
    
    if (!books || books.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch books from database'
      });
    }

    // Configure AI service as a public-facing endpoint
    const config: Partial<AIServiceConfig> = {
      provider: 'openai', // Default provider
      isAdminRequest: false // Public endpoint - will always use OpenAI regardless of requested provider
    };
    if (temperature !== undefined) config.temperature = temperature;

    // Create book recommender with all books
    const recommender = createBookRecommender(books, config);

    // Generate recommendations based on preferences
    const result = await recommender.execute('', preferences);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error generating recommendations'
      });
    }

    // Parse the recommendations from the AI service response
    const recommendations = JSON.parse(result.content);

    // Return the recommendations
    return res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Book Recommendation API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Fetch all books from Firestore
 */
async function fetchAllBooks(): Promise<Book[]> {
  try {
    // Initialize Firestore
    const db = getAdminFirestore();
    if (!db) {
      throw new Error('Failed to initialize Firestore');
    }

    // Query the books collection
    const snapshot = await db.collection('books').get();
    
    // Process and return the books
    const books: Book[] = [];
    snapshot.forEach(doc => {
      try {
        // Using our local serializeBook helper
        const book = serializeBookDocument(doc);
        books.push(book);
      } catch (err) {
        console.error(`Error processing book ${doc.id}:`, err);
      }
    });

    return books;
  } catch (error) {
    console.error('Error fetching books from Firestore:', error);
    throw error;
  }
}

/**
 * Serialize a Firestore document to a Book type
 */
function serializeBookDocument(doc: any): Book {
  const data = doc.data();
  
  // Convert Firestore Timestamps to ISO strings
  const dateAdded = data.dateAdded?.toDate ? data.dateAdded.toDate().toISOString() : null;
  const lastUpdated = data.lastUpdated?.toDate ? data.lastUpdated.toDate().toISOString() : null;
  
  return {
    id: doc.id,
    title: data.title || '',
    authors: data.authors || [],
    status: data.status || 'to-read',
    dateAdded,
    lastUpdated,
    isbn: data.isbn || undefined,
    publishedDate: data.publishedDate || undefined,
    description: data.description || undefined,
    categories: data.categories || undefined,
    pageCount: data.pageCount || undefined,
    genres: data.genres || data.categories || undefined,
    averageRating: data.averageRating || undefined,
    ratingsCount: data.ratingsCount || undefined,
    userRating: data.userRating || null,
    imageLinks: data.imageLinks || undefined,
    notes: data.notes || undefined,
    publisher: data.publisher || undefined,
  };
}
