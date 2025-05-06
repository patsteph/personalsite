/**
 * Simple, reliable Algolia search implementation
 * This version avoids complex parameter handling
 */

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'BIG74MXLH5';
const ALGOLIA_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '7a9ce8a20d3d485a2f7d0979acd0a6a1';
const ALGOLIA_API_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes`;

/**
 * Search the Algolia index with the given query and parameters
 */
export async function searchIndex(indexName: string, query: string = '', params: any = {}) {
  try {
    console.log(`Searching Algolia index '${indexName}' with query: '${query}' and params:`, params);
    
    // Create a simple object with all search parameters
    let paramString = `query=${encodeURIComponent(query)}`;
    
    // Add page and hits per page if provided
    if (params.hitsPerPage) {
      paramString += `&hitsPerPage=${params.hitsPerPage}`;
    }
    
    if (params.page) {
      paramString += `&page=${params.page}`;
    }
    
    // Handle filters - we replace the filter syntax with one known to work
    if (params.filters && params.filters.trim() !== '') {
      let filters = params.filters;
      
      // Simple direct replacement of common filter patterns
      if (filters.includes('status =')) {
        // Extract the status value and format it directly
        const match = filters.match(/status = "([^"]+)"/i);
        if (match && match[1]) {
          filters = `status:${match[1]}`;
        }
      } else if (filters.includes('category =')) {
        // Extract the category value and format it directly
        const match = filters.match(/category = "([^"]+)"/i);
        if (match && match[1]) {
          filters = `category:${match[1]}`;
        }
      } else if (filters.includes('rating =')) {
        // Extract the rating value and format it directly
        const match = filters.match(/rating = (\d+)/i);
        if (match && match[1]) {
          filters = `rating:${match[1]}`;
        }
      }
      
      paramString += `&filters=${encodeURIComponent(filters)}`;
    }
    
    // Make the API request
    const response = await fetch(`${ALGOLIA_API_URL}/${indexName}/query`, {
      method: 'POST',
      headers: {
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        params: paramString
      })
    });
    
    if (!response.ok) {
      console.error(`Algolia API error: ${response.status} ${response.statusText}`);
      throw new Error(`Algolia API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Algolia returned ${result.hits?.length || 0} results`);
    return result;
  } catch (error) {
    console.error('Algolia search error:', error);
    // Return empty results instead of crashing
    return { hits: [], nbHits: 0 };
  }
}

// Convenience functions for specific indices with correct index names
export const booksIndex = {
  search: (query: string, params: any = {}) => searchIndex('algoSearch', query, params)
};

export const blogIndex = {
  search: (query: string, params: any = {}) => searchIndex('personal-website_blog-posts', query, params)
};