/**
 * Book Recommendation AI Module
 * 
 * Provides AI-powered book recommendations based on:
 * - User preferences (genres, authors, topics)
 * - Reading history
 * - Similar books analysis
 */

import { Book } from '@/types/book';
import { AIResponse, AIServiceConfig, AITask, aiService } from './ai-service';

export interface BookRecommendationInput {
  favoriteGenres?: string[];
  favoriteAuthors?: string[];
  interestTopics?: string[];
  recentlyRead?: Book[];
  likedBooks?: Book[];
  dislikedBooks?: Book[];
  targetAudience?: string;
  readingLevel?: string;
  similarToBook?: Book;
  specificMood?: string;
  maxResults?: number;
}

export interface RecommendationResult {
  book: Book;
  score: number;
  reasonShort: string;
  reasonDetailed: string;
}

/**
 * Book recommendation task implementation
 */
export class BookRecommender implements AITask {
  constructor(
    private allBooks: Book[],
    private config?: Partial<AIServiceConfig>
  ) {}
  
  /**
   * Build prompt for book recommendations based on user preferences
   */
  buildPrompt(input: string, options?: BookRecommendationInput): string {
    const parsedInput = options || JSON.parse(input) as BookRecommendationInput;
    
    // Create a context about the user's preferences
    let context = 'I need book recommendations based on the following information:';
    
    if (parsedInput.favoriteGenres && parsedInput.favoriteGenres.length > 0) {
      context += `\nFavorite Genres: ${parsedInput.favoriteGenres.join(', ')}`;
    }
    
    if (parsedInput.favoriteAuthors && parsedInput.favoriteAuthors.length > 0) {
      context += `\nFavorite Authors: ${parsedInput.favoriteAuthors.join(', ')}`;
    }
    
    if (parsedInput.interestTopics && parsedInput.interestTopics.length > 0) {
      context += `\nInterest Topics: ${parsedInput.interestTopics.join(', ')}`;
    }
    
    if (parsedInput.specificMood) {
      context += `\nLooking for books with this mood/theme: ${parsedInput.specificMood}`;
    }
    
    if (parsedInput.targetAudience) {
      context += `\nTarget Audience: ${parsedInput.targetAudience}`;
    }
    
    if (parsedInput.readingLevel) {
      context += `\nReading Level: ${parsedInput.readingLevel}`;
    }
    
    // Add information about books the user has read and liked/disliked
    if (parsedInput.recentlyRead && parsedInput.recentlyRead.length > 0) {
      context += '\n\nRecently Read Books:';
      parsedInput.recentlyRead.forEach(book => {
        context += `\n- "${book.title}" by ${book.authors.join(', ')}`;
      });
    }
    
    if (parsedInput.likedBooks && parsedInput.likedBooks.length > 0) {
      context += '\n\nBooks I Liked:';
      parsedInput.likedBooks.forEach(book => {
        context += `\n- "${book.title}" by ${book.authors.join(', ')}`;
      });
    }
    
    if (parsedInput.dislikedBooks && parsedInput.dislikedBooks.length > 0) {
      context += '\n\nBooks I Disliked:';
      parsedInput.dislikedBooks.forEach(book => {
        context += `\n- "${book.title}" by ${book.authors.join(', ')}`;
      });
    }
    
    if (parsedInput.similarToBook) {
      const book = parsedInput.similarToBook;
      context += `\n\nLooking for books similar to: "${book.title}" by ${book.authors.join(', ')}`;
      if (book.description) context += `\nBook description: ${book.description}`;
      if (book.genres) context += `\nGenres: ${book.genres.join(', ')}`;
      if (book.categories) context += `\nCategories: ${book.categories.join(', ')}`;
    }
    
    // Add the list of available books
    context += '\n\nHere are the available books to choose from:';
    
    this.allBooks.forEach((book, index) => {
      context += `\n\n${index + 1}. "${book.title}" by ${book.authors.join(', ')}`;
      if (book.description) context += `\nDescription: ${book.description.substring(0, 200)}${book.description.length > 200 ? '...' : ''}`;
      if (book.genres) context += `\nGenres: ${book.genres.join(', ')}`;
      if (book.categories) context += `\nCategories: ${book.categories.join(', ')}`;
      if (book.averageRating) context += `\nAverage Rating: ${book.averageRating}/5`;
    });
    
    // Final instructions for the AI
    const maxResults = parsedInput.maxResults || 5;
    const prompt = `
${context}

Based on the information above, please recommend the top ${maxResults} books from the available list that best match the preferences. For each recommendation, include:

1. The book number (1-${this.allBooks.length})
2. A score from 1-100 indicating match quality
3. A 1-2 sentence explanation for why this book was recommended
4. A more detailed paragraph explaining why this book is a good match

Format your response as a JSON array with objects like:
[
  {
    "bookNumber": 1,
    "score": 95,
    "reasonShort": "Perfect match for sci-fi fans who enjoy character-driven stories.",
    "reasonDetailed": "This book has complex characters and a fascinating alien culture, similar to 'Book X' that you enjoyed. The themes of exploration and cultural understanding align with your interest in anthropology."
  }
]

Only include books from the numbered list I provided. Do not make up or suggest books not in the list.
`.trim();

    return prompt;
  }
  
  /**
   * Generate book recommendations based on user preferences
   */
  async execute(
    input: string,
    config?: BookRecommendationInput | AIServiceConfig
  ): Promise<AIResponse> {
    // Determine if the input is a BookRecommendationInput or AIServiceConfig
    const options = (config && 'favoriteGenres' in config) ? config as BookRecommendationInput : undefined;
    const aiConfig = (config && 'provider' in config) ? config as AIServiceConfig : this.config;
    try {
      const prompt = this.buildPrompt(input, options);
      const aiResponse = await aiService.generateText(prompt, {
        ...aiConfig,
        temperature: 0.3, // Lower temperature for more consistent recommendations
      });
      
      if (!aiResponse.success) {
        return aiResponse;
      }
      
      // Process the AI response to extract recommendations
      const processedResponse = this.processRecommendations(aiResponse.content);
      
      return {
        ...aiResponse,
        content: processedResponse,
      };
    } catch (error) {
      console.error('Error generating book recommendations:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  
  /**
   * Process the AI response to extract and format recommendations
   */
  private processRecommendations(aiResponseContent: string): string {
    try {
      // Extract JSON from the AI response (sometimes AI adds text before/after JSON)
      const jsonMatch = aiResponseContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not extract valid JSON from the AI response');
      }
      
      const jsonStr = jsonMatch[0];
      const recommendations = JSON.parse(jsonStr);
      
      // Map the book numbers to actual Book objects
      const processedRecommendations = recommendations.map((rec: any) => {
        const bookIndex = rec.bookNumber - 1;
        if (bookIndex < 0 || bookIndex >= this.allBooks.length) {
          throw new Error(`Invalid book number: ${rec.bookNumber}`);
        }
        
        return {
          book: this.allBooks[bookIndex],
          score: rec.score,
          reasonShort: rec.reasonShort,
          reasonDetailed: rec.reasonDetailed,
        };
      });
      
      return JSON.stringify(processedRecommendations);
    } catch (error) {
      console.error('Error processing recommendations:', error);
      throw error;
    }
  }
}

/**
 * Create a book recommender instance with the provided books
 */
export function createBookRecommender(
  allBooks: Book[],
  config?: Partial<AIServiceConfig>
): BookRecommender {
  return new BookRecommender(allBooks, config);
}
