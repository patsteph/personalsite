/**
 * Simplified Algolia client implementation - BASIC version with minimal complexity
 */

// Always debug to help troubleshoot
const DEBUG = true;

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
const ALGOLIA_API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

/**
 * Algolia search implementation that properly handles your specific index structure
 * Based on your actual index data structure:
 * - objectID = random ID from Firebase
 * - title = book title
 * - categories = array of categories from Google API
 * - status = "read", "reading", "to-read", or "toRead"
 * - authors = array containing author name
 */
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    // Log search parameters for debugging
    console.log('------------------------------');
    console.log(`🔍 ALGOLIA SEARCH REQUEST`);
    console.log(`Index: ${indexName}`);
    console.log(`Query: "${query}"`);
    console.log('Parameters:', JSON.stringify(params, null, 2));
    
    // Build standard search parameters for Algolia
    const searchParams: any = {
      query,
      hitsPerPage: params.hitsPerPage || 50,
      page: params.page || 0
    };
    
    // Handle filters - converting from "status:to-read" format to Algolia's expected format
    if (params.filters && typeof params.filters === 'string' && params.filters.trim() !== '') {
      console.log(`Received filter string: "${params.filters}"`);
      
      // Special handling for the "to-read" status which might also be "toRead" in the index
      // This is the known issue based on the provided index structure
      if (params.filters.includes('status:to-read')) {
        // Handle both possible formats of "To Read" status with an OR condition
        searchParams.filters = '(status:to-read OR status:toRead)';
        console.log(`Modified status filter to handle multiple formats: ${searchParams.filters}`);
      } else {
        // For other filters, use as-is
        searchParams.filters = params.filters;
        console.log(`Using filter as provided: ${searchParams.filters}`);
      }
    }
    
    // Make the Algolia search request using fetch
    const response = await fetch(`${ALGOLIA_API_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
      throw new Error(`Algolia API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Always log the response for debugging
    console.log('------------------------------');
    console.log(`🔍 ALGOLIA SEARCH RESPONSE`);
    console.log(`Results found: ${result.hits?.length || 0}`);
    console.log(`Total hits: ${result.nbHits || 0}`);
    
    // Log the first book to examine its structure exactly as it appears in the Algolia index
    if (result.hits && result.hits.length > 0) {
      console.log('SAMPLE BOOK FROM RESULTS:');
      const sampleBook = result.hits[0];
      console.log(`- Title: ${sampleBook.title}`);
      console.log(`- Authors: ${JSON.stringify(sampleBook.authors)}`);
      console.log(`- Status: "${sampleBook.status}" (${typeof sampleBook.status})`);
      console.log(`- Categories: ${JSON.stringify(sampleBook.categories)}`);
      console.log(`- Object ID: ${sampleBook.objectID}`);
      
      // Show all keys in the book object to find anything we might have missed
      console.log('All book properties:', Object.keys(sampleBook).join(', '));
    }
    
    // Warning for zero results with filters
    if (result.hits?.length === 0 && params.filters) {
      console.warn('⚠️ WARNING: Zero results with filter');
      console.warn(`Filter used: ${params.filters}`);
      console.warn(`Try using one of these exact filter strings:`);
      console.warn(`- For Read books: status:read`);
      console.warn(`- For Currently Reading: status:reading`); 
      console.warn(`- For To Read: (status:to-read OR status:toRead)`);
    }
    
    console.log('------------------------------');
    
    return result;
  } catch (error) {
    console.error('Algolia search error:', error);
    // Return empty results instead of crashing
    return { hits: [], nbHits: 0 };
  }
}

// Helper to inspect a book object in the console
export function inspectBook(book: any) {
  if (DEBUG) {
    console.log('------------------------------');
    console.log('📚 BOOK INSPECTION');
    console.log(`Title: ${book.title}`);
    console.log(`Author: ${book.author}`);
    console.log(`Status: ${book.status}`);
    console.log(`Category: ${book.category || (book.categories && book.categories[0]) || 'None'}`);
    console.log(`Rating: ${book.rating || 0}`);
    console.log(`User Rating: ${book.userRating || 'None'}`);
    console.log('Full Object:', JSON.stringify(book, null, 2));
    console.log('------------------------------');
  }
}

// Helper to try different filter formats and find what works
export async function debugAlgoliaFilters(indexName: string) {
  console.log('🔎 DEBUGGING ALGOLIA FILTERS - TRYING DIFFERENT FORMATS...');
  
  // Get some books to examine
  const result = await searchIndex(indexName, '', { hitsPerPage: 5 });
  
  if (result.hits && result.hits.length > 0) {
    const sampleBook = result.hits[0];
    console.log('SAMPLE BOOK STRUCTURE:');
    console.log(JSON.stringify(sampleBook, null, 2));
    
    // Try to detect the actual attribute names and format
    console.log('\nDetected attributes that can be filtered:');
    Object.keys(sampleBook).forEach(key => {
      console.log(`- ${key}: ${typeof sampleBook[key]} = ${JSON.stringify(sampleBook[key])}`);
    });
    
    // Output actual status values found in the sample
    if (sampleBook.status) {
      console.log(`\nActual status value found: "${sampleBook.status}" (${typeof sampleBook.status})`);
    }
  } else {
    console.log('Could not get sample books to analyze');
  }
}

// Convenience functions for specific indices with correct index names
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('algoSearch', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('personal-website_blog-posts', query, params)
};