/**
 * Simplified Algolia client implementation with proper filter syntax
 */

// Constants for debugging
const DEBUG = true;

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
const ALGOLIA_API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

/**
 * Search the Algolia index using our custom implementation
 * with properly formatted filters and parameters
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
    const requestBody: any = {
      query: query,
      hitsPerPage: params.hitsPerPage || 50,
      page: params.page || 0,
    };
      // Process filters using facetFilters (more reliable than filters)
    if (params.filters && typeof params.filters === 'string' && params.filters.trim() !== '') {
      console.log(`Filter string: ${params.filters}`);
      
      // Since we've updated our components to use the direct facet filter format,
      // we can just split the filters and use them directly
      const filterParts = params.filters.split(' AND ');
      
      // The facet filters are already in the correct format from our components
      if (filterParts.length > 0) {
        requestBody.facetFilters = filterParts;
        console.log(`Using facetFilters: ${JSON.stringify(filterParts)}`);
      }
      
      // We've already added the facetFilters to the requestBody above
      if (DEBUG) {
        console.log(`Prepared Algolia request: ${JSON.stringify(requestBody, null, 2)}`);
      }
    }
    
    // Make the search request using fetch
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
        if (requestBody.facetFilters) {
          console.warn(`Translated to facetFilters: ${JSON.stringify(requestBody.facetFilters)}`);
        }
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