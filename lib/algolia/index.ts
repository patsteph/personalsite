/**
 * Debuggable Algolia search implementation
 */
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
const ALGOLIA_API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

// Constants for debugging
const DEBUG = true;

/**
 * Search the Algolia index with the given query and parameters
 */
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    // Enhanced logging of search parameters
    if (DEBUG) {
      console.log('------------------------------');
      console.log(`🔍 ALGOLIA SEARCH REQUEST`);
      console.log(`Index: ${indexName}`);
      console.log(`Query: "${query}"`);
      console.log('Parameters:', JSON.stringify(params, null, 2));
      console.log('------------------------------');
    }
    
    // Build request body for Algolia
    const requestBody: any = {};
    
    // Standard parameters
    requestBody.query = query;
    if (params.hitsPerPage) requestBody.hitsPerPage = params.hitsPerPage;
    if (params.page) requestBody.page = params.page;
    
    // Process filters
    if (params.filters && typeof params.filters === 'string' && params.filters.trim() !== '') {
      // Add the filter directly - we'll fix the format in the components
      requestBody.filters = params.filters;
      
      if (DEBUG) {
        console.log(`Filter applied: ${params.filters}`);
      }
    }

    
    // Make the API request
    const response = await fetch(`${ALGOLIA_API_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
      throw new Error(`Algolia API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (DEBUG) {
      console.log('------------------------------');
      console.log(`🔍 ALGOLIA SEARCH RESPONSE`);
      console.log(`Results found: ${result.hits?.length || 0}`);
      console.log(`Total hits: ${result.nbHits || 0}`);
      if (result.hits?.length === 0 && params.filters) {
        console.warn('⚠️ WARNING: Zero results with filter - possible filter format issue');
        console.warn(`Filter used: ${params.filters}`);
      }
      console.log('------------------------------');
    } else {
      console.log(`Algolia returned ${result.hits?.length || 0} results`);
    }
    
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
    console.log('------------------------------');
  }
}

// Convenience functions for specific indices with correct index names
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('algoSearch', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('personal-website_blog-posts', query, params)
};